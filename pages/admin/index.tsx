import { GetServerSideProps, NextPage } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import nookies from 'nookies';
// Admin SDKのインポート
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

{/* 認証解除の警告メッセージ */}
<div className="max-w-md mx-auto mb-8">
<p className="text-red-600 bg-red-100 p-4 rounded-md text-center">
<strong>注意：</strong> 現在、認証が一時的に解除されています。<br/>開発が完了したら、必ず認証処理を元に戻してください。
</p>
</div>

<nav className="space-y-5">
{/* 削除: 一般ユーザーのマイページを確認 */}
<Link href="/admin/dashboard" className={primaryLinkStyle}>
📊 運営ダッシュボード
</Link>
<Link href="/admin/settings" className={settingsLinkStyle}>
⚙️ 各種設定
</Link>

{/* 報酬管理の分割 */}
<Link href="/admin/referral-rewards" className={payoutLinkStyle}>
💰 店舗紹介料管理
</Link>
{/* 削除: 🌟 ユーザーリワード管理 (ユーザー管理に統合) */}

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

{/* 削除されたリンク */}
{/* 削除: ランディングページ編集 */}
{/* 削除: 関数手動実行 */}
{/* 削除: 運用ガイド */}
<Link href="/admin/export" className={linkStyle}>
CSV出力
</Link>
</nav>
</div>
);
};

// 認証保護は一時的にコメントアウト
/*
export const getServerSideProps: GetServerSideProps = async (context) => {
try {
const cookies = nookies.get(context);
// セッションクッキーを検証
const token = await adminAuth.verifySessionCookie(cookies.session || '', true);
const { uid } = token;

if (!uid) {
// ログインしていない場合はパートナーログインページにリダイレクト
return { redirect: { destination: '/partner/login', permanent: false } };
}

// ユーザーロールを取得
const userDoc = await adminDb.collection('users').doc(uid).get();
if (!userDoc.exists) {
return { redirect: { destination: '/partner/login?error=user_not_found', permanent: false } };
}

const userData = userDoc.data() || {};
const userRoles: string[] = userData.roles || [];

// ★ 'admin' ロールを持っているかチェック
if (!userRoles.includes('admin')) {
// admin ロールがない場合はパートナーログインページにリダイレクト
return { redirect: { destination: '/partner/login?error=permission_denied', permanent: false } };
}

// 認証済みかつ admin ロールを持っているのでページを表示
return {
props: {}, // このページは特にpropsを必要としない
};

} catch (err) {
// セッションクッキーが無効、期限切れなどのエラー
console.error('Admin page auth error:', err);
// パートナーログインページにリダイレクト
return { redirect: { destination: '/partner/login', permanent: false } };
}
};
*/

export default AdminPage;














