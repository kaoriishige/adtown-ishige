import { NextApiRequest, NextApiResponse } from 'next';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import * as admin from 'firebase-admin';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // クライアントがFirebase Authでサインアップした後に発行されたIDトークンを受け取る
  const idToken = req.headers.authorization?.split('Bearer ')[1];
  
  if (!idToken) {
    return res.status(401).json({ error: 'Authorization header is missing or invalid.' });
  }

  try {
    // 1. IDトークンを検証してユーザー情報を取得
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const uid = decodedToken.uid;
    const email = decodedToken.email;
    const name = req.body.name; // クライアントから名前を受け取る

    // 2. カスタムクレイムを設定
    await adminAuth.setCustomUserClaims(uid, { role: 'user' });

    // 3. Firestoreにユーザーデータを保存（初回登録時のみ）
    const userDocRef = adminDb.collection('users').doc(uid);
    const userDoc = await userDocRef.get();
    
    if (!userDoc.exists) {
      await userDocRef.set({
        email: email,
        name: name,
        role: 'user',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }

    // 4. セッションクッキーを作成し、クライアントに送信
    const sessionCookie = await adminAuth.createSessionCookie(idToken, { expiresIn: 60 * 60 * 24 * 5 * 1000 }); // 5日間有効
    
    // HTTPヘッダーにセッションクッキーをセット
    res.setHeader('Set-Cookie', `__session=${sessionCookie}; Max-Age=${60 * 60 * 24 * 5}; HttpOnly; Secure; SameSite=Strict; Path=/`);

    res.status(200).json({ uid: uid, message: 'ユーザー登録が完了しました。' });

  } catch (error: any) {
    console.error('Signup API error:', error);
    if (error.code === 'auth/id-token-expired') {
        res.status(401).json({ error: '認証トークンの有効期限が切れました。再度ログインしてください。' });
    } else {
        res.status(500).json({ error: '登録中にサーバーエラーが発生しました。' });
    }
  }
}