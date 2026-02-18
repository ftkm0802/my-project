import Link from "next/link";
import { Camera, CheckCircle, BarChart3, Settings } from "lucide-react";

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <header className="bg-emerald-500 text-white p-4 shadow-md">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <h1 className="text-xl font-bold">Instagram 自動化</h1>
          <nav className="flex gap-4">
            <Link href="/" className="hover:underline">ダッシュボード</Link>
            <Link href="/settings" className="hover:underline"><Settings className="w-5 h-5" /></Link>
          </nav>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4 py-8">
        <h2 className="text-2xl font-bold mb-6">ダッシュボード</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Link href="/upload" className="block p-6 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow border border-emerald-100 group">
            <div className="flex items-center gap-4 mb-2">
              <div className="p-3 bg-emerald-100 rounded-full group-hover:bg-emerald-200 transition-colors">
                <Camera className="w-6 h-6 text-emerald-600" />
              </div>
              <h3 className="text-lg font-semibold text-emerald-900">新規投稿</h3>
            </div>
            <p className="text-sm text-gray-500">写真や動画をアップロードして投稿を作成します。</p>
          </Link>

          <Link href="/approve" className="block p-6 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow border border-emerald-100 group">
            <div className="flex items-center gap-4 mb-2">
              <div className="p-3 bg-emerald-100 rounded-full group-hover:bg-emerald-200 transition-colors">
                <CheckCircle className="w-6 h-6 text-emerald-600" />
              </div>
              <h3 className="text-lg font-semibold text-emerald-900">承認待ち</h3>
            </div>
            <p className="text-sm text-gray-500">AIが生成した投稿を確認・承認します。</p>
          </Link>

          <div className="p-6 bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center gap-4 mb-2">
              <div className="p-3 bg-gray-100 rounded-full">
                <BarChart3 className="w-6 h-6 text-gray-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">ステータス</h3>
            </div>
            <p className="text-sm text-gray-500">今月の投稿数: <span className="font-bold text-emerald-600">12</span></p>
          </div>
        </div>

        <section>
          <h3 className="text-xl font-bold mb-4">最近のアクティビティ</h3>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center">
              <span className="text-sm font-medium text-gray-600">2024.10.27 14:30</span>
              <span className="px-2 py-1 text-xs font-medium bg-emerald-100 text-emerald-700 rounded-full">投稿完了</span>
            </div>
            <div className="p-4">
              <p className="text-gray-800">「秋の海釣りツアー募集開始！」の投稿が完了しました。</p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
