import type { NextApiRequest, NextApiResponse } from 'next';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { serialize } from 'cookie';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', 'POST');
        return res.status(405).end('Method Not Allowed');
    }

    try {
        // 1. クライアントから送られてきたIDトークンを取得
        const { idToken } = req.body;
        if (!idToken) {
            return res.status(401).json({ error: 'ID Token is required.' });
        }
        
        // 2. IDトークンを検証し、ユーザーIDを取得
        const decodedIdToken = await adminAuth.verifyIdToken(idToken);
        const uid = decodedIdToken.uid;
        
        // 3. ユーザーの役割(role)をデータベースから取得
        const userDoc = await adminDb.collection('users').doc(uid).get();
        if (!userDoc.exists) {
            throw new Error('User data not found in database.');
        }
        const roles = userDoc.data()?.roles || [];
        
        // 4. 役割に応じて、どこに案内するか決定
        let redirectTo = '/'; // デフォルトの行き先
        if (roles.includes('partner')) {
            redirectTo = '/partner/dashboard';
        } else if (roles.includes('recruit')) {
            redirectTo = '/recruit/dashboard';
        }

        // 5. 安全なセッションクッキーを作成し、ブラウザに保存
        const expiresIn = 60 * 60 * 24 * 5 * 1000; // 5日間有効
        const sessionCookie = await adminAuth.createSessionCookie(idToken, { expiresIn });
        
        const options = {
            maxAge: expiresIn / 1000,
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            path: '/',
            sameSite: 'lax' as const,
        };
        res.setHeader('Set-Cookie', serialize('session', sessionCookie, options));

        // 6. クライアントに行き先を教える
        res.status(200).json({ success: true, redirectTo: redirectTo });

    } catch (error: any) {
        console.error('Login API error:', error);
        res.status(401).json({ error: error.message });
    }
}