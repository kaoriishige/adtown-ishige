import { NextApiRequest, NextApiResponse } from 'next';
import { adminAuth, adminDb } from '@/lib/firebase-admin'; 
import * as admin from 'firebase-admin'; // Firestore.FieldValueのためにインポート

/**
 * POST: 課金なしで新規パートナーを登録する、または既存パートナーにロールを追加する
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
        existingUid // ログイン中のユーザーのUID (ロール追加のヒントとして利用)
    } = req.body;

    // 簡易的なバリデーション
    if (!email || !companyName || !address) {
        return res.status(400).json({ error: '必須フィールド（メール、企業名、住所）をすべて入力してください。' });
    }
    
    // serviceTypeが不正な場合はデフォルトで'adver'にするなど安全策を講じる
    const roleToAdd = serviceType || 'adver';

    let uid: string;
    let isNewUser = false;
    
    try {
        // --- 1. ユーザー作成または既存ユーザーの利用 ---
        if (existingUid) {
            // A. 既存ユーザーとして処理（フロントエンドがログイン状態の場合）
            uid = existingUid;
            
            // パスワードチェックは、ログイン済みの場合（既存ロール追加）は必須ではないためスキップ
            // ただし、Firebase Authにデータが存在するかを確認
            await adminAuth.getUser(uid); 
            
        } else {
            // B. 新規ユーザーとして処理（パスワード必須）
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
                    // メールアドレス重複時の処理
                    const existingUser = await adminAuth.getUserByEmail(email);
                    uid = existingUser.uid;
                    // ロール追加ロジックへフォールスルー
                } else {
                    throw error;
                }
            }
        }
        
        // --- 2. Firestoreのユーザー情報更新 (ロール追加とデータ更新) ---
        const userDocRef = adminDb.collection('users').doc(uid);
        
        const userData: { [key: string]: any } = {
            companyName: companyName,
            address: address,
            area: area,
            contactPerson: contactPerson,
            phoneNumber: phoneNumber,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            // ★★★ ロール追加 ★★★
            roles: admin.firestore.FieldValue.arrayUnion(roleToAdd),
            // ★★★ その他の初期設定（新規登録時のみ上書き） ★★★
            ...(isNewUser ? {
                email: email,
                isPaid: false, 
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                stripeCustomerId: null,
                stripeSubscriptionId: null,
                subscriptionStatus: 'inactive', 
            } : {})
        };

        await userDocRef.set(userData, { merge: true });
        
        // --- 3. カスタムクレームを設定 (ロール情報をJWTに含める) ---
        const user = await adminAuth.getUser(uid);
        const currentClaims = user.customClaims || {};
        
        // ★★★ 修正点: const を使用し、既存ロールにロールToAddを追加するロジックを修正 ★★★
        const existingRoles = Array.isArray(currentClaims.roles) ? [...currentClaims.roles] : [];
        const newRoles = existingRoles.includes(roleToAdd) ? existingRoles : [...existingRoles, roleToAdd];

        await adminAuth.setCustomUserClaims(uid, { 
            ...currentClaims,
            roles: newRoles // ★ newRoles を使用
        });
        
        // 成功応答
        console.log(`✅ パートナー登録/ロール追加完了: UID=${uid}, Role=${roleToAdd}`);
        return res.status(200).json({ message: 'パートナー登録/ロール追加が完了しました。', uid });

    } catch (error: any) {
        console.error('❌ Registration/Role Update error:', error);

        if (error.code === 'auth/email-already-in-use') {
            return res.status(400).json({ error: 'このメールアドレスは既に広告パートナーとして使用されています。ログイン後、ダッシュボードから求人サービスを追加してください。' });
        }
        if (error.code === 'auth/user-not-found') {
             return res.status(404).json({ error: 'ユーザーが見つかりませんでした。' });
        }
        
        // 予期せぬエラーの場合
        return res.status(500).json({ error: error.message || 'サーバーで予期せぬエラーが発生しました。' });
    }
}