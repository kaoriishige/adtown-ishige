import React, { useState } from 'react';
import { NextPage } from 'next';
import Head from 'next/head';
import {
    getAuth,
    signInWithEmailAndPassword,
    signInWithPopup,
    GoogleAuthProvider,
    setPersistence,
    browserLocalPersistence
} from 'firebase/auth';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { AlertTriangle, Loader2, Eye, EyeOff } from 'lucide-react';

const firebaseConfig = {
    apiKey: "AIzaSyDtTt0fWthsU6Baq1fJwUx8CgSakoZnMXY",
    authDomain: "minna-no-nasu-app.firebaseapp.com",
    projectId: "minna-no-nasu-app",
    storageBucket: "minna-no-nasu-app.appspot.com",
    messagingSenderId: "885979930856",
    appId: "1:885979930856:web:13d1afd4206c91813e695d",
};

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

const LoginPage: NextPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isLoggingIn, setIsLoggingIn] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    // ログイン成功時の処理：大至急 pages/home.tsx へ飛ばす
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
                // 絶対に pages/home.tsx へ強制遷移させる
                window.location.replace("/home");
            } else {
                setIsLoggingIn(false);
                setError("セッションの作成に失敗しました。");
            }
        } catch (e: any) {
            console.error("Login Error:", e.message);
            setIsLoggingIn(false);
        }
    };

    const handleEmailLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoggingIn(true);
        setError(null);
        try {
            await setPersistence(auth, browserLocalPersistence);
            const result = await signInWithEmailAndPassword(auth, email, password);
            await handleLoginSuccess(result.user);
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
            const result = await signInWithPopup(auth, googleProvider);
            await handleLoginSuccess(result.user);
        } catch (e: any) {
            setError("Googleログインに失敗しました。");
            setIsLoggingIn(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <Head><title>ログイン - みんなの那須アプリ</title></Head>
            <div className="w-full max-w-md bg-white p-8 rounded-xl shadow-lg space-y-6">
                <h1 className="text-2xl font-bold text-center text-gray-800">ログイン</h1>

                {error && (
                    <div className="p-3 bg-red-50 border-l-4 border-red-400 text-red-700 text-sm flex items-center">
                        <AlertTriangle className="w-5 h-5 mr-2" /> {error}
                    </div>
                )}

                <form onSubmit={handleEmailLogin} className="space-y-4">
                    <input
                        type="email"
                        placeholder="メールアドレス"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="w-full p-3 border rounded-md outline-none focus:ring-2 focus:ring-orange-500 font-medium"
                    />

                    <div className="relative">
                        <input
                            type={showPassword ? "text" : "password"}
                            placeholder="パスワード"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="w-full p-3 border rounded-md outline-none focus:ring-2 focus:ring-orange-500 font-medium"
                        />
                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-3 text-gray-400">
                            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                        </button>
                    </div>

                    <button
                        type="submit"
                        disabled={isLoggingIn}
                        className="w-full py-3 bg-orange-500 text-white font-bold rounded-md flex justify-center items-center active:scale-95 transition"
                    >
                        {isLoggingIn ? <><Loader2 className="animate-spin mr-2" />処理中...</> : "ログイン"}
                    </button>
                </form>

                <div className="relative flex items-center py-2">
                    <div className="flex-grow border-t border-gray-100"></div>
                    <span className="flex-shrink mx-4 text-gray-300 text-[10px] font-black uppercase">または</span>
                    <div className="flex-grow border-t border-gray-100"></div>
                </div>

                <button
                    onClick={handleGoogleLogin}
                    disabled={isLoggingIn}
                    className="w-full py-3 border border-gray-200 rounded-md flex justify-center items-center hover:bg-gray-50 active:scale-95 transition font-bold text-gray-600"
                >
                    Googleでログイン
                </button>
            </div>
        </div>
    );
};

export default LoginPage;