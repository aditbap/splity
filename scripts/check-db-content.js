
const { MongoClient, ObjectId } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

async function checkReceipt(id) {
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

        // Check specific receipt or latest
        let query = {};
        if (id) {
            query = { _id: new ObjectId(id) };
        }

        const receipt = await receipts.findOne(query, { sort: { createdAt: -1 } });

        if (receipt) {
            console.log("=== Receipt Found ===");
            console.log("ID:", receipt._id);
            console.log("Participants:", JSON.stringify(receipt.participants, null, 2));
            console.log("Assignments:", JSON.stringify(receipt.assignments, null, 2));
            console.log("ParsedData Keys:", Object.keys(receipt.parsedData || {}));
        } else {
            console.log("Receipt not found.");
        }

    } catch (error) {
        console.error("Error:", error);
    } finally {
        await client.close();
    }
}

// Run with the ID from previous logs: 698801d6fd9aefd02ae56178 (from user prompt/logs)
// Or just find latest
checkReceipt();
