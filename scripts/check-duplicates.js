
const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
    console.error('Please define MONGODB_URI');
    process.exit(1);
}

const ReceiptSchema = new mongoose.Schema({
    userId: String,
    parsedData: Object,
    merchantName: String,
    date: Date,
    total: Number,
    createdAt: Date
}, { strict: false });

const Receipt = mongoose.models.Receipt || mongoose.model('Receipt', ReceiptSchema);

async function findDuplicates() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to DB');

        const receipts = await Receipt.find({}).sort({ createdAt: -1 }).limit(100);
        console.log(`Checking ${receipts.length} recent receipts for duplicates...`);

        const map = new Map();

        receipts.forEach(r => {
            // Key based on merchant, date, total, and item count
            const merchant = r.parsedData?.merchantName || r.merchantName || 'Unknown';
            const date = r.parsedData?.date ? new Date(r.parsedData.date).toISOString().split('T')[0] : 'No Date';
            const total = r.parsedData?.total || 0;
            const itemCount = r.parsedData?.items?.length || 0;

            const key = `${r.userId}|${merchant}|${total}|${itemCount}`;

            if (!map.has(key)) {
                map.set(key, []);
            }
            map.get(key).push(r);
        });

        let foundDupes = false;
        for (const [key, group] of map.entries()) {
            if (group.length > 1) {
                foundDupes = true;
                console.log(`\nPotential Duplicate Group (${group.length} items):`);
                console.log(`Key: ${key}`);
                group.forEach(r => {
                    console.log(`- ID: ${r._id} | Created: ${r.createdAt}`);
                });
            }
        }

        if (!foundDupes) console.log("No obvious duplicates found.");

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
    }
}

findDuplicates();
