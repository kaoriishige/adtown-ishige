import React, { useState, useEffect } from 'react';
import { GetServerSideProps, NextPage } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import nookies from 'nookies';
import { 
  QrCode, Lock, Unlock, Loader2, Download, 
  Clipboard, ToggleLeft, ToggleRight, ArrowLeft,
  Link as LinkIcon // 1. ここに別名で追加
} from 'lucide-react';

// Firebase Admin SDK (サーバーサイド用)
import { adminAuth, adminDb } from '../lib/firebase-admin';

// Firebase Client SDK
import { initializeApp, getApp, getApps } from "firebase/app";
import { getFirestore, doc, setDoc, onSnapshot } from "firebase/firestore";

// --- クライアントサイド用Firebase初期化 ---
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);

// --- 型定義 ---
interface ReferralDashboardProps {
  userId: string;
  email: string;
}

// QRコードモック
const QRCodeMock = ({ value }: { value: string }) => (
  <div className="p-4 bg-white rounded-2xl shadow-inner text-center">
    <div className="mx-auto w-48 h-48 flex items-center justify-center border-4 border-dashed rounded-3xl border-gray-200 bg-gray-50">
      <QrCode className="w-16 h-16 text-gray-300" />
    </div>
    <p className="mt-4 text-[10px] font-mono text-gray-400 break-all px-4 italic">{value}</p>
  </div>
);

const ReferralDashboard: NextPage<ReferralDashboardProps> = ({ userId, email }) => {
  const [isReferralPlanActive, setIsReferralPlanActive] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const referralUrl = `https://your-app-landing-page.com/?ref=${userId}`;

  // 1. 紹介プランの状態をリアルタイム取得
  useEffect(() => {
    if (!userId) return;
    const docRef = doc(db, 'store_status', 'referral_plan');
    
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        setIsReferralPlanActive(!!docSnap.data().isReferralPlanActive);
      } else {
        setDoc(docRef, { isReferralPlanActive: false, updatedAt: Date.now() }, { merge: true });
      }
    }, (e) => {
      setError("ステータスの取得に失敗しました。");
    });

    return () => unsubscribe();
  }, [userId]);

  // 2. ステータス切り替えロジック
  const toggleReferralPlan = async () => {
    if (isUpdatingStatus) return;
    if (!window.confirm(`紹介報酬の発生設定を切り替えますか？`)) return;

    setIsUpdatingStatus(true);
    try {
      const docRef = doc(db, 'store_status', 'referral_plan');
      await setDoc(docRef, { 
        isReferralPlanActive: !isReferralPlanActive,
        updatedAt: Date.now() 
      }, { merge: true });
    } catch (e) {
      setError("更新に失敗しました。");
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(referralUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-12 font-sans">
      <Head><title>紹介ダッシュボード | プレミアム限定</title></Head>

      <div className="max-w-md mx-auto bg-white min-h-screen shadow-2xl border-x">
        <header className="p-6 border-b bg-white sticky top-0 z-20 flex items-center justify-between">
          <Link href="/mypage" className="p-2 hover:bg-gray-100 rounded-full transition">
            <ArrowLeft className="w-6 h-6 text-gray-600" />
          </Link>
          <h1 className="text-lg font-black text-gray-800">報酬発生管理</h1>
          <div className="w-10"></div>
        </header>

        <main className="p-6 space-y-6">
          <div className="flex items-center justify-between text-xs font-bold text-gray-400 px-1">
            <span>USER ID: {userId.substring(0, 8)}...</span>
            <span className="text-indigo-500 uppercase tracking-widest">Premium Member</span>
          </div>

          {/* ステータスカード */}
          <div className={`p-6 rounded-[2rem] border-2 transition-all duration-500 ${
            isReferralPlanActive ? 'border-indigo-500 bg-indigo-50/50' : 'border-gray-200 bg-gray-50'
          }`}>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                {isReferralPlanActive ? <Unlock className="text-indigo-600" /> : <Lock className="text-gray-400" />}
                <span className="font-black text-xl text-gray-800">報酬発生設定</span>
              </div>
              <span className={`px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter shadow-sm ${
                isReferralPlanActive ? 'bg-indigo-600 text-white' : 'bg-gray-400 text-white'
              }`}>
                {isReferralPlanActive ? 'ACTIVE' : 'LOCKED'}
              </span>
            </div>

            <button
              onClick={toggleReferralPlan}
              disabled={isUpdatingStatus}
              className={`w-full py-5 rounded-2xl font-black text-lg transition shadow-xl active:scale-95 flex items-center justify-center ${
                isReferralPlanActive ? 'bg-white text-red-500 border-2 border-red-100' : 'bg-indigo-600 text-white shadow-indigo-200'
              } disabled:opacity-50`}
            >
              {isUpdatingStatus ? <Loader2 className="animate-spin" /> : isReferralPlanActive ? (
                <><ToggleRight className="mr-2 w-8 h-8" /> システム停止</>
              ) : (
                <><ToggleLeft className="mr-2 w-8 h-8" /> システム開始</>
              )}
            </button>
          </div>

          {error && <div className="p-4 bg-red-100 text-red-600 rounded-xl text-xs font-bold">{error}</div>}

          {/* メインエリア */}
          {isReferralPlanActive ? (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="bg-white p-6 rounded-[2rem] border-2 border-gray-100 space-y-4 shadow-sm">
                <h2 className="font-black text-gray-800 flex items-center italic">
                  {/* 2. ここを LinkIcon に変更 */}
                  <LinkIcon className="mr-2 w-5 h-5 text-indigo-500" /> YOUR REFERRAL LINK
                </h2>
                <div className="relative group">
                  <input 
                    type="text" readOnly value={referralUrl}
                    className="w-full p-4 bg-gray-50 border-none rounded-xl text-xs font-mono text-gray-500 pr-24"
                  />
                  <button 
                    onClick={handleCopy}
                    className="absolute right-2 top-2 bottom-2 px-4 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700 transition"
                  >
                    {copied ? 'OK' : 'COPY'}
                  </button>
                </div>
                <QRCodeMock value={referralUrl} />
              </div>
            </div>
          ) : (
            <div className="bg-white p-10 rounded-[2rem] border-2 border-dashed border-gray-200 text-center space-y-4">
              <Lock className="w-16 h-16 text-gray-200 mx-auto" />
              <p className="text-gray-400 text-sm font-bold leading-relaxed px-4">
                紹介報酬機能は現在停止されています。<br/>
                上のボタンから有効化してください。
              </p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export const getServerSideProps: GetServerSideProps = async (context) => {
  try {
    const cookies = nookies.get(context);
    const sessionCookie = cookies.session || '';

    if (!sessionCookie) return { redirect: { destination: '/users/login', permanent: false } };

    const token = await adminAuth.verifySessionCookie(sessionCookie, true);
    const userDoc = await adminDb.collection('users').doc(token.uid).get();
    const userData = userDoc.data();

    if (!userData || userData.plan !== 'paid_480') {
      return {
        redirect: {
          destination: '/home',
          permanent: false,
        },
      };
    }

    return {
      props: {
        userId: token.uid,
        email: token.email || '',
      },
    };
  } catch (err) {
    return { redirect: { destination: '/users/login', permanent: false } };
  }
};

export default ReferralDashboard;