import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
    try {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            console.error("Error: GEMINI_API_KEY is not set");
            return NextResponse.json(
                { error: "Server configuration error" },
                { status: 500 }
            );
        }

        const formData = await request.formData();
        const file = formData.get("file") as File | null;
        const memo = formData.get("memo") as string | null;
        const settingsJson = formData.get("settings") as string | null;
        // Read trend summary from the SAME formData object (FIXED: do not call request.formData() again)
        const trendSummary = formData.get("bc_trend_summary") as string | null;

        if (!file) {
            console.error("Error: No file provided in form data");
            return NextResponse.json(
                { error: "No image provided" },
                { status: 400 }
            );
        }

        // Parse Settings
        let brandConcept = "Engaging, friendly, tailored for tourists.";
        let mandatoryHashtags = "#KabiraBay";
        let benchmarkAccounts = "";

        if (settingsJson) {
            try {
                const settings = JSON.parse(settingsJson);
                if (settings.brandConcept) brandConcept = settings.brandConcept;
                if (settings.mandatoryHashtags) mandatoryHashtags = settings.mandatoryHashtags;
                if (settings.benchmarkAccounts) benchmarkAccounts = settings.benchmarkAccounts;
            } catch (e) {
                console.error("Failed to parse settings JSON", e);
            }
        }

        // Convert File to Base64
        const arrayBuffer = await file.arrayBuffer();
        const base64Data = Buffer.from(arrayBuffer).toString("base64");
        const mimeType = file.type || "image/jpeg";

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

        const systemInstruction = `
        You are the elite, exclusive SNS Director for a marine commpany called 'BC' in Kabira Bay, Ishigaki Island. 
        You are NO LONGER a simple translator. Your goal is to maximize engagement, reach, and brand loyalty.

        [BRAND CONCEPT & TARGET AUDIENCE]
        ${brandConcept}

        [MANDATORY HASHTAGS]
        Always include these at the end of every caption:
        ${mandatoryHashtags}

        ${benchmarkAccounts ? `[BENCHMARK ACCOUNTS]\nEmulate the high-engagement style of these accounts (without copying exactly): ${benchmarkAccounts}` : ""}

        ${trendSummary ? `[LATEST TREND RADAR]\nUse this real-time analysis of benchmark accounts to guide your style:\n${trendSummary}\n\nYou MUST strongly incorporate these specific trends, tones, and emojis into your output while strictly maintaining the BC brand persona.` : ""}

        [TASK]
        Analyze the uploaded image. Create highly engaging, SEO/GEO-optimized Instagram captions in exactly 4 languages:
        1. Japanese (JA): Natural, engaging, fit for the target audience.
        2. English (EN): Friendly, welcoming to international tourists.
        3. Traditional Chinese (ZH): Appealing to Taiwan/HK tourists.
        4. Korean (KO): Trendy and inviting.

        Also generate 5 ADDITIONAL relevant hashtags based on the image content (e.g., #Startfish, #GlassBoat, #TravelJapan) and append them to the mandatory ones.

        [USER MEMO]
        ${memo ? `Specific instruction: ${memo}` : "No specific instruction."}
        
        [OUTPUT FORMAT]
        Output ONLY a raw JSON object. No markdown.
        Schema: { "ja": "...", "en": "...", "zh": "...", "ko": "...", "hashtags": ["#MandatoryTag", "#GeneratedTag"] }
        `;

        const result = await model.generateContent([
            systemInstruction,
            {
                inlineData: {
                    data: base64Data,
                    mimeType: mimeType,
                },
            },
        ]);

        const response = await result.response;
        const text = response.text();
        console.log("Raw AI Response:", text);

        // Robust JSON Cleaning
        let cleanedText = text.trim();
        cleanedText = cleanedText.replace(/^```(json)?/i, "").replace(/```$/, "").trim();

        let jsonResponse;
        try {
            jsonResponse = JSON.parse(cleanedText);
        } catch (e) {
            console.error("Failed to parse JSON:", cleanedText, e);
            return NextResponse.json({ error: "Failed to parse AI response" }, { status: 500 });
        }

        return NextResponse.json(jsonResponse);

    } catch (error: any) {
        console.error("Internal Server Error in /api/generate:", error);
        return NextResponse.json(
            { error: error.message || "Internal Server Error" },
            { status: 500 }
        );
    }
}
