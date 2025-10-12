import { GetServerSideProps, NextPage } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import nookies from 'nookies';
import { adminAuth, adminDb } from '@/lib/firebase-admin';

const AdminPage: NextPage = () => {
    const linkStyle = "block w-full max-w-md mx-auto py-4 px-6 bg-gray-700 text-white text-lg font-semibold rounded-lg shadow-md hover:bg-gray-600 transition-transform transform hover:scale-105 text-center";
    const primaryLinkStyle = "block w-full max-w-md mx-auto py-4 px-6 bg-blue-600 text-white text-lg font-bold rounded-lg shadow-lg hover:bg-blue-500 transition-transform transform hover:scale-105 text-center";
    const settingsLinkStyle = "block w-full max-w-md mx-auto py-4 px-6 bg-purple-600 text-white text-lg font-semibold rounded-lg shadow-md hover:bg-purple-500 transition-transform transform hover:scale-105 text-center";
    const notificationLinkStyle = "block w-full max-w-md mx-auto py-4 px-6 bg-red-600 text-white text-lg font-semibold rounded-lg shadow-md hover:bg-red-500 transition-transform transform hover:scale-105 text-center";
    const userViewLinkStyle = "block w-full max-w-md mx-auto py-4 px-6 bg-green-600 text-white text-lg font-bold rounded-lg shadow-lg hover:bg-green-500 transition-transform transform hover:scale-105 text-center";

    return (
        <div className="p-5 my-10 min-h-screen bg-gray-50">
            <Head>
                <title>管理メニュー</title>
            </Head>
            <h1 className="text-4xl font-extrabold mb-10 text-center text-gray-800">管理メニュー</h1>

            {/* --- ▼▼▼ 追加 ▼▼▼ --- */}
            <div className="max-w-md mx-auto mb-8">
                <p className="text-red-600 bg-red-100 p-4 rounded-md text-center">
                    <strong>注意：</strong> 現在、認証が一時的に解除されています。<br/>開発が完了したら、必ず認証処理を元に戻してください。
                </p>
            </div>
            {/* --- ▲▲▲ ここまで ▲▲▲ --- */}
            
            <nav className="space-y-5">
                <Link href="/mypage" target="_blank" rel="noopener noreferrer" className={userViewLinkStyle}>
                    👁️ 一般ユーザーのマイページを確認
                </Link>
                <hr />
                <Link href="/admin/dashboard" className={primaryLinkStyle}>
                    📊 運営ダッシュボード
                </Link>
                <Link href="/admin/settings" className={settingsLinkStyle}>
                    ⚙️ 各種設定
                </Link>
                <Link href="/admin/push-notification" className={notificationLinkStyle}>
                    🔔 プッシュ通知送信
                </Link>
                <Link href="/admin/manageApps" className={linkStyle}>
                    アプリ管理 (CRUD)
                </Link>
                <Link href="/admin/manageStores" className={linkStyle}>
                    店舗管理
                </Link>
                <Link href="/admin/user-management" className={linkStyle}>
                    ユーザー管理
                </Link>
                <Link href="/admin/inquiry-list" className={linkStyle}>
                    問い合わせ管理
                </Link>
                <Link href="/admin/quest-review" className={linkStyle}>
                    ✅ クエスト承認
                </Link>
                <Link href="/admin/review-approval" className={linkStyle}>
                    📸 投稿承認
                </Link>
                <Link href="/admin/referral-rewards" className={linkStyle}>
                    紹介報酬管理
                </Link>
                <Link href="/admin/landing-editor" className={linkStyle}>
                    ランディングページ編集
                </Link>
                <Link href="/admin/export" className={linkStyle}>
                    CSV出力
                </Link>
                <Link href="/admin/manual-functions" className={linkStyle}>
                    関数手動実行
                </Link>
                <Link href="/admin/guide" className={linkStyle}>
                    運用ガイド
                </Link>
            </nav>
        </div>
    );
};

// --- ▼▼▼ 修正: 管理者専用の認証保護を一時的にコメントアウト ▼▼▼ ---
/*
export const getServerSideProps: GetServerSideProps = async (context) => {
    try {
        const cookies = nookies.get(context);
        if (!cookies.token) {
            return { redirect: { destination: '/admin/login', permanent: false } };
        }
        
        const token = await adminAuth.verifyIdToken(cookies.token, true);
        const userDoc = await adminDb.collection('users').doc(token.uid).get();

        if (!userDoc.exists || !userDoc.data()?.roles?.includes('admin')) {
            return { redirect: { destination: '/admin/login', permanent: false } };
        }
        
        return { props: {} };
    } catch (error) {
        return { redirect: { destination: '/admin/login', permanent: false } };
    }
};
*/
// --- ▲▲▲ ここまで ▲▲▲ ---

export default AdminPage;














