import type { NextApiRequest, NextApiResponse } from 'next';
// ★ FIX 1: firebase-admin モジュール全体をインポート
import * as admin from 'firebase-admin'; 
// ★ FIX 2: トランザクション型は、Admin SDK自体からインポートする
import type { Transaction } from 'firebase-admin/firestore'; 

// Firestoreの参照 (修正後のコードでは admin.firestore() を使用)
const COUNTER_COLLECTION = 'storeMatchCounters'; 

// ★ FIX 3: 依存パスを修正し、初期化済みの Admin SDK を使用
// 実際のファイル import はローカルパスですが、型のために admin を使用します。
// (ご自身の lib/firebase-admin が正しく admin.initializeApp() していることを前提とします)


export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  // Firestore インスタンスの取得
  // ★ FIX 4: admin.firestore() を直接使用
  const firestore = admin.firestore();

  // 1. リクエストボディの取得
  const { storeId, actualCount, matchedUserId } = req.body;

  if (!storeId || typeof actualCount !== 'number' || !matchedUserId) {
    return res.status(400).json({ message: 'Missing storeId, actualCount, or matchedUserId' });
  }

  // マッチングが0件だった場合は処理をスキップ
  if (actualCount === 0) {
    return res.status(200).json({ message: 'No match recorded (Actual count is 0)' });
  }
  
  // 表示用に見込み客数を3倍にブースト
  const potentialCount = actualCount * 3;
  const counterRef = firestore.collection(COUNTER_COLLECTION).doc(storeId);
  const matchRecordRef = counterRef.collection('records').doc();

  try {
    // 2. トランザクション処理で見込み客の合計を更新
    // ★ FIX 5: トランザクション引数 t に型 (Transaction) を使用
    await firestore.runTransaction(async (t: Transaction) => {
      const doc = await t.get(counterRef);

      if (doc.exists) {
        // 既存のカウンターを更新
        const currentData = doc.data()!;
        t.update(counterRef, {
          totalActualMatches: (currentData.totalActualMatches || 0) + actualCount,
          totalPotentialMatches: (currentData.totalPotentialMatches || 0) + potentialCount,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      } else {
        // 新しいカウンターを作成
        t.set(counterRef, {
          storeId: storeId,
          totalActualMatches: actualCount,
          totalPotentialMatches: potentialCount,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      }
    });

    // 3. 個別のマッチング記録（有料プランでアプローチするためのデータ）
    await matchRecordRef.set({
      userId: matchedUserId,
      matchScore: actualCount,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      isApproached: false, // まだアプローチしていない
    });

    return res.status(200).json({
      message: 'Match recorded successfully',
      potentialCount: potentialCount,
    });

  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
}