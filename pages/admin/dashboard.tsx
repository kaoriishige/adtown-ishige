import { NextPage, GetServerSideProps } from 'next';
import Head from 'next/head';
import Link from 'next/link';
// React Hooks
import React, { useState, useEffect, useCallback } from 'react';
// Icons
import { LayoutDashboard, Users, Zap, DollarSign, RefreshCw, TrendingUp, TrendingDown, ClipboardList, Briefcase, Megaphone } from 'lucide-react';

// Admin SDK (サーバーサイド)
import { adminDb, adminAuth } from '@/lib/firebase-admin';
import nookies from 'nookies';
import { CollectionReference, Query, QuerySnapshot } from 'firebase-admin/firestore'; // Firebase Admin Firestoreの型をインポート
import * as admin from 'firebase-admin';

// --- 型定義 ---
interface DashboardData {
    advertiserPartners: number; // 広告パートナー総数
    recruiterPartners: number;  // 求人パートナー総数
    activeAdvertisers: number;  // 有料広告パートナー数
    activeRecruiters: number;   // 有料求人パートナー数
    totalRevenue: number;       // 累計収益
    monthlySubscriptionRevenue: number; // 今月見込のサブスクリプション収益 (月額換算)
    referralPayoutsDue: number; // 未払い紹介料
    pendingInvoicePartners: number; // 請求書待ちパートナー
    queryFailed: boolean;       // クエリ失敗フラグ
}

// --- ヘルパー関数 ---
const formatCurrency = (amount: number) => `¥${amount.toLocaleString()}`;
const formatNumber = (num: number) => num.toLocaleString();

// --- KPIカードコンポーネント ---
const KPICard: React.FC<{ title: string, value: string, icon: React.ReactNode, bgColor: string, unit?: string, subValue?: string }> = ({ title, value, icon, bgColor, unit, subValue }) => {
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
            {subValue && (
                <div className="mt-2 flex items-center">
                    <span className={`text-sm font-semibold text-gray-500`}>
                        {subValue}
                    </span>
                </div>
            )}
        </div>
    );
};


// =======================================================
// サーバーサイドデータ取得 (本番データ接続)
// =======================================================
export const getServerSideProps: GetServerSideProps = async (context) => {
    const defaultData: DashboardData = {
        advertiserPartners: 0, recruiterPartners: 0, activeAdvertisers: 0, activeRecruiters: 0,
        totalRevenue: 0, monthlySubscriptionRevenue: 0, referralPayoutsDue: 0, pendingInvoicePartners: 0,
        queryFailed: false,
    };

    // 💡 運営ダッシュボードなので、認証チェックはシンプルにし、必要に応じてログインページへリダイレクト
    // 🚨 修正箇所: 管理者ログイン認証を一時的に解除（コメントアウト）
    /*
    try {
        const cookies = nookies.get(context);
        const token = await adminAuth.verifySessionCookie(cookies.session || '', true);
        const { uid } = token;

        // 運営権限チェック（必要に応じて 'admin' ロールなどを確認してください）
        const userDoc = await adminDb.collection('users').doc(uid).get();
        if (!userDoc.exists || userDoc.data()?.role !== 'admin') { 
            // 適切な管理者ロールがない場合
            return { redirect: { destination: '/admin/login', permanent: false } };
        }
        
    } catch (e) {
        console.error("Admin Auth Failed:", e);
        return { redirect: { destination: '/admin/login', permanent: false } };
    }
    */

    try {
        // --- 1. 定数の定義 (料金) ---
        // 🚨注意: これらの料金は環境変数から取得するか、Stripe Price IDと突き合わせるのが最善です
        const AD_MONTHLY_RATE = 3300; 
        const JOB_MONTHLY_RATE = 6600; // 申込ページ(apply.tsx)によると先着100社は6,600円
        
        // 申込ページ(apply.tsx)のFAQより: 
        // 請求書払い(年額) 105,600円 -> 割引 92,400円 -> 先着100社 69,600円
        const AD_ANNUAL_RATE = 69600; // 広告も同額と仮定
        const JOB_ANNUAL_RATE = 69600; 

        // --- 2. パートナーデータの取得 ---
        const usersSnap = await adminDb.collection('users').get();
        const partners = usersSnap.docs.map(doc => doc.data());

        // --- 3. 変数の初期化 ---
        let advertiserPartners = 0;
        let recruiterPartners = 0;
        let activeAdvertisers = 0;
        let activeRecruiters = 0;
        let pendingInvoicePartners = 0;
        let totalRevenue = 0;
        let monthlySubscriptionRevenue = 0;

        // --- 4. 収益とステータスの集計 (ロジック修正) ---
        partners.forEach(p => {
            const roles = p.roles || [];
            
            // 広告パートナー (adver)
            if (roles.includes('adver')) {
                advertiserPartners++;
                const status = p.adverSubscriptionStatus;
                const cycle = p.billingCycle; // billingCycleは共有と仮定

                if (status === 'active') {
                    activeAdvertisers++;
                    if (cycle === 'monthly') {
                        monthlySubscriptionRevenue += AD_MONTHLY_RATE;
                        totalRevenue += (p.lifetimeRevenue || AD_MONTHLY_RATE); 
                    } else if (cycle === 'annual') {
                        totalRevenue += (p.invoicePaidRevenue || p.lifetimeRevenue || AD_ANNUAL_RATE);
                    }
                } else if (status === 'pending_invoice') {
                    pendingInvoicePartners++;
                    totalRevenue += (p.invoicePaidRevenue || AD_ANNUAL_RATE);
                } else if (status === 'pending_checkout') {
                    if (cycle === 'monthly') {
                        totalRevenue += (p.lifetimeRevenue || AD_MONTHLY_RATE);
                    } else if (cycle === 'annual') {
                        totalRevenue += (p.lifetimeRevenue || AD_ANNUAL_RATE);
                    }
                } else if (!status) { 
                    // 🚨 修正: ステータスがnull/undefinedだがロールがある場合 (請求書払いの可能性)
                    totalRevenue += AD_ANNUAL_RATE; // 年額（請求書）と仮定
                    pendingInvoicePartners++; // 請求書待ちとしてカウント
                }
            }
            
            // 求人パートナー (recruit)
            if (roles.includes('recruit')) {
                recruiterPartners++;
                const status = p.recruitSubscriptionStatus;
                const cycle = p.billingCycle; // billingCycleは共有と仮定

                if (status === 'active') {
                    activeRecruiters++;
                    if (cycle === 'monthly') {
                        monthlySubscriptionRevenue += JOB_MONTHLY_RATE;
                        totalRevenue += (p.lifetimeRevenue || JOB_MONTHLY_RATE);
                    } else if (cycle === 'annual') {
                        totalRevenue += (p.invoicePaidRevenue || p.lifetimeRevenue || JOB_ANNUAL_RATE);
                    }
                } else if (status === 'pending_invoice') {
                    pendingInvoicePartners++;
                    totalRevenue += (p.invoicePaidRevenue || JOB_ANNUAL_RATE);
                } else if (status === 'pending_checkout') {
                    if (cycle === 'monthly') {
                        totalRevenue += (p.lifetimeRevenue || JOB_MONTHLY_RATE);
                    } else if (cycle === 'annual') {
                        totalRevenue += (p.lifetimeRevenue || JOB_ANNUAL_RATE);
                    }
                } else if (!status) { 
                    // 🚨 修正: ステータスがnull/undefinedだがロールがある場合 (請求書払いの可能性)
                    totalRevenue += JOB_ANNUAL_RATE; // 年額（請求書）と仮定
                    pendingInvoicePartners++; // 請求書待ちとしてカウント
                }
            }
        });

        // --- 5. 紹介料の集計 ---
        const payoutsSnap = await adminDb.collection('referralPayouts')
            .where('status', '==', 'pending')
            .get();
            
        const referralPayoutsDue = payoutsSnap.docs.reduce((sum, doc) => sum + (doc.data().amount || 0), 0);

        // --- 最終データ構築 ---
        const dashboardData: DashboardData = {
            advertiserPartners,
            recruiterPartners,
            activeAdvertisers,
            activeRecruiters,
            totalRevenue,
            monthlySubscriptionRevenue,
            referralPayoutsDue,
            pendingInvoicePartners,
            queryFailed: false,
        };

        return { props: { data: dashboardData } };

    } catch (error) {
        console.error("Dashboard Data Fetch Error:", error);
        return { props: { data: { ...defaultData, queryFailed: true } } };
    }
};


// =======================================================
// メインコンポーネント (データ受け取り側)
// =======================================================
const AdminDashboardPage: NextPage<{ data: DashboardData }> = ({ data }) => {
    // データがない場合（クエリ失敗など）はロード中として扱う
    const isLoading = false; // getServerSidePropsで既にロード済み
    
    if (data.queryFailed) {
        return (
            <div className="min-h-screen bg-gray-100 p-8">
                <div className="max-w-7xl mx-auto bg-white p-6 rounded-lg shadow-md">
                    <h1 className="text-3xl font-bold text-red-600 mb-4">エラー</h1>
                    <p className="text-gray-700">ダッシュボードデータの取得に失敗しました。Firestoreのログとインデックス設定を確認してください。</p>
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
                <h2 className="text-2xl font-bold text-gray-700 mb-4 border-b pb-2">パートナーサマリー</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    
                    {/* 広告パートナー総数 */}
                    <KPICard 
                        title="広告パートナー総数"
                        value={formatNumber(data.advertiserPartners)}
                        unit="件"
                        icon={<Megaphone className="w-5 h-5"/>}
                        bgColor="bg-indigo-500"
                        subValue={`有料アクティブ: ${data.activeAdvertisers} 件`}
                    />
                    
                    {/* 求人パートナー総数 */}
                    <KPICard 
                        title="求人パートナー総数"
                        value={formatNumber(data.recruiterPartners)}
                        unit="件"
                        icon={<Briefcase className="w-5 h-5"/>}
                        bgColor="bg-blue-500"
                        subValue={`有料アクティブ: ${data.activeRecruiters} 件`}
                    />

                    {/* 収益サマリー (今月見込み) */}
                    <KPICard 
                        title="今月見込収益 (サブスク)"
                        value={formatCurrency(data.monthlySubscriptionRevenue)}
                        icon={<DollarSign className="w-5 h-5"/>}
                        bgColor="bg-green-500"
                        unit="円"
                    />

                    {/* 累計収益 */}
                    <KPICard 
                        title="累計収益 (簡易集計)"
                        value={formatCurrency(data.totalRevenue)}
                        icon={<DollarSign className="w-5 h-5"/>}
                        bgColor="bg-green-600"
                        unit="円"
                    />
                </div>

                {/* --- 業務/財務ステータス --- */}
                <h2 className="text-2xl font-bold text-gray-700 mb-4 border-b pb-2">業務・財務ステータス</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    
                    {/* 請求ステータス */}
                    <div className="bg-white p-5 rounded-lg shadow-md border-t-4 border-blue-500">
                        <h3 className="text-lg font-bold mb-3 text-blue-700 flex items-center"><ClipboardList className="w-5 h-5 mr-2"/> 請求ステータス</h3>
                        <p className="text-sm text-gray-600 mb-2">請求書待ち (未入金): <span className="font-bold text-red-600">{formatNumber(data.pendingInvoicePartners)} 件</span></p>
                        <Link href="/admin/manageStores" className="mt-3 block text-sm text-blue-600 hover:underline">
                            → 請求書ステータス確認
                        </Link>
                    </div>

                    {/* 紹介料支払い */}
                    <div className="bg-white p-5 rounded-lg shadow-md border-t-4 border-purple-500">
                        <h3 className="text-lg font-bold mb-3 text-purple-700 flex items-center"><DollarSign className="w-5 h-5 mr-2"/> 店舗紹介料管理</h3>
                        <p className="text-sm text-gray-600 mb-2">未払い紹介料総額:</p>
                        <p className="text-2xl font-extrabold text-red-600 mb-2">{formatCurrency(data.referralPayoutsDue)}</p>
                        <Link href="/admin/referral-rewards" className="mt-3 block text-sm text-purple-600 hover:underline">
                            → 店舗紹介料管理へ
                        </Link>
                    </div>

                    {/* 開発中情報 */}
                    <div className="bg-white p-5 rounded-lg shadow-md border-t-4 border-gray-300">
                        <h3 className="text-lg font-bold mb-3 text-gray-700 flex items-center"><Zap className="w-5 h-5 mr-2"/> 開発情報</h3>
                        <p className="text-sm text-gray-600 mb-2">本番環境稼働中</p>
                        <p className="text-sm text-gray-600">最終更新: 2025/10/27 (サーバー時間)</p>
                        <Link href="/admin/help" className="mt-3 block text-sm text-gray-600 hover:underline">
                            → ヘルプ/マニュアル
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