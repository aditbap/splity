
const fetch = require('node-fetch');

async function verifyReceipt(id) {
    try {
        const response = await fetch(`http://localhost:3000/api/receipt/${id}`);
        const data = await response.json();
        console.log("Status:", response.status);
        if (data.success) {
            console.log("Parsed Data Date:", data.data.parsedData?.date);
            console.log("Participants:", JSON.stringify(data.data.participants, null, 2));
            console.log("Assignments:", JSON.stringify(data.data.assignments, null, 2));
            console.log("Corrected Data:", JSON.stringify(data.data.correctedData, null, 2));
        } else {
            console.error("Error:", data.error);
        }
    } catch (error) {
        console.error("Fetch error:", error);
    }
}

// User mentioned receipt ID: 698801d6fd9aefd02ae56178 (from previous log)
// Or we can list first to get an ID
async function listAndVerify() {
    try {
        const listResponse = await fetch('http://localhost:3000/api/receipt/list');
        const listData = await listResponse.json();

        if (listData.success && listData.data.length > 0) {
            const id = listData.data[0]._id;
            console.log("Testing with latest receipt ID:", id);
            await verifyReceipt(id);
        } else {
            console.log("No receipts found to test.");
        }
    } catch (error) {
        console.error("List error:", error);
    }
}

listAndVerify();
