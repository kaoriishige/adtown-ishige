import { NextApiRequest, NextApiResponse } from 'next';
import { getAdminAuth, getAdminDb } from '@/lib/firebase-admin';
import * as admin from 'firebase-admin';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // --- ★★★ ここを修正 ★★★ ---
  // 登録フォームから 'category' を受け取る
  const { storeName, contactPerson, email, password, category } = req.body;

  // categoryが送られてこなかった場合のエラーハンドリング
  if (!category) {
    return res.status(400).json({ error: 'カテゴリが選択されていません。' });
  }

  try {
    const adminAuth = getAdminAuth();
    const adminDb = getAdminDb();
    
    const userRecord = await adminAuth.createUser({
      email: email,
      password: password,
      displayName: storeName,
    });

    const uid = userRecord.uid;

    await adminDb.collection('users').doc(uid).set({
      email: email,
      storeName: storeName,
      contactPerson: contactPerson,
      role: 'partner',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // --- ★★★ ここからが重要な変更点 ★★★ ---
    // 'stores'コレクションに、登録フォームで選択されたカテゴリを正しく保存します
    await adminDb.collection('stores').doc().set({
      name: storeName,
      ownerUid: uid,
      category: category, // ★★★ ハードコーディングではなく、受け取ったcategoryを保存 ★★★
      area: 'nasushiobara', // デフォルトのエリア
      address: '',
      phone: '',
      hours: '',
      menu: '',
      recommend: '',
      coupon: '',
      googleMap: '',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    // --- ★★★ ここまでが重要な変更点 ★★★ ---

    res.status(200).json({ uid: uid });

  } catch (error: any) {
    console.error('Partner account creation error:', error);
    let errorMessage = '登録に失敗しました。';
    if (error.code === 'auth/email-already-exists') {
      errorMessage = 'このメールアドレスは既に使用されています。';
    }
    res.status(400).json({ error: errorMessage });
  }
}