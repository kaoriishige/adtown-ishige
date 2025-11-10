// pages/admin/ai-values-editor.tsx
import React, { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs, addDoc, updateDoc, doc } from "firebase/firestore";

interface QuestionSet {
  category: string;      // 例：「飲食関連」
  subCategory: string;   // 例：「居酒屋」
  questions: string[];   // 質問配列
}

const AiValuesEditor: React.FC = () => {
  const [category, setCategory] = useState("");
  const [subCategory, setSubCategory] = useState("");
  const [questions, setQuestions] = useState<string[]>([""]);
  const [templates, setTemplates] = useState<QuestionSet[]>([]);
  const [loading, setLoading] = useState(false);

  // Firestoreから既存テンプレートを取得
  const fetchTemplates = async () => {
    const snapshot = await getDocs(collection(db, "businessValues"));
    const data = snapshot.docs.map((doc) => doc.data() as QuestionSet);
    setTemplates(data);
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  // 質問追加
  const addQuestion = () => {
    setQuestions([...questions, ""]);
  };

  // 質問入力変更
  const handleQuestionChange = (index: number, value: string) => {
    const updated = [...questions];
    updated[index] = value;
    setQuestions(updated);
  };

  // 登録処理
  const saveTemplate = async () => {
    if (!category || !subCategory) {
      alert("カテゴリと小分類を入力してください。");
      return;
    }
    setLoading(true);
    try {
      const ref = collection(db, "businessValues");
      await addDoc(ref, { category, subCategory, questions });
      alert("登録しました！");
      setCategory("");
      setSubCategory("");
      setQuestions([""]);
      fetchTemplates();
    } catch (err) {
      console.error(err);
      alert("エラーが発生しました。");
    }
    setLoading(false);
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">AIマッチング用 価値観テンプレート登録</h1>

      <div className="space-y-3 bg-white p-4 rounded shadow">
        <input
          className="border p-2 w-full"
          placeholder="カテゴリ（例：飲食関連）"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        />
        <input
          className="border p-2 w-full"
          placeholder="小分類（例：居酒屋）"
          value={subCategory}
          onChange={(e) => setSubCategory(e.target.value)}
        />

        {questions.map((q, i) => (
          <input
            key={i}
            className="border p-2 w-full"
            placeholder={`質問${i + 1}`}
            value={q}
            onChange={(e) => handleQuestionChange(i, e.target.value)}
          />
        ))}

        <button
          onClick={addQuestion}
          className="bg-gray-200 px-3 py-2 rounded hover:bg-gray-300"
        >
          質問を追加
        </button>

        <button
          onClick={saveTemplate}
          disabled={loading}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          {loading ? "登録中..." : "登録する"}
        </button>
      </div>

      <h2 className="text-xl font-semibold mt-6 mb-2">登録済みテンプレート</h2>
      <div className="space-y-2">
        {templates.map((t, i) => (
          <div key={i} className="border p-3 rounded bg-gray-50">
            <div className="font-bold">{t.category} ＞ {t.subCategory}</div>
            <ul className="list-disc ml-6">
              {t.questions.map((q, j) => (
                <li key={j}>{q}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AiValuesEditor;
