import { NextRequest, NextResponse } from "next/server";

const CREATOMATE_API_KEY = process.env.CREATOMATE_API_KEY!;
const CREATOMATE_BASE = "https://api.creatomate.com/v1";

// ─────────────────────────────────────────────────────────────
// POST /api/creatomate
// Body: {
//   mediaItems: { url: string; text: string; fontSize: string }[];
//   targetDuration?: string;
// }
// → Creatomate に Composition ベースのレンダリングジョブを発注し renderId を返す
// ─────────────────────────────────────────────────────────────
type MediaItem = { url: string; text: string; fontSize: string };

export async function POST(req: NextRequest) {
    try {
        const { mediaItems, targetDuration } = (await req.json()) as {
            mediaItems: MediaItem[];
            targetDuration?: string;
        };

        if (!mediaItems || mediaItems.length === 0) {
            return NextResponse.json({ error: "mediaItems is required" }, { status: 400 });
        }

        const count = mediaItems.length;

        // ── クリップ秒数の計算（targetDuration が数値の場合のみ） ────────
        // クロスフェード1秒分が前後で重なるため逆算して各クリップを長くする
        // 例) 15秒・3本 → (15 + (3-1)×1) / 3 = 5.67秒/本
        const durationNum = targetDuration && targetDuration !== "original"
            ? Number(targetDuration)
            : null;
        const clipDuration: number | null =
            durationNum !== null && !isNaN(durationNum)
                ? (durationNum + (count - 1) * 1) / count
                : null;

        if (clipDuration !== null) {
            console.log(
                `[Creatomate POST] targetDuration=${durationNum}s, ` +
                `clipDuration=${clipDuration.toFixed(2)}s/clip (${count} clips)`
            );
        }

        // ── Composition ベースの RenderScript ────────────────────────────
        // 各シーン = composition 要素にまとめる（video + text を同期）
        const compositionElements = mediaItems.map((item, index) => {
            // Composition 内の子要素
            const innerElements: Record<string, unknown>[] = [
                {
                    type: "video",
                    source: item.url,
                    fill_mode: "cover",
                    // width/height は親 composition が決定するため省略
                },
            ];

            // テロップが空でない場合のみ Text を追加（座布団デザイン継承）
            if (item.text.trim() !== "") {
                innerElements.push({
                    type: "text",
                    text: item.text,
                    font_family: "Noto Sans CJK JP",
                    font_weight: "bold",
                    font_size: item.fontSize || "6 vmin",
                    fill_color: "#ffffff",
                    background_color: "rgba(0,0,0,0.6)",
                    padding: "3 vmin",
                    border_radius: "2 vmin",
                    x_alignment: "50%",
                    y_alignment: "50%",
                    y: "75%",
                    width: "85%",
                    // time/duration 省略 → composition 全体に表示
                });
            }

            // Composition 本体
            const composition: Record<string, unknown> = {
                type: "composition",
                track: 1,
                elements: innerElements,
            };

            // 目標秒数が指定されている場合はトリミング
            if (clipDuration !== null) {
                composition.duration = clipDuration;
            }

            // 2本目以降のシーンにクロスフェードを付与
            if (index > 0) {
                composition.transition = { type: "crossfade", duration: 1 };
            }

            return composition;
        });

        const renderBody = {
            source: {
                output_format: "mp4",
                width: 1080,
                height: 1920,
                frame_rate: 30,
                elements: compositionElements,
            },
        };

        console.log("[Creatomate POST] Sending body:", JSON.stringify(renderBody, null, 2));

        const creatomateRes = await fetch(`${CREATOMATE_BASE}/renders`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${CREATOMATE_API_KEY}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify(renderBody),
        });

        // エラー時は Creatomate の詳細エラー本文をそのままフロントに返す
        if (!creatomateRes.ok) {
            const errBody = await creatomateRes.text();
            console.error(`[Creatomate POST] API error ${creatomateRes.status}:`, errBody);
            return NextResponse.json(
                {
                    error: `Creatomate API error: ${creatomateRes.status}`,
                    detail: errBody,
                },
                { status: creatomateRes.status }
            );
        }

        // Creatomate は配列で返すことがある
        const result = await creatomateRes.json();
        const renders = Array.isArray(result) ? result : [result];
        const renderId = renders[0]?.id;

        if (!renderId) {
            return NextResponse.json(
                { error: "Failed to get render ID from Creatomate" },
                { status: 500 }
            );
        }

        console.log("[Creatomate POST] Success renderId:", renderId);
        return NextResponse.json({ renderId });
    } catch (err: any) {
        console.error("[Creatomate POST] Unexpected error:", err);
        return NextResponse.json(
            { error: err.message ?? "Internal server error" },
            { status: 500 }
        );
    }
}

// ─────────────────────────────────────────────────────────────
// GET /api/creatomate?id=xxx
// → Creatomate のレンダリングステータスをフロントに中継する
// ─────────────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get("id");

        if (!id) {
            return NextResponse.json({ error: "id query param is required" }, { status: 400 });
        }

        const creatomateRes = await fetch(`${CREATOMATE_BASE}/renders/${id}`, {
            headers: {
                Authorization: `Bearer ${CREATOMATE_API_KEY}`,
            },
        });

        if (!creatomateRes.ok) {
            const errText = await creatomateRes.text();
            console.error("[Creatomate GET] Error:", errText);
            return NextResponse.json(
                { error: `Creatomate API error: ${creatomateRes.status}`, detail: errText },
                { status: creatomateRes.status }
            );
        }

        const data = await creatomateRes.json();
        return NextResponse.json(data);
    } catch (err: any) {
        console.error("[Creatomate GET] Unexpected error:", err);
        return NextResponse.json(
            { error: err.message ?? "Internal server error" },
            { status: 500 }
        );
    }
}
