import { GetServerSideProps, NextPage } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import nookies from 'nookies';
// Admin SDKのインポート
import { adminAuth, adminDb } from '@/lib/firebase-admin'; 
import { 
RiLogoutBoxRLine, 
RiCoupon3Line, 
RiRobotLine, 
RiMoneyCnyBoxLine, 
RiBankLine, 
RiCloseCircleLine, // 解約モーダル用
RiAlertFill, // 解約モーダル用
RiEyeLine, // プレビューボタン用のアイコン
} from 'react-icons/ri'; 

const AdminPage: NextPage = () => {
const linkStyle = "block w-full max-w-md mx-auto py-4 px-6 bg-gray-700 text-white text-lg font-semibold rounded-lg shadow-md hover:bg-gray-600 transition-transform transform hover:scale-105 text-center";
const primaryLinkStyle = "block w-full max-w-md mx-auto py-4 px-6 bg-blue-600 text-white text-lg font-bold rounded-lg shadow-lg hover:bg-blue-500 transition-transform transform hover:scale-105 text-center";
const settingsLinkStyle = "block w-full max-w-md mx-auto py-4 px-6 bg-purple-600 text-white text-lg font-semibold rounded-lg shadow-md hover:bg-purple-500 transition-transform transform hover:scale-105 text-center";
const userViewLinkStyle = "block w-full max-w-md mx-auto py-4 px-6 bg-green-600 text-white text-lg font-bold rounded-lg shadow-lg hover:bg-green-500 transition-transform transform hover:scale-105 text-center";

// 新しいスタイル定義
const payoutLinkStyle = "block w-full max-w-md mx-auto py-4 px-6 bg-teal-600 text-white text-lg font-semibold rounded-lg shadow-md hover:bg-teal-500 transition-transform transform hover:scale-105 text-center";

// ★追加: Wisdom Guide専用のリンクリストを定義
const wisdomLinkStyle = "block w-full max-w-md mx-auto py-4 px-6 bg-indigo-600 text-white text-lg font-bold rounded-lg shadow-lg hover:bg-indigo-500 transition-transform transform hover:scale-105 text-center";


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
{/* 上部主要ボタン */}
<Link href="/admin/dashboard" className={primaryLinkStyle}>
📊 運営ダッシュボード
</Link>
<Link href="/admin/settings" className={settingsLinkStyle}>
⚙️ 各種設定
</Link>
<Link href="/admin/referral-rewards" className={userViewLinkStyle}>
💰 店舗紹介料管理
</Link>

<hr className="my-5 border-gray-300" />

{/* ★★★ 修正箇所: 店舗管理とアプリ管理を入れ替え ★★★ */}

<Link href="/admin/manageStores" className={linkStyle}>
店舗管理
</Link>
<Link href="/admin/manageApps" className={linkStyle}>
アプリ管理 (CRUD)
</Link>

{/* ★★★ ここから動画管理リンクを追加 ★★★ */}
<hr className="my-5 border-gray-300" />
<h2 className="text-2xl font-bold text-center text-indigo-700 pt-2 pb-1">
🎓 Wisdom Guide 管理
</h2>
<Link 
    // アプリケーションが `appId` パラメータを必要とする場合、適切なパスに調整してください
    href="/app/wisdom-guide" 
    className={wisdomLinkStyle}
>
▶️ 動画リスト管理 (賢人の子育て指針)
</Link>
<hr className="my-5 border-gray-300" />
{/* ★★★ 動画管理リンクの追加ここまで ★★★ */}


<Link href="/admin/user-management" className={linkStyle}>
👤 ユーザー管理
</Link>

<Link href="/admin/export" className={linkStyle}>
CSV出力
</Link>
{/* ★★★ 修正ここまで ★★★ */}

</nav>
</div>
);
};

// 認証保護は一時的にコメントアウト
/*
export const getServerSideProps: GetServerSideProps = async (context) => {
// ... 認証ロジックは省略
};
*/

export default AdminPage;














