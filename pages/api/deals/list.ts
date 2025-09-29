import { NextApiRequest, NextApiResponse } from 'next';
import { adminDb } from '../../../lib/firebase-admin';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).end();
  }

  try {
    const db = adminDb;
    const dealsRef = db.collection('deals');
    const snapshot = await dealsRef.where('isActive', '==', true).orderBy('createdAt', 'desc').get();

    if (snapshot.empty) {
      return res.status(200).json([]);
    }

    const deals = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    res.status(200).json(deals);

  } catch (error) {
    console.error('Failed to fetch deals', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}