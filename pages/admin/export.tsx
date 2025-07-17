// pages/admin/export.tsx
// ✅これは「CSV出力とURL確認」の管理ページです。

import { useState, useEffect } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../lib/firebase";

export default function AdminExportPage() {
  const [csvUrl, setCsvUrl] = useState("");
  const [lastUpdated, setLastUpdated] = useState("");
  const [loading, setLoading] = useState(false);
  const [executing, setExecuting] = useState(false);
  const [error, setError] = useState("");

  const fetchCsvInfo = async () => {
    try {
      setLoading(true);
      const docRef = doc(db, "exports", "referralSummaryCsvUrl");
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        setCsvUrl(data.url);
        setLastUpdated(data.updatedAt);
      }
    } catch (e) {
      setError("CSV情報の取得に失敗しました");
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      setExecuting(true);
      const res = await fetch("/api/execute-export", {
        method: "POST",
      });
      if (!res.ok) throw new Error("実行失敗");
      await fetchCsvInfo();
    } catch (e) {
      setError("CSV出力に失敗しました");
    } finally {
      setExecuting(false);
    }
  };

  useEffect(() => {
    fetchCsvInfo();
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">紹介報酬CSV出力</h1>

      <button
        onClick={handleExport}
        disabled={executing}
        className="mb-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
      >
        {executing ? "出力中..." : "CSV出力を実行する"}
      </button>

      {loading ? (
        <p>CSV情報を取得中...</p>
      ) : csvUrl ? (
        <div className="bg-gray-50 p-4 border rounded">
          <p className="text-sm mb-2">🕒 最終更新: {new Date(lastUpdated).toLocaleString()}</p>
          <a
            href={csvUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 underline"
          >
            🔽 CSVファイルをダウンロード
          </a>
        </div>
      ) : (
        <p className="text-gray-500">まだ出力されたCSVはありません。</p>
      )}

      {error && <p className="text-red-500 mt-4">{error}</p>}
    </div>
  );
}


