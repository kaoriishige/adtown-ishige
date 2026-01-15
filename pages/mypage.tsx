import { useState, useMemo } from 'react';
import { NextPage, GetServerSideProps } from 'next';
import Image from 'next/image';
import nookies from 'nookies';
import Head from 'next/head';
import Link from 'next/link';

// Firebase Admin / Client
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { getAuth, signOut } from 'firebase/auth';
import { app } from '@/lib/firebase-client';

// Icons
import {
    RiLayoutGridFill, RiAlarmWarningLine, RiShoppingBagLine,
    RiBriefcase4Line, RiHealthBookLine, RiMagicLine,
    RiCloseCircleLine, RiGasStationLine, RiArrowGoBackLine,
    RiUserStarFill, RiMoneyDollarCircleLine, RiQrCodeLine
} from 'react-icons/ri';
import { IoSparklesSharp, IoDiamondOutline } from 'react-icons/io5';

interface MyPageProps {
    user: { uid: string; email: string | null; };
}

const MyPage: NextPage<MyPageProps> = ({ user }) => {
    const [isEmergencyModalOpen, setIsEmergencyModalOpen] = useState(false);

    // --- 1. 有料会員限定：追加機能 ---
    const premiumButtons = [
        { title: 'AI手相鑑定', href: '/ai-palm', Icon: IoSparklesSharp, gradient: 'from-orange-400 to-pink-500' },
        { title: 'AI悩み相談', href: '/ai-counseling', Icon: RiMagicLine, gradient: 'from-purple-500 to-indigo-600' },
        { title: '紹介報酬を確認', href: '/premium/referral', Icon: RiQrCodeLine, gradient: 'from-indigo-600 to-blue-700' },
        { title: '振込口座設定', href: '/premium/referral', Icon: RiMoneyDollarCircleLine, gradient: 'from-emerald-500 to-teal-600' },

    ];

    // --- 2. 無料会員と共通の機能（無料プランアプリ） ---
    const freeAppButtons = [
        { title: 'ガソリン価格比較', href: '/apps/AIGasPriceTracker', Icon: RiGasStationLine, gradient: 'from-red-500 to-orange-600' },
        { title: 'スーパー特売価格', href: '/nasu/kondate', Icon: RiShoppingBagLine, gradient: 'from-yellow-400 to-orange-500' },
        { title: 'ドラッグストア特売', href: '/nasu', Icon: RiHealthBookLine, gradient: 'from-purple-500 to-pink-600' },
    ];

    return (
        <div className="bg-gray-100 min-h-screen font-sans">
            <Head><title>プレミアムマイページ - みんなのNasu</title></Head>
            <div className="max-w-md mx-auto bg-white shadow-lg min-h-screen pb-10">

                {/* プレミアムヘッダー */}
                <header className="p-6 bg-gradient-to-r from-gray-900 to-gray-800 text-white sticky top-0 z-10 shadow-md">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                            <IoDiamondOutline className="text-yellow-400 text-2xl" />
                            <h1 className="text-xl font-black italic tracking-tighter">PREMIUM MEMBER</h1>
                        </div>
                        <span className="text-[10px] bg-yellow-400 text-black px-2 py-1 rounded-full font-black">480 PLAN</span>
                    </div>
                    <p className="text-gray-400 mt-2 text-xs font-bold">{user.email}</p>
                </header>

                <main className="p-4 space-y-6">
                    {/* 緊急連絡先（無料版共通） */}
                    <button onClick={() => setIsEmergencyModalOpen(true)} className="w-full flex items-center justify-center text-red-600 font-bold py-3 rounded-2xl bg-red-50 border border-red-100 shadow-sm active:scale-95 transition">
                        <RiAlarmWarningLine size={20} className="mr-2" />緊急連絡先を確認
                    </button>

                    {/* --- 有料限定セクション --- */}
                    <section>
                        <h2 className="text-sm font-black text-gray-800 mb-3 flex items-center">
                            <RiUserStarFill className="mr-2 text-yellow-500" /> 有料会員限定メニュー
                        </h2>
                        <div className="grid grid-cols-2 gap-3">
                            {premiumButtons.map((btn) => (
                                <Link key={btn.title} href={btn.href} className={`bg-gradient-to-br ${btn.gradient} p-4 rounded-2xl shadow-sm text-white active:scale-95 transition`}>
                                    <btn.Icon className="text-2xl mb-2" />
                                    <div className="font-bold text-sm leading-tight">{btn.title}</div>
                                </Link>
                            ))}
                        </div>
                    </section>

                    {/* --- 無料共通アプリセクション --- */}
                    <section>
                        <h2 className="text-sm font-black text-gray-400 mb-3 flex items-center uppercase tracking-widest">
                            <RiLayoutGridFill className="mr-2" /> 無料プラン・アプリ
                        </h2>
                        <div className="space-y-3">
                            {freeAppButtons.map((item) => (
                                <Link key={item.title} href={item.href} className={`flex items-center p-4 rounded-2xl shadow-md text-white bg-gradient-to-r ${item.gradient} active:scale-95 transition`}>
                                    <item.Icon className="text-3xl mr-4 flex-shrink-0" />
                                    <div className="font-bold">{item.title}</div>
                                </Link>
                            ))}
                        </div>
                    </section>

                    {/* ログアウト等 */}
                    <footer className="pt-10 space-y-3">
                        <button onClick={() => window.location.href = '/home'} className="w-full py-3 text-gray-500 font-bold bg-gray-50 rounded-xl border border-gray-100">無料版ホームを表示</button>
                    </footer>
                </main>
            </div>
        </div>
    );
};

export const getServerSideProps: GetServerSideProps = async (context) => {
    try {
        const cookies = nookies.get(context);
        const sessionCookie = cookies.session || '';
        if (!sessionCookie) return { redirect: { destination: '/users/login', permanent: false } };
        const token = await adminAuth.verifySessionCookie(sessionCookie, true);
        const userDoc = await adminDb.collection('users').doc(token.uid).get();

        // 有料会員でなければ無料ホームへ戻す
        if (userDoc.data()?.plan !== 'paid_480') {
            return { redirect: { destination: '/home', permanent: false } };
        }
        return { props: { user: { uid: token.uid, email: token.email || null } } };
    } catch (err) {
        return { redirect: { destination: '/users/login', permanent: false } };
    }
};

export default MyPage;