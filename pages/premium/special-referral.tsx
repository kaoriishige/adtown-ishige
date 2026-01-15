import { GetServerSideProps, NextPage } from 'next';
import Head from 'next/head';
import { useRouter } from 'next/router';
import React, { useState } from 'react';
import { adminDb, adminAuth } from '@/lib/firebase-admin';
import nookies from 'nookies';
import { QRCodeCanvas } from 'qrcode.react';
import {
    RiArrowLeftSLine,
    RiFileCopyLine,
    RiDownload2Line,
    RiVerifiedBadgeFill,
    RiGiftFill,
    RiUserHeartFill,
    RiBankCardFill,
    RiInformationLine,
    RiLayoutGridFill,
    RiExternalLinkLine,
} from 'react-icons/ri';

interface ReferralStat {
    count: number;
    amount: number;
    period: string;
}

interface ReferralProps {
    uid: string;
    userData: any;
    stats: ReferralStat;
}

const ReferralPage: NextPage<ReferralProps> = ({ uid, userData, stats }) => {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<'user' | 'partner' | 'recruit'>('user');
    const [copied, setCopied] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(false);

    // 入力フォームの状態管理（メールアドレスを追加）
    const [profileData, setProfileData] = useState({
        realName: userData.realName || '',
        email: userData.email || '',
        address: userData.address || '',
        phoneNumber: userData.phoneNumber || '',
        bankName: userData.bankInfo?.bankName || '',
        branchName: userData.bankInfo?.branchName || '',
        branchCode: userData.bankInfo?.branchCode || '',
        accountType: userData.bankInfo?.accountType || '普通',
        accountNumber: userData.bankInfo?.accountNumber || '',
        accountHolder: userData.bankInfo?.accountHolder || '',
    });

    const referralLinks = {
        user: `https://minna-no-nasu-app.netlify.app/?ref=${uid}`,
        partner: `https://minna-no-nasu-app.netlify.app/partner/signup?ref=${uid}`,
        recruit: `https://minna-no-nasu-app.netlify.app/recruit?ref=${uid}`
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(referralLinks[activeTab]);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const downloadQR = () => {
        const canvas = document.getElementById('referral-qr') as HTMLCanvasElement;
        const link = document.createElement('a');
        link.download = `qr-${activeTab}.png`;
        link.href = canvas.toDataURL();
        link.click();
    };

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await fetch('/api/premium/update-profile', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    uid,
                    ...profileData
                }),
            });
            if (res.ok) {
                setIsEditing(false);
                router.replace(router.asPath);
            } else {
                alert('保存に失敗しました。');
            }
        } catch (err) {
            alert('通信エラーが発生しました。');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#FDFCFD] pb-32 font-sans text-[#4A3B3B]">
            <Head><title>特別紹介プログラム | 40%還元</title></Head>

            {/* ヘッダー */}
            <header className="bg-white/80 backdrop-blur-xl border-b border-[#E8E2D9] px-6 py-4 sticky top-0 z-50">
                <div className="max-w-xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button onClick={() => router.push('/premium/dashboard')} className="w-10 h-10 flex items-center justify-center rounded-full bg-[#FDFCFD] border border-[#E8E2D9] text-[#A89F94] active:scale-90 transition-all">
                            <RiArrowLeftSLine size={24} />
                        </button>
                        <div>
                            <span className="text-[10px] tracking-[0.3em] uppercase text-[#A89F94] block font-bold">Special Partner</span>
                            <h1 className="text-sm font-black italic">特別紹介プログラム</h1>
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-xl mx-auto px-6 pt-10 space-y-12">

                {/* 1. 紹介データサマリー (40%計算) */}
                <section className="bg-gradient-to-br from-[#FCE7F3] to-[#FDF2F8] rounded-[2.5rem] p-8 border border-[#F9A8D4]/20 shadow-sm relative overflow-hidden">
                    <RiGiftFill size={100} className="absolute -right-4 -bottom-4 text-pink-500/10 rotate-12" />
                    <div className="relative z-10 space-y-6">
                        <div className="flex items-center gap-2">
                            <span className="bg-white/60 backdrop-blur-sm text-pink-600 text-[10px] font-black px-3 py-1 rounded-full border border-pink-100 uppercase tracking-widest">
                                Your Performance (40% Reward)
                            </span>
                        </div>
                        <div className="grid grid-cols-2 gap-8">
                            <div>
                                <p className="text-[10px] font-bold text-pink-400 uppercase tracking-widest mb-1">今月の紹介人数</p>
                                <p className="text-4xl font-black text-[#4A3B3B]">{stats.count}<span className="text-sm ml-1 italic text-[#A89F94]">名</span></p>
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-pink-400 uppercase tracking-widest mb-1">お支払い予定額</p>
                                <p className="text-4xl font-black text-pink-500">{stats.amount.toLocaleString()}<span className="text-sm ml-1 italic">円</span></p>
                            </div>
                        </div>
                        <div className="pt-4 border-t border-pink-100 flex items-center justify-between">
                            <span className="text-[10px] font-bold text-[#A89F94]">集計期間: {stats.period}</span>
                            <div className="flex items-center gap-1 text-[10px] font-black text-pink-600">
                                <RiVerifiedBadgeFill /> ステータス: 確定
                            </div>
                        </div>
                    </div>
                </section>

                {/* 2. ご案内 */}
                <section className="bg-white rounded-[2rem] p-6 border border-[#E8E2D9] shadow-inner relative">
                    <div className="flex gap-4">
                        <RiInformationLine className="text-pink-400 shrink-0 mt-1" size={24} />
                        <div className="space-y-2">
                            <h3 className="text-sm font-black italic">紹介プログラムのご案内</h3>
                            <p className="text-[11px] font-bold text-[#8C8479] leading-relaxed">
                                紹介手数料は、一律有料課金に対し<span className="text-pink-500 font-black">40%</span>をお支払いします。手数料は月末締で翌月15日に、下記でご登録いただいた銀行口座へ直接お振込みいたします。
                                ※お振込金額が3,000円に満たない場合は、翌月以降へ繰越となります。
                            </p>
                        </div>
                    </div>
                </section>

                {/* 3. 紹介ツール */}
                <section className="space-y-4">
                    <div className="flex items-center justify-between px-2">
                        <h2 className="text-[11px] font-black text-[#A89F94] uppercase tracking-[0.3em]">Referral Tools</h2>
                        <RiLayoutGridFill size={14} className="text-[#E8E2D9]" />
                    </div>

                    <div className="bg-white rounded-[2.5rem] border border-[#E8E2D9] shadow-sm overflow-hidden">
                        <div className="flex border-b border-[#F3F0EC]">
                            <TabItem active={activeTab === 'user'} onClick={() => setActiveTab('user')} label="一般ユーザー" />
                            <TabItem active={activeTab === 'partner'} onClick={() => setActiveTab('partner')} label="店舗/オーナー" />
                            <TabItem active={activeTab === 'recruit'} onClick={() => setActiveTab('recruit')} label="企業/求人" />
                        </div>

                        <div className="w-full px-8 pt-8 flex flex-col gap-4">
                            <div>
                                <h3 className="text-sm font-black text-gray-800">あなたの紹介リンク</h3>
                                <p className="text-[11px] font-bold text-[#8C8479] mt-1">
                                    このQRコード・URLから登録課金された利用料の<br />
                                    <span className="text-pink-500 font-black">40%（最大192円/月）</span>があなたに還元されます。
                                </p>
                            </div>
                            <a href={referralLinks[activeTab]} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-2 py-3 px-6 bg-blue-50 text-blue-600 rounded-2xl text-[11px] font-black border border-blue-100 active:scale-[0.98] transition-all">
                                <RiExternalLinkLine size={16} /> 紹介ページの内容を確認する
                            </a>
                        </div>

                        <div className="p-8 space-y-8 flex flex-col items-center">
                            <div className="w-full space-y-3">
                                <div className="p-5 bg-[#F3F0EC]/50 rounded-2xl break-all text-[10px] font-mono font-bold text-[#8C8479] border border-[#E8E2D9] relative group">
                                    {referralLinks[activeTab]}
                                    <RiExternalLinkLine className="absolute top-2 right-2 text-[#D1C9BF]" />
                                </div>
                                <button onClick={copyToClipboard} className={`w-full py-4 rounded-full font-black text-sm flex items-center justify-center gap-2 transition-all shadow-lg ${copied ? 'bg-emerald-500 text-white shadow-emerald-100' : 'bg-[#4A4540] text-white shadow-gray-200 active:scale-[0.98]'}`}>
                                    <RiFileCopyLine size={18} /> {copied ? 'コピーしました' : 'リンクをコピーする'}
                                </button>
                            </div>

                            <div className="w-full pt-8 border-t border-[#F3F0EC] flex flex-col items-center space-y-6">
                                <div className="p-6 bg-white border-2 border-dashed border-[#E8E2D9] rounded-[2.5rem] shadow-inner">
                                    <QRCodeCanvas id="referral-qr" value={referralLinks[activeTab]} size={160} level="H" includeMargin={true} />
                                </div>
                                <button onClick={downloadQR} className="px-8 py-3 bg-white border border-[#E8E2D9] text-[#8C8479] rounded-full text-xs font-black flex items-center gap-2 hover:bg-[#F3F0EC] transition-all">
                                    <RiDownload2Line /> QRコードを画像で保存
                                </button>
                            </div>
                        </div>
                    </div>
                </section>

                {/* 4. 個人情報 & 口座情報 */}
                <section className="space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-700">
                    <div className="flex items-center justify-between px-2">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-pink-500 rounded-lg flex items-center justify-center text-white shadow-lg shadow-pink-100">
                                <RiUserHeartFill size={20} />
                            </div>
                            <h2 className="text-[11px] font-black text-[#A89F94] uppercase tracking-[0.3em]">Profile & Bank Setting</h2>
                        </div>
                        {isEditing ? (
                            <button onClick={() => setIsEditing(false)} className="text-[10px] font-black text-[#A89F94] underline uppercase tracking-widest">キャンセル</button>
                        ) : (
                            <button onClick={() => setIsEditing(true)} className="bg-pink-50 text-pink-500 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border border-pink-100 active:scale-95 transition-all">
                                登録情報を変更する
                            </button>
                        )}
                    </div>

                    {!isEditing && userData.realName ? (
                        /* 閲覧モード */
                        <div className="space-y-6">
                            <div className="bg-white rounded-[2.5rem] p-8 border border-[#E8E2D9] shadow-sm space-y-8">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <InfoItem label="お名前" value={userData.realName} />
                                    <InfoItem label="メールアドレス" value={userData.email} />
                                    <InfoItem label="住所" value={userData.address} />
                                    <InfoItem label="電話番号" value={userData.phoneNumber} />
                                </div>

                                <div className="pt-8 border-t border-[#F3F0EC] space-y-4">
                                    <h3 className="flex items-center gap-2 text-[10px] font-black tracking-[0.2em] text-[#A89F94] uppercase">
                                        <RiBankCardFill className="text-pink-400" /> Payout Bank (振込先口座)
                                    </h3>
                                    <div className="bg-[#F3F0EC]/30 rounded-2xl p-6 border border-[#E8E2D9]">
                                        <p className="font-black text-sm text-[#4A3B3B]">{userData.bankInfo?.bankName} {userData.bankInfo?.branchName} ({userData.bankInfo?.branchCode})</p>
                                        <div className="flex gap-4 text-xs font-bold text-[#8C8479] mt-1">
                                            <span>{userData.bankInfo?.accountType} {userData.bankInfo?.accountNumber}</span>
                                        </div>
                                        <p className="text-[10px] font-black text-[#A89F94] mt-3 pt-3 border-t border-[#E8E2D9]/50 italic">名義: {userData.bankInfo?.accountHolder}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        /* 編集モード */
                        <form onSubmit={handleUpdateProfile} className="bg-white rounded-[2.5rem] p-8 border border-[#E8E2D9] shadow-xl space-y-10">
                            <div className="space-y-8">
                                <div className="space-y-6">
                                    <div className="flex items-center gap-2">
                                        <span className="w-1 h-4 bg-pink-500 rounded-full"></span>
                                        <h3 className="text-sm font-black italic">1. 個人情報の入力</h3>
                                    </div>
                                    <div className="grid grid-cols-1 gap-5">
                                        <FormInput label="お名前 (本名)" value={profileData.realName} onChange={(val) => setProfileData({ ...profileData, realName: val })} placeholder="例: 那須 花子" />
                                        <FormInput label="メールアドレス" value={profileData.email} onChange={(val) => setProfileData({ ...profileData, email: val })} placeholder="nasu@example.com" />
                                        <FormInput label="ご住所" value={profileData.address} onChange={(val) => setProfileData({ ...profileData, address: val })} placeholder="例: 栃木県那須塩原市..." />
                                        <FormInput label="電話番号" value={profileData.phoneNumber} onChange={(val) => setProfileData({ ...profileData, phoneNumber: val })} placeholder="090-0000-0000" />
                                    </div>
                                </div>

                                <div className="space-y-6 pt-4 border-t border-[#F3F0EC]">
                                    <div className="flex items-center gap-2">
                                        <span className="w-1 h-4 bg-pink-500 rounded-full"></span>
                                        <h3 className="text-sm font-black italic">2. 振込先口座の入力</h3>
                                    </div>
                                    <div className="grid grid-cols-1 gap-5">
                                        <FormInput label="銀行名" value={profileData.bankName} onChange={(val) => setProfileData({ ...profileData, bankName: val })} placeholder="例: 那須銀行" />
                                        <div className="grid grid-cols-2 gap-4">
                                            <FormInput label="支店名" value={profileData.branchName} onChange={(val) => setProfileData({ ...profileData, branchName: val })} placeholder="黒磯支店" />
                                            <FormInput label="支店コード" value={profileData.branchCode} onChange={(val) => setProfileData({ ...profileData, branchCode: val })} placeholder="123" />
                                        </div>
                                        <div className="grid grid-cols-3 gap-4">
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black text-[#A89F94] px-2 uppercase tracking-widest">種別</label>
                                                <select className="w-full p-4 bg-[#FDFCFD] border border-[#E8E2D9] rounded-2xl text-sm font-bold outline-none cursor-pointer focus:ring-2 focus:ring-pink-100" value={profileData.accountType} onChange={e => setProfileData({ ...profileData, accountType: e.target.value })}>
                                                    <option>普通</option><option>当座</option>
                                                </select>
                                            </div>
                                            <div className="col-span-2">
                                                <FormInput label="口座番号" value={profileData.accountNumber} onChange={(val) => setProfileData({ ...profileData, accountNumber: val })} placeholder="0123456" />
                                            </div>
                                        </div>
                                        <FormInput label="口座名義 (カタカナ)" value={profileData.accountHolder} onChange={(val) => setProfileData({ ...profileData, accountHolder: val })} placeholder="ナスタロウ" />
                                    </div>
                                </div>
                            </div>

                            <button disabled={loading} className="w-full py-5 bg-pink-500 text-white rounded-full font-black text-lg shadow-xl shadow-pink-100 active:scale-[0.98] transition-all disabled:opacity-50">
                                {loading ? '保存中...' : '情報を保存して完了'}
                            </button>
                        </form>
                    )}
                </section>
            </main>
        </div>
    );
};

// サブコンポーネント
const TabItem = ({ active, onClick, label }: any) => (
    <button onClick={onClick} className={`flex-1 py-5 text-[10px] font-black tracking-widest transition-all relative ${active ? 'bg-white text-pink-500' : 'text-[#A89F94] bg-[#FDFCFD] hover:bg-white'}`}>
        {label}
        {active && <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-1 bg-pink-500 rounded-full mb-1" />}
    </button>
);

const InfoItem = ({ label, value }: { label: string, value: string }) => (
    <div className="bg-[#FDFCFD] p-5 rounded-2xl border border-[#F3F0EC] space-y-1">
        <span className="text-[9px] font-bold text-[#A89F94] block uppercase tracking-[0.1em]">{label}</span>
        <span className="text-sm font-black text-[#4A3B3B]">{value || '未登録'}</span>
    </div>
);

const FormInput = ({ label, value, onChange, placeholder }: { label: string, value: string, onChange: (v: string) => void, placeholder: string }) => (
    <div className="space-y-2">
        <label className="text-[10px] font-black text-[#A89F94] px-2 uppercase tracking-widest">{label}</label>
        <input
            required
            className="w-full p-4 bg-[#FDFCFD] border border-[#E8E2D9] rounded-2xl text-sm font-bold placeholder-[#D1C9BF] outline-none focus:ring-2 focus:ring-pink-200 transition-all"
            value={value}
            onChange={e => onChange(e.target.value)}
            placeholder={placeholder}
        />
    </div>
);

export const getServerSideProps: GetServerSideProps = async (context) => {
    try {
        const cookies = nookies.get(context);
        const session = cookies.session || '';
        if (!session) return { redirect: { destination: '/users/login', permanent: false } };

        const token = await adminAuth.verifySessionCookie(session, true);
        const userDoc = await adminDb.collection('users').doc(token.uid).get();
        const userData = userDoc.data() || {};

        // 有料会員のみアクセス可能
        const isAllowed = userData.isPaid === true || userData.subscriptionStatus === 'active';
        if (!isAllowed) return { redirect: { destination: '/home', permanent: false } };

        // 480円の40% = 192円として計算
        const referralCount = userData.referralCount || 0;
        const stats = {
            count: referralCount,
            amount: referralCount * 192,
            period: `${new Date().getMonth() + 1}月度`
        };

        return {
            props: {
                uid: token.uid,
                userData: JSON.parse(JSON.stringify(userData)),
                stats
            }
        };
    } catch (err) {
        return { redirect: { destination: '/users/login', permanent: false } };
    }
};

export default ReferralPage;