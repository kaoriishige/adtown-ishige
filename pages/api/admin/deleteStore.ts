import { NextApiRequest, NextApiResponse } from 'next';
import { adminDb, adminAuth } from '@/lib/firebase-admin';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // --- 認証チェックは一時的に無効化されています ---
  // 本番環境に移行する際は、必ずこのコメントアウトを解除して認証を有効化してください。
  /*
  try {
      const { authorization } = req.headers;
      if (!authorization?.startsWith('Bearer ')) {
          return res.status(401).json({ error: 'Unauthorized: Missing token' });
      }
      const idToken = authorization.split('Bearer ')[1];
      const decodedToken = await adminAuth.verifyIdToken(idToken);
      const userDoc = await adminDb.collection('users').doc(decodedToken.uid).get();

      if (!userDoc.exists || !userDoc.data()?.roles?.includes('admin')) {
          return res.status(403).json({ error: 'Forbidden: Not an admin' });
      }
  } catch (error) {
      console.error('Authentication error in deleteStore API:', error);
      return res.status(401).json({ error: 'Unauthorized: Invalid token' });
  }
  */

  const { storeId } = req.body;

  if (!storeId || typeof storeId !== 'string') {
    return res.status(400).json({ error: 'storeId (店舗ID) は必須です。' });
  }

  try {
    // Firestoreから対象のユーザードキュメント（店舗情報）を削除
    await adminDb.collection('users').doc(storeId).delete();
    
    // 同時に、Firebase Authenticationからもユーザーを削除
    // 注意: これを行うと、そのユーザーは完全にログインできなくなります。
    await adminAuth.deleteUser(storeId);

    // TODO: 将来的に、この店舗に関連する他のデータ（例：求人情報、クーポン、投稿など）も
    // ここで同時に削除する処理を追加する必要があります。

    return res.status(200).json({ message: '店舗情報が正常に削除されました。' });
  } catch (error) {
    console.error(`店舗 (ID: ${storeId}) の削除に失敗しました:`, error);
    return res.status(500).json({ error: 'サーバー側で店舗の削除に失敗しました。' });
  }
}