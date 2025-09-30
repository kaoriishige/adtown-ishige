import type { NextApiRequest, NextApiResponse } from 'next';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  // ターミナルに環境変数の内容を表示させる
  console.log("--- .env.local テストの開始 ---");
  console.log("FIREBASE_PROJECT_ID:", process.env.FIREBASE_PROJECT_ID);
  console.log("--- テストの終了 ---");
  
  // ブラウザに結果を表示させる
  res.status(200).json({ 
    projectId_from_env: process.env.FIREBASE_PROJECT_ID || "【エラー】見つかりませんでした" 
  });
}