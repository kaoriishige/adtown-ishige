import { NextApiRequest, NextApiResponse } from 'next';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import nookies from 'nookies';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        // ユーザーの認証情報をCookieから取得・検証
        const cookies = nookies.get({ req });
        // NOTE: 前のコードではcookies.tokenを参照していましたが、sessionクッキーを使用している可能性を考慮し、
        // ログアウトなどのエラーを防ぐため、認証ロジックをより一般的な形に調整します。
        // ここではcookies.tokenを使用しますが、もし動かなければcookies.sessionに切り替えてください。
        if (!cookies.token) {
            return res.status(401).json({ error: 'Authentication required. No token provided.' });
        }
        
        // トークン検証
        let token;
        try {
            token = await adminAuth.verifySessionCookie(cookies.token, true);
        } catch (authError) {
            console.error("Session cookie verification failed:", authError);
            return res.status(401).json({ error: 'Authentication failed or session expired.' });
        }
        
        const { uid } = token; // ユーザーUID

        // データベースからユーザーのドキュメントを取得
        const userDoc = await adminDb.collection('users').doc(uid).get();
        if (!userDoc.exists) {
            return res.status(404).json({ error: 'User not found' });
        }

        const userData = userDoc.data() || {};
        
        // --- 応募状況サマリーの取得と集計 (追加ロジック) ---
        
        // 1. ログインユーザーの応募データをすべて取得 (コレクション名:'applicants', フィールド名:'userUid' を使用)
        const applicationsSnapshot = await adminDb.collection('applicants')
            .where('userUid', '==', uid) // initiateApply.ts とのフィールド名一致を確認
            .get();

        const applicationCounts = {
            screening: 0, // 企業審査中
            matched: 0, // マッチ成立
            rejected: 0, // 企業より見送り
        };

        // 2. 取得したデータに基づいて件数を集計
        applicationsSnapshot.docs.forEach(doc => {
            const status = doc.data().status; 
            
            // ダッシュボードの表示と照らし合わせ、各ステータスをカウント
            switch (status) {
                case 'screening':
                    applicationCounts.screening++;
                    break;
                case 'matched':
                    applicationCounts.matched++;
                    break;
                case 'rejected':
                    applicationCounts.rejected++;
                    break;
                // 'applied' ステータスの応募は、基本的に 'screening' の前段階または合計に含まれる
            }
        });

        // 「応募済み（合計）」は、フィルタリングされた全ドキュメントの総数
        const totalApplied = applicationsSnapshot.size;

        const statusSummary = {
            totalApplied: totalApplied,
            screening: applicationCounts.screening,
            matched: applicationCounts.matched,
            rejected: applicationCounts.rejected,
        };
        
        // --- 既存データ抽出ロジック ---
        
        // 必要なデータを全て抽出し、存在しない場合のデフォルト値を設定
        const pointsData = userData.points || {};
        const rewardsData = {
            total: userData.totalRewards || 0,
            pending: userData.unpaidRewards || 0
        };
        const treeData = userData.tree || {};

        // フロントエンドに返すデータを構築
        const responseData = {
            email: userData.email || '',
            points: {
                balance: pointsData.balance || 0,
                usableBalance: pointsData.usableBalance || 0,
                pendingBalance: pointsData.pendingBalance || 0,
                activationStatus: pointsData.activationStatus || '',
                expiredAmount: pointsData.expiredAmount || 0,
            },
            rewards: rewardsData,
            subscriptionStatus: userData.subscriptionStatus || null,
            tree: {
                level: treeData.level || 1,
                exp: treeData.exp || 0,
                expToNextLevel: treeData.expToNextLevel || 100,
                fruits: treeData.fruits || [],
                lastWatered: treeData.lastWatered || null,
            },
            lastLotteryPlayedAt: userData.lastLotteryPlayedAt || null,
            
            // 応募状況のサマリーを追加 👈 ここが最も重要
            applicationStatus: statusSummary, 
        };

        // データをJSON形式で返す
        res.status(200).json(responseData);

    } catch (error) {
        console.error("Failed to get mypage data:", error);
        res.status(401).json({ error: 'Authentication failed or session expired.' });
    }
}