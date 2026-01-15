import type { NextApiRequest, NextApiResponse } from 'next';
import { adminAuth, adminDb } from '../../../lib/firebase-admin';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    try {
        const {
            email,
            password,
            realName,
            address,
            phoneNumber,
            bankName,
            branchName,
            branchCode,
            accountType,
            accountNumber,
            accountHolder,
            referrerId,
        } = req.body;

        let uid: string;

        try {
            // 1. まず新規作成を試みる
            const userRecord = await adminAuth.createUser({
                email,
                password,
                displayName: realName,
            });
            uid = userRecord.uid;
        } catch (authError: any) {
            // 2. もし「メール重複」エラーなら、既存のユーザー情報を取得して上書きモードへ
            if (authError.code === 'auth/email-already-exists') {
                const existingUser = await adminAuth.getUserByEmail(email);
                uid = existingUser.uid;
                // 必要に応じてパスワードも更新
                if (password) {
                    await adminAuth.updateUser(uid, { password });
                }
            } else {
                throw authError; // それ以外のエラーはそのまま投げる
            }
        }

        // 3. Firestoreのデータを上書き保存（merge: true で既存項目を維持しつつ更新）
        const userData = {
            uid,
            email,
            realName,
            address,
            phoneNumber,
            bankInfo: {
                bankName,
                branchName,
                branchCode,
                accountType,
                accountNumber,
                accountHolder,
            },
            referrerId: referrerId || null,
            role: 'user',
            isPaid: true,
            subscriptionStatus: 'active',
            updatedAt: new Date().toISOString(),
        };

        // set(data, { merge: true }) を使うことで、既存の referralCount などを消さずに更新可能
        await adminDb.collection('users').doc(uid).set(userData, { merge: true });

        return res.status(200).json({ message: 'User updated successfully', uid });
    } catch (error: any) {
        console.error('Registration Error:', error);
        return res.status(500).json({ message: error.message || 'Internal Server Error' });
    }
}