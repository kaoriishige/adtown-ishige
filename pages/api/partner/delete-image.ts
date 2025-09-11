import type { NextApiRequest, NextApiResponse } from 'next';
import { doc, getDoc, updateDoc, arrayRemove } from 'firebase/firestore';
import { ref, deleteObject } from 'firebase/storage';
import { db, storage } from '@/lib/firebase';

// TODO: あなたのプロジェクトで、サーバーサイドで認証情報を取得するためのライブラリをインポートしてください。
// 例: import { getToken } from 'next-auth/jwt';
// 例: import { auth as adminAuth } from 'firebase-admin';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // 1. POSTリクエスト以外は拒否
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { storeId, imageUrl } = req.body;

    /*
     * 2. 認証チェック
     * TODO: この部分は、あなたのアプリの認証の仕組みに合わせて実装する必要があります。
     * サーバーサイドで安全にユーザーIDを取得してください。
     */
    // --- ↓↓↓ 必ずあなたの認証方法に書き換えてください ↓↓↓ ---
    // 例: const token = await getToken({ req }); const userId = token?.sub;
    const userId = "ここに、現在ログインしているユーザーのIDを取得する処理を実装してください";
    // --- ↑↑↑ 必ずあなたの認証方法に書き換えてください ↑↑↑ ---

    if (!userId || typeof userId !== 'string') {
       return res.status(401).json({ error: '認証情報が取得できませんでした。' });
    }
    if (!storeId || !imageUrl) {
      return res.status(400).json({ error: '不正なリクエストです。' });
    }

    // 3. 権限チェック：削除しようとしているデータのオーナーが、ログインユーザー本人であるか確認
    const storeDocRef = doc(db, 'stores', storeId);
    const storeDoc = await getDoc(storeDocRef);

    // 店舗が存在しないか、店舗のオーナーIDがログインユーザーIDと一致しない場合は拒否
    if (!storeDoc.exists() || storeDoc.data().ownerId !== userId) {
      return res.status(403).json({ error: 'この操作を行う権限がありません。' });
    }

    // 4. Storageから画像ファイルを削除
    const imageRef = ref(storage, imageUrl);
    await deleteObject(imageRef);

    // 5. Firestoreのドキュメントから画像URLを削除
    await updateDoc(storeDocRef, {
      photoUrls: arrayRemove(imageUrl)
    });

    // 6. 成功の応答を返す
    return res.status(200).json({ message: '画像を削除しました。' });

  } catch (error: any) {
    // Storageにファイルが存在しないエラーは、DBからの削除は成功している可能性があるので無視
    if (error.code === 'storage/object-not-found') {
      console.warn("Storage上のファイルは見つかりませんでしたが、DBからは削除を試みました。");
      // Firestoreの更新がまだならここで再度実行も可能
      const { storeId, imageUrl } = req.body;
       if (storeId && imageUrl) {
         await updateDoc(doc(db, 'stores', storeId), { photoUrls: arrayRemove(imageUrl) });
       }
      return res.status(200).json({ message: '画像を削除しました。' });
    }
    console.error('画像削除APIでエラー:', error);
    return res.status(500).json({ error: 'サーバーでエラーが発生しました。' });
  }
}