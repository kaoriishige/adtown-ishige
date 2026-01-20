import { GetServerSideProps, NextPage } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { getAuth, signOut, deleteUser } from 'firebase/auth';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { adminDb, adminAuth } from '@/lib/firebase-admin';
import nookies from 'nookies';
import { QRCodeCanvas } from 'qrcode.react';
import {
    RiLogoutBoxRLine,
    RiUserFollowLine,
    RiStore2Line,
    RiUserSearchLine,
    RiDownload2Line,
    RiCursorLine,
    RiUserAddLine,
    RiHandCoinLine,
    RiBankLine,
    RiArrowRightLine,
    RiUserForbidLine
} from 'react-icons/ri';

// --- Firebase設定 ---
const firebaseConfig = {
    apiKey: "AIzaSyDtTt0fWthsU6Baq1fJwUx8CgSakoZnMXY",
    authDomain: "minna-no-nasu-app.firebaseapp.com",
    projectId: "minna-no-nasu-app",
    storageBucket: "minna-no-nasu-app.appspot.com",
    messagingSenderId: "885979930856",
    appId: "1:885979930856:web:13d1afd4206c91813e695d",
};
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);

// ★本番ドメイン（テスト時にこれを利用してQRコードを作ります）
const PRODUCTION_DOMAIN = "https://minna-no-nasu-app.netlify.app";

interface ReferralStat {
    clicks: number;
    registrations: number;
    conversions: number;
    earned: number;
}

interface DashboardProps {
    uid: string;
    stats: {
        user: ReferralStat;
        adver: ReferralStat;
        recruit: ReferralStat;
    };
}

// LINEボタンコンポーネント
const LineAddFriendButton = () => (
    <div className="flex flex-col items-center gap-3 p-6 bg-green-50 rounded-3xl border-2 border-green-100 mb-8">
        <div className="text-center text-green-700 font-black text-sm mb-2 leading-relaxed">
            <p>ログインは、LINEからになりますので、</p>
            <p>必ず登録してください。</p>
        </div>
        <a href="https://lin.ee/0hY69mH" target="_blank" rel="noreferrer" className="hover:opacity-80 transition-opacity">
            <img
                src="https://scdn.line-apps.com/n/line_add_friends/btn/ja.png"
                alt="友だち追加"
                height="36"
            />
        </a>
    </div>
);

const AffiliateDashboard: NextPage<DashboardProps> = ({ uid, stats }) => {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<'user' | 'adver' | 'recruit'>('user');
    const [copied, setCopied] = useState(false);

    // 各タブごとの紹介先URL（本番ドメイン固定）
    const fullUrls = {
        user: `${PRODUCTION_DOMAIN}/?ref=${uid}`,
        adver: `${PRODUCTION_DOMAIN}/partner/signup?ref=${uid}`,
        recruit: `${PRODUCTION_DOMAIN}/recruit?ref=${uid}`
    };

    // 内部プレビュー用パス（履歴が残るSPA遷移用）
    const internalPaths = {
        user: `/?ref=${uid}`,
        adver: `/partner/signup?ref=${uid}`,
        recruit: `/recruit?ref=${uid}`
    };

    const currentFullUrl = fullUrls[activeTab];
    const currentStat = stats[activeTab] || { clicks: 0, registrations: 0, conversions: 0, earned: 0 };
    const earnedAmount = currentStat.earned || 0;

    const handleCopy = () => {
        navigator.clipboard.writeText(currentFullUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const downloadQRCode = () => {
        const canvas = document.getElementById('referral-qr') as HTMLCanvasElement;
        if (!canvas) return;
        const pngUrl = canvas.toDataURL("image/png").replace("image/png", "image/octet-stream");
        const downloadLink = document.createElement("a");
        downloadLink.href = pngUrl;
        downloadLink.download = `qr-${activeTab}-${uid}.png`;
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
    };

    const handleLogout = async () => {
        if (!confirm('ログアウトしますか？')) return;
        await fetch('/api/auth/sessionLogout', { method: 'POST' });
        await signOut(auth);
        router.push('/partner/login');
    };

    const handleDeleteAccount = async () => {
        if (!confirm('本当に解約（アカウント削除）しますか？この操作は取り消せません。')) return;
        try {
            const user = auth.currentUser;
            if (user) {
                await deleteUser(user);
                await fetch('/api/auth/sessionLogout', { method: 'POST' });
                router.push('/partner/login');
            }
        } catch (error) {
            alert('セキュリティのため一度ログアウトして再ログイン後に試してください。');
        }
    };

    return (
        <div className="min-h-screen bg-white">
            <Head><title>アフィリエイト・ダッシュボード</title></Head>

            <header className="bg-white border-b border-gray-100 sticky top-0 z-10">
                <div className="max-w-4xl mx-auto px-6 py-4 flex justify-between items-center">
                    <div>
                        <h1 className="text-lg font-black text-gray-900 tracking-tighter uppercase">Affiliate Dashboard</h1>
                        <p className="text-[10px] text-gray-400 font-mono">PARTNER ID: {uid}</p>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="text-xs font-bold text-gray-400 hover:text-orange-600 flex items-center gap-1 transition-colors"
                    >
                        <RiLogoutBoxRLine size={18} />
                        <span>ログアウト</span>
                    </button>
                </div>
            </header>

            <main className="max-w-4xl mx-auto px-6 py-8">

                <LineAddFriendButton />

                <h2 className="text-xs font-bold text-gray-400 uppercase tracking-[0.2em] mb-4 text-center md:text-left">紹介実績データ</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    <StatBox icon={<RiCursorLine />} label="クリック" value={currentStat.clicks || 0} unit="回" color="text-blue-500" />
                    <StatBox icon={<RiUserAddLine />} label="無料登録" value={currentStat.registrations || 0} unit="人" color="text-green-500" />
                    <StatBox icon={<RiHandCoinLine />} label="成約数" value={currentStat.conversions || 0} unit="件" color="text-orange-500" />
                    <StatBox icon={<RiBankLine />} label="発生報酬" value={earnedAmount.toLocaleString()} unit="円" color="text-red-500" />
                </div>

                <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100 mb-12">
                    <div className="flex bg-gray-50 border-b">
                        <TabItem active={activeTab === 'user'} onClick={() => setActiveTab('user')} icon={<RiUserFollowLine />} label="一般ユーザー" />
                        <TabItem active={activeTab === 'adver'} onClick={() => setActiveTab('adver')} icon={<RiStore2Line />} label="店舗集客広告" />
                        <TabItem active={activeTab === 'recruit'} onClick={() => setActiveTab('recruit')} icon={<RiUserSearchLine />} label="企業求人広告" />
                    </div>

                    <div className="p-8">
                        <div className="text-center mb-8">
                            <h3 className="text-lg font-black text-gray-800">
                                {activeTab === 'user' && "一般ユーザー紹介リンク"}
                                {activeTab === 'adver' && "店舗集客広告パートナー紹介リンク"}
                                {activeTab === 'recruit' && "企業求人広告パートナー紹介リンク"}
                            </h3>
                            <Link
                                href={internalPaths[activeTab]}
                                className="inline-flex items-center gap-2 mt-4 px-8 py-3 bg-indigo-600 text-white rounded-full font-bold shadow-lg hover:bg-indigo-700 transition-all active:scale-95"
                            >
                                <RiArrowRightLine /> ページを確認する
                            </Link>
                        </div>

                        <div className="flex flex-col items-center gap-6">
                            <div className="p-4 bg-white border-2 border-gray-100 rounded-2xl shadow-inner">
                                <QRCodeCanvas
                                    id="referral-qr"
                                    value={currentFullUrl}
                                    size={200}
                                    level="H"
                                    includeMargin={true}
                                />
                            </div>
                            <button
                                onClick={downloadQRCode}
                                className="bg-gray-800 text-white px-6 py-2 rounded-full text-xs font-bold shadow-md hover:bg-black transition-colors"
                            >
                                <RiDownload2Line className="inline mr-1" /> QRコードを画像保存
                            </button>
                        </div>

                        <div className="mt-12 space-y-2 text-left">
                            <p className="text-[10px] font-black text-gray-400 ml-1 uppercase">紹介用URL（本番ドメイン）</p>
                            <div className="flex gap-2">
                                <input
                                    readOnly
                                    value={currentFullUrl}
                                    className="flex-1 bg-gray-50 border border-gray-200 p-4 rounded-2xl text-[11px] font-bold text-gray-600 focus:outline-none"
                                />
                                <button
                                    onClick={handleCopy}
                                    className="bg-indigo-600 text-white px-6 rounded-2xl font-bold text-sm hover:bg-indigo-700 transition-colors"
                                >
                                    {copied ? '完了!' : 'コピー'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <LineAddFriendButton />

                {/* ✅ ここに解約ボタンを完全復活させました */}
                <div className="mt-20 pt-8 border-t border-gray-100 flex justify-center">
                    <button
                        onClick={handleDeleteAccount}
                        className="text-xs font-bold text-gray-300 hover:text-red-400 flex items-center gap-1 transition-colors"
                    >
                        <RiUserForbidLine size={16} />
                        <span>パートナー契約を解除する（アカウント削除）</span>
                    </button>
                </div>
            </main>
        </div>
    );
};

const StatBox = ({ icon, label, value, unit, color }: any) => (
    <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 text-center">
        <div className={`text-2xl ${color} mb-2 flex justify-center`}>{icon}</div>
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-tighter">{label}</p>
        <div className="mt-1 flex items-baseline justify-center gap-1">
            <span className="text-xl font-black text-gray-800">{value}</span>
            <span className="text-[10px] font-bold text-gray-400">{unit}</span>
        </div>
    </div>
);

const TabItem = ({ active, onClick, icon, label }: any) => (
    <button
        onClick={onClick}
        className={`flex-1 py-5 flex flex-col items-center gap-1 transition-all ${active ? 'bg-white text-indigo-600 border-b-4 border-indigo-600' : 'text-gray-400 hover:bg-gray-100/50'}`}
    >
        <span className="text-xl">{icon}</span>
        <span className="text-[9px] font-black uppercase tracking-tighter text-center">{label}</span>
    </button>
);

export const getServerSideProps: GetServerSideProps = async (context) => {
    try {
        const cookies = nookies.get(context);
        const token = await adminAuth.verifySessionCookie(cookies.session || '', true);
        const { uid } = token;
        if (!uid) return { redirect: { destination: '/partner/login', permanent: false } };

        const userDoc = await adminDb.collection('users').doc(uid).get();
        const userData = userDoc.data() || {};
        const defaultStat = { clicks: 0, registrations: 0, conversions: 0, earned: 0 };

        const stats = {
            user: userData.stats_user || defaultStat,
            adver: userData.stats_adver || defaultStat,
            recruit: userData.stats_recruit || defaultStat,
        };
        return { props: { uid, stats } };
    } catch (err) {
        return { redirect: { destination: '/partner/login', permanent: false } };
    }
};

export default AffiliateDashboard;