// pages/partner/ai-values-form.tsx
import React, { useState } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs, addDoc, query, where } from "firebase/firestore";

// -------------------------
// 型定義
// -------------------------
interface QuestionSet {
  category: string;
  subCategory: string;
  questions: string[];
}

// -------------------------
// コンポーネント
// -------------------------
const AiValuesForm: React.FC = () => {
  const [category, setCategory] = useState("");
  const [subCategory, setSubCategory] = useState("");
  const [questions, setQuestions] = useState<string[]>([]);
  const [answers, setAnswers] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  // -------------------------
  // 大分類と小分類一覧
  // -------------------------
  const categories: Record<string, string[]> = {
    "飲食関連": [
      "レストラン・食堂",
      "カフェ・喫茶店",
      "居酒屋",
      "バー",
      "パン屋（ベーカリー）",
      "和菓子・洋菓子店",
      "ラーメン店",
      "そば・うどん店",
      "寿司屋",
      "惣菜・仕出し・ケータリング",
      "テイクアウト専門店",
      "その他",
    ],
    "買い物関連": [
      "農産物直売所",
      "鮮魚店",
      "雑貨店・民芸品店",
      "花屋",
      "お土産店",
      "リサイクルショップ",
      "道の駅・特産品店",
      "その他",
    ],
    "美容・健康関連": [
      "美容室",
      "ネイルサロン",
      "エステサロン",
      "リラクゼーション",
      "マッサージ",
      "整体・整骨院・鍼灸院",
      "カイロプラクティック",
      "クリニック・歯科医院",
      "薬局・ドラッグストア",
      "その他",
    ],
    "住まい・暮らし関連": [
      "工務店・建築・リフォーム",
      "リフォーム専門店",
      "水道・電気工事",
      "不動産会社",
      "造園・植木屋",
      "ハウスクリーニング",
      "家電修理・メンテナンス",
      "便利屋",
      "その他",
    ],
    "教育・習い事関連": [
      "学習塾・家庭教師",
      "ピアノ・音楽教室",
      "英会話教室",
      "書道・そろばん教室",
      "ダンス教室",
      "スポーツクラブ・道場",
      "パソコン教室",
      "料理教室",
      "学童保育",
      "その他",
    ],
    "スポーツ関連": [
      "スポーツ施設・ジム",
      "ゴルフ練習場",
      "フィットネス・ヨガ",
      "スポーツ用品店",
      "武道・格闘技道場",
      "その他",
    ],
    "車・バイク関連": [
      "自動車販売（新車・中古）",
      "自動車整備・修理工場",
      "ガソリンスタンド",
      "カー用品店",
      "バイクショップ",
      "その他",
    ],
    "観光・レジャー関連": [
      "ホテル・旅館・ペンション",
      "日帰り温泉施設",
      "観光施設・美術館・博物館",
      "体験工房（陶芸・ガラスなど）",
      "牧場・農園",
      "キャンプ場・グランピング施設",
      "ゴルフ場",
      "貸し別荘",
      "乗馬・アクティビティ体験",
      "釣り堀・アウトドア体験",
      "観光ガイド・地域案内",
      "その他",
    ],
    "ペット関連": [
      "動物病院",
      "トリミングサロン",
      "ペットホテル・ドッグラン",
      "ブリーダー",
      "動物カフェ",
      "その他",
    ],
    "専門サービス関連": [
      "弁護士・税理士・行政書士などの士業",
      "デザイン・印刷会社",
      "写真館",
      "Web制作・動画制作",
      "翻訳・通訳サービス",
      "保険代理店",
      "カウンセリング",
      "コンサルティング",
      "その他",
    ],
    "その他": ["その他"],
  };

  // -------------------------
  // 質問を取得
  // -------------------------
  const fetchQuestions = async (cat: string, sub: string) => {
    setLoading(true);
    const q = query(
      collection(db, "businessValues"),
      where("category", "==", cat),
      where("subCategory", "==", sub)
    );
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      const data = snapshot.docs[0].data() as QuestionSet;
      setQuestions(data.questions);
      setAnswers(Array(data.questions.length).fill(""));
    } else {
      setQuestions([]);
      alert("この業種の質問テンプレートは未登録です。");
    }
    setLoading(false);
  };

  // -------------------------
  // 回答変更
  // -------------------------
  const handleAnswerChange = (i: number, value: string) => {
    const updated = [...answers];
    updated[i] = value;
    setAnswers(updated);
  };

  // -------------------------
  // 保存処理
  // -------------------------
  const saveAnswers = async () => {
    if (!category || !subCategory) {
      alert("カテゴリと小分類を選択してください。");
      return;
    }
    if (answers.length === 0) {
      alert("質問がありません。");
      return;
    }
    await addDoc(collection(db, "storeValues"), {
      category,
      subCategory,
      answers,
      createdAt: new Date(),
    });
    alert("保存しました！");
    setAnswers([]);
    setQuestions([]);
    setSubCategory("");
  };

  // -------------------------
  // 画面表示
  // -------------------------
  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">店舗価値観登録フォーム（AIマッチング用）</h1>

      <div className="bg-white p-4 rounded shadow space-y-4">
        {/* カテゴリ選択 */}
        <select
          value={category}
          onChange={(e) => {
            setCategory(e.target.value);
            setSubCategory("");
            setQuestions([]);
          }}
          className="border p-2 w-full"
        >
          <option value="">カテゴリを選択</option>
          {Object.keys(categories).map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>

        {/* 小分類選択 */}
        {category && (
          <select
            value={subCategory}
            onChange={(e) => {
              setSubCategory(e.target.value);
              fetchQuestions(category, e.target.value);
            }}
            className="border p-2 w-full"
          >
            <option value="">小分類を選択</option>
            {categories[category].map((sub) => (
              <option key={sub} value={sub}>
                {sub}
              </option>
            ))}
          </select>
        )}

        {/* 質問表示 */}
        {loading ? (
          <p>読み込み中...</p>
        ) : (
          questions.map((q, i) => (
            <div key={i} className="border p-3 rounded">
              <p className="font-semibold">{q}</p>
              <textarea
                className="border p-2 w-full mt-2"
                rows={2}
                placeholder="回答を入力"
                value={answers[i] || ""}
                onChange={(e) => handleAnswerChange(i, e.target.value)}
              />
            </div>
          ))
        )}

        {/* 保存ボタン */}
        {questions.length > 0 && (
          <button
            onClick={saveAnswers}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            保存する
          </button>
        )}
      </div>
    </div>
  );
};

export default AiValuesForm;


