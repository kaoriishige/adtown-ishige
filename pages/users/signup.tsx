import React, { useState, useEffect, Fragment } from 'react';
import { NextPage } from 'next';
import { useRouter } from 'next/router';
import Head from 'next/head';
import nookies from 'nookies'; // 追加
import {
    UserPlus,
    Loader2,
    Mail,
    Lock,
    Eye,
    EyeOff,
    User,
    MapPin,
    Phone
} from 'lucide-react';

import {
    getAuth,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    GoogleAuthProvider,
    signInWithPopup
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
    const [name, setName] = useState('');
    const [address, setAddress] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const completeAuthFlow = async (user: any) => {
        const idToken = await user.getIdToken(true);

        // --- 修正箇所：紹介者IDをCookieから取得 ---
        const cookies = nookies.get();
        const referredBy = cookies.referredBy || null;
        // ------------------------------------

        await fetch("/api/auth/create-free-user", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                email: user.email,
                uid: user.uid,
                name: name,
                address: address,
                phoneNumber: phoneNumber,
                referredBy: referredBy // APIに紹介者IDを渡す
            }),
        });

        const res = await fetch("/api/auth/sessionLogin", {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${idToken}` },
            body: JSON.stringify({ loginType: "user" }),
            credentials: "include"
        });

        if (res.ok) {
            router.push("/home");
        } else {
            throw new Error("認証に失敗しました");
        }
    };

    const handleGoogleAuth = async () => {
        setIsProcessing(true);
        try {
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
            let user;
            try {
                const res = await createUserWithEmailAndPassword(auth, email, password);
                user = res.user;
            } catch (err: any) {
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
                        <h1 className="text-3xl font-black tracking-tighter">無料プランに登録</h1>
                        <p className="text-sm text-gray-400 mt-3 font-medium">基本情報を入力してください</p>
                    </div>

                    {error && <p className="text-red-500 text-xs text-center bg-red-50 p-4 rounded-2xl border border-red-100">{error}</p>}

                    <div className="space-y-4">
                        <button
                            onClick={handleGoogleAuth}
                            disabled={isProcessing}
                            className="w-full flex items-center justify-center gap-3 py-4 border-2 border-gray-100 rounded-2xl hover:bg-gray-50 transition active:scale-95 shadow-sm"
                        >
                            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" width="20" alt="google" />
                            <span className="text-sm">Googleで登録</span>
                        </button>

                        <div className="relative flex items-center py-4">
                            <div className="flex-grow border-t border-gray-100"></div>
                            <span className="flex-shrink mx-4 text-gray-300 text-[10px] font-black uppercase tracking-widest">または</span>
                            <div className="flex-grow border-t border-gray-100"></div>
                        </div>

                        <form onSubmit={handleEmailAuth} className="space-y-4">
                            <div className="relative">
                                <User className="absolute left-4 top-4 text-gray-300" size={20} />
                                <input
                                    type="text" placeholder="氏名" required
                                    className="w-full pl-12 pr-4 py-4 bg-gray-50 rounded-2xl outline-none focus:ring-2 focus:ring-blue-600 transition"
                                    value={name} onChange={e => setName(e.target.value)}
                                />
                            </div>
                            <div className="relative">
                                <Mail className="absolute left-4 top-4 text-gray-300" size={20} />
                                <input
                                    type="email" placeholder="メールアドレス" required
                                    className="w-full pl-12 pr-4 py-4 bg-gray-50 rounded-2xl outline-none focus:ring-2 focus:ring-blue-600 transition"
                                    value={email} onChange={e => setEmail(e.target.value)}
                                />
                            </div>
                            <div className="relative">
                                <MapPin className="absolute left-4 top-4 text-gray-300" size={20} />
                                <input
                                    type="text" placeholder="住所" required
                                    className="w-full pl-12 pr-4 py-4 bg-gray-50 rounded-2xl outline-none focus:ring-2 focus:ring-blue-600 transition"
                                    value={address} onChange={e => setAddress(e.target.value)}
                                />
                            </div>
                            <div className="relative">
                                <Phone className="absolute left-4 top-4 text-gray-300" size={20} />
                                <input
                                    type="tel" placeholder="電話番号" required
                                    className="w-full pl-12 pr-4 py-4 bg-gray-50 rounded-2xl outline-none focus:ring-2 focus:ring-blue-600 transition"
                                    value={phoneNumber} onChange={e => setPhoneNumber(e.target.value)}
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
                                    className="absolute right-4 top-4 text-gray-400"
                                >
                                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                </button>
                            </div>

                            <button
                                type="submit" disabled={isProcessing}
                                className="w-full py-5 bg-blue-600 text-white rounded-2xl font-black text-xl shadow-xl shadow-blue-100 hover:bg-blue-700 active:scale-95 transition flex items-center justify-center gap-2"
                            >
                                {isProcessing ? <Loader2 className="animate-spin" /> : <><UserPlus size={20} /><span>無料で登録</span></>}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </Fragment>
    );
};

export default SignupPage;