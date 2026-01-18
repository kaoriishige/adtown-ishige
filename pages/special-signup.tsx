import React, { useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import {
    RiUserAddLine,
    RiBankCardFill,
    RiGiftFill,
    RiFileTextLine,
    RiDownloadLine
} from 'react-icons/ri';

const SpecialSignupPage = () => {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [agreed, setAgreed] = useState(false);
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

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!agreed) {
            alert('アフィリエイト契約書の内容を確認し、同意してください。');
            return;
        }
        setLoading(true);
        // ここに登録APIなどの処理を記述
        console.log("Submit Data:", profileData);
        setLoading(false);
    };

    return (
        <div className="min-h-screen bg-[#FDFCFD] pb-20 font-sans text-[#4A3B3B]">
            <Head><title>特別パートナー新規登録</title></Head>

            <header className="bg-white border-b border-[#E8E2D9] px-6 py-8 text-center">
                <RiGiftFill size={40} className="mx-auto text-pink-500 mb-2" />
                <h1 className="text-xl font-black italic">特別パートナー新規登録</h1>
            </header>

            <main className="max-w-xl mx-auto px-6 pt-10">
                <form onSubmit={handleSignup} className="space-y-10">

                    {/* 1. アカウント情報の入力 */}
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

                    {/* 2. 報酬振込先の入力 */}
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

                    {/* 3. アフィリエイト契約書の確認 */}
                    <section className="space-y-6 pt-4 border-t border-[#F3F0EC]">
                        <div className="flex items-center gap-2">
                            <RiFileTextLine className="text-pink-500" />
                            <h3 className="text-sm font-black italic text-[#4A3B3B]">3. アフィリエイト契約書の確認</h3>
                        </div>

                        <a
                            href="/みんなの那須アプリ アフィリエイト契約書 (1).pdf"
                            download
                            className="flex items-center justify-center gap-3 w-full py-4 bg-pink-500 text-white rounded-2xl font-black text-sm shadow-lg hover:bg-pink-600 transition-all active:scale-[0.98]"
                        >
                            <RiDownloadLine size={20} /> 契約書(PDF)をダウンロード
                        </a>

                        <div className="w-full h-96 overflow-y-scroll bg-white border border-[#E8E2D9] rounded-[2rem] p-8 text-[11px] leading-[1.8] text-[#6B5D5D] shadow-inner custom-scrollbar">
                            <div className="space-y-6">
                                <div className="text-center mb-8">
                                    <h2 className="text-sm font-black text-[#4A3B3B]">
                                        みんなの那須アプリ アフィリエイト契約書
                                    </h2>
                                </div>

                                <p>本契約は、みんなの那須アプリ運営(以下「運営者」)と、株式会社adtown(以下「支払会社」)と、アフィリエイト契約を締結したパートナー(以下「アフィリエイター」)との間で締結される。</p>

                                <div>
                                    <h4 className="font-black text-[#4A3B3B] mb-1">第1条(目的)</h4>
                                    <p>本契約は、アフィリエイターが「みんなの那須アプリ」の一般ユーザー登録、店舗集客広告掲載、企業求人広告掲載の利用促進を行い、運営者および支払会社が定める条件に基づき紹介手数料を支払うことを目的とする。</p>
                                </div>

                                <div>
                                    <h4 className="font-black text-[#4A3B3B] mb-1">第2条(対象サービス)</h4>
                                    <p>アフィリエイト対象となるサービスは以下のとおりとする。</p>
                                    <p className="pl-4">1. みんなの那須アプリ一般ユーザー<br />2. みんなの那須アプリ 店舗集客広告掲載<br />3. みんなの那須アプリ 企業求人広告掲載</p>
                                    <p>※上記はいずれも基本無料で利用可能なサービスであり、有料課金が発生した場合のみ紹介手数料の対象となる。</p>
                                </div>

                                <div>
                                    <h4 className="font-black text-[#4A3B3B] mb-1">第3条(紹介手数料)</h4>
                                    <p>アフィリエイターが紹介したユーザーまたは事業者が有料課金に移行し、決済が完了した時点で成果確定とし、以下の金額を毎月自動振込にて支払う。</p>
                                    <p className="pl-4">1. 一般ユーザー 有料課金 (サブスク月額480円): 1名につき192円(40%)<br />2. 店舗集客広告掲載 有料課金(サブスク月額4,400円):1社につき1,760円(40%)<br />3. 企業求人広告掲載 有料課金(サブスク月額8,800円): 1社につき3,520円(40%)</p>
                                    <p>※紹介手数料は、株式会社adtownと正式にアフィリエイト契約を締結した場合にのみ発生する。</p>
                                    <p>※成果は決済完了をもって確定とし、無料登録のみでは成果対象とならない。</p>
                                </div>

                                <div>
                                    <h4 className="font-black text-[#4A3B3B] mb-1">第4条(支払条件)</h4>
                                    <p>1. 紹介手数料は月末締め、翌月15日にアフィリエイターが登録した銀行口座へ自動振り込みにて支払う。</p>
                                    <p>2. 振込手数料は支払会社負担とする。</p>
                                    <p>3. 源泉徴収は行わないものとする。</p>
                                    <p>4. 本契約は個人アフィリエイターを対象とする。法人が発生した場合は、別途法人向け契約書を締結するものとする。</p>
                                    <p>5. 最低支払金額の設定、支払保留条件がある場合は別途定める。</p>
                                </div>

                                <div>
                                    <h4 className="font-black text-[#4A3B3B] mb-1">第5条(紹介方法)</h4>
                                    <p>アフィリエイターは、本人専用の以下の紹介ツールを使用して拡散活動を行うものとする。</p>
                                    <p className="pl-4">1. みんなの那須アプリー般ユーザー登録用URL・QRコード<br />2. 店舗集客広告掲載登録用URL・QRコード<br />3. 企業求人広告掲載登録用URL・QRコード</p>
                                    <p>これらはアフィリエイター専用マイページより取得可能とする。</p>
                                </div>

                                <div>
                                    <h4 className="font-black text-[#4A3B3B] mb-1">第6条(成果確定および返金・解約時の取扱い)</h4>
                                    <p>1. 有料課金の決済完了をもって成果確定とする。</p>
                                    <p>2. 初月無料期間中の解約、未入金、返金が発生した場合は成果対象外とする。</p>
                                    <p>3. 成果確定後であっても、返金処理が行われた場合は当該成果に係る紹介手数料は無効とし、既に支払済みの場合は次回支払時に相殺するものとする。</p>
                                </div>

                                <div>
                                    <h4 className="font-black text-[#4A3B3B] mb-1">第7条(禁止事項)</h4>
                                    <p>アフィリエイターは以下の行為を行ってはならない。</p>
                                    <p className="pl-4">1. 虚偽・誇大な表現による勧誘<br />2. 公序良俗に反する内容での宣伝<br />3. なりすまし行為<br />4. 不正登録・自作自演による登録<br />5. 運営者・支払会社の信用を毀損する行為</p>
                                </div>

                                <div>
                                    <h4 className="font-black text-[#4A3B3B] mb-1">第8条(知的財産権および素材使用)</h4>
                                    <p>1. アフィリエイターは、運営者が提供するロゴ、画像、名称、素材を、運営者の定めるガイドラインに従って使用するものとする。</p>
                                    <p>2. 無断改変、誤解を招く表現での使用を禁止する。</p>
                                </div>

                                <div>
                                    <h4 className="font-black text-[#4A3B3B] mb-1">第9条(反社会的勢力の排除)</h4>
                                    <p>アフィリエイターは、自己および関係者が反社会的勢力に該当しないこと、また今後も関与しないことを保証する。</p>
                                </div>

                                <div>
                                    <h4 className="font-black text-[#4A3B3B] mb-1">第10条(個人情報の取扱い)</h4>
                                    <p>アフィリエイターは、紹介活動に関連して知り得た個人情報を、本契約の目的以外に使用してはならない。</p>
                                </div>

                                <div>
                                    <h4 className="font-black text-[#4A3B3B] mb-1">第11条(契約期間)</h4>
                                    <p>本契約の有効期間は契約締結日より1年間とし、双方異議なき場合は自動更新とする。</p>
                                </div>

                                <div>
                                    <h4 className="font-black text-[#4A3B3B] mb-1">第12条(契約解除)</h4>
                                    <p>運営者または支払会社は、アフィリエイターが本契約に違反した場合、事前通知なく契約を解除できるものとする。</p>
                                </div>

                                <div>
                                    <h4 className="font-black text-[#4A3B3B] mb-1">第13条(免責事項)</h4>
                                    <p>システム障害、通信障害、不可抗力による損害について、運営者および支払会社は一切の責任を負わないものとする。</p>
                                </div>

                                <div>
                                    <h4 className="font-black text-[#4A3B3B] mb-1">第14条(準拠法および管轄)</h4>
                                    <p>本契約は日本法に準拠し、本契約に関する紛争については栃木県を管轄する地方裁判所を第一審の専属的合意管轄裁判所とする。</p>
                                </div>

                                <div>
                                    <h4 className="font-black text-[#4A3B3B] mb-1">第15条(協議事項)</h4>
                                    <p>本契約に定めのない事項、または本契約の解釈に疑義が生じた場合は、運営者、支払会社、アフィリエイター間で誠意をもって協議し解決するものとする。</p>
                                </div>

                                <div className="mt-10 pt-6 border-t border-dashed border-[#E8E2D9] text-[10px]">
                                    <p>以上、本契約の内容を確認し、同意の上で契約を締結する。</p>
                                    <p className="mt-4 font-bold">契約日：登録日<br />株式会社adtown<br />アフィリエイター</p>
                                </div>
                            </div>
                        </div>

                        {/* 同意チェックボックス */}
                        <label className="flex items-start gap-4 p-6 bg-pink-50/50 rounded-[2rem] border-2 border-pink-100 cursor-pointer group hover:bg-pink-50 transition-all shadow-sm">
                            <input type="checkbox" className="mt-1 h-5 w-5 rounded-full border-pink-300 text-pink-500 focus:ring-pink-200 cursor-pointer" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} />
                            <span className="text-[11px] font-black leading-relaxed text-[#4A3B3B]">
                                上記のアフィリエイト契約書全文を確認し、内容を理解した上で契約を締結します。
                            </span>
                        </label>
                    </section>

                    <button
                        disabled={loading || !agreed}
                        className="w-full py-5 bg-[#4A3B3B] text-white rounded-full font-black text-lg shadow-xl active:scale-[0.98] transition-all disabled:opacity-50 disabled:bg-[#D1C9BF]"
                    >
                        {loading ? '登録中...' : '同意してパートナー登録する'}
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