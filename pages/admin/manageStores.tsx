import { NextPage, GetServerSideProps } from "next";
import Head from "next/head";
import Link from "next/link";
import React, { useState } from "react";
import { adminDb } from "@/lib/firebase-admin";
import { firestore } from "firebase-admin";

type Timestamp = firestore.Timestamp;

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
    | "active"
    | "trialing"
    | "pending_invoice"
    | "canceled"
    | "past_due"
    | "pending_card"
    | "pending_checkout"
    | null;
  recruitSubscriptionStatus?:
    | "active"
    | "trialing"
    | "pending_invoice"
    | "canceled"
    | "past_due"
    | "pending_card"
    | "pending_checkout"
    | null;
  adverBillingCycle?: "monthly" | "annual" | "invoice" | null;
  recruitBillingCycle?: "monthly" | "annual" | "invoice" | null;
}

interface ManageStoresPageProps {
  initialStores: Store[];
}

// ✅ 日付フォーマット関数
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

// ✅ Firestoreから全店舗データを取得（artifacts/default-app-id/users/.../stores/...）
export const getServerSideProps: GetServerSideProps<ManageStoresPageProps> = async () => {
  const stores: Store[] = [];
  const APP_ID = "default-app-id";

  try {
    // ✅ users を取得（正しいパス）
    const usersSnapshot = await adminDb
      .collection("artifacts")
      .doc(APP_ID)
      .collection("users")
      .get();

    console.log(`👤 users count: ${usersSnapshot.size}`);

    for (const userDoc of usersSnapshot.docs) {
      const userId = userDoc.id;

      try {
        // ✅ 各ユーザーの stores サブコレクションを取得
        const storesSnapshot = await userDoc.ref.collection("stores").get();
        console.log(`📁 user ${userId} → stores: ${storesSnapshot.size}`);

        storesSnapshot.forEach((storeDoc) => {
          const data = storeDoc.data();
          const createdAtTimestamp = data.createdAt as Timestamp | undefined;
          const companyName =
            data.storeName || data.companyName || data.name || "名称未設定";

          stores.push({
            id: storeDoc.id,
            userId,
            companyName,
            address: data.address || "住所未設定",
            phoneNumber: data.phoneNumber || "電話番号未設定",
            email: data.email || "メールアドレス未設定",
            roles: data.roles || [],
            stripeCustomerId: data.stripeCustomerId || null,
            createdAt: formatDate(createdAtTimestamp),
            adverSubscriptionStatus: data.adverSubscriptionStatus || null,
            recruitSubscriptionStatus: data.recruitSubscriptionStatus || null,
            adverBillingCycle: data.adverBillingCycle || null,
            recruitBillingCycle: data.recruitBillingCycle || null,
          });
        });
      } catch (storeError) {
        console.error(`❌ Error reading stores for user ${userId}:`, storeError);
      }
    }

    console.log(`✅ Firestoreから取得した店舗数: ${stores.length}`);
    return { props: { initialStores: stores } };
  } catch (error) {
    console.error("❌ Firestoreからの取得エラー (全体):", error);
    return { props: { initialStores: [] } };
  }
};

// ✅ UI部分
const ManageStoresPage: NextPage<ManageStoresPageProps> = ({ initialStores }) => {
  const [stores] = useState<Store[]>(initialStores);

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

        <div className="bg-white rounded-lg shadow overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  企業/店舗名
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  登録サービス
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ユーザーID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  登録年月日
                </th>
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
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {store.createdAt}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="p-4 text-center text-gray-500">
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







