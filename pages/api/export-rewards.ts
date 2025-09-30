import type { NextApiRequest, NextApiResponse } from 'next';
import { adminAuth, adminDb } from '../../lib/firebase-admin';

const escapeCsvValue = (value: any): string => {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end('Method Not Allowed');
  }

  try {
    const idToken = req.headers.authorization?.split('Bearer ')[1];
    if (!idToken) throw new Error('No token provided');
    await adminAuth.verifyIdToken(idToken);

    const rewardsSnapshot = await adminDb.collection('rewards').get();
    if (rewardsSnapshot.empty) {
      return res.status(404).send('No rewards found.');
    }

    const headers = ['id', 'name', 'points', 'description'];
    const csvRows = rewardsSnapshot.docs.map(doc => {
      const data = doc.data();
      const row = [ doc.id, data.name, data.points, data.description ];
      return row.map(escapeCsvValue).join(',');
    });

    const csvData = [headers.join(','), ...csvRows].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="rewards.csv"');
    return res.status(200).send(csvData);

  } catch (error: any) {
    console.error('Failed to export rewards:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}