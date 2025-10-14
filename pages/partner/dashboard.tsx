import { GetServerSideProps, NextPage } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import React from 'react';
import { useRouter } from 'next/router';
import { getAuth, signOut } from 'firebase/auth';
import { app } from '../../lib/firebase';
import { adminDb, adminAuth } from '@/lib/firebase-admin'; // ★修正: adminAuthを直接インポート
import nookies from 'nookies'; // nookiesをインポート

// ===============================
// 型定義
// ===============================
interface DashboardProps {
  partnerData: {
    uid: string;
    companyName: string;
    email: string;
    roles: string[];
  };
}

interface ActionButtonProps {
  href: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  bgColorClass: string;
}

// ===============================
// 汎用 UI コンポーネント
// ===============================
const ActionButton: React.FC<ActionButtonProps> = ({
  href,
  icon,
  title,
  description,
  bgColorClass,
}) => (
  <Link href={href} legacyBehavior>
    <a className="group flex items-center p-4 bg-white rounded-lg shadow-sm hover:shadow-lg transition-shadow cursor-pointer">
      <div
        className={`flex-shrink-0 w-16 h-16 rounded-lg flex items-center justify-center ${bgColorClass}`}
      >
        {icon}
      </div>
      <div className="ml-4">
        <h3 className="text-lg font-bold text-gray-800 group-hover:text-blue-600 transition-colors">
          {title}
        </h3>
        <p className="text-sm text-gray-500 mt-1">{description}</p>
      </div>
    </a>
  </Link>
);

// ===============================
// SVG アイコン
// ===============================
const StoreIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
  </svg>
);
const MegaphoneIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592L5.436 13.683M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-2.236 9.168-5.518l-2.147-6.15a1.76 1.76 0 01-3.417.592L11 5.882z" />
  </svg>
);
const QrCodeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v1m6 11h2m-6.5 6.5v2m-8.36.14l-2-2M4 12H2m1.5-6.5l-2 2m18.36.14l2-2M12 20v2M4.64 4.64l2 2m10.72 10.72l2 2M12 8a4 4 0 100 8 4 4 0 000-8z" />
  </svg>
);
const BankIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
  </svg>
);

// ===============================
// サーバーサイド認証チェック
// ===============================
export const getServerSideProps: GetServerSideProps = async (context) => {
  try {
    // ★★★ ここから修正 ★★★
    const cookies = nookies.get(context);
    // 'session' クッキーを検証。もし違う名前なら修正してください。
    const token = await adminAuth.verifySessionCookie(cookies.session || '', true);
    const { uid } = token;
    // ★★★ ここまで修正 ★★★

    if (!uid) {
      return { redirect: { destination: '/partner/login', permanent: false } };
    }

    const userDoc = await adminDb.collection('users').doc(uid).get();

    if (!userDoc.exists) {
      return {
        redirect: { destination: '/partner/login?error=user_not_found', permanent: false },
      };
    }

    const userData = userDoc.data() || {};
    const userRoles: string[] = userData.roles || [];

    const allowedRoles = ['adver', 'recruit']; 
    const isAuthorized = userRoles.some(role => allowedRoles.includes(role));

    if (!isAuthorized) {
      return {
        redirect: { destination: '/partner/login?error=permission_denied', permanent: false },
      };
    }

    return {
      props: {
        partnerData: {
          uid: userDoc.id,
          email: userData.email || '',
          companyName: userData.companyName || userData.storeName || 'パートナー',
          roles: userData.roles || [],
        },
      },
    };
  } catch (err) {
    console.error('Dashboard getServerSideProps error:', err);
    return { redirect: { destination: '/partner/login', permanent: false } };
  }
};

// ===============================
// メインページコンポーネント
// ===============================
const PartnerDashboard: NextPage<DashboardProps> = ({ partnerData }) => {
  const router = useRouter();
  const { status } = router.query;

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/sessionLogout', { method: 'POST' });
      await signOut(getAuth(app));
      router.push('/partner/login');
    } catch (error) {
      console.error('ログアウト失敗:', error);
      router.push('/partner/login');
    }
  };

  const hasRecruitRole = partnerData.roles.includes('recruit');

  return (
    <div className="min-h-screen bg-gray-50">
      <Head>
        <title>広告パートナー ダッシュボード</title>
      </Head>

      {/* ヘッダー */}
      <header className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-6 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">広告パートナー ダッシュボード</h1>
            <p className="text-sm text-gray-600 mt-1">
              ようこそ、<span className="font-bold">{partnerData.companyName}</span> 様
            </p>
          </div>
        </div>
      </header>

      {/* メイン */}
      <main className="max-w-4xl mx-auto px-6 py-8">
        {status === 'success' && (
          <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 rounded-md mb-8">
            <p className="font-bold">ご登録ありがとうございます！</p>
            <p>パートナー登録と決済が正常に完了しました。</p>
          </div>
        )}

        <div className="mb-8 p-4 bg-blue-100 border-l-4 border-blue-500 text-blue-800 rounded-md">
          <p className="text-sm">
            <strong>お知らせ:</strong> 再ログインは、<a href="https://www.adtown.co.jp/" target="_blank" rel="noopener noreferrer" className="font-bold underline hover:text-blue-900">adtownのホームページ</a>から行えます。
          </p>
        </div>

        {/* セクション1 */}
        <section>
          <h2 className="text-xl font-bold text-gray-700 mb-3">１．お店の基本情報を設定する</h2>
          <ActionButton
            href="/partner/profile"
            icon={<StoreIcon />}
            title="店舗プロフィールを登録・編集"
            description="店名、住所、営業時間、写真などを設定します"
            bgColorClass="bg-blue-500"
          />
        </section>

        {/* セクション2 */}
        <section className="mt-8">
          <h2 className="text-xl font-bold text-gray-700 mb-3">２．お客様へのお知らせを更新する</h2>
          <ActionButton
            href="/partner/deals"
            icon={<MegaphoneIcon />}
            title="お得情報・クーポン・フードロスを登録・管理"
            description="日々のセール、クーポン、フードロス情報を発信します"
            bgColorClass="bg-green-500"
          />
        </section>

        {/* セクション3 */}
        <section className="mt-8">
          <h2 className="text-xl font-bold text-gray-700 mb-3">３．収益と集客を管理する</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ActionButton
              href="/partner/referral-info"
              icon={<QrCodeIcon />}
              title="紹介用URLとQRコード"
              description="お客様にアプリを紹介し、報酬を得るツールです"
              bgColorClass="bg-purple-500"
            />
            <ActionButton
              href="/partner/payout-settings"
              icon={<BankIcon />}
              title="報酬受取口座を登録・編集"
              description="紹介報酬を受け取るための口座を設定します"
              bgColorClass="bg-yellow-500"
            />
          </div>
        </section>

        {/* AI求人案内 */}
        {!hasRecruitRole && (
          <section className="mt-12 p-6 bg-white rounded-lg shadow-md border border-blue-200">
            <h2 className="text-xl font-bold text-blue-600">AIマッチング求人サービス</h2>
            <p className="mt-2 text-gray-600">
              月額3,850円税込みで、AIがあなたの会社に最適な人材を見つけます。
            </p>
            <Link href="/recruit/apply" legacyBehavior>
              <a className="inline-block mt-4 bg-blue-500 text-white font-bold py-2 px-4 rounded hover:bg-blue-600 transition duration-150 cursor-pointer">
                AI求人サービスを追加する
              </a>
            </Link>
          </section>
        )}

        {/* フッター操作 */}
        <section className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link href="/contact" className="w-full text-center py-3 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-100 cursor-pointer">
            お問い合わせ
          </Link>
          <button
            onClick={handleLogout}
            className="w-full text-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gray-600 hover:bg-gray-700"
          >
            ログアウト
          </button>
        </section>
      </main>
    </div>
  );
};

export default PartnerDashboard;

