import { NextApiRequest, NextApiResponse } from 'next';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import * as admin from 'firebase-admin';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', ['POST']);
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const idToken = req.headers.authorization?.split('Bearer ')[1];
    const { loginType } = req.body; // 'recruit' or 'adver'

    if (!idToken || !loginType) {
        return res.status(401).json({ error: 'Authorization token or login type is missing.' });
    }

    try {
        // 1. IDトークンを検証してユーザー情報を取得
        const decodedToken = await adminAuth.verifyIdToken(idToken);
        const uid = decodedToken.uid;

        // 2. Firestoreでユーザーのロールとデータを検証
        const userDocRef = adminDb.collection('users').doc(uid);
        const userDoc = await userDocRef.get();

        if (!userDoc.exists) {
            // Firebase Authにはいるが、Firestoreにデータがない場合
            await adminAuth.revokeRefreshTokens(uid); // セキュリティのためトークンを無効化
            // クライアント側でエラー処理させるためにログアウトさせる
            return res.status(403).json({ error: 'user_data_missing' }); 
        }

        const userData = userDoc.data();
        const requiredRole = loginType === 'recruit' ? 'recruit' : 'adver';

        // ロールチェック：ログインタイプと一致するロールを持っているか確認
        if (!userData?.roles || !userData.roles.includes(requiredRole)) {
            await adminAuth.revokeRefreshTokens(uid); // セキュリティのためトークンを無効化
            return res.status(403).json({ error: 'permission_denied' }); 
        }

        // 3. セッションクッキーを作成し、クライアントに送信
        const sessionCookie = await adminAuth.createSessionCookie(idToken, { expiresIn: 60 * 60 * 24 * 5 * 1000 }); // 5日間有効
        
        const isProduction = process.env.NODE_ENV === 'production';
        const domain = process.env.NEXT_PUBLIC_APP_DOMAIN;
        
        const COOKIE_OPTIONS = [
            `Max-Age=${60 * 60 * 24 * 5}`,
            'HttpOnly',
            'SameSite=Strict', 
            'Path=/',
            isProduction ? 'Secure' : '',
            (isProduction && domain) ? `Domain=${domain}` : '', // ★本番環境でのドメイン指定
        ].filter(Boolean).join('; ');

        res.setHeader('Set-Cookie', `__session=${sessionCookie}; ${COOKIE_OPTIONS}`);

        // 4. リダイレクト先を決定 (ダッシュボードへ)
        const redirectPath = loginType === 'recruit' ? '/recruit/dashboard' : '/partner/dashboard';

        res.status(200).json({ uid, redirect: redirectPath, message: 'ログインが完了しました。' });

    } catch (error: any) {
        console.error('Session Login API error:', error);
        // Admin SDKの検証エラー、トークン期限切れ、初期化失敗などが含まれる
        const errorMessage = error.message || 'セッション作成中にサーバーエラーが発生しました。';
        res.status(401).json({ error: 'Invalid ID token.' }); 
    }
}