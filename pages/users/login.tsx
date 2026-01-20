import React, { useState, useEffect } from 'react';
import { NextPage } from 'next';
import Head from 'next/head';
import {
    getAuth,
    signInWithEmailAndPassword,
    signInWithPopup,
    GoogleAuthProvider,
    setPersistence,
    browserLocalPersistence,
    onAuthStateChanged
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
    const [isLoggingIn, setIsLoggingIn] = useState(true); // 初期状態を読み込み中にする
    const [showPassword, setShowPassword] = useState(false);

    // --- ★ 自動ログインチェック ---
    useEffect(() => {
        // Firebaseの認証状態を監視
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                // すでにログイン情報がブラウザに残っている場合、そのままログイン処理へ
                console.log("既ログインユーザーを検知:", user.email);
                await handleLoginSuccess(user);
            } else {
                setIsLoggingIn(false); // ログインしていない場合はフォームを表示
            }
        });
        return () => unsubscribe();
    }, []);

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
                // リダイレクト先を /premium/dashboard に変更
                window.location.replace("/premium/dashboard");
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
            // browserLocalPersistence を設定することで、ブラウザを閉じてもログインを記憶
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

    // ログインチェック中（画面読み込み時）の表示
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
                        className="w-full py-4 bg-orange-500 text-white font-black rounded-xl shadow-lg shadow-orange-100 active:scale-95 transition-all"
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