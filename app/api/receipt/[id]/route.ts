
import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Receipt from '@/models/Receipt';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await connectDB();
        const { id } = await params;

        if (!id) {
            return NextResponse.json({ error: 'Receipt ID is required' }, { status: 400 });
        }

        const receipt = await Receipt.findById(id).lean();

        if (!receipt) {
            return NextResponse.json({ error: 'Receipt not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true, data: receipt });
    } catch (error) {
        console.error('Failed to fetch receipt:', error);
        return NextResponse.json({ error: 'Failed to fetch receipt' }, { status: 500 });
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await connectDB();
        const { id } = await params;

        if (!id) {
            return NextResponse.json({ error: 'Receipt ID is required' }, { status: 400 });
        }

        const deletedReceipt = await Receipt.findByIdAndDelete(id);

        if (!deletedReceipt) {
            return NextResponse.json({ error: 'Receipt not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true, message: 'Receipt deleted successfully' });
    } catch (error) {
        console.error('Failed to delete receipt:', error);
        return NextResponse.json({ error: 'Failed to delete receipt' }, { status: 500 });
    }
}

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await connectDB();
        const { id } = await params;
        const body = await request.json();
        console.log(`[PATCH] Receipt ${id} update:`, Object.keys(body));

        if (!id) {
            return NextResponse.json({ error: 'Receipt ID is required' }, { status: 400 });
        }

        const { participants, assignments, parsedData } = body;

        const updateData: any = {};

        // Only update fields that are actually present in the request
        if (participants !== undefined) updateData.participants = participants;
        if (assignments !== undefined) updateData.assignments = assignments;

        if (parsedData) {
            updateData.parsedData = parsedData;
            // Also update correctedData as the "latest version" implies correction
            updateData.correctedData = parsedData;
        }

        const updatedReceipt = await Receipt.findByIdAndUpdate(
            id,
            updateData,
            { new: true }
        );

        if (!updatedReceipt) {
            return NextResponse.json({ error: 'Receipt not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true, data: updatedReceipt });
    } catch (error) {
        console.error('Failed to update receipt:', error);
        return NextResponse.json({ error: 'Failed to update receipt' }, { status: 500 });
    }
}
