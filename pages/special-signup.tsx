import React, { useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { RiUserAddLine, RiBankCardFill, RiShieldCheckLine, RiGiftFill } from 'react-icons/ri';

const SpecialSignupPage = () => {
    const router = useRouter();
    // URLの ?ref=xxx の部分を取得
    const { ref } = router.query;

    const [loading, setLoading] = useState(false);
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
        setLoading(true);

        try {
            // 注意: このAPIエンドポイントは別途作成、または既存のものに合わせて調整が必要です
            const res = await fetch('/api/auth/special-register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...profileData,
                    referrerId: ref || '', // ここで紹介者IDを紐付け！
                }),
            });

            if (res.ok) {
                alert('パートナー登録が完了しました！');
                // 直接特別紹介ページ（ダッシュボード）へ移動
                router.push('/premium/special-referral');
            } else {
                const error = await res.json();
                alert(`エラー: ${error.message}`);
            }
        } catch (err) {
            alert('通信エラーが発生しました。');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#FDFCFD] pb-20 font-sans text-[#4A3B3B]">
            <Head><title>特別紹介・新規登録フォーム</title></Head>

            <header className="bg-white border-b border-[#E8E2D9] px-6 py-8 text-center">
                <RiGiftFill size={40} className="mx-auto text-pink-500 mb-2" />
                <h1 className="text-xl font-black italic">特別パートナー新規登録</h1>
                <p className="text-[10px] text-[#A89F94] font-bold mt-2 uppercase tracking-[0.2em]">Registration Form</p>
            </header>

            <main className="max-w-xl mx-auto px-6 pt-10">
                {/* 紹介者がいる場合の表示 */}
                {ref && (
                    <div className="bg-pink-50 border border-pink-100 rounded-2xl p-4 mb-8 flex items-center gap-3">
                        <RiShieldCheckLine className="text-pink-500" size={24} />
                        <p className="text-xs font-bold text-pink-700">
                            紹介者ID: <span className="font-black underline">{ref}</span> のご紹介です
                        </p>
                    </div>
                )}

                <form onSubmit={handleSignup} className="space-y-10">
                    <section className="space-y-6">
                        <div className="flex items-center gap-2">
                            <RiUserAddLine className="text-pink-500" />
                            <h3 className="text-sm font-black italic">1. アカウント情報の入力</h3>
                        </div>
                        <div className="grid grid-cols-1 gap-5">
                            <FormInput label="お名前 (本名)" value={profileData.realName} onChange={(val) => setProfileData({ ...profileData, realName: val })} placeholder="例: 那須 花子" />
                            <FormInput label="メールアドレス" type="email" value={profileData.email} onChange={(val) => setProfileData({ ...profileData, email: val })} placeholder="nasu@example.com" />
                            <FormInput label="パスワード" type="password" value={profileData.password} onChange={(val) => setProfileData({ ...profileData, password: val })} placeholder="8文字以上" />
                            <FormInput label="ご住所" value={profileData.address} onChange={(val) => setProfileData({ ...profileData, address: val })} placeholder="例: 栃木県那須塩原市..." />
                            <FormInput label="電話番号" value={profileData.phoneNumber} onChange={(val) => setProfileData({ ...profileData, phoneNumber: val })} placeholder="090-0000-0000" />
                        </div>
                    </section>

                    <section className="space-y-6 pt-4 border-t border-[#F3F0EC]">
                        <div className="flex items-center gap-2">
                            <RiBankCardFill className="text-pink-500" />
                            <h3 className="text-sm font-black italic">2. 報酬振込先の入力</h3>
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
                                    <select className="w-full p-4 bg-white border border-[#E8E2D9] rounded-2xl text-sm font-bold outline-none" value={profileData.accountType} onChange={e => setProfileData({ ...profileData, accountType: e.target.value })}>
                                        <option>普通</option><option>当座</option>
                                    </select>
                                </div>
                                <div className="col-span-2">
                                    <FormInput label="口座番号" value={profileData.accountNumber} onChange={(val) => setProfileData({ ...profileData, accountNumber: val })} placeholder="0123456" />
                                </div>
                            </div>
                            <FormInput label="口座名義 (カタカナ)" value={profileData.accountHolder} onChange={(val) => setProfileData({ ...profileData, accountHolder: val })} placeholder="ナスタロウ" />
                        </div>
                    </section>

                    <button
                        disabled={loading}
                        className="w-full py-5 bg-[#4A3B3B] text-white rounded-full font-black text-lg shadow-xl active:scale-[0.98] transition-all disabled:opacity-50"
                    >
                        {loading ? '登録中...' : '利用規約に同意して登録する'}
                    </button>
                </form>
            </main>
        </div>
    );
};

const FormInput = ({ label, value, onChange, placeholder, type = "text" }: any) => (
    <div className="space-y-2">
        <label className="text-[10px] font-black text-[#A89F94] px-2 uppercase tracking-widest">{label}</label>
        <input
            required
            type={type}
            className="w-full p-4 bg-white border border-[#E8E2D9] rounded-2xl text-sm font-bold placeholder-[#D1C9BF] outline-none focus:ring-2 focus:ring-pink-200 transition-all"
            value={value}
            onChange={e => onChange(e.target.value)}
            placeholder={placeholder}
        />
    </div>
);

export default SpecialSignupPage;