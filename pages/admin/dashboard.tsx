// Next.js Modules
import { NextPage } from 'next';
import Head from 'next/head';
import Link from 'next/link';
// React Hooks
import React, { useState, useEffect, useCallback } from 'react';
// Icons
import { LayoutDashboard, Users, Zap, DollarSign, RefreshCw, TrendingUp, TrendingDown, ClipboardList } from 'lucide-react';

// --- 型定義 ---
interface DashboardData {
    totalUsers: number;
    newUsersToday: number;
    totalPartners: number;
    activePartners: number;
    totalRevenue: number;
    lastMonthRevenue: number;
    referralPayoutsDue: number;
    pendingInvoicePartners: number;
}

// --- ダミーデータ (APIコールをシミュレート) ---
const fetchDashboardData = async (): Promise<DashboardData> => {
    // 実際のデータ取得ロジック（Admin SDKでFirestoreから集計）の代わり
    await new Promise(resolve => setTimeout(resolve, 800)); 

    return {
        totalUsers: 1245,
        newUsersToday: 45,
        totalPartners: 85,
        activePartners: 62,
        totalRevenue: 5890000, // 累計収益
        lastMonthRevenue: 352000, // 先月収益
        referralPayoutsDue: 185000, // 未払い紹介料
        pendingInvoicePartners: 12, // 請求書待ちパートナー
    };
};

// --- ヘルパー関数 ---
const formatCurrency = (amount: number) => `¥${amount.toLocaleString()}`;
const formatNumber = (num: number) => num.toLocaleString();

// --- KPIカードコンポーネント ---
const KPICard: React.FC<{ title: string, value: string, icon: React.ReactNode, bgColor: string, growth?: number, unit?: string }> = ({ title, value, icon, bgColor, growth, unit }) => {
    const isPositive = (growth || 0) >= 0;
    
    return (
        <div className="bg-white p-5 rounded-lg shadow-md flex flex-col justify-between h-full border-l-4 border-gray-200">
            <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-gray-500 uppercase">{title}</p>
                <div className={`p-2 rounded-full ${bgColor} text-white`}>{icon}</div>
            </div>
            <div className="mt-1">
                <span className="text-3xl font-extrabold text-gray-900">{value}</span>
                {unit && <span className="ml-1 text-base text-gray-600">{unit}</span>}
            </div>
            {growth !== undefined && (
                <div className="mt-2 flex items-center">
                    {isPositive ? <TrendingUp className="w-4 h-4 text-green-500 mr-1"/> : <TrendingDown className="w-4 h-4 text-red-500 mr-1"/>}
                    <span className={`text-sm font-semibold ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                        {Math.abs(growth)}% vs 先月
                    </span>
                </div>
            )}
        </div>
    );
};

// --- メインコンポーネント ---
const AdminDashboardPage: NextPage = () => {
    const [data, setData] = useState<DashboardData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loadData = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const result = await fetchDashboardData();
            setData(result);
        } catch (err) {
            setError('ダッシュボードデータの取得に失敗しました。');
            setData(null);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-100 flex items-center justify-center">
                <div className="flex items-center text-gray-600">
                    <RefreshCw className="w-6 h-6 mr-3 animate-spin"/>
                    <p className="text-xl">データをロード中...</p>
                </div>
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="min-h-screen bg-gray-100 p-8">
                <div className="max-w-7xl mx-auto bg-white p-6 rounded-lg shadow-md">
                    <h1 className="text-3xl font-bold text-red-600 mb-4">エラー</h1>
                    <p className="text-gray-700">ダッシュボードの表示中にエラーが発生しました: {error}</p>
                    <button onClick={loadData} className="mt-4 text-blue-600 hover:underline">再試行</button>
                    <Link href="/admin" className="block mt-4 text-sm text-blue-600 hover:underline">← 管理メニューに戻る</Link>
                </div>
            </div>
        );
    }
    
    // --- メイン表示部分 ---
    return (
        <div className="min-h-screen bg-gray-100 p-4 sm:p-8">
            <Head>
                <title>{"運営ダッシュボード"}</title>
            </Head>
            <div className="max-w-7xl mx-auto">
                <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center">
                    <h1 className="text-3xl font-bold text-gray-800 flex items-center">
                        <LayoutDashboard className="w-8 h-8 mr-2 text-blue-600"/>
                        運営ダッシュボード
                    </h1>
                    <Link href="/admin" className="text-sm text-blue-600 hover:underline mt-2 sm:mt-0">
                        ← 管理メニューに戻る
                    </Link>
                </div>
                
                {/* --- KPI グリッド --- */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    {/* ユーザーサマリー */}
                    <KPICard 
                        title="全ユーザー数"
                        value={formatNumber(data.totalUsers)}
                        unit="人"
                        icon={<Users className="w-5 h-5"/>}
                        bgColor="bg-indigo-500"
                    />
                    <KPICard 
                        title="本日新規登録"
                        value={formatNumber(data.newUsersToday)}
                        unit="人"
                        icon={<Users className="w-5 h-5"/>}
                        bgColor="bg-indigo-400"
                        growth={25} // ダミー成長率
                    />

                    {/* 収益サマリー */}
                    <KPICard 
                        title="今月見込収益 (先月実績)"
                        value={formatCurrency(data.lastMonthRevenue)}
                        icon={<DollarSign className="w-5 h-5"/>}
                        bgColor="bg-green-500"
                        growth={15} // ダミー成長率
                    />
                    <KPICard 
                        title="累計収益"
                        value={formatCurrency(data.totalRevenue)}
                        icon={<DollarSign className="w-5 h-5"/>}
                        bgColor="bg-green-600"
                    />
                </div>

                {/* --- パートナー/紹介料サマリー --- */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* パートナーサマリー */}
                    <div className="bg-white p-5 rounded-lg shadow-md border-t-4 border-orange-500">
                        <h3 className="text-lg font-bold mb-3 text-orange-700 flex items-center"><Zap className="w-5 h-5 mr-2"/> パートナーサマリー</h3>
                        <p className="text-sm text-gray-600 mb-2">総パートナー数: <span className="font-bold text-gray-800">{formatNumber(data.totalPartners)} 件</span></p>
                        <p className="text-sm text-gray-600">有料アクティブ: <span className="font-bold text-green-600">{formatNumber(data.activePartners)} 件</span></p>
                        <Link href="/admin/manageStores" className="mt-3 block text-sm text-orange-600 hover:underline">
                            → 店舗管理へ
                        </Link>
                    </div>

                    {/* 請求書ステータス */}
                    <div className="bg-white p-5 rounded-lg shadow-md border-t-4 border-blue-500">
                        <h3 className="text-lg font-bold mb-3 text-blue-700 flex items-center"><ClipboardList className="w-5 h-5 mr-2"/> 請求ステータス</h3>
                        <p className="text-sm text-gray-600 mb-2">請求書待ち (未入金): <span className="font-bold text-red-600">{formatNumber(data.pendingInvoicePartners)} 件</span></p>
                        <Link href="/admin/manageStores" className="mt-3 block text-sm text-blue-600 hover:underline">
                            → 請求書ステータス確認
                        </Link>
                    </div>

                    {/* 紹介料支払い */}
                    <div className="bg-white p-5 rounded-lg shadow-md border-t-4 border-purple-500">
                        <h3 className="text-lg font-bold mb-3 text-purple-700 flex items-center"><DollarSign className="w-5 h-5 mr-2"/> 紹介料支払い</h3>
                        <p className="text-sm text-gray-600 mb-2">未払い紹介料総額:</p>
                        <p className="text-2xl font-extrabold text-red-600 mb-2">{formatCurrency(data.referralPayoutsDue)}</p>
                        <Link href="/admin/referral-rewards" className="mt-3 block text-sm text-purple-600 hover:underline">
                            → 支払い管理へ
                        </Link>
                    </div>
                </div>

                {/* --- 詳細チャートエリア (仮のコンテナ) --- */}
                <div className="mt-8 bg-white p-6 rounded-lg shadow-xl border-t-4 border-gray-300">
                    <h3 className="text-xl font-bold text-gray-800 mb-4">月次アクティビティ / 成長チャート (開発中)</h3>
                    <div className="h-64 flex items-center justify-center text-gray-500 bg-gray-50 border border-dashed rounded-md">
                        ここにグラフ（Rechartsなど）が配置されます。
                    </div>
                </div>

            </div>
        </div>
    );
};

export default AdminDashboardPage;