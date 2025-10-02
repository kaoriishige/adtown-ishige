/* eslint-disable @next/next/no-img-element */
import { GetServerSideProps, NextPage } from 'next';
import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
// Firebase and Stripe imports are kept as per the original user context,
// assuming the Next.js environment handles resolution of these modules.
import { getAuth, signOut } from 'firebase/auth';
import { loadStripe } from '@stripe/stripe-js';
import nookies from 'nookies';
// Assuming these paths are configured correctly in the running environment
import { adminAuth, adminDb } from '@/lib/firebase-admin'; 
import React from 'react';

// --- アイコンコンポーネント ---
const StoreIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}> <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /> </svg> );
const MegaphoneIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}> <path strokeLinecap="round" strokeLinejoin="round" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592L5.436 13.683M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-2.236 9.168-5.518l-2.147-6.15a1.76 1.76 0 01-3.417.592L11 5.882z" /> </svg> );
const QrCodeIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}> <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v1m6 11h2m-6.5 6.5v2m-8.36.14l-2-2M4 12H2m1.5-6.5l-2 2m18.36.14l2-2M12 20v2M4.64 4.64l2 2m10.72 10.72l2 2M12 8a4 4 0 100 8 4 4 0 000-8z" /> </svg> );
const BankIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}> <path strokeLinecap="round" strokeLinejoin="round" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /> </svg> );

// --- 型定義 ---
interface DashboardProps {
  partnerData: {
    displayName: string;
    email: string;
    roles: string[];
  };
}
type ActionButtonProps = { href: string; icon: React.ReactNode; title: string; description: string; bgColorClass: string; };

// --- UIコンポーネント ---
const ActionButton: React.FC<ActionButtonProps> = ({ href, icon, title, description, bgColorClass }) => (
  <Link href={href} className="group flex items-center p-4 bg-white rounded-lg shadow-sm hover:shadow-lg transition-shadow duration-300">
      <div className={`flex-shrink-0 w-16 h-16 rounded-lg flex items-center justify-center ${bgColorClass}`}> {icon} </div>
      <div className="ml-4">
        <h3 className="text-lg font-bold text-gray-800 group-hover:text-blue-600 transition-colors"> {title} </h3>
        <p className="text-sm text-gray-500 mt-1">{description}</p>
      </div>
  </Link>
);

// --- ページコンポーネント ---
const PartnerDashboard: NextPage<DashboardProps> = ({ partnerData }) => {
  const router = useRouter();
  
  // サービスの追加は決済専用ページへのリンクに変更するため、
  // 以下の状態管理は不要になりましたが、元のコード構造を維持します。
  // const [isLoading, setIsLoading] = useState(false);
  // const [error, setError] = useState<string | null>(null);

  // AI求人サービスを追加する処理 (ロジックは削除し、リンクに誘導)
  // const handleAddRecruitService = async () => {
  //   // ロジックを削除し、直接 /recruit/subscribe へ遷移させる
  //   router.push('/recruit/subscribe');
  // };

  const handleLogout = async () => {
    try {
      // Next.js環境外でこの関数が呼ばれるとエラーになるため、
      // 実際はNext.js API Routesを経由して実行されます。
      await fetch('/api/auth/sessionLogout', { method: 'POST' });
      const auth = getAuth();
      await signOut(auth);
      router.push('/login');
    } catch (error) {
      console.error('ログアウトに失敗しました:', error);
    }
  };

  const hasRecruitRole = partnerData.roles.includes('recruit');

  return (
    <div className="min-h-screen bg-gray-50">
      <Head>
        <title>店舗パートナー ダッシュボード</title>
      </Head>
      <header className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">店舗パートナー ダッシュボード</h1>
            <p className="text-sm text-gray-600 mt-1">
              ようこそ、<span className="font-bold">{partnerData.displayName}</span> 様
            </p>
          </div>
        </div>
      </header>
      
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          <section>
            <h2 className="text-xl font-bold text-gray-700 mb-3">１．お店の基本情報を設定する</h2>
            <div className="space-y-4">
              <ActionButton href="/partner/profile" icon={<StoreIcon />} title="店舗プロフィールを登録・編集" description="店名、住所、営業時間、写真など、お店の基本情報を設定します" bgColorClass="bg-blue-500" />
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-700 mb-3">２．お客様へのお知らせを更新する</h2>
              <div className="space-y-4">
                  <ActionButton href="/partner/deals" icon={<MegaphoneIcon />} title="お得情報・クーポン・フードロスを登録・管理" description="日々のセール、クーポン、フードロス情報などを発信します" bgColorClass="bg-green-500" />
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-700 mb-3">３．収益と集客を管理する</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <ActionButton href="/partner/referral-info" icon={<QrCodeIcon />} title="紹介用URLとQRコード" description="お客様にアプリを紹介し、報酬を得るためのツールです" bgColorClass="bg-purple-500" />
               <ActionButton href="/partner/payout-settings" icon={<BankIcon />} title="報酬受取口座を登録・編集" description="紹介報酬を受け取るための口座を設定します" bgColorClass="bg-yellow-500" />
            </div>
          </section>

          {/* ▼▼▼ サービス追加セクション ▼▼▼ */}
          {!hasRecruitRole && (
            <section className="mt-12 p-6 bg-white rounded-lg shadow-md border border-blue-200">
              <h2 className="text-xl font-bold text-blue-600">AIマッチング求人サービス</h2>
              <p className="mt-2 text-gray-600">月額3,300円で、AIがあなたの会社に最適な人材を見つけ出します。</p>
                {/* 修正点: /recruit/subscribe への直接リンクに変更 */}
              <Link 
                href="/recruit/subscribe"
                className="inline-block mt-4 bg-blue-500 text-white font-bold py-2 px-4 rounded hover:bg-blue-600 transition duration-150"
              >
                AI求人サービスを追加する
              </Link>
            </section>
          )}

          <section>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-12">
              <Link href="/contact" className="w-full text-center py-3 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-100">
                  お問い合わせ
              </Link>
              <button onClick={handleLogout} className="w-full text-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gray-600 hover:bg-gray-700">
                ログアウト
              </button>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
};

export default PartnerDashboard;

// --- サーバーサイド処理 ---
// NOTE: この処理はNext.js環境下でのみ動作します
export const getServerSideProps: GetServerSideProps = async (context) => {
  try {
    const cookies = nookies.get(context);
    // モック処理: adminAuth.verifySessionCookieはNext.js環境で認証に使用
    const token = await adminAuth.verifySessionCookie(cookies.session || '', true);

    // モック処理: adminDbはNext.js環境でFirestore/DBからユーザーデータを取得
    const userDoc = await adminDb.collection('users').doc(token.uid).get();
    if (!userDoc.exists) throw new Error('User not found');
    const userData = userDoc.data() || {};
    
    // このページは'partner'ロールを持つユーザーのみアクセス可能
    if (!userData.roles?.includes('partner')) {
        return { redirect: { destination: '/', permanent: false } };
    }

    return {
      props: {
        partnerData: JSON.parse(JSON.stringify(userData)),
      },
    };
  } catch (error) {
    return {
      redirect: {
        destination: '/login',
        permanent: false,
      },
    };
  }
};