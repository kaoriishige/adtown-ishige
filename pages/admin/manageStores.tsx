import { NextPage, GetServerSideProps } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { adminDb } from '@/lib/firebase-admin';
import { useState } from 'react';
import { firestore } from 'firebase-admin';

// --- 型定義 ---
interface Store {
  id: string;
  companyName: string;
  address: string;
  phoneNumber: string;
  email: string;
  roles: string[];
  stripeCustomerId?: string;
  subscriptionStatus?: 'active' | 'trialing' | 'pending_invoice' | 'canceled' | 'past_due' | null;
  paymentMethod?: 'credit_card' | 'invoice' | 'unknown' | null;
}

interface ManageStoresPageProps {
  initialStores: Store[];
}

// --- サーバーサイド処理 ---
export const getServerSideProps: GetServerSideProps = async (context) => {
  try {
    const usersSnapshot = await adminDb.collection('users')
      .where('roles', 'array-contains-any', ['adver', 'recruit'])
      .get();

    const stores: Store[] = usersSnapshot.docs.map((doc: firestore.QueryDocumentSnapshot) => {
      const data = doc.data();
      return {
        id: doc.id,
        companyName: data.companyName || '名称未設定',
        address: data.address || '住所未設定',
        phoneNumber: data.phoneNumber || '電話番号未設定',
        email: data.email || 'メールアドレス未設定',
        roles: data.roles || [],
        stripeCustomerId: data.stripeCustomerId || null,
        subscriptionStatus: data.subscriptionStatus || null,
        paymentMethod: data.paymentMethod || null,
      };
    });

    return { props: { initialStores: stores } };
  } catch (error) {
    console.error("Error fetching stores for admin:", error);
    return { props: { initialStores: [] } };
  }
};

// --- コンポーネント本体 ---
const ManageStoresPage: NextPage<ManageStoresPageProps> = ({ initialStores }) => {
  const [stores, setStores] = useState<Store[]>(initialStores);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const router = useRouter();

  const handleDeleteStore = async (storeId: string) => {
    if (window.confirm("この店舗を本当に削除しますか？関連データも削除され、この操作は元に戻せません。")) {
      setIsDeleting(storeId);
      setError(null);
      try {
        const response = await fetch('/api/admin/deleteStore', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ storeId }),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || '削除に失敗しました。');
        }

        setStores(prevStores => prevStores.filter(store => store.id !== storeId));
        alert('店舗情報を削除しました。');
      } catch (e: any) {
        console.error("Error deleting store: ", e);
        setError(e.message || "店舗の削除中にエラーが発生しました。");
      } finally {
        setIsDeleting(null);
      }
    }
  };

  const getServiceType = (roles: string[]) => {
    const hasAd = roles.includes('adver');
    const hasRecruit = roles.includes('recruit');
    if (hasAd && hasRecruit) {
      return <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-purple-100 text-purple-800">両方</span>;
    }
    if (hasAd) {
      return <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">広告＆紹介料</span>;
    }
    if (hasRecruit) {
      return <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">求人</span>;
    }
    return <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">未分類</span>;
  };

  const getPaymentStatus = (paymentMethod?: 'credit_card' | 'invoice' | 'unknown' | null, subscriptionStatus?: 'active' | 'trialing' | 'pending_invoice' | 'canceled' | 'past_due' | null) => {
    let methodBadge, statusBadge;

    switch (paymentMethod) {
      case 'credit_card':
        methodBadge = <span className="bg-indigo-100 text-indigo-800 text-xs font-medium mr-2 px-2.5 py-0.5 rounded-full">クレカ</span>;
        break;
      case 'invoice':
        methodBadge = <span className="bg-teal-100 text-teal-800 text-xs font-medium mr-2 px-2.5 py-0.5 rounded-full">請求書</span>;
        break;
      default:
        methodBadge = <span className="bg-gray-100 text-gray-800 text-xs font-medium mr-2 px-2.5 py-0.5 rounded-full">未設定</span>;
    }

    switch (subscriptionStatus) {
      case 'active':
        statusBadge = <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded-full">有効</span>;
        break;
      case 'trialing':
        statusBadge = <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">無料トライアル</span>;
        break;
      case 'pending_invoice':
        statusBadge = <span className="bg-yellow-100 text-yellow-800 text-xs font-medium px-2.5 py-0.5 rounded-full">請求書待ち</span>;
        break;
      case 'canceled':
        statusBadge = <span className="bg-red-100 text-red-800 text-xs font-medium px-2.5 py-0.5 rounded-full">解約済</span>;
        break;
      case 'past_due':
        statusBadge = <span className="bg-red-500 text-white text-xs font-medium px-2.5 py-0.5 rounded-full">支払遅延</span>;
        break;
      default:
        statusBadge = <span className="bg-gray-100 text-gray-800 text-xs font-medium px-2.5 py-0.5 rounded-full">---</span>;
    }

    return (
      <div className="flex flex-wrap items-center">
        {methodBadge}
        {statusBadge}
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
          <Link href="/admin" className="text-sm text-blue-600 hover:underline mt-2 sm:mt-0">
            ← 管理メニューに戻る
          </Link>
        </div>
        <div className="mb-6">
          <p className="text-red-600 bg-red-100 p-4 rounded-md text-center">
            <strong>注意：</strong> 現在、このページの認証は一時的に解除されています。
          </p>
        </div>
        {error && <p className="text-red-600 bg-red-100 p-4 rounded-md mb-6">{error}</p>}

        <div className="bg-white rounded-lg shadow overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">企業/店舗名</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">登録サービス</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">支払い状況</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">顧客ID</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">連絡先</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">住所</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">アクション</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {stores.length > 0 ? stores.map(store => (
                <tr key={store.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-medium text-gray-900">{store.companyName}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getServiceType(store.roles)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getPaymentStatus(store.paymentMethod, store.subscriptionStatus)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <Link href={`https://dashboard.stripe.com/customers/${store.stripeCustomerId}`} target="_blank" rel="noopener noreferrer" className="hover:underline text-blue-500">
                      {store.stripeCustomerId || '未設定'}
                    </Link>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div>{store.email}</div>
                    <div>{store.phoneNumber}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{store.address}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-4">
                    <button onClick={() => router.push(`/admin/edit-store/${store.id}`)} className="text-indigo-600 hover:text-indigo-900">編集</button>
                    <button onClick={() => handleDeleteStore(store.id)} disabled={isDeleting === store.id} className="text-red-600 hover:text-red-900 disabled:opacity-50">
                      {isDeleting === store.id ? '削除中...' : '削除'}
                    </button>
                    {store.roles.includes('ad') && (
                      <Link href={`/admin/referral-rewards?storeId=${store.id}`} className="text-green-600 hover:text-green-900">
                        報酬管理
                      </Link>
                    )}
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={7} className="p-4 text-center text-gray-500">登録されている店舗はありません。</td>
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
// ... (コンポーネント本体は省略)