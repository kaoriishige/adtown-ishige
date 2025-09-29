import type { NextApiRequest, NextApiResponse } from 'next';
import { adminAuth, adminDb } from '@/lib/firebase-admin'; // 正しいインポート文に修正
import nookies from 'nookies';
import * as admin from 'firebase-admin';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end('Method Not Allowed');
  }

  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    // 修正: adminAuthを直接使用
    const userRecord = await adminAuth.getUserByEmail(email);

    // 修正: adminAuthを直接使用
    if (!userRecord) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // クライアントからIDトークンを取得
    const idToken = req.body.idToken;
    if (!idToken) {
      return res.status(400).json({ error: 'ID token is required for session login' });
    }

    // IDトークンを検証
    // 修正: adminAuthを直接使用
    await adminAuth.verifyIdToken(idToken, true);

    // セッションクッキーを作成
    // 修正: adminAuthを直接使用
    const sessionCookie = await adminAuth.createSessionCookie(idToken, { expiresIn: 60 * 60 * 24 * 5 * 1000 });
    
    // セッションクッキーをクライアントに設定
    nookies.set({ res }, 'token', sessionCookie, {
      httpOnly: true,
      secure: process.env.NODE_ENV !== 'development',
      path: '/',
      maxAge: 60 * 60 * 24 * 5,
      sameSite: 'strict',
    });

    res.status(200).json({ status: 'success' });

  } catch (error) {
    console.error('Session login error:', error);
    return res.status(401).json({ error: 'Authentication failed' });
  }
}


