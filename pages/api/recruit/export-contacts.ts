// pages/api/recruit/export-contacts.ts
// 役割: 企業とマッチング済みの候補者の連絡先情報をCSVとしてエクスポートする。

import { NextApiRequest, NextApiResponse } from 'next';
// Firebase Admin SDKのインポートパスは環境に合わせて修正してください
import { adminAuth, adminDb } from '@/lib/firebase-admin'; 
import nookies from 'nookies';
import { DocumentData } from 'firebase-admin/firestore'; 

// ユーザープロフィールデータの型を仮定して定義
// 実際のFirestoreのデータ構造に合わせて調整してください
interface UserProfileData extends DocumentData {
    name?: string;
    age?: number | string;
    desiredJobTypes?: string[];
    email?: string;
    phoneNumber?: string;
}

// Firebase Admin SDKのエラーオブジェクトの型を定義
interface FirebaseAuthError {
    code: string;
    message: string;
}

// エラーがFirebaseAuthError型かどうかを判定する型ガード
function isFirebaseAuthError(error: any): error is FirebaseAuthError {
    return (
        typeof error === 'object' && 
        error !== null && 
        'code' in error && 
        typeof error.code === 'string'
    );
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'GET') {
        res.setHeader('Allow', 'GET');
        return res.status(405).end('Method Not Allowed');
    }

    try {
        const cookies = nookies.get({ req });
        // セッションクッキーの検証
        const token = await adminAuth.verifySessionCookie(cookies.session || '', true);
        const companyUid = token.uid;

        // 1. マッチング成立済みのレコードを取得
        const matchesSnap = await adminDb.collection('matches')
            .where('companyUid', '==', companyUid)
            .where('status', '==', 'contact_exchange_complete')
            .get();

        if (matchesSnap.empty) {
            return res.status(404).json({ error: 'マッチング成立済みの連絡先が見つかりません。' });
        }

        const userUids: string[] = matchesSnap.docs.map(doc => doc.data().userUid as string);
        
        // 2. 該当する求職者プロフィールを取得 (連絡先情報を含む)
        const userProfilesPromises = userUids.map(uid => 
            adminDb.collection('userProfiles').doc(uid).get()
        );
        const userProfilesSnaps = await Promise.all(userProfilesPromises);

        // 3. CSVデータを生成
        let csv = '名前,年齢,希望職種,メールアドレス,電話番号\n';

        userProfilesSnaps.forEach(snap => {
            if (snap.exists) {
                // snap.data() の戻り値を定義した UserProfileData 型にキャスト
                const u = snap.data() as UserProfileData; 
                
                const name = u.name || '匿名';
                const age = u.age ? String(u.age) : '不明'; 
                // desiredJobTypesが配列であることを確認し、1つ目を取得
                const desiredJob = u.desiredJobTypes && Array.isArray(u.desiredJobTypes) && u.desiredJobTypes.length > 0 ? u.desiredJobTypes[0] : '未設定';
                const email = u.email || 'なし';
                const phone = u.phoneNumber || 'なし';
                
                // カンマ区切りデータを追加
                // CSVでカンマを含む文字列は二重引用符で囲む (desiredJob, name, email, phoneも念のため囲むのが安全ですが、今回はdesiredJobのみ維持)
                csv += `${name},${age},"${desiredJob}",${email},${phone}\n`;
            }
        });

        // 4. CSVとしてレスポンスを返す
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', 'attachment; filename="matched_contacts.csv"');
        const bom = '\ufeff'; 
        return res.status(200).send(bom + csv);

    } catch (error) {
        // 'error' is of type 'unknown' (TS18046) の解消
        console.error('CSV Export Error:', error);
        
        // 型ガードを使用してerrorがFirebase Authのエラー型であるかを確認
        if (isFirebaseAuthError(error)) {
             // 認証エラーまたはその他のシステムエラー
             if (error.code === 'auth/session-cookie-expired' || error.code === 'auth/invalid-session-cookie') {
                  return res.status(401).json({ error: '認証セッションが無効です。' });
             }
        }
        
        // 認証エラー以外の一般エラー、または型が不明なエラー
        return res.status(500).json({ error: 'CSVエクスポート中にサーバーエラーが発生しました。' });
    }
}