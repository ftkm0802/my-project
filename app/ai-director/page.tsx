"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Loader2, RefreshCw, Target, Camera, Clock, Zap } from "lucide-react";

// ── 型定義 ────────────────────────────────────────────────────────
interface Mission {
    title: string;
    summary: string;
    target: string;
    angle: string;
    duration: string;
    reason: string;
}

interface MissionData {
    message: string;
    missions: Mission[];
}

// ── Mission カード ────────────────────────────────────────────────
function MissionCard({ mission, index }: { mission: Mission; index: number }) {
    const colors = [
        { bg: "bg-orange-50", border: "border-orange-200", badge: "bg-orange-500", label: "text-orange-700" },
        { bg: "bg-pink-50", border: "border-pink-200", badge: "bg-pink-500", label: "text-pink-700" },
        { bg: "bg-violet-50", border: "border-violet-200", badge: "bg-violet-500", label: "text-violet-700" },
    ];
    const c = colors[index % colors.length];

    return (
        <div className={`rounded-2xl border ${c.border} ${c.bg} p-5 shadow-sm`}>
            {/* ミッション番号バッジ */}
            <div className="flex items-center gap-3 mb-3">
                <span className={`${c.badge} text-white text-xs font-bold px-3 py-1 rounded-full`}>
                    Mission {index + 1}
                </span>
                <h3 className="font-bold text-gray-800 text-base leading-tight flex-1">{mission.title}</h3>
            </div>

            {/* サマリー */}
            <p className={`text-sm font-medium ${c.label} mb-4 leading-relaxed`}>{mission.summary}</p>

            {/* 詳細グリッド */}
            <div className="grid grid-cols-1 gap-2 text-xs text-gray-600">
                <div className="flex items-start gap-2">
                    <Target size={13} className="mt-0.5 shrink-0 text-gray-400" />
                    <span><span className="font-semibold text-gray-700">ターゲット：</span>{mission.target}</span>
                </div>
                <div className="flex items-start gap-2">
                    <Camera size={13} className="mt-0.5 shrink-0 text-gray-400" />
                    <span><span className="font-semibold text-gray-700">アングル：</span>{mission.angle}</span>
                </div>
                <div className="flex items-start gap-2">
                    <Clock size={13} className="mt-0.5 shrink-0 text-gray-400" />
                    <span><span className="font-semibold text-gray-700">推奨秒数：</span>{mission.duration}</span>
                </div>
                <div className="flex items-start gap-2">
                    <Zap size={13} className="mt-0.5 shrink-0 text-gray-400" />
                    <span><span className="font-semibold text-gray-700">バズる理由：</span>{mission.reason}</span>
                </div>
            </div>
        </div>
    );
}

// ── メインページ ──────────────────────────────────────────────────
export default function AiDirectorPage() {
    const [missionData, setMissionData] = useState<MissionData | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [hasTrend, setHasTrend] = useState(false);

    useEffect(() => {
        const summary = localStorage.getItem("bc_trend_summary");
        setHasTrend(!!summary && summary.trim().length > 0);
    }, []);

    const handleGenerate = async () => {
        setIsGenerating(true);
        setErrorMsg(null);
        setMissionData(null);

        try {
            const trendSummary = localStorage.getItem("bc_trend_summary") || "";
            let settings = {};
            try {
                const raw = localStorage.getItem("bc_app_settings");
                if (raw) settings = JSON.parse(raw);
            } catch { }

            const res = await fetch("/api/mission", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ trendSummary, settings }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || `Server error: ${res.status}`);
            setMissionData(data.mission);
        } catch (e: any) {
            console.error("Mission generation error:", e);
            setErrorMsg(`生成に失敗しました: ${e.message}`);
        } finally {
            setIsGenerating(false);
        }
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
                        <span className="text-4xl">🧑🏫</span>
                        <h1 className="text-2xl font-bold text-gray-800">AIディレクター</h1>
                    </div>
                    <p className="text-gray-500 text-sm">
                        目的やターゲットに合わせて、最適なSNS企画や構成案をAIが提案します。
                    </p>
                </div>

                {/* ── トレンド連携バナー ─────────────────────────── */}
                {hasTrend ? (
                    <div className="mb-5 flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 text-sm text-emerald-800">
                        <span>📡</span>
                        <span>最新トレンドデータを読み込んでいます。ミッションはトレンドを反映します。</span>
                    </div>
                ) : (
                    <div className="mb-5 flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-800">
                        <span>💡</span>
                        <div>
                            <span>トレンドデータがありません。</span>
                            <Link href="/trend-radar" className="underline ml-1 font-semibold">
                                トレンドレーダーで分析
                            </Link>
                            <span>してからミッションを生成すると、より精度が上がります。</span>
                        </div>
                    </div>
                )}

                {/* ── 生成ボタン ─────────────────────────────────── */}
                <button
                    onClick={handleGenerate}
                    disabled={isGenerating}
                    className={`w-full flex items-center justify-center gap-2 rounded-xl py-4 font-bold text-white shadow-md transition-all mb-6 ${isGenerating
                            ? "bg-orange-300 cursor-not-allowed"
                            : "bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 hover:shadow-lg active:scale-95"
                        }`}
                >
                    {isGenerating ? (
                        <><Loader2 size={18} className="animate-spin" /> AIがミッションを考え中...</>
                    ) : (
                        <><RefreshCw size={18} /> 📋 今日の撮影ミッションを生成</>
                    )}
                </button>

                {/* ── エラー表示 ─────────────────────────────────── */}
                {errorMsg && (
                    <div className="mb-4 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
                        ❌ {errorMsg}
                    </div>
                )}

                {/* ── 結果表示 ───────────────────────────────────── */}
                {missionData && (
                    <div className="space-y-4">
                        {/* ディレクターメッセージ */}
                        <div className="bg-gradient-to-r from-orange-500 to-pink-500 text-white rounded-2xl px-5 py-4 shadow-md">
                            <p className="text-xs font-semibold opacity-80 mb-1">🎬 AIディレクターより</p>
                            <p className="font-bold text-base leading-relaxed">{missionData.message}</p>
                        </div>

                        {/* ミッションカード群 */}
                        {missionData.missions.map((mission, i) => (
                            <MissionCard key={i} mission={mission} index={i} />
                        ))}

                        {/* 再生成ボタン */}
                        <button
                            onClick={handleGenerate}
                            className="w-full flex items-center justify-center gap-2 rounded-xl py-3 border border-orange-200 bg-white text-orange-600 font-semibold text-sm hover:bg-orange-50 transition active:scale-95"
                        >
                            <RefreshCw size={15} /> もう一度生成する
                        </button>
                    </div>
                )}

                {/* ── 初期状態（未生成）の案内 ──────────────────── */}
                {!missionData && !isGenerating && !errorMsg && (
                    <div className="bg-white rounded-2xl border border-orange-100 p-8 flex flex-col items-center text-center shadow-sm">
                        <span className="text-5xl mb-4">🎯</span>
                        <p className="text-gray-500 text-sm max-w-xs leading-relaxed">
                            ボタンを押すと、AIがブランド設定と最新トレンドをもとに
                            <strong>今日の具体的な撮影ミッション3件</strong>を提案します。
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
