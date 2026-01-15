import { NextApiRequest, NextApiResponse } from 'next';
import { adminDb } from '@/lib/firebase-admin';
import * as admin from 'firebase-admin';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') return res.status(405).end();

    const {
        uid,
        realName,
        phoneNumber,
        address,
        bankName,
        branchName,
        branchCode,
        accountType,
        accountNumber,
        accountHolder
    } = req.body;

    if (!uid || !realName || !bankName || !accountNumber) {
        return res.status(400).json({ error: '必須項目が不足しています。' });
    }

    try {
        await adminDb.collection('users').doc(uid).update({
            realName,
            phoneNumber,
            address,
            bankInfo: {
                bankName,
                branchName,
                branchCode,
                accountType,
                accountNumber,
                accountHolder,
            },
            profileCompleted: true,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        return res.status(200).json({ success: true });
    } catch (err: any) {
        console.error('❌ Profile Update Error:', err.message);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
}