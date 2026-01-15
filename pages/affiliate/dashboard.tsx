import { GetServerSideProps, NextPage } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { getAuth, signOut } from 'firebase/auth';
import { app } from '@/lib/firebase';
import { adminDb, adminAuth } from '@/lib/firebase-admin';
import nookies from 'nookies';
import { QRCodeCanvas } from 'qrcode.react';
import {
    RiLogoutBoxRLine,
    RiBankLine,
    RiUserFollowLine,
    RiStore2Line,
    RiUserSearchLine,
    RiFileCopyLine,
    RiDownload2Line,
    RiCursorLine,
    RiUserAddLine,
    RiHandCoinLine,
    RiLineLine
} from 'react-icons/ri';

// ===============================
// 型定義
// ===============================
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

// ===============================
// メインコンポーネント
// ===============================
const AffiliateDashboard: NextPage<DashboardProps> = ({ uid, stats }) => {
    const router = useRouter();
    const auth = getAuth(app);
    const [activeTab, setActiveTab] = useState<'user' | 'adver' | 'recruit'>('user');
    const [copied, setCopied] = useState(false);

    // 紹介URLの定義
    const referralLinks = {
        user: `https://minna-no-nasu-app.netlify.app/?ref=${uid}`,
        adver: `https://minna-no-nasu-app.netlify.app/partner/signup?ref=${uid}`,
        recruit: `https://minna-no-nasu-app.netlify.app/recruit?ref=${uid}`
    };

    const currentStat = stats[activeTab];

    // URLコピー処理
    const handleCopy = (text: string) => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    // QRコードダウンロード処理
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
        await fetch('/api/auth/sessionLogout', { method: 'POST' });
        await signOut(auth);
        router.push('/partner/login');
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <Head><title>アフィリエイト・ダッシュボード</title></Head>

            <header className="bg-white shadow-sm sticky top-0 z-10">
                <div className="max-w-4xl mx-auto px-6 py-4 flex justify-between items-center">
                    <div>
                        <h1 className="text-xl font-bold text-gray-900 uppercase">Affiliate Dashboard</h1>
                        <p className="text-[10px] text-gray-400 font-mono">ID: {uid}</p>
                    </div>
                    <button onClick={handleLogout} className="text-gray-400 hover:text-red-600 transition-colors">
                        <RiLogoutBoxRLine size={24} />
                    </button>
                </div>
            </header>

            <main className="max-w-4xl mx-auto px-6 py-8">
                {/* 報酬設定へのリンク */}
                <Link href="/affiliate/payout-settings" className="block mb-8 p-4 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl shadow-lg hover:brightness-110 transition">
                    <div className="flex items-center justify-between text-white">
                        <div className="flex items-center gap-4">
                            <RiBankLine size={28} />
                            <div>
                                <p className="font-bold">報酬受取口座の設定</p>
                                <p className="text-xs opacity-80">40%の紹介報酬を受け取る口座を登録してください</p>
                            </div>
                        </div>
                        <span className="text-2xl font-bold">→</span>
                    </div>
                </Link>

                {/* 実績表示 */}
                <h2 className="text-xs font-bold text-gray-400 uppercase tracking-[0.2em] mb-4">紹介実績データ</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    <StatBox icon={<RiCursorLine />} label="クリック" value={currentStat.clicks} unit="回" color="text-blue-500" />
                    <StatBox icon={<RiUserAddLine />} label="無料登録" value={currentStat.registrations} unit="人" color="text-green-500" />
                    <StatBox icon={<RiHandCoinLine />} label="成約数" value={currentStat.conversions} unit="件" color="text-orange-500" />
                    <StatBox icon={<RiBankLine />} label="発生報酬" value={currentStat.earned.toLocaleString()} unit="円" color="text-red-500" />
                </div>

                {/* 切り替え・ツールセクション */}
                <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100">
                    <div className="flex bg-gray-50 border-b">
                        <TabItem active={activeTab === 'user'} onClick={() => setActiveTab('user')} icon={<RiUserFollowLine />} label="一般ユーザー" />
                        <TabItem active={activeTab === 'adver'} onClick={() => setActiveTab('adver')} icon={<RiStore2Line />} label="広告パートナー" />
                        <TabItem active={activeTab === 'recruit'} onClick={() => setActiveTab('recruit')} icon={<RiUserSearchLine />} label="求人パートナー" />
                    </div>

                    <div className="p-8">
                        <div className="text-center mb-8">
                            <h3 className="text-lg font-black text-gray-800">
                                {activeTab === 'user' && "一般紹介URL（報酬40%）"}
                                {activeTab === 'adver' && "広告パートナー紹介URL（報酬40%）"}
                                {activeTab === 'recruit' && "求人紹介URL（報酬40%）"}
                            </h3>
                        </div>

                        {/* QRコード表示エリア */}
                        <div className="flex flex-col items-center gap-6">
                            <div className="p-6 bg-white border-2 border-gray-100 rounded-3xl shadow-inner">
                                <QRCodeCanvas
                                    id="referral-qr"
                                    value={referralLinks[activeTab]}
                                    size={200}
                                    level="H"
                                    includeMargin={true}
                                />
                            </div>

                            <button
                                onClick={downloadQRCode}
                                className="flex items-center gap-2 bg-gray-800 text-white px-6 py-3 rounded-full font-bold hover:bg-black transition shadow-lg"
                            >
                                <RiDownload2Line /> QRコードを保存
                            </button>
                        </div>

                        {/* URLコピーエリア */}
                        <div className="mt-12 space-y-2">
                            <p className="text-[10px] font-black text-gray-400 uppercase ml-1">紹介用URL</p>
                            <div className="flex gap-2">
                                <input
                                    readOnly
                                    value={referralLinks[activeTab]}
                                    className="flex-1 bg-gray-50 border-2 border-gray-100 p-4 rounded-2xl text-sm font-medium text-gray-500 focus:outline-none"
                                />
                                <button
                                    onClick={() => handleCopy(referralLinks[activeTab])}
                                    className="bg-indigo-600 text-white px-6 rounded-2xl font-bold text-sm hover:bg-indigo-700 transition"
                                >
                                    {copied ? '完了!' : 'コピー'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <footer className="mt-12 text-center pb-12">
                    <div className="inline-flex items-center gap-2 p-4 bg-white rounded-2xl border border-gray-100 shadow-sm">
                        <RiLineLine className="text-green-500 text-2xl" />
                        <div className="text-left">
                            <p className="text-xs font-bold text-gray-800">パートナー専用公式LINE</p>
                            <a href="https://lin.ee/FwVhCvs" target="_blank" rel="noreferrer" className="text-[10px] text-blue-500 hover:underline font-bold">友だち追加でサポートを受ける</a>
                        </div>
                    </div>
                </footer>
            </main>
        </div>
    );
};

// ===============================
// サブコンポーネント
// ===============================
const StatBox = ({ icon, label, value, unit, color }: any) => (
    <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100">
        <div className={`text-2xl ${color} mb-2`}>{icon}</div>
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-tighter">{label}</p>
        <div className="mt-1 flex items-baseline gap-1">
            <span className="text-2xl font-black text-gray-800">{value}</span>
            <span className="text-[10px] font-bold text-gray-400">{unit}</span>
        </div>
    </div>
);

const TabItem = ({ active, onClick, icon, label }: any) => (
    <button
        onClick={onClick}
        className={`flex-1 py-5 flex flex-col items-center gap-1 transition-all ${active ? 'bg-white text-indigo-600' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100/50'
            }`}
    >
        <span className="text-xl">{icon}</span>
        <span className="text-[9px] font-black uppercase tracking-tighter">{label}</span>
        {active && <div className="w-8 h-1 bg-indigo-600 rounded-full mt-1" />}
    </button>
);

// ===============================
// サーバーサイドロジック
// ===============================
export const getServerSideProps: GetServerSideProps = async (context) => {
    try {
        const cookies = nookies.get(context);
        const token = await adminAuth.verifySessionCookie(cookies.session || '', true);
        const { uid } = token;

        if (!uid) return { redirect: { destination: '/partner/login', permanent: false } };

        const userDoc = await adminDb.collection('users').doc(uid).get();
        const userData = userDoc.data() || {};

        // 統計データの初期値設定
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