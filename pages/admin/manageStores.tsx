import { NextPage, GetServerSideProps } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import React, { useState } from 'react';
import { adminDb } from '@/lib/firebase-admin';
import { firestore } from 'firebase-admin';
import {
  RiDeleteBinLine,
  RiMoneyDollarCircleLine,
} from 'react-icons/ri';

interface Store {
  id: string;
  companyName: string;
  address: string;
  phoneNumber: string;
  email: string;
  roles: string[];
  userId: string;
  stripeCustomerId?: string;
  createdAt?: string;
  adverSubscriptionStatus?:
    | 'active'
    | 'trialing'
    | 'pending_invoice'
    | 'canceled'
    | 'past_due'
    | 'pending_card'
    | 'pending_checkout'
    | null;
  recruitSubscriptionStatus?:
    | 'active'
    | 'trialing'
    | 'pending_invoice'
    | 'canceled'
    | 'past_due'
    | 'pending_card'
    | 'pending_checkout'
    | null;
  adverBillingCycle?: 'monthly' | 'annual' | 'invoice' | null;
  recruitBillingCycle?: 'monthly' | 'annual' | 'invoice' | null;
}

interface ManageStoresPageProps {
  initialStores: Store[];
}

const APP_ID = 'default-app-id';

// 日付フォーマット関数
const formatDate = (timestamp: firestore.Timestamp | undefined): string => {
  if (!timestamp) return '未設定';
  const date = timestamp.toDate();
  return date.toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
};

// ✅ Firestoreから全店舗データを取得
export const getServerSideProps: GetServerSideProps = async () => {
  const stores: Store[] = [];

  try {
    // 全ユーザーを取得
    const usersSnapshot = await adminDb
      .collection('artifacts')
      .doc(APP_ID)
      .collection('users')
      .get();

    console.log(`👤 users count: ${usersSnapshot.size}`);

    for (const userDoc of usersSnapshot.docs) {
      const userId = userDoc.id;
      const storesSnapshot = await userDoc.ref.collection('stores').get();

      console.log(`📁 user ${userId} → stores: ${storesSnapshot.size}`);

      storesSnapshot.forEach((storeDoc) => {
        const data = storeDoc.data();
        stores.push({
          id: storeDoc.id,
          userId,
          companyName:
            data.companyName || data.name || data.storeName || '名称未設定',
          address: data.address || '住所未設定',
          phoneNumber: data.phoneNumber || '電話番号未設定',
          email: data.email || 'メールアドレス未設定',
          roles: data.roles || [],
          stripeCustomerId: data.stripeCustomerId || null,
          createdAt: data.createdAt
            ? formatDate(data.createdAt as firestore.Timestamp)
            : '未設定',
          adverSubscriptionStatus: data.adverSubscriptionStatus || null,
          recruitSubscriptionStatus: data.recruitSubscriptionStatus || null,
          adverBillingCycle: data.adverBillingCycle || null,
          recruitBillingCycle: data.recruitBillingCycle || null,
        });
      });
    }

    console.log(`✅ Firestoreから取得した店舗数: ${stores.length}`);

    return { props: { initialStores: stores } };
  } catch (error) {
    console.error('❌ Firestoreからの取得エラー:', error);
    return { props: { initialStores: [] } };
  }
};

// ✅ UI部分
const ManageStoresPage: NextPage<ManageStoresPageProps> = ({ initialStores }) => {
  const [stores] = useState<Store[]>(initialStores);
  const [error] = useState<string | null>(null);
  const [loadingStore] = useState<string | null>(null);

  const showMessage = (message: string) => alert(message);

  const handleDeleteStore = async (storeId: string) => {
    showMessage('削除APIの呼び出しロジックは未実装です。');
  };

  const getServiceType = (roles: string[]) => {
    const hasAd = roles.includes('adver');
    const hasRecruit = roles.includes('recruit');
    if (hasAd && hasRecruit)
      return (
        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-purple-100 text-purple-800">
          両方
        </span>
      );
    if (hasAd)
      return (
        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
          広告＆紹介料
        </span>
      );
    if (hasRecruit)
      return (
        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
          求人
        </span>
      );
    return (
      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
        未分類
      </span>
    );
  };

  const getPaymentStatus = (store: Store) => {
    const getMethodDisplay = (cycle: Store['adverBillingCycle']) => {
      if (cycle === 'monthly' || cycle === 'annual')
        return (
          <span className="bg-indigo-600 text-white text-xs font-medium px-1.5 rounded-full">
            💳 クレジット決済
          </span>
        );
      if (cycle === 'invoice')
        return (
          <span className="bg-teal-600 text-white text-xs font-medium px-1.5 rounded-full">
            📄 請求書決済
          </span>
        );
      return (
        <span className="bg-gray-200 text-gray-700 text-xs font-medium px-1.5 rounded-full">
          未設定
        </span>
      );
    };

    const getStatusBadge = (status: Store['adverSubscriptionStatus']) => {
      switch (status) {
        case 'active':
          return (
            <span className="bg-green-100 text-green-800 text-xs font-medium px-1.5 rounded-full">
              有効
            </span>
          );
        case 'trialing':
          return (
            <span className="bg-blue-100 text-blue-800 text-xs font-medium px-1.5 rounded-full">
              トライアル中
            </span>
          );
        case 'pending_invoice':
          return (
            <span className="bg-yellow-100 text-yellow-800 text-xs font-medium px-1.5 rounded-full">
              請求書待ち
            </span>
          );
        case 'canceled':
          return (
            <span className="bg-red-100 text-red-800 text-xs font-medium px-1.5 rounded-full">
              解約済
            </span>
          );
        case 'past_due':
          return (
            <span className="bg-red-500 text-white text-xs font-medium px-1.5 rounded-full">
              支払遅延
            </span>
          );
        default:
          return (
            <span className="bg-gray-100 text-gray-800 text-xs font-medium px-1.5 rounded-full">
              無料/未登録
            </span>
          );
      }
    };

    return (
      <div className="flex flex-col space-y-1">
        <div className="flex items-center space-x-1 mt-0.5">
          {getMethodDisplay(store.adverBillingCycle)}
          {getStatusBadge(store.adverSubscriptionStatus)}
        </div>
        <div className="flex items-center space-x-1 mt-0.5">
          {getMethodDisplay(store.recruitBillingCycle)}
          {getStatusBadge(store.recruitSubscriptionStatus)}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4 sm:p-8">
      <Head>
        <title>店舗管理 - 管理者ページ</title>
      </Head>
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center">
          <h1 className="text-3xl font-bold text-gray-800">店舗管理</h1>
          <Link
            href="/admin"
            className="text-sm text-blue-600 hover:underline mt-2 sm:mt-0"
          >
            ← 管理メニューに戻る
          </Link>
        </div>

        {error && (
          <p className="text-red-600 bg-red-100 p-4 rounded-md mb-6">{error}</p>
        )}

        <div className="bg-white rounded-lg shadow overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">企業/店舗名</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">登録サービス</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ユーザー ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">支払い状況</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">登録年月日</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">連絡先</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">住所</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">アクション</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {stores.length > 0 ? (
                stores.map((store) => (
                  <tr key={store.id}>
                    <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">
                      {store.companyName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getServiceType(store.roles)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 font-mono">
                      {store.userId}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getPaymentStatus(store)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {store.createdAt}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div>{store.email}</div>
                      <div>{store.phoneNumber}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {store.address}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-4">
                      <button
                        onClick={() => handleDeleteStore(store.id)}
                        disabled={loadingStore === store.id}
                        className="text-red-600 hover:text-red-900 disabled:opacity-50 inline-flex items-center space-x-1"
                      >
                        <RiDeleteBinLine className="w-4 h-4" />
                        <span>{loadingStore === store.id ? '削除中...' : '削除'}</span>
                      </button>
                      <Link
                        href={`/admin/referral-rewards?storeId=${store.id}`}
                        className="text-green-600 hover:text-green-900 inline-flex items-center space-x-1"
                      >
                        <RiMoneyDollarCircleLine className="w-4 h-4" />
                        <span>報酬管理</span>
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="p-4 text-center text-gray-500">
                    登録されている店舗はありません。
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

export default ManageStoresPage;





