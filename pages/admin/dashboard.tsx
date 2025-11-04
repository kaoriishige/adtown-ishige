import { GetServerSideProps, NextPage } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import nookies from 'nookies';
// Admin SDKのインポートは認証ガードがコメントアウトされているため使用されないが、残しておく
import { adminAuth, adminDb } from '@/lib/firebase-admin'; 

const AdminPage: NextPage = () => {
    const linkStyle = "block w-full max-w-md mx-auto py-4 px-6 bg-gray-700 text-white text-lg font-semibold rounded-lg shadow-md hover:bg-gray-600 transition-transform transform hover:scale-105 text-center";
    const primaryLinkStyle = "block w-full max-w-md mx-auto py-4 px-6 bg-blue-600 text-white text-lg font-bold rounded-lg shadow-lg hover:bg-blue-500 transition-transform transform hover:scale-105 text-center";
    const settingsLinkStyle = "block w-full max-w-md mx-auto py-4 px-6 bg-purple-600 text-white text-lg font-semibold rounded-lg shadow-md hover:bg-purple-500 transition-transform transform hover:scale-105 text-center";
    const userViewLinkStyle = "block w-full max-w-md mx-auto py-4 px-6 bg-green-600 text-white text-lg font-bold rounded-lg shadow-lg hover:bg-green-500 transition-transform transform hover:scale-105 text-center";
    
    // 新しいスタイル定義
    const payoutLinkStyle = "block w-full max-w-md mx-auto py-4 px-6 bg-teal-600 text-white text-lg font-semibold rounded-lg shadow-md hover:bg-teal-500 transition-transform transform hover:scale-105 text-center";

    return (
        <div className="p-5 my-10 min-h-screen bg-gray-50">
            <Head>
                <title>{"管理メニュー"}</title>
            </Head>
            <h1 className="text-4xl font-extrabold mb-10 text-center text-gray-800">管理メニュー</h1>

            <div className="max-w-md mx-auto mb-8">
                <p className="text-red-600 bg-red-100 p-4 rounded-md text-center">
                    <strong>注意：</strong> 現在、認証が一時的に解除されています。<br/>開発が完了したら、必ず認証処理を元に戻してください。
                </p>
            </div>
            
            <nav className="space-y-5">
                {/* 1. 運営ダッシュボード → 企業・店舗運営ダッシュボードに変更 */}
                <Link href="/admin/dashboard" className={primaryLinkStyle}>
                    📊 企業・店舗運営ダッシュボード
                </Link>
                
                {/* 2. ユーザー運営ダッシュボードを新規追加 */}
                <Link href="/admin/user-dashboard" className={userViewLinkStyle}>
                    👤 ユーザー運営ダッシュボード
                </Link>
                
                <Link href="/admin/settings" className={settingsLinkStyle}>
                    ⚙️ 各種設定
                </Link>
                
                {/* 報酬管理の分割 */}
                <Link href="/admin/referral-rewards" className={payoutLinkStyle}>
                    💰 店舗紹介料管理
                </Link>
                
                {/* 3. ユーザー紹介料管理を新規追加 (新しい報酬項目として) */}
                <Link href="/admin/user-referral-rewards" className={payoutLinkStyle}>
                    🌟 ユーザー紹介料管理
                </Link>

                <hr />
                
                <Link href="/admin/manageApps" className={linkStyle}>
                    アプリ管理 (CRUD)
                </Link>
                <Link href="/admin/manageStores" className={linkStyle}>
                    店舗管理
                </Link>
                <Link href="/admin/user-management" className={linkStyle}>
                    👤 ユーザー管理
                </Link>
                
                <Link href="/admin/export" className={linkStyle}>
                    CSV出力
                </Link>
                {/* 削除項目は含まれていません */}
            </nav>
        </div>
    );
};

// 認証保護は一時的にコメントアウトを維持
/*
export const getServerSideProps: GetServerSideProps = async (context) => {
    // ... (認証ロジック) ...
};
*/

export default AdminPage;