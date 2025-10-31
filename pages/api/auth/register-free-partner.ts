import { NextApiRequest, NextApiResponse } from 'next';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import * as admin from 'firebase-admin';

/**
 * POST: 課金なしで新規パートナーを登録する、または既存パートナーにロールを追加する
 * 🔹 有料ステータス・課金情報を自動的にリセットして「無料状態」に初期化
 */
export default async function registerFreePartnerHandler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const {
    companyName,
    address,
    area,
    contactPerson,
    phoneNumber,
    email,
    password,
    serviceType, // 'recruit' または 'adver'
    existingUid, // 既存ユーザー（ログイン中）の場合
  } = req.body;

  if (!email || !companyName || !address) {
    return res.status(400).json({ error: '必須フィールド（メール、企業名、住所）をすべて入力してください。' });
  }

  const roleToAdd = serviceType || 'adver';
  let uid: string;
  let isNewUser = false;

  try {
    // --- 1. Firebase Auth ユーザー作成または既存確認 ---
    if (existingUid) {
      uid = existingUid;
      await adminAuth.getUser(uid); // 存在確認
    } else {
      if (!password || password.length < 6) {
        return res.status(400).json({ error: '新規登録の場合、パスワードは6文字以上必須です。' });
      }

      try {
        const userRecord = await adminAuth.createUser({
          email,
          password,
          displayName: companyName,
        });
        uid = userRecord.uid;
        isNewUser = true;
      } catch (error: any) {
        if (error.code === 'auth/email-already-exists') {
          const existingUser = await adminAuth.getUserByEmail(email);
          uid = existingUser.uid;
        } else {
          throw error;
        }
      }
    }

    // --- 2. Firestore ユーザードキュメント更新 ---
    const userDocRef = adminDb.collection('users').doc(uid);

    const baseUserData: { [key: string]: any } = {
      companyName,
      address,
      area,
      contactPerson,
      phoneNumber,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      roles: admin.firestore.FieldValue.arrayUnion(roleToAdd),

      // 🧹 ★ 自動リセット部分：有料状態をリセットして無料扱いに戻す
      isPaid: false,
      adverSubscriptionStatus: 'free',
      recruitSubscriptionStatus: 'free',
      stripeCustomerId: null,
      stripeSubscriptionId: null,
      stripeInvoiceId: null,
      subscriptionStatus: 'inactive',
    };

    // 新規登録時のみ作成日時を追加
    if (isNewUser) {
      baseUserData.createdAt = admin.firestore.FieldValue.serverTimestamp();
      baseUserData.email = email;
    }

    await userDocRef.set(baseUserData, { merge: true });

    // --- 3. カスタムクレームを更新 ---
    const user = await adminAuth.getUser(uid);
    const currentClaims = user.customClaims || {};

    const existingRoles = Array.isArray(currentClaims.roles) ? [...currentClaims.roles] : [];
    const newRoles = existingRoles.includes(roleToAdd) ? existingRoles : [...existingRoles, roleToAdd];

    // 🧹 ★ クレームもリセット：paid=false を明示的にセット
    await adminAuth.setCustomUserClaims(uid, {
      ...currentClaims,
      roles: newRoles,
      paid: false,
    });

    console.log(`✅ 無料パートナー登録/ロール追加完了: UID=${uid}, Role=${roleToAdd}`);
    return res.status(200).json({
      message: '無料パートナー登録/ロール追加が完了しました。',
      uid,
      reset: true,
    });
  } catch (error: any) {
    console.error('❌ register-free-partner Error:', error);

    if (error.code === 'auth/email-already-in-use') {
      return res.status(400).json({
        error:
          'このメールアドレスは既に登録済みです。ログイン後にダッシュボードから追加登録を行ってください。',
      });
    }

    if (error.code === 'auth/user-not-found') {
      return res.status(404).json({ error: 'ユーザーが見つかりませんでした。' });
    }

    return res.status(500).json({ error: error.message || 'サーバーで予期せぬエラーが発生しました。' });
  }
}
