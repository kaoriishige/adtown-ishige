import { adminDb } from '@/lib/firebase-admin'; // 1. ここでインポートします
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    // 2. ここで直接使います。
    await adminDb.collection('contacts').add({
      name: req.body.name,
      email: req.body.email,
      message: req.body.message,
      createdAt: new Date().toISOString(),
    });

    res.status(200).json({ message: '問い合わせを送信しました。' });
  } catch (error) {
    console.error('問い合わせフォームのエラー:', error);
    res.status(500).json({ error: '問い合わせの送信に失敗しました。' });
  }
}