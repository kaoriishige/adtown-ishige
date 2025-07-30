import type { NextApiRequest, NextApiResponse } from 'next';
import admin from '../../lib/firebase-admin';

const convertToCSV = (data: any[]) => {
  if (data.length === 0) return '';
  const header = Object.keys(data[0]);
  const replacer = (key: string, value: any) => value === null ? '' : value;
  const csv = [
    header.join(','),
    ...data.map(row => header.map(fieldName => JSON.stringify(row[fieldName], replacer)).join(','))
  ].join('\r\n');
  return csv;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }
  try {
    const { authorization } = req.headers;
    if (!authorization) return res.status(401).json({ error: 'Unauthorized' });
    const token = authorization.split('Bearer ')[1];
    const decodedToken = await admin.auth().verifyIdToken(token);
    if (decodedToken.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }
    const listUsersResult = await admin.auth().listUsers(1000);
    const usersData = listUsersResult.users.map(user => ({
      uid: user.uid,
      email: user.email,
      emailVerified: user.emailVerified,
      creationTime: user.metadata.creationTime,
      lastSignInTime: user.metadata.lastSignInTime,
    }));
    const csvData = convertToCSV(usersData);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="users.csv"');
    res.status(200).send(csvData);
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
}