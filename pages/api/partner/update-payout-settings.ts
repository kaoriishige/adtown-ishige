import type { NextApiRequest, NextApiResponse } from 'next';
import { adminDb } from '@/lib/firebase-admin';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { uid, settings } = req.body;

    if (!uid) {
      return res.status(400).json({ message: 'UID is required' });
    }

    // Firestoreのpartnersコレクションの該当ユーザーUIDドキュメントを更新
    await adminDb.collection('partners').doc(uid).set({
      payoutSettings: settings,
      updatedAt: new Date().toISOString(),
    }, { merge: true });

    return res.status(200).json({ message: 'Success' });
  } catch (error: any) {
    console.error('Error updating payout settings:', error);
    return res.status(500).json({ message: 'Internal Server Error', error: error.message });
  }
}