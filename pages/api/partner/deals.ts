import { NextApiRequest, NextApiResponse } from 'next';
import nookies from 'nookies';
import { getAdminAuth, getAdminDb } from '@/lib/firebase-admin';

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
    if (req.method !== 'POST') {
        return res.status(405).setHeader('Allow', 'POST').end();
    }

    try {
        const cookies = nookies.get({ req });
        const token = await getAdminAuth().verifySessionCookie(cookies.token, true);
        const { uid: partnerId } = token;

        const { title, type, description, imageUrl } = req.body;

        if (!title || !type) {
            return res.status(400).json({ error: 'タイトルと種別は必須です。' });
        }

        const db = getAdminDb();
        const dealsCollection = db.collection('partners').doc(partnerId).collection('deals');
        
        const newDealData = {
            title,
            type,
            description: description || '',
            imageUrl: imageUrl || null,
            createdAt: new Date(),
            partnerId: partnerId,
        };

        const docRef = await dealsCollection.add(newDealData);

        res.status(201).json({ id: docRef.id, ...newDealData });

    } catch (error) {
        console.error('APIでの情報作成エラー:', error);
        res.status(401).json({ error: '認証されていないか、処理中にエラーが発生しました。' });
    }
};

export default handler;