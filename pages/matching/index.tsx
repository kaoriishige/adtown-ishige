import React, { useState } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import { RiCheckLine } from "react-icons/ri";

// ★ 共通カテゴリ定義をインポート
import { categoryData, mainCategories } from "../../lib/categoryData";
// ★★★ お店側が使う「強み」のテンプレートをインポート ★★★
import { VALUE_QUESTIONS } from "../../lib/aiValueTemplate";

const MatchingPage = () => {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [mainCategory, setMainCategory] = useState("");
  const [subCategory, setSubCategory] = useState(""); // 例: "パン屋（ベーカリー）"
  const [area, setArea] = useState("");
  const [selectedValues, setSelectedValues] = useState<string[]>([]); // ユーザーが選んだ「強み」
  
  const areas = ["那須塩原市", "大田原市", "那須町", "どこでも"];
  const MAX_SELECTION = 3;

  // --- ステップ制御 ---

  // Step 1: 大カテゴリ選択
  const handleMainCategorySelect = (category: string) => {
    setMainCategory(category);
    setSubCategory("");
    setArea("");
    setSelectedValues([]);
    setStep(2); // -> Step 2 (小カテゴリ) へ
  };

  // Step 2: 小カテゴリ選択
  const handleSubCategorySelect = (category: string) => {
    setSubCategory(category);
    setArea("");
    setSelectedValues([]);
    setStep(3); // -> Step 3 (エリア) へ
  };

  // Step 3: エリア選択
  const handleAreaSelect = (selectedArea: string) => {
    setArea(selectedArea);
    setSelectedValues([]);
    // ★「その他」には価値観の質問がないので、Step 4をスキップする
    if (subCategory === "その他") {
      handleFindMatches(selectedArea, []); // 価値観なしで検索
    } else {
      setStep(4); // -> Step 4 (価値観) へ
    }
  };

  // Step 4: 価値観のトグル処理
  const handleValueToggle = (value: string) => {
    setSelectedValues((prev) => {
      const isSelected = prev.includes(value);
      if (isSelected) {
        return prev.filter((v) => v !== value);
      }
      if (prev.length < MAX_SELECTION) {
        return [...prev, value];
      }
      return prev;
    });
  };

  // Step 4 -> Step 5 (結果ページへ)
  const handleFindMatches = (
    selectedArea: string,
    finalValues: string[]
  ) => {
    router.push({
      pathname: "/matching/results", // ← マッチング結果ページ
      query: {
        mainCategory: mainCategory,
        subCategory: subCategory,
        area: selectedArea,
        // ★ ユーザーが選んだ「強み」の文字列をそのまま渡す
        values: finalValues.join(","), 
      },
    });
  };

  // 戻るボタンの処理
  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    } else {
      router.push("/search-dashboard");
    }
  };
  
  // --- 表示用データ ---
  
  // Step 2 (小カテゴリ) で表示するリスト
  const currentSubCategories = categoryData[mainCategory] || [];

  // ★★★ Step 4 (価値観) で表示する質問セット ★★★
  // 選ばれた小カテゴリ（例: "パン屋（ベーカリー）"）をキーにして
  // `aiValueTemplate` から直接、質問と回答のセットを取得
  const currentQuestionsSet = VALUE_QUESTIONS[subCategory];

  return (
    <>
      <Head>
        <title>AIクイックマッチ | みんなのナス</title>
      </Head>

      <div className="min-h-screen bg-gray-50 flex flex-col items-center px-6 py-10 pb-24">
        <h1 className="text-3xl font-bold mb-6 text-center">AIクイックマッチ</h1>

        {/* ステップ表示 */}
        <div className="flex justify-center mb-8 text-sm text-gray-600">
          <div className={`mx-2 ${step === 1 ? "font-bold text-blue-600" : ""}`}>Step 1: 業種</div>
          <div className={`mx-2 ${step === 2 ? "font-bold text-blue-600" : ""}`}>Step 2: 詳細</div>
          <div className={`mx-2 ${step === 3 ? "font-bold text-blue-600" : ""}`}>Step 3: エリア</div>
          {subCategory !== "その他" && ( //「その他」を選んだ時はStep4を表示しない
             <div className={`mx-2 ${step === 4 ? "font-bold text-blue-600" : ""}`}>Step 4: 好み</div>
          )}
        </div>

        {/* Step 1：大分類 */}
        {step === 1 && (
          <div className="w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4 text-center">業種の大分類を選んでください</h2>
            <div className="grid grid-cols-2 gap-3">
              {mainCategories.map((cat: string) => (
                <button
                  key={cat}
                  onClick={() => handleMainCategorySelect(cat)}
                  className="p-3 rounded-xl border text-center font-medium bg-white hover:bg-blue-50"
                >
                  {cat}
                </button>
              ))}
            </div>
            <div className="mt-6 flex justify-center">
              <button onClick={handleBack} className="px-6 py-2 rounded-xl bg-gray-300">
                戻る
              </button>
            </div>
          </div>
        )}
        
        {/* Step 2：小分類 */}
        {step === 2 && (
          <div className="w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4 text-center">
              「{mainCategory}」の詳しい業種は？
            </h2>
            <div className="grid grid-cols-2 gap-3">
              {currentSubCategories.map((sub: string) => (
                 <button
                  key={sub}
                  onClick={() => handleSubCategorySelect(sub)}
                  className="p-3 rounded-xl border text-center text-sm font-medium bg-white hover:bg-blue-50"
                >
                  {sub}
                </button>
              ))}
            </div>
             <div className="mt-6 flex justify-center">
              <button onClick={handleBack} className="px-6 py-2 rounded-xl bg-gray-300">
                戻る
              </button>
            </div>
          </div>
        )}

        {/* Step 3：エリア */}
        {step === 3 && (
          <div className="w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4 text-center">エリアを選んでください</h2>
            <div className="grid grid-cols-2 gap-3">
              {areas.map((a: string) => (
                <button
                  key={a}
                  onClick={() => handleAreaSelect(a)}
                  className="p-4 rounded-xl border text-center font-medium bg-white hover:bg-blue-100"
                >
                  {a}
                </button>
              ))}
            </div>
            <div className="mt-6 flex justify-center">
              <button onClick={handleBack} className="px-6 py-2 rounded-xl bg-gray-300">
                戻る
              </button>
            </div>
          </div>
        )}

        {/* ★ Step 4：価値観（好み）の選択 */}
        {/*
          `currentQuestionsSet` (例: "パン屋" の質問セット) が存在する場合のみ表示
          これが、パン屋を選んだ時に「宴会」などの質問が出ないようにするロジックです。
        */}
        {step === 4 && currentQuestionsSet && (
          <div className="w-full max-w-lg"> {/* 少し幅を広げる */}
            <h2 className="text-xl font-semibold mb-2 text-center">
              お店のこだわりを選んでください
            </h2>
            <p className="text-center text-sm text-gray-600 mb-2">
              （{subCategory}）
            </p>
            <p className="text-center text-red-600 font-medium mb-4">
              ({selectedValues.length} / {MAX_SELECTION} 選択中)
            </p>
            
            {/* 質問セット（5項目）をループ */}
            {Object.entries(currentQuestionsSet).map(([question, options]) => (
              <div key={question} className="mb-4 p-4 bg-white rounded-lg shadow-sm">
                <h3 className="font-bold text-indigo-700 mb-2">{question}</h3>
                <div className="grid grid-cols-2 gap-2">
                  {/* 回答（5選択肢）をループ */}
                  {options.map((option: string) => {
                    const isSelected = selectedValues.includes(option);
                    const isDisabled = !isSelected && selectedValues.length >= MAX_SELECTION;
                    return (
                      <button
                        key={option}
                        onClick={() => handleValueToggle(option)}
                        disabled={isDisabled}
                        className={`p-2 rounded-md border text-left text-sm ${
                          isSelected
                            ? "bg-blue-600 text-white font-bold"
                            : "bg-gray-50 hover:bg-blue-50"
                        } ${isDisabled ? "opacity-50 cursor-not-allowed" : ""}`}
                      >
                        {isSelected && <RiCheckLine className="inline mr-1" />}
                        {option}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}

            <div className="mt-8 flex justify-between">
              <button onClick={handleBack} className="px-6 py-2 rounded-xl bg-gray-300">
                戻る
              </button>
              <button
                onClick={() => handleFindMatches(area, selectedValues)} // ★ 実行
                disabled={selectedValues.length === 0}
                className={`px-6 py-3 rounded-xl text-lg font-bold ${
                  selectedValues.length > 0
                    ? "bg-green-600 text-white"
                    : "bg-gray-300"
                }`}
              >
                マッチング結果を見る
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default MatchingPage;





