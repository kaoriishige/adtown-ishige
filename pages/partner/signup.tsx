import { NextPage } from 'next';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';

// --- ★★★ ここを修正 ★★★ ---
// カテゴリデータに「その他」を追加
const categories = [
  { name: '飲食店', slug: 'restaurant' },
  { name: '美容室', slug: 'hair-salon' },
  { name: 'Beauty (エステ, ネイルなど)', slug: 'beauty' },
  { name: 'Health (整体, ヨガなど)', slug: 'health' },
  { name: '暮らし', slug: 'living' },
  { name: 'レジャー', slug: 'leisure' },
  { name: 'その他', slug: 'other' }, // 「その他」を追加
];

const PartnerSignupPage: NextPage = () => {
  const router = useRouter();
  const [storeName, setStoreName] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [email, setEmail] = useState('');
  const [confirmEmail, setConfirmEmail] = useState('');
  const [password, setPassword] = useState('');
  const [category, setCategory] = useState(categories[0].slug);
  const [customGenre, setCustomGenre] = useState(''); // 「その他」用のstateを追加
  const [agreed, setAgreed] = useState(false);
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
    if (!agreed) {
      setError('利用規約への同意が必要です。');
      setIsLoading(false);
      return;
    }

    // --- ★★★ ここからが重要な変更点 ★★★ ---
    // 「その他」が選択された場合の処理を追加
    let categoryToSave = category;
    if (category === 'other') {
      if (!customGenre.trim()) {
        setError('「その他」を選択した場合は、新しいジャンル名を入力してください。');
        setIsLoading(false);
        return;
      }
      // 「その他」の場合は、入力されたカスタムジャンル名を保存対象とする
      categoryToSave = customGenre.trim();
    }
    // --- ★★★ ここまでが重要な変更点 ★★★ ---

    try {
      const signupResponse = await fetch('/api/partner/create-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storeName, contactPerson, email, password, category: categoryToSave }),
      });

      const signupData = await signupResponse.json();
      if (!signupResponse.ok) {
        throw new Error(signupData.error || '登録に失敗しました。');
      }

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
            <input type="text" value={storeName} onChange={(e) => setStoreName(e.target.value)} required className="w-full px-4 py-2 border rounded-lg"/>
          </div>
          <div>
            <label className="block text-gray-700 font-medium mb-2">カテゴリ</label>
            <select value={category} onChange={(e) => setCategory(e.target.value)} required className="w-full px-4 py-2 border rounded-lg bg-white">
              {categories.map(cat => (
                <option key={cat.slug} value={cat.slug}>{cat.name}</option>
              ))}
            </select>
          </div>
          {/* --- ★★★ 「その他」が選択された時だけ表示される入力欄 ★★★ --- */}
          {category === 'other' && (
            <div className="pl-4">
              <label className="block text-gray-700 font-medium mb-2">新しいジャンル名</label>
              <input type="text" value={customGenre} onChange={(e) => setCustomGenre(e.target.value)} placeholder="例：ペットショップ" className="w-full px-4 py-2 border rounded-lg"/>
            </div>
          )}
          {/* --- ★★★ ここまで ★★★ --- */}
          <div>
            <label className="block text-gray-700 font-medium mb-2">ご担当者名</label>
            <input type="text" value={contactPerson} onChange={(e) => setContactPerson(e.target.value)} required className="w-full px-4 py-2 border rounded-lg"/>
          </div>
          <div>
            <label className="block text-gray-700 font-medium mb-2">メールアドレス</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full px-4 py-2 border rounded-lg"/>
          </div>
          <div>
            <label className="block text-gray-700 font-medium mb-2">メールアドレス（確認用）</label>
            <input type="email" value={confirmEmail} onChange={(e) => setConfirmEmail(e.target.value)} required className="w-full px-4 py-2 border rounded-lg"/>
          </div>
          <div>
            <label className="block text-gray-700 font-medium mb-2">パスワード (6文字以上)</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} className="w-full px-4 py-2 border rounded-lg"/>
          </div>

          <div className="pt-4">
            <label className="flex items-start">
              <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} className="mt-1 h-4 w-4"/>
              <span className="ml-3 text-sm text-gray-600">
                登録することで、みんなの那須アプリの紹介料プログラム（QRコードスタンド初期制作料5,000円、追加スタンド作成無料）および、アプリ広告（広告制作料10,000円、広告費無料）の１年契約（１年更新15,000円）に参加を同意したものとみなされます。
              </span>
            </label>
          </div>
          
          {error && <p className="text-red-500 text-sm text-center pt-2">{error}</p>}
          <button type="submit" disabled={isLoading} className="w-full py-3 mt-4 text-white bg-blue-600 rounded-lg">
            {isLoading ? '登録処理中...' : '登録する'}
          </button>
        </form>
        <p className="text-sm text-center mt-6">
          すでにアカウントをお持ちですか？ <Link href="/partner/login" className="text-blue-600 hover:underline">ログイン</Link>
        </p>
      </div>
    </div>
  );
};

export default PartnerSignupPage;