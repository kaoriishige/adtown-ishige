// pages/recruit/ai-start.tsx
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { getAuth } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function AiStart() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    const load = async () => {
      const auth = getAuth();
      const user = auth.currentUser;

      if (!user) {
        router.push("/login");
        return;
      }

      const snap = await getDoc(doc(db, "users", user.uid));
      const data = snap.data() || {};

      const raw = (data.verificationStatus || "").toLowerCase();

      if (raw === "verified") {
        setStatus("verified");
      } else if (raw === "pending") {
        setStatus("pending");
      } else if (raw === "rejected") {
        setStatus("rejected");
      } else {
        setStatus("draft");
      }

      setLoading(false);
    };

    load();
  }, []);

  if (loading) return <div>読み込み中...</div>;

  if (status !== "verified") {
    return (
      <div style={{ padding: 20 }}>
        <h2>企業プロフィールが未登録です。</h2>
        <p>AIマッチング機能を開始するには、先に企業プロフィールを完成させ、AI審査の承認を受けてください。</p>
        <button
          onClick={() => router.push("/profile/company")}
          style={{ marginTop: 20, padding: "10px 20px", background: "#0070f3", color: "#fff", borderRadius: 6 }}
        >
          プロフィール編集ページへ
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: 20 }}>
      <h2>AIマッチング設定を開始できます</h2>
      <button
        onClick={() => router.push("/recruit/ai-values-editor")}
        style={{ marginTop: 20, padding: "10px 20px", background: "#0070f3", color: "#fff", borderRadius: 6 }}
      >
        AI設定へ進む
      </button>
    </div>
  );
}

