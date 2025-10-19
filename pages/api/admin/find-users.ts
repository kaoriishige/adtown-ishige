import type { NextApiRequest, NextApiResponse } from 'next';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import nookies from 'nookies';
import * as admin from 'firebase-admin';

type UserData = {
  uid: string;
  email: string;
  name?: string;
  points?: {
    balance: number;
    usableBalance: number;
  };
};

type SuccessResponse = { users: UserData[] };
type ErrorResponse = { error: string };

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<SuccessResponse | ErrorResponse>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const cookies = nookies.get({ req });
    const token = await adminAuth.verifySessionCookie(cookies.token, true);
    const adminDoc = await adminDb.collection('users').doc(token.uid).get();

    if (!adminDoc.exists || adminDoc.data()?.role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized: User is not an admin' });
    }

    const { query } = req.body;
    if (!query || typeof query !== 'string' || !query.trim()) {
      return res.status(400).json({ error: 'Search query is required.' });
    }

    // 🔍 正規表現修正済み
    const sanitizedQuery = query.replace(/[.]+/g, '');

    const foundUsers: UserData[] = [];
    const auth = adminAuth;

    // --- 検索1: emailで検索 ---
    try {
      const userByEmail = await auth.getUserByEmail(sanitizedQuery);
      const userDoc = await adminDb.collection('users').doc(userByEmail.uid).get();

      if (userDoc.exists) {
        foundUsers.push({
          uid: userByEmail.uid,
          email: userByEmail.email!,
          name: userDoc.data()?.name,
          points: userDoc.data()?.points,
        });
      }
    } catch (e) {
      console.error('Email lookup failed:', e);

      // --- 検索2: uidで検索 ---
      try {
        const userById = await auth.getUser(sanitizedQuery);
        const userDoc = await adminDb.collection('users').doc(userById.uid).get();

        if (userDoc.exists) {
          foundUsers.push({
            uid: userById.uid,
            email: userById.email!,
            name: userDoc.data()?.name,
            points: userDoc.data()?.points,
          });
        }
      } catch (e2) {
        console.error('UID lookup failed:', e2);
      }
    }

    if (foundUsers.length === 0) {
      return res.status(200).json({ users: [] });
    }

    return res.status(200).json({ users: foundUsers });
  } catch (error) {
    console.error('Main handler error:', error);
    return res.status(500).json({ error: 'An error occurred' });
  }
}

