import type { NextApiRequest, NextApiResponse } from 'next';
// 管理者用SDKの関数と、FieldValueで使うためのadminオブジェクトをインポート
import { 
  getAdminAuth, 
  getAdminDb, 
  getAdminStorageBucket, 
  admin 
} from '@/lib/firebase-admin';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // POSTリクエスト以外は拒否
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    // 1. ヘッダーからIDトークンを取得し、ユーザーを認証する (管理者SDK)
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

    // 2. ユーザーが店舗のオーナーであるか確認する (管理者SDK)
    const db = getAdminDb();
    const storeDocRef = db.collection('stores').doc(storeId);
    const storeDoc = await storeDocRef.get();

    if (!storeDoc.exists || storeDoc.data()?.ownerId !== userId) {
      return res.status(403).json({ error: 'この操作を行う権限がありません。' });
    }

    // 3. ストレージから画像ファイルを削除する (管理者SDK)
    const bucket = getAdminStorageBucket();
    // HTTPS URLからバケット内のファイルパスを抽出
    // 例: https://.../o/stores%2F...%2Fimage.jpg?alt=media... -> stores/.../image.jpg
    const decodedUrl = decodeURIComponent(imageUrl);
    const filePath = decodedUrl.split('/o/')[1]?.split('?')[0];
    
    if (filePath) {
      await bucket.file(filePath).delete();
    } else {
      console.warn('URLからファイルパスを抽出できませんでした:', imageUrl);
    }

    // 4. Firestoreドキュメントから画像URLを削除する (管理者SDK)
    await storeDocRef.update({
      photoUrls: admin.firestore.FieldValue.arrayRemove(imageUrl)
    });

    // 5. 成功のレスポンスを返す
    return res.status(200).json({ message: '画像を削除しました。' });

  } catch (error: any) {
    console.error('画像削除APIで重大なエラーが発生しました:', error);
    if (error.code === 'storage/object-not-found') {
      console.warn('ストレージにファイルが見つかりませんでしたが、DBの更新は試みました。');
       // この場合でもDBからの削除は成功させたいので、200を返すことも検討できる
       return res.status(200).json({ message: '画像を削除しました（ファイルは存在しませんでした）。' });
    }
    return res.status(500).json({ error: 'サーバーでエラーが発生しました。' });
  }
}