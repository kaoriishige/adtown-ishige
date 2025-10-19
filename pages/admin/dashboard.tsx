import { NextPage, GetServerSideProps } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import nookies from 'nookies';
import { adminAuth, adminDb } from '../../lib/firebase-admin'; // ★相対パス修正
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid } from 'recharts';
import { FiUsers, FiHome, FiTrendingUp, FiHeart, FiArrowUp } from 'react-icons/fi';
import React from 'react';

// --- 型定義 ---
interface StatCardProps {
    iconName: 'FiUsers' | 'FiHome' | 'FiTrendingUp' | 'FiHeart';
    title: string;
    value: string;
    change?: string;
    subText?: string;
    iconBgColor: string;
}

interface ActionItem {
    id: string;
    text: string;
    count: number;
    link: string;
    bgColor: string;
    textColor: string;
    buttonColor: string;
}

interface DashboardData {
    stats: StatCardProps[];
    weeklyNewUsers: any[];
    popularStores: any[];
    actionItems: ActionItem[];
    operatorName: string;
}

// --- UIコンポーネント ---

const iconMap = {
    FiUsers: <FiUsers className="text-blue-500" />,
    FiHome: <FiHome className="text-orange-500" />,
    FiTrendingUp: <FiTrendingUp className="text-green-500" />,
    FiHeart: <FiHeart className="text-pink-500" />,
};

const StatCard: React.FC<StatCardProps> = ({ iconName, title, value, change, subText, iconBgColor }) => (
    <div className="bg-white p-6 rounded-lg shadow-md flex items-start">
        <div className={`p-3 rounded-full mr-4 ${iconBgColor}`}>
            {iconMap[iconName]}
        </div>
        <div>
            <p className="text-sm text-gray-500">{title}</p>
            <p className="text-3xl font-bold text-gray-800">{value}</p>
            <div className="text-xs text-gray-500 mt-1">
                {change && <span className="flex items-center text-gray-500"><FiArrowUp className="mr-1" />{change}</span>}
                {subText && <span>{subText}</span>}
            </div>
        </div>
    </div>
);

const NewUsersChart = ({ data }: { data: any[] }) => (
    <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="font-bold text-gray-700 mb-4">新規ユーザー登録数の推移（今週）</h3>
        <ResponsiveContainer width="100%" height={300}>
            {/* 💡 修正箇所: margin={...} を margin={{...}} に修正 */}
            <BarChart data={data} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="referral" fill="#82ca9d" name="紹介経由" />
                <Bar dataKey="normal" fill="#8884d8" name="通常登録" />
            </BarChart>
        </ResponsiveContainer>
    </div>
);

const PopularStoresChart = ({ data }: { data: any[] }) => (
    <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="font-bold text-gray-700 mb-4">人気加盟店ランキング（今月）</h3>
        {data.length === 0 ? (
            <p className="text-gray-500 text-center py-10">まだデータがありません。</p>
        ) : (
            <div className="space-y-4">
                {data.map((store, index) => (
                    <div key={store.name}>
                        <div className="flex justify-between text-sm mb-1">
                            <span className="font-semibold text-gray-600">{`${index + 1}. ${store.name}`}</span>
                            <span className="text-gray-500">{`¥${store.amount.toLocaleString()}`}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-4">
                            <div className="bg-blue-500 h-4 rounded-full" style={{ width: `${store.percentage}%` }}></div>
                        </div>
                    </div>
                ))}
            </div>
        )}
    </div>
);

const ActionItemsList = ({ items }: { items: ActionItem[] }) => (
    <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="font-bold text-gray-700 mb-4">対応が必要な項目</h3>
        <div className="space-y-3">
            {items.map(item => (
                <div key={item.id} className={`p-4 rounded-lg flex justify-between items-center ${item.bgColor}`}>
                    <div>
                        <p className={`font-semibold ${item.textColor}`}>{item.text}</p>
                        <p className={`text-sm ${item.textColor}`}>{`${item.count}件`}</p>
                    </div>
                    <Link href={item.link} className={`px-4 py-2 text-sm font-medium text-white rounded-md shadow-sm ${item.buttonColor} hover:opacity-90 ${item.count === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}>
                        確認する
                    </Link>
                </div>
            ))}
        </div>
    </div>
);

// --- ダッシュボードページ本体 ---

const AdminDashboardPage: NextPage<{ dashboardData: DashboardData }> = ({ dashboardData }) => {
    return (
        <div className="min-h-screen bg-gray-100">
            <Head>
                <title>{"運営管理ダッシュボード"}</title>
            </Head>

            <header className="bg-white shadow-sm sticky top-0 z-10">
                <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
                    <h1 className="text-2xl font-bold text-gray-800">運営管理ダッシュボード</h1>
                    <div className="text-sm text-gray-600">
                        <Link href="/admin" className="hover:text-blue-600">管理メニューへ戻る</Link>
                        <span className="mx-2">|</span>
                        <span>運営者: {dashboardData.operatorName}</span>
                        <span className="mx-2">|</span>
                        <Link href="/api/auth/sessionLogout" className="hover:text-blue-600">ログアウト</Link>
                    </div>
                </div>
            </header>

            <main className="max-w-screen-xl mx-auto p-4 sm:p-6 lg:p-8">
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-6">
                    {dashboardData.stats.map(stat => (
                        <StatCard key={stat.title} {...stat} />
                    ))}
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                    <NewUsersChart data={dashboardData.weeklyNewUsers} />
                    <PopularStoresChart data={dashboardData.popularStores} />
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <ActionItemsList items={dashboardData.actionItems} />
                </div>
            </main>
        </div>
    );
};

// --- サーバーサイドでのデータ取得と認証 ---
export const getServerSideProps: GetServerSideProps = async (context) => {
    try {
        const cookies = nookies.get(context);
        if (!cookies.token) {
            return { redirect: { destination: '/admin/login', permanent: false } };
        }
        
        const token = await adminAuth.verifyIdToken(cookies.token, true);
        const userDoc = await adminDb.collection('users').doc(token.uid).get();

        if (!userDoc.exists || !userDoc.data()?.roles?.includes('admin')) {
            return { redirect: { destination: '/admin/login', permanent: false } };
        }

        // --- ダミーデータ生成（本番環境ではFirestoreから取得） ---
        const dashboardData: DashboardData = {
            operatorName: userDoc.data()?.name || '管理者',
            stats: [
                { iconName: 'FiUsers', title: '総ユーザー数', value: '1,234 人', change: '前日比 +12人', subText: '有料: 50 / 無料: 1184', iconBgColor: 'bg-blue-100' },
                { iconName: 'FiHome', title: '総加盟店数', value: '45 店舗', change: '前週比 +2店舗', subText: '飲食: 20 / 物販: 15 / 他: 10', iconBgColor: 'bg-orange-100' },
                { iconName: 'FiTrendingUp', title: '今月のポイント流通総額', value: '¥3,450,000', change: '先月同期間比 +8.5%', iconBgColor: 'bg-green-100' },
                { iconName: 'FiHeart', title: 'オンライン子ども食堂 支援総額', value: '¥120,000', subText: '120食分 / 50人から', iconBgColor: 'bg-pink-100' },
            ],
            weeklyNewUsers: [
                { day: '月', referral: 5, normal: 10 }, { day: '火', referral: 8, normal: 15 }, { day: '水', referral: 12, normal: 20 },
                { day: '木', referral: 6, normal: 18 }, { day: '金', referral: 15, normal: 25 }, { day: '土', referral: 20, normal: 30 }, { day: '日', referral: 18, normal: 22 },
            ],
            popularStores: [
                { name: 'なっぴーベーカリー', amount: 550000, percentage: 100 },
                { name: '那須まるごと直売所', amount: 480000, percentage: 87 },
                { name: 'チーズ工房のカフェ', amount: 320000, percentage: 58 },
                { name: '御用邸チーズケーキ', amount: 250000, percentage: 45 },
            ],
            actionItems: [
                { id: '1', text: '新規加盟店の承認待ち', count: 3, link: '/admin/review-approval', bgColor: 'bg-yellow-100', textColor: 'text-yellow-800', buttonColor: 'bg-yellow-500 hover:bg-yellow-600' },
                { id: '2', text: 'ユーザー作成クエストの承認待ち', count: 5, link: '/admin/quest-review', bgColor: 'bg-blue-100', textColor: 'text-blue-800', buttonColor: 'bg-blue-500 hover:bg-blue-600' },
                { id: '3', text: 'ユーザーからの問い合わせ', count: 12, link: '/admin/inquiry-list', bgColor: 'bg-gray-200', textColor: 'text-gray-800', buttonColor: 'bg-gray-600 hover:bg-gray-700' },
            ],
        };

        return {
            props: {
                dashboardData
            },
        };
    } catch (error) {
        return { redirect: { destination: '/admin/login', permanent: false } };
    }
};

export default AdminDashboardPage;