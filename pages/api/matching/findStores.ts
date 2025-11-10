import type { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/lib/firebase'; // ★ 修正: 絶対パス @/lib/firebase に統一
import { collection, getDocs, query, where, DocumentData } from 'firebase/firestore';

// グローバル変数の型を宣言
declare const __app_id: string;
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

// ===============================
// ★ 修正: 必要なすべての型定義をファイル冒頭に統合
// ===============================
interface UserAnswer { q: string; a: string; }

interface SearchCriteria {
    keywords: string[];
    priceRange?: 'low' | 'mid' | 'high' | 'any';
    mustHaves: string[];
}

interface StoreProfile extends DocumentData {
    id: string; // ドキュメントID
    storeName: string;
    mainCategory: string;
    description: string;
    selectedAiTargetsString: string;
    mainImageUrl?: string;
}

interface MatchResult {
    id: string;
    name: string;
    description: string;
    category: string;
    imageUrl: string;
    matchRate: number;
}

// --- AIモデル設定 (省略) ---
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${GEMINI_API_KEY}`;

const SEARCH_CRITERIA_SCHEMA = {
    type: "OBJECT",
    properties: {
        "keywords": {
            type: "ARRAY",
            description: "ユーザーの回答から抽出した検索キーワード",
            items: { type: "STRING" }
        },
        "priceRange": {
            type: "STRING",
            description: "価格帯",
            enum: ['low', 'mid', 'high', 'any']
        },
        "mustHaves": {
            type: "ARRAY",
            description: "絶対に必要な条件",
            items: { type: "STRING" }
        }
    },
    required: ["keywords"]
};

// ===============================
// メインAPIハンドラ
// ===============================
export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<MatchResult[] | { error: string }>
) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }
    if (!GEMINI_API_KEY) {
         return res.status(500).json({ error: 'サーバー側の設定エラー: GEMINI_API_KEYが設定されていません。' });
    }

    const { category, answers }: { category: string, answers: UserAnswer[] } = req.body;

    if (!category || !answers || answers.length === 0) {
        return res.status(400).json({ error: 'カテゴリと回答が必要です。' });
    }
    
    const userPrompt = answers.map(a => `${a.q}\n回答: ${a.a}`).join('\n\n');

    try {
        const criteria = await getSearchCriteriaFromAI(category, userPrompt);
        const allStores = await fetchAllStoresByCategory(category);

        const results: MatchResult[] = calculateMatchRates(criteria, allStores)
            .sort((a, b) => b.matchRate - a.matchRate)
            .slice(0, 10);

        return res.status(200).json(results);

    } catch (error: any) {
        console.error('Matching API Error:', error);
        return res.status(500).json({ error: `マッチング処理中にエラーが発生しました: ${error.message}` });
    }
}

// ===============================
// ユーティリティ関数
// ===============================
async function getSearchCriteriaFromAI(category: string, userPrompt: string): Promise<SearchCriteria> {
    const systemPrompt = `あなたは、ユーザーの回答から最適な店舗を検索するための検索条件を抽出するAIアシスタントです。
ユーザーは「${category}」の店舗を探しており、以下の回答をしました。
---ユーザーの回答---
${userPrompt}
---
これらの回答から、ユーザーのニーズを最も正確に表す検索条件をJSON形式で生成してください。`;

    const payload = {
        contents: [{ parts: [{ text: systemPrompt }] }],
        generationConfig: { responseMimeType: "application/json", responseSchema: SEARCH_CRITERIA_SCHEMA, temperature: 0.2 }
    };

    const response = await fetch(GEMINI_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Gemini APIエラー: ${response.status} ${errorText}`);
    }

    const result = await response.json();
    const jsonText = result.candidates[0].content.parts[0].text;
    return JSON.parse(jsonText) as SearchCriteria;
}

async function fetchAllStoresByCategory(category: string): Promise<StoreProfile[]> {
    const stores: StoreProfile[] = [];
    const usersCollection = collection(db, 'artifacts', appId, 'users'); 
    const usersSnapshot = await getDocs(usersCollection);

    for (const userDoc of usersSnapshot.docs) {
        const storesRef = collection(db, 'artifacts', appId, 'users', userDoc.id, 'stores');
        const storesQuery = query(storesRef, where('mainCategory', '==', category));
        const storesSnapshot = await getDocs(storesQuery);
        
        storesSnapshot.docs.forEach(doc => {
            stores.push({ id: doc.id, ...doc.data() } as StoreProfile);
        });
    }

    return stores;
}

function calculateMatchRates(criteria: SearchCriteria, stores: StoreProfile[]): MatchResult[] {
    const results: MatchResult[] = [];
    const MAX_POSSIBLE_SCORE = 100; 

    for (const store of stores) {
        let matchScore = 0;
        
        // 1. 必須条件のチェック (30点)
        let mustHaveMet = true;
        criteria.mustHaves.forEach((must: string) => { 
            if (!(store.description.includes(must) || store.selectedAiTargetsString.includes(must))) {
                mustHaveMet = false;
            }
        });
        
        if (!mustHaveMet) {
            results.push({
                id: store.id, name: store.storeName, description: store.description, category: store.mainCategory,
                imageUrl: store.mainImageUrl || 'https://placehold.co/600x400/808080/FFF?text=No+Image', matchRate: 0 
            });
            continue;
        } else {
             matchScore += 30;
        }

        // 2. キーワードマッチング (40点)
        let keywordMatches = 0;
        criteria.keywords.forEach((keyword: string) => { 
            if (store.selectedAiTargetsString.includes(keyword) || store.storeName.includes(keyword)) {
                keywordMatches++;
            }
        });
        matchScore += (40 * (keywordMatches / criteria.keywords.length));

        // 3. 価格帯マッチング (10点)
        if (criteria.priceRange && criteria.priceRange !== 'any') {
            matchScore += 10;
        }

        // 4. 説明文内のキーワードマッチング (20点)
        let descriptionMatches = 0;
        criteria.keywords.slice(0, 3).forEach((keyword: string) => { 
             if (store.description.includes(keyword)) {
                descriptionMatches++;
            }
        });
        matchScore += (20 * (descriptionMatches / 3));
        
        // 5. 最終的なマッチ率を計算
        const finalMatchRate = Math.min(MAX_POSSIBLE_SCORE, Math.round(matchScore));
        
        results.push({
            id: store.id, name: store.storeName, description: store.description, category: store.mainCategory,
            imageUrl: store.mainImageUrl || 'https://placehold.co/600x400/808080/FFF?text=No+Image',
            matchRate: finalMatchRate
        });
    }

    return results;
}