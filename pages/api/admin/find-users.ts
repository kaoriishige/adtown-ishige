import type { NextApiRequest, NextApiResponse } from 'next';
import { adminAuth, adminDb } from '../../../lib/firebase-admin';
import nookies from 'nookies';

type UserData = {
  uid: string;
  email: string;
  name?: string;
  points?: {
    balance: number;
    usableBalance: number;
  };
};

type ErrorResponse = {
  error: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse< { users: UserData[] } | ErrorResponse>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    // --- 管理者認証 ---
    const cookies = nookies.get({ req });
    if (!cookies.token) {
      return res.status(401).json({ error: 'Unauthorized: No token provided' });
    }
    const token = await adminAuth().verifySessionCookie(cookies.token, true);
    const adminUser = await adminAuth().getUser(token.uid);
    if (adminUser.customClaims?.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden: User is not an admin' });
    }

    const { query } = req.body;
    if (!query || typeof query !== 'string' || !query.trim()) {
      return res.status(400).json({ error: 'Search query is required.' });
    }

    const foundUsers: UserData[] = [];
    const auth = adminAuth();
    
    // ユーザーを検索 (Email or UID)
    let authUsers = [];
    try {
      // Emailで検索を試みる
      const userByEmail = await auth.getUserByEmail(query);
      authUsers.push(userByEmail);
    } catch (error: any) {
      if (error.code === 'auth/user-not-found') {
        // Emailで見つからなければUIDで検索を試みる
        try {
          const userByUid = await auth.getUser(query);
          authUsers.push(userByUid);
        } catch (uidError: any) {
          // UIDでも見つからない場合は空の結果を返す
          if (uidError.code === 'auth/user-not-found') {
            return res.status(200).json({ users: [] });
          }
          throw uidError; // その他のエラーは投げる
        }
      } else {
        throw error; // その他のエラーは投げる
      }
    }

    // Firestoreから追加情報を取得
    const db = adminDb();
    for (const authUser of authUsers) {
      const userDocRef = db.collection('users').doc(authUser.uid);
      const userDoc = await userDocRef.get();
      if (userDoc.exists) {
        const firestoreData = userDoc.data();
        foundUsers.push({
          uid: authUser.uid,
          email: authUser.email || '',
          name: firestoreData?.name || '名前未設定',
          points: firestoreData?.points || { balance: 0, usableBalance: 0 },
        });
      }
    }

    res.status(200).json({ users: foundUsers });

  } catch (error: any) {
    console.error('Error finding users:', error);
    res.status(500).json({ error: error.message || 'An unexpected error occurred.' });
  }
}