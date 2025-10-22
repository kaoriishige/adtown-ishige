// Next.js Modules
import { NextPage } from 'next';
import Head from 'next/head';
import Link from 'next/link';
// React Hooks
import React, { useState, useCallback } from 'react';
// Icons
import { Settings, RefreshCw, AlertTriangle, CheckCircle } from 'lucide-react';

// --- Stripe Connect 連携シミュレーション用ダミーデータ ---
interface AccountStatus {
    id: string;
    status: '未連携' | '情報入力中' | '審査中' | '連携完了' | '凍結';
    bankRegistered: boolean;
    requirementsDue: boolean;
}

const initialStatus: AccountStatus = {
    id: 'acct_1Nf87R1Y6yW5p4zL',
    status: '未連携',
    bankRegistered: false,
    requirementsDue: false,
};

// --- コンポーネント本体 ---
const AdminSettingsPage: NextPage = () => {
    // 開発完了まで認証を解除している状態を維持するため、getServerSidePropsは省略します。
    const [stripeStatus, setStripeStatus] = useState<AccountStatus>(initialStatus);
    const [systemError, setSystemError] = useState<string | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    
    // --- Stripe Connect ダミー連携開始/更新 ---
    const handleConnectAccount = useCallback(async () => {
        setSystemError(null);
        setIsProcessing(true);

        try {
            // ダミーAPIコールをシミュレーション
            // 実際には、/api/admin/create-stripe-connect-account などを呼び出し、
            // ユーザーをStripeの登録フローにリダイレクトさせる。
            await new Promise(resolve => setTimeout(resolve, 1500)); 

            // ステータスを「情報入力中」に更新
            setStripeStatus(prev => ({
                ...prev,
                status: '情報入力中', 
                requirementsDue: true
            }));

        } catch (error) {
            console.error("Stripe Connect setup error:", error);
            setSystemError("Stripe連携アカウントの作成に失敗しました。ログを確認してください。");
        } finally {
            setIsProcessing(false);
        }
    }, []);

    // --- ダミーの銀行口座登録シミュレーション ---
    const handleSimulateBankRegistration = useCallback(async () => {
        setSystemError(null);
        setIsProcessing(true);

        try {
            await new Promise(resolve => setTimeout(resolve, 1500)); 
            
            // 銀行口座登録後のステータスをシミュレーション
            setStripeStatus(prev => ({
                ...prev,
                status: '連携完了', 
                bankRegistered: true,
                requirementsDue: false,
            }));

        } catch (error) {
            console.error("Bank registration error:", error);
            setSystemError("銀行口座情報の登録シミュレーション中にエラーが発生しました。");
        } finally {
            setIsProcessing(false);
        }
    }, []);

    // --- ダミーシステム設定保存 ---
    const handleSaveSettings = useCallback(() => {
        setSystemError(null);
        alert('システム設定を保存しました。（ダミー）');
    }, []);

    const getStatusColor = (status: AccountStatus) => {
        switch (status.status) {
            case '連携完了':
                return 'bg-green-500';
            case '凍結':
                return 'bg-red-500';
            case '情報入力中':
            case '審査中':
                return 'bg-yellow-500';
            case '未連携':
            default:
                return 'bg-gray-500';
        }
    };
    
    return (
        <div className="min-h-screen bg-gray-100 p-4 sm:p-8">
            <Head>
                <title>{"各種設定 - 管理者ページ"}</title>
            </Head>
            <div className="max-w-4xl mx-auto">
                <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center">
                    <h1 className="text-3xl font-bold text-gray-800 flex items-center">
                        <Settings className="w-8 h-8 mr-2 text-purple-600"/>
                        各種設定
                    </h1>
                    <Link href="/admin" className="text-sm text-blue-600 hover:underline mt-2 sm:mt-0">
                        ← 管理メニューに戻る
                    </Link>
                </div>

                {/* システムエラー表示 */}
                {systemError && (
                    <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-md mb-6 flex items-center">
                        <AlertTriangle className="w-5 h-5 mr-3"/>
                        <p className="text-sm">{systemError}</p>
                    </div>
                )}
                
                {/* --- Stripe Connect (紹介料の銀行振込基盤) 設定 --- */}
                <div className="bg-white p-6 rounded-lg shadow-xl mb-8 border-t-4 border-purple-500">
                    <h2 className="text-2xl font-semibold text-gray-800 mb-4 flex items-center">
                        紹介料支払基盤 (Stripe Connect) 設定
                    </h2>
                    <p className="text-gray-600 mb-4">
                        企業・店舗への紹介料（銀行振込）を円滑に行うため、Stripeの決済アカウントを連携します。
                    </p>

                    <div className="p-4 rounded-md border flex items-center justify-between">
                        <div className="flex items-center">
                            <span className={`w-3 h-3 rounded-full mr-3 ${getStatusColor(stripeStatus)}`}></span>
                            <p className="font-medium">連携ステータス:</p>
                            <span className="ml-2 font-bold text-gray-800">{stripeStatus.status}</span>
                        </div>
                        <button
                            onClick={handleConnectAccount}
                            disabled={isProcessing || stripeStatus.status === '連携完了'}
                            className={`flex items-center text-sm py-2 px-4 rounded-md transition-colors ${
                                isProcessing ? 'bg-gray-400 text-gray-600 cursor-not-allowed' : 'bg-purple-600 text-white hover:bg-purple-700'
                            }`}
                        >
                            {isProcessing ? (
                                <>
                                    <RefreshCw className="w-4 h-4 mr-2 animate-spin"/>
                                    処理中...
                                </>
                            ) : (
                                <>
                                    {stripeStatus.status === '連携完了' ? '連携完了済' : '連携を開始/更新'}
                                </>
                            )}
                        </button>
                    </div>

                    {/* 詳細な要件チェックリスト */}
                    <div className="mt-4 p-4 bg-gray-50 rounded-md">
                        <p className="font-semibold text-gray-700 mb-3">連携要件チェック:</p>
                        <ul className="space-y-2 text-sm">
                            <li className="flex items-center">
                                {stripeStatus.id ? <CheckCircle className="w-5 h-5 text-green-500 mr-2"/> : <AlertTriangle className="w-5 h-5 text-yellow-500 mr-2"/>}
                                StripeアカウントID: <span className="ml-1 text-gray-800 font-mono">{stripeStatus.id}</span>
                            </li>
                            <li className="flex items-center">
                                {stripeStatus.bankRegistered ? <CheckCircle className="w-5 h-5 text-green-500 mr-2"/> : <AlertTriangle className="w-5 h-5 text-yellow-500 mr-2"/>}
                                銀行口座情報登録: 
                                {stripeStatus.bankRegistered ? (
                                    <span className="ml-1 text-green-700 font-medium">完了</span>
                                ) : (
                                    <button 
                                        onClick={handleSimulateBankRegistration} 
                                        disabled={isProcessing || stripeStatus.status === '未連携'}
                                        className="ml-2 text-blue-600 hover:underline disabled:text-gray-500 disabled:no-underline"
                                    >
                                        （銀行情報登録をシミュレート）
                                    </button>
                                )}
                            </li>
                            <li className="flex items-center">
                                {!stripeStatus.requirementsDue ? <CheckCircle className="w-5 h-5 text-green-500 mr-2"/> : <AlertTriangle className="w-5 h-5 text-red-500 mr-2"/>}
                                法的要件: {stripeStatus.requirementsDue ? <span className="ml-1 text-red-700 font-medium">追加情報が必要です</span> : <span className="ml-1 text-green-700 font-medium">OK</span>}
                            </li>
                        </ul>
                    </div>
                </div>

                {/* --- システム共通設定 --- */}
                <div className="bg-white p-6 rounded-lg shadow-xl border-t-4 border-blue-500">
                    <h2 className="text-2xl font-semibold text-gray-800 mb-4 flex items-center">
                        システム共通設定
                    </h2>
                    <div className="space-y-4">
                        <div>
                            <label htmlFor="referralRate" className="block text-sm font-medium text-gray-700">
                                紹介料率 (%)
                            </label>
                            <input
                                id="referralRate"
                                type="number"
                                defaultValue={30}
                                min="0"
                                max="100"
                                className="mt-1 block w-full max-w-xs p-2 border border-gray-300 rounded-md"
                            />
                            <p className="mt-1 text-xs text-gray-500">有料会員の月額売上に対する店舗への紹介料率。</p>
                        </div>
                        <div>
                            <label htmlFor="minPayout" className="block text-sm font-medium text-gray-700">
                                最小振込額 (円)
                            </label>
                            <input
                                id="minPayout"
                                type="number"
                                defaultValue={3000}
                                min="100"
                                className="mt-1 block w-full max-w-xs p-2 border border-gray-300 rounded-md"
                            />
                            <p className="mt-1 text-xs text-gray-500">紹介料を銀行振込する際の最小額。</p>
                        </div>
                    </div>
                    <button
                        onClick={handleSaveSettings}
                        className="mt-6 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 font-semibold"
                    >
                        設定を保存
                    </button>
                </div>

            </div>
        </div>
    );
};

export default AdminSettingsPage;