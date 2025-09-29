import { NextApiRequest, NextApiResponse } from 'next';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import nookies from 'nookies';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    // 1. ユーザー認証とパートナー判定
    const cookies = nookies.get({ req });
    const token = await adminAuth.verifySessionCookie(cookies.token, true);
    if (token.role !== 'partner') {
      return res.status(403).json({ error: 'アクセス権がありません。' });
    }
    const { uid } = token;

    const { dealId } = req.body;
    if (!dealId) {
      return res.status(400).json({ error: '情報IDが指定されていません。' });
    }

    const adminDb = adminDb;
    const dealRef = adminDb.collection('foodLossDeals').doc(dealId);
    const dealDoc = await dealRef.get();

    // 2. ドキュメントの存在と所有権を確認
    // ▼▼▼ エラー修正: .exists() を .exists に変更 ▼▼▼
    if (!dealDoc.exists || dealDoc.data()?.partnerUid !== uid) {
      return res.status(404).json({ error: '対象の情報が見つからないか、操作権限がありません。' });
    }

    // 3. 掲載を終了するために isActive フラグを false に更新
    await dealRef.update({
      isActive: false,
      endedAt: new Date(), // 終了日時を記録
    });

    res.status(200).json({ success: true });

  } catch (error: any) {
    console.error('Error ending deal:', error);
    res.status(500).json({ error: 'サーバーでエラーが発生しました。' });
  }
}
