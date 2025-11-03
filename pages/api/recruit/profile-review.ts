import { NextApiRequest, NextApiResponse } from 'next';
import { adminDb } from '@/lib/firebase-admin'; // ★ 修正: adminAuth を削除
import * as admin from 'firebase-admin';

// --- 型定義 ---
type VerificationStatus = 'unverified' | 'pending_review' | 'verified' | 'rejected';

// --- 審査ロジック (ダミー) ---
async function performAIGrading(uid: string): Promise<{ status: VerificationStatus, feedback: string }> {
    // 実際にはここで、Gemini APIを呼び出し、プロンプトを渡して審査を実行します。
    
    // ダミーロジック: 常に承認済み (verified) を返します。
    // 審査ロジックをバイパスし、早期に機能テストを行うため。
    
    // await new Promise(resolve => setTimeout(resolve, 500)); // 審査時間のシミュレーション

    return {
        status: 'verified',
        feedback: 'AIによりプロファイルが優秀であると評価されました。求人は公開可能状態です。',
    };
}


// --- メイン Webhook ハンドラー ---
export default async function handler(req: NextApiRequest, res: NextApiResponse<{ message: string } | { error: string }>) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', 'POST');
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { uid } = req.body;
    
    if (!uid) {
        return res.status(400).json({ error: 'UIDが不足しています。' });
    }

    // 💡 認証チェックは省略（クライアント側で認証済みとして信頼）
    
    try {
        // 1. AI審査ロジックを実行
        const reviewResult = await performAIGrading(uid);

        // 2. Firestoreを更新
        const recruiterRef = adminDb.collection('recruiters').doc(uid);
        
        await recruiterRef.update({
            verificationStatus: reviewResult.status,
            aiFeedback: reviewResult.feedback,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        
        // 3. 成功応答
        return res.status(200).json({ message: 'AI審査が完了し、ステータスが更新されました。' });

    } catch (e: any) {
        console.error('❌ AI審査APIエラー:', e);
        
        // 審査APIが失敗した場合、ステータスを rejected に強制更新し、クライアントにエラーを返す。
        await adminDb.collection('recruiters').doc(uid).update({
            verificationStatus: 'rejected',
            aiFeedback: `システムエラーにより審査が中断されました。再試行してください。エラー: ${e.message}`,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        return res.status(500).json({ error: `サーバー側でのAI審査処理中にエラーが発生しました: ${e.message}` });
    }
}