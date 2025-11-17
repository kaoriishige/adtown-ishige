import { NextPage, GetServerSideProps } from "next";
import Head from "next/head";
import Link from "next/link";
import React, { useState } from "react";
// ★ 修正: adminAuth と nookies を削除
import { adminDb } from "@/lib/firebase-admin";
import { firestore } from "firebase-admin";
import { RiEdit2Line, RiDeleteBinLine, RiLoader4Line } from 'react-icons/ri';

type Timestamp = firestore.Timestamp;

// --- 型定義 (変更なし) ---
type SubscriptionStatus =
  | "active"
  | "trialing"
  | "pending_invoice"
  | "canceled"
  | "past_due"
  | "pending_card"
  | "pending_checkout"
  | null;
type BillingCycle = "monthly" | "annual" | "invoice" | null;

interface StoreUserData {
  id: string; // User ID
  companyName: string;
  address: string;
  phoneNumber: string;
  email: string;
  roles: string[];
  userId: string; // User ID (idと同じ)
  stripeCustomerId?: string;
  createdAt: string; // シリアライズ後の文字列
  adverSubscriptionStatus: SubscriptionStatus;
  recruitSubscriptionStatus: SubscriptionStatus;
  adverBillingCycle: BillingCycle;
  recruitBillingCycle: BillingCycle;
}

interface ManageStoresPageProps {
  initialStores: StoreUserData[];
}

// ✅ 日付フォーマット関数 (変更なし)
const formatDate = (timestamp: Timestamp | undefined): string => {
  if (!timestamp) return "未設定";
  if (typeof (timestamp as any).toDate !== "function") return "データ形式エラー";
  try {
    const date = timestamp.toDate();
    return date.toLocaleDateString("ja-JP", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  } catch {
    return "日付変換エラー";
  }
};

// ★★★ 修正: getServerSideProps から管理者認証チェックを削除 ★★★
export const getServerSideProps: GetServerSideProps<ManageStoresPageProps> = async (context) => {
  const stores: StoreUserData[] = []; 

  try {
    // --- ★ 管理者認証チェックを削除 ---
    /*
    const cookies = nookies.get(context);
    const sessionCookie = cookies.session || '';
    if (!sessionCookie) {
      return { redirect: { destination: '/partner/login', permanent: false } };
    }
    const token = await adminAuth.verifySessionCookie(sessionCookie, true);
    const adminUserDoc = await adminDb.collection('users').doc(token.uid).get();
    if (!adminUserDoc.exists || !adminUserDoc.data()?.roles?.includes('admin')) {
      console.warn(`[Auth] Non-admin user ${token.uid} tried to access /admin/manageStores`);
      return { redirect: { destination: '/partner/login', permanent: false } };
    }
    */
    // --- ★ 削除ここまで ---

    // 3. ユーザーデータを取得 (元のロジック)
    const usersSnapshot = await adminDb
      .collection("users")
      .get();

    console.log(`👤 users (root) count: ${usersSnapshot.size}`);

    for (const userDoc of usersSnapshot.docs) {
      const userId = userDoc.id;
      const data = userDoc.data();
      const roles: string[] = data.roles || [];

      // 'adver' も 'recruit' も持っていないユーザーはスキップ
      if (!roles.includes("adver") && !roles.includes("recruit")) {
        continue;
      }

      const createdAtTimestamp = data.createdAt as Timestamp | undefined;
      const companyName =
        data.companyName || data.storeName || data.name || data.email || "名称未設定";

      stores.push({
        id: userDoc.id,
        userId,
        companyName,
        address: data.address || "住所未設定",
        phoneNumber: data.phoneNumber || "電話番号未設定",
        email: data.email || "メールアドレス未設定",
        roles: roles,
        stripeCustomerId: data.stripeCustomerId || null,
        createdAt: formatDate(createdAtTimestamp),
        adverSubscriptionStatus: data.adverSubscriptionStatus || null,
        recruitSubscriptionStatus: data.recruitSubscriptionStatus || null,
        adverBillingCycle: data.adverBillingCycle || null,
        recruitBillingCycle: data.recruitBillingCycle || null,
      });
    }

    // 登録日順（降順）に並び替え
    const sortedStores = stores.sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA;
    });

    console.log(`✅ Firestoreから取得した店舗(ユーザー)数: ${sortedStores.length}`);
    return { props: { initialStores: sortedStores } };

  } catch (error) {
    console.error("❌ Firestoreからの取得エラー (全体):", error);
    // 認証エラーは発生しないはずだが、DBエラーはありうる
    return { props: { initialStores: [] } };
  }
};


// --- UI ヘルパーコンポーネント ---

// 1. 登録サービス表示 (変更なし)
const getServiceType = (roles: string[]) => {
    const hasAd = roles.includes("adver");
    const hasRecruit = roles.includes("recruit");
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

// 2. ServiceStatusDisplay (変更なし)
interface ServiceStatusDisplayProps {
  hasRole: boolean; 
  status: SubscriptionStatus;
  cycle: BillingCycle;
  userId: string;
  serviceName: 'adver' | 'recruit';
  onActivate: (userId: string, service: 'adver' | 'recruit') => void;
  loadingMap: Record<string, boolean>;
}
const ServiceStatusDisplay: React.FC<ServiceStatusDisplayProps> = ({
  hasRole, status, cycle, userId, serviceName, onActivate, loadingMap
}) => {
    if (!hasRole) {
        return <span className="text-gray-400 italic">未登録</span>;
    }
    let statusText = "無料プラン";
    let statusColor = "text-gray-500";
    if (status === 'active' || status === 'trialing') {
        statusText = "有料プラン";
        statusColor = "font-semibold text-green-600";
    } else if (status === 'pending_invoice' || status === 'pending_checkout' || status === 'pending_card' || status === 'past_due') {
        statusText = "保留中";
        statusColor = "font-semibold text-yellow-600";
    }
    let billingText = "---";
    let billingColor = "text-gray-400";
    let isInvoice = false; 
    if (cycle === 'invoice') {
        billingText = "請求書";
        billingColor = "font-semibold text-blue-600";
        isInvoice = true;
    } else if (cycle === 'monthly' || cycle === 'annual') {
        billingText = "クレジット";
        billingColor = "font-semibold text-gray-700";
    } 
    else if (status === 'pending_invoice') {
        billingText = "請求書";
        billingColor = "font-semibold text-blue-600";
        isInvoice = true;
    } else if (status === 'active' || status === 'trialing' || status === 'past_due' || status === 'pending_card') {
         billingText = "クレジット";
         billingColor = "font-semibold text-gray-700";
    }
    const showButton = (isInvoice && (status === 'pending_invoice' || status === 'pending_checkout'));
    const isLoading = loadingMap[`${userId}-${serviceName}`];
    const serviceLabel = serviceName === 'adver' ? '広告' : '求人';
    return (
        <div className="flex flex-col space-y-1">
            <div>
                <span className={statusColor}>{statusText}</span>
                <span className={`ml-2 ${billingColor}`}>({billingText})</span>
            </div>
            {showButton && (
                <button
                    onClick={() => onActivate(userId, serviceName)}
                    disabled={isLoading}
                    className="px-2 py-1 text-xs font-bold text-white bg-green-600 rounded hover:bg-green-700 disabled:bg-gray-400 flex items-center justify-center"
                >
                    {isLoading ? <RiLoader4Line className="animate-spin mr-1" /> : null}
                    {isLoading ? '処理中...' : `${serviceLabel}を有効化`}
                </button>
            )}
        </div>
    );
};


// ✅ メインページコンポーネント
const ManageStoresPage: NextPage<ManageStoresPageProps> = ({ initialStores }) => {
  const [stores, setStores] = useState<StoreUserData[]>(initialStores);
  const [loadingMap, setLoadingMap] = useState<Record<string, boolean>>({}); 
  const [error, setError] = useState<string | null>(null);

  // 3. 公開ボタン (API呼び出し) (変更なし)
  const handleActivateInvoiceUser = async (userId: string, service: 'adver' | 'recruit') => {
    if (!confirm(`ユーザーID: ${userId} の ${service === 'adver' ? '広告' : '求人'} プランを「有効(active)」にしますか？\n(請求書入金確認後に押してください)`)) return;
    
    const loadingKey = `${userId}-${service}`;
    setLoadingMap(prev => ({ ...prev, [loadingKey]: true }));
    setError(null);
    
    try {
        // APIエンドポイントを呼び出す
        const response = await fetch('/api/admin/activateUser', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ targetUserId: userId, service: service }),
        });

        if (!response.ok) {
            const data = await response.json();
            // ★ Forbidden: Not an admin エラーはここでキャッチされる
            throw new Error(data.error || 'APIリクエストに失敗しました');
        }

        // 成功した場合、ローカルのUIを更新
        setStores(prevStores => prevStores.map(s => {
            if (s.userId === userId) {
                if (service === 'adver') {
                    return { 
                        ...s, 
                        adverSubscriptionStatus: 'active', 
                        adverBillingCycle: 'invoice' 
                    };
                }
                if (service === 'recruit') {
                     return { 
                        ...s, 
                        recruitSubscriptionStatus: 'active', 
                        recruitBillingCycle: 'invoice' 
                    };
                }
            }
            return s;
        }));

    } catch (err: any) {
        setError(err.message || "更新に失敗しました");
    } finally {
        setLoadingMap(prev => ({ ...prev, [loadingKey]: false }));
    }
  };
  
  // 4. 削除ボタン (変更なし)
  const handleDeleteUser = async (userId: string) => {
   if (!confirm(`ユーザーID: ${userId} を本当に削除しますか？\nこの操作は元に戻せません。関連するデータも削除されます。`)) return;
    
    const loadingKey = `${userId}-delete`;
    setLoadingMap(prev => ({ ...prev, [loadingKey]: true }));
    setError(null);

    try {
        // TODO: 本実装では、/api/admin/deleteUser を作成して呼び出す
        await new Promise(res => setTimeout(res, 1000));
        console.warn("削除APIは未実装です。UIのみ更新します。");
        
        setStores(prevStores => prevStores.filter(s => s.userId !== userId));
        
    } catch (err: any) {
        setError(err.message || "削除に失敗しました");
    } finally {
        setLoadingMap(prev => ({ ...prev, [loadingKey]: false }));
    }
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
             <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-md text-sm font-semibold">
                エラー: {error}
             </div>
        )}

        <div className="bg-white rounded-lg shadow overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  登録日
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  企業/店舗名
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  登録サービス
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  広告プラン
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  求人プラン
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  メールアドレス
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ユーザーID
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {stores.length > 0 ? (
                stores.map((store) => (
                  <tr key={store.id}>
                    {/* 登録日 */}
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                      {store.createdAt}
                    </td>
                    {/* 企業/店舗名 */}
                    <td className="px-4 py-4 whitespace-nowrap font-medium text-gray-900">
                      {store.companyName}
                    </td>
                    {/* 登録サービス */}
                    <td className="px-4 py-4 whitespace-nowrap">
                      {getServiceType(store.roles)}
                    </td>
                    
                    {/* 広告プラン */}
                    <td className="px-4 py-4 whitespace-nowrap text-sm">
                      <ServiceStatusDisplay
                        hasRole={store.roles.includes('adver')} 
                        status={store.adverSubscriptionStatus}
                        cycle={store.adverBillingCycle}
                        userId={store.userId}
                        serviceName="adver"
                        onActivate={handleActivateInvoiceUser}
                        loadingMap={loadingMap}
                      />
                    </td>
                    
                    {/* 求人プラン */}
                    <td className="px-4 py-4 whitespace-nowrap text-sm">
                       <ServiceStatusDisplay
                        hasRole={store.roles.includes('recruit')} 
                        status={store.recruitSubscriptionStatus}
                        cycle={store.recruitBillingCycle}
                        userId={store.userId}
                        serviceName="recruit"
                        onActivate={handleActivateInvoiceUser}
                        loadingMap={loadingMap}
                      />
                    </td>

                    {/* メールアドレス */}
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                      {store.email}
                    </td>
                    {/* ユーザーID */}
                    <td className="px-4 py-4 text-sm text-gray-500 font-mono">
                      {store.userId}
                    </td>
                    {/* 操作ボタン */}
                    <td className="px-4 py-4 whitespace-nowrap text-sm">
                        <div className="flex space-x-2">
                            {/* 編集ボタン */}
                            <Link href={`/admin/editStore/${store.userId}`} className="text-indigo-600 hover:text-indigo-900" title="編集">
                                <RiEdit2Line size={18} />
                            </Link>
                            {/* 削除ボタン */}
                            <button
                                onClick={() => handleDeleteUser(store.userId)}
                                disabled={loadingMap[store.userId + 'delete']}
                                className="text-red-600 hover:text-red-900 disabled:text-gray-400"
                                title="削除"
                            >
                                {loadingMap[store.userId + 'delete'] ? <RiLoader4Line className="animate-spin" /> : <RiDeleteBinLine size={18} />}
                            </button>
                        </div>
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







