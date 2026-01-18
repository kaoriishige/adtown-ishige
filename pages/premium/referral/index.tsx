import { GetServerSideProps, NextPage } from 'next';
import Head from 'next/head';
import { useRouter } from 'next/router';
import React, { useState, useMemo } from 'react';
import { adminDb, adminAuth } from '@/lib/firebase-admin';
import nookies from 'nookies';
import { QRCodeCanvas } from 'qrcode.react';
import {
    RiArrowLeftSLine,
    RiFileCopyLine,
    RiStore2Line,
    RiUserSearchLine,
    RiUserFollowLine,
    RiCheckLine,
    RiLinksLine,
    RiFireFill,
    RiMoneyCnyCircleLine,
    RiHistoryLine,
    RiExternalLinkLine
} from 'react-icons/ri';

interface PageProps {
    uid: string;
    userName: string;
    referralData: {
        totalEarnings: number;
        totalCount: number;
        history: any[];
    };
}

const ReferralPage: NextPage<PageProps> = ({ uid, userName, referralData }) => {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<'create' | 'history'>('create');
    const [target, setTarget] = useState<'user' | 'partner' | 'recruit'>('user');
    const [isCopied, setIsCopied] = useState(false);

    // 紹介URL生成（紹介用パラメータ付き）
    const generatedUrl = useMemo(() => {
        const base = "https://minna-no-nasu-app.netlify.app";
        if (target === 'partner') return `${base}/partner/signup?ref=${uid}`;
        if (target === 'recruit') return `${base}/recruit?ref=${uid}`;
        return `${base}/?ref=${uid}`;
    }, [target, uid]);

    // 確認用ボタンのリンク（純粋な各ページURL）
    const previewUrl = useMemo(() => {
        const base = "https://minna-no-nasu-app.netlify.app";
        if (target === 'partner') return `${base}/partner/signup`;
        if (target === 'recruit') return `${base}/recruit`;
        return `${base}/`;
    }, [target]);

    const handleCopy = async () => {
        await navigator.clipboard.writeText(generatedUrl);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
    };

    return (
        <div className="min-h-screen bg-[#FDFCFD] pb-24 font-sans text-[#4A3B3B] antialiased">
            <Head><title>紹介管理・報酬確認</title></Head>

            <header className="sticky top-0 z-50 bg-white border-b border-[#E8E2D9] px-6 py-4 flex items-center justify-between">
                <button onClick={() => router.back()} className="w-10 h-10 flex items-center justify-center rounded-full bg-[#F5F2ED] text-[#A89F94]">
                    <RiArrowLeftSLine size={24} />
                </button>
                <h1 className="text-sm font-black">紹介プログラム</h1>
                <RiFireFill className="text-pink-500" size={24} />
            </header>

            <main className="max-w-xl mx-auto px-5 pt-8 space-y-8">

                {/* 報酬サマリー */}
                <div className="bg-[#4A4540] rounded-[2.5rem] p-8 text-white shadow-xl relative overflow-hidden">
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <p className="text-[10px] font-bold text-white/40 tracking-widest uppercase">Total Earnings</p>
                            <h2 className="text-3xl font-black mt-1">¥{referralData.totalEarnings.toLocaleString()}</h2>
                        </div>
                        <div className="bg-pink-500 p-3 rounded-2xl">
                            <RiMoneyCnyCircleLine size={24} />
                        </div>
                    </div>
                    <div className="flex justify-between items-center pt-4 border-t border-white/10 text-xs font-bold">
                        <p className="text-white/60">成約件数: {referralData.totalCount}件</p>
                        <p className="opacity-40">{userName} 様</p>
                    </div>
                </div>

                {/* タブ */}
                <div className="flex p-1.5 bg-[#F5F2ED] rounded-[2rem] border border-[#E8E2D9]">
                    <button onClick={() => setActiveTab('create')} className={`flex-1 py-4 rounded-[1.5rem] text-xs font-black flex items-center justify-center gap-2 transition-all ${activeTab === 'create' ? 'bg-white text-pink-500 shadow-sm' : 'text-[#A89F94]'}`}>
                        <RiLinksLine /> URL発行
                    </button>
                    <button onClick={() => setActiveTab('history')} className={`flex-1 py-4 rounded-[1.5rem] text-xs font-black flex items-center justify-center gap-2 transition-all ${activeTab === 'history' ? 'bg-white text-pink-500 shadow-sm' : 'text-[#A89F94]'}`}>
                        <RiHistoryLine /> 成約履歴
                    </button>
                </div>

                {activeTab === 'create' ? (
                    <div className="space-y-6 animate-in fade-in duration-500">
                        {/* 1. カテゴリ選択 */}
                        <section className="space-y-4">
                            <p className="text-[10px] font-black text-[#A89F94] uppercase tracking-widest px-2">紹介対象の選択</p>
                            <div className="grid grid-cols-3 gap-2">
                                <button onClick={() => setTarget('user')} className={`flex flex-col items-center gap-1 py-4 rounded-2xl border-2 transition-all ${target === 'user' ? 'border-pink-500 bg-white text-pink-500 shadow-md' : 'border-[#E8E2D9] bg-white text-[#A89F94]'}`}>
                                    <RiUserFollowLine size={24} /><span className="text-[10px] font-black">ユーザー</span>
                                </button>
                                <button onClick={() => setTarget('partner')} className={`flex flex-col items-center gap-1 py-4 rounded-2xl border-2 transition-all ${target === 'partner' ? 'border-pink-500 bg-white text-pink-500 shadow-md' : 'border-[#E8E2D9] bg-white text-[#A89F94]'}`}>
                                    <RiStore2Line size={24} /><span className="text-[10px] font-black">店舗集客</span>
                                </button>
                                <button onClick={() => setTarget('recruit')} className={`flex flex-col items-center gap-1 py-4 rounded-2xl border-2 transition-all ${target === 'recruit' ? 'border-pink-500 bg-white text-pink-500 shadow-md' : 'border-[#E8E2D9] bg-white text-[#A89F94]'}`}>
                                    <RiUserSearchLine size={24} /><span className="text-[10px] font-black">企業求人</span>
                                </button>
                            </div>
                        </section>

                        {/* 2. プレビューボタン（追加） */}
                        <button
                            onClick={() => window.open(previewUrl, '_blank')}
                            className="w-full py-4 bg-white border border-[#E8E2D9] rounded-2xl text-[11px] font-black text-[#4A4540] flex items-center justify-center gap-2 hover:bg-[#F5F2ED] transition-colors"
                        >
                            <RiExternalLinkLine className="text-pink-500" />
                            {target === 'user' ? 'ユーザー登録ページを表示' : target === 'partner' ? '店舗登録ページを表示' : '求人登録ページを表示'}
                        </button>

                        {/* 3. URL/QRコード */}
                        <section className="bg-white rounded-[3rem] border border-[#E8E2D9] p-8 flex flex-col items-center gap-6 shadow-sm">
                            <div className="p-4 bg-white border-2 border-dashed border-[#F5F2ED] rounded-3xl">
                                <QRCodeCanvas value={generatedUrl} size={160} level="H" />
                            </div>
                            <div className="w-full space-y-4">
                                <div className="w-full bg-[#F5F2ED] border border-[#E8E2D9] rounded-2xl p-4 text-[10px] font-mono font-bold text-[#4A4540] break-all text-center">
                                    {generatedUrl}
                                </div>
                                <button onClick={handleCopy} className={`w-full py-5 rounded-full font-black text-sm flex items-center justify-center gap-3 transition-all active:scale-95 shadow-lg ${isCopied ? 'bg-emerald-500 text-white' : 'bg-pink-500 text-white'}`}>
                                    {isCopied ? <RiCheckLine size={22} /> : <RiFileCopyLine size={22} />}
                                    {isCopied ? 'コピー完了' : '専用紹介URLをコピー'}
                                </button>
                            </div>
                        </section>
                    </div>
                ) : (
                    /* 成約履歴 */
                    <div className="space-y-4 animate-in slide-in-from-bottom-4 duration-500">
                        {referralData.history.length > 0 ? (
                            referralData.history.map((item, i) => (
                                <div key={i} className="bg-white p-6 rounded-[2rem] border border-[#E8E2D9] flex justify-between items-center">
                                    <div>
                                        <p className="text-[10px] font-black text-pink-500 uppercase">{item.type}</p>
                                        <p className="text-sm font-black text-[#4A4540]">{item.date}</p>
                                    </div>
                                    <p className="text-sm font-black text-[#4A4540]">¥{item.amount.toLocaleString()}</p>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-20 bg-white rounded-[3rem] border border-[#E8E2D9]">
                                <RiHistoryLine size={48} className="mx-auto text-[#E8E2D9] mb-4" />
                                <p className="text-xs font-bold text-[#A89F94]">成約データはまだありません</p>
                            </div>
                        )}
                    </div>
                )}
            </main>
        </div>
    );
};

export const getServerSideProps: GetServerSideProps = async (context) => {
    try {
        const cookies = nookies.get(context);
        const session = cookies.session || '';
        if (!session) return { redirect: { destination: '/users/login', permanent: false } };
        const token = await adminAuth.verifySessionCookie(session, true);
        const userDoc = await adminDb.collection('users').doc(token.uid).get();

        const referralSnap = await adminDb.collection('referrals').where('referrerId', '==', token.uid).get();
        let totalEarnings = 0;
        let history: any[] = [];

        referralSnap.forEach(doc => {
            const data = doc.data();
            totalEarnings += data.rewardAmount || 0;
            history.push({
                type: data.targetType === 'partner' ? '店舗登録' : data.targetType === 'recruit' ? '求人応募' : 'ユーザー登録',
                amount: data.rewardAmount || 0,
                date: data.createdAt?.toDate().toLocaleDateString('ja-JP') || '-'
            });
        });

        return {
            props: {
                uid: token.uid,
                userName: userDoc.data()?.displayName || 'ユーザー',
                referralData: {
                    totalEarnings,
                    totalCount: referralSnap.size,
                    history: history.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                }
            }
        };
    } catch (e) {
        return { redirect: { destination: '/users/login', permanent: false } };
    }
};

export default ReferralPage;