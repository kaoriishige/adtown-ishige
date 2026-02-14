import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, query, getDocs, limit } from 'firebase/firestore';
import { RiLoader4Line, RiErrorWarningLine } from 'react-icons/ri';

// グローバル変数または環境変数からアプリIDを取得
declare const __app_id: string;
const appId = process.env.NEXT_PUBLIC_APP_ID || (typeof __app_id !== 'undefined' ? __app_id : 'default-app-id');

const FoodLossManagePage = () => {
  const router = useRouter();
  const [status, setStatus] = useState<'checking' | 'no-user' | 'no-store' | 'error'>('checking');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          // 店舗情報を検索
          const storesPath = `artifacts/${appId}/users/${user.uid}/stores`;
          console.log("Portal: checking stores at:", storesPath, "with appId:", appId, "uid:", user.uid);
          const storesRef = collection(db, 'artifacts', appId, 'users', user.uid, 'stores');
          const q = query(storesRef, limit(1));
          const snapshot = await getDocs(q);
          console.log("Portal: found stores in artifacts:", snapshot.size);

          if (!snapshot.empty) {
            const storeId = snapshot.docs[0].id;
            router.replace(`/food-loss/manage/${storeId}`);
          } else {
            // 他の保存場所も確認（[storeId].tsx のロジックに合わせる）
            // ユーザー直下に店舗情報があるか確認
            const userStoreRef = collection(db, 'users', user.uid, 'stores');
            console.log("Portal: falling back to check users collection:", userStoreRef.path);
            const q2 = query(userStoreRef, limit(1));
            const snapshot2 = await getDocs(q2);
            console.log("Portal: found stores in users:", snapshot2.size);

            if (!snapshot2.empty) {
              router.replace(`/food-loss/manage/${snapshot2.docs[0].id}`);
            } else {
              setStatus('no-store');
            }
          }
        } catch (err: any) {
          console.error("Portal error:", err);
          setStatus('error');
          setErrorMsg(err.message);
        }
      } else {
        setStatus('no-user');
      }
    });

    return () => unsubscribe();
  }, [router]);

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 text-center font-sans">
      <Head>
        <title>店舗管理画面へ移動中...</title>
      </Head>

      <div className="max-w-xs w-full bg-white p-8 rounded-3xl shadow-xl border">
        {status === 'checking' && (
          <div className="flex flex-col items-center">
            <RiLoader4Line className="animate-spin text-4xl text-indigo-600 mb-4" />
            <p className="font-bold text-slate-800">店舗情報を確認しています...</p>
            <p className="text-xs text-slate-400 mt-2">自動的にページが切り替わります</p>
          </div>
        )}

        {status === 'no-user' && (
          <div className="flex flex-col items-center">
            <RiErrorWarningLine className="text-4xl text-amber-500 mb-4" />
            <p className="font-bold text-slate-800 leading-relaxed">
              ログインが必要です
            </p>
            <p className="text-xs text-slate-500 mt-2 mb-6">
              一度ログインすると、次回からはリッチメニューから直接投稿できるようになります。
            </p>
            <button 
              onClick={() => router.push('/partner/login')}
              className="w-full bg-indigo-600 text-white font-bold py-3 rounded-xl shadow-md hover:bg-indigo-700 active:scale-95 transition"
            >
              ログインページへ
            </button>
          </div>
        )}

        {status === 'no-store' && (
          <div className="flex flex-col items-center">
            <RiErrorWarningLine className="text-4xl text-red-500 mb-4" />
            <p className="font-bold text-slate-800 leading-relaxed">
              店舗情報が見つかりません
            </p>
            <p className="text-xs text-slate-500 mt-2 mb-6">
              管理者アカウントで店舗を登録しているか確認してください。
            </p>
            <button 
              onClick={() => router.push('/partner/dashboard')}
              className="w-full bg-slate-800 text-white font-bold py-3 rounded-xl shadow-md"
            >
              ダッシュボードへ
            </button>
          </div>
        )}

        {status === 'error' && (
          <div className="flex flex-col items-center">
            <RiErrorWarningLine className="text-4xl text-red-600 mb-4" />
            <p className="font-bold text-slate-800">接続エラー</p>
            <p className="text-xs text-red-500 mt-2">{errorMsg}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default FoodLossManagePage;
