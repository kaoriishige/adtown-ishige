import type { NextApiRequest, NextApiResponse } from 'next';
import { getAdminAuth, getAdminDb } from '@/lib/firebase-admin';
import nookies from 'nookies';
import { FieldValue } from 'firebase-admin/firestore';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    // 1. ユーザーを認証し、プロフィール情報を取得
    const cookies = nookies.get({ req });
    const token = await getAdminAuth().verifySessionCookie(cookies.token, true);
    const userDoc = await getAdminDb().collection('users').doc(token.uid).get();
    const userData = userDoc.data();

    if (!userDoc.exists || userData?.role !== 'partner') {
      return res.status(403).json({ error: 'Forbidden: User is not a partner' });
    }

    // 2. プロフィールから必要な情報を取得
    const partnerUid = token.uid;
    const storeName = userData?.storeName;
    const address = userData?.address;
    const phoneNumber = userData?.phoneNumber;

    // 必要な情報がプロフィールに設定されているか確認
    if (!storeName || !address || !phoneNumber) {
      return res.status(400).json({ error: '店舗名、住所、または電話番号がプロフィールに設定されていません。' });
    }

    // 3. 送信されたフォームデータを検証
    const { dealType, itemName, discountRate, quantity, sellTime, items, notes } = req.body;
    if (!dealType || !sellTime) {
      return res.status(400).json({ error: '必須項目（取引タイプ、販売時間）が不足しています。' });
    }

    let dealData: any;
    // ... (以前のバリデーションロジックはここにそのまま入ります)

    // 4. データベースに保存するオブジェクトを作成
    const newDeal = {
      partnerUid,
      storeName,
      address,
      phoneNumber,
      ...dealData,
      dealType,
      sellTime,
      notes: notes || '',
      isActive: true,
      createdAt: FieldValue.serverTimestamp(),
    };

    // 5. データベースに保存し、作成されたデータを取得
    const docRef = await getAdminDb().collection('foodLossDeals').add(newDeal);
    const doc = await docRef.get();
    const data = doc.data()!;

    // 6. フロントエンドに返すためのオブジェクトを作成
    const createdDeal = {
      id: doc.id,
      storeName: data.storeName,
      address: data.address,
      phoneNumber: data.phoneNumber,
      item: data.item || data.itemName,
      price: data.price || null,
      quantity: data.quantity,
      createdAt: data.createdAt.toDate().toLocaleString('ja-JP', {
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit'
      }),
    };

    // 7. 成功レスポンスを返す
    return res.status(200).json({
      success: true,
      message: 'フードロス情報を登録しました。',
      newDeal: createdDeal
    });

  } catch (error: any) {
    console.error('Error in submit-deal API:', error);
    if (error.code === 'auth/session-cookie-expired' || error.code === 'auth/session-cookie-revoked') {
      return res.status(401).json({ error: 'Unauthorized: Session expired. Please login again.' });
    }
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}