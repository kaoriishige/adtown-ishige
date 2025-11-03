import { NextApiRequest, NextApiResponse } from 'next';
// import { adminAuth } from '@/lib/firebase-admin'; // 認証チェック用 ★ 修正: 未使用のためコメントアウト
// import { cookies } from 'next/headers'; // 未使用のため削除済み

// --- 型定義 ---
interface AdviceData {
    summary: string;
    suggestions: string[];
    riskScore: number; 
}

// 認証チェックとリクエスト処理
export default async function handler(req: NextApiRequest, res: NextApiResponse<AdviceData | { error: string }>) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { jobTitle, jobDescription } = req.body;

    if (!jobTitle || !jobDescription) {
        return res.status(400).json({ error: '求人情報が不足しています。' });
    }

    // 💡 認証チェック (実際にはここでセッショントークンを検証し、isPaidを確認すべき)
    // 認証を有効にする際は、↑ adminAuth のコメントアウトを解除し、以下のロジックを使用してください。
    // const { adminAuth } = require('@/lib/firebase-admin'); 
    // const sessionCookie = req.cookies.session || '';
    // try {
    //     await adminAuth.verifySessionCookie(sessionCookie, true);
    // } catch (e) {
    //     return res.status(401).json({ error: '認証が必要です。' });
    // }

    // --- ダミーのAI分析結果を生成 ---
    // 実際にはここでGemini APIを呼び出し、求人分析を実行します。
    // 例: const prompt = `以下の求人情報を分析し、応募者を増やすための改善提案を日本語のJSON形式で提供してください: ${jobDescription}`;

    const mockAdvice: AdviceData = {
        summary: `この求人は給与面では魅力的ですが、企業文化や成長機会の記述が抽象的です。特に若手候補者はキャリアパスの明確化を求めています。`,
        suggestions: [
            "タイトル改善: ターゲット層に響くキーワード（例: 'リモート可', 'AI活用'）を追加してください。",
            "文化の具体化: 「フラットな社風」ではなく、「社長への提案制度」など具体的な制度を記述してください。",
            "給与リスク: 給与レンジが広すぎるため、ターゲットとする候補者のスキルレベルに応じた具体的な提示額を設定してください。",
            "必須スキル: 必須スキル欄に必須ではない要素が含まれているため、応募のハードルを上げています。必須要素のみ残してください。"
        ],
        riskScore: Math.floor(Math.random() * 40) + 60, // 60-99点のランダムスコア
    };
    
    // 処理の遅延をシミュレート
    await new Promise(resolve => setTimeout(resolve, 1500));

    return res.status(200).json(mockAdvice);
}
