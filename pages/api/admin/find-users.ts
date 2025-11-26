import type { NextApiRequest, NextApiResponse } from 'next';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import nookies from 'nookies';
import admin from 'firebase-admin';

type UserData = {
    uid: string;
    email: string;
    name?: string;
    createdAt?: string;
};

type ResponseData = {
    users: UserData[];
    error?: string;
};

// Firestore IN クエリの最大値
const IN_QUERY_LIMIT = 30;

/**
 * ユーザー検索および初期リスト取得API
 * * @note INクエリの30件制限に対応するため、UIDリストを分割処理します。
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse<ResponseData>) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', 'POST');
        return res.status(405).json({ users: [], error: 'Method Not Allowed' });
    }

    // 🚨 注意: 本番環境では、ここで管理者の認証とロールチェックが必要です。

    const { query: searchQuery } = req.body as { query: string };
    const db = adminDb;
    const usersList: UserData[] = [];

    try {
        if (searchQuery && searchQuery.trim().includes('@')) {
            // 1. メールアドレスでの検索 (単一取得)
            const userRecord = await adminAuth.getUserByEmail(searchQuery.trim());
            usersList.push({
                uid: userRecord.uid,
                email: userRecord.email || '',
                name: userRecord.displayName,
                createdAt: userRecord.metadata.creationTime,
            });
        } else if (searchQuery && searchQuery.trim().length > 0) {
            // 2. UIDでの検索 (単一取得)
            const uid = searchQuery.trim();
            const userRecord = await adminAuth.getUser(uid);
            const profileSnap = await db.collection('userProfiles').doc(uid).get();
            
            usersList.push({
                uid: userRecord.uid,
                email: userRecord.email || '',
                name: profileSnap.data()?.name || userRecord.displayName,
                createdAt: userRecord.metadata.creationTime,
            });
        } else {
            // 3. 初期表示/全件取得 (最近のユーザーを最大100件)
            const listUsersResult = await adminAuth.listUsers(100);
            const authUsers = listUsersResult.users;

            if (authUsers.length > 0) {
                const profilesMap = new Map();
                const authUids = authUsers.map(u => u.uid);

                // ★★★ 修正ロジック: UIDリストを30件ずつ分割してFirestoreをクエリ ★★★
                // これにより、'IN' supports up to 30 comparison values. のエラーを回避します。
                for (let i = 0; i < authUids.length; i += IN_QUERY_LIMIT) {
                    const chunkUids = authUids.slice(i, i + IN_QUERY_LIMIT);
                    
                    const profilesQuery = db.collection('userProfiles').where(admin.firestore.FieldPath.documentId(), 'in', chunkUids);
                    const profilesSnap = await profilesQuery.get();
                    
                    profilesSnap.docs.forEach(doc => profilesMap.set(doc.id, doc.data()));
                }

                // 認証情報とプロフィール情報を結合
                authUsers.forEach(userRecord => {
                    const profile = profilesMap.get(userRecord.uid);
                    usersList.push({
                        uid: userRecord.uid,
                        email: userRecord.email || '',
                        name: profile?.name || userRecord.displayName || '名前未設定',
                        createdAt: userRecord.metadata.creationTime,
                    });
                });
            }
        }

        // 作成日順にソート
        usersList.sort((a, b) => {
            const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
            const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
            return dateB - dateA;
        });

        return res.status(200).json({ users: usersList });
    } catch (e: any) {
        if (e.code === 'auth/user-not-found' || e.code === 'not-found') {
             return res.status(200).json({ users: [], error: '該当するユーザーが見つかりませんでした。' });
        }
        console.error('User search error:', e);
        // エラーコードと詳細を含めて返す
        // e.details が存在する場合はそれを使用
        const errorMessage = e.details || e.message;
        return res.status(500).json({ users: [], error: `サーバーエラー: ${errorMessage}` });
    }
}