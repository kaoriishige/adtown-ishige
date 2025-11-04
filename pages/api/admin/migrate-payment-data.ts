import { NextApiRequest, NextApiResponse } from 'next';
import { adminDb } from '@/lib/firebase-admin'; // adminDb は Firestore インスタンス
import * as admin from 'firebase-admin'; // FieldValue.delete() のために必要

/**
 * このAPIは、古い支払いデータ構造を新しい分離された構造に移行するためのものです。
 * 実行すると、'users'コレクション内の全ドキュメントが更新されます。
 * * 移行ロジック：
 * 1. 古いフィールド (subscriptionStatus, paymentIntent, isPaid) を読み込む。
 * 2. 広告用の新しいフィールド (adverSubscriptionStatus, adverPaymentIntent) を計算して設定する。
 * 3. 求人用の新しいフィールド (recruitSubscriptionStatus, recruitPaymentIntent) を計算して設定する。
 * 4. 古い干渉源フィールド (subscriptionStatus, paymentIntent, isPaid) を削除する。
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    // 
    // ⚠ 警告: このAPIはデータベース全体を変更します。
    // 実行する前に必ず Firestore のバックアップ（エクスポート）を取得してください。
    // 
    // ⚠ セキュリティ: 実際の運用では、このAPIは管理者のみが実行できるよう、
    // 厳格な認証チェック（例: req.headers.authorization === 'YOUR_SECRET_KEY'）を追加してください。
    //
    
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed. POSTリクエストで実行してください。' });
    }

    const BATCH_SIZE = 400; // 一度にコミットするドキュメント数 (最大500)
    const usersRef = adminDb.collection('users');
    let migratedCount = 0;
    console.log("データ移行スクリプトを開始します...");

    try {
        const snapshot = await usersRef.get();
        if (snapshot.empty) {
            return res.status(200).json({ success: true, message: '対象ユーザーがいないため、移行は不要です。' });
        }

        let batch = adminDb.batch();
        let commitCount = 0;

        for (const doc of snapshot.docs) {
            const userData = doc.data();
            const uid = doc.id;

            // 既存のフィールド値を取得（存在しない場合は null）
            const oldAdverSubStatus = userData.subscriptionStatus || null;
            const oldPaymentIntent = userData.paymentIntent || null;
            const oldRecruitStatus = userData.recruitSubscriptionStatus || null;
            const oldIsPaid = userData.isPaid; // true, false, または undefined

            // --- 1. 新しい「広告」フィールドを計算 ---
            let newAdverSubStatus = 'Free';
            let newAdverPaymentIntent: string | null = null;

            if (oldPaymentIntent === 'pending') {
                // 広告が「請求書待ち」の場合
                newAdverSubStatus = 'inactive';
                newAdverPaymentIntent = 'pending';
            } else if (oldAdverSubStatus === 'Paid' || oldAdverSubStatus === 'active' || (oldIsPaid === true && !oldRecruitStatus)) {
                // 広告が「クレジット有料」の場合
                newAdverSubStatus = 'Paid';
                newAdverPaymentIntent = null;
            }

            // --- 2. 新しい「求人」フィールドを計算 ---
            let newRecruitSubStatus = 'Free';
            let newRecruitPaymentIntent: string | null = null;

            // ※求人にも請求書払いがある場合、ここで oldRecruitPaymentIntent などを参照するロジックを追加
            
            if (oldRecruitStatus === 'Paid' || oldRecruitStatus === 'active') {
                // 求人が「クレジット有料」の場合
                newRecruitSubStatus = 'Paid';
                newRecruitPaymentIntent = null;
            } else if (oldRecruitStatus === 'Free') {
                // 求人が「無料」の場合
                newRecruitSubStatus = 'Free';
                newRecruitPaymentIntent = null;
            }
            // (もし求人にも請求書払い `oldRecruitPaymentIntent` があればここで判定)

            // --- 3. 更新データの作成 ---
            const updateData = {
                // ★ 新しい4つのフィールド
                adverSubscriptionStatus: newAdverSubStatus,
                adverPaymentIntent: newAdverPaymentIntent,
                recruitSubscriptionStatus: newRecruitSubStatus,
                recruitPaymentIntent: newRecruitPaymentIntent,

                // ★ 干渉源となる古いフィールドを削除
                subscriptionStatus: admin.firestore.FieldValue.delete(),
                paymentIntent: admin.firestore.FieldValue.delete(),
                isPaid: admin.firestore.FieldValue.delete(),
                // recruitSubscriptionStatusは新しい値で上書きされるため、ここでは削除しない
                
                migratedAt: admin.firestore.FieldValue.serverTimestamp(),
            };
            
            const docRef = usersRef.doc(uid);
            batch.set(docRef, updateData, { merge: true }); // merge: true で他の既存フィールドを保護

            migratedCount++;

            // バッチサイズに達したらコミット
            if (migratedCount % BATCH_SIZE === 0) {
                commitCount++;
                console.log(`バッチ ${commitCount} をコミット中... (${migratedCount}件処理)`);
                await batch.commit();
                batch = adminDb.batch(); // 次のバッチを準備
            }
        }

        // 残りのバッチを実行
        if (migratedCount % BATCH_SIZE !== 0) {
            console.log(`最後のバッチをコミット中... (合計 ${migratedCount}件)`);
            await batch.commit();
        }

        console.log("データ移行が正常に完了しました。");
        return res.status(200).json({ success: true, message: `データ移行が完了しました。ユーザー数: ${migratedCount}` });

    } catch (error: any) {
        console.error("データ移行エラー:", error);
        return res.status(500).json({ 
            error: 'データ移行中にエラーが発生しました。', 
            details: error.message 
        });
    }
}