// Next.js Modules
import { NextApiRequest, NextApiResponse } from 'next';
// Firebase Admin SDK
import { adminDb } from '@/lib/firebase-admin';
import { firestore } from 'firebase-admin';

// ヘッダーとデータをCSV形式に変換するシンプルな関数
const jsonToCsv = (data: any[]): string => {
    if (data.length === 0) return '';
    
    const headers = Object.keys(data[0]);
    const csvRows = [];
    
    // ヘッダー行を追加
    csvRows.push(headers.join(','));
    
    // データ行を追加
    for (const row of data) {
        const values = headers.map(header => {
            let value = row[header] === null || row[header] === undefined ? '' : row[header];
            // CSVインジェクション対策と、値にカンマや改行が含まれる場合の処理
            if (typeof value === 'string' && (value.includes(',') || value.includes('\n') || value.startsWith('=') || value.includes('"'))) {
                value = `"${value.replace(/"/g, '""')}"`;
            }
            return value;
        });
        csvRows.push(values.join(','));
    }
    
    return csvRows.join('\n');
};

// --- メイン API ハンドラー ---
export default async function exportUsersHandler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    if (req.method !== 'GET') {
        res.setHeader('Allow', 'GET');
        return res.status(405).end('Method Not Allowed');
    }

    try {
        // 1. 全ユーザーデータをFirestoreから取得
        const usersSnapshot = await adminDb.collection('users')
            .orderBy('createdAt', 'desc')
            .get();

        const userData: any[] = usersSnapshot.docs.map((doc: firestore.QueryDocumentSnapshot) => {
            const data = doc.data();
            
            // 必要なフィールドを抽出・整形
            return {
                UID: doc.id,
                Email: data.email || '',
                Name: data.name || data.displayName || '',
                PhoneNumber: data.phoneNumber || '',
                Roles: data.roles ? data.roles.join('|') : 'user', // ロールを結合
                ReferredBy: data.referredBy || '', // 紹介者UID
                SubscriptionStatus_ADVER: data.adverSubscriptionStatus || '',
                SubscriptionStatus_RECRUIT: data.recruitSubscriptionStatus || '',
                CreatedAt: data.createdAt ? data.createdAt.toDate().toISOString() : '',
            };
        });

        if (userData.length === 0) {
            return res.status(404).json({ error: 'No users found to export.' });
        }

        // 2. JSONをCSVに変換
        const csv = jsonToCsv(userData);

        // 3. レスポンスヘッダーを設定し、CSVファイルを送信
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', 'attachment; filename="users_export.csv"');
        
        // データのエンコーディングをUTF-8 BOM付きにすることで、Excel等での文字化けを防ぐ
        const csvWithBom = '\uFEFF' + csv; 
        
        res.status(200).send(csvWithBom);

    } catch (error) {
        console.error('🔴 Error exporting users:', error);
        res.status(500).json({ error: 'Failed to export user data.' });
    }
}