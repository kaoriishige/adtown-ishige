import type { NextApiRequest, NextApiResponse } from 'next';
import { adminDb } from '@/lib/firebase-admin';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // POSTメソッド以外は受け付けない
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { targetUserId } = req.body;
  console.log(`[API] Attempting to delete user: ${targetUserId}`);

  if (!targetUserId) {
    return res.status(400).json({ error: 'User ID is required' });
  }

  try {
    // Firestoreから物理削除を実行
    // コレクション名が 'users' であることを再確認してください
    const docRef = adminDb.collection('users').doc(targetUserId);
    const doc = await docRef.get();

    if (!doc.exists) {
      console.log(`[API] Document not found: ${targetUserId}`);
      return res.status(404).json({ error: 'Document not found' });
    }

    await docRef.delete();
    console.log(`[API] Successfully deleted: ${targetUserId}`);

    return res.status(200).json({ message: 'Success' });
  } catch (error: any) {
    console.error('[API] Firestore Delete Error:', error);
    return res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
}