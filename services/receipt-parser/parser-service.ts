import { ReceiptData, ReceiptItem } from '@/models/Receipt';

export interface ReceiptParserService {
    parse(rawText: string): Promise<ReceiptData>;
    parseImage?(imageBuffer: Buffer): Promise<ReceiptData>;
}

// End of Interface
