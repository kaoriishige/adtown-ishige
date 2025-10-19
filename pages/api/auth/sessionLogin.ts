// pages/api/auth/sessionLogin.ts (修正後の完全コード)


import { NextApiRequest, NextApiResponse } from 'next';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import nookies from 'nookies';
import * as admin from 'firebase-admin';


export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        return res.status(405).end('Method Not Allowed');
    }


    let idToken = '';
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
        idToken = authHeader.split(' ')[1];
    } else if (req.body?.idToken) {
        idToken = req.body.idToken;
    }


    if (!idToken) {
        return res.status(401).json({ error: 'Authorization header with Bearer token or body.idToken is required.' });
    }


    const { loginType = 'user' } = req.body || {};
    const expiresIn = 60 * 60 * 24 * 5 * 1000;


    try {
        let decodedToken: admin.auth.DecodedIdToken;
        try {
            decodedToken = await adminAuth.verifyIdToken(idToken);
        } catch (tokenError) {
            console.error('verifyIdToken failed:', tokenError);
            return res.status(401).json({ error: 'Invalid ID token.' });
        }


        const uid = decodedToken.uid;
        if (!uid) {
            return res.status(400).json({ error: 'Invalid token payload.' });
        }


        const userDoc = await adminDb.collection('users').doc(uid).get();
        if (!userDoc.exists) {
            return res.status(404).json({ error: 'User data not found in database.' });
        }


        const userData = userDoc.data() || {};
        const userRoles: string[] = Array.isArray(userData.roles) ? userData.roles : (userData.role ? [userData.role] : []);
       
        // 🚨 修正箇所 1: デフォルトのパスを一般ユーザー向けに設定
        let redirectPath = '/users/dashboard';


        // 2. パートナーログインの処理とパス決定
        if (loginType !== 'user') {
            const requiredRole = loginType;
            const hasRequiredRole = userRoles.includes(requiredRole);


            if (!hasRequiredRole) {
                const errorMsg =
                    requiredRole === 'adver'
                        ? 'このアカウントは広告パートナーとして登録されていません。'
                        : 'このアカウントは求人パートナーとして登録されていません。';
                return res.status(403).json({ error: errorMsg });
            }


            // 🚨 修正箇所 2: ログインタイプに基づいてリダイレクトパスを上書き決定
            if (requiredRole === 'recruit') {
                redirectPath = '/recruit/dashboard'; // 求人パートナー専用ダッシュボード
            } else if (requiredRole === 'adver') {
                redirectPath = '/partner/dashboard'; // 広告パートナー専用ダッシュボード
            }


            // 求人パートナーログイン時 ('recruit') に recruiters ドキュメントを自動生成 (ロジック維持)
            if (requiredRole === 'recruit') {
                const recruiterRef = adminDb.collection('recruiters').doc(uid);
                const recruiterSnap = await recruiterRef.get();


                if (!recruiterSnap.exists) {
                    console.log(`Recruiter profile not found for ${uid}. Creating basic profile for access stability.`);
                    await recruiterRef.set({
                        uid: uid,
                        companyName: userData.companyName || userData.email || '初期設定が必要な会社名',
                        minMatchScore: 60,
                        verificationStatus: 'unverified',
                        createdAt: admin.firestore.FieldValue.serverTimestamp(),
                        appealPoints: {
                            atmosphere: [], growth: [], wlb: [], benefits: [], organization: []
                        }
                    }, { merge: true });
                }
            }
        }


        // 3. セッションをセット
        const sessionCookie = await adminAuth.createSessionCookie(idToken, { expiresIn });
        const isProd = process.env.NODE_ENV === 'production';
       
        nookies.set({ res }, 'session', sessionCookie, {
            maxAge: Math.floor(expiresIn / 1000),
            path: '/',
            httpOnly: true,
            secure: isProd,
            sameSite: 'lax',
        });


        // 🚨 修正箇所 3: 決定したリダイレクトパスをクライアントに返します
        return res.status(200).json({ status: 'success', redirect: redirectPath });


    } catch (error: any) {
        console.error('Session login error:', error);
        return res.status(500).json({ error: '認証に失敗しました。時間をおいて再度お試しください。' });
    }
}






