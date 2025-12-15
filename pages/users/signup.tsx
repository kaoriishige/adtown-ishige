import React, { useState, useEffect, Fragment } from 'react';
import { NextPage } from 'next';
import { useRouter } from 'next/router'; // 【修正】routerを使用
import Link from 'next/link';
import Head from 'next/head';

// --- アイコンライブラリ（lucide-reactまたは類似）からのインポートを仮定 ---
import { 
    UserPlus,
    Loader2 // 処理中に使用するアイコンを追加 (仮定)
} from 'lucide-react'; 

// --- Firebase のインポート修正 ---

// 認証機能（createUserWithEmailAndPasswordなど）は 'firebase/auth' からインポート
import { 
    getAuth, 
    createUserWithEmailAndPassword, // L.Xb
} from 'firebase/auth';

// 【重要修正点】
// アプリケーション初期化機能（initializeApp, getApps, getApp）は 'firebase/app' からインポート
import {
    initializeApp, 
    getApps, 
    getApp
} from 'firebase/app'; 

// --- Firebase の設定 ---
const firebaseConfig = {
    apiKey: "AIzaSyDtTt0fWthsU6Baq1fJwUx8CgSakoZnMXY",
    authDomain: "minna-no-nasu-app.firebaseapp.com",
    projectId: "minna-no-nasu-app",
    storageBucket: "minna-no-nasu-app.appspot.com",
    messagingSenderId: "885979930856",
    appId: "1:885979930856:web:13d1afd4206c91813e695d",
};

// サービス初期化ロジック
// 【修正】getApps, getApp, initializeApp が 'firebase/app' からインポートされたためエラー解消
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);


// ------------------------------------------------
// メインコンポーネント
// ------------------------------------------------

const SignupPage: NextPage = () => {
    const router = useRouter(); // 【修正】routerを使用 (Line 43の未使用警告解消)
    const firebaseAuth = auth; 

    // 状態管理
    const [email, setEmail] = useState('');           
    const [password, setPassword] = useState('');     
    const [confirmPassword, setConfirmPassword] = useState(''); 
    const [isProcessing, setIsProcessing] = useState(false);   
    const [error, setError] = useState<string | null>(null);   
    const [referrerId, setReferrerId] = useState<string | null>(null); 

    // リファラーID（紹介者ID）の取得 
    useEffect(() => {
        const storedReferrerId = sessionStorage.getItem("referrerId");
        if (storedReferrerId) {
            setReferrerId(storedReferrerId);
        }
    }, []);

    // 登録処理 (j)
    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (password !== confirmPassword) {
            setError("パスワードが一致しません。");
            return;
        }
        
        if (password.length < 6) {
            setError("パスワードは6文字以上で入力してください。");
            return;
        }

        setIsProcessing(true);

        try {
            // 1. Firebaseでユーザーを作成
            const userCredential = await createUserWithEmailAndPassword(firebaseAuth, email, password);
            const user = userCredential.user;

            // 2. サーバーAPIでユーザー情報（無料プラン）を作成
            const createFreeUserResponse = await fetch("/api/auth/create-free-user", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ 
                    email: user.email, 
                    uid: user.uid, 
                    referrerId: referrerId
                }),
            });
            
            if (!createFreeUserResponse.ok) {
                throw new Error("ユーザー情報の作成に失敗しました。");
            }
            
            // 3. セッションログイン
            const idToken = await user.getIdToken(true);

            const sessionLoginResponse = await fetch("/api/auth/sessionLogin", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${idToken}`,
                },
                body: JSON.stringify({ loginType: "user" }),
                credentials: "include"
            });

            if (sessionLoginResponse.ok) {
                // セッション作成成功後、Next.jsのルーターを使用してリダイレクト
                await new Promise(resolve => setTimeout(resolve, 300));
                
                // 【修正】router.push() を使用することで、未使用の警告を解消し、Next.jsの仕組みに合わせる
                router.push("/home"); 
            } else {
                const errorData = await sessionLoginResponse.json();
                throw new Error(errorData.error || "セッションの作成に失敗しました。");
            }

        } catch (e: any) {
            let errorMessage = "登録中にエラーが発生しました。";
            if (e.code === "auth/email-already-in-use") {
                errorMessage = "このメールアドレスは既に使用されています。";
            }
            setError(errorMessage);
            setIsProcessing(false);
        }
    };

    // ------------------------------------------------
    // JSX (レンダリング)
    // ------------------------------------------------
    return (
        <Fragment>
            <Head>
                <title>新規登録 - みんなの那須アプリ</title>
            </Head>
            <div className="flex items-center justify-center min-h-screen bg-gray-100">
                <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md">
                    
                    <h1 className="text-3xl font-bold text-center">みんなの那須アプリ無料プランに登録</h1>
                    <p className="text-center text-gray-600">メールアドレスとパスワードだけで始められます。</p>
                    
                    {/* エラーメッセージ表示 */}
                    {error && (
                        <p className="text-red-500 text-sm text-center bg-red-100 p-3 rounded-md">
                            {error}
                        </p>
                    )}
                    
                    {/* 登録フォーム */}
                    <form onSubmit={handleSignup} className="space-y-4">
                        
                        {/* メールアドレス */}
                        <div>
                            <label className="block mb-1 text-sm font-medium">メールアドレス</label>
                            <input
                                type="email"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                className="w-full px-3 py-2 border rounded-md"
                                required
                            />
                        </div>

                        {/* パスワード */}
                        <div>
                            <label className="block mb-1 text-sm font-medium">パスワード (6文字以上)</label>
                            <input
                                type="password"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                className="w-full px-3 py-2 border rounded-md"
                                required
                            />
                        </div>

                        {/* パスワード (確認用) */}
                        <div>
                            <label className="block mb-1 text-sm font-medium">パスワード (確認用)</label>
                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={e => setConfirmPassword(e.target.value)}
                                className="w-full px-3 py-2 border rounded-md"
                                required
                            />
                        </div>
                        
                        {/* 登録ボタン */}
                        <button
                            type="submit"
                            disabled={isProcessing}
                            className="w-full py-3 px-4 text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:bg-gray-400 font-bold"
                        >
                            {isProcessing ? (
                                <span className="flex items-center justify-center">
                                    <Loader2 className="mr-2 animate-spin" />
                                    処理中...
                                </span>
                            ) : (
                                <span className="flex items-center justify-center">
                                    <UserPlus className="mr-2" />
                                    同意して無料で登録する
                                </span>
                            )}
                        </button>
                    </form>
                    
                    {/* ログインリンク */}
                    <p className="text-sm text-center">
                        すでにアカウントをお持ちですか？{" "}
                        <Link href="/users/login" className="text-blue-600 hover:underline">
                            ログイン
                        </Link>
                    </p>
                </div>
            </div>
        </Fragment>
    );
};

export default SignupPage;