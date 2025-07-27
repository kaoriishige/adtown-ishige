// pages/api/getFlyers.ts のコード（Netlifyデプロイ用、すべてコピーして貼り付けてください）
import type { NextApiRequest, NextApiResponse } from 'next';
import admin from 'firebase-admin';

// Firebase Admin SDK の初期化
// ★★★警告: これはセキュリティリスクが高い一時的な方法です。このままデプロイしないでください。★★★
// サービスアカウントキーをBase64エンコードされた文字列リテラルとしてコード内に直接記述
const FIREBASE_SA_FULL_JSON_BASE64_HARDCODED = "YOUR_BASE64_ENCODED_SERVICE_ACCOUNT_JSON_HERE"; // ★ここにBase64文字列を貼り付ける！★
// "ewogICJ0eXBlIjogInNlcnZpY2VfYWNjb3VudCIsCiAgInByb2plY3RfaWQiOiAic3VwZXJzYXZlci1haSIsCiAgInByaXZhdGVfa2V5X2lkIjogIjk2MDdiODQzY2Y0ZmJmYTUxMjRlZThhZDcwM2QwMjQ1NzI3N2FmNzYiLAogICJwcml2YXRlX2tleSI6ICItLS0tLUJFR0lOIFBSSVZBVEUgS0VZLS0tLS1cbk1JSUV2QUlCQURBTkJna3Foa2lHOXcwQkFRRUZBQVNDQktZd2dnU2lBZ0VBQW9JQkFRQy9raDFSN2x4a2piSmtcblpDNis5Vkg2T0M3OHdNNnFFcENqbmpMelhoMXkwVy9rSmxLbVdNTVpRNU9mTk44U0hESE1aNXdzdXVzRjV6UUNcbjF3blhuYkk2L1J3Ky9PVzlveGdlN1dRejVPYmV5N2JPOXlOS2JRcmlqamR2c0ZWd1dqUUlxUkVmWi9adlI1MFlcbjd5L250K1NKZ0dBRXJCV25WSXJpMzVmNDg2c0g4cVR0eU8wb3hzanFEZ2JWYVF6Mi9aTXM1eWJWZVppb2hpOXJcbnZwWnEySFg1YnJ3T203anBIVms2T294azJnc2RMd0NzVm9yZXFFOWdzd1lMN1JJNkRWLy9vV016cDNhL0wrNkpcbktFaVhpbDNlMGpRUW5UVWQzYVhlWkRIODJuSHFNeTg2bmc4QmUzc2hXb3FKb1JWdlRKWlJGZnhWdUc0UTBSQTNcbk5CNW01enFCQWdNQkFBRUNnZ0VBQW9SaXRwS3EvNWdZWHhiOGVISWFVaG5PZFRNR2Y1SFNFWjBQK3ZFVFI3NXdcblVobi9lVFNaT1pHWERTL1dCQ0xzOE42WjFzRko1UWY4WGpwc1RBcDdBUnpsR0htS292WmZueEtCWjVNbmR0MFBcbk1FUkd0WUVYNS9rclQ5UUdHWGRUU2NBNWJHVldlWWpYa2VjN082WEJuSWc5N294emNXOGFscVZGT29XS0VZRHpcbjdrdmFxbnNocHJTTkNTNzFnb0s3QVBSSFFlTTduUUdmbktja3VHdHdkSGIyWll0aVJMYXViWGNzclFXUk53bzhcbjgwTlBpS3N0NUhmTnBJNE1XclpjRU5qdHVQZi8rcS9NQnBQMWQxMWZVQ0QzVHg2TXl0ZjdUK3NHYWxwb21iUVhcbjNpWlpqTXk5TFB2aUkyMW5FOE9WVkc5YzNaQzBpU21ZeHc2bGJ5ZGNEd0tCZ1FEcmJtcnpyVEVmalJ5U3ROeU5cbmxVK2VzMUhVY0NIL2k4UWJSbXRMbFp4OCtlRm55TmpkZW1TM1ZBTkFYUnNIN0hiVDJyakdQVnZ0N0dvbkxBSXhcbmZHQ2tXazBldlU2WUl5U1pBV3htaGxWRUVvU0pQZFBxcjFsWE5YT3ZBSVMzRXVmL2Y4bGR3VUtwWnJKdFRWR0VcbkRYdjNBZUU1Z3JyZ2JRcUw1dVdmanVVSjR3S0JnUURRVHJteThLdUQ4Ry9VQ0NUNkcweXdLRG9HN1hCb1BJd0xcbkdqL3pIVVdmU2RXMTI4N1l4VG5CTzgzeHdtQ25BYUNnNk1pbEhkeTVWR2pjRzFVV0NteXc1V1YwTlJ5QUVQQVBcbjQ0c3pINXBqT2s4UTV2SFZRdUFxVHJDNDRXZWhaWXQ4VFJhWWJyUTZyUmt3VGRwTS9lWmFZQzNlbGRrNEFPMjZcbklqTTlWbEZuU3dLQmdBczQ5RGd4WlVvUHUvRHlWaUVab1BYN3JrYm1JWGpBL05RZ0F6VlRLR1o4c3RYenFRTEZcbnRzOVdYZUZQanQ1TjAwdzkvTmpXUysrSGVYZnNqUjQydzVTU0NXTVJ1eEZkZTMwZnFEOHE0QjJpbEZiR2I3ZWNcbkxESVFCamV0V3FZdmJJZXRXN2Z3WW5FWXlDQ1ZzdkVNZzRBK3dyR3ZIYUZkRVVlaDlnZ3BFNW5wQW9HQUVEM3pcbk1NYWZPUHhvVzhuK3lCbVUweTl2eHRhQXF6LzlVMmhLa0RRNkYzOTBVR2ZCS3huRnRSRnFyMjBPaURjU1JUbWhcblcyNkdwVlMxa0dQNU1HekRxTTlhSjhOMFkyL3VwKzZBRGc1cXhVM29tRkxKakcxWWVUUUZoNFRieGJQYk9tZndcbldSWllxektRQWpvdnlVMEt4d1Uwem1RMHVhOG8yaGlNa2ozR3Z4MENnWUE4RGxCZEplQUdLQjRIUVdrRkNPS1RcbkNPcmNjWmZZYkpQd3dIZWtWWEtKZE1vYVVwR0lyZC9zemFqdThrUjdvdUhnSWF3WmZ1K2RLZWpCd1l2cjRXVXJcbjE0bnhyZW5zMCt4aEQ1YUZaSER6bE4xazMrR2xHK3BxSW4vZG84bWsyTlNnbHB4RHlHZUh5Rm1heXNVd1EyWGZcblNPdVRvM3Q4M3RIenJ2YUxmTE9EbEE9PVxuLS0tLS1FTkQgUFJJVkFURSBLRVktLS0tLVxuIiwKICAiY2xpZW50X2VtYWlsIjogImZpcmViYXNlLWFkbWluc2RrLWZic3ZjQHN1cGVyc2F2ZXItYWkuaWFtLmdzZXJ2aWNlYWNjb3VudC5jb20iLAogICJjbGllbnRfaWQiOiAiMTAzODM0MzI5NzM3OTc2MTYwODgzIiwKICAiYXV0aF91cmkiOiAiaHR0cHM6Ly9hY2NvdW50cy5nb29nbGUuY29tL28vb2F1dGgyL2F1dGgiLAogICJ0b2tlbl91cmkiOiAiaHR0cHM6Ly9vYXV0aDIuZ29vZ2xlYXBpcy5jb20vdG9rZW4iLAogICJhdXRoX3Byb3ZpZGVyX3g1MDlfY2VydF91cmwiOiAiaHR0cHM6Ly93d3cuZ29vZ2xlYXBpcy5jb20vb2F1dGgyL3YxL2NlcnRzIiwKICAiY2xpZW50X3g1MDlfY2VydF91cmwiOiAiaHR0cHM6Ly93d3cuZ29vZ2xlYXBpcy5jb20vcm9ib3QvdjEvbWV0YWRhdGEveDUwOS9maXJlYmFzZS1hZG1pbnNkay1mYnN2YyU0MHN1cGVyc2F2ZXItYWkuaWFtLmdzZXJ2aWNlYWNjb3VudC5jb20iLAogICJ1bml2ZXJzZV9kb21haW4iOiAiZ29vZ2xlYXBpcy5jb20iCn0K"


if (!admin.apps.length) {
  try {
    console.log('Attempting to initialize Firebase Admin SDK from HARDCODED Base64 string (TEMPORARY!)...');

    if (FIREBASE_SA_FULL_JSON_BASE64_HARDCODED === "YOUR_BASE64_ENCODED_SERVICE_ACCOUNT_JSON_HERE" || !FIREBASE_SA_FULL_JSON_BASE64_HARDCODED) {
      console.error('FIREBASE_SA_FULL_JSON_BASE64_HARDCODED にサービスアカウントキーが設定されていません。');
      throw new Error('Service account key not set in code.');
    }

    // Base64文字列をデコードし、JSONとしてパース
    const serviceAccountString = Buffer.from(FIREBASE_SA_FULL_JSON_BASE64_HARDCODED, 'base64').toString('utf8');
    const serviceAccount: admin.ServiceAccount = JSON.parse(serviceAccountString);

    console.log('サービスアカウントJSONがハードコードされたBase64文字列から正常にパースされました。');

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      databaseURL: `https://${serviceAccount.projectId}.firebaseio.com` 
    });
    console.log('Firebase Admin SDK がハードコードされたBase64文字列から正常に初期化されました！');

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