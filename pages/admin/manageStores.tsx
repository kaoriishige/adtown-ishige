import { NextPage, GetServerSideProps } from "next";
import Head from "next/head";
import React, { useState } from "react";
import { adminDb } from "@/lib/firebase-admin";
import { RiDeleteBinLine, RiLoader4Line, RiErrorWarningLine } from 'react-icons/ri';

interface StoreUserData {
  id: string;
  companyName: string;
  email: string;
}

interface ManageStoresPageProps {
  initialStores: StoreUserData[];
  debugCount: number;
}

export const getServerSideProps: GetServerSideProps<ManageStoresPageProps> = async () => {
  const stores: StoreUserData[] = [];
  let totalDocs = 0;

  try {
    // 1. コレクションからデータを取得
    const usersSnapshot = await adminDb.collection("users").get();
    totalDocs = usersSnapshot.size;

    console.log(`[DEBUG] Found ${totalDocs} documents in 'users' collection.`);

    usersSnapshot.docs.forEach((doc) => {
      const data = doc.data() || {};

      // 2. エラーを避けるため、極限までシンプルに値を取得
      // data.companyName がなければ email、それもなければドキュメントIDを表示
      const name = data.companyName || data.storeName || data.name || data.email || `ID: ${doc.id}`;
      const mail = data.email || "(メール未登録)";

      stores.push({
        id: doc.id,
        companyName: String(name),
        email: String(mail),
      });
    });

    return {
      props: {
        initialStores: stores,
        debugCount: totalDocs
      }
    };
  } catch (error: any) {
    console.error("[CRITICAL ERROR] Firestore fetch failed:", error.message);
    return {
      props: {
        initialStores: [],
        debugCount: -1
      }
    };
  }
};

const ManageStoresPage: NextPage<ManageStoresPageProps> = ({ initialStores, debugCount }) => {
  const [stores, setStores] = useState(initialStores);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    if (!confirm("このデータを削除しますか？")) return;
    setLoadingId(id);
    try {
      const res = await fetch('/api/admin/deleteStore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetUserId: id }),
      });
      if (res.ok) setStores(prev => prev.filter(s => s.id !== id));
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8 font-sans">
      <Head><title>デバッグモード - 店舗一覧</title></Head>
      <div className="max-w-2xl mx-auto">
        <div className="bg-white p-6 rounded-t-3xl border-b shadow-sm">
          <h1 className="text-xl font-black">店舗データ強制表示</h1>
          <p className="text-xs text-blue-600 font-bold mt-1">
            Firestore上の 'users' コレクションの総数: {debugCount} 件
          </p>
        </div>

        {stores.length === 0 ? (
          <div className="bg-white p-12 rounded-b-3xl text-center border-t-0 shadow-sm">
            <RiErrorWarningLine size={40} className="mx-auto text-red-400 mb-4" />
            <p className="text-gray-800 font-bold">画面に表示できるデータが0件です</p>
            <div className="mt-4 p-4 bg-red-50 rounded-xl text-left text-[11px] text-red-700 space-y-2">
              <p><strong>原因1:</strong> コレクション名が <b>users</b> ではない</p>
              <p><strong>原因2:</strong> 接続しているFirebaseプロジェクトが本番用ではない</p>
              <p><strong>原因3:</strong> サービスアカウント（JSON）に権限がない</p>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-b-3xl shadow-sm overflow-hidden border-t-0">
            <div className="divide-y divide-gray-100">
              {stores.map((s) => (
                <div key={s.id} className="p-4 flex justify-between items-center hover:bg-gray-50 transition">
                  <div className="overflow-hidden">
                    <div className="font-bold text-gray-800 truncate">{s.companyName}</div>
                    <div className="text-[10px] text-gray-400 font-mono">UID: {s.id}</div>
                  </div>
                  <button
                    onClick={() => handleDelete(s.id)}
                    className="ml-4 p-3 bg-red-50 text-red-500 rounded-xl active:scale-90 transition"
                  >
                    {loadingId === s.id ? <RiLoader4Line className="animate-spin" /> : <RiDeleteBinLine size={18} />}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ManageStoresPage;







