import { GetServerSideProps, NextPage } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import React from 'react'; // ★ 修正: useState, useEffect を削除
import { adminAuth, adminDb } from '../../lib/firebase-admin'; // Admin SDK
import nookies from 'nookies';
// ★ 修正: Timestamp の型のみインポート
import type { Timestamp } from 'firebase/firestore'; 
// ★ 修正: 未使用のクライアント 'db' を削除

// ユーザーデータの型定義
interface PartnerData {
    uid: string;
    storeName: string;
    email: string;
    phoneNumber?: string;
    address?: string;
    createdAt?: Timestamp; // Timestamp型
    roles: string[]; // 'adver' | 'recruit'
    
    // 広告ステータス (データ移行後の新しいフィールド)
    adverSubscriptionStatus?: 'Paid' | 'Free' | 'inactive' | string;
    adverPaymentIntent?: 'pending' | null;

    // 求人ステータス (データ移行後の新しいフィールド)
    recruitSubscriptionStatus?: 'Paid' | 'Free' | 'inactive' | string;
    recruitPaymentIntent?: 'pending' | null;
}

interface ManageStoresProps {
    partners: PartnerData[];
}

// ===============================
// ヘルパー関数: 登録サービスを判定
// ===============================
const getRegisteredServices = (roles: string[] = []): string => {
    const hasAdver = roles.includes('adver');
    const hasRecruit = roles.includes('recruit');

    if (hasAdver && hasRecruit) {
        return '両方';
    } else if (hasAdver) {
        return '広告＆紹介料';
    } else if (hasRecruit) {
        return '求人';
    }
    return '未設定';
};

// ===============================
// ヘルパー関数: 支払い状況を判定
// ===============================
const getPaymentStatusText = (status: string | undefined, intent: string | undefined | null): string => {
    if (intent === 'pending') {
        return '請求書待ち'; // 黄色
    }
    if (status === 'Paid' || status === 'active') {
        return '有料'; // 緑色
    }
    if (status === 'Free' || status === 'inactive') {
        return '無料'; // 灰色
    }
    return '未設定'; // 灰色
};

// 支払い状況のバッジスタイル
const getStatusBadgeClass = (statusText: string): string => {
    switch (statusText) {
        case '有料':
            return 'bg-green-100 text-green-800';
        case '請求書待ち':
            return 'bg-yellow-100 text-yellow-800 animate-pulse';
        case '無料':
            return 'bg-gray-100 text-gray-700';
        default: // 未設定
            return 'bg-red-100 text-red-700';
    }
};


// ===============================
// サーバーサイドでのデータ取得 (SSR)
// ===============================
export const getServerSideProps: GetServerSideProps = async (context) => {
    try {
        const cookies = nookies.get(context);
        const token = await adminAuth.verifySessionCookie(cookies.session || '', true);
        const { uid } = token;

        // 管理者ロールのチェック (必須)
        const userDoc = await adminDb.collection('users').doc(uid).get();
        if (!userDoc.exists || userDoc.data()?.role !== 'admin') {
            return {
                redirect: { destination: '/partner/login?error=permission_denied', permanent: false }
            };
        }

        // 全パートナーのデータを取得 (usersコレクションから)
        const partnersSnapshot = await adminDb.collection('users').get();
        
        const partners: PartnerData[] = [];
        partnersSnapshot.forEach(doc => {
            const data = doc.data();
            
            // サーバーサイドのTimestampをJSONシリアライズ可能な形式に変換
            const createdAt = data.createdAt ? 
                (data.createdAt as Timestamp).toDate().toISOString() : 
                new Date().toISOString(); // もしcreatedAtがなければ現在時刻

            partners.push({
                uid: doc.id,
                storeName: data.storeName || data.companyName || '（名称未設定）',
                email: data.email || '',
                phoneNumber: data.phoneNumber || '',
                address: data.address || '',
                createdAt: createdAt as any, // ISODate stringとして渡す
                roles: data.roles || [],
                
                // 広告ステータス (データ移行後の新しいフィールド)
                adverSubscriptionStatus: data.adverSubscriptionStatus || 'Free',
                adverPaymentIntent: data.adverPaymentIntent || null,

                // 求人ステータス (データ移行後の新しいフィールド)
                recruitSubscriptionStatus: data.recruitSubscriptionStatus || 'Free',
                recruitPaymentIntent: data.recruitPaymentIntent || null,
            });
        });

        // 登録日順でソート（降順）
        const sortedPartners = partners.sort((a, b) => 
            new Date(b.createdAt as any).getTime() - new Date(a.createdAt as any).getTime()
        );

        return {
            props: {
                partners: sortedPartners,
            },
        };

    } catch (err) {
        console.error('Admin ManageStores SSR error:', err);
        // 認証失敗時はログインページにリダイレクト
        return {
            redirect: { destination: '/partner/login', permanent: false },
        };
    }
};

// ===============================
// 管理画面ページコンポーネント
// ===============================
const ManageStoresPage: NextPage<ManageStoresProps> = ({ partners }) => {

    // 登録日をフォーマットする
    const formatDate = (dateString: string | Timestamp | undefined) => {
        if (!dateString) return 'N/A';
        try {
            const date = (typeof dateString === 'string') ? new Date(dateString) : (dateString as Timestamp).toDate();
            return date.toLocaleDateString('ja-JP', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
            });
        } catch (e) {
            console.error("Date format error:", e);
            return 'Invalid Date';
        }
    };

    return (
        <div className="min-h-screen bg-gray-100">
            <Head>
                <title>店舗管理 - みんなの那須アプリ</title>
            </Head>

            {/* ヘッダー */}
            <header className="bg-white shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
                    <h1 className="text-2xl font-bold text-gray-900">
                        店舗管理
                    </h1>
                    <Link href="/admin/dashboard" legacyBehavior>
                        <a className="text-sm font-medium text-blue-600 hover:text-blue-800">
                            ← 管理メニューに戻る
                        </a>
                    </Link>
                </div>
            </header>

            {/* 注意書き (スクリーンショット 2025-11-04 142945.png にあったもの) */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
                <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-md" role="alert">
                    <p><strong>注意：</strong> 現在、このページの認証は一時的に解除されています。（※このメッセージは開発用です）</p>
                </div>
            </div>

            {/* メインコンテンツ - テーブル */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="bg-white shadow overflow-hidden rounded-lg">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        企業/店舗名
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        登録サービス
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        ユーザー ID
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        支払い状況
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        登録年月日
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        連絡先
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        住所
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {partners.map((partner) => {
                                    
                                    // ★★★ 修正箇所: サービスごとのステータスを判定 ★★★
                                    const adverStatus = getPaymentStatusText(partner.adverSubscriptionStatus, partner.adverPaymentIntent);
                                    const recruitStatus = getPaymentStatusText(partner.recruitSubscriptionStatus, partner.recruitPaymentIntent);
                                    const services = getRegisteredServices(partner.roles);
                                    // ★★★ 修正ここまで ★★★

                                    return (
                                        <tr key={partner.uid}>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                {partner.storeName}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {/* ★★★ 修正箇所: 登録サービス表示 ★★★ */}
                                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                                    services === '両方' ? 'bg-indigo-100 text-indigo-800' : 
                                                    services === '広告＆紹介料' ? 'bg-blue-100 text-blue-800' :
                                                    services === '求人' ? 'bg-pink-100 text-pink-800' : 'bg-gray-100 text-gray-800'
                                                }`}>
                                                    {services}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-500 font-mono">
                                                {partner.uid}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {/* ★★★ 修正箇所: 支払い状況を2列で表示 ★★★ */}
                                                <div className="flex flex-col space-y-1">
                                                    <span className={`px-2 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(adverStatus)}`}>
                                                        広告: {adverStatus}
                                                    </span>
                                                    <span className={`px-2 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(recruitStatus)}`}>
                                                        求人: {recruitStatus}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {formatDate(partner.createdAt)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                <div className="truncate w-40">{partner.email}</div>
                                                <div className="truncate w-40">{partner.phoneNumber}</div>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-500">
                                                <div className="w-48 truncate">{partner.address}</div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default ManageStoresPage;