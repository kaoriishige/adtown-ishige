import { NextApiRequest, NextApiResponse } from 'next';
import { getAuth } from 'firebase-admin/auth';
import { adminDb } from '@/lib/firebase-admin';

// adminAuth, adminDbはlib/firebase-admin.ts内で初期化・エクスポートされている
const adminAuth = getAuth(); // libのinitializeAdminAppが実行されることを前提とする

// ----------------------------------------------------
// NOTE: lib/firebase-admin.ts の修正により、adminAuth, adminDb は安定している
// ----------------------------------------------------

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        return res.status(405).end('Method Not Allowed');
    }

    // IDトークンをヘッダーから取得
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Authorization header with Bearer token is required.' });
    }
    const idToken = authHeader.split(' ')[1];

    // bodyからloginTypeを取得 ('adver' または 'recruit')
    const { loginType } = req.body;
    if (loginType !== 'adver' && loginType !== 'recruit') {
         return res.status(400).json({ error: 'Invalid login type provided.' });
    }

    const expiresIn = 60 * 60 * 24 * 5 * 1000; // 5日間

    try {
        const decodedToken = await adminAuth.verifyIdToken(idToken);
        const uid = decodedToken.uid;

        // データベースからユーザー情報を取得
        const userDoc = await adminDb.collection('users').doc(uid).get();
        if (!userDoc.exists) {
            throw new Error('User data not found in database.');
        }
        
        const userData = userDoc.data();
        const userRoles: string[] = userData?.roles || [];

        // ★★★ ログインロールチェックロジック ★★★
        
        let hasRequiredRole = false;
        
        // 1. 新しいロール (adver または recruit) があるかチェック
        if (userRoles.includes(loginType)) {
            hasRequiredRole = true;
        } 
        
        // 2. 古い 'partner' ロールがある場合、adver と recruit の両方を許可 (互換性維持)
        if (userRoles.includes('partner')) {
            hasRequiredRole = true;
        }

        if (!hasRequiredRole) {
            const errorMsg = loginType === 'adver' ? 
                             'このアカウントは広告パートナーとして登録されていません。' : 
                             'このアカウントは求人パートナーとして登録されていません。';
            return res.status(403).json({ error: errorMsg });
        }
        
        // セッションCookieを作成
        const sessionCookie = await adminAuth.createSessionCookie(idToken, { expiresIn });
        const options = { maxAge: expiresIn / 1000, httpOnly: true, secure: process.env.NODE_ENV === 'production', path: '/' };
        
        // ★★★ 修正箇所: Cookie名を 'session' に設定し直し、ダッシュボードでの読み込みを正常化 ★★★
        res.setHeader('Set-Cookie', `session=${sessionCookie}; Max-Age=${options.maxAge}; Path=${options.path}; ${options.httpOnly ? 'HttpOnly;' : ''} ${options.secure ? 'Secure;' : ''} SameSite=Lax`);
        
        res.status(200).json({ status: 'success' });

    } catch (error: any) {
        console.error('Login API error:', error);
        res.status(401).json({ error: '認証に失敗しました。時間をおいて再度お試しください。' });
    }
}






