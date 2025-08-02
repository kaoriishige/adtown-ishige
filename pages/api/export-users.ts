import type { NextApiRequest, NextApiResponse } from 'next';
import { getAdminAuth, getAdminDb } from '../../lib/firebase-admin';
import nookies from 'nookies';

// データをCSV形式の文字列に変換するヘルパー関数
const convertToCSV = (data: Record<string, any>[]) => {
  if (data.length === 0) return '';
  const headers = Object.keys(data[0]);
  const csvRows = [
    headers.join(','), // ヘッダー行
    ...data.map(row => 
      headers.map(header => 
        JSON.stringify(row[header], (_, value) => value ?? '')
      ).join(',')
    )
  ];
  return csvRows.join('\n');
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // ユーザーを認証し、管理者か確認
    const cookies = nookies.get({ req });
    const token = await admin.auth().verifyIdToken(cookies.token);
    if (!token.admin) {
      return res.status(403).json({ error: '権限がありません。' });
    }

    // 全ユーザーの情報をFirestoreから取得
    const usersSnapshot = await admin.firestore().collection('users').get();
    const users = usersSnapshot.docs.map(doc => ({
      uid: doc.id,
      ...doc.data(),
    }));

    const csvData = convertToCSV(users);

    // CSVファイルとしてダウンロードさせるためのヘッダーを設定
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="users.csv"');
    res.status(200).send(csvData);

  } catch (error) {
    console.error('ユーザーのエクスポートに失敗:', error);
    res.status(500).json({ error: 'サーバー側でエラーが発生しました。' });
  }
}