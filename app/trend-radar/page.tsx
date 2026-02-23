"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Loader2, RefreshCw, ExternalLink } from "lucide-react";

export default function TrendRadarPage() {
    const [summary, setSummary] = useState<string>("");
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [lastUpdated, setLastUpdated] = useState<string | null>(null);
    const [benchmarkAccounts, setBenchmarkAccounts] = useState<string>("");

    // localStorage から既存データと設定を読み込む
    useEffect(() => {
        const saved = localStorage.getItem("bc_trend_summary");
        if (saved) setSummary(saved);

        const ts = localStorage.getItem("bc_trend_updated_at");
        if (ts) setLastUpdated(ts);

        try {
            const raw = localStorage.getItem("bc_app_settings");
            if (raw) {
                const s = JSON.parse(raw);
                setBenchmarkAccounts(s.benchmarkAccounts || "");
            }
        } catch { }
    }, []);

    const handleAnalyze = async () => {
        setIsAnalyzing(true);
        setErrorMsg(null);

        try {
            let accounts: string[] = [];
            try {
                const raw = localStorage.getItem("bc_app_settings");
                if (raw) {
                    const s = JSON.parse(raw);
                    accounts = s.benchmarkAccounts
                        ? s.benchmarkAccounts.split(/[\s,、，]+/).filter((a: string) => a.trim().length > 0)
                        : [];
                }
            } catch { }

            const res = await fetch("/api/trend", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ benchmarkAccounts: accounts }),
            });

            const data = await res.json();
            // /api/trend は常に 200 を返す設計
            const result: string = data.summary || "分析結果なし";

            setSummary(result);
            const now = new Date().toLocaleString("ja-JP");
            setLastUpdated(now);
            localStorage.setItem("bc_trend_summary", result);
            localStorage.setItem("bc_trend_updated_at", now);
        } catch (e: any) {
            console.error("Trend analysis error:", e);
            setErrorMsg(`通信エラーが発生しました: ${e.message}`);
        } finally {
            setIsAnalyzing(false);
        }
    };

    // サマリーのテキストを見やすく整形（**bold** → 強調）
    const renderSummary = (text: string) => {
        return text.split("\n").map((line, i) => {
            // **text** → <strong>
            const parts = line.split(/\*\*(.*?)\*\*/g);
            return (
                <p key={i} className={`${line.trim() === "" ? "h-2" : "leading-relaxed text-sm text-gray-700"}`}>
                    {parts.map((part, j) =>
                        j % 2 === 1
                            ? <strong key={j} className="text-gray-900 font-semibold">{part}</strong>
                            : part
                    )}
                </p>
            );
        });
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-2xl mx-auto px-4 py-8">

                {/* ── 統一ヘッダー ──────────────────────────────── */}
                <div className="mb-8">
                    <Link href="/" className="text-blue-600 hover:underline mb-4 inline-block text-sm">
                        ← トップに戻る
                    </Link>
                    <div className="flex items-center gap-3 mb-2">
                        <span className="text-4xl">📡</span>
                        <h1 className="text-2xl font-bold text-gray-800">最新トレンドレーダー</h1>
                    </div>
                    <p className="text-gray-500 text-sm">
                        現在バズっているトレンド楽曲、人気フォーマット、ハッシュタグを分析します。
                    </p>
                </div>

                {/* ── ベンチマークアカウント表示 ─────────────────── */}
                <div className="mb-5 bg-white rounded-xl border border-indigo-100 p-4 shadow-sm">
                    <p className="text-xs font-semibold text-indigo-700 mb-1">📊 分析対象アカウント</p>
                    {benchmarkAccounts ? (
                        <p className="text-sm text-gray-700 break-all">{benchmarkAccounts}</p>
                    ) : (
                        <div className="flex items-center gap-2 text-sm text-amber-700">
                            <span>⚠️</span>
                            <span>
                                アカウント未設定。
                                <Link href="/settings" className="underline font-semibold ml-1">
                                    設定ページ
                                </Link>
                                でベンチマークアカウントを追加すると精度が向上します。
                            </span>
                        </div>
                    )}
                </div>

                {/* ── 分析ボタン ─────────────────────────────────── */}
                <button
                    onClick={handleAnalyze}
                    disabled={isAnalyzing}
                    className={`w-full flex items-center justify-center gap-2 rounded-xl py-4 font-bold text-white shadow-md transition-all mb-5 ${isAnalyzing
                            ? "bg-indigo-300 cursor-not-allowed"
                            : "bg-gradient-to-r from-indigo-500 to-blue-500 hover:from-indigo-600 hover:to-blue-600 hover:shadow-lg active:scale-95"
                        }`}
                >
                    {isAnalyzing ? (
                        <><Loader2 size={18} className="animate-spin" /> 分析中...（30秒ほどかかる場合があります）</>
                    ) : (
                        <><RefreshCw size={18} /> 📡 最新トレンドを分析する</>
                    )}
                </button>

                {/* ── エラー表示 ─────────────────────────────────── */}
                {errorMsg && (
                    <div className="mb-4 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
                        ❌ {errorMsg}
                    </div>
                )}

                {/* ── 結果表示 ───────────────────────────────────── */}
                {summary ? (
                    <div className="bg-white rounded-2xl border border-indigo-100 shadow-sm overflow-hidden">
                        {/* ヘッダー */}
                        <div className="bg-gradient-to-r from-indigo-500 to-blue-500 px-5 py-3 flex items-center justify-between">
                            <div>
                                <p className="text-white font-bold text-sm">🔍 トレンド分析レポート</p>
                                {lastUpdated && (
                                    <p className="text-indigo-100 text-xs mt-0.5">最終更新: {lastUpdated}</p>
                                )}
                            </div>
                            <Link
                                href="/ai-director"
                                className="flex items-center gap-1 bg-white/20 hover:bg-white/30 text-white text-xs font-semibold px-3 py-1.5 rounded-full transition"
                            >
                                <ExternalLink size={11} />
                                AIディレクターへ
                            </Link>
                        </div>

                        {/* 本文 */}
                        <div className="px-5 py-4 space-y-1">
                            {renderSummary(summary)}
                        </div>

                        {/* フッター */}
                        <div className="px-5 py-3 bg-indigo-50 border-t border-indigo-100 flex items-center gap-2 text-xs text-indigo-600">
                            <span>💾</span>
                            <span>このレポートはAIディレクターの撮影ミッション生成に自動で活用されます。</span>
                        </div>
                    </div>
                ) : (
                    /* 初期状態 */
                    !isAnalyzing && !errorMsg && (
                        <div className="bg-white rounded-2xl border border-indigo-100 p-8 flex flex-col items-center text-center shadow-sm">
                            <span className="text-5xl mb-4">📡</span>
                            <p className="text-gray-500 text-sm max-w-xs leading-relaxed">
                                ボタンを押すと、ベンチマークアカウントのInstagramデータをもとに
                                <strong>本日のトレンドレポート</strong>を生成します。
                                結果はAIディレクターでも自動的に活用されます。
                            </p>
                        </div>
                    )
                )}
            </div>
        </div>
    );
}
