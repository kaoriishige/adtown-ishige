import { NextApiRequest, NextApiResponse } from 'next';
import { adminAuth, adminDb } from '@/lib/firebase-admin';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
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
        // 1. トークン検証
        const decodedToken = await adminAuth.verifyIdToken(idToken);
        const uid = decodedToken.uid;

        // 2. ユーザー確認（ログを出力して原因を特定しやすくする）
        const userDoc = await adminDb.collection('users').doc(uid).get();
        
        // もしusersコレクションに無くても、セッション作成自体は進めるように修正
        // （別コレクションにデータがある場合や、初回ログイン時のフリーズを防ぐため）
        if (!userDoc.exists) {
            console.warn(`[Auth Warning] UID: ${uid} が users コレクションに存在しません。`);
        }

        // 3. セッションクッキー作成（有効期限5日間）
        const expiresIn = 60 * 60 * 24 * 5 * 1000;
        const sessionCookie = await adminAuth.createSessionCookie(idToken, { expiresIn });

        const isProduction = process.env.NODE_ENV === 'production';
        const COOKIE_NAME = 'session';
        const COOKIE_OPTIONS = [
            `Max-Age=${60 * 60 * 24 * 5}`,
            'HttpOnly',
            'SameSite=Lax',
            'Path=/',
            isProduction ? 'Secure' : '',
        ].filter(Boolean).join('; ');

        res.setHeader('Set-Cookie', `${COOKIE_NAME}=${sessionCookie}; ${COOKIE_OPTIONS}`);

        // 4. リダイレクト先の決定
        let redirectPath = '/premium/dashboard';
        if (loginType === 'recruit') {
            redirectPath = '/recruit/dashboard';
        } else if (loginType === 'adver') {
            redirectPath = '/partner/dashboard';
        }

        return res.status(200).json({ uid, redirect: redirectPath });

    } catch (error: any) {
        console.error('Session Login API error:', error);
        return res.status(401).json({ error: '認証に失敗しました。' });
    }
}