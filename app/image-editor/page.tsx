"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { Sparkles, Upload } from "lucide-react";

const LANGUAGE_OPTIONS = ["英語", "繁体字中国語", "簡体字中国語", "韓国語"];

export default function ImageEditorPage() {
    // ── 画像ステート ──────────────────────────────────────────────
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [imageBase64, setImageBase64] = useState<string>("");
    const [imageMimeType, setImageMimeType] = useState<string>("image/jpeg");
    const [generatedCaption, setGeneratedCaption] = useState<string>("");
    const [isGeneratingCaption, setIsGeneratingCaption] = useState(false);
    const [additionalNote, setAdditionalNote] = useState<string>("");
    const [selectedLanguages, setSelectedLanguages] = useState<string[]>(["英語", "繁体字中国語"]);
    const [showResultScreen, setShowResultScreen] = useState(false);

    const [trendSummary] = useState<string | null>(
        typeof window !== "undefined" ? localStorage.getItem("bc_trend_summary") : null
    );

    const fileInputRef = useRef<HTMLInputElement>(null);

    // ── 画像選択 ─────────────────────────────────────────────────
    const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const mime = file.type || "image/jpeg";
        setImageMimeType(mime);
        setGeneratedCaption("");
        const reader = new FileReader();
        reader.onload = (ev) => {
            const dataUrl = ev.target?.result as string;
            setImagePreview(dataUrl);
            setImageBase64(dataUrl.split(",")[1]);
        };
        reader.readAsDataURL(file);
    };

    // ── AI キャプション生成 ────────────────────────────────────────
    const handleGenerateCaption = async () => {
        if (!imageBase64) return;
        setIsGeneratingCaption(true);
        try {
            let brandConcept = "";
            let mandatoryHashtags = "";
            try {
                const s = localStorage.getItem("bc_app_settings");
                if (s) {
                    const p = JSON.parse(s);
                    brandConcept = p.brandConcept || "";
                    mandatoryHashtags = p.mandatoryHashtags || "";
                }
            } catch { }

            const response = await fetch("/api/generate-caption", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    imageBase64,
                    mimeType: imageMimeType,
                    trendSummary: trendSummary || "",
                    additionalNote: additionalNote || "",
                    targetLanguages: selectedLanguages,
                    brandConcept,
                    mandatoryHashtags,
                }),
            });
            const data = await response.json();
            if (data.caption) {
                setGeneratedCaption(data.caption);
                setShowResultScreen(true);
            } else {
                alert("キャプションの生成に失敗しました: " + (data.error || "不明なエラー"));
            }
        } catch (e) {
            console.error("Caption generation failed", e);
            alert("エラーが発生しました。");
        } finally {
            setIsGeneratingCaption(false);
        }
    };

    const handleCopyCaption = async () => {
        try {
            await navigator.clipboard.writeText(generatedCaption);
            alert("📋 全文をコピーしました！");
        } catch {
            alert("コピーに失敗しました。手動で選択してください。");
        }
    };



    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-2xl mx-auto px-4 py-8">

                {/* ── 統一ヘッダー ─────────────────────────────────── */}
                <div className="mb-8">
                    <Link href="/" className="text-blue-600 hover:underline mb-4 inline-block text-sm">
                        ← トップに戻る
                    </Link>
                    <div className="flex items-center gap-3 mb-2">
                        <span className="text-4xl">🖼️</span>
                        <h1 className="text-2xl font-bold text-gray-800">画像生成・編集（多言語対応）</h1>
                    </div>
                    <p className="text-gray-500 text-sm">
                        インバウンド対応の多言語キャプションとハッシュタグをAIが自動生成します。
                    </p>
                </div>

                {/* ── メインカード ──────────────────────────────────── */}
                <div className="bg-white rounded-2xl shadow-sm border border-sky-100 p-6">

                    {/* 画像アップロードエリア */}
                    <div
                        onClick={() => fileInputRef.current?.click()}
                        className={`relative mb-5 flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed transition-all min-h-[200px] overflow-hidden ${imagePreview
                            ? "border-sky-400 bg-sky-50"
                            : "border-sky-200 bg-white hover:border-sky-400 hover:bg-sky-50"
                            }`}
                    >
                        {imagePreview ? (
                            <img src={imagePreview} alt="プレビュー" className="h-full max-h-72 w-full object-contain" />
                        ) : (
                            <div className="flex flex-col items-center gap-2 p-8 text-sky-400">
                                <Upload size={40} strokeWidth={1.5} />
                                <p className="text-sm font-medium text-sky-700">タップして写真を選択</p>
                                <p className="text-xs text-sky-400">JPG / PNG / HEIC など</p>
                            </div>
                        )}
                        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageSelect} />
                    </div>

                    {/* 補足メモ */}
                    <div className="mb-4">
                        <label className="mb-1 block text-xs font-semibold text-sky-700">
                            📝 AIへの補足メモ（任意）
                        </label>
                        <textarea
                            value={additionalNote}
                            onChange={(e) => setAdditionalNote(e.target.value)}
                            rows={3}
                            placeholder="例：本日はグラスボート20%オフです！など、AIに組み込んでほしい情報を入力"
                            className="w-full rounded-xl border border-sky-200 bg-gray-50 p-3 text-sm text-gray-700 placeholder-sky-200 outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                        />
                    </div>

                    {/* 言語選択 */}
                    <div className="mb-5">
                        <p className="mb-2 text-xs font-semibold text-sky-700">🌐 翻訳する言語を選択</p>
                        <div className="flex flex-wrap gap-2">
                            {LANGUAGE_OPTIONS.map((lang) => (
                                <label
                                    key={lang}
                                    className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-sky-200 bg-white px-3 py-2 text-sm text-sky-800 hover:bg-sky-50 transition-all"
                                    style={selectedLanguages.includes(lang) ? { borderColor: "#0ea5e9", background: "#e0f2fe", fontWeight: 600 } : {}}
                                >
                                    <input
                                        type="checkbox"
                                        className="accent-sky-500"
                                        checked={selectedLanguages.includes(lang)}
                                        onChange={(e) => {
                                            if (e.target.checked) setSelectedLanguages((p) => [...p, lang]);
                                            else setSelectedLanguages((p) => p.filter((l) => l !== lang));
                                        }}
                                    />
                                    {lang}
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* 生成ボタン */}
                    <button
                        onClick={handleGenerateCaption}
                        disabled={!imageBase64 || isGeneratingCaption}
                        className={`flex w-full items-center justify-center gap-2 rounded-xl py-3 font-bold text-white shadow-md transition-all ${!imageBase64
                            ? "cursor-not-allowed bg-gray-300"
                            : isGeneratingCaption
                                ? "cursor-not-allowed bg-sky-300"
                                : "bg-gradient-to-r from-sky-500 to-cyan-500 hover:from-sky-600 hover:to-cyan-600 hover:shadow-lg active:scale-95"
                            }`}
                    >
                        {isGeneratingCaption ? (
                            <><span className="animate-spin">🔄</span> 写真を分析中...</>
                        ) : (
                            <><Sparkles size={18} /> ✨ AIでキャプションを自動生成</>
                        )}
                    </button>
                </div>
            </div>

            {/* ── 結果オーバーレイ ───────────────────────────────── */}
            {showResultScreen && (
                <div className="fixed inset-0 z-50 flex flex-col bg-slate-50 overflow-y-auto">
                    <div className="sticky top-0 z-10 bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between shadow-sm">
                        <h2 className="font-bold text-slate-800 flex items-center gap-2 text-base">
                            <Sparkles size={18} className="text-sky-500" />
                            生成結果の確認・編集
                        </h2>
                        <button onClick={() => setShowResultScreen(false)} className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100 transition">✕</button>
                    </div>

                    <div className="flex-1 p-4 md:p-8 max-w-5xl mx-auto w-full">
                        {/* md以上: 左に画像, 右にテキスト / スマホ: 縦積み */}
                        <div className="grid md:grid-cols-2 gap-6 h-full">

                            {/* ─── 元画像 ──────────────────────── */}
                            <div className="flex flex-col gap-2">
                                <p className="text-xs font-semibold text-slate-500">📷 元画像</p>
                                {imagePreview && (
                                    <img
                                        src={imagePreview}
                                        alt="元画像"
                                        className="w-full max-h-[420px] object-contain rounded-xl shadow-sm bg-gray-50 border border-slate-100"
                                    />
                                )}
                            </div>

                            {/* ─── 生成テキスト ─────────────────── */}
                            <div className="flex flex-col gap-2">
                                <div className="flex items-center justify-between">
                                    <p className="text-xs font-semibold text-slate-500">✨ 生成されたキャプション</p>
                                    <button
                                        onClick={handleCopyCaption}
                                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 text-xs font-semibold hover:bg-slate-200 transition active:scale-95"
                                    >
                                        📋 全文をコピー
                                    </button>
                                </div>
                                <textarea
                                    value={generatedCaption}
                                    onChange={(e) => setGeneratedCaption(e.target.value)}
                                    className="w-full flex-1 min-h-[360px] md:min-h-[420px] rounded-2xl border border-slate-200 bg-white p-4 text-sm text-gray-800 leading-relaxed shadow-inner outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100 resize-none"
                                    placeholder="キャプションがここに表示されます..."
                                />
                            </div>
                        </div>
                    </div>

                    <div className="sticky bottom-0 bg-white border-t border-slate-200 p-4 max-w-2xl mx-auto w-full">
                        <p className="text-xs text-gray-400 text-center mb-3">
                            💡 おすすめ投稿時間：ストーリーズ [7:00-8:00] / 写真 [12:00-13:00] / リール [19:00-21:00]
                        </p>
                        <button
                            onClick={() => {
                                setShowResultScreen(false);
                                setGeneratedCaption("");
                                setImagePreview(null);
                                setImageBase64("");
                                setImageMimeType("image/jpeg");
                                setAdditionalNote("");
                                if (fileInputRef.current) fileInputRef.current.value = "";
                            }}
                            className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-sky-200 bg-white py-3 text-sm font-bold text-sky-600 hover:bg-sky-50 transition active:scale-95"
                        >
                            🔙 別の画像で新しく作成する
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
