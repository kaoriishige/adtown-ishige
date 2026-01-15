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

        // 2. ユーザー確認（実際のデータ構造に基づき取得）
        const userDoc = await adminDb.collection('users').doc(uid).get();
        if (!userDoc.exists) {
            return res.status(403).json({ error: 'user_data_missing' });
        }

        const userData = userDoc.data();

        // 3. セッションクッキー作成（有効期限5日間）
        const expiresIn = 60 * 60 * 24 * 5 * 1000;
        const sessionCookie = await adminAuth.createSessionCookie(idToken, { expiresIn });

        const isProduction = process.env.NODE_ENV === 'production';
        const COOKIE_NAME = 'session';
        const COOKIE_OPTIONS = [
            `Max-Age=${60 * 60 * 24 * 5}`,
            'HttpOnly',
            'SameSite=Strict',
            'Path=/',
            isProduction ? 'Secure' : '',
        ].filter(Boolean).join('; ');

        res.setHeader('Set-Cookie', `${COOKIE_NAME}=${sessionCookie}; ${COOKIE_OPTIONS}`);

        // 4. 【確定】リダイレクト先の決定ロジック
        // 実際のデータにある「isPaid: true」を最優先で判定
        let redirectPath = '/home';

        if (userData?.isPaid === true) {
            // 有料会員（isPaid: true）ならプレミアムダッシュボードへ
            redirectPath = '/premium/dashboard';
        } else if (loginType === 'recruit') {
            redirectPath = '/recruit/dashboard';
        } else if (loginType === 'adver') {
            redirectPath = '/partner/dashboard';
        }

        // 全ての処理が完了。判定されたパスを返却
        return res.status(200).json({ uid, redirect: redirectPath });

    } catch (error: any) {
        console.error('Session Login API error:', error);
        return res.status(401).json({ error: '認証に失敗しました。' });
    }
}