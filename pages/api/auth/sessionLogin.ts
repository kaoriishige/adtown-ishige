import { NextApiRequest, NextApiResponse } from 'next';
import { adminAuth, adminDb } from '@/lib/firebase-admin';

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    // ====== CORS + キャッシュ対策（スマホ必須）======
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST');
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
    res.setHeader('Pragma', 'no-cache');

    if (req.method !== 'POST') {
        res.setHeader('Allow', ['POST']);
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const authHeader = req.headers.authorization;
    const idToken = authHeader?.startsWith('Bearer ')
        ? authHeader.replace('Bearer ', '')
        : null;

    const { loginType } = req.body;

    if (!idToken) {
        return res.status(401).json({ error: '認証トークンがありません。' });
    }

    try {
        // ===============================
        // 1) Firebaseトークン検証
        // ===============================
        const decodedToken = await adminAuth.verifyIdToken(idToken);
        const uid = decodedToken.uid;

        // ===============================
        // 2) ユーザーデータ確認（必須にしない）
        // ===============================
        const userDoc = await adminDb.collection('users').doc(uid).get();

        if (!userDoc.exists) {
            console.warn(
                `[Auth Warning] UID: ${uid} が users コレクションに存在しません。`
            );
        }

        // ===============================
        // 3) セッションクッキー作成（5日）
        // ★ スマホ対応の安全設定に変更
        // ===============================
        const expiresIn = 60 * 60 * 24 * 5 * 1000; // 5日

        const sessionCookie = await adminAuth.createSessionCookie(idToken, {
            expiresIn,
        });

        const isProduction = process.env.NODE_ENV === 'production';

        // ---- ★ ここが“スマホで固まる原因の核心”なので修正 ----
        res.setHeader('Set-Cookie', [
            `session=${sessionCookie}`,
            `Max-Age=${60 * 60 * 24 * 5}`,
            'HttpOnly',
            'Path=/',
            'SameSite=Lax',
            isProduction ? 'Secure' : '',
        ]
            .filter(Boolean)
            .join('; '));

        // ===============================
        // 4) リダイレクト先を確定
        // ===============================
        let redirectPath = '/premium/dashboard';

        if (loginType === 'recruit') {
            redirectPath = '/recruit/dashboard';
        } else if (loginType === 'adver') {
            redirectPath = '/partner/dashboard';
        }

        // ===============================
        // 5) ★ 必ず JSON を返す（スマホ必須）
        // ===============================
        return res.status(200).json({
            uid,
            redirect: redirectPath,
            ok: true,
        });
    } catch (error: any) {
        console.error('Session Login API error:', error);

        return res.status(401).json({
            error: '認証に失敗しました。もう一度ログインしてください。',
        });
    }
}
