import Link from "next/link";
import { ArrowLeft, Check, X, RefreshCw } from "lucide-react";

export default function ApprovePage() {
    return (
        <div className="min-h-screen bg-gray-50 text-gray-900">
            <header className="bg-emerald-500 text-white p-4 shadow-md">
                <div className="max-w-4xl mx-auto flex items-center gap-4">
                    <Link href="/" className="hover:bg-emerald-600 p-2 rounded-full transition-colors">
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <h1 className="text-xl font-bold">投稿の承認</h1>
                </div>
            </header>

            <main className="max-w-2xl mx-auto p-4 py-8">
                <div className="space-y-6">
                    {/* Mock Post Card 1 */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="aspect-square bg-gray-200 relative">
                            {/* Placeholder for post image */}
                            <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                                Image Preview
                            </div>
                        </div>
                        <div className="p-6">
                            <div className="flex gap-2 mb-4">
                                <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-bold rounded-full">承認待ち</span>
                            </div>
                            <h3 className="font-bold text-lg mb-2">週末の釣り大会のお知らせ</h3>
                            <p className="text-gray-600 text-sm whitespace-pre-wrap mb-4">
                                {`今週末は恒例の釣り大会を開催します！🎣
天気も良さそうなので、ぜひご参加ください。

#釣り #海釣り #週末イベント #マリンスポーツ`}
                            </p>

                            <div className="grid grid-cols-2 gap-3">
                                <button className="flex items-center justify-center gap-2 py-2 px-4 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 font-medium transition-colors">
                                    <X className="w-4 h-4" />
                                    却下・修正
                                </button>
                                <button className="flex items-center justify-center gap-2 py-2 px-4 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 font-bold shadow-sm transition-colors">
                                    <Check className="w-4 h-4" />
                                    承認する
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Empty State Mock */}
                    <div className="text-center py-12 px-4">
                        <p className="text-gray-500 text-sm">現在、他に確認待ちの投稿はありません。</p>
                    </div>
                </div>
            </main>
        </div>
    );
}
