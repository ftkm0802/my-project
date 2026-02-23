import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const { caption, imageUrl } = await request.json();

        // Simulate processing time
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Mock success response
        return NextResponse.json({
            success: true,
            message: "Instagramへの自動投稿が完了しました！（テスト）"
        }, { status: 200 });

    } catch (error) {
        console.error("Publish Error:", error);
        return NextResponse.json({
            success: false,
            message: "投稿処理に失敗しました"
        }, { status: 500 });
    }
}
