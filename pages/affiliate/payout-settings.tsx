import { GetServerSideProps, NextPage } from 'next';
import Head from 'next/head';
import { useRouter } from 'next/router';
import React, { useState } from 'react';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { db } from '@/lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import nookies from 'nookies';
import {
    RiBankCardLine,
    RiArrowLeftSLine,
    RiCheckboxCircleFill,
    RiErrorWarningLine,
    RiArrowRightSLine
} from 'react-icons/ri';

interface Props {
    uid: string;
    initialData?: {
        bankName: string;
        branchName: string;
        accountType: string;
        accountNumber: string;
        accountHolder: string;
    };
}

const PayoutSettings: NextPage<Props> = ({ uid, initialData }) => {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        bankName: initialData?.bankName || '',
        branchName: initialData?.branchName || '',
        accountType: initialData?.accountType || '普通',
        accountNumber: initialData?.accountNumber || '',
        accountHolder: initialData?.accountHolder || '',
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const userRef = doc(db, 'users', uid);
            await updateDoc(userRef, {
                payout_info: formData,
                updatedAt: new Date(),
            });
            alert('口座情報を正常に保存しました。');
            router.push('/affiliate/dashboard');
        } catch (error) {
            console.error(error);
            alert('保存中にエラーが発生しました。');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#F8FAFC] text-[#1E293B] antialiased pb-20">
            <Head>
                <title>口座情報設定 | ADTOWN</title>
            </Head>

            {/* ヘッダー：戻るボタンを大きく */}
            <header className="bg-white border-b border-gray-200 sticky top-0 z-20">
                <div className="max-w-xl mx-auto px-4 h-16 flex items-center justify-between">
                    <button
                        onClick={() => router.back()}
                        className="flex items-center text-gray-600 font-bold hover:text-indigo-600 transition"
                    >
                        <RiArrowLeftSLine size={28} />
                        <span>戻る</span>
                    </button>
                    <h1 className="text-lg font-black tracking-tighter">口座設定</h1>
                    <div className="w-10"></div> {/* 中央揃え用スペーサー */}
                </div>
            </header>

            <main className="max-w-xl mx-auto px-5 pt-8">
                {/* 案内板：コントラスト重視 */}
                <div className="bg-indigo-900 text-white p-6 rounded-3xl shadow-xl mb-8 flex gap-4 items-start">
                    <RiCheckboxCircleFill className="text-indigo-400 shrink-0 mt-1" size={24} />
                    <div>
                        <h2 className="font-bold text-lg leading-tight mb-1">報酬のお支払いについて</h2>
                        <p className="text-sm text-indigo-100 leading-relaxed">
                            毎月末締め、翌月15日にお振り込みします。<br />
                            <span className="text-indigo-300 font-bold underline decoration-2 offset-2">紹介料は一律40%です。</span>
                        </p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-8">
                    <div className="space-y-6">
                        {/* 各入力項目：ラベルを大きく、枠線をはっきり */}
                        <InputGroup label="銀行名" subLabel="BANK NAME">
                            <input
                                required
                                type="text"
                                placeholder="例：楽天銀行"
                                className="input-field"
                                value={formData.bankName}
                                onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                            />
                        </InputGroup>

                        <InputGroup label="支店名" subLabel="BRANCH">
                            <input
                                required
                                type="text"
                                placeholder="例：本店（001）"
                                className="input-field"
                                value={formData.branchName}
                                onChange={(e) => setFormData({ ...formData, branchName: e.target.value })}
                            />
                        </InputGroup>

                        <div className="grid grid-cols-12 gap-4">
                            <div className="col-span-4">
                                <InputGroup label="種別" subLabel="TYPE">
                                    <select
                                        className="input-field appearance-none cursor-pointer text-center"
                                        value={formData.accountType}
                                        onChange={(e) => setFormData({ ...formData, accountType: e.target.value })}
                                    >
                                        <option value="普通">普通</option>
                                        <option value="当座">当座</option>
                                    </select>
                                </InputGroup>
                            </div>
                            <div className="col-span-8">
                                <InputGroup label="口座番号" subLabel="NUMBER">
                                    <input
                                        required
                                        type="text"
                                        inputMode="numeric"
                                        pattern="[0-9]*"
                                        placeholder="7桁の数字"
                                        className="input-field tracking-widest"
                                        value={formData.accountNumber}
                                        onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
                                    />
                                </InputGroup>
                            </div>
                        </div>

                        <InputGroup label="名義（カタカナ）" subLabel="HOLDER NAME">
                            <input
                                required
                                type="text"
                                placeholder="例：ナナス タロウ"
                                className="input-field"
                                value={formData.accountHolder}
                                onChange={(e) => setFormData({ ...formData, accountHolder: e.target.value })}
                            />
                        </InputGroup>
                    </div>

                    <div className="pt-4">
                        <button
                            type="submit"
                            disabled={loading}
                            className={`w-full h-16 rounded-2xl font-black text-lg flex items-center justify-center gap-3 transition-all shadow-lg
                                ${loading ? 'bg-gray-300' : 'bg-indigo-600 text-white hover:bg-indigo-700 active:scale-[0.98]'}`}
                        >
                            {loading ? '保存中...' : (
                                <>
                                    <span>この内容で設定を保存する</span>
                                    <RiArrowRightSLine size={24} />
                                </>
                            )}
                        </button>
                    </div>
                </form>

                <div className="mt-10 flex items-center justify-center gap-2 text-gray-400">
                    <RiErrorWarningLine size={16} />
                    <p className="text-[11px] font-bold tracking-tighter">
                        入力内容に誤りがあると振込ができませんのでご注意ください。
                    </p>
                </div>
            </main>

            <style jsx>{`
                .input-field {
                    width: 100%;
                    background-color: white;
                    border: 2px solid #E2E8F0;
                    border-radius: 16px;
                    padding: 16px;
                    font-size: 16px;
                    font-weight: 700;
                    color: #1E293B;
                    transition: all 0.2s;
                }
                .input-field:focus {
                    border-color: #4F46E5;
                    box-shadow: 0 0 0 4px rgba(79, 70, 229, 0.1);
                    outline: none;
                }
                .input-field::placeholder {
                    color: #CBD5E1;
                    font-weight: 500;
                }
            `}</style>
        </div>
    );
};

// コンポーネント内パーツ：ラベルの視認性を統一
const InputGroup = ({ label, subLabel, children }: any) => (
    <div className="flex flex-col gap-1.5">
        <div className="flex items-baseline gap-2 ml-1">
            <label className="text-base font-black text-gray-800 tracking-tighter">{label}</label>
            <span className="text-[10px] font-black text-indigo-400 tracking-widest">{subLabel}</span>
        </div>
        {children}
    </div>
);

export const getServerSideProps: GetServerSideProps = async (ctx) => {
    const cookies = nookies.get(ctx);
    try {
        const token = await adminAuth.verifySessionCookie(cookies.session || '', true);
        const userDoc = await adminDb.collection('users').doc(token.uid).get();
        const userData = userDoc.data();

        return {
            props: {
                uid: token.uid,
                initialData: userData?.payout_info || null,
            },
        };
    } catch {
        return { redirect: { destination: '/partner/login', permanent: false } };
    }
};

export default PayoutSettings;