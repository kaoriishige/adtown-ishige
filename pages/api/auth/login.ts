// Next.jsのAPIルートハンドラ
import { NextApiRequest, NextApiResponse } from 'next';
import nookies from 'nookies';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import * as admin from 'firebase-admin';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', ['POST']);
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    // クライアントがFirebase Authでサインインした後に発行されたIDトークンを受け取る
    const { idToken } = req.body; // クライアントから直接IDトークンを受け取る

    if (!idToken) {
        return res.status(401).json({ error: 'IDトークンがありません。' });
    }

    try {
        // 1. IDトークンを検証してユーザー情報を取得
        const decodedToken = await adminAuth.verifyIdToken(idToken);
        const uid = decodedToken.uid;

        // 2. ユーザーのFirestoreドキュメントからロールを確認
        const userDocRef = adminDb.collection('users').doc(uid);
        const userDoc = await userDocRef.get();
        const userData = userDoc.data();
        
        // パートナーロールの確認 (adverまたはrecruit)
        const roles: string[] = userData?.roles || [];
        if (!roles.includes('adver') && !roles.includes('recruit')) {
            return res.status(403).json({ error: '管理者またはパートナーの権限がありません。' });
        }
        
        // 3. セッションクッキーを作成し、クライアントに送信
        const sessionCookie = await adminAuth.createSessionCookie(idToken, { expiresIn: 60 * 60 * 24 * 5 * 1000 }); // 5日間有効

        // 本番環境でのクッキー動作を確実にするためのオプション
        const isProduction = process.env.NODE_ENV === 'production';
        const domain = process.env.NEXT_PUBLIC_APP_DOMAIN; 
        
        const COOKIE_OPTIONS = [
            `Max-Age=${60 * 60 * 24 * 5}`,
            'HttpOnly',
            'SameSite=Strict', // CSRF対策
            isProduction ? 'Secure' : '', // 本番環境ではHTTPS必須
            isProduction && domain ? `Domain=${domain}` : '', // 本番環境でのドメイン指定
            'Path=/',
        ].filter(Boolean).join('; ');

        // HTTPヘッダーにセッションクッキーをセット
        res.setHeader('Set-Cookie', `__session=${sessionCookie}; ${COOKIE_OPTIONS}`);

        res.status(200).json({ uid: uid, message: 'ログインに成功しました。' });

    } catch (error: any) {
        console.error('Login API error:', error);
        // IDトークン検証失敗時 (期限切れ、無効など)
        if (error.code === 'auth/argument-error' || error.code === 'auth/id-token-expired' || error.message.includes('Invalid ID token')) {
            res.status(401).json({ error: 'Invalid ID token.' });
        } else {
            res.status(500).json({ error: 'ログイン中にサーバーエラーが発生しました。' });
        }
    }
}