import type { NextApiRequest, NextApiResponse } from 'next';
import { doc, getDoc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

// TODO: あなたのプロジェクトで、サーバーサイドで認証情報を取得するためのライブラリをインポートしてください。
// 例: import { getToken } from 'next-auth/jwt';
// 例: import { auth as adminAuth } from 'firebase-admin';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // 1. DELETEリクエスト以外は拒否
  if (req.method !== 'DELETE') {
    res.setHeader('Allow', ['DELETE']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  try {
    const { dealId } = req.query;

    if (typeof dealId !== 'string' || !dealId) {
      return res.status(400).json({ error: 'IDが無効です。' });
    }

    /*
     * 2. 認証チェック
     * TODO: この部分は、あなたのアプリの認証の仕組みに合わせて実装する必要があります。
     * サーバーサイドで安全にユーザーIDを取得してください。
     */
    // --- ↓↓↓ 必ずあなたの認証方法に書き換えてください ↓↓↓ ---
    // 例: const token = await getToken({ req }); const userId = token?.sub;
    const userId = "ここに、現在ログインしているユーザーのIDを取得する処理を実装してください";
    if (!userId || typeof userId !== 'string') {
       return res.status(401).json({ error: '認証情報が取得できませんでした。' });
    }
    // --- ↑↑↑ 必ずあなたの認証方法に書き換えてください ↑↑↑ ---

    // 3. 権限チェック：削除しようとしているデータのオーナーが、ログインユーザー本人であるか確認
    const dealDocRef = doc(db, 'storeDeals', dealId); // 削除対象のコレクション名を指定
    const dealDoc = await getDoc(dealDocRef);

    if (!dealDoc.exists()) {
      return res.status(404).json({ error: '削除対象のデータが見つかりません。' });
    }
    
    // このお得情報が属する店舗の情報を取得
    const storeRef = doc(db, 'stores', dealDoc.data().storeId);
    const storeSnap = await getDoc(storeRef);

    // 店舗が存在しないか、店舗のオーナーIDがログインユーザーIDと一致しない場合は拒否
    if (!storeSnap.exists() || storeSnap.data().ownerId !== userId) {
      return res.status(403).json({ error: 'このデータを削除する権限がありません。' });
    }

    // 4. すべてのチェックをパスしたら削除を実行
    await deleteDoc(dealDocRef);

    // 5. 成功の応答を返す
    return res.status(200).json({ message: '正常に削除されました。' });

  } catch (error) {
    console.error('削除APIでエラー:', error);
    return res.status(500).json({ error: 'サーバーでエラーが発生しました。' });
  }
}