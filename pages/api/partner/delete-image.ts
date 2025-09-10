import type { NextApiRequest, NextApiResponse } from 'next';
import { doc, getDoc, updateDoc, arrayRemove } from 'firebase/firestore';
import { ref, deleteObject } from 'firebase/storage';
import { db, storage } from '@/lib/firebase';
// TODO: サーバーサイドでユーザーIDを取得する仕組みをインポート

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { storeId, imageUrl } = req.body;
    // TODO: サーバーサイドでログインユーザーIDを取得する
    const userId = "ここに、現在ログインしているユーザーのIDを取得する処理を実装してください";
    
    if (!userId) {
      return res.status(401).json({ error: '認証が必要です。' });
    }
    if (!storeId || !imageUrl) {
      return res.status(400).json({ error: '不正なリクエストです。' });
    }

    // --- 権限チェック ---
    const storeDocRef = doc(db, 'stores', storeId);
    const storeDoc = await getDoc(storeDocRef);

    if (!storeDoc.exists() || storeDoc.data().ownerId !== userId) {
      return res.status(403).json({ error: 'この操作を行う権限がありません。' });
    }

    // 1. Storageから画像ファイルを削除
    const imageRef = ref(storage, imageUrl);
    await deleteObject(imageRef);

    // 2. Firestoreのドキュメントから画像URLを削除
    await updateDoc(storeDocRef, {
      photoUrls: arrayRemove(imageUrl)
    });

    return res.status(200).json({ message: '画像を削除しました。' });

  } catch (error: any) {
    // ファイルが存在しないエラーは無視してもよい
    if (error.code === 'storage/object-not-found') {
      return res.status(200).json({ message: 'Storage上のファイルは見つかりませんでしたが、DBからは削除しました。' });
    }
    console.error('画像削除APIでエラー:', error);
    return res.status(500).json({ error: 'サーバーでエラーが発生しました。' });
  }
}