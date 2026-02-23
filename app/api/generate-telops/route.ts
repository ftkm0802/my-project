import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";

// ─────────────────────────────────────────────────────────────
// POST /api/generate-telops
// Body: { memo: string, hints?: string[], count: number, language?: string }
// → シーン数分のテロップ文字列配列を指定言語で返す
// ─────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
    try {
        const { memo, hints, count, language } = (await req.json()) as {
            memo: string;
            hints?: string[];
            count: number;
            language?: string;
        };

        const outputLanguage = language || "Japanese";

        if (!count || count < 1) {
            return NextResponse.json({ error: "count must be >= 1" }, { status: 400 });
        }

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return NextResponse.json({ error: "GEMINI_API_KEY not set" }, { status: 500 });
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

        // ヒント配列を count と同じ長さに補完
        const normalizedHints = Array.from({ length: count }, (_, i) => hints?.[i] ?? "");

        const prompt = [
            `インスタグラムリール動画の各シーンの「ヒント（単語や短いメモ）」が配列で送られてきます。`,
            `必ず指定された出力言語（${outputLanguage}）で、目を引くテロップに清書・拡張してください。`,
            `入力ヒントが日本語であっても、出力は必ず ${outputLanguage} に翻訳・ローカライズすること。`,
            ``,
            `全体の指示メモ: "${memo || "おしゃれな映像"}"`,
            `各シーンのヒント: ${JSON.stringify(normalizedHints)}`,
            `出力言語: ${outputLanguage}`,
            ``,
            `条件:`,
            `- ヒントが入力されているシーンは、その単語を魅力的なテロップに拡張してください。`,
            `- ヒントが空欄("")のシーンは、全体メモと文脈から推測して適切なテロップを作成してください。`,
            `- 各テロップは ${outputLanguage} として自然な長さ（日本語なら15文字以内、英語等なら数単語）で、絵文字を1〜2個含めること。`,
            `- 出力は純粋なJSON文字列配列のみ（例: ["Scene 1🌊", "Scene 2✨"]）。`,
            `- マークダウン記号（バッククォート等）は絶対に含めないこと。`,
        ].join("\n");

        const result = await model.generateContent(prompt);
        const raw = result.response.text().trim();
        console.log("[generate-telops] Gemini raw output:", raw);

        // JSON文字列配列をパース（コードブロックが混入しても除去）
        const jsonStr = raw.replace(/```json?/gi, "").replace(/```/g, "").trim();
        let telops: string[];
        try {
            telops = JSON.parse(jsonStr);
            if (!Array.isArray(telops)) throw new Error("Not an array");
        } catch {
            console.error("[generate-telops] JSON parse failed, fallback to split");
            // フォールバック: 行分割
            telops = jsonStr
                .split("\n")
                .map((l) => l.replace(/^["'\s,[\]]+|["'\s,[\]]+$/g, ""))
                .filter(Boolean)
                .slice(0, count);
        }

        // count と長さが合わない場合は補完・切り捨て
        while (telops.length < count) {
            telops.push(`Scene ${telops.length + 1}✨`);
        }
        telops = telops.slice(0, count);

        console.log("[generate-telops] Final telops:", telops);
        return NextResponse.json({ telops });
    } catch (err: any) {
        console.error("[generate-telops] Error:", err);
        return NextResponse.json({ error: err.message ?? "Internal server error" }, { status: 500 });
    }
}
