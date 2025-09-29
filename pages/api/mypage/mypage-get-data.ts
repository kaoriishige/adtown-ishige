import type { NextApiRequest, NextApiResponse } from 'next';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import nookies from 'nookies';
import * as admin from 'firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';

// --- 型定義 ---
interface UserProfile {
    uid: string;
    email: string;
    name?: string;
    role?: string;
    points: {
        balance: number;
        usableBalance: number;
    };
    rewards: {
        totalRewardAmount: number;
        pendingRewardAmount: number;
    };
    lastLogin: string;
}

interface ErrorResponse {
    error: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<UserProfile | ErrorResponse>
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const idToken = req.headers.authorization?.split('Bearer ')[1] || req.cookies.token;
  if (!idToken) {
    return res.status(401).json({ error: 'ID token is missing.' });
  }

  try {
    // 認証オブジェクトを直接使用
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const userId = decodedToken.uid;

    // Firestoreオブジェクトを直接使用
    const userDoc = await adminDb.collection('users').doc(userId).get();

    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User profile not found.' });
    }

    const userData = userDoc.data();
    
    // ユーザー情報の整形
    const profile: UserProfile = {
      uid: userId,
      email: userData?.email || decodedToken.email || '',
      name: userData?.name || decodedToken.name,
      role: userData?.role || 'user',
      points: {
        balance: userData?.points?.balance || 0,
        usableBalance: userData?.points?.usableBalance || 0,
      },
      rewards: {
        totalRewardAmount: userData?.totalRewardAmount || 0,
        pendingRewardAmount: userData?.pendingRewardAmount || 0,
      },
      lastLogin: new Date().toISOString(),
    };

    return res.status(200).json(profile);
  } catch (error) {
    console.error('Error fetching user data:', error);
    return res.status(401).json({ error: 'Authentication failed or data error.' });
  }
}