import type { NextApiRequest, NextApiResponse } from 'next';
// 私たちが作成した管理者用のヘルパー関数をインポート
import { 
  adminAuth, 
  adminDb, 
  // getAdminStorageBucket // ★★★【エラー原因】この存在しない関数を削除します ★★★
} from '@/lib/firebase-admin';
// ★★★【修正点】Firebase Admin SDKから、Storageを操作するための公式な関数をインポートします ★★★
import { getStorage } from 'firebase-admin/storage';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // DELETEリクエスト以外は拒否
  if (req.method !== 'DELETE') {
    res.setHeader('Allow', ['DELETE']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  try {
    // 1. ユーザーを認証する (管理者SDK)
    const { authorization } = req.headers;
    if (!authorization || !authorization.startsWith('Bearer ')) {
      return res.status(401).json({ error: '認証トークンが見つかりません。' });
    }
    const token = authorization.split('Bearer ')[1];
    const decodedToken = await adminAuth.verifyIdToken(token);
    const userId = decodedToken.uid;

    // 2. リクエストから削除対象のIDを取得
    const { dealId } = req.query;
    if (typeof dealId !== 'string' || !dealId) {
      return res.status(400).json({ error: 'IDが無効です。' });
    }

    // 3. データベースを操作する (管理者SDK)
    const dealDocRef = adminDb.collection('storeDeals').doc(dealId);
    const dealDoc = await dealDocRef.get();

    if (!dealDoc.exists) {
      return res.status(404).json({ error: '削除対象のデータが見つかりません。' });
    }
    
    const dealData = dealDoc.data()!;

    // 4. 権限をチェックする (管理者SDK)
    const storeDocRef = adminDb.collection('stores').doc(dealData.storeId);
    const storeDoc = await storeDocRef.get();
    if (!storeDoc.exists || storeDoc.data()?.ownerId !== userId) {
      return res.status(403).json({ error: 'このデータを削除する権限がありません。' });
    }

    // 5. 画像が設定されていれば、ストレージから削除する (管理者SDK)
    if (dealData.imageUrl) {
      try {
        // ★★★【修正点】公式な方法でストレージのバケットを取得します ★★★
        const bucket = getStorage().bucket();
        const decodedUrl = decodeURIComponent(dealData.imageUrl);
        const filePath = decodedUrl.split('/o/')[1]?.split('?')[0];
        
        if (filePath) {
          await bucket.file(filePath).delete();
        }
      } catch (storageError: any) {
        // ファイルが存在しないエラー(404)は、すでに削除済みなので無視してOK
        if (storageError.code !== 404) {
          throw storageError; // その他のエラーは問題として処理
        }
      }
    }
    
    // 6. Firestoreのドキュメントを削除する (管理者SDK)
    await dealDocRef.delete();

    return res.status(200).json({ message: '正常に削除されました。' });

  } catch (error) {
    console.error('お得情報削除APIでエラー:', error);
    return res.status(500).json({ error: 'サーバーでエラーが発生しました。' });
  }
}