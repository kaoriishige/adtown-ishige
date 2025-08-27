import type { NextPage, GetServerSideProps } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import nookies from 'nookies';
import { getAdminAuth, getAdminDb } from '../../lib/firebase-admin'; // パスは環境に合わせて修正
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';

const PartnerDashboardPage: NextPage = () => {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/sessionLogout', { method: 'POST' });
      await signOut(auth);
      router.push('/partner/login');
    } catch (error) {
      console.error('Logout failed', error);
      alert('ログアウトに失敗しました。');
    }
  };

  const buttonStyle = "block w-full text-center text-white font-bold py-3 px-4 rounded-lg transition-colors";
  const primaryButtonStyle = `${buttonStyle} bg-blue-500 hover:bg-blue-600`;
  const secondaryButtonStyle = `${buttonStyle} bg-green-500 hover:bg-green-600`;

  return (
    <>
      <Head>
        <title>パートナーダッシュボード</title>
      </Head>
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          
          <div className="bg-green-100 border border-green-200 text-green-800 p-4 rounded-lg mb-6 text-left">
            <h2 className="font-bold text-lg mb-2">あなたの紹介報酬 💰</h2>
            <div className="space-y-1">
              <p><span className="font-semibold">累計報酬額:</span> 0円</p>
              <p><span className="font-semibold">未払い報酬額:</span> 0円</p>
            </div>
            <p className="text-xs mt-3 text-green-700">
              ※未払い報酬額が3,000円以上になると、翌月15日にご登録の口座へ自動で振り込まれます。
            </p>
          </div>

          <div className="space-y-3">
            <Link href="/partner/deals" className={primaryButtonStyle}>
              店舗お得情報を登録・管理
            </Link>
            <Link href="/partner/food-loss" className={secondaryButtonStyle}>
              フードロス情報を登録＆管理
            </Link>
            
            <hr className="my-2 border-gray-200" />
            
            {/* ★★★ ここのリンク先を、実際のファイル名に合わせて修正しました ★★★ */}
            <Link href="/partner/payout-settings" className={primaryButtonStyle}>
              報酬受取口座を登録・編集する
            </Link>
            <Link href="/partner/referral-info" className={primaryButtonStyle}>
              紹介用URLとQRコード
            </Link>
            {/* ★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★ */}

            <Link href="/contact" className={primaryButtonStyle}>
              お問い合わせ
            </Link>

            <div className="pt-4">
              <button 
                onClick={handleLogout} 
                className="w-full bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold py-2 px-4 rounded-lg transition-colors"
              >
                ログアウト
              </button>
            </div>
          </div>

        </div>
      </div>
    </>
  );
};

// --- ★★★ サーバーサイドでの認証保護を、確実に動作する形で再実装しました ★★★ ---
export const getServerSideProps: GetServerSideProps = async (context) => {
  try {
    const cookies = nookies.get(context);
    const token = await getAdminAuth().verifySessionCookie(cookies.token, true);
    const userDoc = await getAdminDb().collection('users').doc(token.uid).get();
    const userRole = userDoc.data()?.role;

    // 役割が 'partner' または 'admin' でない場合はアクセスを拒否
    if (!userDoc.exists || (userRole !== 'partner' && userRole !== 'admin')) {
      return { redirect: { destination: '/partner/login', permanent: false } };
    }
    // 許可されたユーザーであればページを表示
    return { props: {} };

  } catch (error) {
    // 未ログインの場合はログインページへ
    return { redirect: { destination: '/partner/login', permanent: false } };
  }
};

export default PartnerDashboardPage;