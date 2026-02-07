import { NextApiRequest, NextApiResponse } from 'next';
import { adminAuth, adminDb } from '@/lib/firebase-admin';

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', ['POST']);
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const idToken = req.headers.authorization?.split('Bearer ')[1];
    const { loginType } = req.body;

    if (!idToken) {
        return res.status(401).json({ error: '認証トークンがありません。' });
    }

    try {
        // 1) トークン検証（元コードと同じ）
        const decodedToken = await adminAuth.verifyIdToken(idToken);
        const uid = decodedToken.uid;

        // 2) ユーザー確認（元コードと同じ）
        const userDoc = await adminDb.collection('users').doc(uid).get();

        if (!userDoc.exists) {
            console.warn(`[Auth Warning] UID: ${uid} が users コレクションに存在しません。`);
        }

        // 3) セッションクッキー作成（★ここだけ“安全修正”）
        const expiresIn = 60 * 60 * 24 * 5 * 1000; // 5日
        const sessionCookie = await adminAuth.createSessionCookie(idToken, { expiresIn });

        const isProduction = process.env.NODE_ENV === 'production';

        // ====== ★★ ここが“スマホも通る＋他のログインも壊さない”設定 ★★ ======
        const cookie = [
            `session=${sessionCookie}`,
            `Max-Age=${60 * 60 * 24 * 5}`,
            'HttpOnly',
            'Path=/',
            'SameSite=Lax',
            isProduction ? 'Secure' : '',
        ]
            .filter(Boolean)
            .join('; ');

        res.setHeader('Set-Cookie', cookie);

        // 4) リダイレクト先
        let redirectPath = '/premium/dashboard';
        if (loginType === 'recruit') {
            redirectPath = '/recruit/dashboard';
        } else if (loginType === 'adver') {
            redirectPath = '/partner/dashboard';
        }

        // 5) かならずJSONで返す（★超重要）
        return res.status(200).json({ uid, redirect: redirectPath });
    } catch (error) {
        console.error('Session Login API error:', error);
        return res.status(401).json({ error: '認証に失敗しました。' });
    }
}

