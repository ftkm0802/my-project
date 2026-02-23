
import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const { trendSummary, settings } = await request.json();

        const geminiApiKey = process.env.GEMINI_API_KEY || "";
        if (!geminiApiKey) {
            return NextResponse.json({ error: "Missing Gemini API Key" }, { status: 500 });
        }

        const genAI = new GoogleGenerativeAI(geminiApiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

        const prompt = `
        あなたは石垣島のマリンレジャー企業『BLUE CORAL』の敏腕SNS映像ディレクターです。
        提供された【最新トレンド分析】と【当社のブランド設定】と【戦略前提知識】を読み込み、現場スタッフが明日スマホで撮影すべき『Instagram用（リール/フィード）の具体的な写真・動画の撮影ミッション』を3つ提案してください。

        【戦略前提知識（必ず全ミッションに反映すること）】
        ・ターゲット層: 35〜54歳（約60%）。家族・夫婦旅行がメイン。男性比率65%（旅行計画の主導権を持つ）。
        ・コンテンツピラー（比率）:
          - 「癒やしの風景」40%: カビラブルーの海、サンセット、水中映像など
          - 「現場の体温」30%: スタッフ、お客様の笑顔、リアルな体験の瞬間
          - 「保存される実用情報」20%: アクセス、料金、ベストシーズン、持ち物など
          - 「インバウンド多言語」10%: 外国人旅行者に刺さる国際的な視点
        ・最重要KPI: 【保存数】を引き上げること。そのため「実用情報（行き方・料金・ベストシーズン等）」の企画を積極的に提案する。
        ・ターゲット層（35〜54歳の男性主導ファミリー）が「保存して後で計画に使いたい」と感じる情報価値の高い企画を優先すること。

        【最新トレンド分析】:
        ${trendSummary || "特になし（一般的なマリンレジャーのトレンドを想定）"}

        【当社のブランド設定】:
        ${JSON.stringify(settings || {}, null, 2)}

        出力は絶対に以下のJSONフォーマットのみとしてください。前置きの挨拶や説明テキストは一切不要です。
        {
          "message": "よっしゃー！明日の激アツ撮影ミッションだ！（1行の短い熱いメッセージ）",
          "missions": [
            {
              "title": "ミッションのタイトル",
              "summary": "スマホでパッと見て「何をどう撮るか」が分かる1行サマリー",
              "target": "ターゲット被写体",
              "angle": "具体的なアングルやカメラの動かし方",
              "duration": "推奨する秒数",
              "reason": "トレンドに刺さる理由と保存数アップへの貢献"
            }
          ]
        }
        `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        // Clean up markdown code blocks if present
        const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
        const missionData = JSON.parse(cleanText);

        return NextResponse.json({ mission: missionData });

    } catch (error: any) {
        console.error("Mission Generation Error:", error);
        // Fallback for error case, following the new structure but with an error message
        return NextResponse.json({
            mission: {
                message: "❌ ミッションの生成に失敗しました。",
                missions: [{
                    title: "エラーが発生しました",
                    summary: "時間を置いて再試行してください。",
                    target: "",
                    angle: "",
                    duration: "",
                    reason: error.message || "Unknown error"
                }]
            }
        }, { status: 500 });
    }
}
