import type { NextApiRequest, NextApiResponse } from 'next';
import admin from '../../../lib/firebase-admin';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { authorization } = req.headers;
    if (!authorization || !authorization.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const token = authorization.split('Bearer ')[1];
    const decodedToken = await admin.auth().verifyIdToken(token);
    const { uid } = decodedToken;

    // Firestoreからユーザー情報を取得
    const userDocRef = admin.firestore().collection('users').doc(uid);
    const userDocSnap = await userDocRef.get();
    
    if (!userDocSnap.exists) {
        return res.status(404).json({ error: 'User not found' });
    }

    const userData = userDocSnap.data();
    // ここで紹介情報など、他の情報も取得して追加することが可能
    // const referralLink = `https://minna-no-nasu-app.netlify.app/?ref=${uid}`;

    res.status(200).json({
      email: userData?.email,
      // referralLink: referralLink,
      // その他のマイページに必要な情報
    });
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}