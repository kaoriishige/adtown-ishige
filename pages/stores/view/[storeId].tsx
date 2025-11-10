import { GetServerSideProps } from "next";
import { adminDb } from "@/lib/firebase-admin";
import Head from "next/head";
import React, { FC, useEffect } from "react"; // useEffectをインポート
import { FaMapMarkerAlt, FaPhone, FaGlobe, FaLine, FaBolt, FaCheckCircle, FaLightbulb, FaUserShield, FaHandshake, FaMoneyBillWave } from 'react-icons/fa'; 

// ★★★ 復元された固定値 (データ取得パスの核) ★★★
const APP_ID = "default-app-id"; 
const USER_ID = "nYgH5v3SxDTRXqzkr68rWtYGtzy2"; 
// ★★★

// ==========================================================
// ★ AIマッチング価値観の分類（デザイン用）
// ==========================================================
const AI_MATCHING_CATEGORIES = {
    "専門性・実績": {
        icon: FaBolt,
        values: [
            "特定の分野（経営、Web、人事）に特化",
            "最新の知識・情報に精通",
            "成果（売上・コスト削減）にコミット",
            "AIコンサルティング",
            "企業課題解決アプリ開発",
        ],
    },
    "提案力・解決力": {
        icon: FaLightbulb,
        values: [
            "的確な課題分析・診断力",
            "複数の解決策・選択肢を提示",
            "期待を超えるアイデア・付加価値の提供",
        ],
    },
    "ヒアリング力・伴走力": {
        icon: FaHandshake,
        values: [
            "経営者の悩み・ビジョンを深くヒアリング",
            "実行まで伴走・サポート",
            "長期的なパートナーとして信頼できる",
        ],
    },
    "価格の透明性・適正さ": {
        icon: FaMoneyBillWave,
        values: [
            "料金体系（顧問、プロジェクト）が明確",
            "価格以上の価値・成果",
            "事前に詳細な見積もりを提示",
        ],
    },
    "人柄・信頼感": {
        icon: FaUserShield,
        values: [
            "専門用語を使わず分かりやすく説明",
            "レスポンスが早く丁寧",
            "秘密厳守・誠実な対応",
        ],
    },
};

// Firestoreのデータ型を定義
interface StoreData {
    id: string;
    storeName: string;
    description: string;
    mainImageUrl?: string | null;
    galleryImageUrls?: string[];
    matchingValues?: string[];
    specialtyPoints?: string[];
    address?: string;
    phoneNumber?: string;
    websiteUrl?: string;
    lineLiffUrl?: string;
    lineOfficialId?: string;
    createdAt?: string | null;
    updatedAt?: string | null;
    mainCategory?: string;
    subCategory?: string;
    targetUserInterests?: string;
}

interface StoreProps {
    store: StoreData | null;
    error?: string;
}

// ----------------------------------------------------------------
// ---- Firestore データ取得 (修正済み: 固定パスで取得) ----
// ----------------------------------------------------------------
export const getServerSideProps: GetServerSideProps<StoreProps> = async (context) => {
  const storeId = context.params?.storeId as string;

  try {
    // データ取得パスを APP_IDとUSER_IDを含む正しいパス構造に戻す
    const storeRef = adminDb
      .collection("artifacts")
      .doc(APP_ID)
      .collection("users")
      .doc(USER_ID)
      .collection("stores")
      .doc(storeId);

    const storeSnap = await storeRef.get();
    if (!storeSnap.exists) {
        console.warn(`Store not found: ${storeId}`);
        return { notFound: true };
    }

    const data = storeSnap.data();

    // TimestampをJSON安全な文字列に変換
    const serialized = JSON.parse(
      JSON.stringify({
        id: storeSnap.id,
        ...data,
        createdAt: data?.createdAt?.toDate?.()?.toISOString?.() || null,
        updatedAt: data?.updatedAt?.toDate?.()?.toISOString?.() || null,
      })
    );

    return { props: { store: serialized as StoreData } };
  } catch (error: any) {
    console.error("データ取得エラー:", error.message);
    return { props: { store: null, error: error.message } };
  }
};

// ----------------------------------------------------------------
// ---- 汎用テンプレート (デザイン/フックのルール準拠) ----
// ----------------------------------------------------------------
const UniversalStoreLanding: FC<StoreProps> = ({ store, error }) => {
    
  // ★★★ 修正箇所 1: useEffectをコンポーネントの最上部へ移動 ★★★
  useEffect(() => {
    // storeが存在しない場合は何もしない (useEffect内のロジックで分岐)
    if (!store) return; 

    // ページが表示されてから3秒後にプッシュトリガーを実行
    const timer = setTimeout(() => {
        
        // ログ出力でトリガーを確認
        console.log(`[LINE PUSH] 3秒後、${store.storeName}へのLINE登録を促すプッシュ処理をトリガーしました。`);
        
        // TODO: 実際のLINEプッシュAPI呼び出しをここに実装
        // fetch('/api/line-push-trigger', { ... });
        
    }, 3000); 

    return () => clearTimeout(timer); // コンポーネントが閉じられたらタイマーをクリア
  }, [store]); // storeが変わったときに実行

  // ★★★ 修正箇所 2: 早期リターンを処理する (エラーチェック) ★★★

  if (error) {
    return (
      <div className="p-8 text-center text-red-500">
        データ取得エラー: {error}
      </div>
    );
  }

  if (!store) {
    return (
      <div className="p-8 text-center text-gray-500">データを読み込んでいます...</div>
    );
  }
  
  // ★★★ 修正箇所 3: データ取得後の処理開始 ★★★

  const {
    storeName,
    description,
    mainImageUrl,
    galleryImageUrls = [],
    matchingValues = [],
    specialtyPoints = [], 
    address,
    phoneNumber,
    websiteUrl,
    lineLiffUrl,
    lineOfficialId,
    createdAt,
    mainCategory,
    targetUserInterests,
  } = store;

  // 【】を区切りとして、店舗紹介文をブロックに分割するロジック
  const contentBlocks: { title: string; content: string }[] = [];
  if (description) {
      const parts = description.split("【");
      if (parts[0].trim()) {
          contentBlocks.push({ title: "店舗の想い・ストーリー", content: parts[0].trim() });
      }
      for (let i = 1; i < parts.length; i++) {
          const part = parts[i].trim();
          const match = part.match(/(.+?)】([\s\S]*)/); 
          if (match) {
              contentBlocks.push({ title: match[1].trim(), content: match[2].trim() });
          } else {
              if (contentBlocks.length > 0) {
                  contentBlocks[contentBlocks.length - 1].content += "\n\n" + part;
              } else {
                  contentBlocks.push({ title: "店舗の想い・ストーリー", content: part });
              }
          }
      }
  }

  // 強力なCTAボタンコンポーネント
  const LineCTAButton: FC<{ text: string, className?: string }> = ({ text, className = '' }) => (
    lineLiffUrl ? (
      <a
        href={lineLiffUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={`inline-flex items-center justify-center font-bold px-10 py-4 rounded-xl shadow-2xl transition transform hover:scale-[1.03] animate-bounce-slow ${className}`}
      >
        <FaLine className="w-6 h-6 mr-3" />
        {text}
      </a>
    ) : null
  );

  /**
   * データベースのmatchingValuesから、AI_MATCHING_CATEGORIESに存在する値のみを抽出し、
   * カテゴリごとにグループ化するヘルパー関数。
   */
  const getCategorizedMatchingValues = () => {
    const categorized: {
        title: string;
        icon: FC<any>;
        values: string[];
    }[] = [];

    Object.entries(AI_MATCHING_CATEGORIES).forEach(([title, { icon, values: allValues }]) => {
        const selectedValuesInCategory = (matchingValues as string[]).filter(v => allValues.includes(v));

        if (selectedValuesInCategory.length > 0) {
            categorized.push({
                title,
                icon,
                values: selectedValuesInCategory,
            });
        }
    });

    return categorized;
  };

  const categorizedValues = getCategorizedMatchingValues();


  return (
    <>
      <Head>
        <title>{storeName} | みんなの那須</title>
        <meta name="description" content={`${storeName} の紹介ページ`} />
      </Head>

      {/* 1. Hero Section - インパクトと信頼性 */}
      <section
        className="relative min-h-[70vh] flex items-center bg-cover bg-center"
        style={{ backgroundImage: `url(${mainImageUrl || "/default-bg.jpg"})` }}
      >
        <div className="absolute inset-0 bg-gray-900/70"></div>
        <div className="relative max-w-6xl mx-auto px-6 py-20 text-white z-10 w-full">
          <p className="text-xl font-medium mb-3 text-indigo-300">
            {mainCategory || "地域密着型サービス"}
          </p>
          <h1 className="text-5xl md:text-7xl font-extrabold mb-5 leading-tight tracking-tight">
            {storeName}
          </h1>
          <div className="h-1 w-20 bg-indigo-400 mb-8"></div>
          
          {/* 強みをキャッチコピーとして表示 */}
          {(specialtyPoints.filter((p: string) => p.trim()).length > 0) && (
            <div className="bg-white/10 backdrop-blur-sm p-4 rounded-xl max-w-lg mb-8 shadow-lg">
                <p className="font-semibold text-lg text-indigo-100 mb-2 flex items-center">
                    <FaBolt className="w-5 h-5 mr-2 text-yellow-400"/> 
                    **貴方のための、当店の3つの強み**
                </p>
                <ul className="space-y-1">
                    {specialtyPoints.filter((p: string) => p.trim()).map((point: string, i: number) => (
                        <li key={i} className="text-base flex items-start">
                            <FaCheckCircle className="w-4 h-4 mt-1 mr-2 text-green-400 flex-shrink-0" />
                            {point}
                        </li>
                    ))}
                </ul>
            </div>
          )}

          <LineCTAButton 
            text="LINEで無料相談・予約する" 
            className="bg-green-500 text-white hover:bg-green-600"
          />
        </div>
      </section>
      
      {/* 2. AI Matching Values - 整理された価値観を強調 */}
      {categorizedValues.length > 0 && (
        <section className="bg-indigo-50 py-16">
          <div className="max-w-6xl mx-auto px-6">
            <h2 className="text-3xl font-bold text-center text-indigo-800 mb-4">
                {storeName}が選ばれる理由 | お客様との「価値観」マッチング
            </h2>
            <p className="text-lg text-center text-gray-700 mb-10">
                AIが分析した、{storeName}が最も得意とする分野です。
            </p>
            
            {/* 整理されたカテゴリ表示 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {categorizedValues.map((category, cIdx) => (
                    <div key={cIdx} className="bg-white p-6 rounded-xl shadow-lg border-t-4 border-indigo-600">
                        <h3 className="text-xl font-bold text-indigo-700 mb-4 flex items-center">
                            <category.icon className="w-5 h-5 mr-3 flex-shrink-0 text-indigo-500"/>
                            {category.title}
                        </h3>
                        <div className="flex flex-wrap gap-2">
                            {category.values.map((value: string, vIdx: number) => ( 
                                <span
                                    key={vIdx}
                                    className="bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full font-medium text-sm border border-indigo-200"
                                >
                                    {value}
                                </span>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
          </div>
        </section>
      )}


      {/* 3. Service Intro - 導入と共感 (選ばれる理由セクション) */}
      <section className="bg-white max-w-5xl mx-auto px-6 py-16">
        <h2 className="text-3xl font-bold text-center text-gray-800 mb-10">
            {storeName}の特徴
        </h2>
        
        {contentBlocks.length > 0 ? (
            <div className="space-y-12">
                {contentBlocks.map(({ title, content }, i) => (
                    <div key={i} className="p-6 border-l-4 border-indigo-500 bg-gray-50 rounded-lg shadow-md">
                        <h3 className="text-xl font-extrabold text-indigo-700 mb-4 flex items-center">
                            <span className="text-3xl font-black mr-3 text-indigo-500">{i + 1}.</span>
                            {title}
                        </h3>
                        <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                            {content}
                        </p>
                    </div>
                ))}
            </div>
        ) : (
            <div className="text-center text-gray-600 italic">
                <p>{description || "この店舗の紹介文が未登録です。"}</p>
            </div>
        )}
      </section>
      
      {/* 4. Gallery - 視覚的訴求 */}
      {galleryImageUrls.length > 0 && (
        <section className="max-w-6xl mx-auto px-6 py-16">
          <h2 className="text-3xl font-bold text-center mb-10 text-gray-800">
            店舗の雰囲気・サービス風景
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {galleryImageUrls.map((url: string, i: number) => ( 
              <img
                key={i}
                src={url}
                alt={`ギャラリー画像 ${i + 1}`}
                className="w-full h-64 object-cover rounded-xl shadow-lg transform hover:scale-[1.02] transition duration-300"
              />
            ))}
          </div>
        </section>
      )}

      {/* 5. Final CTA - 逃さない行動喚起 */}
      <section className="bg-gradient-to-r from-blue-700 to-indigo-700 py-16 text-center text-white">
        <h2 className="text-3xl md:text-4xl font-extrabold mb-4">
          **迷う前に、まずは専門家にご相談ください。**
        </h2>
        <p className="text-xl mb-8 font-light">
          {storeName}が、あなたの理想を叶えるお手伝いをいたします。
        </p>
        <LineCTAButton 
            text="LINEで無料相談・予約する (最短1分)" 
            className="bg-white text-green-700 hover:bg-gray-100"
        />
        <p className="text-sm mt-4 text-indigo-200">
            （営業時間外でも24時間受付中です）
        </p>
      </section>

      {/* 6. Store Info - 信頼の確保 */}
      <section className="bg-white py-12 border-t">
        <div className="max-w-4xl mx-auto px-6 space-y-4 text-gray-700">
          <h2 className="text-2xl font-bold mb-6 border-b pb-2 text-gray-800">店舗概要・アクセス</h2>
          <div className="space-y-3">
              <p className="flex items-start">
                  <FaMapMarkerAlt className="w-5 h-5 mr-3 mt-1 text-indigo-500 flex-shrink-0"/> 
                  <strong>住所：</strong> {address || "未登録"}
              </p>
              <p className="flex items-start">
                  <FaPhone className="w-5 h-5 mr-3 mt-1 text-indigo-500 flex-shrink-0"/> 
                  <strong>電話番号：</strong> <a href={`tel:${phoneNumber}`} className="text-blue-600 hover:underline">{phoneNumber || "未登録"}</a>
              </p>
              {websiteUrl && (
                  <p className="flex items-start">
                      <FaGlobe className="w-5 h-5 mr-3 mt-1 text-indigo-500 flex-shrink-0"/>
                      <strong>Webサイト：</strong>
                      <a href={websiteUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline hover:text-blue-800 break-words">
                          {websiteUrl}
                      </a>
                  </p>
              )}
              {lineOfficialId && (
                  <p className="flex items-start">
                      <FaLine className="w-5 h-5 mr-3 mt-1 text-indigo-500 flex-shrink-0"/> 
                      <strong>LINE公式ID：</strong>{lineOfficialId}
                  </p>
              )}
              {targetUserInterests && (
                  <p className="flex items-start p-3 bg-gray-100 rounded-md">
                      <strong>AIターゲット関心事：</strong>{targetUserInterests}
                  </p>
              )}
          </div>

          {/* Google Map埋め込み (住所がある場合) */}
          {address && (
              <div className="mt-8 border rounded-xl overflow-hidden shadow-md">
                <iframe 
                  width="100%" 
                  height="400" 
                  style={{ border: 0 }} 
                  loading="lazy" 
                  allowFullScreen 
                  src={`https://maps.google.co.jp/maps?output=embed&q=${encodeURIComponent(address)}`}
                ></iframe>
              </div>
          )}

          <p className="text-gray-400 text-xs pt-4 text-right">
            最終更新日：{createdAt ? new Date(createdAt).toLocaleDateString("ja-JP") : "未登録"}
          </p>
        </div>
      </section>
    </>
  );
}

export default UniversalStoreLanding;

