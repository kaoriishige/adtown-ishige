import { GetServerSideProps, NextPage } from 'next';
import Head from 'next/head';
import React, { useState } from 'react';
import { adminDb, getUidFromCookie } from '../../lib/firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';
import * as admin from 'firebase-admin';

// ===============================
// 型定義
// ===============================
interface PayoutRequest {
    id: string;
    partnerName: string;
    amount: number;
    status: 'pending' | 'paid';
    requestedAt: string;
}

interface RewardsProps {
    payouts: PayoutRequest[];
}

// ===============================
// メインページコンポーネント
// ===============================
const RewardsPage: NextPage<RewardsProps> = ({ payouts: initialPayouts }) => {
    const [payouts, setPayouts] = useState(initialPayouts);

    const handleMarkAsPaid = async (payoutId: string) => {
        // Optimistic UI update
        setPayouts(payouts.map(p => p.id === payoutId ? { ...p, status: 'paid' } : p));

        try {
            await fetch(`/api/admin/payouts/${payoutId}/mark-paid`, { method: 'PATCH' });
        } catch (error) {
            console.error("Failed to update payout status:", error);
            // Revert UI on failure
            setPayouts(initialPayouts); 
            alert('更新に失敗しました。');
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 p-8">
            <Head>
                <title>報酬支払い管理</title>
                <script src="https://cdn.tailwindcss.com"></script>
            </Head>
            <div className="max-w-6xl mx-auto bg-white p-6 rounded-lg shadow-md">
                <h1 className="text-2xl font-bold text-gray-800 mb-6">報酬支払い管理</h1>

                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">パートナー名</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">申請日時</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">金額</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ステータス</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {payouts.map((payout) => (
                                <tr key={payout.id} className={payout.status === 'paid' ? 'bg-gray-50' : ''}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{payout.partnerName}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{payout.requestedAt}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">¥{payout.amount.toLocaleString()}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                            payout.status === 'paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                                        }`}>
                                            {payout.status === 'paid' ? '支払い済み' : '保留中'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                        {payout.status === 'pending' && (
                                            <button 
                                                onClick={() => handleMarkAsPaid(payout.id)}
                                                className="text-indigo-600 hover:text-indigo-900"
                                            >
                                                支払い済みにする
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

// ===============================
// サーバーサイド処理
// ===============================
export const getServerSideProps: GetServerSideProps = async (context) => {
    try {
        const uid = await getUidFromCookie(context);
        if (!uid) return { redirect: { destination: '/partner/login', permanent: false } };

        const userDoc = await adminDb.collection('users').doc(uid).get();
        if (!userDoc.exists || !userDoc.data()?.roles?.includes('admin')) {
            return { redirect: { destination: '/partner/login?error=permission_denied', permanent: false } };
        }

        const payoutsSnapshot = await adminDb.collection('payouts').orderBy('requestedAt', 'desc').get();
        
        // パートナー情報を先に取得してマップを作成
        const usersSnapshot = await adminDb.collection('users').get();
        const usersData: { [key: string]: string } = {};
        // ★★★ 修正箇所: 'doc'に型を明示的に指定 ★★★
        usersSnapshot.docs.forEach((doc: admin.firestore.QueryDocumentSnapshot) => {
            usersData[doc.id] = doc.data().companyName || '（企業名未設定）';
        });

        const payouts = payoutsSnapshot.docs.map((doc: admin.firestore.QueryDocumentSnapshot) => {
            const data = doc.data();
            const requestedAt = data.requestedAt as Timestamp;
            return {
                id: doc.id,
                partnerName: usersData[data.partnerId] || '（不明なパートナー）',
                amount: data.amount || 0,
                status: data.status || 'pending',
                requestedAt: requestedAt.toDate().toLocaleString('ja-JP'),
            };
        });

        return { props: { payouts } };
    } catch (error) {
        console.error("Error fetching payouts:", error);
        return { props: { payouts: [] } };
    }
};

export default RewardsPage;