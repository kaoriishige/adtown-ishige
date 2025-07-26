// pages/api/getFlyers.ts のコード（Netlifyデプロイ用、すべてコピーして貼り付けてください）
import type { NextApiRequest, NextApiResponse } from 'next';
import admin from 'firebase-admin';

// Firebase Admin SDK の初期化
// Netlifyに登録した分割環境変数からサービスアカウント情報を読み込む
if (!admin.apps.length) {
  try {
    console.log('Attempting to initialize Firebase Admin SDK from segmented environment variables...');
    
    // Netlifyで設定した環境変数から値を取得
    const firebaseSaConfig = {
      type: process.env.FIREBASE_SA_TYPE,
      projectId: process.env.FIREBASE_SA_PROJECT_ID,
      private_key_id: process.env.FIREBASE_SA_PRIVATE_KEY_ID,
      // private_keyはBase64エンコードの必要はありません。Netlifyの入力欄で改行を\nにして1行にした文字列をそのまま受け取ります。
      private_key: process.env.FIREBASE_SA_PRIVATE_KEY?.replace(/\\n/g, '\n'), // \n を実際の改行に戻す
      client_email: process.env.FIREBASE_SA_CLIENT_EMAIL,
      // サービスアカウントJSONにある他のフィールドも、必要ならNetlifyに環境変数として登録し、ここに追加
      // 例: client_id: process.env.FIREBASE_SA_CLIENT_ID,
      // auth_uri: process.env.FIREBASE_SA_AUTH_URI,
      // token_uri: process.env.FIREBASE_SA_TOKEN_URI,
      // auth_provider_x509_cert_url: process.env.FIREBASE_SA_AUTH_PROVIDER_X509_CERT_URL,
      // client_x509_cert_url: process.env.FIREBASE_SA_CLIENT_X509_CERT_URL,
      // universe_domain: process.env.FIREBASE_SA_UNIVERSE_DOMAIN,
    };

    // 必須の環境変数が設定されているかチェック
    if (
      !firebaseSaConfig.type ||
      !firebaseSaConfig.projectId ||
      !firebaseSaConfig.private_key_id ||
      !firebaseSaConfig.private_key || // private_keyが空でないことをチェック
      !firebaseSaConfig.client_email
    ) {
      console.error('必要なFirebaseサービスアカウント環境変数が不足しています。Netlifyのデプロイ設定を確認してください。');
      console.error('Missing: ', {
        type: !!firebaseSaConfig.type,
        projectId: !!firebaseSaConfig.projectId,
        private_key_id: !!firebaseSaConfig.private_key_id,
        private_key: !!firebaseSaConfig.private_key,
        client_email: !!firebaseSaConfig.client_email,
      });
      throw new Error('Missing Firebase service account environment variables for API route.');
    }
    
    // Admin SDKのcredential.cert()はServiceAccount型を期待
    const serviceAccount: admin.ServiceAccount = {
      type: firebaseSaConfig.type,
      project_id: firebaseSaConfig.projectId, 
      private_key_id: firebaseSaConfig.private_key_id,
      private_key: firebaseSaConfig.private_key,
      client_email: firebaseSaConfig.client_email,
      // 他のフィールドも serviceAccount に追加する必要がある場合、firebaseSaConfigから取得して追加
    } as admin.ServiceAccount; // 型アサーション

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      databaseURL: `https://${serviceAccount.projectId}.firebaseio.com` 
    });
    console.log('Firebase Admin SDK が分割環境変数から正常に初期化されました！');

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