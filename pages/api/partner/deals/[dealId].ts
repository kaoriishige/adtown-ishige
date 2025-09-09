import type { NextApiRequest, NextApiResponse } from 'next';
import { doc, getDoc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase'; // TODO: あなたが設定したFirebaseのインポートパスを確認してください
// import { getUserIdFromServerSession } from '../../../../../lib/auth'; // TODO: サーバーサイドでユーザーIDを取得する関数をインポート

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // DELETEリクエスト以外は405 Method Not Allowedエラーを返す
  if (req.method !== 'DELETE') {
    res.setHeader('Allow', ['DELETE']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  try {
    const { dealId } = req.query;

    if (typeof dealId !== 'string') {
      return res.status(400).json({ error: '無効なIDです。' });
    }

    // TODO: 実際の認証ライブラリに合わせて、サーバーサイドでユーザーIDを取得する処理に置き換えてください。
    // 例: const userId = await getUserIdFromServerSession(req);
    const userId = "ここに現在ログインしているユーザーのIDを取得する処理"; // <<< 要変更

    if (!userId) {
      return res.status(401).json({ error: '認証が必要です。' });
    }

    // --- 安全のための権限チェック ---
    const dealDocRef = doc(db, 'storeDeals', dealId); // 削除対象のドキュメント
    const dealDoc = await getDoc(dealDocRef);

    if (!dealDoc.exists()) {
      return res.status(404).json({ error: '対象の情報が見つかりません。' });
    }

    // 削除しようとしている情報の所有者ID(storeIdからオーナーIDを引く想定)と、
    // 現在ログインしているユーザーのIDを比較するなどの権限チェックをここで行う。
    // この例では、dealにstoreIdがあり、storeにownerIdがあることを想定。
    const storeDocRef = doc(db, 'stores', dealDoc.data().storeId);
    const storeDoc = await getDoc(storeDocRef);

    if (!storeDoc.exists() || storeDoc.data().ownerId !== userId) {
        return res.status(403).json({ error: 'この情報を削除する権限がありません。' });
    }
    // --- 権限チェックここまで ---


    // 権限チェックをパスしたら、ドキュメントを削除
    await deleteDoc(dealDocRef);

    // 成功した場合はJSONでメッセージを返す
    return res.status(200).json({ message: '削除に成功しました。' });

  } catch (error) {
    console.error('削除処理でエラーが発生しました:', error);
    // エラーが発生した場合も、JSONでエラーメッセージを返す
    return res.status(500).json({ error: 'サーバー内部でエラーが発生しました。' });
  }
}