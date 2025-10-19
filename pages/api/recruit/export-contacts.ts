// pages/api/recruit/export-contacts.ts
// 役割: 企業とマッチング済みの候補者の連絡先情報をCSVとしてエクスポートする。

import { NextApiRequest, NextApiResponse } from 'next';
import { adminAuth, adminDb } from '@/lib/firebase-admin'; 
import nookies from 'nookies';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'GET') {
        res.setHeader('Allow', 'GET');
        return res.status(405).end('Method Not Allowed');
    }

    try {
        const cookies = nookies.get({ req });
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

        const userUids = matchesSnap.docs.map(doc => doc.data().userUid);
        
        // 2. 該当する求職者プロフィールを取得 (連絡先情報を含む)
        const userProfilesPromises = userUids.map(uid => 
            adminDb.collection('userProfiles').doc(uid).get()
        );
        const userProfilesSnaps = await Promise.all(userProfilesPromises);

        // 3. CSVデータを生成
        let csv = '名前,年齢,希望職種,メールアドレス,電話番号\n';

        userProfilesSnaps.forEach(snap => {
            if (snap.exists) {
                const u = snap.data();
                const name = u.name || '匿名';
                const age = u.age || '不明';
                const desiredJob = u.desiredJobTypes?.[0] || '未設定';
                const email = u.email || 'なし';
                const phone = u.phoneNumber || 'なし';
                
                // カンマ区切りデータを追加
                csv += `${name},${age},"${desiredJob}",${email},${phone}\n`;
            }
        });

        // 4. CSVとしてレスポンスを返す
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', 'attachment; filename="matched_contacts.csv"');
        return res.status(200).send(csv);

    } catch (error) {
        console.error('CSV Export Error:', error);
        // 認証エラーまたはその他のシステムエラー
        return res.status(500).json({ error: 'CSVエクスポート中にサーバーエラーが発生しました。' });
    }
}