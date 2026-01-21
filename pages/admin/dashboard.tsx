import { GetServerSideProps, NextPage } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import nookies from 'nookies';
import { adminAuth, adminDb } from '@/lib/firebase-admin';

const AdminPage: NextPage = () => {
    const linkStyle = "block w-full max-w-md mx-auto py-4 px-6 bg-gray-700 text-white text-lg font-semibold rounded-lg shadow-md hover:bg-gray-600 transition-transform transform hover:scale-105 text-center";
    const primaryLinkStyle = "block w-full max-w-md mx-auto py-4 px-6 bg-blue-600 text-white text-lg font-bold rounded-lg shadow-lg hover:bg-blue-500 transition-transform transform hover:scale-105 text-center";
    const settingsLinkStyle = "block w-full max-w-md mx-auto py-4 px-6 bg-purple-600 text-white text-lg font-semibold rounded-lg shadow-md hover:bg-purple-500 transition-transform transform hover:scale-105 text-center";
    const userViewLinkStyle = "block w-full max-w-md mx-auto py-4 px-6 bg-green-600 text-white text-lg font-bold rounded-lg shadow-lg hover:bg-green-500 transition-transform transform hover:scale-105 text-center";

    const payoutLinkStyle = "block w-full max-w-md mx-auto py-4 px-6 bg-teal-600 text-white text-lg font-semibold rounded-lg shadow-md hover:bg-teal-500 transition-transform transform hover:scale-105 text-center";

    // アフィリエイト専用（40%報酬系）の新しいスタイル
    const affiliateLinkStyle = "block w-full max-w-md mx-auto py-4 px-6 bg-orange-600 text-white text-lg font-extrabold rounded-lg shadow-xl hover:bg-orange-500 transition-transform transform hover:scale-105 text-center border-2 border-orange-300";

    return (
        <div className="p-5 my-10 min-h-screen bg-gray-50 text-gray-800 antialiased">
            <Head>
                <title>管理メニュー | adtown</title>
            </Head>
            <h1 className="text-4xl font-black mb-10 text-center uppercase tracking-tighter">管理メニュー</h1>

            <div className="max-w-md mx-auto mb-8">
                <p className="text-red-600 bg-red-100 p-4 rounded-md text-center text-sm font-bold shadow-sm">
                    <strong>⚠️ 注意：</strong> 現在、認証が一時的に解除されています。<br />本番公開前に必ず認証処理を戻してください。
                </p>
            </div>

            <nav className="space-y-5">
                <section className="space-y-4">
                    <h2 className="max-w-md mx-auto text-xs font-black text-gray-400 uppercase tracking-[0.2em] mb-2 px-2">運営ダッシュボード</h2>
                    <Link href="/admin/dashboard" className={primaryLinkStyle}>
                        📊 企業・店舗運営ダッシュボード
                    </Link>
                    <Link href="/admin/user-dashboard" className={userViewLinkStyle}>
                        👤 ユーザー運営ダッシュボード
                    </Link>
                </section>

                <hr className="max-w-md mx-auto border-gray-200 my-8" />

                <section className="space-y-4">
                    <h2 className="max-w-md mx-auto text-xs font-black text-orange-500 uppercase tracking-[0.2em] mb-2 px-2">アフィリエイト報酬（40%）</h2>
                    {/* 今回追加した一括管理ページ */}
                    <Link href="/admin/affiliate-management" className={affiliateLinkStyle}>
                        🚀 アフィリエイト紹介料一括管理
                    </Link>
                </section>

                <section className="space-y-4 pt-4">
                    <h2 className="max-w-md mx-auto text-xs font-black text-teal-600 uppercase tracking-[0.2em] mb-2 px-2">その他の報酬管理</h2>
                    <Link href="/admin/referral-rewards" className={payoutLinkStyle}>
                        💰 店舗紹介料管理
                    </Link>
                    <Link href="/admin/user-referral-rewards" className={payoutLinkStyle}>
                        🌟 ユーザー紹介料管理
                    </Link>
                </section>

                <hr className="max-w-md mx-auto border-gray-200 my-8" />

                <section className="space-y-4">
                    <h2 className="max-w-md mx-auto text-xs font-black text-gray-400 uppercase tracking-[0.2em] mb-2 px-2">システム管理</h2>
                    <Link href="/admin/settings" className={settingsLinkStyle}>
                        ⚙️ 各種設定
                    </Link>
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
                </section>
            </nav>
        </div>
    );
};

export default AdminPage;