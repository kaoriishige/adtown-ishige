// pages/api/partner/delete-image.ts

import type { NextApiRequest, NextApiResponse } from 'next';
import { adminAuth, adminDb } from '@/lib/firebase-admin'; // Removed getAdminStorageBucket
import { FieldValue } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', 'POST');
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { userId, storeId, imageUrl } = req.body;

    if (!userId || !storeId || !imageUrl) {
        return res.status(400).json({ error: '必要なパラメータが不足しています。' });
    }

    try {
        const url = new URL(imageUrl);
        const path = decodeURIComponent(url.pathname.split('/o/')[1].split('?')[0]);

        // Get the storage bucket from the initialized admin app
        const bucket = getStorage().bucket();

        // Delete the image from Firebase Storage
        await bucket.file(path).delete();

        // Delete the image URL from the Firestore document
        const storeRef = adminDb.collection('stores').doc(storeId);
        await storeRef.update({
            images: FieldValue.arrayRemove(imageUrl)
        });

        res.status(200).json({ message: '画像の削除が成功しました。' });
    } catch (error: any) {
        console.error('画像の削除エラー:', error);
        res.status(500).json({ error: `画像の削除に失敗しました: ${error.message}` });
    }
}