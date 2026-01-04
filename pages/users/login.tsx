import React, { useState, useEffect } from 'react';
import { NextPage } from 'next';
import { useRouter } from 'next/router';
import Link from 'next/link';
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
import { AlertTriangle, Key, Loader2, Eye, EyeOff } from 'lucide-react'; 

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
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isLoggingIn, setIsLoggingIn] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    // 【追加】ページを開いた瞬間に、前回のログインが生きていれば自動でホームへ飛ばす
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user && !isLoggingIn) {
                // すでにログイン済みの場合は自動でセッションを確立して移動
                console.log("既存のログインセッションを検出しました。自動遷移します。");
                await handleLoginSuccess(user);
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

            const data = await response.json();

            if (!response.ok) {
                // 自動ログイン失敗時は何もしない（手動ログインを待つ）
                if (data.error === 'user_data_missing') return; 
                throw new Error(data.error || "ログイン処理に失敗しました。");
            }

            // 成功したら /home へ飛ばす
            window.location.href = data.redirect || "/home";
        } catch (e: any) {
            console.error("Auto Login Error:", e.message);
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
                <h1 className="text-2xl font-bold text-center">ログイン</h1>
                {error && (
                    <div className="p-3 bg-red-50 border-l-4 border-red-400 text-red-700 text-sm flex items-center">
                        <AlertTriangle className="w-5 h-5 mr-2" /> {error}
                    </div>
                )}
                <form onSubmit={handleEmailLogin} className="space-y-4">
                    <input type="email" placeholder="メールアドレス" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full p-3 border rounded-md" />
                    <div className="relative">
                        <input type={showPassword ? "text" : "password"} placeholder="パスワード" value={password} onChange={(e) => setPassword(e.target.value)} required className="w-full p-3 border rounded-md" />
                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-3 text-gray-400">
                            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                        </button>
                    </div>
                    <button type="submit" disabled={isLoggingIn} className="w-full py-3 bg-orange-500 text-white font-bold rounded-md flex justify-center items-center">
                        {isLoggingIn ? <><Loader2 className="animate-spin mr-2" />処理中...</> : "ログイン"}
                    </button>
                </form>
                <button onClick={handleGoogleLogin} disabled={isLoggingIn} className="w-full py-3 border rounded-md flex justify-center items-center hover:bg-gray-50">
                    Googleでログイン
                </button>
                <div className="text-center text-sm text-blue-600">
                    <Link href="/users/signup">新規登録はこちら</Link>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;