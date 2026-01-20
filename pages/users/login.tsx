import React, { useState, useEffect } from 'react';
import { NextPage } from 'next';
import Head from 'next/head';
import { auth } from '@/lib/firebase';
import {
    signInWithEmailAndPassword,
    signInWithPopup,
    GoogleAuthProvider,
    setPersistence,
    browserLocalPersistence,
    onAuthStateChanged
} from 'firebase/auth';

import { AlertTriangle, Loader2, Eye, EyeOff } from 'lucide-react';

const googleProvider = new GoogleAuthProvider();

const LoginPage: NextPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isLoggingIn, setIsLoggingIn] = useState(true);
    const [showPassword, setShowPassword] = useState(false);

    // --- ログイン成功時の処理（ここで行き先を指定） ---
    const handleLoginSuccess = async (user: any) => {
        try {
            const idToken = await user.getIdToken(true);
            const response = await fetch("/api/auth/sessionLogin", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${idToken}`
                },
                body: JSON.stringify({ loginType: "user" }),
            });

            if (response.ok) {
                const data = await response.json();
                // ✅ セッション作成成功後、必ずダッシュボードへ飛ばす
                window.location.replace(data.redirect || "/premium/dashboard");
            } else {
                setIsLoggingIn(false);
                setError("セッションの作成に失敗しました。再度ログインをお試しください。");
            }
        } catch (e: any) {
            console.error("Login Error:", e.message);
            setError("ログイン処理中にエラーが発生しました。");
            setIsLoggingIn(false);
        }
    };

    // --- 自動ログインチェック & 状態監視 ---
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                // 認証状態が検出されたらセッション作成へ（手動ログイン・自動ログイン両対応）
                await handleLoginSuccess(user);
            } else {
                setIsLoggingIn(false);
            }
        });
        return () => unsubscribe();
    }, []);

    const handleEmailLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoggingIn(true);
        setError(null);
        try {
            await setPersistence(auth, browserLocalPersistence);
            await signInWithEmailAndPassword(auth, email, password);
            // signInWithEmailAndPassword が成功すると onAuthStateChanged が発火し、
            // handleLoginSuccess が呼ばれるため、ここでは何もしない
        } catch (e: any) {
            setError("メールアドレスまたはパスワードが正しくありません。");
            setIsLoggingIn(false);
        }
    };

    const handleGoogleLogin = async () => {
        setIsLoggingIn(true);
        setError(null);
        try {
            await setPersistence(auth, browserLocalPersistence);
            await signInWithPopup(auth, googleProvider);
            // signInWithPopup が成功すると onAuthStateChanged が発火する
        } catch (e: any) {
            setError("Googleログインに失敗しました。");
            setIsLoggingIn(false);
        }
    };

    if (isLoggingIn && !error) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
                <Loader2 className="w-10 h-10 text-orange-500 animate-spin mb-4" />
                <p className="text-gray-500 font-bold">ログイン状態を確認中...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <Head><title>ログイン - みんなの那須アプリ</title></Head>
            <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-xl space-y-6">
                <div className="text-center">
                    <h1 className="text-2xl font-black text-gray-800">おかえりなさい！</h1>
                    <p className="text-gray-400 text-sm mt-1">ログインしてアプリを始めましょう</p>
                </div>

                {error && (
                    <div className="p-3 bg-red-50 border-l-4 border-red-400 text-red-700 text-xs flex items-center">
                        <AlertTriangle className="w-5 h-5 mr-2 flex-shrink-0" /> {error}
                    </div>
                )}

                <form onSubmit={handleEmailLogin} className="space-y-4">
                    <input
                        type="email"
                        placeholder="メールアドレス"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-orange-500 transition-all"
                    />
                    <div className="relative">
                        <input
                            type={showPassword ? "text" : "password"}
                            placeholder="パスワード"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-orange-500 transition-all"
                        />
                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-3 text-gray-300">
                            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                        </button>
                    </div>
                    <button
                        type="submit"
                        disabled={isLoggingIn}
                        className="w-full py-4 bg-orange-500 text-white font-black rounded-xl shadow-lg active:scale-95 transition-all"
                    >
                        ログイン
                    </button>
                </form>

                <div className="relative flex items-center py-2">
                    <div className="flex-grow border-t border-gray-100"></div>
                    <span className="flex-shrink mx-4 text-gray-300 text-[10px] font-black uppercase">OR</span>
                    <div className="flex-grow border-t border-gray-100"></div>
                </div>

                <button
                    onClick={handleGoogleLogin}
                    disabled={isLoggingIn}
                    className="w-full py-3 border border-gray-200 rounded-xl flex justify-center items-center hover:bg-gray-50 active:scale-95 transition font-bold text-gray-600 gap-2"
                >
                    <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5 h-5" alt="Google" />
                    Googleでログイン
                </button>
            </div>
        </div>
    );
};

export default LoginPage;