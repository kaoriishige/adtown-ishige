import { NextPage } from 'next';
import { useState, useEffect } from 'react';
import Link from 'next/link';

// --- カテゴリデータ ---
const categoryData = {
  "飲食関連": ["レストラン・食堂", "カフェ・喫茶店", "居酒屋・バー", "パン屋（ベーカリー）", "和菓子・洋菓子店", "ラーメン店", "そば・うどん店", "寿司屋"],
  "買い物関連": ["農産物直売所・青果店", "精肉店・鮮魚店", "個人経営の食料品店", "酒店", "ブティック・衣料品店", "雑貨店・民芸品店", "書店", "花屋", "お土産店"],
  "美容・健康関連": ["美容室・理容室", "ネイルサロン", "エステサロン", "リラクゼーション・マッサージ", "整体・整骨院・鍼灸院", "個人経営の薬局", "クリニック・歯科医院"],
  "住まい・暮らし関連": ["工務店・建築・リフォーム", "水道・電気工事", "不動産会社", "クリーニング店", "造園・植木屋", "便利屋"],
  "教育・習い事関連": ["学習塾・家庭教師", "ピアノ・音楽教室", "英会話教室", "書道・そろばん教室", "スポーツクラブ・道場", "パソコン教室", "料理教室"],
  "車・バイク関連": ["自動車販売店・自動車整備・修理工場", "ガソリンスタンド", "バイクショップ"],
  "観光・レジャー関連": ["ホテル・旅館・ペンション", "日帰り温泉施設", "観光施設・美術館・博物館", "体験工房（陶芸・ガラスなど）", "牧場・農園", "キャンプ場・グランピング施設", "ゴルフ場", "貸し別荘"],
  "ペット関連": ["動物病院", "トリミングサロン", "ペットホテル・ドッグラン"],
  "専門サービス関連": ["弁護士・税理士・行政書士などの士業", "デザイン・印刷会社", "クリーニング（衣類・布団など）", "写真館", "保険代理店", "カウンセリング", "コンサルティング"],
};
const mainCategories = Object.keys(categoryData);

const PartnerSignupPage: NextPage = () => {
  // --- State定義 ---
  const [storeName, setStoreName] = useState('');
  const [address, setAddress] = useState('');
  const [area, setArea] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [qrStandCount, setQrStandCount] = useState(0);
  const [email, setEmail] = useState('');
  const [confirmEmail, setConfirmEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // ▼▼▼ カテゴリ関連のStateを単一選択用に修正 ▼▼▼
  const [mainCategory, setMainCategory] = useState('');
  const [selectedSubCategory, setSelectedSubCategory] = useState<string>(''); // 配列から文字列へ
  const [subCategoryOptions, setSubCategoryOptions] = useState<string[]>([]);

  const [agreed, setAgreed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  // --- 住所からエリアを抽出するロジック ---
  useEffect(() => {
    const match = address.match(/(那須塩原市|那須郡那須町|那須町|大田原市)/);
    if (match) { setArea(match[0]); } else { setArea(''); }
  }, [address]);
  
  // --- 大分類が変更されたら小分類の選択肢を更新 ---
  useEffect(() => {
    if (mainCategory) {
      // @ts-ignore
      setSubCategoryOptions(categoryData[mainCategory] || []);
      setSelectedSubCategory(''); // 単一選択用にリセット
    } else {
      setSubCategoryOptions([]);
    }
  }, [mainCategory]);

  // --- 送信処理 ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    // --- バリデーションチェック ---
    if (email !== confirmEmail) { setError('メールアドレスが一致しません。'); setIsLoading(false); return; }
    if (!agreed) { setError('利用規約への同意が必要です。'); setIsLoading(false); return; }
    if (!area) { setError('住所は那須塩原市、那須町、大田原市のいずれかである必要があります。'); setIsLoading(false); return; }
    if (!selectedSubCategory) { setError('カテゴリ（小分類）を選択してください。'); setIsLoading(false); return; }
    
    try {
      // ▼▼▼ APIのURLを正しい宛先に戻しました ▼▼▼
      const response = await fetch('/api/partner/create-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          storeName, 
          address,
          area,
          contactPerson, 
          phoneNumber, 
          qrStandCount,
          email, 
          password, 
          category: {
            main: mainCategory,
            sub: selectedSubCategory // 単一の文字列を送信
          },
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        // バックエンドのエラーメッセージキー 'error' に合わせます
        throw new Error(data.error || '登録に失敗しました。');
      }
      setIsSuccess(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 py-10 flex flex-col justify-center items-center">
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-lg">
        {isSuccess ? (
          <div className="text-center">
            <svg className="mx-auto h-16 w-16 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h1 className="text-3xl font-bold text-gray-800 mt-4">ご登録ありがとうございます</h1>
            <p className="text-gray-600 mt-4 text-lg">パートナー登録の申請を受け付けました。</p>
            <div className="mt-8 bg-blue-50 border-l-4 border-blue-500 text-blue-800 p-4 rounded-md text-left">
              <h2 className="font-bold">今後の流れについて</h2>
              <p className="mt-2">運営者による承認後、本登録完了となります。QRコードスタンドは、後日担当者よりご連絡の上、お届けに伺います。</p>
            </div>
            <div className="mt-8">
              <Link href="/partner/login" className="inline-block bg-blue-600 text-white font-bold py-3 px-8 rounded-lg text-lg hover:bg-blue-700 transition">
                ログインページへ進む
              </Link>
            </div>
          </div>
        ) : (
          <>
            <h1 className="text-2xl font-bold text-center mb-6">パートナー無料登録</h1>
            <div className="text-center mb-8">
              <a href="https://disguised-cat-noakl5d.gamma.site/" target="_blank" rel="noopener noreferrer" className="inline-block bg-gradient-to-r from-orange-400 to-pink-500 text-white font-bold py-3 px-8 rounded-full shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300">
                とってもお得なご案内はこちら
              </a>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-gray-700 font-medium mb-2">店舗名・企業名</label>
                <input type="text" value={storeName} onChange={(e) => setStoreName(e.target.value)} required className="w-full px-4 py-2 border rounded-lg"/>
              </div>
              <div>
                <label className="block text-gray-700 font-medium mb-2">住所</label>
                <input type="text" value={address} onChange={(e) => setAddress(e.target.value)} required placeholder="例：栃木県那須塩原市共墾社108-2" className="w-full px-4 py-2 border rounded-lg"/>
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-2">カテゴリ（大分類）</label>
                <select value={mainCategory} onChange={(e) => setMainCategory(e.target.value)} required className="w-full px-4 py-2 border rounded-lg bg-white">
                  <option value="">選択してください</option>
                  {mainCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
              </div>

              {/* ▼▼▼ 小分類のUIをラジオボタンに変更 ▼▼▼ */}
              {mainCategory && (
                <div>
                  <label className="block text-gray-700 font-medium mb-2">カテゴリ（小分類）</label>
                  <div className="mt-2 p-4 border rounded-lg grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2">
                    {subCategoryOptions.map(subCat => (
                      <label key={subCat} className="flex items-center space-x-3 cursor-pointer">
                        <input
                          type="radio"
                          name="subCategory"
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                          checked={selectedSubCategory === subCat}
                          onChange={() => setSelectedSubCategory(subCat)}
                        />
                        <span className="text-gray-700">{subCat}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
              {/* ▲▲▲ ここまで ▲▲▲ */}

              <div>
                <label className="block text-gray-700 font-medium mb-2">ご担当者名</label>
                <input type="text" value={contactPerson} onChange={(e) => setContactPerson(e.target.value)} required className="w-full px-4 py-2 border rounded-lg"/>
              </div>
              <div>
                <label className="block text-gray-700 font-medium mb-2">電話番号</label>
                <input type="tel" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} required placeholder="例: 09012345678" className="w-full px-4 py-2 border rounded-lg"/>
              </div>
              <div>
                <label className="block text-gray-700 font-medium mb-2">QRコードスタンド希望個数</label>
                <input type="number" value={qrStandCount} onChange={(e) => setQrStandCount(Number(e.target.value))} required min="0" className="w-full px-4 py-2 border rounded-lg"/>
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
              <button type="submit" disabled={isLoading} className="w-full py-3 mt-4 text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:bg-blue-400">
                {isLoading ? '登録処理中...' : '登録する'}
              </button>
            </form>
            <p className="text-sm text-center mt-6">
              すでにアカウントをお持ちですか？ <Link href="/partner/login" className="text-blue-600 hover:underline">ログイン</Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
};

export default PartnerSignupPage;