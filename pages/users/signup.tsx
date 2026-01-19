"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { RiMailLine, RiLockPasswordLine, RiStore2Line, RiUserLine, RiMapPinLine, RiErrorWarningLine } from 'react-icons/ri';

export default function SignupPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        storeName: '',
        contactPerson: '',
        address: '',
        email: '',
        password: '',
    });

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            // --- 1. 二重アドレスチェック (重複確認) ---
            const usersRef = collection(db, "partners"); // または "users"
            const q = query(usersRef, where("email", "==", formData.email));
            const querySnapshot = await getDocs(q);

            if (!querySnapshot.empty) {
                throw new Error("このメールアドレスは既に登録されています。");
            }

            // --- 2. 新規登録処理 ---
            await addDoc(collection(db, "partners"), {
                ...formData,
                role: 'partner',
                status: 'pending',
                createdAt: serverTimestamp(),
            });

            alert("登録が完了しました。");
            router.push('/login'); // ログイン画面へ

        } catch (err: any) {
            console.error("Signup Error:", err);
            setError(err.message || "登録中にエラーが発生しました。");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 relative overflow-hidden font-sans">
            {/* 背景装飾 */}
            <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-orange-600/10 rounded-full blur-[120px]" />

            <div className="max-w-md w-full relative z-10">
                <div className="text-center mb-10">
                    <h1 className="text-4xl font-black italic text-white tracking-tighter">
                        JOIN <span className="text-orange-600">NASU</span> PARTNER
                    </h1>
                    <p className="text-slate-500 text-xs font-bold mt-2 tracking-widest uppercase">新規パートナーアカウント作成</p>
                </div>

                <div className="bg-white/5 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white/10 shadow-2xl">
                    {error && (
                        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/50 rounded-xl flex items-center gap-3 text-red-500 text-sm font-bold">
                            <RiErrorWarningLine size={20} />
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSignup} className="space-y-5">
                        {/* 店舗名 */}
                        <div className="relative">
                            <RiStore2Line className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                            <input
                                type="text"
                                placeholder="店舗名・企業名"
                                required
                                className="w-full bg-slate-900/50 border border-slate-800 rounded-xl py-4 pl-12 pr-4 text-white font-bold outline-none focus:border-orange-600 transition-all"
                                onChange={(e) => setFormData({ ...formData, storeName: e.target.value })}
                            />
                        </div>

                        {/* 所在地 */}
                        <div className="relative">
                            <RiMapPinLine className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                            <input
                                type="text"
                                placeholder="那須エリアの所在地"
                                required
                                className="w-full bg-slate-900/50 border border-slate-800 rounded-xl py-4 pl-12 pr-4 text-white font-bold outline-none focus:border-orange-600 transition-all"
                                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                            />
                        </div>

                        {/* メールアドレス（重複チェック対象） */}
                        <div className="relative">
                            <RiMailLine className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                            <input
                                type="email"
                                placeholder="メールアドレス"
                                required
                                className={`w-full bg-slate-900/50 border border-slate-800 rounded-xl py-4 pl-12 pr-4 text-white font-bold outline-none focus:border-orange-600 transition-all ${error?.includes('アドレス') ? 'border-red-500 shadow-[0_0_10px_rgba(239,68,68,0.2)]' : ''}`}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            />
                        </div>

                        {/* パスワード */}
                        <div className="relative">
                            <RiLockPasswordLine className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                            <input
                                type="password"
                                placeholder="パスワード（8文字以上）"
                                required
                                minLength={8}
                                className="w-full bg-slate-900/50 border border-slate-800 rounded-xl py-4 pl-12 pr-4 text-white font-bold outline-none focus:border-orange-600 transition-all"
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-5 bg-orange-600 hover:bg-orange-500 text-white font-black rounded-xl shadow-xl transition-all active:scale-95 disabled:opacity-50 italic text-lg"
                        >
                            {loading ? 'CHECKING...' : 'CREATE ACCOUNT'}
                        </button>
                    </form>

                    <div className="mt-8 text-center border-t border-white/5 pt-6">
                        <Link href="/login" className="text-slate-500 hover:text-white text-sm font-bold transition-colors">
                            既にアカウントをお持ちの方はこちら
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}