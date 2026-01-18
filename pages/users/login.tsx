import React, { useState, Fragment } from 'react';
import { NextPage } from 'next';
import { useRouter } from 'next/router';
import Head from 'next/head';
import nookies from 'nookies';
import {
    UserPlus,
    Loader2,
    Mail,
    Lock,
    Eye,
    EyeOff
} from 'lucide-react';

import {
    getAuth,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    GoogleAuthProvider,
    signInWithPopup,
    setPersistence,
    browserLocalPersistence
} from 'firebase/auth';

import { initializeApp, getApps, getApp } from 'firebase/app';

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

const SignupPage: NextPage = () => {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // 登録成功後のフロー（LoginPageのhandleLoginSuccessと同様の挙動）
    const completeAuthFlow = async (user: any) => {
        try {
            const idToken = await user.getIdToken(true);
            const cookies = nookies.get();
            const referredBy = cookies.referredBy || null;

            // 1. Firestoreにユーザー作成（最小限の情報）
            await fetch("/api/auth/create-free-user", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email: user.email,
                    uid: user.uid,
                    referredBy: referredBy
                }),
            });

            // 2. セッション作成とリダイレクト
            const res = await fetch("/api/auth/sessionLogin", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${idToken}`
                },
                body: JSON.stringify({ loginType: "user" }),
                credentials: "include"
            });

            const data = await res.json();

            if (res.ok && data.redirect) {
                // LoginPageと同じく、ブラウザレベルで/home等へ強制遷移
                window.location.replace(data.redirect);
            } else {
                // redirect指定がない場合のデフォルト遷移先
                window.location.replace("/home");
            }
        } catch (e: any) {
            console.error("Auth Flow Error:", e.message);
            setError("認証フロー中にエラーが発生しました。");
            setIsProcessing(false);
        }
    };

    const handleGoogleAuth = async () => {
        setIsProcessing(true);
        setError(null);
        try {
            await setPersistence(auth, browserLocalPersistence);
            const provider = new GoogleAuthProvider();
            const res = await signInWithPopup(auth, provider);
            await completeAuthFlow(res.user);
        } catch (e: any) {
            setError("Google登録に失敗しました。");
            setIsProcessing(false);
        }
    };

    const handleEmailAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsProcessing(true);
        setError(null);

        try {
            await setPersistence(auth, browserLocalPersistence);
            let user;
            try {
                const res = await createUserWithEmailAndPassword(auth, email, password);
                user = res.user;
            } catch (err: any) {
                // 既に存在する場合はログインを試みる（LoginPageの挙動に合わせる）
                if (err.code === "auth/email-already-in-use") {
                    const res = await signInWithEmailAndPassword(auth, email, password);
                    user = res.user;
                } else {
                    throw err;
                }
            }
            await completeAuthFlow(user);
        } catch (err: any) {
            let msg = "登録に失敗しました。";
            if (err.code === "auth/wrong-password") msg = "パスワードが正しくありません。";
            if (err.code === "auth/invalid-email") msg = "メールアドレスの形式が正しくありません。";
            if (err.code === "auth/weak-password") msg = "パスワードは6文字以上必要です。";
            setError(msg);
            setIsProcessing(false);
        }
    };

    return (
        <Fragment>
            <Head><title>新規登録 - みんなの那須アプリ</title></Head>
            <div className="flex items-center justify-center min-h-screen bg-white p-4 font-bold text-gray-900">
                <div className="w-full max-w-sm space-y-8">
                    <div className="text-center">
                        <h1 className="text-3xl font-black tracking-tighter uppercase italic">Join Nasu</h1>
                        <p className="text-sm text-gray-400 mt-3 font-medium">メールアドレスで今すぐ登録</p>
                    </div>

                    {error && <p className="text-red-500 text-xs text-center bg-red-50 p-4 rounded-2xl border border-red-100">{error}</p>}

                    <div className="space-y-4">
                        <button
                            onClick={handleGoogleAuth}
                            disabled={isProcessing}
                            className="w-full flex items-center justify-center gap-3 py-4 border-2 border-gray-100 rounded-2xl hover:bg-gray-50 transition active:scale-95 shadow-sm"
                        >
                            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" width="20" alt="google" />
                            <span className="text-sm font-black">Googleで登録</span>
                        </button>

                        <div className="relative flex items-center py-4">
                            <div className="flex-grow border-t border-gray-100"></div>
                            <span className="flex-shrink mx-4 text-gray-300 text-[10px] font-black uppercase tracking-widest">or email</span>
                            <div className="flex-grow border-t border-gray-100"></div>
                        </div>

                        <form onSubmit={handleEmailAuth} className="space-y-4">
                            <div className="relative">
                                <Mail className="absolute left-4 top-4 text-gray-300" size={20} />
                                <input
                                    type="email" placeholder="メールアドレス" required
                                    className="w-full pl-12 pr-4 py-4 bg-gray-50 rounded-2xl outline-none focus:ring-2 focus:ring-blue-600 transition"
                                    value={email} onChange={e => setEmail(e.target.value)}
                                />
                            </div>

                            <div className="relative">
                                <Lock className="absolute left-4 top-4 text-gray-300" size={20} />
                                <input
                                    type={showPassword ? "text" : "password"} placeholder="パスワード (6文字以上)" required
                                    className="w-full pl-12 pr-12 py-4 bg-gray-50 rounded-2xl outline-none focus:ring-2 focus:ring-blue-600 transition"
                                    value={password} onChange={e => setPassword(e.target.value)}
                                />
                                <button
                                    type="button" onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-4 text-gray-400 p-1"
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>

                            <button
                                type="submit" disabled={isProcessing}
                                className="w-full py-5 bg-blue-600 text-white rounded-2xl font-black text-xl shadow-xl shadow-blue-100 hover:bg-blue-700 active:scale-95 transition flex items-center justify-center gap-2"
                            >
                                {isProcessing ? (
                                    <Loader2 className="animate-spin" />
                                ) : (
                                    <><UserPlus size={20} /><span>無料で登録</span></>
                                )}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </Fragment>
    );
};

export default SignupPage;