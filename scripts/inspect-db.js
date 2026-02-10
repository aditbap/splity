
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

const ReceiptSchema = new mongoose.Schema({
    userId: String,
    merchantName: String,
    createdAt: Date,
    // ... strict: false to allow other fields
}, { strict: false });

const Receipt = mongoose.models.Receipt || mongoose.model('Receipt', ReceiptSchema);

async function inspect() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to DB');

        const query = { userId: "f6114b6a-db29-41a1-b424-b851337aa7de" };
        const total = await Receipt.countDocuments(query);
        const receipts = await Receipt.find(query).sort({ createdAt: -1 }).limit(20);

        console.log(`Found ${total} receipts for user f6114...:`);
        receipts.forEach(r => {
            console.log(`- ID: ${r._id}`);
            console.log(`  Merchant: ${r.parsedData?.merchantName}`);
            console.log(`  Items: ${r.parsedData?.items?.length || 0}`);
            console.log('---');
        });

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
    }
}

inspect();
