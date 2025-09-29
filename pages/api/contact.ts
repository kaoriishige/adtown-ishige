import { NextApiRequest, NextApiResponse } from 'next';
import { adminDb } from '@/lib/firebase-admin';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { name, email, category, message } = req.body;
    if (!name || !email || !category || !message) {
      return res.status(400).json({ error: 'すべてのフィールドを入力してください。' });
    }

    const adminDb = adminDb();
    
    // 1. 問い合わせ内容を 'inquiries' コレクションに保存
    await adminDb.collection('inquiries').add({
      name,
      email,
      category,
      message,
      status: 'new',
      createdAt: new Date(),
    });

    // ▼▼▼ 変更点: 自動返信メールの送信指令を追加 ▼▼▼
    // 'mail' コレクションにドキュメントを追加すると、拡張機能が検知してメールを送信する
    await adminDb.collection('mail').add({
      to: email, // お客様のメールアドレス
      template: {
        name: 'inquiryReceipt', // 作成するメールテンプレートの名前
        data: { // テンプレートに渡す動的なデータ
          name: name,
        },
      },
    });

    res.status(200).json({ success: true });

  } catch (error) {
    console.error('Error in contact API:', error);
    res.status(500).json({ error: 'サーバーでエラーが発生しました。' });
  }
}