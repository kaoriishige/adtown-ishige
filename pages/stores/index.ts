import { NextApiRequest, NextApiResponse } from 'next';
import { adminDb } from '@/lib/firebase-admin';
import * as admin from 'firebase-admin';

// Store data type definition
interface Store {
    id: string;
    address?: string;
    [key: string]: any; // Allow other properties
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'GET') {
        res.setHeader('Allow', ['GET']);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }

    const { main, sub, area } = req.query;

    try {
        // 'stores' という名前のコレクションを、階層を問わず横断的に検索します。
        let storesQuery: admin.firestore.Query = adminDb.collectionGroup('stores').where('status', '==', 'approved');
        
        // クエリパラメータに基づいて絞り込みを追加
        if (typeof main === 'string') {
            storesQuery = storesQuery.where('mainCategory', '==', main);
        }
        if (typeof sub === 'string') {
            storesQuery = storesQuery.where('subCategory', '==', sub);
        }
        
        const querySnapshot = await storesQuery.get();

        let stores: Store[] = querySnapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data
            };
        });

        // エリアでの絞り込み（Firestoreのクエリ制約のため、取得後にフィルタリング）
        if (typeof area === 'string') {
            stores = stores.filter(store => store.address && store.address.includes(area));
        }

        res.status(200).json(stores);

    } catch (error) {
        console.error('Error fetching stores:', error);
        res.status(500).json({ error: 'Failed to fetch stores' });
    }
}