import { NextApiRequest, NextApiResponse } from 'next';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import * as admin from 'firebase-admin';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    console.log("--- 1. API Endpoint Reached ---");

    const { storeName, address, contactPerson, phoneNumber, qrStandCount, email, password, category, area } = req.body;

    console.log("--- 2. Received Data ---", { email, storeName, area, category });

    if (!area || !category || !email || !password) {
        console.error("Validation Error: Missing required fields.");
        return res.status(400).json({ error: 'Area, Category, Email, and Password are required.' });
    }

    try {
        // Firebase Authenticationに新しいユーザーを作成
        console.log("--- 3. Creating Firebase Auth user... ---");
        const userRecord = await adminAuth.createUser({ email, password });
        console.log(`--- 4. Auth User Created Successfully! UID: ${userRecord.uid} ---`);
        
        // カスタムクレームを設定
        console.log("--- 5. Setting Custom Claims... ---");
        await adminAuth.setCustomUserClaims(userRecord.uid, { role: 'partner' });
        console.log("--- 6. Custom Claims Set Successfully! ---");

        // Firestoreに保存するユーザーデータ
        const userData = {
            uid: userRecord.uid,
            email,
            role: 'partner',
            storeName,
            address,
            contactPerson,
            phoneNumber,
            qrStandCount: Number(qrStandCount) || 0,
            category: category,
            area: area,
            status: 'pending', // 承認待ちステータスを追加
            createdAt: admin.firestore.FieldValue.serverTimestamp(), 
        };

        // Firestoreにユーザーデータを保存
        console.log("--- 7. Saving data to Firestore... ---");
        await adminDb.collection('users').doc(userRecord.uid).set(userData);
        console.log("--- 8. Data Saved to Firestore Successfully! ---");
        
        res.status(200).json({ uid: userRecord.uid });

    } catch (error: any) {
        console.error('--- !!! An Error Occurred !!! ---');
        console.error('Error Code:', error.code);
        console.error('Error Message:', error.message);
        console.error('Full Error Object:', error); // 完全なエラーオブジェクトをログに出力

        let errorMessage = 'アカウント作成に失敗しました。';
        if (error.code === 'auth/email-already-exists') {
            errorMessage = 'このメールアドレスは既に使用されています。';
        }
        res.status(500).json({ error: errorMessage });
    }
}