// pages/api/getFlyers.ts のコード（すべてコピーして貼り付けてください）
import type { NextApiRequest, NextApiResponse } from 'next';
import admin from 'firebase-admin'; // Firebase Admin SDK をインポート

// Firebase Admin SDK の初期化
// GOOGLE_APPLICATION_CREDENTIALS 環境変数を使用する方法で初期化します。
if (!admin.apps.length) {
  try {
    console.log('Attempting to initialize Firebase Admin SDK using GOOGLE_APPLICATION_CREDENTIALS...');
    
    // .env.local に設定された GOOGLE_APPLICATION_CREDENTIALS 環境変数の値を取得
    const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;

    if (!serviceAccountPath) {
      console.error('GOOGLE_APPLICATION_CREDENTIALS 環境変数が設定されていません。');
      throw new Error('GOOGLE_APPLICATION_CREDENTIALS が見つかりません。');
    }

    // Firebase Admin SDK を、GOOGLE_APPLICATION_CREDENTIALS 環境変数から自動で認証情報を読み込む形式で初期化
    admin.initializeApp({
      credential: admin.credential.applicationDefault(), // 環境変数から自動で読み込む
      databaseURL: `https://supersaver-ai.firebaseio.com` // SuperSaver AI プロジェクトのDB URL
    });
    console.log(`Firebase Admin SDK が '${serviceAccountPath}' (GOOGLE_APPLICATION_CREDENTIALS) から正常に初期化されました！`);

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
        // 例: 現在の日付（2025年7月27日）以降が有効な期間のチラシのみ取得
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