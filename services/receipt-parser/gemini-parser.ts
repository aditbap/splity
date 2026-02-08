import { GoogleGenerativeAI } from '@google/generative-ai';
import { ReceiptData, ReceiptItem } from '@/models/Receipt';
import { ReceiptParserService } from './parser-service';

export class GeminiParserService implements ReceiptParserService {
    private genAI: GoogleGenerativeAI;

    constructor() {
        const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
        if (!apiKey) {
            console.warn('GOOGLE_GENERATIVE_AI_API_KEY is not set. Gemini Parser will fail.');
        }
        this.genAI = new GoogleGenerativeAI(apiKey || 'mock-key');
    }

    private getPrompt(rawText: string = ""): string {
        const promptIntro = "You are an intelligent receipt parser. Extract the following information from the receipt (image or text) below into a strict JSON format. Do not include any other text, markdown formatting, or explanations. Return ONLY the JSON object.\n\n";

        const jsonStructure = `Required JSON Structure:
{
  "merchantName": "string",
  "date": "string (ISO 8601 format if possible, or null)",
  "total": number,
  "tax": number,
  "serviceCharge": number,
  "discount": number,
  "items": [
    {
      "name": "string",
      "price": number,
      "quantity": number
    }
  ]
}\n\n`;

        const rules = `Rules:
1. **Noise Reduction**: Ignore random characters/gibberish.
2. **Merchant Name**: Top of receipt.
3. **Items**:
   - **Quantity**: Look for lone numbers between Desc and Price. Or "x2", "2x". If Item Total > Unit Price, Qty = Total/Unit. Default 1.
   - **Price**: Extract the **TOTAL LINE PRICE** for the item (not unit price).
   - Exclude: "Total", "Subtotal", "Tax", "Change", "Cash", "Service Charge", "SC", "PB1", "Discount", "Hemat", "Diskon".
4. **Extra Charges**:
   - **Service Charge**: "Service Charge", "SC", "Biaya Layanan" -> 'serviceCharge'
   - **Tax**: "Pajak", "Tax", "PB1", "PPN" -> 'tax'
   - **Discount**: "HEMAT", "Diskon", "Disc" (negative numbers) -> 'discount' (absolute value)
5. **Formatting**:
   - IDR uses "." as THOUSANDS separator (e.g. 50.000 = 50k).
   - Fix OCR Typos: O->0, l->1, S->5, B->8.
6. **Validation & Logic (CRITICAL)**:
   - Calculate \`Sum = Sum(Item.Price * Item.Qty)\`.
   - Compare \`Sum\` with \`Total\`.
   - **Case Inclusive**: If \`Sum\` ≈ \`Total\`, it means Tax/Service Charge are ALREADY INCLUDED in item prices. -> **Set 'tax' and 'serviceCharge' to 0** (even if they appear on the receipt).
   - **Case Add-on**: If \`Sum + Tax + SC\` ≈ \`Total\`, then keep 'tax' and 'serviceCharge' as extracted.
   - **Goal**: Ensure that \`Sum(Items) + Tax + SC - Discount\` matches the \`Total\` on the receipt. Adjust values if necessary to make the math work.

7. **Line Recovery (CRITICAL)**:
   - **Merged Lines**: If a line looks like "ItemA ItemB Price", SPLIT IT.
   - **Displaced Prices**: If an item has no price, LOOK DOWN to the next line. If the next line has a lone number, IT MIGHT BE THE PRICE.
   - **Example**:
     Line 1: "Bubur Polos Bubur Udang 20.000" -> This is likely "Bubur Polos" (20k) and "Bubur Udang" (Price missing/next line).
     Line 2: "35.000" -> This is "Bubur Udang" price.

**EXAMPLES (One-Shot Learning):**

*Input (Wing Heng Style Scramble):*
"1 Bub ur Polos  bub ir Udang    20,000
-.      Mancau Gula Mrh 2pcs    35,000
Onde Wijen Hitam        21,000  18      ,000"

*Reasoning:*
- Line 1 has "Bubur Polos" and "Bubur Udang". 20,000 matches Bubur Polos.
- Line 2 has 35,000. Bubur Udang (from line 1) needs a price. 35,000 fits Bubur Udang.
- Line 2 has "Mancau Gula".
- Line 3 has "21,000" (Onde) and "18,000".
- Mancau Gula (from line 2) matches 18,000? Or Onde matches 21,000.
- Result: 
  - Bubur Polos: 20000
  - Bubur Udang: 35000
  - Mancau Gula Mrh 2pcs: 18000
  - Onde Wijen Hitam: 21000
  - Mancau Gula: 18000
  - Onde Wijen: 21000

*Output Pattern:*
[
  { "name": "Bubur Polos", "quantity": 1, "price": 20000 },
  { "name": "Bubur Udang", "quantity": 1, "price": 35000 },
  { "name": "Mancau Gula Mrh 2pcs", "quantity": 1, "price": 18000 },
  { "name": "Onde Wijen Hitam", "quantity": 1, "price": 21000 }
]

`;

        const inputData = rawText ? ("OCR Text:\n" + rawText) : "Analyze the attached receipt image.";
        return promptIntro + jsonStructure + rules + inputData;
    }

    async parseImage(imageBuffer: Buffer): Promise<ReceiptData> {
        return this.parse("", imageBuffer);
    }

    async parse(rawText: string, imageBuffer?: Buffer): Promise<ReceiptData> {
        try {
            // If no text and no image, fail
            if ((!rawText || rawText.trim().length === 0) && !imageBuffer) {
                throw new Error('No text or image provided for parsing');
            }

            if (rawText) {
                console.log("--- START OCR RAW TEXT ---");
                console.log(rawText);
                console.log("--- END OCR RAW TEXT ---");
            }

            const prompt = this.getPrompt(rawText);

            // Dictionary of models to try in order
            // Re-ordered: Removed 2.0-flash from top to avoid 429 Rate Limits.
            // Using 'gemini-flash-latest' (Proven) and 'gemini-flash-lite-latest' (Faster)
            const modelsToTry = [
                "gemini-flash-latest",     // Currently working & reliable
                "gemini-flash-lite-latest", // Potential for higher speed (Multimodal Lite)
                "gemini-2.0-flash-lite",   // Newer Lite model
                "gemini-2.0-flash",        // Fallback (often rate limited on free tier)
                "gemini-2.5-flash"         // Preview
            ];

            let result;
            let usedModel = "";

            const imagePart = imageBuffer ? {
                inlineData: {
                    data: imageBuffer.toString('base64'),
                    mimeType: "image/jpeg"
                }
            } : null;

            for (const modelName of modelsToTry) {
                try {
                    console.log(`Attempting to use Gemini model: ${modelName}`);
                    const model = this.genAI.getGenerativeModel({ model: modelName });

                    if (imagePart) {
                        // Multimodal
                        result = await model.generateContent([prompt, imagePart]);
                    } else {
                        // Text only
                        result = await model.generateContent(prompt);
                    }

                    usedModel = modelName;
                    break; // Specific model worked!
                } catch (e: any) {
                    console.warn(`Failed with model ${modelName}: ${e.message}`);
                    if (modelName === modelsToTry[modelsToTry.length - 1]) {
                        throw e; // Throw if last one failed
                    }
                    // Continue to next model
                }
            }

            if (!result) throw new Error("All Gemini models failed");

            console.log(`Successfully used model: ${usedModel}`);
            const response = await result.response;
            const text = response.text();

            // Clean markdown code blocks if present (Gemini often wraps JSON in ```json ... ```)
            // Robust extraction: Find the first '{' and the last '}'
            let cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
            const firstBrace = cleanJson.indexOf('{');
            const lastBrace = cleanJson.lastIndexOf('}');

            if (firstBrace !== -1 && lastBrace !== -1) {
                cleanJson = cleanJson.substring(firstBrace, lastBrace + 1);
            }

            console.log("Cleaned JSON String:", cleanJson.substring(0, 100) + "...");

            const parsed = JSON.parse(cleanJson);

            // Conversions and validations
            const items: ReceiptItem[] = Array.isArray(parsed.items)
                ? parsed.items.map((item: any) => ({
                    name: item.name || 'Unknown Item',
                    price: Number(item.price) || 0,
                    quantity: Number(item.quantity) || 1
                }))
                : [];

            const resultData: ReceiptData = {
                merchantName: parsed.merchantName || "Unknown Merchant",
                date: parsed.date ? new Date(parsed.date) : new Date(),
                total: Number(parsed.total) || 0,
                tax: Number(parsed.tax) || 0,
                serviceCharge: Number(parsed.serviceCharge) || 0,
                discount: Number(parsed.discount) || 0,
                items
            };
            return resultData;

        } catch (error: any) {
            console.error('Gemini Parsing Failed:', error);
            // Fallback to basic empty structure or throw
            throw new Error(`Failed to parse receipt with Gemini: ${error.message}`);
        }
    }
}
