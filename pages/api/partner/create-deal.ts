import type { NextApiRequest, NextApiResponse } from 'next';
import { getAdminAuth, getAdminDb } from '@/lib/firebase-admin';
import nookies from 'nookies';
import { FieldValue } from 'firebase-admin/firestore';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const cookies = nookies.get({ req });
    const token = await getAdminAuth().verifySessionCookie(cookies.token, true);
    const userDoc = await getAdminDb().collection('users').doc(token.uid).get();
    const userData = userDoc.data();

    if (!userDoc.exists || userData?.role !== 'partner') {
      return res.status(403).json({ error: 'Forbidden' });
    }
    
    const { storeName, address, phoneNumber } = userData;
    if (!storeName || !address || !phoneNumber) {
      return res.status(400).json({ error: 'プロフィール情報が不足しています。' });
    }

    const { title, description, linkUrl, imageUrl } = req.body;
    if (!title) {
      return res.status(400).json({ error: 'タイトルは必須です。' });
    }

    const newDealData = {
      partnerUid: token.uid,
      storeName,
      address,
      phoneNumber,
      title,
      description: description || '',
      linkUrl: linkUrl || '',
      imageUrl: imageUrl || '',
      isActive: true,
      createdAt: FieldValue.serverTimestamp(),
    };

    const docRef = await getAdminDb().collection('storeDeals').add(newDealData);
    const doc = await docRef.get();
    const data = doc.data()!;

    const createdDeal = {
      id: doc.id,
      title: data.title,
      description: data.description,
      imageUrl: data.imageUrl,
      linkUrl: data.linkUrl,
      createdAt: data.createdAt.toDate().toLocaleString('ja-JP'),
    };

    return res.status(201).json({ success: true, newDeal: createdDeal });

  } catch (error) {
    console.error('Create deal error:', error);
    return res.status(500).json({ error: 'サーバーエラーが発生しました。' });
  }
}