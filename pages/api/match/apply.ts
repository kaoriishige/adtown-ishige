/**
 * pages/api/match/apply.ts: APIエンドポイントハンドラー (単一求人への応募とマッチング結果の保存)
 * * - 応募ボタン押下時に呼び出される。
 * - matchResults と applicants の両方にデータを保存（バッチ処理）。
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { adminDb, adminAuth } from '@/lib/firebase-admin'; // Firestore Admin SDK
import { FieldValue } from 'firebase-admin/firestore'; // FieldValueを直接インポート
// 💡 ロジック本体をインポート (プロジェクトのパスに合わせてください)
// calculateMatchScoreが定義されているファイルパスを使用
import { calculateMatchScore, UserProfile, Job, CompanyProfile } from '@/lib/ai-matching-engine'; 
import nookies from 'nookies';

// Note: UserProfile, Job, CompanyProfile の型定義は '@/lib/ai-matching-engine' に依存

// 応答の型定義
type ApplyResponse = {
    message: string;
    matchScore: number;
    matchReasons: string[];
    error?: string;
};

export default async function handler(
    req: NextApiRequest, 
    res: NextApiResponse<ApplyResponse | { error: string }>
) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', 'POST');
        return res.status(405).json({ error: 'Method not allowed' });
    }

    let currentUserUid: string;
    const db = adminDb;

    try {
        // 1. 認証チェック
        const cookies = nookies.get({ req });
        const token = await adminAuth.verifySessionCookie(cookies.session || '', true);
        currentUserUid = token.uid;
    } catch (err) {
        console.error('Authentication Error:', err);
        return res.status(401).json({ error: 'Unauthorized' });
    }
    
    try {
        // req.bodyからデータを受信
        const { userProfile, job, companyUid } = req.body as { userProfile: UserProfile, job: Job, companyUid: string }; 

        if (!userProfile || !job || !companyUid) {
            return res.status(400).json({ error: 'Missing required fields (userProfile, job, or companyUid).' });
        }

        // 2. Firestoreから企業プロフィールを取得
        const companyRef = db.collection('recruiters').doc(companyUid); 
        const companySnap = await companyRef.get();

        if (!companySnap.exists) {
            return res.status(404).json({ error: 'Company profile not found in recruiters collection.' });
        }

        const companyData = companySnap.data();
        if (!companyData) {
            return res.status(404).json({ error: 'Company data is empty.' });
        }

        // 💡 calculateMatchScoreが期待する型にキャスト
        const companyProfile = companyData as CompanyProfile; 
        
        // 3. マッチングスコア算出
        const { score, reasons } = calculateMatchScore(userProfile, job, companyProfile);

        // 4. バッチ処理の準備
        const batch = db.batch();
        const timestamp = FieldValue.serverTimestamp();

        // 5. 'matchResults' コレクションの更新/保存
        const matchResultId = `${currentUserUid}_${job.id}`;
        const matchResultRef = db.collection('matchResults').doc(matchResultId);
        
        batch.set(matchResultRef, {
            userUid: currentUserUid,
            companyUid,
            jobId: job.id,
            score,
            reasons,
            updatedAt: timestamp,
        }, { merge: true });
        
        // 6. 'applicants' コレクションへの書き込み（応募履歴の作成）
        
        // 既に応募済みでないかチェック (必須)
        const existingAppSnap = await db.collection('applicants')
            .where('userUid', '==', currentUserUid)
            .where('recruitmentId', '==', job.id)
            .limit(1).get();

        if (existingAppSnap.empty) {
            const applicantData = {
                userUid: currentUserUid,
                recruitmentId: job.id,
                companyUid: companyUid,
                
                status: 'applied', // 企業審査中
                matchStatus: 'applied',
                
                jobTitle: job.jobTitle || 'タイトル不明', 
                companyName: companyData.companyName || '企業名不明',
                
                matchScore: score,
                companyFeedback: null, 
                createdAt: timestamp,
                updatedAt: timestamp,
            };

            // 'applicants' コレクションに新しい応募ドキュメントを作成 (IDは自動生成)
            batch.set(db.collection('applicants').doc(), applicantData);
        } else {
            // 既に応募済みであれば、応募履歴を更新（updatedAtのみ）
            batch.update(existingAppSnap.docs[0].ref, {
                updatedAt: timestamp,
            });
            console.log(`User ${currentUserUid} already applied to job ${job.id}. Updating timestamp.`);
        }
        
        // 7. バッチをコミット
        await batch.commit();

        return res.status(200).json({
            message: 'Matching and Application completed successfully.',
            matchScore: score,
            matchReasons: reasons,
        });
    } catch (err: any) {
        console.error('AI Match Error:', err);
        return res.status(500).json({ error: err.message || 'Internal server error' });
    }
}


