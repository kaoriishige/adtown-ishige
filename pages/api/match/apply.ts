import type { NextApiRequest, NextApiResponse } from 'next';
import { adminDb } from '@/lib/firebase-admin';
import { calculateMatchScore, CompanyProfile } from '@/lib/ai-matching-engine';
import admin from 'firebase-admin';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userProfile, job, companyUid } = req.body;

    if (!userProfile || !job || !companyUid) {
      return res.status(400).json({ error: 'Missing required fields.' });
    }

    // Firestoreから企業プロフィールを取得
    const companyRef = adminDb.collection('companyProfiles').doc(companyUid);
    const companySnap = await companyRef.get();

    if (!companySnap.exists) {
      return res.status(404).json({ error: 'Company profile not found.' });
    }

    const companyProfile = companySnap.data() as CompanyProfile;

    // マッチングスコア算出
    const { score, reasons } = calculateMatchScore(userProfile, job, companyProfile);

    // 応募データ保存
    const applicationRef = adminDb.collection('jobApplications').doc();
    await applicationRef.set({
      id: applicationRef.id,
      userUid: userProfile.uid,
      companyUid,
      jobId: job.id,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      matchScore: score,
      matchReasons: reasons,
    });

    // マッチ結果を保存
    await adminDb.collection('matchResults').doc(applicationRef.id).set({
      applicationId: applicationRef.id,
      userUid: userProfile.uid,
      companyUid,
      score,
      reasons,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return res.status(200).json({
      message: 'Matching completed successfully.',
      matchScore: score,
      matchReasons: reasons,
    });
  } catch (err: any) {
    console.error('AI Match Error:', err);
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
}


