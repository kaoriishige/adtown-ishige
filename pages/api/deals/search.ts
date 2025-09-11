// pages/api/deals/search.ts

import type { NextApiRequest, NextApiResponse } from 'next';
import { getAdminDb } from '@/lib/firebase-admin';
import { Query } from 'firebase-admin/firestore';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // GETリクエスト以外は拒否
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { mainCategory, subCategory, area } = req.query;

    // クエリパラメータの検証
    if (typeof mainCategory !== 'string' || typeof subCategory !== 'string' || typeof area !== 'string') {
      return res.status(400).json({ error: 'クエリパラメータが無効です。' });
    }

    const db = getAdminDb();
    let storesQuery: Query = db.collection('stores');

    // 検索条件を動的に組み立てる
    storesQuery = storesQuery.where('status', '==', 'approved'); // 承認済みの店舗のみ
    if (mainCategory) {
      storesQuery = storesQuery.where('mainCategory', '==', mainCategory);
    }
    if (subCategory) {
      storesQuery = storesQuery.where('subCategory', '==', subCategory);
    }
    if (area) {
      storesQuery = storesQuery.where('area', '==', area);
    }

    // 例えば店名順で並べ替え
    storesQuery = storesQuery.orderBy('storeName', 'asc');

    const snapshot = await storesQuery.get();

    if (snapshot.empty) {
      return res.status(200).json([]); // 結果が0件でも正常な応答
    }

    const stores = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return res.status(200).json(stores);

  } catch (error) {
    console.error('店舗検索APIでエラー:', error);
    return res.status(500).json({ error: 'サーバーでエラーが発生しました。' });
  }
}