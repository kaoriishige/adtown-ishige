import { NextApiRequest, NextApiResponse } from 'next';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import * as admin from 'firebase-admin';
import { signInWithEmailAndPassword, getAuth } from 'firebase/auth'; // クライアントSDKのインポートを削除

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
): Promise<void> {
    if (req.method !== 'POST') {
        res.setHeader('Allow', 'POST');
        res.status(405).end('Method Not Allowed');
        return;
    }

    try {
        // ★ 1. クライアントから送られてきた情報を直接取得
        const { email, password, referralId } = req.body;
        const name = req.body.name; // nameフィールドも受け取れるように残す (現在はクライアントから送られていないが)

        if (!email || !password || password.length < 6) {
            res.status(400).json({ error: 'メールアドレスと6文字以上のパスワードが必要です。' });
            return;
        }

        // 2. Firebase Authenticationでユーザーを作成 (Admin SDKを使用)
        const userRecord = await adminAuth.createUser({
            email,
            password,
            displayName: name,
            emailVerified: false,
        });
        const uid = userRecord.uid;

        // 3. Firestoreにユーザーデータを保存し、リファラルIDを紐付け
        const userData: { [key: string]: any } = {
            uid: uid,
            email: email,
            name: name,
            role: 'user',
            subscription: 'free', // 無料ユーザーとして開始
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
        };

        // ★ 4. リファラルIDが存在すれば、Firestoreに追加する
        if (referralId && typeof referralId === 'string') {
            userData.referredBy = referralId; 
        }

        await adminDb.collection('users').doc(uid).set(userData);
        
        // 5. 成功応答を返す (このAPIはサインアップとFirestore保存のみを行い、ログインはクライアント側で行う)
        // クライアント側（pages/users/signup.tsx）は、この成功応答を受け取った後、
        // 別のAPIやクライアントSDKを使ってログイン処理に移ります。

        res.status(200).json({ uid: uid, message: 'ユーザー登録とリファラルIDの保存が完了しました。' });

    } catch (error: any) {
        console.error('User Signup Error:', error);

        let errorMessage = 'ユーザー登録に失敗しました。';
        if (error.code === 'auth/email-already-in-use') {
            errorMessage = 'このメールアドレスは既に使用されています。';
        }
        // Firebase Auth Admin APIで作成中にエラーが発生した場合、作成されたAuthユーザーをクリーンアップすべきだが、ここでは割愛
        
        res.status(500).json({ error: errorMessage });
    }
}