import type { NextApiRequest, NextApiResponse } from 'next';
import { adminAuth } from '@/lib/firebase-admin';
import { UserRecord } from 'firebase-admin/auth';

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

    const allUsers: UserRecord[] = [];
    let pageToken;
    do {
      const listUsersResult = await adminAuth.listUsers(1000, pageToken);
      allUsers.push(...listUsersResult.users);
      pageToken = listUsersResult.pageToken;
    } while (pageToken);

    const headers = ['uid', 'email', 'displayName', 'creationTime', 'lastSignInTime'];
    const csvRows = allUsers.map(user => {
      const row = [
        user.uid,
        user.email,
        user.displayName,
        new Date(user.metadata.creationTime).toISOString(),
        new Date(user.metadata.lastSignInTime).toISOString(),
      ];
      return row.map(escapeCsvValue).join(',');
    });
    
    const csvData = [headers.join(','), ...csvRows].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="users.csv"');
    return res.status(200).send(csvData);

  } catch (error: any) {
    console.error('Failed to export users:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}