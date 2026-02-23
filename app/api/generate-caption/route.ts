import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

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

export async function POST(request: Request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
    }

    const body = await request.json();
    let { imageBase64, mimeType, trendSummary, additionalNote, targetLanguages, brandConcept, mandatoryHashtags } = body;

    if (imageBase64 && imageBase64.includes(",")) {
      imageBase64 = imageBase64.split(",")[1];
    }

    if (!imageBase64 || !mimeType) {
      return NextResponse.json({ error: "imageBase64 and mimeType are required" }, { status: 400 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const effectiveBrandConcept =
      brandConcept ||
      "石垣島・川平湾の「カビラブルー」の絶景とマリン体験を世界に届ける公式アカウント。親しみやすくポジティブで、読者が今すぐ石垣島に行きたくなるエモーショナルなトーンで。";
    const effectiveHashtags =
      mandatoryHashtags ||
      "#BLUECORAL #石垣島 #川平湾 #カビラブルー #石垣島旅行 #石垣島観光 #沖縄旅行 #絶景スポット #グラスボート #ishigaki #kabirabay #japantrip #okinawatrip";

    const hasLanguages = Array.isArray(targetLanguages) && targetLanguages.length > 0;
    const translationSection = hasLanguages
      ? `\n\nその後、改行と「---」の区切り線を挟んで、以下の言語への翻訳をそれぞれ続けて出力してください：\n${targetLanguages.join("、")}\n\n⚠️ 翻訳の各言語の末尾にも、必ず鉄の掟3のハッシュタグ体系（その言語のタグを加えてミックス）と鉄の掟2のCTAをその言語でつけてください。\n⚠️ 指定された言語のみ出力し、指定されていない言語は絶対に出力しないでください。`
      : "";

    const prompt = `あなたは石垣島・BLUE CORALの魅力を世界に伝えるプロのSNSマーケターです。提供された写真を詳細に分析し、Instagramで最高の反応を取れるキャプションを生成してください。

${STRATEGY_RULES}

【ブランドコンセプト（必ず遵守）】: ${effectiveBrandConcept}
【必須ハッシュタグベース（鉄の掟3の3階層に組み込むこと）】: ${effectiveHashtags}
【最新トレンド情報】: ${trendSummary || "（トレンド情報なし）"}
【現場スタッフからの補足メモ（最優先で自然に組み込むこと）】: ${additionalNote || "特になし"}

まず、鉄の掟1〜3をすべて守った日本語キャプションを生成してください。${translationSection}

⚠️ 出力ルール（必ず守ること）:
- JSONやMarkdownのコードブロック（\`\`\`）は絶対に使用しない
- 余計な挨拶や説明文は一切不要
- そのままInstagramにコピペして使える純粋なプレーンテキストのみ出力する`;

    const result = await model.generateContent([
      prompt,
      { inlineData: { data: imageBase64, mimeType: mimeType } },
    ]);

    const response = await result.response;
    const caption = response.text();

    return NextResponse.json({ caption });
  } catch (error: any) {
    console.error("Internal Server Error in /api/generate-caption:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
