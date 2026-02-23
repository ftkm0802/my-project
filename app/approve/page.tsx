"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Check, X, RefreshCw, Copy, ExternalLink, Hash, Minimize2 } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

interface GeneratedData {
    image: string;
    ja: string;
    en: string;
    zh: string;
    ko: string;
    hashtags: string[];
}

type LangCode = "ja" | "en" | "zh" | "ko";

const LANGUAGES = [
    { id: "ja", label: "日本語 (JA)" },
    { id: "en", label: "English (EN)" },
    { id: "zh", label: "繁体字 (ZH)" },
    { id: "ko", label: "한국어 (KO)" },
] as const;

export default function ApprovePage() {
    const router = useRouter();

    // Data State
    const [originalData, setOriginalData] = useState<GeneratedData | null>(null);
    const [captions, setCaptions] = useState<Record<LangCode, string>>({
        ja: "", en: "", zh: "", ko: ""
    });
    const [hashtags, setHashtags] = useState<string>("");

    // Export State
    const [selectedExportLangs, setSelectedExportLangs] = useState<Record<LangCode, boolean>>({
        ja: true, en: true, zh: false, ko: false
    });

    // UI State
    const [selectedLang, setSelectedLang] = useState<LangCode>("ja");
    const [isCopied, setIsCopied] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    // Load Data
    useEffect(() => {
        const storedData = localStorage.getItem("generatedPost");
        if (storedData) {
            try {
                const parsed: GeneratedData = JSON.parse(storedData);
                setOriginalData(parsed);
                setCaptions({
                    ja: parsed.ja || "",
                    en: parsed.en || "",
                    zh: parsed.zh || "",
                    ko: parsed.ko || "",
                });
                setHashtags(parsed.hashtags.join(" "));
                setIsLoading(false);
            } catch (e) {
                console.error("Failed to parse stored data", e);
                setIsLoading(false);
            }
        } else {
            setIsLoading(false);
        }
    }, []);

    // Computed Combined Text
    const combinedText = useMemo(() => {
        const parts = [];
        if (selectedExportLangs.ja) parts.push(captions.ja);
        if (selectedExportLangs.en) parts.push(captions.en);
        if (selectedExportLangs.zh) parts.push(captions.zh);
        if (selectedExportLangs.ko) parts.push(captions.ko);

        if (parts.length === 0) return "";

        // Join languages with double newline
        let text = parts.filter(p => p.trim() !== "").join("\n\n");

        // Append hashtags
        if (hashtags.trim()) {
            text += `\n\n${hashtags}`;
        }

        return text;
    }, [captions, hashtags, selectedExportLangs]);

    // Handlers
    const handleCaptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setCaptions(prev => ({
            ...prev,
            [selectedLang]: e.target.value
        }));
    };

    const handleHashtagsChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setHashtags(e.target.value);
    };

    const toggleExportLang = (lang: LangCode) => {
        setSelectedExportLangs(prev => ({
            ...prev,
            [lang]: !prev[lang]
        }));
    };

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(combinedText);
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000);
        } catch (err) {
            console.error("Failed to copy", err);
            alert("コピーに失敗しました");
        }
    };

    const handleApprove = () => {
        if (!originalData) return;

        // Create the final approved post object
        const approvedPost = {
            id: Date.now().toString(),
            image: originalData.image,
            captions: captions, // Save all edited captions
            caption: captions[selectedLang], // For Dashboard compatibility (primary view)
            selectedCaption: captions[selectedLang], // Legacy
            hashtags: hashtags.split(" ").filter(t => t.trim() !== ""),
            timestamp: new Date().toISOString(),
            primaryLang: selectedLang,
        };

        try {
            const existingPosts = JSON.parse(localStorage.getItem("approvedPosts") || "[]");
            localStorage.setItem("approvedPosts", JSON.stringify([approvedPost, ...existingPosts]));

            localStorage.removeItem("generatedPost");

            alert("投稿を承認しました！ダッシュボードに保存されました。");
            router.push("/");
        } catch (e) {
            console.error("Failed to save post", e);
            alert("保存に失敗しました。ローカルストレージが一杯かもしれません。");
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mb-4"></div>
                <p className="text-gray-600">データを読み込み中...</p>
            </div>
        );
    }

    if (!originalData) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
                <p className="text-gray-500 mb-4">承認待ちのデータがありません。</p>
                <Link href="/image-editor" className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors">
                    画像・キャプション編集へ
                </Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 text-gray-900 font-sans pb-20">
            {/* Header */}
            <header className="bg-emerald-500 text-white p-4 shadow-md sticky top-0 z-10 transition-colors">
                <div className="max-w-6xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Link href="/" className="hover:bg-emerald-600 p-2 rounded-full transition-colors" title="トップに戻る">
                            <ArrowLeft className="w-5 h-5" />
                        </Link>
                        <h1 className="text-lg font-bold">編集と承認</h1>
                    </div>
                    <div className="text-xs bg-emerald-600 px-2 py-1 rounded shadow-sm">
                        Auto-Generated
                    </div>
                </div>
            </header>

            <main className="max-w-6xl mx-auto p-4 md:p-6 space-y-6">

                {/* Main Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                    {/* Left Column (4/12): Image & Hashtags */}
                    <div className="lg:col-span-4 space-y-4">
                        {/* Image Card */}
                        <div className="bg-white p-2 rounded-2xl shadow-sm border border-gray-100">
                            <div className="aspect-square relative rounded-xl overflow-hidden bg-gray-100 group">
                                <img
                                    src={originalData.image}
                                    alt="Generated content"
                                    className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-700"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
                            </div>
                        </div>

                        {/* Hashtags Section */}
                        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                            <div className="flex items-center gap-2 mb-3 text-emerald-600">
                                <Hash className="w-5 h-5" />
                                <h3 className="font-bold">Hashtags</h3>
                            </div>
                            <textarea
                                value={hashtags}
                                onChange={handleHashtagsChange}
                                className="w-full min-h-[100px] p-3 text-sm text-gray-600 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all resize-none"
                                placeholder="#example #ocean"
                            />
                            <p className="text-xs text-gray-400 mt-2 text-right">スペース区切りで入力</p>
                        </div>
                    </div>

                    {/* Center Column (5/12): Editor Tabs */}
                    <div className="lg:col-span-5 space-y-4">
                        {/* Language Tabs */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col h-[600px]">
                            <div className="flex border-b border-gray-100 overflow-x-auto scrollbar-hide shrink-0">
                                {LANGUAGES.map((lang) => (
                                    <button
                                        key={lang.id}
                                        onClick={() => setSelectedLang(lang.id as LangCode)}
                                        className={cn(
                                            "flex-1 px-3 py-4 text-sm font-medium whitespace-nowrap transition-colors relative",
                                            selectedLang === lang.id
                                                ? "text-emerald-600 bg-emerald-50/50"
                                                : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                                        )}
                                    >
                                        {lang.label}
                                        {selectedLang === lang.id && (
                                            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500" />
                                        )}
                                    </button>
                                ))}
                            </div>

                            {/* Caption Editor */}
                            <div className="p-5 flex-1 flex flex-col">
                                <div className="flex justify-between items-center mb-2 shrink-0">
                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                                        Edit: {LANGUAGES.find(l => l.id === selectedLang)?.label}
                                    </label>
                                    <span className="text-xs text-gray-300">
                                        {captions[selectedLang].length} chars
                                    </span>
                                </div>
                                <textarea
                                    value={captions[selectedLang]}
                                    onChange={handleCaptionChange}
                                    className="w-full flex-1 p-4 text-base leading-relaxed text-gray-700 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all resize-none"
                                    placeholder="キャプションを入力..."
                                />
                            </div>
                        </div>
                    </div>

                    {/* Right Column (3/12): Combined Export */}
                    <div className="lg:col-span-3 space-y-4">
                        <div className="bg-emerald-900 text-emerald-50 p-5 rounded-2xl shadow-lg border border-emerald-800 h-full flex flex-col">
                            <div className="mb-4">
                                <h3 className="font-bold flex items-center gap-2 text-white">
                                    <Copy className="w-4 h-4" />
                                    Combined Export
                                </h3>
                                <p className="text-xs text-emerald-300 mt-1">Select languages to include</p>
                            </div>

                            {/* Checkboxes */}
                            <div className="grid grid-cols-2 gap-2 mb-4">
                                {LANGUAGES.map((lang) => (
                                    <label key={lang.id} className="flex items-center gap-2 cursor-pointer p-2 rounded-lg hover:bg-white/5 transition-colors">
                                        <input
                                            type="checkbox"
                                            checked={selectedExportLangs[lang.id as LangCode]}
                                            onChange={() => toggleExportLang(lang.id as LangCode)}
                                            className="w-4 h-4 rounded border-emerald-500 text-emerald-600 focus:ring-emerald-500 bg-white/10"
                                        />
                                        <span className="text-sm font-medium">{lang.id.toUpperCase()}</span>
                                    </label>
                                ))}
                            </div>

                            {/* Combined Preview */}
                            <div className="flex-1 min-h-[200px] bg-black/20 rounded-xl p-3 mb-4 border border-white/10 overflow-hidden flex flex-col">
                                <p className="text-[10px] text-emerald-400 mb-2 uppercase tracking-wider font-bold">Total Preview</p>
                                <textarea
                                    readOnly
                                    value={combinedText}
                                    className="w-full flex-1 bg-transparent text-xs text-emerald-50 resize-none outline-none scrollbar-thin scrollbar-thumb-white/20"
                                />
                            </div>

                            {/* Actions */}
                            <div className="space-y-3 mt-auto">
                                <button
                                    onClick={handleCopy}
                                    className={cn(
                                        "w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold transition-all shadow-lg text-sm",
                                        isCopied
                                            ? "bg-white text-emerald-900"
                                            : "bg-emerald-500 text-white hover:bg-emerald-400"
                                    )}
                                >
                                    {isCopied ? (
                                        <>
                                            <Check className="w-4 h-4" />
                                            Copied!
                                        </>
                                    ) : (
                                        <>
                                            <Copy className="w-4 h-4" />
                                            Copy All
                                        </>
                                    )}
                                </button>

                                <button
                                    onClick={handleApprove}
                                    className="w-full flex items-center justify-center gap-2 py-3 bg-white/10 text-emerald-100 rounded-xl hover:bg-white/20 font-medium text-sm transition-colors border border-white/10"
                                >
                                    Save to History
                                </button>
                            </div>
                        </div>
                    </div>

                </div>
            </main>
        </div>
    );
}
