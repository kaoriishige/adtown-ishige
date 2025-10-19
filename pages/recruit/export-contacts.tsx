// pages/recruit/export-contacts.tsx
// 役割: 連絡先CSVダウンロードAPIを呼び出し、ファイルをダウンロードさせるページ。

import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { getAuth } from 'firebase/auth';
import { app } from '@/lib/firebase';
import { Loader2, ArrowLeft, Download, AlertTriangle } from 'lucide-react';

const ExportContactsPage: React.FC = () => {
    const router = useRouter();
    const [downloadStatus, setDownloadStatus] = useState<'pending' | 'success' | 'error' | 'initial'>('initial');
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const auth = getAuth(app);

    const handleDownload = async () => {
        setDownloadStatus('pending');
        setErrorMessage(null);

        if (!auth.currentUser) {
            setErrorMessage('認証情報が無効です。再度ログインしてください。');
            router.push('/partner/login');
            return;
        }

        try {
            const idToken = await auth.currentUser.getIdToken();
            
            // 💡 CSVエクスポートAPIの呼び出し
            const response = await fetch('/api/recruit/export-contacts', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${idToken}`,
                },
            });

            if (response.status === 404) {
                 throw new Error('マッチング成立済みの連絡先が見つかりませんでした。');
            }
            
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`サーバーエラー: ${response.status} ${errorText.substring(0, 50)}`);
            }

            // 1. レスポンスからBlobを取得
            const blob = await response.blob();
            
            // 2. ファイル名を取得（APIのContent-Dispositionヘッダーを使用）
            const contentDisposition = response.headers.get('Content-Disposition');
            let filename = 'matched_contacts.csv';
            if (contentDisposition) {
                const match = contentDisposition.match(/filename="?(.+)"?/i);
                if (match && match[1]) {
                    filename = match[1];
                }
            }

            // 3. ダウンロードをトリガー
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);

            setDownloadStatus('success');
            
        } catch (error: any) {
            console.error('Download error:', error);
            setErrorMessage(error.message || '予期せぬエラーによりダウンロードに失敗しました。');
            setDownloadStatus('error');
        }
    };
    
    // ページロード時に自動的にダウンロードを開始
    useEffect(() => {
        if (router.isReady && downloadStatus === 'initial') {
            // ダウンロードを自動開始
            handleDownload();
        }
    }, [router.isReady, downloadStatus]);


    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
            <Head>
                <title>連絡先CSVダウンロード</title>
            </Head>

            <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-lg text-center space-y-6">
                <h1 className="text-2xl font-bold text-gray-900 flex items-center justify-center">
                    <Download className="w-6 h-6 mr-3 text-indigo-500" />
                    連絡先データのエクスポート
                </h1>
                
                {downloadStatus === 'pending' && (
                    <div className="flex items-center justify-center text-indigo-600 font-semibold space-x-2">
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>ダウンロード準備中...</span>
                    </div>
                )}
                
                {downloadStatus === 'success' && (
                    <div className="text-green-600 font-semibold">
                        ✅ CSVファイルのダウンロードを開始しました。
                    </div>
                )}

                {downloadStatus === 'error' && (
                    <div className="p-4 bg-red-100 text-red-700 rounded-lg space-y-2">
                        <div className="flex items-center justify-center text-red-500">
                             <AlertTriangle className="w-5 h-5 mr-2" />
                             <span className="font-bold">ダウンロード失敗</span>
                        </div>
                        <p className="text-sm">{errorMessage}</p>
                    </div>
                )}
                
                <div className="border-t pt-4">
                    <button 
                        onClick={handleDownload} 
                        disabled={downloadStatus === 'pending'}
                        className="w-full px-4 py-2 bg-indigo-600 text-white rounded-md font-semibold hover:bg-indigo-700 disabled:bg-gray-400 flex items-center justify-center space-x-2"
                    >
                        <Download className="w-4 h-4" />
                        <span>{downloadStatus === 'pending' ? '再試行を待機中' : '手動で再ダウンロード'}</span>
                    </button>
                    <Link href="/recruit/dashboard" className="mt-3 block text-indigo-600 hover:underline text-sm">
                        <ArrowLeft className="w-4 h-4 inline mr-1" />ダッシュボードに戻る
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default ExportContactsPage;