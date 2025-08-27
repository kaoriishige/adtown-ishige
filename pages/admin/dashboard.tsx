import { NextPage, GetServerSideProps } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import nookies from 'nookies';
import { getAdminAuth, getAdminDb } from '../../lib/firebase-admin';

// アイコン用のライブラリ
import { RiDashboardLine, RiSettings3Line, RiNotification3Line, RiAppsLine, RiEyeLine } from 'react-icons/ri';

const AdminDashboardPage: NextPage = () => {
  const buttonStyle = "flex items-center justify-center w-full max-w-sm p-4 text-lg font-bold text-white rounded-lg shadow-md hover:opacity-90 transition-opacity";

  return (
    <>
      <Head>
        <title>管理メニュー</title>
      </Head>
      <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-sm">
          <h1 className="text-3xl font-bold mb-8 text-center">管理メニュー</h1>
          <div className="space-y-4">
            
            <Link href="/admin/dashboard" className={`${buttonStyle} bg-blue-600`}>
              <RiDashboardLine className="mr-3" /> 運営ダッシュボード
            </Link>
            
            <Link href="/admin/settings" className={`${buttonStyle} bg-purple-600`}>
              <RiSettings3Line className="mr-3" /> 各種設定
            </Link>
            
            <Link href="/admin/push-notification" className={`${buttonStyle} bg-red-600`}>
              <RiNotification3Line className="mr-3" /> プッシュ通知送信
            </Link>
            
            <Link href="/admin/manage-apps" className={`${buttonStyle} bg-gray-700`}>
              <RiAppsLine className="mr-3" /> アプリ管理 (CRUD)
            </Link>
            
            <hr className="my-4 border-gray-300" />

            {/* ★★★ ここに、アプリページへ移動するボタンを追加しました ★★★ */}
            <Link 
              href="/home" 
              target="_blank" // 新しいタブで開く
              rel="noopener noreferrer"
              className={`${buttonStyle} bg-green-600`}
            >
              <RiEyeLine className="mr-3" /> アプリページを確認する
            </Link>

          </div>
        </div>
      </div>
    </>
  );
};

// --- 管理者専用の認証保護 ---
export const getServerSideProps: GetServerSideProps = async (context) => {
  try {
    const cookies = nookies.get(context);
    const token = await getAdminAuth().verifySessionCookie(cookies.token, true);
    const userDoc = await getAdminDb().collection('users').doc(token.uid).get();

    if (!userDoc.exists || userDoc.data()?.role !== 'admin') {
      return { redirect: { destination: '/admin', permanent: false } };
    }
    return { props: {} };
  } catch (error) {
    return { redirect: { destination: '/admin', permanent: false } };
  }
};

export default AdminDashboardPage;