import { NextApiRequest, NextApiResponse } from 'next';
import { adminDb } from '@/lib/firebase-admin';

// このAPIは認証されたユーザーのみがアクセスできるように、
// 実際の運用では認証チェックを追加するのが望ましいです。

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    // 実際の運用では、Firestoreの 'treasureChests' コレクションからデータを取得します。
    // const db = adminDb;
    // const snapshot = await db.collection('treasureChests').where('active', '==', true).get();
    // const locations = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    // --- 現在は仮のデータを返します ---
    const mockLocations = [
      { id: 'loc1', name: '〇〇公園のベンチ', lat: 37.0203, lng: 139.9985, hint: '大きな滑り台の近くにあるよ' },
      { id: 'loc2', name: 'なっぴーベーカリーの看板の前', lat: 37.0151, lng: 140.0012, hint: '美味しいパンの匂いが目印！' },
      { id: 'loc3', name: '図書館の入り口', lat: 37.0188, lng: 139.9951, hint: '静かな場所で本を読もう' },
    ];
    
    res.status(200).json(mockLocations);

  } catch (error) {
    console.error('Error fetching map locations:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
}