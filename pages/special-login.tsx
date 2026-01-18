import React, { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import {
    RiLoginCircleLine,
    RiMailLine,
    RiLockPasswordLine,
    RiGiftFill,
    RiEyeLine,
    RiEyeOffLine,
    RiArrowRightLine
} from 'react-icons/ri';

const SpecialLoginPage = () => {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [loginData, setLoginData] = useState({
        email: '',
        password: '',
    });

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            // ここに認証処理（Firebase Auth / API等）を記述
            console.log("Login Attempt:", loginData);

            // 成功時のリダイレクト例
            // router.push('/special-dashboard');
        } catch (error) {
            alert('ログインに失敗しました。メールアドレスまたはパスワードを確認してください。');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#FDFCFD] font-sans text-[#4A3B3B] flex flex-col justify-center py-12 px-6">
            <Head><title>特別パートナーログイン</title></Head>

            <div className="max-w-md w-full mx-auto space-y-8">
                {/* ヘッダー部分 */}
                <div className="text-center">
                    <RiGiftFill size={48} className="mx-auto text-pink-500 mb-4" />
                    <h1 className="text-2xl font-black italic">特別パートナーログイン</h1>
                    <p className="text-[10px] text-[#A89F94] mt-2 font-bold tracking-widest uppercase">Affiliate Partner Login</p>
                </div>

                {/* ログインフォーム */}
                <div className="bg-white border border-[#E8E2D9] rounded-[2.5rem] p-8 shadow-sm">
                    <form onSubmit={handleLogin} className="space-y-6">

                        {/* メールアドレス */}
                        <div className="space-y-2">
                            <label className="flex items-center gap-2 text-[10px] font-black text-[#A89F94] px-2 uppercase tracking-widest">
                                <RiMailLine className="text-pink-500" size={14} />
                                メールアドレス
                            </label>
                            <input
                                required
                                type="email"
                                className="w-full p-4 bg-white border border-[#E8E2D9] rounded-2xl text-sm font-bold placeholder-[#D1C9BF] outline-none focus:ring-2 focus:ring-pink-200 transition-all"
                                placeholder="nasu@example.com"
                                value={loginData.email}
                                onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                            />
                        </div>

                        {/* パスワード */}
                        <div className="space-y-2">
                            <label className="flex items-center gap-2 text-[10px] font-black text-[#A89F94] px-2 uppercase tracking-widest">
                                <RiLockPasswordLine className="text-pink-500" size={14} />
                                パスワード
                            </label>
                            <div className="relative">
                                <input
                                    required
                                    type={showPassword ? "text" : "password"}
                                    className="w-full p-4 bg-white border border-[#E8E2D9] rounded-2xl text-sm font-bold placeholder-[#D1C9BF] outline-none focus:ring-2 focus:ring-pink-200 transition-all"
                                    placeholder="••••••••"
                                    value={loginData.password}
                                    onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                                />
                                <button
                                    type="button"
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[#D1C9BF] hover:text-pink-500 transition-colors"
                                    onClick={() => setShowPassword(!showPassword)}
                                >
                                    {showPassword ? <RiEyeOffLine size={20} /> : <RiEyeLine size={20} />}
                                </button>
                            </div>
                        </div>

                        {/* パスワード忘れ */}
                        <div className="text-right">
                            <Link href="/forgot-password">
                                <span className="text-[10px] font-bold text-[#A89F94] hover:text-pink-500 underline underline-offset-4 cursor-pointer">
                                    パスワードをお忘れですか？
                                </span>
                            </Link>
                        </div>

                        {/* ログインボタン */}
                        <button
                            disabled={loading}
                            type="submit"
                            className="w-full py-5 bg-[#4A3B3B] text-white rounded-full font-black text-lg shadow-xl hover:bg-[#3d3131] active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                'ログイン中...'
                            ) : (
                                <>
                                    <RiLoginCircleLine size={24} />
                                    ログインする
                                </>
                            )}
                        </button>
                    </form>
                </div>

                {/* 新規登録への誘導 */}
                <div className="text-center space-y-4">
                    <p className="text-xs font-bold text-[#6B5D5D]">
                        まだパートナー登録がお済みでない方
                    </p>
                    <Link href="/special-signup">
                        <span className="inline-flex items-center gap-2 px-8 py-3 bg-white border-2 border-pink-500 text-pink-500 rounded-full font-black text-sm hover:bg-pink-50 transition-all cursor-pointer group">
                            新規パートナー登録はこちら
                            <RiArrowRightLine className="group-hover:translate-x-1 transition-transform" />
                        </span>
                    </Link>
                </div>
            </div>

            {/* フッター */}
            <footer className="mt-12 text-center">
                <p className="text-[10px] font-bold text-[#D1C9BF]">
                    © {new Date().getFullYear()} 株式会社adtown / みんなの那須アプリ
                </p>
            </footer>
        </div>
    );
};

export default SpecialLoginPage;