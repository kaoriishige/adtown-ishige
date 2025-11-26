import type { NextApiRequest, NextApiResponse } from 'next';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import nookies from 'nookies';
import { FieldValue } from 'firebase-admin/firestore';

/**
 * 応答型定義
 */
interface ReviewResponse {
    success: boolean;
    message: string;
    error?: string;
}

/**
 * 企業プロフィールのAI審査トリガーAPIハンドラ
 */
export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<ReviewResponse | { error: string }>
) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', 'POST');
        return res.status(405).json({ error: 'Method Not Allowed' });
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
        // 2. クライアントに即座に応答を返す（フリーズ回避）
        res.status(200).json({ success: true, message: 'AI審査を受け付けました。' });

        // 3. 非同期で審査ロジックをトリガー（応答後も処理を継続）
        // NOTE: この部分はクライアントに応答を返した後、サーバー側で非同期に実行されます。
        
        await new Promise(resolve => setTimeout(resolve, 5000)); // 審査時間（5秒）をシミュレート
        
        const userRef = db.collection('users').doc(currentUserUid);
        const userSnap = await userRef.get();
        
        if (!userSnap.exists) return;

        // ★★★ FIX: ランダム判定を削除し、常に承認 (verified) に設定 ★★★
        const newStatus = 'verified'; 
        const newFeedback = 'AIがプロファイルの整合性を確認し、魅力的であると判断しました。プロファイルは公開状態です。';

        // 4. Firestoreに審査結果を書き込む
        await userRef.update({
            verificationStatus: newStatus,
            aiFeedback: newFeedback,
            updatedAt: FieldValue.serverTimestamp(),
        });

        console.log(`[AI Review] User ${currentUserUid} result: ${newStatus}`);
        
    } catch (error) {
        console.error('AI Review Async Process Failed:', error);
    }
}