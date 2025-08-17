import { NextPage } from 'next';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';

const PartnerSignupPage: NextPage = () => {
  const router = useRouter();
  const [storeName, setStoreName] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [email, setEmail] = useState('');
  const [confirmEmail, setConfirmEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    if (email !== confirmEmail) {
      setError('メールアドレスが一致しません。');
      setIsLoading(false);
      return;
    }
    if (password.length < 6) {
      setError('パスワードは6文字以上で設定してください。');
      setIsLoading(false);
      return;
    }

    try {
      // 登録APIを呼び出す
      const signupResponse = await fetch('/api/partner/create-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storeName, contactPerson, email, password }),
      });

      const signupData = await signupResponse.json();
      if (!signupResponse.ok) {
        throw new Error(signupData.error || '登録に失敗しました。');
      }

      // --- ★★★ ここを修正 ★★★ ---
      // 登録成功後、パートナー専用ログインページにリダイレクト
      router.push('/partner/login?status=partner_signup_success');

    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 py-10 flex flex-col justify-center items-center">
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-lg">
        <h1 className="text-2xl font-bold text-center mb-6">パートナー無料登録</h1>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-gray-700 font-medium mb-2">店舗名・企業名</label>
            <input 
              type="text" 
              value={storeName} 
              onChange={(e) => setStoreName(e.target.value)} 
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" 
              required 
            />
          </div>
          <div>
            <label className="block text-gray-700 font-medium mb-2">ご担当者名</label>
            <input 
              type="text" 
              value={contactPerson} 
              onChange={(e) => setContactPerson(e.target.value)} 
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" 
              required 
            />
          </div>
          <div>
            <label className="block text-gray-700 font-medium mb-2">メールアドレス</label>
            <input 
              type="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" 
              placeholder="email@example.com" 
              required 
            />
          </div>
          <div>
            <label className="block text-gray-700 font-medium mb-2">メールアドレス（確認用）</label>
            <input 
              type="email" 
              value={confirmEmail} 
              onChange={(e) => setConfirmEmail(e.target.value)} 
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" 
              placeholder="もう一度入力してください" 
              required 
            />
          </div>
          <div>
            <label className="block text-gray-700 font-medium mb-2">パスワード (6文字以上)</label>
            <input 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" 
              required 
              minLength={6} 
            />
          </div>
          {error && <p className="text-red-500 text-sm text-center">{error}</p>}
          <button 
            type="submit" 
            disabled={isLoading} 
            className="w-full py-3 mt-4 text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
          >
            {isLoading ? '登録処理中...' : '登録する'}
          </button>
        </form>
        <p className="text-sm text-center mt-6">
          {/* --- ★★★ ここを修正 ★★★ --- */}
          すでにアカウントをお持ちですか？ <Link href="/partner/login" className="text-blue-600 hover:underline">ログイン</Link>
        </p>
      </div>
    </div>
  );
};

export default PartnerSignupPage;
