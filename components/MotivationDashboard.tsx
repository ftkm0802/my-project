"use client";

import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from "recharts";
import { Eye, Bookmark, PlayCircle, TrendingUp } from "lucide-react";

// ─── Mock data (Phase 2.0 placeholder — replace with real API in Phase 2.5) ───
const weeklyData = [
    { day: "月", reach: 420 },
    { day: "火", reach: 580 },
    { day: "水", reach: 510 },
    { day: "木", reach: 720 },
    { day: "金", reach: 890 },
    { day: "土", reach: 1120 },
    { day: "日", reach: 1280 },
];

const KPI_CARDS = [
    {
        icon: Eye,
        label: "今週の総リーチ数",
        value: "4,250",
        unit: "回",
        badge: "+12%",
        badgeColor: "bg-sky-100 text-sky-700",
        iconBg: "bg-sky-100",
        iconColor: "text-sky-500",
        trend: "📈 前週比",
    },
    {
        icon: Bookmark,
        label: "獲得保存数",
        value: "24",
        unit: "件",
        badge: "+300%",
        badgeColor: "bg-emerald-100 text-emerald-700",
        iconBg: "bg-emerald-100",
        iconColor: "text-emerald-500",
        trend: "🔥 前週比",
    },
    {
        icon: PlayCircle,
        label: "リール最高再生数",
        value: "1,280",
        unit: "回",
        badge: "🎬 NEW",
        badgeColor: "bg-violet-100 text-violet-700",
        iconBg: "bg-violet-100",
        iconColor: "text-violet-500",
        trend: "今週の最高記録",
    },
];

// Custom Tooltip for recharts
function CustomTooltip({
    active,
    payload,
    label,
}: {
    active?: boolean;
    payload?: { value: number }[];
    label?: string;
}) {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white border border-sky-100 rounded-xl shadow-lg px-4 py-2">
                <p className="text-xs text-gray-400 mb-0.5">{label}曜日</p>
                <p className="text-base font-bold text-sky-600">
                    {payload[0].value.toLocaleString()}
                    <span className="text-xs font-normal text-gray-400 ml-1">リーチ</span>
                </p>
            </div>
        );
    }
    return null;
}

export default function MotivationDashboard() {
    return (
        <section className="mb-8 rounded-3xl overflow-hidden border border-sky-100 bg-white shadow-md">
            {/* Header */}
            <div className="bg-gradient-to-r from-sky-500 to-blue-600 px-6 py-4 flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-white" />
                </div>
                <div>
                    <h2 className="text-white font-bold text-base leading-tight">
                        📊 今週のインサイト&amp;成果
                    </h2>
                    <p className="text-sky-200 text-xs">※ API接続テスト中・表示はモックデータです</p>
                </div>
            </div>

            <div className="px-4 py-5 space-y-5">
                {/* KPI Cards */}
                <div className="grid grid-cols-3 gap-3">
                    {KPI_CARDS.map((card) => {
                        const Icon = card.icon;
                        return (
                            <div
                                key={card.label}
                                className="rounded-2xl border border-gray-100 bg-gray-50 p-3 flex flex-col gap-1.5 shadow-sm"
                            >
                                <div className={`w-8 h-8 rounded-full ${card.iconBg} flex items-center justify-center`}>
                                    <Icon className={`w-4 h-4 ${card.iconColor}`} />
                                </div>
                                <p className="text-[10px] text-gray-400 leading-tight">{card.label}</p>
                                <p className="text-xl font-extrabold text-gray-800 leading-tight">
                                    {card.value}
                                    <span className="text-xs font-normal text-gray-400 ml-0.5">{card.unit}</span>
                                </p>
                                <div className="flex items-center gap-1 flex-wrap">
                                    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${card.badgeColor}`}>
                                        {card.badge}
                                    </span>
                                    <span className="text-[10px] text-gray-400">{card.trend}</span>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Area Chart */}
                <div>
                    <p className="text-xs font-semibold text-gray-500 mb-2 px-1">
                        📈 過去7日間のリーチ数推移
                    </p>
                    <div className="h-44">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart
                                data={weeklyData}
                                margin={{ top: 5, right: 8, left: -24, bottom: 0 }}
                            >
                                <defs>
                                    <linearGradient id="reachGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.35} />
                                        <stop offset="95%" stopColor="#2563eb" stopOpacity={0.02} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f0f4f8" vertical={false} />
                                <XAxis
                                    dataKey="day"
                                    tick={{ fontSize: 11, fill: "#94a3b8" }}
                                    axisLine={false}
                                    tickLine={false}
                                    tickFormatter={(v) => `${v}曜`}
                                />
                                <YAxis
                                    tick={{ fontSize: 10, fill: "#94a3b8" }}
                                    axisLine={false}
                                    tickLine={false}
                                />
                                <Tooltip content={<CustomTooltip />} />
                                <Area
                                    type="monotone"
                                    dataKey="reach"
                                    stroke="#0ea5e9"
                                    strokeWidth={2.5}
                                    fill="url(#reachGradient)"
                                    dot={{ r: 4, fill: "#0ea5e9", strokeWidth: 2, stroke: "#fff" }}
                                    activeDot={{ r: 6, fill: "#2563eb", strokeWidth: 2, stroke: "#fff" }}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </section>
    );
}
