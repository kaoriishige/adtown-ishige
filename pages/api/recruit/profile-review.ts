import { NextApiRequest, NextApiResponse } from 'next';
import { adminDb } from '@/lib/firebase-admin';
import * as admin from 'firebase-admin';

// --- 型定義 ---
type VerificationStatus = 'unverified' | 'pending_review' | 'verified' | 'rejected';

// --- 審査ロジック (ダミー) ---
async function performAIGrading(uid: string): Promise<{ status: VerificationStatus, feedback: string }> {
    // 実際にはここで、Gemini APIを呼び出し、プロンプトを渡して審査を実行します。
    // 処理時間が長くフリーズする場合は、Cloud Functionsへの移行を検討してください。

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

    // ★★★ 修正: Firestore参照を 'users' コレクションに統一 ★★★
    const userRef = adminDb.collection('users').doc(uid); 
    // ★★★

    try {
        // 1. AI審査ロジックを実行
        const reviewResult = await performAIGrading(uid);

        // 2. Firestoreを更新 (ユーザーデータ内に求人プロフィールを保存する構造)
        await userRef.update({
            verificationStatus: reviewResult.status, // usersドキュメント内にverificationStatusがあることを想定
            aiFeedback: reviewResult.feedback,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        // 3. 成功応答
        return res.status(200).json({ message: 'AI審査が完了し、ステータスが更新されました。' });

    } catch (e: any) {
        console.error('❌ サーバー側AI審査APIエラー:', e);

        // 審査APIが失敗した場合、ステータスを rejected に強制更新
        await userRef.update({
            verificationStatus: 'rejected',
            aiFeedback: `システムエラーにより審査が中断されました。再試行してください。`,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        return res.status(500).json({ error: `AI審査処理中に致命的なエラーが発生しました。` });
    }
}