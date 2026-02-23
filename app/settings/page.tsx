"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Save, Info, AlertCircle } from "lucide-react";

interface AppSettings {
    brandConcept: string;
    mandatoryHashtags: string;
    benchmarkAccounts: string;
}

const DEFAULT_SETTINGS: AppSettings = {
    brandConcept: "石垣島・川平渾の息をのむような「カビラブルー」の絶景と、心揺さぶる感動的なマリン体験を世界へ届ける公式アカウント。グラスボートを通じて、ウミガメやサンゴ礁といった大自然の奇跡を案内します。投稿は、親しみやすくポジティブで、読者が「今すぐ石垣島に行きたい！」と憧れるようなエモーショナルなトーンにしてください。インバウンド観光客にも日本の海の魅力を最大限にアピールします。",
    mandatoryHashtags: "#BLUECORAL #石垣島 #川平渾 #カビラブルー #石垣島旅行 #石垣島観光 #沖縄旅行 #絶景スポット #グラスボート #ishigaki #kabirabay #japantrip #okinawatrip",
    benchmarkAccounts: "",
};

export default function SettingsPage() {
    const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
    const [isSaved, setIsSaved] = useState(false);

    useEffect(() => {
        const stored = localStorage.getItem("bc_app_settings");
        if (stored) {
            try {
                setSettings(JSON.parse(stored));
            } catch (e) {
                console.error("Failed to parse settings", e);
            }
        } else {
            // 初回起動時はデフォルト値をlocalStorageに即座に保存
            localStorage.setItem("bc_app_settings", JSON.stringify(DEFAULT_SETTINGS));
        }
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setSettings((prev) => ({ ...prev, [name]: value }));
        setIsSaved(false);
    };

    const handleSave = () => {
        localStorage.setItem("bc_app_settings", JSON.stringify(settings));
        setIsSaved(true);
        setTimeout(() => setIsSaved(false), 3000);
        alert("設定を保存しました！");
    };

    return (
        <div className="min-h-screen bg-gray-50 text-gray-900 font-sans pb-20">
            <header className="bg-emerald-500 text-white p-4 shadow-md sticky top-0 z-10 transition-colors">
                <div className="max-w-2xl mx-auto flex items-center gap-4">
                    <Link href="/" className="hover:bg-emerald-600 p-2 rounded-full transition-colors">
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <h1 className="text-xl font-bold">システム設定</h1>
                </div>
            </header>

            <main className="max-w-2xl mx-auto p-4 md:p-6 space-y-8">

                <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-xl flex items-start gap-3">
                    <Info className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                    <div className="text-sm text-emerald-800">
                        <p className="font-bold mb-1">AI Persona Settings</p>
                        <p>これらの設定はAIの投稿生成に直接影響します。ブランドの一貫性を保つために、詳細に入力することをお勧めします。</p>
                    </div>
                </div>

                {/* Brand Concept */}
                <section className="space-y-3">
                    <div className="flex items-center gap-2">
                        <span className="text-2xl">🏢</span>
                        <label htmlFor="brandConcept" className="font-bold text-gray-800">
                            BCのブランドコンセプト・ターゲット層
                        </label>
                    </div>
                    <textarea
                        id="brandConcept"
                        name="brandConcept"
                        rows={5}
                        value={settings.brandConcept}
                        onChange={handleChange}
                        className="w-full p-4 rounded-xl border border-gray-300 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
                        placeholder="例: 親しみやすいトーンで、20-30代のカップルや海外旅行客へアピール。カビラブルーの美しさと、スタッフの温かさを伝える..."
                    />
                </section>

                {/* Mandatory Hashtags */}
                <section className="space-y-3">
                    <div className="flex items-center gap-2">
                        <span className="text-2xl">🏷️</span>
                        <label htmlFor="mandatoryHashtags" className="font-bold text-gray-800">
                            必須ハッシュタグ
                        </label>
                    </div>
                    <input
                        type="text"
                        id="mandatoryHashtags"
                        name="mandatoryHashtags"
                        value={settings.mandatoryHashtags}
                        onChange={handleChange}
                        className="w-full p-4 rounded-xl border border-gray-300 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
                        placeholder="#カビラブルー #石垣島 #グラスボート"
                    />
                    <p className="text-xs text-gray-500 text-right">スペース区切りで入力</p>
                </section>

                {/* Benchmark Accounts */}
                <section className="space-y-3">
                    <div className="flex items-center gap-2">
                        <span className="text-2xl">👀</span>
                        <label htmlFor="benchmarkAccounts" className="font-bold text-gray-800">
                            監視するベンチマークアカウント
                        </label>
                    </div>
                    <textarea
                        id="benchmarkAccounts"
                        name="benchmarkAccounts"
                        rows={3}
                        value={settings.benchmarkAccounts}
                        onChange={handleChange}
                        className="w-full p-4 rounded-xl border border-gray-300 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
                        placeholder="例: @ishigaki_navi, @okinawa_travel"
                    />
                    <div className="flex items-start gap-2 text-xs text-gray-500">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <p>AIはこれらのアカウントのスタイルを参考にしようとします（実際の投稿は見れませんが、スタイルガイドとして認識します）。</p>
                    </div>
                </section>

                <hr className="border-gray-200" />

                {/* Save Button */}
                <button
                    onClick={handleSave}
                    className={`w-full py-4 rounded-xl font-bold text-white text-lg shadow-md transition-all flex items-center justify-center gap-2 ${isSaved ? "bg-emerald-600" : "bg-emerald-500 hover:bg-emerald-600 hover:shadow-lg"
                        }`}
                >
                    <Save className="w-5 h-5" />
                    {isSaved ? "保存しました！" : "設定を保存"}
                </button>

            </main>
        </div>
    );
}
