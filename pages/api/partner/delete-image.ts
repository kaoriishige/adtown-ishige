import type { NextApiRequest, NextApiResponse } from 'next';
import { getAdminAuth } from '@/lib/firebase-admin'; // 👈 修正点 1
import { doc, getDoc, updateDoc, arrayRemove } from 'firebase/firestore';
import { ref, deleteObject } from 'firebase/storage';
import { db, storage } from '@/lib/firebase';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { authorization } = req.headers;
    if (!authorization || !authorization.startsWith('Bearer ')) {
      return res.status(401).json({ error: '認証トークンが見つかりません。' });
    }
    const token = authorization.split('Bearer ')[1];
    
    // 👈 修正点 2
    const auth = getAdminAuth();
    const decodedToken = await auth.verifyIdToken(token);
    const userId = decodedToken.uid;

    if (!userId) {
      return res.status(401).json({ error: '認証に失敗しました。' });
    }

    const { storeId, imageUrl } = req.body;
    if (!storeId || !imageUrl) {
      return res.status(400).json({ error: '不正なリクエストです。' });
    }

    const storeDocRef = doc(db, 'stores', storeId);
    const storeDoc = await getDoc(storeDocRef);

    if (!storeDoc.exists() || storeDoc.data().ownerId !== userId) {
      return res.status(403).json({ error: 'この操作を行う権限がありません。' });
    }

    const imageRef = ref(storage, imageUrl);
    await deleteObject(imageRef);

    await updateDoc(storeDocRef, {
      photoUrls: arrayRemove(imageUrl)
    });

    return res.status(200).json({ message: '画像を削除しました。' });

  } catch (error: any) {
    console.error('画像削除APIでエラー:', error);
    if (error.code === 'auth/id-token-expired') {
        return res.status(401).json({ error: '認証トークンの有効期限が切れています。' });
    }
    if (error.code === 'storage/object-not-found') {
      console.warn("Storageのファイルは見つかりませんでしたが、DBからは削除されました。");
      return res.status(200).json({ message: '画像を削除しました。' });
    }
    return res.status(500).json({ error: 'サーバーでエラーが発生しました。' });
  }
}