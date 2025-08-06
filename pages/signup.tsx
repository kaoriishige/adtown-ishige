import { NextPage } from 'next';
import { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { createUserWithEmailAndPassword, sendEmailVerification } from 'firebase/auth';
import { auth } from '../lib/firebase'; // あなたのFirebaseクライアント設定

const SignUpPage: NextPage = () => {
  // ▼▼▼ 氏名・フリガナのStateを追加 ▼▼▼
  const [name, setName] = useState('');
  const [furigana, setFurigana] = useState('');
  // ▲▲▲ 氏名・フリガナのStateを追加 ▲▲▲
  const [email, setEmail] = useState('');
  const [emailConfirmation, setEmailConfirmation] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (email !== emailConfirmation) {
      setError('メールアドレスが一致しません。');
      setLoading(false);
      return;
    }

    try {
      // 1. Firebase Authenticationでユーザーを作成
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // 2. 確認メールを送信
      await sendEmailVerification(user);
      
      // ▼▼▼ 3. Firestoreにユーザードキュメントを作成（氏名・フリガナも追加） ▼▼▼
      // このAPIルートは別途作成・修正が必要です
      await fetch('/api/user/create-doc', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          uid: user.uid, 
          email: user.email,
          name: name, // 氏名を追加
          furigana: furigana, // フリガナを追加
        }),
      });
      // ▲▲▲ 3. Firestoreにユーザードキュメントを作成（氏名・フリガナも追加） ▲▲▲

      // 4. 「メールを確認して」ページに移動
      router.push('/verify-email');

    } catch (err: any) {
      console.error("サインアップエラー:", err);
      if (err.code === 'auth/email-already-in-use') {
        setError('このメールアドレスは既に使用されています。');
      } else if (err.code === 'auth/weak-password') {
        setError('パスワードは6文字以上で設定してください。');
      } else {
        setError('登録に失敗しました。しばらくしてから再度お試しください。');
      }
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md">
        <h1 className="text-3xl font-bold text-center">新規登録</h1>
        <form onSubmit={handleSignUp} className="space-y-6">
          {/* ▼▼▼ 氏名・フリガナの入力フィールドを追加 ▼▼▼ */}
          <div>
            <label className="block mb-2 text-sm font-medium">氏名</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border rounded-md"
              required
              placeholder="山田 太郎"
            />
          </div>
          <div>
            <label className="block mb-2 text-sm font-medium">フリガナ</label>
            <input
              type="text"
              value={furigana}
              onChange={(e) => setFurigana(e.target.value)}
              className="w-full px-3 py-2 border rounded-md"
              required
              placeholder="ヤマダ タロウ"
            />
          </div>
          {/* ▲▲▲ 氏名・フリガナの入力フィールドを追加 ▲▲▲ */}
          <div>
            <label className="block mb-2 text-sm font-medium">メールアドレス</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border rounded-md"
              required
              placeholder="email@example.com"
            />
          </div>
          <div>
            <label className="block mb-2 text-sm font-medium">メールアドレス（確認用）</label>
            <input
              type="email"
              value={emailConfirmation}
              onChange={(e) => setEmailConfirmation(e.target.value)}
              className="w-full px-3 py-2 border rounded-md"
              required
              placeholder="もう一度入力してください"
            />
          </div>
          <div>
            <label className="block mb-2 text-sm font-medium">パスワード</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border rounded-md"
              required
              placeholder="6文字以上"
            />
          </div>
          {error && <p className="text-red-500 text-sm text-center">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 px-4 text-white bg-blue-500 rounded-md hover:bg-blue-600 disabled:bg-gray-400"
          >
            {loading ? '登録中...' : '登録して確認メールを送信'}
          </button>
        </form>
        <p className="text-sm text-center">
          すでにアカウントをお持ちですか？ <Link href="/login" className="text-blue-500 hover:underline">ログイン</Link>
        </p>
      </div>
    </div>
  );
};

export default SignUpPage;