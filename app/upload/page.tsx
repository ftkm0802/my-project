import Link from "next/link";
import { ArrowLeft, Upload as UploadIcon, Image as ImageIcon } from "lucide-react";

export default function UploadPage() {
    return (
        <div className="min-h-screen bg-gray-50 text-gray-900">
            <header className="bg-emerald-500 text-white p-4 shadow-md">
                <div className="max-w-4xl mx-auto flex items-center gap-4">
                    <Link href="/" className="hover:bg-emerald-600 p-2 rounded-full transition-colors">
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <h1 className="text-xl font-bold">新規投稿のアップロード</h1>
                </div>
            </header>

            <main className="max-w-2xl mx-auto p-4 py-8">
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            画像・動画を選択
                        </label>
                        <div className="border-2 border-dashed border-emerald-200 rounded-xl p-8 flex flex-col items-center justify-center bg-emerald-50 hover:bg-emerald-100 transition-colors cursor-pointer text-center">
                            <div className="p-4 bg-white rounded-full mb-3 shadow-sm text-emerald-500">
                                <ImageIcon className="w-8 h-8" />
                            </div>
                            <p className="text-emerald-800 font-medium">クリックしてファイルを選択</p>
                            <p className="text-sm text-emerald-600 mt-1">またはドラッグ＆ドロップ</p>
                        </div>
                    </div>

                    <div className="mb-6">
                        <label htmlFor="caption" className="block text-sm font-medium text-gray-700 mb-2">
                            指示・メモ（オプション）
                        </label>
                        <textarea
                            id="caption"
                            rows={4}
                            className="w-full rounded-lg border-gray-300 border p-3 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
                            placeholder="投稿のトーンやハッシュタグの要望など..."
                        ></textarea>
                    </div>

                    <button className="w-full bg-emerald-500 text-white font-bold py-3 px-6 rounded-lg hover:bg-emerald-600 transition-colors flex items-center justify-center gap-2 shadow-sm hover:shadow-md">
                        <UploadIcon className="w-5 h-5" />
                        アップロードしてAI生成
                    </button>
                </div>
            </main>
        </div>
    );
}
