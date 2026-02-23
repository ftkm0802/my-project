"use client";

import { useState, useRef } from "react";
import Link from "next/link";

import {
    Film,
    Upload as UploadIcon,
    Image as ImageIcon,
    Loader2,
    X,
    Sparkles,
    Clapperboard,
    Type,
    FileText,
    Copy,
    Check,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

// ── シーンごとのテロップ設定型 ────────────────────────────────
type MediaSetting = { text: string; fontSize: string };

const DEFAULT_SETTING: MediaSetting = { text: "", fontSize: "6vmin" };

const FONT_SIZE_OPTIONS = [
    { value: "4vmin", label: "小（4vmin）" },
    { value: "6vmin", label: "標準（6vmin）" },
    { value: "8vmin", label: "大（8vmin）" },
    { value: "10vmin", label: "極太（10vmin）" },
];

// ── テロップ出力言語オプション ─────────────────────────────────
const TELOP_LANGUAGE_OPTIONS = [
    { value: "Japanese", label: "🇯🇵 日本語" },
    { value: "English", label: "🇺🇸 英語" },
    { value: "Simplified Chinese", label: "🇨🇳 簡体字中国語" },
    { value: "Traditional Chinese", label: "🇹🇼 繁体字中国語" },
    { value: "Korean", label: "🇰🇷 韓国語" },
    { value: "Thai", label: "🇹🇭 タイ語" },
    { value: "Vietnamese", label: "🇻🇳 ベトナム語" },
];

export default function UploadPage() {
    // ─── 複数ファイル管理 ───────────────────────────────────────────
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [previewUrls, setPreviewUrls] = useState<string[]>([]);

    // ─── 各シーンのテロップ設定（selectedFiles と添字同期） ──────────
    const [mediaSettings, setMediaSettings] = useState<MediaSetting[]>([]);

    // ─── 共通ステート ─────────────────────────────────────────────
    const [instruction, setInstruction] = useState("");
    const [isUploading, setIsUploading] = useState(false);   // Supabase アップロード中

    // ─── リール動画生成 専用ステート ──────────────────────────────
    const [isGeneratingReel, setIsGeneratingReel] = useState(false);
    const [isGeneratingTelops, setIsGeneratingTelops] = useState(false);
    const [reelVideoUrl, setReelVideoUrl] = useState<string | null>(null);
    const [reelError, setReelError] = useState<string | null>(null);
    const [targetDuration, setTargetDuration] = useState("original");
    const [targetLanguage, setTargetLanguage] = useState("Japanese");

    // ─── 投稿用キャプション生成 専用ステート ──────────────────────
    const [generatedCaption, setGeneratedCaption] = useState<string>("");
    const [isGeneratingCaption, setIsGeneratingCaption] = useState(false);
    const [isCopied, setIsCopied] = useState(false);
    // 複数言語選択（テロップ言語とは完全独立）— 初期値: 英語のみ選沢
    const [captionLanguages, setCaptionLanguages] = useState<string[]>(["English"]);

    const fileInputRef = useRef<HTMLInputElement>(null);

    // ─── ファイル追加ヘルパー ─────────────────────────────────────
    const addFiles = (files: FileList | null) => {
        if (!files || files.length === 0) return;
        const newFiles = Array.from(files).filter(
            (f) => f.type.startsWith("image/") || f.type.startsWith("video/")
        );
        const newUrls = newFiles.map((f) => URL.createObjectURL(f));
        const newSettings = newFiles.map(() => ({ ...DEFAULT_SETTING }));
        setSelectedFiles((prev) => [...prev, ...newFiles]);
        setPreviewUrls((prev) => [...prev, ...newUrls]);
        setMediaSettings((prev) => [...prev, ...newSettings]);
    };

    // ─── ファイル選択ハンドラ ─────────────────────────────────────
    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        addFiles(e.target.files);
        e.target.value = "";
    };

    // ─── ドラッグ＆ドロップ ───────────────────────────────────────
    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        addFiles(e.dataTransfer.files);
    };
    const handleDragOver = (e: React.DragEvent) => e.preventDefault();

    // ─── 個別削除 ────────────────────────────────────────────────
    const removeFile = (index: number) => {
        URL.revokeObjectURL(previewUrls[index]);
        setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
        setPreviewUrls((prev) => prev.filter((_, i) => i !== index));
        setMediaSettings((prev) => prev.filter((_, i) => i !== index));
    };

    // ─── テロップ設定の更新ヘルパー ──────────────────────────────
    const updateMediaSetting = (index: number, patch: Partial<MediaSetting>) => {
        setMediaSettings((prev) =>
            prev.map((s, i) => (i === index ? { ...s, ...patch } : s))
        );
    };


    // ─── ② Supabase 並列アップロード ─────────────────────────────

    const uploadAllToSupabase = async (): Promise<string[]> => {
        const results = await Promise.all(
            selectedFiles.map(async (file) => {
                const ext = file.name.split(".").pop() ?? "bin";
                const path = `uploads/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
                const { error } = await supabase.storage.from("post-images").upload(path, file);
                if (error) throw new Error(`Upload failed: ${error.message}`);
                const { data } = supabase.storage.from("post-images").getPublicUrl(path);
                return data.publicUrl;
            })
        );
        return results;
    };

    // ─── ③ AIテロップ一括生成 ─────────────────────────────────────
    const handleGenerateTelops = async () => {
        if (selectedFiles.length === 0) return;
        setIsGeneratingTelops(true);
        try {
            const res = await fetch("/api/generate-telops", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    memo: instruction,
                    count: selectedFiles.length,
                    hints: mediaSettings.map((s) => s.text),
                    language: targetLanguage,
                }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error ?? "Telop generation failed");

            const telops: string[] = data.telops;
            setMediaSettings((prev) =>
                prev.map((s, i) => ({ ...s, text: telops[i] ?? s.text }))
            );
            console.log("✨ AIテロップ一括生成完了:", telops);
        } catch (error: any) {
            console.error("Telop generation error:", error);
            alert(`テロップ生成に失敗しました: ${error.message}`);
        } finally {
            setIsGeneratingTelops(false);
        }
    };

    // ─── ④ リール動画自動生成（Creatomate ポーリング）────────────────
    const handleGenerateReel = async () => {
        if (selectedFiles.length === 0) return;

        setReelVideoUrl(null);
        setReelError(null);
        setIsUploading(true);

        let uploadedUrls: string[];
        try {
            uploadedUrls = await uploadAllToSupabase();
            console.log("🎬 Supabase アップロード完了:", uploadedUrls);
        } catch (error: any) {
            console.error("Upload error:", error);
            setReelError(`アップロードに失敗しました: ${error.message}`);
            setIsUploading(false);
            return;
        } finally {
            setIsUploading(false);
        }

        // mediaItems（URL + 各シーンのテロップ設定）を組み立て
        const mediaItems = uploadedUrls.map((url, i) => ({
            url,
            text: mediaSettings[i]?.text ?? "",
            fontSize: mediaSettings[i]?.fontSize ?? "6vmin",
        }));

        // ① Creatomate にレンダリング発注
        setIsGeneratingReel(true);
        let renderId: string;
        try {
            const postRes = await fetch("/api/creatomate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ mediaItems, targetDuration }),
            });
            const postData = await postRes.json();
            if (!postRes.ok) {
                const detail = postData.detail ? `\n詳細: ${postData.detail}` : "";
                throw new Error((postData.error ?? `Server error: ${postRes.status}`) + detail);
            }
            renderId = postData.renderId;
            console.log("🎬 レンダリング発注完了 renderId:", renderId);
        } catch (error: any) {
            console.error("Creatomate POST error:", error);
            setReelError(`リール生成の発注に失敗しました: ${error.message}`);
            setIsGeneratingReel(false);
            return;
        }

        // ② 5秒間隔でステータスをポーリング
        const intervalId = setInterval(async () => {
            try {
                const getRes = await fetch(`/api/creatomate?id=${renderId}`);
                const statusData = await getRes.json();
                console.log("🎬 ポーリング結果:", statusData.status, statusData);

                if (statusData.status === "succeeded") {
                    clearInterval(intervalId);
                    setReelVideoUrl(statusData.url);
                    setIsGeneratingReel(false);
                } else if (statusData.status === "failed") {
                    clearInterval(intervalId);
                    setReelError(`レンダリングが失敗しました: ${statusData.error_message ?? "Unknown error"}`);
                    setIsGeneratingReel(false);
                }
            } catch (error: any) {
                console.error("Polling error:", error);
            }
        }, 5000);
    };

    // ─── ⑤ 投稿用キャプション生成 ─────────────────────────────────
    const handleGenerateVideoCaption = async () => {
        setIsGeneratingCaption(true);
        setGeneratedCaption("");
        try {
            const hints = mediaSettings.map((s) => s.text).filter(Boolean);
            const res = await fetch("/api/generate-video-caption", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    memo: instruction,
                    hints,
                    languages: captionLanguages,
                }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || `Server error: ${res.status}`);
            setGeneratedCaption(data.caption || "");
        } catch (e: any) {
            console.error("Video caption error:", e);
            setGeneratedCaption(`❌ 生成に失敗しました: ${e.message}`);
        } finally {
            setIsGeneratingCaption(false);
        }
    };

    const handleCopyCaption = async () => {
        if (!generatedCaption) return;
        try {
            await navigator.clipboard.writeText(generatedCaption);
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2500);
        } catch {
            alert("コピーに失敗しました。手動で選択してください。");
        }
    };

    // ─── UI ──────────────────────────────────────────────────────
    return (
        <div className="min-h-screen bg-gray-50 text-gray-900">
            <div className="max-w-2xl mx-auto px-4 py-8">

                {/* ── 統一ヘッダー ─────────────────────────────────── */}
                <div className="mb-8">
                    <Link href="/" className="text-blue-600 hover:underline mb-4 inline-block text-sm">
                        ← トップに戻る
                    </Link>
                    <div className="flex items-center gap-3 mb-2">
                        <span className="text-4xl">🎬</span>
                        <h1 className="text-2xl font-bold text-gray-800">リール動画・自動編集（多言語対応）</h1>
                    </div>
                    <p className="text-gray-500 text-sm">
                        動画・画像をアップロードし、多言語テロップ付きのリール動画をAIが自動生成します。
                    </p>
                </div>

                <main className="w-full">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">


                        {/* ─── ファイル選択エリア ─────────────────────────── */}
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                画像・動画を選択
                                <span className="ml-2 text-xs text-gray-400 font-normal">（複数選択可）</span>
                            </label>
                            <div
                                className="border-2 border-dashed border-emerald-200 rounded-xl p-8 flex flex-col items-center justify-center bg-emerald-50 hover:bg-emerald-100 transition-colors cursor-pointer text-center"
                                onClick={() => fileInputRef.current?.click()}
                                onDrop={handleDrop}
                                onDragOver={handleDragOver}
                            >
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    className="hidden"
                                    accept="video/*, image/*"
                                    multiple
                                    onChange={handleFileSelect}
                                />
                                <div className="p-4 bg-white rounded-full mb-3 shadow-sm text-emerald-500">
                                    <ImageIcon className="w-8 h-8" />
                                </div>
                                <p className="text-emerald-800 font-medium">クリックしてファイルを選択</p>
                                <p className="text-sm text-emerald-600 mt-1">またはドラッグ＆ドロップ</p>
                                <p className="text-xs text-emerald-500 mt-1">画像・動画 複数選択対応</p>
                            </div>
                        </div>

                        {/* ─── シーン別テロップエディタ ───────────────────── */}
                        {selectedFiles.length > 0 && (
                            <div className="mb-6">
                                <div className="flex items-center justify-between mb-3">
                                    <p className="text-sm font-medium text-gray-700">
                                        シーン設定
                                        <span className="ml-2 text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">
                                            {selectedFiles.length}件
                                        </span>
                                    </p>
                                    <button
                                        onClick={() => {
                                            previewUrls.forEach((u) => URL.revokeObjectURL(u));
                                            setSelectedFiles([]);
                                            setPreviewUrls([]);
                                            setMediaSettings([]);
                                        }}
                                        className="text-xs text-gray-400 hover:text-red-500 transition-colors"
                                    >
                                        すべて削除
                                    </button>
                                </div>

                                {/* シーンカード（1列リスト） */}
                                <div className="flex flex-col gap-3">
                                    {selectedFiles.map((file, i) => (
                                        <div
                                            key={i}
                                            className="flex gap-3 rounded-xl border border-gray-200 bg-gray-50 p-3 shadow-sm"
                                        >
                                            {/* サムネイル */}
                                            <div className="relative flex-shrink-0 w-24 h-24 rounded-lg overflow-hidden bg-gray-200">
                                                {file.type.startsWith("video/") ? (
                                                    <video
                                                        src={previewUrls[i]}
                                                        className="w-full h-full object-cover"
                                                        preload="metadata"
                                                        muted
                                                    />
                                                ) : (
                                                    <img
                                                        src={previewUrls[i]}
                                                        alt={`preview-${i}`}
                                                        className="w-full h-full object-cover"
                                                    />
                                                )}
                                                {/* ファイルタイプバッジ */}
                                                <span className="absolute bottom-1 left-1 text-white bg-black/50 rounded px-1 py-0.5 text-xs flex items-center gap-0.5">
                                                    {file.type.startsWith("video/") ? (
                                                        <Film className="w-2.5 h-2.5" />
                                                    ) : (
                                                        <ImageIcon className="w-2.5 h-2.5" />
                                                    )}
                                                    {i + 1}
                                                </span>
                                                {/* AI対象バッジ */}
                                                {i === 0 && (
                                                    <span className="absolute top-1 left-1 text-white bg-emerald-500/80 rounded px-1 py-0.5 text-xs leading-none">
                                                        AI
                                                    </span>
                                                )}
                                            </div>

                                            {/* テロップ設定エリア */}
                                            <div className="flex-1 flex flex-col gap-2 min-w-0">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-xs font-semibold text-gray-500">
                                                        Scene {i + 1} — {file.type.startsWith("video/") ? "🎬 動画" : "🖼 画像"}
                                                    </span>
                                                    {/* 削除ボタン */}
                                                    <button
                                                        onClick={() => removeFile(i)}
                                                        className="text-gray-300 hover:text-red-500 transition-colors"
                                                        title="削除"
                                                    >
                                                        <X className="w-4 h-4" />
                                                    </button>
                                                </div>

                                                {/* テロップ入力 */}
                                                <div className="relative">
                                                    <Type className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                                                    <input
                                                        type="text"
                                                        value={mediaSettings[i]?.text ?? ""}
                                                        onChange={(e) => updateMediaSetting(i, { text: e.target.value })}
                                                        placeholder="ヒントを入力（例: ウミガメ、出航）"
                                                        className="w-full pl-7 pr-3 py-1.5 text-sm rounded-lg border border-gray-200 focus:ring-2 focus:ring-violet-400 focus:border-transparent outline-none transition-all bg-white"
                                                        maxLength={20}
                                                    />
                                                </div>

                                                {/* 文字サイズ */}
                                                <select
                                                    value={mediaSettings[i]?.fontSize ?? "6vmin"}
                                                    onChange={(e) => updateMediaSetting(i, { fontSize: e.target.value })}
                                                    className="w-full text-sm rounded-lg border border-gray-200 px-2 py-1.5 bg-white focus:ring-2 focus:ring-violet-400 focus:border-transparent outline-none transition-all"
                                                >
                                                    {FONT_SIZE_OPTIONS.map((opt) => (
                                                        <option key={opt.value} value={opt.value}>
                                                            {opt.label}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>
                                    ))}

                                    {/* ファイル追加ボタン */}
                                    <button
                                        onClick={() => fileInputRef.current?.click()}
                                        className="rounded-xl border-2 border-dashed border-gray-300 hover:border-emerald-400 bg-gray-50 hover:bg-emerald-50 py-4 flex items-center justify-center gap-2 text-gray-400 hover:text-emerald-500 transition-colors text-sm"
                                    >
                                        <span className="text-xl leading-none">+</span>
                                        <span>ファイルを追加</span>
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* ─── 指示・メモ ────────────────────────────────── */}
                        <div className="mb-3">
                            <label htmlFor="caption" className="block text-sm font-medium text-gray-700 mb-2">
                                指示・メモ（オプション）
                            </label>
                            <textarea
                                id="caption"
                                rows={3}
                                className="w-full rounded-lg border-gray-300 border p-3 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
                                placeholder="投稿のトーンやハッシュタグの要望など..."
                                value={instruction}
                                onChange={(e) => setInstruction(e.target.value)}
                            />
                        </div>

                        {/* ─── AIテロップ一括生成ボタン ──────────────────── */}
                        {selectedFiles.length > 0 && (
                            <div className="mb-6">
                                {/* 言語選択 */}
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="text-sm text-gray-600 whitespace-nowrap">🌐 出力言語:</span>
                                    <select
                                        value={targetLanguage}
                                        onChange={(e) => setTargetLanguage(e.target.value)}
                                        className="flex-1 text-sm rounded-lg border border-amber-200 bg-amber-50 text-amber-900 px-3 py-1.5 focus:ring-2 focus:ring-amber-300 focus:border-transparent outline-none transition-all"
                                    >
                                        {TELOP_LANGUAGE_OPTIONS.map((opt) => (
                                            <option key={opt.value} value={opt.value}>
                                                {opt.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <button
                                    onClick={handleGenerateTelops}
                                    disabled={isGeneratingTelops || isGeneratingReel || isUploading}
                                    className={`w-full font-bold py-2.5 px-6 rounded-lg transition-colors flex items-center justify-center gap-2 text-sm shadow-sm hover:shadow-md
                                    ${isGeneratingTelops || isGeneratingReel || isUploading
                                            ? "bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200"
                                            : "bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100"
                                        }`}
                                >
                                    {isGeneratingTelops ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            AIがテロップを考え中...
                                        </>
                                    ) : (
                                        <>
                                            <Sparkles className="w-4 h-4" />
                                            ✨ AIで全シーンのテロップ案を自動生成
                                        </>
                                    )}
                                </button>
                            </div>
                        )}

                        {/* ─── 完成動画の長さ ─────────────────────────────── */}
                        <div className="mb-6">
                            <label htmlFor="targetDuration" className="block text-sm font-medium text-gray-700 mb-2">
                                🎬 完成動画の長さ（テンポ）
                            </label>
                            <div className="relative">
                                <select
                                    id="targetDuration"
                                    value={targetDuration}
                                    onChange={(e) => setTargetDuration(e.target.value)}
                                    className="w-full appearance-none rounded-lg border border-violet-200 bg-violet-50 text-violet-900 font-medium px-4 py-3 pr-10 focus:ring-2 focus:ring-violet-400 focus:border-transparent outline-none transition-all cursor-pointer"
                                >
                                    <option value="original">⏱️ 元の長さのまま結合</option>
                                    <option value="10">⚡ 10秒（テンポ重視・ショート向け）</option>
                                    <option value="15">✨ 15秒（Instagramリール推奨）</option>
                                    <option value="30">🎥 30秒（しっかり見せる）</option>
                                </select>
                                <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-violet-500">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </div>
                            </div>
                        </div>

                        {/* ─── アクションボタン群 ─────────────────────────── */}
                        <div className="flex flex-col gap-3">

                            {/* リール動画を自動生成 */}
                            <button
                                onClick={handleGenerateReel}
                                disabled={selectedFiles.length === 0 || isUploading || isGeneratingReel}
                                className={`w-full text-white font-bold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2 shadow-sm hover:shadow-md ${selectedFiles.length === 0 || isUploading || isGeneratingReel
                                    ? "bg-gray-400 cursor-not-allowed"
                                    : "bg-violet-600 hover:bg-violet-700"
                                    }`}
                            >
                                {isUploading ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        Supabaseにアップロード中...
                                    </>
                                ) : isGeneratingReel ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        🎬 映像工場で生成中... (約1〜2分)
                                    </>
                                ) : (
                                    <>
                                        <Clapperboard className="w-5 h-5" />
                                        リール動画を自動生成
                                        <span className="text-xs opacity-75 font-normal">（全{selectedFiles.length > 0 ? selectedFiles.length : ""}件）</span>
                                    </>
                                )}
                            </button>

                            {/* ─── リール動画 完成表示 ─────────────────────── */}
                            {reelVideoUrl && (

                                <div className="mt-4 p-4 bg-violet-50 border border-violet-200 rounded-xl">
                                    <p className="text-violet-800 font-bold mb-3 flex items-center gap-2">
                                        <Clapperboard className="w-5 h-5" />
                                        🎉 リール動画が完成しました！
                                    </p>
                                    <video
                                        src={reelVideoUrl}
                                        controls
                                        className="w-full rounded-lg shadow-md mb-3"
                                        style={{ maxHeight: "480px" }}
                                    />
                                    <a
                                        href={reelVideoUrl}
                                        download="reel.mp4"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="block w-full text-center bg-violet-600 hover:bg-violet-700 text-white font-bold py-2 px-4 rounded-lg transition-colors"
                                    >
                                        ⬇️ 動画をダウンロード
                                    </a>
                                </div>
                            )}

                            {/* ─── リール動画 エラー表示 ───────────────────── */}
                            {reelError && (
                                <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                                    <p className="text-red-700 text-sm font-medium">❌ {reelError}</p>
                                </div>
                            )}

                        </div>{/* /アクションボタン群 */}
                    </div>{/* /bg-white card */}

                    {/* ──────────────────────────────────────────────────────── */}
                    {/* ─── 📝 投稿用キャプション生成セクション ───────────────── */}
                    {/* ──────────────────────────────────────────────────────── */}
                    <div className="mt-6 bg-white rounded-xl shadow-sm border border-indigo-100 p-6">
                        {/* セクションヘッダー */}
                        <div className="flex items-center gap-2 mb-4">
                            <FileText className="w-5 h-5 text-indigo-500" />
                            <h2 className="font-bold text-gray-800">投稿文・ハッシュタグをAI生成</h2>
                            <span className="ml-auto text-xs text-gray-400">テロップ内容と指示メモを参照</span>
                        </div>

                        {/* ── 追加言語の選択（トグルボタン群） ─────────────── */}
                        <div className="mb-3">
                            <p className="text-xs font-semibold text-gray-500 mb-2">
                                📌 追加する言語を選択（複数可）
                            </p>
                            <div className="flex flex-wrap gap-2">
                                {[
                                    { value: "English", label: "🇺🇸 英語" },
                                    { value: "Traditional Chinese", label: "🇹🇼 繁体字中国語" },
                                    { value: "Simplified Chinese", label: "🇨🇳 簡体字中国語" },
                                    { value: "Korean", label: "🇰🇷 韓国語" },
                                    { value: "Thai", label: "🇹🇭 タイ語" },
                                    { value: "Vietnamese", label: "🇻🇳 ベトナム語" },
                                    { value: "Spanish", label: "🇪🇸 スペイン語" },
                                    { value: "French", label: "🇫🇷 フランス語" },
                                    { value: "Indonesian", label: "🇮🇩 インドネシア語" },
                                ].map(({ value, label }) => {
                                    const active = captionLanguages.includes(value);
                                    return (
                                        <button
                                            key={value}
                                            type="button"
                                            disabled={isGeneratingCaption}
                                            onClick={() =>
                                                setCaptionLanguages((prev) =>
                                                    active
                                                        ? prev.filter((l) => l !== value)
                                                        : [...prev, value]
                                                )
                                            }
                                            className={`text-xs font-medium px-3 py-1.5 rounded-full border transition-all select-none ${active
                                                ? "bg-indigo-500 border-indigo-500 text-white shadow-sm"
                                                : "bg-white border-indigo-200 text-gray-600 hover:border-indigo-400 hover:text-indigo-600"
                                                } ${isGeneratingCaption ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                                        >
                                            {label}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* 注釈 */}
                        <p className="text-xs text-gray-400 mb-4">
                            {captionLanguages.length === 0
                                ? "💬 日本語のみで出力されます（言語を選択すると多言語で出力されます）"
                                : `💬 日本語＋${captionLanguages.length}言語が併記されて出力されます（そのままコピペOK）`}
                        </p>

                        {/* 生成ボタン */}
                        <button
                            onClick={handleGenerateVideoCaption}
                            disabled={isGeneratingCaption}
                            className={`w-full flex items-center justify-center gap-2 rounded-xl py-3 font-bold text-white shadow-sm transition-all mb-2 ${isGeneratingCaption
                                ? "bg-indigo-300 cursor-not-allowed"
                                : "bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-600 hover:to-violet-600 hover:shadow-md active:scale-95"
                                }`}
                        >
                            {isGeneratingCaption ? (
                                <><Loader2 className="w-4 h-4 animate-spin" /> AIが生成中...</>
                            ) : (
                                <><Sparkles className="w-4 h-4" /> 📝 投稿文・ハッシュタグをAI生成</>
                            )}
                        </button>

                        {generatedCaption && (
                            <>
                                <div className="relative">
                                    <textarea
                                        value={generatedCaption}
                                        onChange={(e) => setGeneratedCaption(e.target.value)}
                                        rows={10}
                                        className="w-full p-4 text-sm text-gray-800 bg-indigo-50 border border-indigo-200 rounded-xl resize-y focus:outline-none focus:ring-2 focus:ring-indigo-400 leading-relaxed"
                                        placeholder="生成されたキャプションがここに表示されます"
                                    />
                                </div>
                                <button
                                    onClick={handleCopyCaption}
                                    className={`mt-3 w-full flex items-center justify-center gap-2 rounded-xl py-2.5 font-semibold text-sm border transition-all active:scale-95 ${isCopied
                                        ? "bg-emerald-500 border-emerald-500 text-white"
                                        : "bg-white border-indigo-200 text-indigo-600 hover:bg-indigo-50"
                                        }`}
                                >
                                    {isCopied ? (
                                        <><Check className="w-4 h-4" /> コピーしました！</>
                                    ) : (
                                        <><Copy className="w-4 h-4" /> 📋 クリップボードにコピー</>
                                    )}
                                </button>
                                <p className="text-xs text-gray-400 text-center mt-3">
                                    💡 おすすめ投稿時間：ストーリーズ [7:00-8:00] / 写真 [12:00-13:00] / リール [19:00-21:00]
                                </p>
                            </>
                        )}
                    </div>

                </main>
            </div>
        </div>
    );
}
