import type { NextApiRequest, NextApiResponse } from 'next';
import { doc, getDoc, deleteDoc } from 'firebase/firestore';
import { ref, deleteObject } from 'firebase/storage';
import { db, storage } from '@/lib/firebase';
// TODO: サーバーサイドでユーザーIDを取得する仕組みをインポート

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'DELETE') {
    res.setHeader('Allow', ['DELETE']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  try {
    const { dealId } = req.query;
    if (typeof dealId !== 'string' || !dealId) {
      return res.status(400).json({ error: 'IDが無効です。' });
    }

    // TODO: サーバーサイドでログインユーザーIDを取得する
    const userId = "ここに、現在ログインしているユーザーのIDを取得する処理を実装してください";
    if (!userId) {
       return res.status(401).json({ error: '認証情報が取得できませんでした。' });
    }

    // ★ 修正点: コレクション名を'storeDeals'に統一
    const dealDocRef = doc(db, 'storeDeals', dealId);
    const dealDoc = await getDoc(dealDocRef);

    if (!dealDoc.exists()) {
      return res.status(404).json({ error: '削除対象のデータが見つかりません。' });
    }
    
    const dealData = dealDoc.data();

    // 権限チェック
    const storeRef = doc(db, 'stores', dealData.storeId);
    const storeSnap = await getDoc(storeRef);
    if (!storeSnap.exists() || storeSnap.data().ownerId !== userId) {
      return res.status(403).json({ error: 'このデータを削除する権限がありません。' });
    }

    // ★ 追加機能: Storageに画像があれば削除する
    if (dealData.imageUrl) {
      try {
        const imageRef = ref(storage, dealData.imageUrl);
        await deleteObject(imageRef);
      } catch (storageError: any) {
        // ファイルが存在しないエラーは無視して処理を続行
        if (storageError.code !== 'storage/object-not-found') {
          throw storageError; // その他のエラーは問題として処理
        }
      }
    }
    
    // Firestoreのドキュメントを削除
    await deleteDoc(dealDocRef);

    return res.status(200).json({ message: '正常に削除されました。' });

  } catch (error) {
    console.error('削除APIでエラー:', error);
    return res.status(500).json({ error: 'サーバーでエラーが発生しました。' });
  }
}