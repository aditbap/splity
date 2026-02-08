
const { MongoClient, ObjectId } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

async function testPersistence() {
    const uri = process.env.MONGODB_URI;
    const client = new MongoClient(uri);

    try {
        await client.connect();
        const database = client.db('splitbill');
        const receipts = database.collection('receipts');

        // 1. Get latest receipt
        const latest = await receipts.findOne({}, { sort: { createdAt: -1 } });
        if (!latest) {
            console.error("No receipt found");
            return;
        }
        const id = latest._id;
        console.log("Testing with Receipt ID:", id);

        // 2. Simulate PATCH (saving participants)
        const mockParticipants = [
            { id: "p1", name: "Alice" },
            { id: "p2", name: "Bob" }
        ];
        const mockAssignments = [
            { itemId: "0", participantIds: ["p1"] }
        ];

        await receipts.updateOne(
            { _id: id },
            { $set: { participants: mockParticipants, assignments: mockAssignments } }
        );
        console.log("Updated receipt with mock data.");

        // 3. Fetch again (Simulate List API)
        const updated = await receipts.findOne({ _id: id });
        console.log("Fetched Updated Receipt:");
        console.log("Participants:", updated.participants);
        console.log("Assignments:", updated.assignments);

        if (updated.participants && updated.participants.length === 2) {
            console.log("SUCCESS: Participants persisted.");
        } else {
            console.error("FAILURE: Participants not found.");
        }

    } finally {
        await client.close();
    }
}

testPersistence().catch(console.error);
