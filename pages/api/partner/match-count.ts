import type { NextApiRequest, NextApiResponse } from 'next';
// ★ FIX: lib/firebase-admin から初期化済みの adminDb, adminAuth を取得
import { adminDb } from '@/lib/firebase-admin'; 

// Firestoreの参照パス (pages/api/matching/record.ts と一致させる)
const COUNTER_COLLECTION = 'storeMatchCounters'; 

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  // クエリパラメータから storeId を取得
  const storeId = req.query.storeId as string;

  if (!storeId) {
    return res.status(400).json({ message: 'Missing storeId query parameter' });
  }

  try {
    // ★ FIX: adminDb を直接使用
    const firestore = adminDb; 
    
    const counterRef = firestore.collection(COUNTER_COLLECTION).doc(storeId);
    const doc = await counterRef.get();

    if (!doc.exists) {
      // カウンターがまだ存在しない場合
      return res.status(200).json({ potentialCount: 0 });
    }

    const data = doc.data()!;
    
    return res.status(200).json({
      // totalPotentialMatches (3倍ブーストされた数値) を返す
      potentialCount: data.totalPotentialMatches || 0,
    });

  } catch (error) {
    console.error('API Error:', error);
    // 内部エラーが発生した場合も、表示を壊さないよう 0 を返します
    return res.status(200).json({ potentialCount: 0 }); 
  }
}