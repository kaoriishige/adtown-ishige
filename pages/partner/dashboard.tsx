import { GetServerSideProps, NextPage } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { getAuth, signOut, onAuthStateChanged, User } from 'firebase/auth';
import { app } from '../../lib/firebase';
import { adminDb, adminAuth } from '@/lib/firebase-admin';
import nookies from 'nookies';
import {
    RiLogoutBoxRLine,
    RiCoupon3Line,
    RiRobotLine,
    RiMoneyCnyBoxLine,
    RiBankLine,
    RiCloseCircleLine,
    RiAlertFill,
    RiEyeLine,
    RiLoader4Line,
} from 'react-icons/ri';
import { useAuth } from '@/contexts/AuthContext';

// =========================================================================
// 1. DUMMY/PLACEHOLDER DEFINITIONS
// =========================================================================

declare const __app_id: string;
const appId = process.env.NEXT_PUBLIC_APP_ID || (typeof __app_id !== 'undefined' ? __app_id : 'default-app-id');

const StoreIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    </svg>
);

// ===============================
// 2. TYPE DEFINITIONS
// ===================================
interface DashboardProps {
    companyName: string;
    isPaid: boolean;
    subscriptionStatus: string | null;
    hasRecruitRole: boolean;
    storeId: string | null;
}

interface ActionButtonProps {
    href: string;
    icon: React.ReactNode;
    title: string;
    description: string;
    bgColorClass: string;
    isPro: boolean;
    isPaid: boolean;
    onClick?: (e: React.MouseEvent<HTMLAnchorElement>) => void;
}

// ===============================
// 3. HELPER COMPONENTS (ActionButton)
// ===================================
const ActionButton: React.FC<ActionButtonProps> = ({
    href,
    icon,
    title,
    description,
    bgColorClass,
    onClick,
}) => {
    // 制限をすべて解除: 常にクリック可能
    const linkContent = (
        <a
            onClick={onClick}
            className="group flex items-center p-4 bg-white rounded-lg shadow-sm transition-all cursor-pointer border border-transparent hover:shadow-lg hover:border-blue-500"
        >
            <div className={`flex-shrink-0 w-16 h-16 rounded-lg flex items-center justify-center ${bgColorClass}`}>
                {icon}
            </div>
            <div className="ml-4">
                <h3 className="text-lg font-bold text-gray-800 group-hover:text-blue-600 transition-colors">
                    {title}
                </h3>
                <p className="text-sm text-gray-500 mt-1">{description}</p>
            </div>
        </a>
    );

    if (onClick) {
        return linkContent;
    }

    return (
        <Link href={href} legacyBehavior>
            {linkContent}
        </Link>
    );
};

// ===============================
// 4. SERVER SIDE LOGIC (getServerSideProps)
// ===================================
export const getServerSideProps: GetServerSideProps = async (context) => {
    try {
        const cookies = nookies.get(context);
        const token = await adminAuth.verifySessionCookie(cookies.session || '', true);
        const { uid } = token;

        if (!uid) {
            return { redirect: { destination: '/partner/login', permanent: false } };
        }

        const userDoc = await adminDb.collection('users').doc(uid).get();

        if (!userDoc.exists) {
            return {
                redirect: { destination: '/partner/login?error=user_not_found', permanent: false }
            };
        }

        const userData = userDoc.data() || {};
        const roles = userData.roles || [];

        if (!roles.includes('adver')) {
            console.warn(`[Auth] Access Denied: User ${uid} does not have 'adver' role.`);
            return { redirect: { destination: '/partner/login', permanent: false } };
        }

        const adverStatus = userData.adverSubscriptionStatus || null;
        const isPaid = (adverStatus === 'active' || adverStatus === 'trialing');

        const storesSnapshot = await adminDb
            .collection('artifacts')
            .doc(appId)
            .collection('users')
            .doc(uid)
            .collection('stores')
            .limit(1)
            .get();

        const storeId = storesSnapshot.empty ? null : storesSnapshot.docs[0].id;

        return {
            props: {
                uid: userDoc.id,
                email: userData.email || '',
                companyName: userData.companyName || (userData as any).storeName || 'パートナー',
                roles: roles,
                isPaid: isPaid,
                subscriptionStatus: adverStatus,
                hasRecruitRole: roles.includes('recruit'),
                storeId: storeId,
            }
        };
    } catch (err) {
        console.error('Dashboard getServerSideProps error:', err);
        return { redirect: { destination: '/partner/login', permanent: false } };
    }
};

// ===============================
// 5. MAIN COMPONENT (PartnerDashboard)
// ===================================
const PartnerDashboard: NextPage<DashboardProps> = (props) => {
    const {
        companyName, isPaid, hasRecruitRole, storeId
    } = props;

    const router = useRouter();
    const { payment_status } = router.query;
    const auth = getAuth(app);

    // 認証状態管理 (AuthContextを使用)
    const { user: authUser, loading: authLoading } = useAuth();
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [debugLog, setDebugLog] = useState<string[]>([]);

    const addDebugLog = (msg: string) => {
        const time = new Date().toLocaleTimeString();
        setDebugLog(prev => [`[${time}] ${msg}`, ...prev].slice(0, 50));
        console.log(`[DASHBOARD DEBUG] ${msg}`);
    };

    useEffect(() => {
        addDebugLog(`Auth loading: ${authLoading}, User: ${authUser?.uid || 'null'}, appId: ${appId}`);
    }, [authLoading, authUser]);

    useEffect(() => {
        const refreshAndRedirect = async () => {
            addDebugLog("Payment success detected. Refreshing token...");
            await auth.currentUser?.getIdToken(true).catch(e => console.error("Token refresh failed:", e));
            window.location.href = '/partner/dashboard';
        };

        if (payment_status === 'success') {
            refreshAndRedirect();
        }
    }, [auth, payment_status]);

    const handleLogout = async () => {
        try {
            await fetch('/api/auth/sessionLogout', { method: 'POST' });
            await signOut(auth);
            router.push('/partner/login');
        } catch (error) {
            console.error('ログアウト失敗:', error);
            router.push('/partner/login');
        }
    };

    const handleOpenCancelModal = (e: React.MouseEvent<HTMLAnchorElement>) => {
        e.preventDefault();
        setShowCancelModal(true);
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <Head>
                <title>広告パートナー ダッシュボード</title>
            </Head>

            <div className="flex-grow">
                {authLoading || (payment_status === 'success') ? (
                    <div className="flex justify-center items-center py-40">
                        <RiLoader4Line className="animate-spin text-4xl text-indigo-600" />
                        <span className="ml-4 text-lg font-semibold text-gray-700">
                            {payment_status === 'success' ? '決済情報を更新中...' : '認証情報を確認中...'}
                        </span>
                    </div>
                ) : (
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

                        {/* 解約確認モーダル */}
                        {showCancelModal && (
                            <div
                                className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
                                onClick={() => setShowCancelModal(false)}
                            >
                                <div
                                    className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <div className="p-6 text-center">
                                        <div className="flex justify-center mb-4">
                                            <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
                                                <RiAlertFill className="h-10 w-10 text-red-600" />
                                            </div>
                                        </div>
                                        <h2 className="text-2xl font-bold text-gray-900 mb-3">本当に解約しますか？</h2>
                                        <p className="text-gray-600 mb-6">
                                            「解約手続きに進む」ボタンを押すと、サブスクリプションの解約ページに移動します。
                                        </p>

                                        <div className="flex flex-col sm:flex-row gap-3">
                                            <button
                                                onClick={() => setShowCancelModal(false)}
                                                className="w-full px-4 py-3 rounded-lg font-semibold bg-gray-200 text-gray-700 hover:bg-gray-300 transition-colors"
                                            >
                                                キャンセル
                                            </button>
                                            <Link href="/cancel-subscription" legacyBehavior>
                                                <a className="w-full px-4 py-3 rounded-lg font-semibold text-white bg-red-600 hover:bg-red-700 transition-colors text-center">
                                                    解約手続きに進む
                                                </a>
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        <header className="bg-white shadow-sm">
                            <div className="max-w-4xl mx-auto px-6 py-4 flex justify-between items-center">
                                <div>
                                    <h1 className="text-2xl font-bold text-gray-900">広告パートナー ダッシュボード</h1>
                                    <p className="text-sm text-gray-600 mt-1">
                                        ようこそ、<span className="font-bold">{companyName}</span> 様
                                    </p>
                                </div>
                                <div className="flex flex-col items-end text-right">
                                    <p className="text-[10px] font-bold text-gray-700 leading-tight mb-1">こちらのLINEに必ず登録して、<br />次回よりLINEからログインください。</p>
                                    <div
                                        className="mb-2"
                                        dangerouslySetInnerHTML={{
                                            __html: '<a href="https://lin.ee/FwVhCvs" target="_blank"><img src="https://scdn.line-apps.com/n/line_add_friends/btn/ja.png" alt="友だち追加" height="30" border="0"></a>'
                                        }}
                                    />
                                    <button
                                        onClick={handleLogout}
                                        className="flex items-center space-x-2 text-sm text-gray-600 hover:text-red-600 p-2 rounded-lg transition-colors font-semibold"
                                    >
                                        <RiLogoutBoxRLine size={20} />
                                        <span>ログアウト</span>
                                    </button>
                                </div>
                            </div>
                        </header>

                        <main className="max-w-4xl mx-auto px-6 py-8">

                            {!storeId && (
                                <div className="mb-8 p-6 bg-red-100 border-4 border-red-300 text-red-700 rounded-lg shadow-lg text-center">
                                    <h2 className="text-2xl font-extrabold text-red-900 mb-2">
                                        ⚠️ 【重要】店舗プロフィールが未登録です
                                    </h2>
                                    <p className="mt-2 text-lg">
                                        すべての機能を利用するために、先に
                                        <strong>お店の基本情報を完全に登録</strong>してください。
                                    </p>
                                    <Link href="/partner/profile" legacyBehavior>
                                        <a className="inline-block mt-4 bg-red-600 text-white font-extrabold py-2 px-6 rounded-full shadow-lg hover:bg-red-700 transition duration-150">
                                            → 店舗プロフィール登録へ
                                        </a>
                                    </Link>
                                </div>
                            )}

                            <section>
                                <h2 className="text-xl font-bold text-gray-700 mb-3">１．集客ツールとお店の基本情報を設定する</h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                    <ActionButton
                                        href="/partner/profile"
                                        icon={<StoreIcon />}
                                        title="店舗プロフィールを登録・編集"
                                        description="特化情報、LINE情報、業種別データを設定します"
                                        bgColorClass="bg-blue-500"
                                        isPro={false}
                                        isPaid={isPaid}
                                    />
                                    {storeId && (
                                        <ActionButton
                                            href={`/stores/view/${storeId}`}
                                            icon={<RiEyeLine className="h-8 w-8 text-white" />}
                                            title="店舗情報プレビュー（公開画面）"
                                            description="アプリ上でどのように見えているかを確認します"
                                            bgColorClass="bg-indigo-500"
                                            isPro={false}
                                            isPaid={isPaid}
                                        />
                                    )}
                                </div>
                                <ActionButton
                                    href="/partner/deals"
                                    icon={<RiCoupon3Line className="h-8 w-8 text-white" />}
                                    title="クーポン・特典・フードロスを登録・管理"
                                    description="ユーザーの来店を促し、在庫問題を解決する集客ツールです"
                                    bgColorClass="bg-green-500"
                                    isPro={false}
                                    isPaid={isPaid}
                                />
                            </section>

                            <section className="mt-8">
                                <h2 className="text-xl font-bold text-gray-700 mb-3">２．集客ツール</h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <ActionButton
                                        href="/partner/leads"
                                        icon={<RiRobotLine className="h-8 w-8 text-white" />}
                                        title="AI見込み客リスト & LINEアプローチ"
                                        description="AIが選定した最適顧客に、LINE登録案内を送信します。"
                                        bgColorClass="bg-indigo-600"
                                        isPro={true}
                                        isPaid={isPaid}
                                    />
                                </div>
                            </section>

                            <section className="mt-8">
                                <h2 className="text-xl font-bold text-gray-700 mb-3">３．報酬受取機能</h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <ActionButton
                                        href="/partner/referral-info"
                                        icon={<RiMoneyCnyBoxLine className="h-8 w-8 text-white" />}
                                        title="紹介料プログラム"
                                        description="お客様にアプリを紹介し、継続的な報酬を得るツールです"
                                        bgColorClass="bg-purple-500"
                                        isPro={true}
                                        isPaid={isPaid}
                                    />
                                    <ActionButton
                                        href="/partner/payout-settings"
                                        icon={<RiBankLine className="h-8 w-8 text-white" />}
                                        title="報酬受取口座を登録・編集"
                                        description="紹介報酬を受け取るための口座を設定します"
                                        bgColorClass="bg-yellow-500"
                                        isPro={true}
                                        isPaid={isPaid}
                                    />
                                    {isPaid && (
                                        <ActionButton
                                            href="/cancel-subscription"
                                            icon={<RiCloseCircleLine className="h-8 w-8 text-white" />}
                                            title="サブスクリプションの解約"
                                            description="プランの自動更新を停止（解約）します"
                                            bgColorClass="bg-red-500"
                                            isPro={true}
                                            isPaid={isPaid}
                                            onClick={handleOpenCancelModal}
                                        />
                                    )}
                                </div>
                            </section>

                            {!hasRecruitRole && (
                                <section className="mt-12 p-6 bg-white rounded-lg shadow-md border border-blue-200">
                                    <h2 className="text-xl font-bold text-blue-600">求人広告掲載サービス</h2>
                                    <p className="mt-2 text-gray-600">
                                        求人広告を掲載することができます。AIマッチング導入プランもあります。
                                    </p>
                                    <Link href="/recruit/apply" legacyBehavior>
                                        <a className="inline-block mt-4 bg-blue-500 text-white font-bold py-2 px-4 rounded hover:bg-blue-600 transition duration-150 cursor-pointer">
                                            求人サービスを追加する
                                        </a>
                                    </Link>
                                </section>
                            )}

                            <hr className="my-8" />

                            <div className="pb-6">
                                <section className="mt-6">
                                    <div className="bg-white p-6 rounded-lg shadow-lg border border-gray-100 flex items-center justify-between">
                                        <div className="flex flex-col">
                                            <h2 className="text-lg font-bold text-gray-700 mb-1">こちらのLINEに必ず登録して、次回よりLINEからログインください。</h2>
                                        </div>
                                        <div
                                            dangerouslySetInnerHTML={{
                                                __html: '<a href="https://lin.ee/FwVhCvs" target="_blank"><img src="https://scdn.line-apps.com/n/line_add_friends/btn/ja.png" alt="友だち追加" height="36" border="0"></a>'
                                            }}
                                        />
                                    </div>
                                </section>
                            </div>

                        </main>

                        <footer className="max-w-4xl mx-auto px-6 pt-0 pb-8 text-center">
                            <button
                                onClick={handleLogout}
                                className="w-full py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gray-600 hover:bg-gray-700 transition"
                            >
                                ログアウト
                            </button>
                            <p className="text-xs text-gray-500 mt-4">
                                ログインは、ブラウザでadtownと検索してホームページから行ってください。
                            </p>
                        </footer>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PartnerDashboard;

