// /pages/api/stores.ts
// 最終修正版: コレクション名を 'owner' (単数形) に修正し、インデックスに依存しないロジックを使用

import { NextApiRequest, NextApiResponse } from 'next';
import { adminDb } from '../../lib/firebase-admin';
import * as admin from 'firebase-admin'; 

interface Store {
  id: string;
  address?: string;
  mainCategory?: string;
  subCategory?: string;
  status?: string; 
  [key: string]: any;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const { main, sub, area } = req.query;

  console.log('--- Firestore owner/stores API 開始 ---'); // ログも修正
  console.log(`[Query] main=${main}, sub=${sub}, area=${area}`);

  const projectId = (adminDb as any)._settings?.projectId || 'unknown';
  console.log('Firestore プロジェクトID:', projectId);

  try {
    const allApprovedStores: Store[] = [];

    // 💥 修正点: コレクション名を 'owner' (単数形) に修正し、ループでデータを取得
    const ownersSnapshot = await adminDb.collection('owner').get(); // **ここが修正されました**
    console.log(`[DEBUG] owner件数: ${ownersSnapshot.size}`); 

    for (const ownerDoc of ownersSnapshot.docs) {
        // 各オーナーのサブコレクション 'stores' を個別に取得
        const storesSnapshot = await ownerDoc.ref
            .collection('stores')
            .where('status', '==', 'approved')
            .get();

        storesSnapshot.forEach((storeDoc) => {
            allApprovedStores.push({
                id: storeDoc.id,
                ...storeDoc.data(),
            });
        });
    }
    
    console.log(`[DEBUG] 承認済み店舗数 (未絞り込み): ${allApprovedStores.length}`);

    // 🔎 絞り込み処理 (取得後にメモリ内で実行)
    let filteredStores = [...allApprovedStores];
    
    // メインカテゴリの絞り込み
    if (typeof main === 'string' && main) {
      filteredStores = filteredStores.filter((s) => s.mainCategory === main);
    }
    
    // サブカテゴリが「すべて」の場合は絞り込みをスキップ
    if (typeof sub === 'string' && sub && sub !== 'すべて') {
      filteredStores = filteredStores.filter((s) => s.subCategory === sub);
    }
    
    // エリア（住所）の絞り込み
    if (typeof area === 'string' && area) {
      filteredStores = filteredStores.filter((s) => s.address && s.address.includes(area));
    }

    console.log(`[DEBUG] 最終表示店舗数: ${filteredStores.length}`);
    console.log('--- Firestore owner/stores API 終了 ---');

    return res.status(200).json(filteredStores);
  } catch (error: any) {
    // 予期せぬエラーが出てもアプリがクラッシュしないようにする
    console.error('[API ERROR] /api/stores:', error.message);
    return res.status(500).json({ error: 'Failed to fetch stores' });
  }
}












