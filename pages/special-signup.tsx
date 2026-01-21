"use client";

import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
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

                        <div className="w-full h-[400px] overflow-y-scroll bg-white border border-[#E8E2D9] rounded-[2rem] p-8 text-[11px] leading-[1.8] text-[#6B5D5D] shadow-inner custom-scrollbar">
                            <p className="font-bold text-center mb-6 text-xs text-[#4A3B3B]">みんなの那須アプリ アフィリエイト契約書</p>
                            <div className="space-y-6">
                                <p>本契約は、みんなの那須アプリ運営（以下「運営者」）と、株式会社adtown（以下「支払会社」）と、アフィリエイト契約を締結したパートナー（以下「アフィリエイター」）との間で締結される。</p>

                                <div className="space-y-2">
                                    <p className="font-bold text-[#4A3B3B]">第1条（目的）</p>
                                    <p>本契約は、アフィリエイターが「みんなの那須アプリ」の一般ユーザー登録、店舗集客広告掲載、企業求人広告掲載の利用促進を行い、運営者および支払会社が定める条件に基づき紹介手数料を支払うことを目的とする。</p>
                                </div>

                                <div className="space-y-2">
                                    <p className="font-bold text-[#4A3B3B]">第2条（対象サービス）</p>
                                    <p>アフィリエイト対象となるサービスは以下のとおりとする。<br />
                                        ・みんなの那須アプリ 一般ユーザー<br />
                                        ・みんなの那須アプリ 店舗集客広告掲載<br />
                                        ・みんなの那須アプリ 企業求人広告掲載<br />
                                        ※上記はいずれも基本無料で利用可能なサービスであり、有料課金が発生した場合のみ紹介手数料の対象となる。</p>
                                </div>

                                <div className="space-y-2">
                                    <p className="font-bold text-[#4A3B3B]">第3条（紹介手数料）</p>
                                    <p>アフィリエイターが紹介したユーザーまたは事業者が有料課金に移行し、決済が完了した時点で成果確定とし、以下の金額を毎月自動振込にて支払う。<br />
                                        ・一般ユーザー 有料課金（サブスク月額480円）：1名につき192円（40%）<br />
                                        ・店舗集客広告掲載 有料課金（サブスク月額4,400円）：1社につき1,760円（40%）<br />
                                        ・企業求人広告掲載 有料課金（サブスク月額8,800円）：1社につき3,520円（40%）<br />
                                        ※紹介手数料は、株式会社adtownと正式にアフィリエイト契約を締結した場合にのみ発生する。<br />
                                        ※成果は決済完了をもって確定とし、無料登録のみでは成果対象とならない。</p>
                                </div>

                                <div className="space-y-2">
                                    <p className="font-bold text-[#4A3B3B]">第4条（支払条件）</p>
                                    <p>1. 紹介手数料は月末締め、翌月15日にアフィリエイターが登録した銀行口座へ自動振り込みにて支払う。<br />
                                        2. 振込手数料は支払会社負担とする。<br />
                                        3. 源泉徴収は行わないものとする。<br />
                                        4. 本契約は個人アフィリエイターを対象とする。法人が発生した場合は、別途法人向け契約書を締結するものとする。<br />
                                        5. 最低支払金額の設定、支払保留条件がある場合は別途定める。</p>
                                </div>

                                <div className="space-y-2">
                                    <p className="font-bold text-[#4A3B3B]">第5条（紹介方法）</p>
                                    <p>アフィリエイターは、本人専用の以下の紹介ツールを使用して拡散活動を行うものとする。<br />
                                        ・みんなの那須アプリ一般ユーザー登録用URL・QRコード<br />
                                        ・店舗集客広告掲載登録用URL・QRコード<br />
                                        ・企業求人広告掲載登録用URL・QRコード<br />
                                        これらはアフィリエイター専用マイページより取得可能とする。</p>
                                </div>

                                <div className="space-y-2">
                                    <p className="font-bold text-[#4A3B3B]">第6条（成果確定および返金・解約時の取扱い）</p>
                                    <p>1. 有料課金の決済完了をもって成果確定とする。<br />
                                        2. 初月無料期間中の解約、未入金、返金が発生した場合は成果対象外とする。<br />
                                        3. 成果確定後であっても、返金処理が行われた場合は当該成果に係る紹介手数料は無効とし、既に支払済みの場合は次回支払時に相殺するものとする。</p>
                                </div>

                                <div className="space-y-2">
                                    <p className="font-bold text-[#4A3B3B]">第7条（禁止事項）</p>
                                    <p>アフィリエイターは以下の行為を行ってはならない。<br />
                                        ・虚偽・誇大な表現による勧誘<br />
                                        ・公序良俗に反する内容での宣伝<br />
                                        ・なりすまし行為<br />
                                        ・不正登録・自作自演による登録<br />
                                        ・運営者・支払会社の信用を毀損する行為</p>
                                </div>

                                <div className="space-y-2">
                                    <p className="font-bold text-[#4A3B3B]">第8条（知的財産権および素材使用）</p>
                                    <p>1. アフィリエイターは、運営者が提供するロゴ、画像、名称、素材を、運営者の定めるガイドラインに従って使用するものとする。<br />
                                        2. 無断改変、誤解を招く表現での使用を禁止する。</p>
                                </div>

                                <div className="space-y-2">
                                    <p className="font-bold text-[#4A3B3B]">第9条（反社会的勢力の排除）</p>
                                    <p>アフィリエイターは、自己および関係者が反社会的勢力に該当しないこと、また今後も関与しないことを保証する。</p>
                                </div>

                                <div className="space-y-2">
                                    <p className="font-bold text-[#4A3B3B]">第10条（個人情報の取扱い）</p>
                                    <p>アフィリエイターは、紹介活動に関連して知り得た個人情報を、本契約の目的以外に使用してはならない。</p>
                                </div>

                                <div className="space-y-2">
                                    <p className="font-bold text-[#4A3B3B]">第11条（契約期間）</p>
                                    <p>本契約の有効期間は契約締結日より1年間とし、双方異議なき場合は自動更新とする。</p>
                                </div>

                                <div className="space-y-2">
                                    <p className="font-bold text-[#4A3B3B]">第12条（契約解除）</p>
                                    <p>運営者または支払会社は、アフィリエイターが本契約に違反した場合、事前通知なく契約を解除できるものとする。</p>
                                </div>

                                <div className="space-y-2">
                                    <p className="font-bold text-[#4A3B3B]">第13条（免責事項）</p>
                                    <p>システム障害、通信障害、不可抗力による損害について、運営者および支払会社は一切の責任を負わないものとする。</p>
                                </div>

                                <div className="space-y-2">
                                    <p className="font-bold text-[#4A3B3B]">第14条（準拠法および管轄）</p>
                                    <p>本契約は日本法に準拠し、本契約に関する紛争については栃木県を管轄する地方裁判所を第一審の専属的合意管轄裁判所とする。</p>
                                </div>

                                <div className="space-y-2">
                                    <p className="font-bold text-[#4A3B3B]">第15条（協議事項）</p>
                                    <p>本契約に定めのない事項、または本契約の解釈に疑義が生じた場合は、運営者、支払会社、アフィリエイター間で誠意をもって協議し解決するものとする。</p>
                                </div>

                                <div className="mt-8 pt-6 border-t border-gray-100">
                                    <p>以上、本契約の内容を確認し、同意の上で契約を締結する。</p>
                                    <p>契約日：登録日</p>
                                    <p className="mt-4 font-bold text-xs text-[#4A3B3B]">株式会社adtown</p>
                                </div>
                            </div>
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