import type { NextApiRequest, NextApiResponse } from 'next';
import { getAdminDb } from '@/lib/firebase-admin';

type Store = {
  id: string;
  storeName: string;
  address: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { mainCategory, subCategory, area } = req.query;

    if (!mainCategory || !subCategory || !area) {
      return res.status(400).json({ error: 'すべての検索パラメータが必要です。' });
    }
    
    const db = getAdminDb();
    
    // TypeScriptの型エラーを回避するため、Query型を明記
    let query: FirebaseFirestore.Query<FirebaseFirestore.DocumentData> = db.collection('stores');
    
    query = query.where('mainCategory', '==', mainCategory as string);
    query = query.where('subCategory', '==', subCategory as string);
    query = query.where('area', '==', area as string);
    
    const snapshot = await query.get();

    if (snapshot.empty) {
      return res.status(200).json([]);
    }

    const stores: Store[] = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      stores.push({
        id: doc.id,
        storeName: data.storeName || '',
        address: data.address || '',
      });
    });

    res.status(200).json(stores);

  } catch (error) {
    console.error('店舗の検索中にエラーが発生しました:', error);
    res.status(500).json({ error: 'サーバー内部でエラーが発生しました。' });
  }
}