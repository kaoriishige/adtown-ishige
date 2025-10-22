// Next.js Modules
import { NextPage } from 'next';
import Head from 'next/head';
import Link from 'next/link';
// React Hooks
import React, { useState, useCallback } from 'react';
// Icons
import { FileText, Download, CheckCircle, AlertTriangle, RefreshCw } from 'lucide-react';

// --- エクスポートオプションの定義 ---
interface ExportOption {
    id: string;
    label: string;
    apiPath: string; // 呼び出すAPIのパス
    fileName: string; // ダウンロード時のファイル名
}

const EXPORT_OPTIONS: ExportOption[] = [
    {
        id: 'users',
        label: '全ユーザーリスト (一般 & パートナー)',
        apiPath: '/api/admin/export-users', // 既存API
        fileName: 'users_all.csv',
    },
    {
        id: 'partners',
        label: '全パートナーリスト (企業/店舗情報)',
        apiPath: '/api/admin/export-partners', // (未作成)
        fileName: 'partners_all.csv',
    },
    {
        id: 'payments',
        label: '紹介料支払い実績',
        apiPath: '/api/admin/export-payments', // (未作成)
        fileName: 'referral_payouts.csv',
    },
];

// --- メインコンポーネント ---
const AdminExportPage: NextPage = () => {
    // 開発完了まで認証を解除している状態を維持するため、getServerSidePropsは省略します。
    const [selectedOption, setSelectedOption] = useState<string>(EXPORT_OPTIONS[0].id);
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    const handleExport = useCallback(async () => {
        const option = EXPORT_OPTIONS.find(opt => opt.id === selectedOption);
        if (!option) {
            setMessage({ type: 'error', text: 'エクスポートオプションが選択されていません。' });
            return;
        }

        setMessage(null);
        setIsLoading(true);

        try {
            const response = await fetch(option.apiPath, {
                method: 'GET',
                // APIはCSVを直接返すため、JSONではなく生のレスポンスを受け取る
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(errorText || 'データの取得に失敗しました。');
            }

            // Blobとしてレスポンスを受け取る
            const blob = await response.blob();
            
            // aタグを作成し、ダウンロードをトリガー
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = option.fileName;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url); // メモリ解放

            setMessage({ type: 'success', text: `✅ ${option.label} のエクスポートが完了しました。` });

        } catch (err: any) {
            const errorMsg = err.message.includes('404') ? 
                             'APIが見つかりません。パスを確認してください。' : 
                             err.message || 'CSVエクスポート中に予期せぬエラーが発生しました。';
            setMessage({ type: 'error', text: `❌ エラー: ${errorMsg}` });
        } finally {
            setIsLoading(false);
            setTimeout(() => setMessage(null), 7000);
        }
    }, [selectedOption]);


    return (
        <div className="min-h-screen bg-gray-100 p-4 sm:p-8">
            <Head>
                <title>{"CSV出力 - 管理者ページ"}</title>
            </Head>
            <div className="max-w-4xl mx-auto">
                <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center">
                    <h1 className="text-3xl font-bold text-gray-800 flex items-center">
                        <FileText className="w-8 h-8 mr-2 text-indigo-600"/>
                        CSV出力
                    </h1>
                    <Link href="/admin" className="text-sm text-blue-600 hover:underline mt-2 sm:mt-0">
                        ← 管理メニューに戻る
                    </Link>
                </div>

                {/* メッセージエリア */}
                {message && (
                    <div className={`p-4 rounded-md mb-6 flex items-center ${
                        message.type === 'success' ? 'bg-green-100 border-l-4 border-green-500 text-green-700' : 
                        'bg-red-100 border-l-4 border-red-500 text-red-700'
                    }`}>
                        {message.type === 'success' ? <CheckCircle className="w-5 h-5 mr-3"/> : <AlertTriangle className="w-5 h-5 mr-3"/>}
                        <p className="text-sm font-semibold">{message.text}</p>
                    </div>
                )}
                
                <div className="bg-white p-6 rounded-lg shadow-xl border-t-4 border-indigo-500 space-y-6">
                    <h2 className="text-xl font-semibold text-gray-800 mb-4 border-b pb-2">エクスポートするデータを選択</h2>
                    
                    {/* データ選択ドロップダウン */}
                    <div>
                        <label htmlFor="export-data" className="block text-sm font-medium text-gray-700 mb-2">
                            データセット
                        </label>
                        <select
                            id="export-data"
                            value={selectedOption}
                            onChange={(e) => setSelectedOption(e.target.value)}
                            className="w-full p-3 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-gray-700"
                            disabled={isLoading}
                        >
                            {EXPORT_OPTIONS.map(option => (
                                <option key={option.id} value={option.id}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="pt-4">
                        <button
                            type="button"
                            onClick={handleExport}
                            disabled={isLoading}
                            className={`w-full flex items-center justify-center py-3 px-6 rounded-md text-white font-bold transition-colors shadow-lg ${
                                isLoading ? 'bg-gray-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'
                            }`}
                        >
                            {isLoading ? (
                                <>
                                    <RefreshCw className="w-5 h-5 mr-3 animate-spin"/>
                                    ファイル生成中...
                                </>
                            ) : (
                                <>
                                    <Download className="w-5 h-5 mr-3"/>
                                    CSVファイルをダウンロード
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminExportPage;


