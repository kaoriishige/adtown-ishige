import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  
  console.log("--- 環境変数の内容を確認します ---");
  console.log("STRIPE_WEBHOOK_SECRET:", process.env.STRIPE_WEBHOOK_SECRET);
  console.log("FIREBASE_PROJECT_ID:", process.env.FIREBASE_PROJECT_ID);
  console.log("FIREBASE_CLIENT_EMAIL:", process.env.FIREBASE_CLIENT_EMAIL);
  // privateKeyは長すぎるので、最初の30文字だけ表示
  console.log("FIREBASE_PRIVATE_KEY (最初の30文字):", (process.env.FIREBASE_PRIVATE_KEY || '').substring(0, 30));
  console.log("--- 確認ここまで ---");

  res.status(200).json({ debug: "log checked" });
}