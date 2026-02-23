"use client";

import Link from "next/link";
import MotivationDashboard from "@/components/MotivationDashboard";

const MENU_ITEMS = [
  {
    href: "/image-editor",
    emoji: "🖼️",
    title: "画像生成・編集",
    subtitle: "多言語対応",
    description: "インバウンド対応の多言語キャプションとハッシュタグをAIが自動生成します。",
    gradient: "from-sky-500 to-cyan-400",
    border: "border-sky-100",
    bg: "bg-sky-50",
    textColor: "text-sky-900",
    descColor: "text-sky-700",
  },
  {
    href: "/upload",
    emoji: "🎬",
    title: "リール動画・自動編集",
    subtitle: "テロップ付き",
    description: "複数の動画とヒントから、テロップ付きのバズるリール動画を自動生成します。",
    gradient: "from-violet-500 to-purple-400",
    border: "border-violet-100",
    bg: "bg-violet-50",
    textColor: "text-violet-900",
    descColor: "text-violet-700",
  },
  {
    href: "/ai-director",
    emoji: "🧑🏫",
    title: "AIディレクター",
    subtitle: "企画・構成提案",
    description: "目的やターゲットに合わせて、最適なSNS企画や構成案をAIが提案します。",
    gradient: "from-orange-500 to-pink-400",
    border: "border-orange-100",
    bg: "bg-orange-50",
    textColor: "text-orange-900",
    descColor: "text-orange-700",
  },
  {
    href: "/trend-radar",
    emoji: "📡",
    title: "最新トレンドレーダー",
    subtitle: "リアルタイム分析",
    description: "現在バズっているトレンド楽曲、人気フォーマット、ハッシュタグを分析します。",
    gradient: "from-indigo-500 to-blue-400",
    border: "border-indigo-100",
    bg: "bg-indigo-50",
    textColor: "text-indigo-900",
    descColor: "text-indigo-700",
  },
];

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 shadow-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-yellow-400 via-orange-500 to-purple-600 p-[2px]">
              <div className="w-full h-full rounded-full bg-white flex items-center justify-center">
                <span className="text-sm">✨</span>
              </div>
            </div>
            <h1 className="font-bold text-xl tracking-tight bg-gradient-to-r from-orange-500 to-purple-600 bg-clip-text text-transparent">
              BC AI-Gram
            </h1>
          </div>
          <Link
            href="/settings"
            className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500 hover:text-gray-700"
            title="設定"
          >
            ⚙️
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-10">
        {/* Hero text */}
        <div className="text-center mb-10">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">
            何をしますか？
          </h2>
          <p className="text-gray-500 text-sm">利用したい機能をタップしてください</p>
        </div>

        {/* Motivation Dashboard */}
        <MotivationDashboard />

        {/* 4-card grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {MENU_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`group block rounded-2xl border ${item.border} ${item.bg} p-6 shadow-sm hover:-translate-y-1 hover:shadow-xl transition-all duration-200`}
            >
              {/* Emoji icon */}
              <div className="mb-4">
                <span className="text-5xl">{item.emoji}</span>
              </div>

              {/* Title */}
              <div className="mb-1">
                <h3 className={`text-lg font-bold ${item.textColor}`}>
                  {item.title}
                </h3>
                <span className={`text-xs font-medium ${item.descColor} opacity-70`}>
                  {item.subtitle}
                </span>
              </div>

              {/* Description */}
              <p className={`text-sm ${item.descColor} leading-relaxed mb-4`}>
                {item.description}
              </p>

              {/* Arrow */}
              <div className={`flex items-center gap-1 text-sm font-semibold ${item.textColor} opacity-60 group-hover:opacity-100 group-hover:gap-2 transition-all`}>
                <span>開く</span>
                <span>→</span>
              </div>
            </Link>
          ))}
        </div>


      </main>
    </div>
  );
}
