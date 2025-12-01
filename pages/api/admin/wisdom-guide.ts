import type { NextApiRequest, NextApiResponse } from 'next';
import { adminDb } from '@/lib/firebase-admin'; // 適切なFirestore Admin SDKのパスに修正してください

// データの型定義 (GuideDataと同じ)
interface GuideData {
    title: string;
    content: string;
    category: string;
    isPublished: boolean;
}

// 共通のエラーハンドリング
const handleApiError = (res: NextApiResponse, statusCode: number, message: string) => {
    res.status(statusCode).json({ error: message });
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    // 実際にはここで管理者認証のチェックが必要です
    // 例: verifySessionCookie(req) など

    const collectionRef = adminDb.collection('wisdom-guides');
    const { id } = req.query; // URLクエリパラメータからIDを取得

    try {
        switch (req.method) {
            case 'GET': { // ⭐ ブロック開始
                // ガイド記事の取得（IDがあれば単体、なければ一覧）
                if (id) {
                    const doc = await collectionRef.doc(id as string).get();
                    if (!doc.exists) {
                        return handleApiError(res, 404, '指定された記事は見つかりません。');
                    }
                    return res.status(200).json({ id: doc.id, ...doc.data() });
                } else {
                    const snapshot = await collectionRef.orderBy('updatedAt', 'desc').get();
                    const guides = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                    return res.status(200).json(guides);
                }
            } // ⭐ ブロック終了

            case 'POST': { // ⭐ ブロック開始
                // 新規作成
                const newGuideData: GuideData = req.body; // const宣言があるためブロックが必要
                const newDocRef = await collectionRef.add({
                    ...newGuideData,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                });
                return res.status(201).json({ id: newDocRef.id, message: '記事を作成しました。' });
            } // ⭐ ブロック終了

            case 'PUT': { // ⭐ ブロック開始
                // 更新
                if (!id) {
                    return handleApiError(res, 400, '更新する記事のIDが必要です。');
                }
                const updateData: Partial<GuideData> = req.body; // const宣言があるためブロックが必要
                await collectionRef.doc(id as string).update({
                    ...updateData,
                    updatedAt: new Date().toISOString(),
                });
                return res.status(200).json({ id, message: '記事を更新しました。' });
            } // ⭐ ブロック終了
            
            case 'DELETE':
                // 削除
                if (!id) {
                    return handleApiError(res, 400, '削除する記事のIDが必要です。');
                }
                await collectionRef.doc(id as string).delete();
                return res.status(200).json({ id, message: '記事を削除しました。' });

            default:
                res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
                return handleApiError(res, 405, 'Method Not Allowed');
        }
    } catch (error) {
        console.error('Firestore API Error:', error);
        return handleApiError(res, 500, 'サーバー内部エラーが発生しました。');
    }
}