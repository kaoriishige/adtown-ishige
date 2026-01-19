import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { auth, db } from '@/lib/firebase';
import {
    signInWithEmailAndPassword,
    signOut,
    setPersistence,
    browserLocalPersistence
} from 'firebase/auth';
import { collection, query, where, getDocs } from 'firebase/firestore';
import {
    RiLoginCircleLine,
    RiMailLine,
    RiLockPasswordLine,
    RiGiftFill,
    RiEyeLine,
    RiEyeOffLine,
    RiErrorWarningLine
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

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            // 1. Firebase Authentication 認証
            const userCredential = await signInWithEmailAndPassword(
                auth,
                loginData.email.trim(),
                loginData.password
            );

            // 2. Firestore special_partners コレクションの確認
            const q = query(
                collection(db, "special_partners"),
                where("email", "==", loginData.email.trim())
            );
            const querySnapshot = await getDocs(q);

            if (querySnapshot.empty) {
                setError("認証されましたが、特別パートナーとして登録されていません。");
                await signOut(auth);
                setLoading(false);
                return;
            }

            // 成功：パートナーフラグを保存
            const partnerDoc = querySnapshot.docs[0];
            localStorage.setItem('is_special_partner', 'true');
            localStorage.setItem('partner_doc_id', partnerDoc.id);

            // 3. リダイレクト先を /premium/dashboard に変更
            // 確実に認証状態を反映させるため window.location を使用
            window.location.href = '/premium/dashboard';

        } catch (err: any) {
            console.error("Login Error Code:", err.code);

            // 日本語エラーメッセージ
            switch (err.code) {
                case 'auth/invalid-credential':
                case 'auth/user-not-found':
                case 'auth/wrong-password':
                    setError("メールアドレスまたはパスワードが正しくありません。");
                    break;
                case 'auth/too-many-requests':
                    setError("短時間に何度も失敗したためブロックされました。時間を置いてお試しください。");
                    break;
                default:
                    setError("ログインに失敗しました。アカウントがAuthenticationに登録されているか確認してください。");
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
                    <p className="text-[10px] text-[#A89F94] mt-2 font-bold tracking-widest uppercase">Affiliate Access</p>
                </div>

                {error && (
                    <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-start gap-3 text-xs font-bold text-red-600 animate-in fade-in duration-300">
                        <RiErrorWarningLine size={20} className="shrink-0" />
                        <span>{error}</span>
                    </div>
                )}

                <div className="bg-white border border-[#E8E2D9] rounded-[2.5rem] p-8 shadow-sm">
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