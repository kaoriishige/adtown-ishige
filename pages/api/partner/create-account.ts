import { NextApiRequest, NextApiResponse } from 'next';
import { getAdminAuth, getAdminDb } from '../../../lib/firebase-admin';
import * as admin from 'firebase-admin';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { storeName, address, contactPerson, phoneNumber, qrStandCount, email, password, category, area } = req.body;

    if (!area || !category) {
        return res.status(400).json({ error: 'Area and Category are required.' });
    }

    try {
        // Firebase Authenticationに新しいユーザーを作成
        const userRecord = await getAdminAuth().createUser({ email, password });
        
        // ★修正点1: Firebase Authenticationのカスタムクレームを更新★
        // IDトークンに'role: partner'という情報を埋め込む
        await getAdminAuth().setCustomUserClaims(userRecord.uid, { role: 'partner' });

        // Firestoreに保存するユーザーデータ
        const userData = {
            uid: userRecord.uid,
            email,
            role: 'partner', // Firestoreにも役割を保存
            storeName,
            address,
            contactPerson,
            phoneNumber,
            qrStandCount: Number(qrStandCount) || 0,
            category: category,
            area: area,
            createdAt: admin.firestore.FieldValue.serverTimestamp(), 
        };

        // Firestoreにユーザーデータを保存
        await getAdminDb().collection('users').doc(userRecord.uid).set(userData);
        
        res.status(200).json({ uid: userRecord.uid });

    } catch (error: any) {
        let errorMessage = 'アカウント作成に失敗しました。';
        if (error.code === 'auth/email-already-exists') {
            errorMessage = 'このメールアドレスは既に使用されています。';
        } else {
            console.error('Account creation error:', error);
        }
        res.status(500).json({ error: errorMessage });
    }
}