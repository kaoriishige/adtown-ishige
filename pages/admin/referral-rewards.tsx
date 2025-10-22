import { NextPage, GetServerSideProps } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useState } from 'react';
import { RiSearchLine, RiBankCardLine, RiCheckDoubleLine } from 'react-icons/ri'; // アイコン追加

// Admin SDK (getServerSidePropsの認証解除のため使用)
// import nookies from 'nookies';
// import { adminAuth, adminDb } from '@/lib/firebase-admin';

// --- 型定義 ---
interface StoreReferralData {
    storeId: string; // 紹介元店舗のUID
    companyName: string;
    contactPerson: string;
    totalReferrals: number; // 有料会員紹介総数
    lifetimeRevenue: number; // 生涯累計紹介料
    unpaidAmount: number; // 未払い紹介料 (今月支払い対象分)
    lastPaidDate: string | null; // 最終支払い日
}

interface ReferralRewardsProps {
    initialData: StoreReferralData[];
    error?: string;
}

// --- サーバーサイド処理 (認証解除) ---
export const getServerSideProps: GetServerSideProps = async (context) => {
    // 開発のため認証を一時的に解除を維持
    
    // データ取得のダミー実装
    // 実際はFirestoreの'users'コレクションや'referral_payments'コレクションから集計を行う
    const dummyData: StoreReferralData[] = [
        {
            storeId: 'store-uid-x01',
            companyName: 'サクセス研究社',
            contactPerson: '田中 太郎',
            totalReferrals: 45,
            lifetimeRevenue: 64800,
            unpaidAmount: 8640,
            lastPaidDate: '2025-09-15',
        },
        {
            storeId: 'store-uid-y02',
            companyName: '大田原カフェ',
            contactPerson: '佐藤 花子',
            totalReferrals: 12,
            lifetimeRevenue: 17280,
            unpaidAmount: 3456, // 3,000円超えているため支払い対象
            lastPaidDate: '2025-08-15',
        },
        {
            storeId: 'store-uid-z03',
            companyName: '那須レストラン',
            contactPerson: '伊藤 健太',
            totalReferrals: 5,
            lifetimeRevenue: 7200,
            unpaidAmount: 1440, // 3,000円未満のため保留
            lastPaidDate: null,
        },
    ];

    return { props: { initialData: dummyData } };
};

// --- コンポーネント本体 ---
const ReferralRewardsPage: NextPage<ReferralRewardsProps> = ({ initialData, error }) => {
    const [referralData, setReferralData] = useState<StoreReferralData[]>(initialData);
    const [searchQuery, setSearchQuery] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [fetchError, setFetchError] = useState<string | null>(error || null);
    const router = useRouter();

    // 検索処理 (ダミー)
    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setFetchError(null);
        
        const query = searchQuery.toLowerCase();
        
        if (!query) {
             setReferralData(initialData);
             setIsLoading(false);
             return;
        }

        const filtered = initialData.filter(store => 
            store.companyName.toLowerCase().includes(query) ||
            store.storeId.includes(query)
        );

        setReferralData(filtered);
        if (filtered.length === 0) {
            setFetchError("該当する店舗が見つかりませんでした。");
        }
        setIsLoading(false);
    };

    // 支払い記録処理 (ダミー)
    const handleRecordPayment = async (store: StoreReferralData) => {
        if (store.unpaidAmount < 3000) {
            alert("未払い額が3,000円未満のため、支払い記録を確定できません。");
            return;
        }

        if (!window.confirm(`${store.companyName} に対し、未払い額 ${store.unpaidAmount.toLocaleString()}円 の支払い記録を確定しますか？`)) {
            return;
        }

        // ここにAPI呼び出しロジックが入る (例: データベースのunpaidAmountをリセットし、支払い履歴を記録するAPI)
        // const response = await fetch('/api/admin/record-referral-payment', { method: 'POST', ... });

        // UI処理をシミュレート
        alert(`支払い記録が完了しました: ${store.companyName}`);
        
        // ダミーデータ内で支払い記録をシミュレート
        setReferralData(prevData => prevData.map(d => 
            d.storeId === store.storeId ? { ...d, unpaidAmount: 0, lastPaidDate: new Date().toISOString().split('T')[0] } : d
        ));
    };

    return (
        <div className="min-h-screen bg-gray-100 p-4 sm:p-8">
            <Head>
                <title>{"店舗紹介料管理 - 管理者ページ"}</title>
            </Head>
            <div className="max-w-7xl mx-auto">
                <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center">
                    <h1 className="text-3xl font-bold text-gray-800">店舗紹介料管理</h1>
                    <Link href="/admin" className="text-sm text-blue-600 hover:underline mt-2 sm:mt-0">
                        ← 管理メニューに戻る
                    </Link>
                </div>

                <div className="mb-6">
                    <p className="text-red-600 bg-red-100 p-4 rounded-md text-center">
                        <strong>注意：</strong> このページは、店舗への紹介料支払い状況（3,000円以上の未払いが支払い対象）を管理します。
                    </p>
                </div>
                {fetchError && <p className="text-red-600 bg-red-100 p-4 rounded-md mb-6">{fetchError}</p>}
                
                {/* 検索フォーム */}
                <div className="bg-white p-4 rounded-lg shadow mb-6">
                    <form onSubmit={handleSearch} className="flex gap-4">
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="店舗名またはUIDで紹介元を検索"
                            className="flex-grow p-2 border border-gray-300 rounded-md"
                        />
                        <button type="submit" disabled={isLoading} className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-400 flex items-center">
                            <RiSearchLine className="mr-1" />
                            {isLoading ? '検索中...' : '検索'}
                        </button>
                    </form>
                </div>

                <div className="bg-white rounded-lg shadow overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">店舗情報 / UID</th>
                                <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">累計紹介収益</th>
                                <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">未払い紹介料</th>
                                <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">最終支払い日</th>
                                <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">アクション</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {referralData.length > 0 ? referralData.map(store => (
                                <tr key={store.storeId}>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="font-medium text-gray-900">{store.companyName} ({store.contactPerson})</div>
                                        <div className="text-xs text-gray-400 break-all">UID: {store.storeId}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-700">
                                        {store.totalReferrals} 人 ({store.lifetimeRevenue.toLocaleString()} 円)
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-center text-lg font-bold">
                                        <span className={`px-3 py-1 rounded-full ${store.unpaidAmount >= 3000 ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                            {store.unpaidAmount.toLocaleString()} 円
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-700">
                                        {store.lastPaidDate || '未実施'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                                        <button 
                                            onClick={() => handleRecordPayment(store)}
                                            disabled={store.unpaidAmount < 3000}
                                            className="text-white bg-teal-600 hover:bg-teal-700 px-3 py-1 rounded-md text-xs disabled:bg-gray-400 transition duration-150 flex items-center justify-center mx-auto"
                                        >
                                            <RiBankCardLine className="mr-1" />
                                            {store.unpaidAmount >= 3000 ? '支払い記録を確定' : '保留 (3千円未満)'}
                                        </button>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={5} className="p-4 text-center text-gray-500">該当する店舗は見つかりませんでした。</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default ReferralRewardsPage;