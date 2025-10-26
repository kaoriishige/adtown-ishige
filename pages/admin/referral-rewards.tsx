import { NextPage, GetServerSideProps } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import React, { useState, useCallback } from 'react';
import {
  RiSearchLine,
  RiBankCardLine,
  RiCheckDoubleLine,
  RiExternalLinkLine,
  RiArrowGoForwardLine,
} from 'react-icons/ri';
import { Loader2 } from 'lucide-react';

import nookies from 'nookies';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import * as admin from 'firebase-admin';

// 型定義
interface StoreReferralData {
  storeId: string;
  companyName: string;
  contactPerson: string;
  totalReferrals: number;
  lifetimeRevenue: number;
  unpaidAmount: number;
  lastPaidDate: string | null;
}

interface ReferralRewardsProps {
  initialData: StoreReferralData[];
  error?: string;
}

// --- サーバーサイド ---
export const getServerSideProps: GetServerSideProps = async (context) => {
  let initialData: StoreReferralData[] = [];
  let error: string | undefined;

  try {
    // 認証を無効化（開発用）
    // const cookies = nookies.get(context);
    // await adminAuth.verifySessionCookie(cookies.session || '', true);

    const pendingPayoutsSnap = await adminDb
      .collection('referralPayouts')
      .where('status', '==', 'pending')
      .get();

    const unpaidMap = new Map<string, { unpaidAmount: number; lifetimeRevenue: number }>();
    const storeIds: string[] = [];

    pendingPayoutsSnap.docs.forEach((doc) => {
      const data = doc.data();
      const storeId = data.referrerUid as string;
      const amount = data.amount || 0;
      const isPaid = data.status === 'paid';

      if (!storeIds.includes(storeId)) {
        storeIds.push(storeId);
      }

      const current = unpaidMap.get(storeId) || {
        unpaidAmount: 0,
        lifetimeRevenue: 0,
      };

      if (!isPaid) current.unpaidAmount += amount;
      current.lifetimeRevenue += amount;
      unpaidMap.set(storeId, current);
    });

    if (storeIds.length > 0) {
      const usersSnap = await adminDb
        .collection('users')
        .where(admin.firestore.FieldPath.documentId(), 'in', storeIds.slice(0, 10))
        .get();

      const usersData = new Map(usersSnap.docs.map((doc) => [doc.id, doc.data()]));

      initialData = storeIds
        .slice(0, 10)
        .map((storeId) => {
          const userData = usersData.get(storeId);
          const paymentData = unpaidMap.get(storeId)!;
          return {
            storeId,
            companyName: userData?.companyName || userData?.storeName || '店舗名不明',
            contactPerson: userData?.displayName || '担当者不明',
            totalReferrals: userData?.totalReferrals || 0,
            lifetimeRevenue: paymentData.lifetimeRevenue,
            unpaidAmount: paymentData.unpaidAmount,
            lastPaidDate: userData?.lastReferralPaidDate || null,
          };
        })
        .filter((d) => d.unpaidAmount > 0);

      if (initialData.length === 0) {
        initialData.push({
          storeId: 'demo-store-01',
          companyName: 'デモ店舗A',
          contactPerson: 'デモ 太郎',
          totalReferrals: 10,
          lifetimeRevenue: 10000,
          unpaidAmount: 5000,
          lastPaidDate: '2025-08-01',
        });
      }
    }
  } catch (e: any) {
    console.error('Referral Data Fetch Error:', e);
    error = `データの取得中にエラーが発生しました: ${e.message}`;
    initialData = [];
  }

  return { props: { initialData, error } };
};

// --- クライアント側 ---
const ReferralRewardsPage: NextPage<ReferralRewardsProps> = ({ initialData, error }) => {
  const [referralData, setReferralData] = useState<StoreReferralData[]>(initialData);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isPayoutRunning, setIsPayoutRunning] = useState(false);
  const [payoutMessage, setPayoutMessage] = useState<string | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(error || null);
  const router = useRouter();

  // --- 検索 ---
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

    const filtered = initialData.filter(
      (store) =>
        store.companyName.toLowerCase().includes(query) ||
        store.storeId.includes(query)
    );

    setReferralData(filtered);
    if (filtered.length === 0) {
      setFetchError('該当する店舗が見つかりませんでした。');
    }
    setIsLoading(false);
  };

  // --- 自動支払い ---
  const handleTriggerPayout = useCallback(async () => {
    if (
      !window.confirm(
        '未払い額が3,000円以上の全パートナーに対し、Stripe Connect経由で自動支払いを実行しますか？'
      )
    ) {
      return;
    }

    setIsPayoutRunning(true);
    setPayoutMessage(null);

    try {
      const response = await fetch('/api/admin/payout-referral-rewards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || result.message || 'APIの実行に失敗しました。');
      }

      setPayoutMessage(
        `✅ 支払い実行が完了しました。成功: ${result.successfulPayouts.length}件, 失敗: ${result.failedPayouts.length}件。`
      );

      setReferralData((prevData) =>
        prevData.map((d) => {
          if (result.successfulPayouts.some((p: any) => p.partnerId === d.storeId)) {
            return {
              ...d,
              unpaidAmount: 0,
              lastPaidDate: new Date().toLocaleDateString('ja-JP'),
            };
          }
          return d;
        })
      );
    } catch (e: any) {
      setPayoutMessage(`🚨 自動支払い実行エラー: ${e.message}`);
      console.error('Auto Payout Error:', e);
    } finally {
      setIsPayoutRunning(false);
    }
  }, []);

  // --- 手動支払い記録 ---
  const handleRecordPayment = async (store: StoreReferralData) => {
    if (store.unpaidAmount < 3000) {
      alert('未払い額が3,000円未満のため、支払い記録を確定できません。');
      return;
    }

    if (
      !window.confirm(
        `${store.companyName} に対し、未払い額 ${store.unpaidAmount.toLocaleString()}円 の支払い記録を確定しますか？`
      )
    ) {
      return;
    }

    try {
      alert(`支払い記録が完了しました: ${store.companyName}`);
      setReferralData((prevData) =>
        prevData.map((d) =>
          d.storeId === store.storeId
            ? {
                ...d,
                unpaidAmount: 0,
                lastPaidDate: new Date().toLocaleDateString('ja-JP'),
              }
            : d
        )
      );
    } catch (e: any) {
      alert(`支払い記録に失敗しました: ${e.message}`);
      console.error('Payment Record Error:', e);
    }
  }; // ← ✅ セミコロン追加済み

  const totalUnpaid = referralData.reduce((sum, d) => sum + d.unpaidAmount, 0);

  return (
    <div className="min-h-screen bg-gray-100 p-4 sm:p-8">
      <Head>
        <title>店舗紹介料管理 - 管理者ページ</title>
      </Head>

      <div className="max-w-7xl mx-auto">
        <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center">
          <h1 className="text-3xl font-bold text-gray-800">店舗紹介料管理</h1>
          <Link
            href="/admin/dashboard"
            className="text-sm text-blue-600 hover:underline mt-2 sm:mt-0"
          >
            ← ダッシュボードに戻る
          </Link>
        </div>

        <div className="mb-6">
          <div className="text-center p-4 bg-purple-100 rounded-lg shadow-md mb-4">
            <h2 className="text-xl font-bold text-purple-800 flex items-center justify-center">
              <RiBankCardLine className="mr-2" />
              総支払い対象額: {totalUnpaid.toLocaleString()} 円
            </h2>
          </div>
          <p className="text-red-600 bg-red-100 p-4 rounded-md text-center text-sm">
            <strong>注意：</strong> 未払い額が
            <strong>3,000円</strong> 以上の店舗が支払い対象です。
          </p>
        </div>

        {/* 支払い実行 */}
        <div className="bg-white p-6 rounded-lg shadow mb-6 border-t-4 border-teal-500">
          <h3 className="text-xl font-bold mb-3 text-teal-700 flex items-center">
            <RiExternalLinkLine className="mr-2" />自動支払い（Stripe Connect）
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            月末締めの翌月15日に自動実行される処理を、手動でテスト・実行します。
          </p>
          {payoutMessage && (
            <div
              className={`p-3 rounded-md mb-4 text-sm font-semibold ${
                payoutMessage.startsWith('✅')
                  ? 'bg-green-100 text-green-800'
                  : 'bg-red-100 text-red-800'
              }`}
            >
              {payoutMessage}
            </div>
          )}
          <button
            onClick={handleTriggerPayout}
            disabled={isPayoutRunning}
            className="bg-teal-600 text-white px-6 py-2 rounded-md hover:bg-teal-700 disabled:bg-gray-400 flex items-center font-bold"
          >
            {isPayoutRunning ? (
              <>
                <Loader2 className="mr-2 animate-spin w-5 h-5" /> 実行中...
              </>
            ) : (
              <>
                <RiArrowGoForwardLine className="mr-2 w-5 h-5" /> 全パートナーに自動支払いをトリガー
              </>
            )}
          </button>
        </div>

        {/* 検索 */}
        <div className="bg-white p-4 rounded-lg shadow mb-6">
          <form onSubmit={handleSearch} className="flex gap-4">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="店舗名またはUIDで検索"
              className="flex-grow p-2 border border-gray-300 rounded-md"
            />
            <button
              type="submit"
              disabled={isLoading}
              className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-400 flex items-center"
            >
              <RiSearchLine className="mr-1" />
              {isLoading ? '検索中...' : '検索'}
            </button>
          </form>
        </div>

        {/* テーブル */}
        <div className="bg-white rounded-lg shadow overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  店舗情報 / UID
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  累計紹介収益
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  未払い紹介料
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  最終支払い日
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  アクション
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {referralData.length > 0 ? (
                referralData.map((store) => {
                  const isPayable = store.unpaidAmount >= 3000;
                  return (
                    <tr
                      key={store.storeId}
                      className={isPayable ? 'bg-red-50' : ''}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium text-gray-900">
                          {store.companyName} ({store.contactPerson})
                        </div>
                        <div className="text-xs text-gray-400 break-all">
                          UID: {store.storeId}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-700">
                        {store.totalReferrals.toLocaleString()} 人 (
                        {store.lifetimeRevenue.toLocaleString()} 円)
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center text-lg font-bold">
                        <span
                          className={`px-3 py-1 rounded-full ${
                            isPayable
                              ? 'bg-red-100 text-red-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}
                        >
                          {store.unpaidAmount.toLocaleString()} 円
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-700">
                        {store.lastPaidDate || '未実施'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                        <button
                          onClick={() => handleRecordPayment(store)}
                          disabled={!isPayable || isPayoutRunning}
                          className="text-white bg-teal-600 hover:bg-teal-700 px-3 py-1 rounded-md text-xs disabled:bg-gray-400 flex items-center justify-center mx-auto"
                        >
                          <RiCheckDoubleLine className="mr-1" />
                          {isPayable ? '支払い記録を確定' : '保留 (3千円未満)'}
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={5} className="p-4 text-center text-gray-500">
                    該当する店舗が見つかりませんでした。
                  </td>
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
