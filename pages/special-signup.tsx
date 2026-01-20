"use client";

import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/navigation';
import { db } from '@/lib/firebase';
import { collection, addDoc, updateDoc, doc, getDoc, serverTimestamp } from 'firebase/firestore';
import {
    RiUserAddLine,
    RiBankCardFill,
    RiGiftFill,
    RiFileTextLine,
    RiDownloadLine,
    RiErrorWarningLine,
    RiCheckboxCircleLine,
    RiLoader4Line
} from 'react-icons/ri';

const SpecialSignupPage = () => {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [agreed, setAgreed] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [docId, setDocId] = useState<string | null>(null);

    const [profileData, setProfileData] = useState({
        realName: '',
        email: '',
        password: '',
        address: '',
        phoneNumber: '',
        bankName: '',
        branchName: '',
        branchCode: '',
        accountType: '普通',
        accountNumber: '',
        accountHolder: '',
    });

    // 登録済みIDの確認
    useEffect(() => {
        const savedId = localStorage.getItem('partner_doc_id');
        if (savedId) {
            setDocId(savedId);
            const fetchData = async () => {
                try {
                    const docRef = doc(db, "special_partners", savedId);
                    const docSnap = await getDoc(docRef);
                    if (docSnap.exists()) {
                        setProfileData(docSnap.data() as any);
                    }
                } catch (err) {
                    console.error("データの読み込みに失敗しました");
                }
            };
            fetchData();
        }
    }, []);

    // 保存・登録処理
    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!agreed) {
            alert('アフィリエイト契約書の内容を確認し、同意してください。');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            if (docId) {
                // --- 【更新パターン】 ---
                const docRef = doc(db, "special_partners", docId);
                await updateDoc(docRef, {
                    ...profileData,
                    updatedAt: serverTimestamp(),
                });
                alert('登録情報を更新しました。');
                // 更新の場合はダッシュボードへ戻す
                router.push('/admin/affiliate-dashboard');
            } else {
                // --- 【新規登録パターン】 ---
                const res = await addDoc(collection(db, "special_partners"), {
                    ...profileData,
                    status: 'pending',
                    role: 'special_partner',
                    agreedAt: serverTimestamp(),
                    createdAt: serverTimestamp(),
                });

                localStorage.setItem('partner_doc_id', res.id);
                alert('パートナー登録が完了しました。ログインしてください。');

                // 新規登録後はログイン画面へ飛ばす
                router.push('/admin/special-login');
            }
        } catch (err: any) {
            setError("データの保存に失敗しました。接続を確認してください。");
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#FDFCFD] pb-20 font-sans text-[#4A3B3B]">
            <Head><title>{docId ? '登録情報の編集' : '特別パートナー新規登録'}</title></Head>

            <header className="bg-white border-b border-[#E8E2D9] px-6 py-8 text-center">
                <RiGiftFill size={40} className="mx-auto text-pink-500 mb-2" />
                <h1 className="text-xl font-black italic">
                    {docId ? '特別パートナー情報編集' : '特別パートナー新規登録'}
                </h1>
                {docId && (
                    <p className="text-[10px] text-green-600 font-bold mt-2 flex items-center justify-center gap-1">
                        <RiCheckboxCircleLine /> すでに登録されている情報を編集しています
                    </p>
                )}
            </header>

            <main className="max-w-xl mx-auto px-6 pt-10">
                {error && (
                    <div className="mb-8 p-4 bg-red-50 text-red-600 rounded-2xl flex items-center gap-3 text-sm font-bold border border-red-100">
                        <RiErrorWarningLine size={20} />
                        {error}
                    </div>
                )}

                <form onSubmit={handleSignup} className="space-y-10">
                    {/* 1. アカウント情報 */}
                    <section className="space-y-6">
                        <div className="flex items-center gap-2">
                            <RiUserAddLine className="text-pink-500" />
                            <h3 className="text-sm font-black italic">1. アカウント情報の入力</h3>
                        </div>
                        <div className="grid grid-cols-1 gap-5">
                            <FormInput label="お名前 (本名)" value={profileData.realName} onChange={(val: string) => setProfileData({ ...profileData, realName: val })} placeholder="例: 那須 花子" />
                            <FormInput label="メールアドレス" type="email" value={profileData.email} onChange={(val: string) => setProfileData({ ...profileData, email: val })} placeholder="nasu@example.com" />
                            <FormInput label="パスワード" type="password" value={profileData.password} onChange={(val: string) => setProfileData({ ...profileData, password: val })} placeholder="8文字以上" />
                            <FormInput label="ご住所" value={profileData.address} onChange={(val: string) => setProfileData({ ...profileData, address: val })} placeholder="例: 栃木県那須塩原市..." />
                            <FormInput label="電話番号" value={profileData.phoneNumber} onChange={(val: string) => setProfileData({ ...profileData, phoneNumber: val })} placeholder="090-0000-0000" />
                        </div>
                    </section>

                    {/* 2. 振込先 */}
                    <section className="space-y-6 pt-4 border-t border-[#F3F0EC]">
                        <div className="flex items-center gap-2">
                            <RiBankCardFill className="text-pink-500" />
                            <h3 className="text-sm font-black italic">2. 報酬振込先の入力</h3>
                        </div>
                        <div className="grid grid-cols-1 gap-5">
                            <FormInput label="銀行名" value={profileData.bankName} onChange={(val: string) => setProfileData({ ...profileData, bankName: val })} placeholder="例: 那須銀行" />
                            <div className="grid grid-cols-2 gap-4">
                                <FormInput label="支店名" value={profileData.branchName} onChange={(val: string) => setProfileData({ ...profileData, branchName: val })} placeholder="黒磯支店" />
                                <FormInput label="支店コード" value={profileData.branchCode} onChange={(val: string) => setProfileData({ ...profileData, branchCode: val })} placeholder="123" />
                            </div>
                            <div className="grid grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-[#A89F94] px-2 uppercase tracking-widest">種別</label>
                                    <select className="w-full p-4 bg-white border border-[#E8E2D9] rounded-2xl text-sm font-bold outline-none" value={profileData.accountType} onChange={e => setProfileData({ ...profileData, accountType: e.target.value })}>
                                        <option>普通</option><option>当座</option>
                                    </select>
                                </div>
                                <div className="col-span-2">
                                    <FormInput label="口座番号" value={profileData.accountNumber} onChange={(val: string) => setProfileData({ ...profileData, accountNumber: val })} placeholder="0123456" />
                                </div>
                            </div>
                            <FormInput label="口座名義 (カタカナ)" value={profileData.accountHolder} onChange={(val: string) => setProfileData({ ...profileData, accountHolder: val })} placeholder="ナスタロウ" />
                        </div>
                    </section>

                    {/* 3. 契約書確認 */}
                    <section className="space-y-6 pt-4 border-t border-[#F3F0EC]">
                        <div className="flex items-center gap-2">
                            <RiFileTextLine className="text-pink-500" />
                            <h3 className="text-sm font-black italic text-[#4A3B3B]">3. アフィリエイト契約書の確認</h3>
                        </div>

                        <a
                            href="/affiliate-contract.pdf"
                            download="みんなの那須アプリ_アフィリエイト契約書.pdf"
                            className="flex items-center justify-center gap-3 w-full py-4 bg-pink-500 text-white rounded-2xl font-black text-sm shadow-lg hover:bg-pink-600 transition-all active:scale-[0.98]"
                        >
                            <RiDownloadLine size={20} /> 契約書(PDF)をダウンロード
                        </a>

                        <div className="w-full h-64 overflow-y-scroll bg-white border border-[#E8E2D9] rounded-[2rem] p-6 text-[11px] leading-[1.8] text-[#6B5D5D] shadow-inner custom-scrollbar">
                            {/* 契約書本文（内容は既存のものを維持） */}
                            <p className="font-bold text-center mb-4">みんなの那須アプリ アフィリエイト契約書</p>
                            <p>第1条〜第15条 略...</p>
                        </div>

                        <label className="flex items-start gap-4 p-6 bg-pink-50/50 rounded-[2rem] border-2 border-pink-100 cursor-pointer group hover:bg-pink-50 transition-all shadow-sm">
                            <input type="checkbox" className="mt-1 h-5 w-5 rounded-full border-pink-300 text-pink-500 cursor-pointer" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} />
                            <span className="text-[11px] font-black leading-relaxed text-[#4A3B3B]">
                                上記のアフィリエイト契約書全文を確認し、内容を理解した上で契約を締結します。
                            </span>
                        </label>
                    </section>

                    <button
                        type="submit"
                        disabled={loading || !agreed}
                        className="w-full py-5 bg-[#4A3B3B] text-white rounded-full font-black text-lg shadow-xl active:scale-[0.98] transition-all disabled:opacity-50 disabled:bg-[#D1C9BF] flex justify-center items-center gap-2"
                    >
                        {loading ? <RiLoader4Line className="animate-spin" size={24} /> : (docId ? '登録情報を更新する' : '同意してパートナー登録する')}
                    </button>
                </form>
            </main>

            <style jsx>{`
                .custom-scrollbar::-webkit-scrollbar { width: 6px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #E8E2D9; border-radius: 10px; }
            `}</style>
        </div>
    );
};

const FormInput = ({ label, value, onChange, placeholder, type = "text" }: any) => (
    <div className="space-y-2">
        <label className="text-[10px] font-black text-[#A89F94] px-2 uppercase tracking-widest">{label}</label>
        <input
            required
            type={type}
            className="w-full p-4 bg-white border border-[#E8E2D9] rounded-2xl text-sm font-bold placeholder-[#D1C9BF] outline-none focus:ring-2 focus:ring-pink-200 transition-all shadow-sm"
            value={value}
            onChange={e => onChange(e.target.value)}
            placeholder={placeholder}
        />
    </div>
);

export default SpecialSignupPage;