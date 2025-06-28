'use client';

import { useEffect, useState } from 'react';
import { getAuth, onAuthStateChanged, User } from 'firebase/auth';
import { useRouter } from 'next/navigation';

export default function HelpPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
      } else {
        router.push('/login');
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [router]);

  if (loading) return <p className="p-6 text-gray-600">読み込み中...</p>;

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">❓ ChatGPT 質問ガイド</h1>

      <p className="mb-4 text-gray-700">
        このページは、納品後の運営者・管理者が「ChatGPTに質問するときの正しい聞き方」を解説します。
      </p>

      <h2 className="text-lg font-semibold mt-6 mb-2">✅ 基本テンプレート</h2>
      <pre className="bg-gray-100 p-3 rounded text-sm overflow-auto">
{`※これは「みんなの那須アプリ」プロジェクトの続きです。

ChatGPTがやってくれない理由①②③を理解した前提で進めてください。

✅やってほしいこと：◯◯◯（1行）
✅現在地：ここまで終わってる → ◯◯◯
✅ゴール：◯◯◯が完成していればOK

✅Canvasを使わず、ここに全コードを貼ってください。説明不要です。`}
      </pre>

      <h2 className="text-lg font-semibold mt-6 mb-2">✅ スクショ付きで質問する方法</h2>
      <ul className="list-disc pl-6 text-sm text-gray-800">
        <li>スクリーンショットは画像でアップロード</li>
        <li>画像を貼った後、「この赤波線を消すには？」など短く聞く</li>
        <li>「このコードの意味は？」などもOK</li>
      </ul>

      <h2 className="text-lg font-semibold mt-6 mb-2">✅ 例（そのまま使える）</h2>
      <pre className="bg-gray-100 p-3 rounded text-sm overflow-auto">
{`✅やってほしいこと：/admin/apps に削除ボタンを追加して Firestore 連動
✅現在地：一覧表示はできている。削除処理は未実装
✅ゴール：削除しても Firestore 上から消えることを確認したい`}
      </pre>

      <p className="mt-6 text-sm text-gray-500">
        ※ この内容はカスタマイズして使ってください。社内用マニュアルとしてもご自由に。
      </p>
    </div>
  );
}
