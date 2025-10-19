import type { NextApiRequest, NextApiResponse } from 'next';
import { adminAuth, adminDb } from '../../../lib/firebase-admin';
import { getFirestore, doc, setDoc, Timestamp } from 'firebase/firestore'; // クライアントSDKのFirestoreインポートは不適切ですが、コード構造を維持
import { db } from '../../../lib/firebase'; // クライアントSDKのdbをインポート
import * as admin from 'firebase-admin'; // 💡 修正: Admin SDK全体をインポート（FieldValueへのアクセス用）

// --- 型定義 ---
interface ResponseData {
    message: string;
    error?: string;
}

const handler = async (
    req: NextApiRequest,
    res: NextApiResponse<ResponseData>
) => {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    const { email, password, name, type } = req.body; // type: 'user' | 'partner' | 'recruiter'

    if (!email || !password || !name || !type) {
        // 💡 修正: ResponseDataの要件を満たすよう message プロパティを追加
        return res.status(400).json({ message: 'Error', error: 'Missing required fields.' });
    }

    try {
        // 1. Firebase Authenticationでユーザーを作成
        const userRecord = await adminAuth.createUser({
            email,
            password,
            displayName: name,
        });

        const uid = userRecord.uid;
        
        // 2. Custom Claimsを設定 (ユーザー種別を識別)
        await adminAuth.setCustomUserClaims(uid, { userType: type });

        // 3. Firestoreに初期データを保存
        let docData;

        // 💡 修正: Admin SDKから正しくFieldValueを参照
        const FieldValue = admin.firestore.FieldValue; 
        // NOTE: adminDbがAdmin SDKのFirestoreインスタンスである場合、adminDb.FieldValueで動作する環境もありますが、型エラー解消のためAdminモジュール全体から参照します。

        // ユーザータイプに応じてデータを振り分け
        if (type === 'partner') {
            // パス: artifacts/{appId}/users/{uid}
            const docRef = adminDb.collection('artifacts').doc('minna-no-nasu-app').collection('users').doc(uid);
            docData = { 
                email, 
                name, 
                userType: 'partner', 
                // 💡 修正: FieldValueを正しく参照
                createdAt: FieldValue.serverTimestamp(),
                // ... 他のパートナー初期データ
            };
            await docRef.set(docData);
            
        } else if (type === 'recruiter') {
            // パス: recruiters/{uid} (JobCreatePageが読み込むパス)
            const docRef = adminDb.collection('recruiters').doc(uid);
            docData = {
                companyName: name, // 企業名を名前として使用
                email,
                verificationStatus: 'unverified',
                userType: 'recruiter',
                // 💡 修正: FieldValueを正しく参照
                createdAt: FieldValue.serverTimestamp(),
            };
            // 💡 修正: setメソッドの引数をデータオブジェクトのみにする
            await docRef.set(docData); 

        } else {
            // パス: userProfiles/{uid} (一般ユーザー)
            const docRef = adminDb.collection('userProfiles').doc(uid);
            docData = {
                name,
                email,
                userType: 'user',
                // 💡 修正: FieldValueを正しく参照
                createdAt: FieldValue.serverTimestamp(),
                points: 0,
            };
            await docRef.set(docData);
        }

        // 4. 登録成功レスポンス
        res.status(201).json({ message: 'Registration successful.' });

    } catch (error: any) {
        console.error("Registration failed:", error); 
        
        let errorMessage = 'Registration failed due to an unknown error.';
        if (error.code === 'auth/email-already-in-use') {
            errorMessage = 'このメールアドレスは既に使用されています。';
        } else if (error.message) {
            errorMessage = error.message;
        }

        // 失敗した場合、作成されたAuthユーザーを削除（ロールバック）
        if (error.code !== 'auth/email-already-in-use' && error.uid) {
            await adminAuth.deleteUser(error.uid).catch(console.error);
        }

        // 💡 修正: ResponseDataの要件を満たすよう message プロパティを追加
        res.status(500).json({ message: 'Registration failed', error: errorMessage });
    }
};

export default handler;
