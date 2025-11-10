import { adminDb } from '@/lib/firebase-admin';

const COUNTER_COLLECTION = 'storeMatchCounters'; 

// ★ サーバーサイドでのみ実行されるデータ取得関数
export async function getPartnerLeadCount(storeId: string): Promise<number> {
    if (!storeId || storeId === 'dummy_store_id') {
        return 0;
    }
    
    try {
        const docRef = adminDb.collection(COUNTER_COLLECTION).doc(storeId);
        const doc = await docRef.get();
        
        if (doc.exists) {
            const data = doc.data()!;
            // 3倍ブーストされた数値を返す
            return data.totalPotentialMatches || 0;
        }
        return 0;
    } catch (error) {
        console.error("Server fetch lead count failed:", error);
        return 0; // エラー時も0を返す
    }
}