
const { spawn } = require('child_process');

async function run() {
    const baseUrl = 'http://localhost:3000';
    const userId = 'test_user_' + Date.now();

    console.log('1. Creating Manual Receipt...');
    const createRes = await fetch(`${baseUrl}/app/api/receipt/manual`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
    });

    // Note: Next.js API might need full path if running externally, but here we assume internal API route relative path won't work with fetch unless we use full URL.
    // Actually, I'll use a relative path if I was in browser, but here in node script I need localhost.
    // Wait, I might get 404 if the port is wrong. I'll assume 3000.

    // Let's actually verify the endpoint exists first.
    // Using a simpler approach: direct DB Manipulation if possible? No, we need to test the API.

    // Actually, let's just write a script that runs via `node` and uses `mongoose` directly to see if it persists, 
    // OR better, use curl commands in a shell script. 
    // But a node script is cleaner.
}
// Retrying with valid fetch structure
const fetch = require('node-fetch'); // Might not be available. I should use standard https or dynamic import.
// Actually, `fetch` is available in Node 18+.

(async () => {
    const BASE_URL = 'http://localhost:3000';
    const TEST_USER = 'debug_user_123';

    try {
        // 1. Create
        console.log("Creating receipt...");
        const createRes = await fetch(`${BASE_URL}/api/receipt/manual`, {
            method: 'POST',
            body: JSON.stringify({ userId: TEST_USER }),
            headers: { 'Content-Type': 'application/json' }
        });
        const createData = await createRes.json();
        if (!createData.success) throw new Error("Create failed: " + JSON.stringify(createData));
        const id = createData.id;
        console.log("Created ID:", id);

        // 2. List (Confirm it exists)
        console.log("Listing receipts...");
        const listRes1 = await fetch(`${BASE_URL}/api/receipt/list?userId=${TEST_USER}`, { cache: 'no-store' });
        const listData1 = await listRes1.json();
        const found1 = listData1.data.find(r => r._id === id);
        console.log("Found in list (pre-delete):", !!found1);

        // 3. Delete
        console.log("Deleting receipt...");
        const delRes = await fetch(`${BASE_URL}/api/receipt/${id}`, { method: 'DELETE' });
        const delData = await delRes.json();
        console.log("Delete response:", delData);

        // 4. List again (Confirm it's gone)
        console.log("Listing receipts again...");
        const listRes2 = await fetch(`${BASE_URL}/api/receipt/list?userId=${TEST_USER}`, { cache: 'no-store' });
        const listData2 = await listRes2.json();
        const found2 = listData2.data.find(r => r._id === id);
        console.log("Found in list (post-delete):", !!found2);

        if (found2) console.error("TEST FAILED: Item still exists!");
        else console.log("TEST PASSED: Item gone.");

    } catch (e) {
        console.error("Error:", e);
    }
})();
