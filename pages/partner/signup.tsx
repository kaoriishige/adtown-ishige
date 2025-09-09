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
  
  // ▼▼▼ カテゴリ関連のStateを単一選択用に変更 ▼▼▼
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
    if (match) {
      setArea(match[0]);
    } else {
      setArea('');
    }
  }, [address]);
  
  // --- 大分類が変更されたら小分類の選択肢を更新 ---
  useEffect(() => {
    if (mainCategory) {
      // @ts-ignore
      setSubCategoryOptions(categoryData[mainCategory] || []);
      setSelectedSubCategory(''); // 小分類の選択をリセット
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
    if (email !== confirmEmail) { /* ... */ }
    if (!agreed) { /* ... */ }
    if (!area) { /* ... */ }
    // ▼▼▼ バリデーションを単一選択用に変更 ▼▼▼
    if (!selectedSubCategory) {
      setError('カテゴリ（小分類）を選択してください。');
      setIsLoading(false);
      return;
    }
    
    try {
      const response = await fetch('/api/partner/signup', {
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
          // ▼▼▼ カテゴリ情報を単一選択用に変更 ▼▼▼
          category: {
            main: mainCategory,
            sub: selectedSubCategory // 配列から文字列へ
          },
        }),
      });

      const data = await response.json();
      if (!response.ok) { throw new Error(data.message || '登録に失敗しました。'); }
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
          // --- 成功時の表示 ---
          <div className="text-center">
            {/* ... 省略 ... */}
          </div>
        ) : (
          // --- 登録フォームの表示 ---
          <>
            <h1 className="text-2xl font-bold text-center mb-6">パートナー無料登録</h1>
            <div className="text-center mb-8">
              {/* ... 省略 ... */}
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* --- 店舗名、住所などの入力フィールド --- */}
              <div>
                <label className="block text-gray-700 font-medium mb-2">店舗名・企業名</label>
                <input type="text" value={storeName} onChange={(e) => setStoreName(e.target.value)} required className="w-full px-4 py-2 border rounded-lg"/>
              </div>
              <div>
                <label className="block text-gray-700 font-medium mb-2">住所</label>
                <input type="text" value={address} onChange={(e) => setAddress(e.target.value)} required placeholder="例：栃木県那須塩原市共墾社108-2" className="w-full px-4 py-2 border rounded-lg"/>
              </div>

              {/* --- 大分類選択 --- */}
              <div>
                <label className="block text-gray-700 font-medium mb-2">カテゴリ（大分類）</label>
                <select value={mainCategory} onChange={(e) => setMainCategory(e.target.value)} required className="w-full px-4 py-2 border rounded-lg bg-white">
                  <option value="">選択してください</option>
                  {mainCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
              </div>

              {/* ▼▼▼ 小分類をラジオボタンに変更 ▼▼▼ */}
              {mainCategory && (
                <div>
                  <label className="block text-gray-700 font-medium mb-2">カテゴリ（小分類）</label>
                  <div className="mt-2 p-4 border rounded-lg grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2">
                    {subCategoryOptions.map(subCat => (
                      <label key={subCat} className="flex items-center space-x-3 cursor-pointer">
                        <input
                          type="radio" // typeをradioに変更
                          name="subCategory" // 同じname属性でグループ化
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                          checked={selectedSubCategory === subCat} // checkedの条件を変更
                          onChange={() => setSelectedSubCategory(subCat)} // onChangeの処理を変更
                        />
                        <span className="text-gray-700">{subCat}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
              {/* ▲▲▲ ここまで ▲▲▲ */}

              {/* --- 担当者名以下の入力フィールド --- */}
              {/* ... 省略（コードは変更なし） ... */}
              
              {error && <p className="text-red-500 text-sm text-center pt-2">{error}</p>}
              <button type="submit" disabled={isLoading} className="w-full py-3 mt-4 text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:bg-blue-400">
                {isLoading ? '登録処理中...' : '登録する'}
              </button>
            </form>
            <p className="text-sm text-center mt-6">
              {/* ... 省略 ... */}
            </p>
          </>
        )}
      </div>
    </div>
  );
};

export default PartnerSignupPage;