import { NextApiRequest, NextApiResponse } from 'next';
import { getAdminDb } from '../../../lib/firebase-admin'; // 修正点: ファイルパスを正しく記述

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        const { mainCategory, subCategory, area } = req.query;

        if (!mainCategory || !subCategory || !area) {
            return res.status(400).json({ error: 'All filter parameters are required.' });
        }

        const db = getAdminDb();
        const usersRef = db.collection('users');
        
        const q = usersRef
            .where('role', '==', 'partner')
            .where('status', '==', 'approved')
            .where('category.main', '==', mainCategory)
            .where('category.sub', '==', subCategory)
            .where('area', '==', area);

        const querySnapshot = await q.get();

        if (querySnapshot.empty) {
            return res.status(200).json([]);
        }

        const stores = querySnapshot.docs.map(doc => ({
            id: doc.id,
            storeName: doc.data().storeName || '',
            address: doc.data().address || '',
            ...doc.data(),
        }));

        res.status(200).json(stores);

    } catch (error) {
        console.error("Error searching stores:", error);
        res.status(500).json({ error: 'Failed to search stores.' });
    }
}
