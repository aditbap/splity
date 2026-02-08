
const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config({ path: '.env.local' });

async function listModels() {
    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    if (!apiKey) {
        console.error("No API KEY found!");
        return;
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    try {
        // For some reason the SDK doesn't expose listModels directly on the main class easily in all versions?
        // Actually it does via GoogleGenerativeAI.getGenerativeModel -> but that's for getting.
        // Let's try to just use a known model and see if it works, or maybe use raw fetch if SDK doesn't have it.
        // Wait, SDK has a ModelManager usually? Or maybe not in this lightweight one?
        // Let's checks the raw API via generic request or just try to generate with a text prompt on 'gemini-1.5-flash' to debug.

        console.log("Testing API Key with 'gemini-1.5-flash'...");
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const result = await model.generateContent("Hello?");
        console.log("Success! Response:", result.response.text());
    } catch (error) {
        console.error("Error with gemini-1.5-flash:", error.message);

        console.log("\nTrying 'gemini-pro'...");
        try {
            const model2 = genAI.getGenerativeModel({ model: "gemini-pro" });
            const result2 = await model2.generateContent("Hello?");
            console.log("Success with gemini-pro:", result2.response.text());
        } catch (e) {
            console.error("Error with gemini-pro:", e.message);
        }
    }
}

listModels();
