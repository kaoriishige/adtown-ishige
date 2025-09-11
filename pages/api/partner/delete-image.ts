import type { NextApiRequest, NextApiResponse } from 'next';
import { 
  admin,
  getAdminAuth, 
  getAdminDb, 
  getAdminStorageBucket, 
} from '@/lib/firebase-admin';

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
    const auth = getAdminAuth();
    const decodedToken = await auth.verifyIdToken(token);
    const userId = decodedToken.uid;

    const { storeId, imageUrl } = req.body;
    if (!storeId || !imageUrl) {
      return res.status(400).json({ error: 'リクエスト内容が不正です。' });
    }

    const db = getAdminDb();
    const storeDocRef = db.collection('stores').doc(storeId);
    const storeDoc = await storeDocRef.get();

    if (!storeDoc.exists || storeDoc.data()?.ownerId !== userId) {
      return res.status(403).json({ error: 'この操作を行う権限がありません。' });
    }

    const bucket = getAdminStorageBucket();
    const decodedUrl = decodeURIComponent(imageUrl);
    const filePath = decodedUrl.split('/o/')[1]?.split('?')[0];
    
    if (filePath) {
      await bucket.file(filePath).delete();
    }

    await storeDocRef.update({
      photoUrls: admin.firestore.FieldValue.arrayRemove(imageUrl)
    });

    return res.status(200).json({ message: '画像を削除しました。' });

  } catch (error: any) {
    console.error('画像削除APIで重大なエラー:', error);
    return res.status(500).json({ error: 'サーバーでエラーが発生しました。' });
  }
}