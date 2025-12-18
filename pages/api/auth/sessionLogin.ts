import { NextApiRequest, NextApiResponse } from 'next';
import { adminAuth, adminDb } from '@/lib/firebase-admin';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', ['POST']);
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const idToken = req.headers.authorization?.split('Bearer ')[1];
    const { loginType } = req.body; 

    if (!idToken || !loginType) {
        return res.status(401).json({ error: 'Authorization token or login type is missing.' });
    }

    try {
        // 1. IDトークンを検証
        const decodedToken = await adminAuth.verifyIdToken(idToken);
        const uid = decodedToken.uid;

        // 2. Firestoreでユーザーのロールとデータを検証
        const userDocRef = adminDb.collection('users').doc(uid);
        const userDoc = await userDocRef.get();

        if (!userDoc.exists) {
            // 登録がない場合は403エラーと特定の文字列を返す
            return res.status(403).json({ error: 'user_data_missing' }); 
        }

        const userData = userDoc.data();
        const requiredRole = loginType === 'recruit' ? 'recruit' : 'adver';

        // ロールチェック
        if (!userData?.roles || !userData.roles.includes(requiredRole)) {
            return res.status(403).json({ error: 'permission_denied' }); 
        }

        // 3. セッションクッキーを作成
        const sessionCookie = await adminAuth.createSessionCookie(idToken, { expiresIn: 60 * 60 * 24 * 5 * 1000 });
        
        const isProduction = process.env.NODE_ENV === 'production';
        const domain = process.env.NEXT_PUBLIC_APP_DOMAIN;
        
        const COOKIE_OPTIONS = [
            `Max-Age=${60 * 60 * 24 * 5}`,
            'HttpOnly',
            'SameSite=Strict', 
            'Path=/',
            isProduction ? 'Secure' : '',
            (isProduction && domain) ? `Domain=${domain}` : '',
        ].filter(Boolean).join('; ');

        res.setHeader('Set-Cookie', `__session=${sessionCookie}; ${COOKIE_OPTIONS}`);

        // 4. 正しいリダイレクト先を返す（フロントがこれを見て移動します）
        const redirectPath = loginType === 'recruit' ? '/recruit/dashboard' : '/partner/dashboard';

        return res.status(200).json({ uid, redirect: redirectPath, message: 'ログインが完了しました。' });

    } catch (error: any) {
        console.error('Session Login API error:', error);
        return res.status(401).json({ error: '認証に失敗しました。' }); 
    }
}




