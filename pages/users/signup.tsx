"use client";

import React, { useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/navigation';
import { db, app } from '@/lib/firebase';
import { getAuth, signInWithPopup, GoogleAuthProvider, createUserWithEmailAndPassword } from 'firebase/auth';
import { collection, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import {
    RiMailLine,
    RiLockPasswordLine,
    RiErrorWarningLine,
    RiGoogleFill,
    RiArrowRightSLine,
    RiUserAddLine // 新規登録用アイコン
} from 'react-icons/ri';

const UserSignupPage = () => {
    const router = useRouter();
    const auth = getAuth(app);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [userData, setUserData] = useState({
        email: '',
        password: '',
    });

    // Firestoreへのユーザーデータ保存処理
    const saveUserToFirestore = async (user: any, providerType: string) => {
        await setDoc(doc(db, "users", user.uid), {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName || '',
            role: 'user',
            provider: providerType,
            createdAt: serverTimestamp(),
        });
    };

    // Googleでの新規登録
    const handleGoogleSignUp = async () => {
        const provider = new GoogleAuthProvider();
        try {
            setError(null);
            setLoading(true);
            const result = await signInWithPopup(auth, provider);
            await saveUserToFirestore(result.user, 'google');

            alert("Googleアカウントで新規登録しました！");
            router.push('/dashboard');
        } catch (err: any) {
            console.error(err);
            setError("Google登録に失敗しました。");
        } finally {
            setLoading(false);
        }
    };

    // メール・パスワードでの新規登録
    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            // 1. Firebase Authでアカウント作成
            const userCredential = await createUserWithEmailAndPassword(
                auth,
                userData.email.trim(),
                userData.password
            );

            // 2. Firestoreにユーザー情報を保存
            await saveUserToFirestore(userCredential.user, 'email');

            alert('会員登録が完了しました！');
            router.push('/dashboard');
        } catch (err: any) {
            console.error(err);
            if (err.code === 'auth/email-already-in-use') {
                setError("このメールアドレスは既に登録されています。");
            } else {
                setError("登録に失敗しました。パスワードは6文字以上で入力してください。");
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#FDFCFD] flex flex-col justify-center py-12 px-6 font-sans text-[#4A3B3B]">
            <Head><title>新規登録 | みんなの那須アプリ</title></Head>

            <div className="max-w-md w-full mx-auto space-y-8">
                <div className="text-center">
                    <div className="w-16 h-16 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <RiUserAddLine size={32} className="text-pink-500" />
                    </div>
                    <h1 className="text-2xl font-black">はじめての方はこちら</h1>
                    <p className="text-xs font-bold text-[#A89F94] mt-2 tracking-widest uppercase italic">Create New Account</p>
                </div>

                {error && (
                    <div className="p-4 bg-red-50 text-red-600 rounded-2xl flex items-center gap-3 text-sm font-bold border border-red-100">
                        <RiErrorWarningLine size={20} className="shrink-0" />
                        <span>{error}</span>
                    </div>
                )}

                <div className="bg-white border border-[#E8E2D9] rounded-[2.5rem] p-8 shadow-sm space-y-6">
                    {/* Google Sign Up */}
                    <button
                        type="button"
                        onClick={handleGoogleSignUp}
                        disabled={loading}
                        className="w-full py-4 bg-white border border-[#E8E2D9] text-[#4A3B3B] rounded-2xl font-black text-sm flex items-center justify-center gap-3 hover:bg-gray-50 transition-all active:scale-[0.98] disabled:opacity-50"
                    >
                        <RiGoogleFill size={20} className="text-[#4285F4]" />
                        Googleで新規登録
                    </button>

                    <div className="relative flex items-center">
                        <div className="flex-grow border-t border-[#F3F0EC]"></div>
                        <span className="px-4 text-[10px] font-black text-[#D1C9BF] uppercase italic">or email</span>
                        <div className="flex-grow border-t border-[#F3F0EC]"></div>
                    </div>

                    <form onSubmit={handleSignup} className="space-y-5">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-[#A89F94] px-2 uppercase tracking-widest italic flex items-center gap-2">
                                <RiMailLine /> メールアドレス
                            </label>
                            <input
                                required
                                type="email"
                                className="w-full p-4 bg-[#F9F7F5] border border-[#E8E2D9] rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-pink-200 transition-all"
                                placeholder="example@nasu.com"
                                value={userData.email}
                                onChange={(e) => setUserData({ ...userData, email: e.target.value })}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-[#A89F94] px-2 uppercase tracking-widest italic flex items-center gap-2">
                                <RiLockPasswordLine /> パスワード
                            </label>
                            <input
                                required
                                type="password"
                                className="w-full p-4 bg-[#F9F7F5] border border-[#E8E2D9] rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-pink-200 transition-all"
                                placeholder="6文字以上（英数字推奨）"
                                value={userData.password}
                                onChange={(e) => setUserData({ ...userData, password: e.target.value })}
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-5 bg-[#4A3B3B] text-white rounded-full font-black text-lg shadow-xl hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {loading ? '登録中...' : '新しくはじめる'}
                            {!loading && <RiArrowRightSLine size={24} />}
                        </button>
                    </form>
                </div>

                <div className="text-center">
                    <button
                        type="button"
                        onClick={() => router.push('/users/login')}
                        className="text-xs font-black text-pink-500 hover:text-pink-600 transition-colors"
                    >
                        すでにアカウントをお持ちの方
                    </button>
                </div>
            </div>
        </div>
    );
};

export default UserSignupPage;