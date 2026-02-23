
import { ApifyClient } from 'apify-client';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    let targetUsernames: string[] = [];
    let geminiApiKey = "";

    try {
        const { benchmarkAccounts } = await request.json();

        // 1. Parsing Usernames
        if (Array.isArray(benchmarkAccounts)) {
            const joined = benchmarkAccounts.join(" ");
            const matches = joined.match(/@([a-zA-Z0-9_.]+)/g);
            if (matches) {
                targetUsernames = matches.map((m: string) => m.replace("@", ""));
            } else {
                targetUsernames = benchmarkAccounts.map((s: string) => s.trim()).filter(s => s.length > 0);
            }
        }
        targetUsernames = Array.from(new Set(targetUsernames));

        if (targetUsernames.length === 0) throw new Error("No usernames found");

        const apifyToken = process.env.APIFY_API_TOKEN;
        geminiApiKey = process.env.GEMINI_API_KEY || "";

        if (!apifyToken || !geminiApiKey) throw new Error("Missing API Keys");

        const client = new ApifyClient({ token: apifyToken });
        const directUrls = targetUsernames.map(u => `https://www.instagram.com/${u}/`);

        const runInput = {
            usernames: targetUsernames,
            directUrls: directUrls,
            resultsLimit: 3,
            scrapePosts: true,
            scrapeDetails: false,
        };

        // 2. Execute Apify
        console.log("Starting Apify run for:", targetUsernames);
        const run = await client.actor("apify/instagram-scraper").call(runInput);
        const { items } = await client.dataset(run.defaultDatasetId).listItems();

        // 3. Extract Text
        let extractedTexts: string[] = [];
        if (items && items.length > 0) {
            for (const item of items) {
                if (item.caption && typeof item.caption === 'string') extractedTexts.push(item.caption);
                if (item.text && typeof item.text === 'string') extractedTexts.push(item.text);
                if (item.latestPosts && Array.isArray(item.latestPosts)) {
                    item.latestPosts.forEach((p: any) => {
                        if (p.caption) extractedTexts.push(p.caption);
                        if (p.text) extractedTexts.push(p.text);
                    });
                }
            }
        }

        const captions = extractedTexts.filter((txt) => txt && txt.length > 0).join("\n---\n");

        if (!captions) {
            // CRITICAL: Throw error to trigger catch block (Plan B)
            throw new Error("No captions extracted from Apify data");
        }

        // 4. Normal Analysis
        const genAI = new GoogleGenerativeAI(geminiApiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

        const prompt = `
        以下のテキストは、ベンチマークとしているInstagramアカウント(${targetUsernames.join(", ")})の最近の投稿キャプションです。
        これらを分析し、**「今日のトレンド傾向」**として以下の要素を簡潔に日本語でまとめてください。
        
        1. **トーン＆マナー**: (例: 親しみやすい、絵文字多め、詩的、など)
        2. **絵文字の使い方の特徴**: (例: 自然に関連するものを文末に配置、キラキラ系を多用、など)
        3. **人気のハッシュタグの傾向**: (例: #石垣島ランチ などの具体的な場所系が多い、英語タグを混ぜている、など)
        4. **文章構成**: (例: 疑問形で終わる、改行を多用して読みやすくしている、など)

        出力は、次に投稿を作る際の参考になるような、「スタイルガイド」のような形式で、300文字以内でまとめてください。
        
        【分析対象キャプション】:
        ${captions.substring(0, 5000)}
        `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        return NextResponse.json({ summary: response.text() });

    } catch (error: any) {
        console.error("Trend Analysis Error (Triggering Plan B):", error);

        // PLAN B: Emergency AI Fallback
        // Always return 200 OK so frontend handles it gracefully
        try {
            const genAI = new GoogleGenerativeAI(geminiApiKey || process.env.GEMINI_API_KEY || "");
            const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

            const fallbackPrompt = `
            Instagramからの最新データ取得がブロックされました。プロのSNSマーケターとして、
            以下のベンチマークアカウント（${targetUsernames.join(', ') || "石垣島の人気マリンショップ"}）の
            現在のSNSトレンド（トーン、絵文字、インバウンド向けハッシュタグ）を推測し、
            実践的な『本日のトレンドレポート』を日本語で作成してください。
            必ず『🔥 本日のトレンド推測（データ取得不可のためAI予測）:』から始めてください。
            
            出力形式：
            1. **トーン＆マナー**
            2. **絵文字の使い方の特徴**
            3. **人気のハッシュタグの傾向**
            4. **文章構成**
            300文字以内でまとめてください。
            `;

            const result = await model.generateContent(fallbackPrompt);
            const response = await result.response;
            return NextResponse.json({ summary: response.text() }, { status: 200 });

        } catch (fatalError: any) {
            console.error("Fatal Error:", fatalError);
            return NextResponse.json({
                summary: "❌ 致命的なエラーが発生しました。システム管理者にご連絡ください。"
            }, { status: 200 });
        }
    }
}

