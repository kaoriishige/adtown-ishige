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
        // 1) トークン検証
        const decodedToken = await adminAuth.verifyIdToken(idToken);
        const uid = decodedToken.uid;

        // 2) ユーザー確認（なくても止めない）
        const userDoc = await adminDb.collection('users').doc(uid).get();
        if (!userDoc.exists) {
            console.warn(
                `[Auth Warning] UID: ${uid} が users コレクションに存在しません。`
            );
        }

        // 3) セッションクッキー作成（5日）
        const expiresIn = 60 * 60 * 24 * 5 * 1000;
        const sessionCookie = await adminAuth.createSessionCookie(idToken, {
            expiresIn,
        });

        // ===== ★★ ここが“本番＋スマホ対応の決定版” ★★ =====
        const cookie = [
            `session=${sessionCookie}`,
            `Max-Age=${60 * 60 * 24 * 5}`,
            'HttpOnly',
            'Path=/',
            'SameSite=None', // ← スマホ対策
            'Secure',        // ← 本番必須
        ].join('; ');

        res.setHeader('Set-Cookie', cookie);

        // 4) リダイレクト先の決定
        let redirectPath = '/premium/dashboard';

        if (loginType === 'recruit') {
            redirectPath = '/recruit/dashboard';
        } else if (loginType === 'adver') {
            redirectPath = '/partner/dashboard';
        }

        // 5) 成功レスポンス（必ずJSON）
        return res.status(200).json({ uid, redirect: redirectPath });
    } catch (error) {
        console.error('Session Login API error:', error);
        return res.status(401).json({ error: '認証に失敗しました。' });
    }
}

