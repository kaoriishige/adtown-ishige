"use client";

import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/navigation';
import { auth, db } from '@/lib/firebase';
import {
    signInWithEmailAndPassword,
    signInWithPopup,
    GoogleAuthProvider,
    signOut,
    setPersistence,
    browserLocalPersistence
} from 'firebase/auth';
import { collection, query, where, getDocs } from 'firebase/firestore';
import {
    RiLoginCircleLine,
    RiGiftFill,
    RiEyeLine,
    RiEyeOffLine,
    RiErrorWarningLine,
    RiGoogleFill
} from 'react-icons/ri';

export default function SpecialLoginPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [loginData, setLoginData] = useState({
        email: '',
        password: '',
    });

    // 初期化：既存セッションのクリア
    useEffect(() => {
        const init = async () => {
            await signOut(auth);
            try {
                await setPersistence(auth, browserLocalPersistence);
            } catch (e) {
                console.error("Persistence error", e);
            }
        };
        init();
    }, []);

    // 特別パートナーとしての権限チェック共通処理
    const checkPartnerAccess = async (email: string) => {
        const q = query(
            collection(db, "special_partners"),
            where("email", "==", email.trim())
        );
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            throw new Error("not-a-partner");
        }

        const partnerDoc = querySnapshot.docs[0];
        localStorage.setItem('is_special_partner', 'true');
        localStorage.setItem('partner_doc_id', partnerDoc.id);

        // リダイレクト先を /affiliate/dashboard に変更
        window.location.href = '/affiliate/dashboard';
    };

    // Googleログイン処理
    const handleGoogleLogin = async () => {
        setLoading(true);
        setError(null);
        const provider = new GoogleAuthProvider();

        try {
            const result = await signInWithPopup(auth, provider);
            if (result.user.email) {
                await checkPartnerAccess(result.user.email);
            }
        } catch (err: any) {
            console.error("Google Login Error:", err);
            if (err.message === "not-a-partner") {
                setError("Google認証されましたが、特別パートナーとして登録されていません。");
            } else {
                setError("Googleログインに失敗しました。");
            }
            await signOut(auth);
        } finally {
            setLoading(false);
        }
    };

    // 通常のメール・パスワードログイン処理
    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            await signInWithEmailAndPassword(
                auth,
                loginData.email.trim(),
                loginData.password
            );
            await checkPartnerAccess(loginData.email);
        } catch (err: any) {
            console.error("Login Error:", err);
            if (err.message === "not-a-partner") {
                setError("認証されましたが、特別パートナーとして登録されていません。");
                await signOut(auth);
            } else {
                switch (err.code) {
                    case 'auth/invalid-credential':
                        setError("メールアドレスまたはパスワードが正しくありません。");
                        break;
                    case 'auth/too-many-requests':
                        setError("短時間に何度も失敗したためブロックされました。");
                        break;
                    default:
                        setError("ログインに失敗しました。登録状況を確認してください。");
                }
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#FDFCFD] flex flex-col justify-center py-12 px-6 font-sans">
            <Head><title>特別パートナーログイン</title></Head>

            <div className="max-w-md w-full mx-auto space-y-8">
                <div className="text-center">
                    <RiGiftFill size={48} className="mx-auto text-pink-500 mb-4" />
                    <h1 className="text-2xl font-black italic text-[#4A3B3B]">特別パートナーログイン</h1>
                    <p className="text-[10px] text-[#A89F94] mt-2 font-bold tracking-widest uppercase italic">Affiliate Access</p>
                </div>

                {error && (
                    <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-start gap-3 text-xs font-bold text-red-600 animate-in fade-in duration-300">
                        <RiErrorWarningLine size={20} className="shrink-0" />
                        <span>{error}</span>
                    </div>
                )}

                <div className="bg-white border border-[#E8E2D9] rounded-[2.5rem] p-8 shadow-sm space-y-6">

                    {/* Google Login Button */}
                    <button
                        type="button"
                        onClick={handleGoogleLogin}
                        disabled={loading}
                        className="w-full py-4 bg-white border border-[#E8E2D9] text-[#4A3B3B] rounded-2xl font-black text-sm flex items-center justify-center gap-3 hover:bg-gray-50 transition-all active:scale-[0.98] disabled:opacity-50"
                    >
                        <RiGoogleFill size={20} className="text-[#4285F4]" />
                        Googleアカウントでログイン
                    </button>

                    <div className="relative flex items-center">
                        <div className="flex-grow border-t border-[#F3F0EC]"></div>
                        <span className="px-4 text-[10px] font-black text-[#D1C9BF] uppercase italic">or</span>
                        <div className="flex-grow border-t border-[#F3F0EC]"></div>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-[#A89F94] px-2 tracking-widest uppercase italic">メールアドレス</label>
                            <input
                                required
                                type="email"
                                className="w-full p-4 bg-[#F9F7F5] border border-[#E8E2D9] rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-pink-200 transition-all"
                                placeholder="example@nasu.com"
                                value={loginData.email}
                                onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-[#A89F94] px-2 tracking-widest uppercase italic">パスワード</label>
                            <div className="relative">
                                <input
                                    required
                                    type={showPassword ? "text" : "password"}
                                    className="w-full p-4 bg-[#F9F7F5] border border-[#E8E2D9] rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-pink-200 transition-all"
                                    placeholder="••••••••"
                                    value={loginData.password}
                                    onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                                />
                                <button
                                    type="button"
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[#D1C9BF]"
                                    onClick={() => setShowPassword(!showPassword)}
                                >
                                    {showPassword ? <RiEyeOffLine size={20} /> : <RiEyeLine size={20} />}
                                </button>
                            </div>
                        </div>

                        <button
                            disabled={loading}
                            type="submit"
                            className="w-full py-5 bg-[#4A3B3B] text-white rounded-full font-black text-lg shadow-xl hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {loading ? '認証中...' : (
                                <>
                                    <RiLoginCircleLine size={24} />
                                    ログインしてダッシュボードへ
                                </>
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}