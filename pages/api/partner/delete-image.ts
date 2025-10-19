import type { NextApiRequest, NextApiResponse } from 'next';
import { adminAuth, adminDb } from '@/lib/firebase-admin'; // Firebase Admin SDK
import { FieldValue } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', 'POST');
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    // storeId, imageUrl, imageType を取得。
    const { storeId, imageUrl, imageType } = req.body; 

    if (!storeId || !imageUrl || !imageType) {
        return res.status(400).json({ error: '必要なパラメータ（storeId, imageUrl, imageType）が不足しています。' });
    }
    if (imageType !== 'main' && imageType !== 'gallery') {
        return res.status(400).json({ error: 'imageTypeが不正です。' });
    }

    // 認証ヘッダーからUIDを取得 (認証チェック)
    const idToken = req.headers.authorization?.split('Bearer ')[1];
    if (!idToken) {
        return res.status(401).json({ error: '認証情報（IDトークン）がありません。' });
    }

    let uid: string;
    try {
        const decodedToken = await adminAuth.verifyIdToken(idToken);
        uid = decodedToken.uid;
    } catch (error) {
        return res.status(401).json({ error: '無効な認証トークンです。' });
    }

    try {
        // 1. Firestoreのドキュメントと権限を確認
        // 💡 修正 1: 'stores' から 'ads' コレクションを参照
        const storeRef = adminDb.collection('ads').doc(storeId);
        const storeDoc = await storeRef.get();

        if (!storeDoc.exists) {
            return res.status(404).json({ error: '指定された店舗情報が見つかりません。' });
        }
        const storeData = storeDoc.data();

        // 💡 修正 2: オーナーチェック
        if (storeData?.ownerId !== uid) {
            return res.status(403).json({ error: '権限がありません。この店舗情報のオーナーではありません。' });
        }

        // 2. Storageからファイルを削除
        const url = new URL(imageUrl);
        // Firebase Storageのパスを抽出
        const path = decodeURIComponent(url.pathname.split('/o/')[1].split('?')[0]); 

        const bucket = getStorage().bucket();
        await bucket.file(path).delete();

        // 3. FirestoreのURLを更新
        if (imageType === 'main') {
            // メイン画像の場合、フィールドを空にする
            await storeRef.update({
                mainImageUrl: null 
            });
        } else if (imageType === 'gallery') {
            // ギャラリー画像の場合、配列からURLを削除
            await storeRef.update({
                galleryImageUrls: FieldValue.arrayRemove(imageUrl)
            });
        }

        return res.status(200).json({ message: '画像の削除が成功しました。' });
    } catch (error: any) {
        console.error('画像の削除エラー:', error);
        // ファイルがStorageに存在しないエラーは無視しても良いが、ここでは一般的なエラーを返す
        return res.status(500).json({ error: `画像の削除に失敗しました: ${error.message}` });
    }
}