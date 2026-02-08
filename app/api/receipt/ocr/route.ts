import { NextRequest, NextResponse } from 'next/server';
import { GeminiParserService } from '@/services/receipt-parser/gemini-parser';
import Receipt from '@/models/Receipt';
import connectDB from '@/lib/db';

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const file = formData.get('file') as Blob;
        const userId = formData.get('userId') as string || 'anonymous_user';

        if (!file) {
            return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
        }

        // Convert to buffer
        const buffer = Buffer.from(await file.arrayBuffer());

        // 1. Check if Parser supports Direct Image Parsing (Faster!)
        // const parser = new RegexReceiptParser(); 
        const parser = new GeminiParserService();

        let parsedData;
        let finalRawText = "";

        if (parser.parseImage) {
            console.log("Using Direct Image Parsing (Gemini Multimodal)...");
            parsedData = await parser.parseImage(buffer);
            finalRawText = "Direct Image Parsing (No Raw OCR Text available)";
        } else {
            return NextResponse.json({ error: 'Parser configuration error: Direct Image Parsing not supported' }, { status: 500 });
        }

        // 3. Save to DB
        try {
            await connectDB();
            const newReceipt = await Receipt.create({
                userId: userId, // Use provided userId or default
                imageUrl: 'placeholder_url', // MVP: Image storage requires S3/Blob. Skipping for now.
                ocrRawText: finalRawText,
                parsedData: parsedData,
                correctedData: parsedData // Initial corrected is same as parsed
            });
            console.log("Receipt saved to DB:", newReceipt._id);

            // Return result with ID
            return NextResponse.json({
                success: true,
                id: newReceipt._id,
                rawText: finalRawText,
                data: parsedData
            });
        } catch (dbError) {
            console.error("Failed to save to DB:", dbError);
            // Return success anyway, just without persistence
            return NextResponse.json({
                success: true,
                rawText: finalRawText,
                data: parsedData,
                warning: "Failed to save history"
            });
        }

    } catch (error) {
        console.error('OCR Error:', error);
        return NextResponse.json({ error: 'Failed to process receipt' }, { status: 500 });
    }
}
