// pages/api/getFlyers.ts のコード（Netlifyデプロイ用、すべてコピーして貼り付けてください）
import type { NextApiRequest, NextApiResponse } from 'next';
import admin from 'firebase-admin';

// Firebase Admin SDK の初期化
// 環境変数 DEALS_SERVICE_ACCOUNT_KEY (Base64エンコード済み) から読み込む
if (!admin.apps.length) {
  try {
    console.log('Attempting to initialize Firebase Admin SDK from Base64 encoded environment variable...');

    const serviceAccountBase64 = process.env.DEALS_SERVICE_ACCOUNT_KEY;

    if (!serviceAccountBase64) {
      console.error('DEALS_SERVICE_ACCOUNT_KEY 環境変数 (Base64) が設定されていません。');
      throw new Error('DEALS_SERVICE_ACCOUNT_KEY (Base64) が見つかりません。');
    }

    // Base64文字列をデコードし、JSONとしてパース
    const serviceAccountString = Buffer.from(serviceAccountBase64, 'base64').toString('utf8');
    const serviceAccount: admin.ServiceAccount = JSON.parse(serviceAccountString);

    console.log('サービスアカウントJSONが環境変数 (Base64デコード後) から正常にパースされました。');

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      databaseURL: `https://${serviceAccount.projectId}.firebaseio.com` 
    });
    console.log('Firebase Admin SDK が Base64 環境変数から正常に初期化されました！');

  } catch (error) {
    console.error('Firebase Admin SDK 初期化エラー（詳細）:', error);
    throw new Error('Firebase Admin SDK の初期化に失敗しました。'); 
  }
}

const dbAdmin = admin.firestore(); // Firebase Admin SDK からFirestoreインスタンスを取得

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === 'GET') {
    const { region } = req.query; // クエリパラメータから地域を取得

    if (!region) {
      return res.status(400).json({ error: 'Region parameter is required' });
    }

    try {
      // SuperSaver AI のFirestoreからデータを取得
      const querySnapshot = await dbAdmin.collection('deals')
        .where('region', '==', region)
        // 必要に応じて、日付フィルターやステータスフィルターを追加する
        // 例: 現在の日付（本日 2025年7月27日）以降が有効な期間のチラシのみ取得
        .where('period', '>=', new Date().toISOString().split('T')[0]) 
        .where('status', '==', '公開') // 例: 公開ステータスのチラシ
        .get();

      if (querySnapshot.empty) {
        return res.status(200).json([]); // データがない場合は空の配列を返す
      }

      // 取得したデータを整形してクライアントに返す
      const flyersData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(), // ドキュメントの全てのデータを展開
      }));

      res.status(200).json(flyersData); // 成功したデータをJSONで返す
    } catch (error) {
      console.error('Error fetching flyers from Firestore (API Route):', error);
      res.status(500).json({ error: 'Failed to fetch flyers data from server' });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}