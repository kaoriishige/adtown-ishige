import type { NextApiRequest, NextApiResponse } from 'next';
// `admin`本体もインポートして、arrayRemoveなどの特殊な操作に備えます
import { admin, adminAuth, getAdminDb, getAdminStorageBucket } from '@/lib/firebase-admin';
// ブラウザ用の 'firebase/firestore' からのインポートは不要なので削除します

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const token = req.headers.authorization?.split('Bearer ')[1];
    if (!token) {
      return res.status(401).json({ error: '認証トークンがありません。' });
    }
    const decodedToken = await adminAuth().verifyIdToken(token);
    const uid = decodedToken.uid;

    const { storeId, imageUrl, imageType } = req.body;

    if (!storeId || !imageUrl || !imageType) {
        return res.status(400).json({ error: '必要な情報が不足しています。' });
    }

    const db = getAdminDb();
    // ▼▼▼ ここから書き方を `firebase-admin` SDKの作法に統一します ▼▼▼
    const storeDocRef = db.collection('stores').doc(storeId);

    const storeDoc = await storeDocRef.get();
    if (!storeDoc.exists || storeDoc.data()?.ownerId !== uid) {
      return res.status(403).json({ error: '権限がありません。' });
    }

    if (imageType === 'main') {
        await storeDocRef.update({ mainImageUrl: '' });
    } else if (imageType === 'gallery') {
        // arrayRemoveは、`admin.firestore.FieldValue` を使います
        await storeDocRef.update({ galleryImageUrls: admin.firestore.FieldValue.arrayRemove(imageUrl) });
    }

    const bucket = getAdminStorageBucket();
    const filePath = decodeURIComponent(imageUrl.split('/o/')[1].split('?')[0]);
    const fileRef = bucket.file(filePath);
    await fileRef.delete();
    
    res.status(200).json({ success: true, message: '画像を削除しました。' });

  } catch (error: any) {
    console.error('画像削除APIでエラー:', error);
    if (error.code === 404) {
        // DB上のURL削除は成功し、Storage上のファイルが既にない場合は成功とみなす
        return res.status(200).json({ success: true, message: '画像は既に削除されていました。' });
    }
    res.status(500).json({ error: error.message || 'サーバー内部でエラーが発生しました。' });
  }
}