import { NextApiRequest, NextApiResponse } from 'next';
import { adminAuth, adminDb } from '../../../lib/firebase-admin';
import nookies from 'nookies';
import * as admin from 'firebase-admin';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).end();
  }

  try {
    const cookies = nookies.get({ req });
    const token = await adminAuth.verifySessionCookie(cookies.token, true);
    const { uid } = token;

    const userDoc = await adminDb.collection('users').doc(uid).get();
    if (!userDoc.exists || userDoc.data()?.role !== 'partner') {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const { title, description, price, originalPrice, type } = req.body;
    if (!title || !description || !price || !type) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const partnerData = userDoc.data();
    const db = adminDb;

    const dealData = {
      partnerId: uid,
      storeName: partnerData?.storeName || '',
      // ▼▼▼【修正点】パートナー情報からカテゴリとエリアを追加 ▼▼▼
      categorySlug: partnerData?.category || '',
      areaSlug: partnerData?.area || '',
      title,
      description,
      price: Number(price),
      originalPrice: originalPrice ? Number(originalPrice) : null,
      type,
      isActive: true,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    await db.collection('deals').add(dealData);

    res.status(200).json({ success: true, message: 'Deal submitted successfully' });

  } catch (error: any) {
    console.error('Deal submission failed:', error);
    res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
}