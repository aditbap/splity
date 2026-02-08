
const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

async function resetDatabase() {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
        console.error("MONGODB_URI not set");
        return;
    }
    const client = new MongoClient(uri);

    try {
        await client.connect();
        const database = client.db('splitbill');
        const receipts = database.collection('receipts');

        // Delete all documents
        const result = await receipts.deleteMany({});
        console.log(`Deleted ${result.deletedCount} receipts. Database is now clean.`);
    } catch (error) {
        console.error("Error resetting database:", error);
    } finally {
        await client.close();
    }
}

resetDatabase().catch(console.error);
