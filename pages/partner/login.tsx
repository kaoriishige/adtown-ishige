import Head from 'next/head';
import React, { useState, useEffect } from 'react'; 
import { useRouter } from 'next/router';
import { getAuth, signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth'; // sendPasswordResetEmail を使用
import { app } from '@/lib/firebase'; // パスを確認
import Link from 'next/link';

// --- 型定義の拡張 ---
type MessageContent = string | React.ReactNode;

// --- SVGアイコン ---
const EyeIcon = (props: React.SVGProps<SVGSVGElement>) => ( <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z"></path><circle cx="12" cy="12" r="3"></circle></svg> );
const EyeOffIcon = (props: React.SVGProps<SVGSVGElement>) => ( <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-10-7-10-7a1.89 1.89 0 0 1 0-.66M22 12s-3 7-10 7a9.75 9.75 0 0 1-4.24-1.16"></path><line x1="1" y1="1" x2="23" y2="23"></line><path d="M9.9 9.9a3 3 0 1 0 4.2 4.2"></path></svg> );


const LoginPage: React.FC = () => {
const router = useRouter();
const auth = getAuth(app);

const [email, setEmail] = useState('');
const [password, setPassword] = useState('');
const [loginType, setLoginType] = useState('recruit'); // 'recruit' (求人) または 'adver' (広告)
const [loading, setLoading] = useState(false);
const [error, setError] = useState<MessageContent | null>(null); 
const [successMessage, setSuccessMessage] = useState<MessageContent | null>(null); 
const [passwordVisible, setPasswordVisible] = useState(false); 

const [isPasswordResetMode, setIsPasswordResetMode] = useState(false); 

// URLのクエリパラメータからエラーメッセージを取得
const queryError = router.query.error as string;
useEffect(() => {
if (queryError) {
let message = '';
if (queryError === 'permission_denied') {
message = 'アクセス権限がありません。ログインタイプが正しいか確認してください。';
} else if (queryError === 'user_data_missing') {
message = 'ユーザーデータが見つかりません。';
}
setError(message);
}
}, [queryError]);

// パスワードリセット処理の開始
const handleStartPasswordReset = (e: React.MouseEvent) => {
e.preventDefault(); 
setError('パスワード再設定メールを送信するには、メールアドレスを入力してください。');
setSuccessMessage(null);
setIsPasswordResetMode(true); 
};

// パスワードリセットメール送信
const handleSendPasswordReset = async () => {
if (!email) {
setError('パスワード再設定メールを送信するには、メールアドレスを入力してください。');
return;
}
setLoading(true);
setError(null);
setSuccessMessage(null);

try {
await sendPasswordResetEmail(auth, email);
setSuccessMessage(`再設定メールを ${email} に送信しました。メールを確認してください。`);
setIsPasswordResetMode(false); 

} catch (err: any) {
console.error('Password Reset Failed:', err);

// ★★★ エラーコードの日本語化 ★★★
let message = 'パスワード再設定メールの送信に失敗しました。';
if (err.code === 'auth/user-not-found') {
message = 'このメールアドレスを持つユーザーは見つかりませんでした。';
} else if (err.code === 'auth/invalid-email') {
message = 'メールアドレスの形式が正しくありません。';
} else if (err.code === 'auth/too-many-requests') {
message = '試行回数が上限を超えました。時間をおいて再度お試しください。';
} else if (err.message) {
message = err.message;
}
setError(message);
} finally {
setLoading(false);
}
};

// メールアドレス忘れのサポートリンクへ誘導
const handleEmailForget = (e: React.MouseEvent) => {
e.preventDefault(); 
setError(null);
setSuccessMessage(
<div className="text-sm font-medium leading-relaxed">
メールアドレスをお忘れの場合、以下にご連絡ください。
<div className="mt-1 text-center font-bold text-lg text-indigo-700">
<a href="mailto:adtown@able.ocn.ne.jp" className="hover:underline">
adtown@able.ocn.ne.jp
</a>
</div>
<p className="mt-2 text-xs text-gray-600">※ こちらから <Link href="/contact" className="underline">お問い合わせフォーム</Link>もご利用いただけます。</p>
</div>
);
setIsPasswordResetMode(false); // パスワードリセットモードを強制終了
}

const handleSubmit = async (e: React.FormEvent) => {
e.preventDefault();

if (isPasswordResetMode) {
// リセットモードの場合はメール送信処理を実行
handleSendPasswordReset();
return;
}

// 通常のログイン処理
setLoading(true);
setError(null);
setSuccessMessage(null);

try {
// 1. Firebase Authでサインイン
const userCredential = await signInWithEmailAndPassword(auth, email, password);
const user = userCredential.user;

// 2. IDトークンを取得
const idToken = await user.getIdToken();

// 3. セッションクッキーを設定するためのAPIルートを呼び出す
const response = await fetch('/api/auth/sessionLogin', {
method: 'POST',
headers: {
'Content-Type': 'application/json',
'Authorization': `Bearer ${idToken}`,
},
body: JSON.stringify({ 
loginType: loginType, // 'recruit' or 'adver'
}),
});

if (!response.ok) {
const errorData = await response.json();
throw new Error(errorData.error || 'セッション設定中に不明なエラーが発生しました。');
}

const data = await response.json();

// 4. 成功したらダッシュボードへリダイレクト
const defaultRedirectPath = loginType === 'adver' ? '/partner/dashboard' : '/recruit/dashboard';

router.push(data.redirect || defaultRedirectPath);

} catch (err: any) {
console.error('Login Failed:', err);

// ★★★ エラーコードの日本語化 ★★★
let message = '認証に失敗しました。';

// Firebase Authのエラーメッセージを日本語化
if (err.code === 'auth/invalid-email' || 
err.code === 'auth/user-not-found' || 
err.code === 'auth/wrong-password' ||
err.code === 'auth/invalid-credential') { // 新しいエラーコードにも対応
message = 'メールアドレスまたはパスワードが正しくありません。';
} else if (err.code === 'auth/too-many-requests') {
message = '試行回数が上限を超えました。時間をおいて再度お試しください。';
} else if (err.message && err.message.includes('セッション設定中に')) {
message = err.message + ' 権限が不足している可能性があります。'; // セッションAPIエラーを強化
} else if (err.message) {
message = err.message;
}

setError(message);
setLoading(false);
}
};

return (
<div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
<Head>
<title>パートナーログイン</title>
</Head>

<div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-md space-y-6">
<h1 className="text-3xl font-bold text-gray-900 text-center">パートナーログイン</h1>

{/* ログインタイプ選択 */}
<div className="flex justify-center space-x-6">
<label className="flex items-center space-x-2">
<input type="radio" name="loginType" value="adver" checked={loginType === 'adver'} onChange={() => { setLoginType('adver'); setError(null); setSuccessMessage(null); setIsPasswordResetMode(false); }} className="text-indigo-600 focus:ring-indigo-500" />
<span className="text-gray-700">広告パートナー</span>
</label>
<label className="flex items-center space-x-2">
<input type="radio" name="loginType" value="recruit" checked={loginType === 'recruit'} onChange={() => { setLoginType('recruit'); setError(null); setSuccessMessage(null); setIsPasswordResetMode(false); }} className="text-indigo-600 focus:ring-indigo-500" />
<span className="text-gray-700">求人パートナー</span>
</label>
</div>

<form onSubmit={handleSubmit} className="space-y-4">

{isPasswordResetMode && !successMessage && (
<div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm text-center">
パスワード再設定メールを送信するには、メールアドレスを入力してください。
</div>
)}

{error && (
<div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm text-center">
{typeof error === 'string' ? error : <div>{error}</div>}
</div>
)}

{successMessage && (
<div className="p-3 bg-green-100 border border-green-400 text-green-700 rounded-lg text-sm text-center">
{typeof successMessage === 'string' ? successMessage : <div>{successMessage}</div>}
</div>
)}

<div>
<label className="block text-sm font-medium text-gray-700">メールアドレス</label>
<input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="mt-1 block w-full p-3 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500" />
</div>

{!isPasswordResetMode && (
<div>
<label className="block text-sm font-medium text-gray-700">パスワード</label>
<div className="relative mt-1">
<input 
type={passwordVisible ? "text" : "password"} 
value={password} 
onChange={(e) => setPassword(e.target.value)} 
required 
className="block w-full p-3 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 pr-10" 
/>
<button 
type="button"
onClick={() => setPasswordVisible(!passwordVisible)}
className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700"
>
{passwordVisible ? <EyeOffIcon /> : <EyeIcon />}
</button>
</div>
</div>
)}

{/* 忘れましたボタン */}
<div className="text-sm flex justify-center space-x-4">
<button
type="button"
onClick={handleEmailForget}
className="text-indigo-600 hover:text-indigo-800 hover:underline"
>
メールアドレスをお忘れですか？
</button>

<button 
type="button" 
onClick={handleStartPasswordReset}
disabled={loading}
className="text-indigo-600 hover:text-indigo-800 hover:underline disabled:text-gray-400"
>
パスワードをお忘れですか？
</button>
</div>

<button 
type="submit" 
disabled={loading} 
className="w-full py-3 bg-orange-500 text-white font-bold rounded-md hover:bg-orange-600 disabled:bg-gray-400"
>
{loading ? '処理中...' : isPasswordResetMode ? '再設定メールを送信' : 'ログイン'}
</button>
</form>

{/* 登録リンク */}
<div className="text-center text-sm mt-4 space-y-2 border-t pt-4">
<p className="text-gray-600">アカウントをお持ちでないですか？</p>
<div className="flex justify-center space-x-4">
<Link href="/partner/signup" className="text-blue-600 hover:underline">広告パートナー登録</Link>
<span>/</span>
<Link href="/recruit" className="text-blue-600 hover:underline">求人パートナー登録</Link>
</div>
</div>
</div>
</div>
);
};

export default LoginPage;