
import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Receipt from '@/models/Receipt';

export async function GET(req: Request) {
    try {
        await connectDB();
        const { searchParams } = new URL(req.url);
        const userId = searchParams.get('userId');

        const query = userId ? { userId } : {};

        const receipts = await Receipt.find(query)
            .sort({ createdAt: -1 })
            .limit(5)
            .lean();

        return NextResponse.json({ success: true, data: receipts });
    } catch (error) {
        console.error('Failed to fetch receipts:', error);
        return NextResponse.json({ error: 'Failed to fetch receipts' }, { status: 500 });
    }
}
