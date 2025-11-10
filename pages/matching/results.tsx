import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { db } from '../../lib/firebase'; // Firestoreのdbをインポート
import { collection, query, where, getDocs, DocumentData } from 'firebase/firestore';
import { RiArrowLeftLine, RiMapPinLine, RiStarFill, RiCheckDoubleFill } from 'react-icons/ri';
import Link from 'next/link';

// ★ (NEW) 点数取得関数をインポート
import { getScoreForOption } from '../../lib/aiScoreTable'; 

// 取得した店舗データの型
interface Store extends DocumentData {
  id: string;
  storeName: string;
  address: string;
  mainImageUrl?: string;
  matchingValues?: string[]; // 事業者が登録した「強み」 (例: ["自家製天然酵母を使用"])
}

// 算出後のスコア付き店舗データ
interface ScoredStore extends Store {
  matchScore: number; // マッチングスコア (合計点)
  matchedValues: string[]; // マッチした強み
  scoreBreakdown: { value: string, score: number }[]; // 点数の内訳
}

// ★ 仮のユーザーID (認証機能がない場合のダミー)
const DUMMY_USER_ID = "guest_user_12345"; 

const MatchingResultsPage = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [allStores, setAllStores] = useState<Store[]>([]);
  const [error, setError] = useState<string | null>(null);
  // ★ API送信が完了したかどうかのフラグ
  const [apiSent, setApiSent] = useState(false);

  // --- 1. クエリパラメータを取得 ---
  const {
    mainCategory,
    subCategory,
    area,
    values,    // ユーザーが選んだ「好み/強み」 (カンマ区切り文字列)
  } = router.query;

  // ユーザーが選んだ「好み」の配列
  const userPreferences = useMemo(() => {
    return typeof values === 'string' && values.length > 0 ? values.split(',') : [];
  }, [values]);
  const hasPreferences = userPreferences.length > 0;
  
  // (中略: MatchedStores のロジックは変更なし)
  // --- 3. マッチングロジックの実行 (フィルタリング & スコア計算) ---
  const matchedStores = useMemo(() => {
    if (allStores.length === 0) {
      return [];
    }
    
    const currentMainCat = typeof mainCategory === 'string' ? mainCategory : "";
    const currentSubCat = typeof subCategory === 'string' ? subCategory : "";

    const scoredStores: ScoredStore[] = [];

    allStores.forEach(store => {
      
      // 3-1. エリアでの絞り込み (変更なし)
      if (typeof area === 'string' && area !== 'どこでも') {
        if (!store.address || !store.address.includes(area)) {
          return; // エリアが不一致なら除外
        }
      }

      // 3-2. スコア計算
      let totalScore = 0;
      const matchedValues: string[] = [];
      const scoreBreakdown: { value: string, score: number }[] = [];
      
      if (hasPreferences) {
        const storeStrengths = store.matchingValues || [];

        userPreferences.forEach(preference => {
          if (storeStrengths.includes(preference)) {
            const score = getScoreForOption(currentMainCat, currentSubCat, preference);
            
            totalScore += score; // 合計点に加算
            matchedValues.push(preference);
            scoreBreakdown.push({ value: preference, score: score }); // 内訳を保存
          }
        });

      }
      
      // 3-3. 結果に追加
      if (hasPreferences && totalScore > 0) {
         scoredStores.push({
          ...store,
          matchScore: totalScore, // ★ 合計点数
          matchedValues: matchedValues,
          scoreBreakdown: scoreBreakdown, // ★ 内訳
        });
      } else if (!hasPreferences) {
         scoredStores.push({
          ...store,
          matchScore: 0,
          matchedValues: [],
          scoreBreakdown: [],
        });
      }
    });

    // 3-4. スコアの高い順に並び替え
    return scoredStores.sort((a, b) => b.matchScore - a.matchScore);

  }, [allStores, area, userPreferences, hasPreferences, mainCategory, subCategory]);


  // --- 2. Firestoreから店舗データを取得 --- (変更なし)
  useEffect(() => {
    const fetchStores = async () => {
      if (!router.isReady || !mainCategory || !subCategory) return;

      setLoading(true);
      setError(null);
      try {
        const q = query(
          collection(db, "stores"),
          where("mainCategory", "==", mainCategory),
          where("subCategory", "==", subCategory),
          where("status", "==", "approved")
        );

        const snapshot = await getDocs(q);
        const storesData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        } as Store));

        setAllStores(storesData);
        
      } catch (err: any) {
        console.error("Firestore Error:", err);
        setError("店舗データの取得に失敗しました。");
      }
      setLoading(false);
    };

    if (router.isReady) {
      fetchStores();
    }
  }, [router.isReady, mainCategory, subCategory]);


  // ★★★ NEW: マッチング結果をAPIに送信する処理 ★★★
  useEffect(() => {
    // データロードが完了し、APIがまだ送信されておらず、マッチングした店舗が1件以上いる場合
    if (!loading && !error && !apiSent && matchedStores.length > 0) {
      
      const recordMatches = async () => {
        // マッチングした全店舗に対してAPIをコール
        for (const store of matchedStores) {
          try {
            await fetch('/api/matching/record', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                storeId: store.id,
                // 実際にマッチした点数をカウントとして送る
                actualCount: store.matchScore, 
                matchedUserId: DUMMY_USER_ID, 
              }),
            });
          } catch (err) {
            console.error(`Failed to record match for store ${store.id}:`, err);
            // ユーザー体験には影響しないため、エラーは表示しない
          }
        }
        setApiSent(true); // 送信完了フラグを立て、再実行を防ぐ
      };
      
      recordMatches();
    }
    // 依存配列に matchedStores.length を含め、マッチングが完了してから実行されるようにする
  }, [loading, error, apiSent, matchedStores.length]);


  // --- 4. UIのレンダリング --- (変更なし)
  return (
    <>
      <Head>
        <title>AIマッチング結果 | みんなのナス</title>
      </Head>

      {/* ヘッダー (変更なし) */}
      <header className="bg-white shadow-sm flex-shrink-0 sticky top-0 z-10">
        <div className="max-w-xl mx-auto p-4 flex items-center">
          <button
            onClick={() => router.back()}
            className="p-2 rounded-full hover:bg-gray-100"
          >
            <RiArrowLeftLine className="w-6 h-6 text-gray-700" />
          </button>
          <h1 className="text-lg font-bold ml-4">AIマッチング結果</h1>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="max-w-xl mx-auto p-4">
        {loading && (
          <div className="text-center py-10">
            <p className="text-lg font-medium">AIが最適なお店を選定中...</p>
            {/* ... (ローダーCSS) ... */}
            <style jsx>{`
              .loader {
                border: 4px solid #f3f3f3;
                border-top: 4px solid #3498db;
                border-radius: 50%;
                width: 40px;
                height: 40px;
                animation: spin 1s linear infinite;
                margin: 20px auto;
              }
              @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
              }
            `}</style>
            <div className="loader"></div>
          </div>
        )}

        {/* ... (Error 表示は変更なし) ... */}
        {!loading && error && (
          <div className="text-center py-10 px-4">
            <p className="text-lg font-medium text-red-600">{error}</p>
            <button
              onClick={() => router.back()}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg"
            >
              条件を選び直す
            </button>
          </div>
        )}

        {!loading && !error && (
          <>
            {matchedStores.length > 0 ? (
              <div>
                <h2 className="text-xl font-bold mb-4">
                  {matchedStores.length}件のお店が見つかりました！
                </h2>
                
                {/* マッチング結果のリスト */}
                <div className="space-y-4">
                  {matchedStores.map((store, index) => (
                    <Link href={`/store/${store.id}`} key={store.id} legacyBehavior>
                      <a className="block bg-white rounded-lg shadow-md overflow-hidden transition transform hover:shadow-lg">
                        {/* ... (メイン画像) ... */}
                        <img 
                          src={store.mainImageUrl || 'https://via.placeholder.com/400x200?text=No+Image'} 
                          alt={store.storeName}
                          className="w-full h-40 object-cover"
                        />
                        
                        <div className="p-4">
                          {/* スコア表示 (合計点数を表示) */}
                          {store.matchScore > 0 && (
                            <div className="flex items-center mb-1">
                              <RiStarFill className={`w-5 h-5 ${index === 0 ? 'text-yellow-400' : 'text-gray-300'}`} />
                              <span className={`ml-1 font-bold ${index === 0 ? 'text-yellow-600' : 'text-gray-500'}`}>
                                {index === 0 ? "ベストマッチ！" : "マッチ"}
                                (合計 {store.matchScore} Pts)
                              </span>
                            </div>
                          )}
                          
                          {/* ... (店舗名, 住所は変更なし) ... */}
                          
                          {/* マッチした価値観 (点数の内訳を表示) */}
                          {store.scoreBreakdown.length > 0 && (
                            <div className="mt-3 border-t pt-3">
                              <h4 className="text-sm font-semibold text-green-700 flex items-center">
                                <RiCheckDoubleFill className="mr-1" />
                                あなたの好みとの一致ポイント
                              </h4>
                              <div className="flex flex-wrap gap-1 mt-2">
                                {store.scoreBreakdown.map((item, i) => (
                                  <span key={i} className="px-2 py-0.5 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                                    {item.value} (+{item.score} Pts)
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </a>
                    </Link>
                  ))}
                </div>
              </div>
            ) : (
              // マッチなし (変更なし)
              <div className="text-center py-20 px-4">
                <h2 className="text-2xl font-bold mb-4">一致するお店が見つかりません</h2>
                <p className="text-gray-600 mb-6">
                  ごめんなさい。選択した条件に合うお店がありませんでした。<br/>
                  「好み」や「エリア」の条件を変えて、もう一度試してみてください。
                </p>
                <button
                  onClick={() => router.back()}
                  className="px-6 py-3 bg-blue-600 text-white font-bold rounded-lg shadow-lg hover:bg-blue-700"
                >
                  条件を選び直す
                </button>
              </div>
            )}
          </>
        )}
      </main>
    </>
  );
};

export default MatchingResultsPage;