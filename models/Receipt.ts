import mongoose, { Schema, Model, Document } from 'mongoose';

export interface ReceiptItem {
    name: string;
    price: number;
    quantity: number;
}

export interface ReceiptData {
    merchantName?: string;
    date?: Date;
    total?: number;
    tax?: number;
    serviceCharge?: number;
    discount?: number;
    items: ReceiptItem[];
}

export interface IReceipt extends Document {
    userId: string;
    imageUrl: string;
    ocrRawText?: string;
    parsedData?: ReceiptData;
    correctedData?: ReceiptData;
    participants?: { id: string; name: string }[];
    assignments?: { itemId: string; participantIds: string[] }[];
    createdAt: Date;
}

const ReceiptItemSchema = new Schema<ReceiptItem>({
    name: { type: String, required: true },
    price: { type: Number, required: true },
    quantity: { type: Number, default: 1 },
});

const ReceiptDataSchema = new Schema<ReceiptData>({
    merchantName: String,
    date: Date,
    total: Number,
    tax: Number,
    serviceCharge: Number,
    discount: Number,
    items: [ReceiptItemSchema],
});

const ReceiptSchema = new Schema<IReceipt>(
    {
        userId: { type: String, required: true, default: 'anonymous' }, // MVP: anonymous or simple ID
        imageUrl: { type: String, required: true },
        ocrRawText: String,
        parsedData: ReceiptDataSchema,
        correctedData: ReceiptDataSchema,
        // Split Data
        participants: [{
            id: String,
            name: String
        }],
        assignments: [{
            itemId: String,
            participantIds: [String]
        }]
    },
    { timestamps: true }
);

// Prevent overwrite on hot reload
// In development, we want to force access to the latest schema change
if (process.env.NODE_ENV === 'development' && mongoose.models.Receipt) {
    delete mongoose.models.Receipt;
}

const Receipt: Model<IReceipt> = mongoose.model<IReceipt>('Receipt', ReceiptSchema);

export default Receipt;
