import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";

// ── BLUE CORAL 戦略定数 ─────────────────────────────────────────
const STRATEGY_RULES = `
【BLUE CORAL Instagram 絶対戦略ルール】

◆ 鉄の掟1: 1行目のフック（必須）
キャプションの1行目は、ユーザーのスクロールを止めるため、必ず「問いかけ」または「驚きの事実」で始めること。
例:「この透明度、信じられますか？」「グラスボートでマンタに会えるのは1年に数回だけ！」

◆ 鉄の掟2: CTA（Call To Action）の必須化
本文の最後には、保存数・シェア数を最大化するため、必ず以下のようなCTAを含めること。
日本語例:「石垣島旅行の参考に【保存】してね📌」「一緒に行きたい人に【シェア】で送ろう✈️」
外国語出力の場合は、その言語・文化に合わせたCTAに自然に翻訳して含めること。

◆ 鉄の掟3: ハッシュタグの3階層化（厳守）
ハッシュタグは以下の3階層を必ず揃えること:
1. スモールワード（具体的・地域密着、約10個）: #川平湾グラスボート #BLUECORAL #カビラブルー #石垣島グラスボート #川平湾絶景 #石垣島マリン #グラスボート体験 #BLUECORALstone #川平湾ツアー #石垣島シュノーケル など
2. ミドルワード（目的・エリア、約10個）: #石垣島旅行 #石垣島観光 #沖縄旅行 #沖縄観光 #石垣島 #川平湾 #八重山旅行 #石垣島おすすめ #沖縄絶景 #国内旅行 など
3. ビッグワード（抽象的・広域、約5個）: #旅行好き #絶景スポット #旅行 #japantravel #beautifuldestinations など
外国語指定がある場合はその言語のタグをミックスすること。
`;

export async function POST(req: NextRequest) {
    try {
        const { memo, hints, languages } = (await req.json()) as {
            memo?: string;
            hints?: string[];
            languages?: string[];
        };

        const geminiApiKey = process.env.GEMINI_API_KEY || "";
        if (!geminiApiKey) {
            return NextResponse.json({ error: "Missing Gemini API Key" }, { status: 500 });
        }

        const targetLanguages = (languages ?? []).filter(Boolean);
        const hintsText = (hints ?? []).filter(Boolean).join("\n");
        const hasExtraLanguages = targetLanguages.length > 0;

        const prompt = `あなたはプロのSNSマーケターであり、石垣島マリンレジャー企業BLUE CORALのインバウンド集客の専門家です。
以下の情報を元に、Instagramリール動画用の魅力的な投稿文（キャプション）とハッシュタグを作成してください。

${STRATEGY_RULES}

【全体の指示メモ・情報】
${memo || "（特になし）"}

【動画の各シーンのテロップ・ヒント（順番）】
${hintsText || "（特になし）"}

ターゲット追加言語（配列）: ${JSON.stringify(targetLanguages)}

【重要: 出力構成ルール】
必ず以下の順番とフォーマットで、1つのテキストとして出力すること。

1. [ベース: 日本語のキャプション]
   鉄の掟1〜3をすべて守った日本語キャプションを出力すること（3〜4段落、絵文字あり）。

${hasExtraLanguages ? `2. [追加言語の併記]
   ターゲット追加言語として ${JSON.stringify(targetLanguages)} が指定されている。
   これらすべての言語について、日本語本文を完璧に翻訳・ローカライズしたキャプションを順番に併記すること。
   各言語の前には必ず空行を2行挟んだ上で区切り線（---）を入れ、何の言語か分かるよう見出し（例: 【English】 や 【繁體中文】 等）を添えること。
   各言語のキャプション末尾にも、その言語でのCTA（鉄の掟2）と多言語ハッシュタグをつけること。

3. [ハッシュタグ]` : `2. [ハッシュタグ]`}
   最後に、鉄の掟3の3階層ハッシュタグ${hasExtraLanguages ? `と${targetLanguages.join("・")}のハッシュタグをミックス` : ""}を合計25〜30個程度、1行でまとめて出力すること。

【絶対厳守】
- 出力はプレーンテキストのみ（マークダウン記号は一切不要）
- セクションラベル（[ベース:]等）は出力に含めないこと
- ユーザーがそのままInstagramにコピペできる自然なレイアウトで返すこと
- 翻訳は文化的ニュアンスも含めて完璧にローカライズすること`;

        const genAI = new GoogleGenerativeAI(geminiApiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
        const result = await model.generateContent(prompt);
        const caption = result.response.text().trim();

        return NextResponse.json({ caption });
    } catch (error: any) {
        console.error("generate-video-caption error:", error);
        return NextResponse.json({ error: error.message || "Unknown error" }, { status: 500 });
    }
}
