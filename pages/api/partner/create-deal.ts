import { NextApiRequest, NextApiResponse } from 'next';
import { adminAuth, adminDb } from '@/lib/firebase-admin'; // 正しいインポート
import { FieldValue } from 'firebase-admin/firestore';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        return res.status(405).end();
    }
    
    try {
        // ここに求人情報を作成するロジックを実装します。
        // 例： const { title, description, uid } = req.body;
        // await adminDb.collection('deals').add({ ... });

        res.status(200).json({ message: 'Deal created successfully' });
    } catch(err: any) {
        res.status(500).json({ error: { message: err.message } });
    }
}