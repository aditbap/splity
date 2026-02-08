
const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

async function checkReceipts() {
    const uri = process.env.MONGODB_URI;
    const client = new MongoClient(uri);

    try {
        await client.connect();
        const database = client.db('splitbill');
        const receipts = database.collection('receipts');

        const recent = await receipts.find().sort({ createdAt: -1 }).limit(1).toArray();
        console.log(JSON.stringify(recent, null, 2));
    } finally {
        await client.close();
    }
}

checkReceipts().catch(console.error);
