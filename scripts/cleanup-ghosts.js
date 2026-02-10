
const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');

// Load env vars
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
    console.error('Please define the MONGODB_URI environment variable inside .env.local');
    process.exit(1);
}

const ReceiptSchema = new mongoose.Schema({}, { strict: false });
const Receipt = mongoose.models.Receipt || mongoose.model('Receipt', ReceiptSchema);

async function cleanup() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to DB');

        // Delete receipts where parsedData.items has size 0 OR missing
        // Be aggressive: if items is empty, it's a ghost, regardless of merchant name
        // (Unless it's a very old legacy receipt, but manual entry ghosts are recent)
        const result = await Receipt.deleteMany({
            $or: [
                { "parsedData.items": { $size: 0 } },
                { "parsedData.items": { $exists: false } },
                { "parsedData.items": null }
            ]
        });

        console.log(`Deleted ${result.deletedCount} ghost receipts.`);

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
    }
}

cleanup();
