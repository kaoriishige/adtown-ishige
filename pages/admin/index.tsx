import { GetServerSideProps, NextPage } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import nookies from 'nookies';
// Admin SDK
import { adminAuth, adminDb } from '@/lib/firebase-admin'; 
import { 
    RiLogoutBoxRLine, 
    RiLayoutGridLine,
    RiStore2Line,
    RiShieldUserLine
} from 'react-icons/ri'; 

interface AdminPageProps {
    storesCount: number;
    userCount: number;
}

const AdminPage: NextPage<AdminPageProps> = ({ storesCount, userCount }) => {
    const linkStyle = "block w-full max-w-md mx-auto py-4 px-6 bg-gray-700 text-white text-lg font-semibold rounded-2xl shadow-md hover:bg-gray-600 transition-all transform active:scale-95 text-center flex items-center justify-center gap-3";
    const primaryLinkStyle = "block w-full max-w-md mx-auto py-4 px-6 bg-blue-600 text-white text-lg font-bold rounded-2xl shadow-lg hover:bg-blue-500 transition-all transform active:scale-95 text-center flex items-center justify-center gap-3";
    const settingsLinkStyle = "block w-full max-w-md mx-auto py-4 px-6 bg-purple-600 text-white text-lg font-semibold rounded-2xl shadow-md hover:bg-purple-500 transition-all transform active:scale-95 text-center flex items-center justify-center gap-3";
    const wisdomLinkStyle = "block w-full max-w-md mx-auto py-4 px-6 bg-indigo-600 text-white text-lg font-bold rounded-2xl shadow-lg hover:bg-indigo-500 transition-all transform active:scale-95 text-center flex items-center justify-center gap-3";

    return (
        <div className="p-5 min-h-screen bg-gray-50 pb-20">
            <Head>
                <title>管理メニュー - 那須アプリ</title>
            </Head>
            
            <header className="max-w-md mx-auto py-10 text-center">
                <h1 className="text-3xl font-black text-gray-800 tracking-tighter italic">ADMIN MENU</h1>
                <div className="mt-2 flex justify-center gap-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                    <span>Stores: {storesCount}</span>
                    <span>Users: {userCount}</span>
                </div>
            </header>

            <nav className="space-y-4">
                {/* メインダッシュボード */}
                <Link href="/admin/dashboard" className={primaryLinkStyle}>
                    <RiLayoutGridLine size={24} /> 運営ダッシュボード
                </Link>

                <hr className="my-6 border-gray-200 w-full max-w-md mx-auto" />

                {/* 店舗管理（ここが反映ポイント） */}
                <Link href="/admin/manageStores" className={linkStyle}>
                    <RiStore2Line size={24} /> 店舗管理 ({storesCount}件)
                </Link>

                <Link href="/admin/manageApps" className={linkStyle}>
                    📂 アプリ管理 (CRUD)
                </Link>

                <Link href="/admin/user-management" className={linkStyle}>
                    <RiShieldUserLine size={24} /> ユーザー管理 ({userCount}人)
                </Link>

                <hr className="my-6 border-gray-200 w-full max-w-md mx-auto" />

                <h2 className="text-xs font-black text-center text-indigo-400 uppercase tracking-[0.2em] mb-4">
                    Wisdom Guide Management
                </h2>
                <Link href="/app/wisdom-guide" className={wisdomLinkStyle}>
                    ▶️ 動画リスト管理
                </Link>

                <hr className="my-6 border-gray-200 w-full max-w-md mx-auto" />

                <Link href="/admin/settings" className={settingsLinkStyle}>
                    ⚙️ システム設定
                </Link>

                {/* ログアウトボタン */}
                <div className="pt-10 max-w-md mx-auto">
                    <button 
                        onClick={() => window.location.href = '/home'}
                        className="w-full py-4 text-gray-400 font-bold text-sm border-2 border-dashed border-gray-200 rounded-2xl active:bg-gray-100 transition"
                    >
                        ホームに戻る
                    </button>
                </div>
            </nav>
        </div>
    );
};

// --- ★ 修正の核：Firestoreからデータを取得して反映させる ---
export const getServerSideProps: GetServerSideProps = async (context) => {
    try {
        // 1. 店舗数を取得
        const storesSnapshot = await adminDb.collection('stores').get();
        const storesCount = storesSnapshot.size;

        // 2. ユーザー数を取得
        const usersSnapshot = await adminDb.collection('users').get();
        const userCount = usersSnapshot.size;

        // ※本来はここで認証チェックを行う（開発中はスルー）
        
        return {
            props: {
                storesCount,
                userCount
            }
        };
    } catch (err) {
        console.error("Admin Fetch Error:", err);
        return {
            props: {
                storesCount: 0,
                userCount: 0
            }
        };
    }
};

export default AdminPage;














