// pages/api/export-users.ts

import { NextApiRequest, NextApiResponse } from 'next';
import { admin } from '../../lib/firebase-admin';

// CSV文字列を生成するヘルパー関数
const convertToCSV = (data: any[]) => {
  const header = ['Email', 'UID', '登録日時'];
  const rows = data.map(user => 
    [
      user.email,
      user.uid,
      // 日時を日本標準時にフォーマット
      new Date(user.creationTime).toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' })
    ].join(',')
  );
  return [header.join(','), ...rows].join('\n');
};

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    const userRecords = await admin.auth().listUsers();
    const users = userRecords.users.map(user => ({
      uid: user.uid,
      email: user.email,
      creationTime: user.metadata.creationTime,
    }));

    const csvData = convertToCSV(users);
    
    // CSVファイルとしてダウンロードさせるためのヘッダーを設定
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="users-${new Date().toISOString().slice(0,10)}.csv"`);
    res.status(200).send(csvData);

  } catch (error) {
    console.error('Error exporting users:', error);
    res.status(500).json({ error: 'Failed to export user data' });
  }
};

export default handler;