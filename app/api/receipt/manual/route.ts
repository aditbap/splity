
import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Receipt from '@/models/Receipt';

export async function POST(req: NextRequest) {
    try {
        await connectDB();
        const body = await req.json();
        const { userId, parsedData } = body;

        const defaultData = {
            merchantName: "Manual Entry",
            date: new Date(),
            total: 0,
            tax: 0,
            serviceCharge: 0,
            discount: 0,
            items: []
        };

        const initialData = parsedData || defaultData;

        // Validation: Don't create if items are empty (ghost receipt prevention)
        if (!initialData.items || initialData.items.length === 0) {
            return NextResponse.json({ error: 'Cannot create receipt with no items' }, { status: 400 });
        }

        const newReceipt = await Receipt.create({
            userId: userId || 'anonymous_user',
            imageUrl: "manual_entry_placeholder",
            ocrRawText: "Manual Entry (No OCR)",
            parsedData: initialData,
            correctedData: initialData
        });

        return NextResponse.json({
            success: true,
            data: newReceipt,
            id: newReceipt._id
        });

    } catch (error) {
        console.error('Failed to create manual receipt:', error);
        return NextResponse.json({ error: 'Failed to create manual receipt' }, { status: 500 });
    }
}
