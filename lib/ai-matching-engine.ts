/**
 * このファイルは、企業と求職者のデータを比較し、マッチングスコアを算出するコアエンジンです。
 * スコアリングは、重要項目（給与・職種）と価値観（制度・文化）の一致度に基づいて行われます。
 */

// --- 型定義 ---
interface UserProfile {
    topPriorities: string[];
    desiredAnnualSalary: number;
    desiredLocation: string;
    desiredJobTypes: string[];
    // 自由記述フィールドを削除
    skills: string; 
    appealPoints: {
        atmosphere: string[];
        growth: string[];
        wlb: string[];
        benefits: string[];
        organization: string[];
    };
}

interface CompanyProfile {
    appealPoints: {
        atmosphere: string[];
        growth: string[];
        wlb: string[];
        benefits: string[];
        organization: string[];
    };
    // 企業理念、事業内容、カルチャーなどの自由記述フィールドを削除
    minMatchScore: number; // ★企業が設定する最低許容スコア
}

interface Job {
    id: string;
    jobTitle: string;
    salaryMin: number;
    salaryMax: number;
    location: string;
    jobCategory: string;
}

/**
 * テキストの類似性を評価するAI関数（シミュレーション）
 * このエンジンでは使用しないため、シンプルなスタブとして保持
 */
function getSemanticSimilarity(text1: string, text2: string): number {
    if (!text1 || !text2) return 0;
    const words1 = new Set(text1.toLowerCase().split(/\s+/));
    const words2 = new Set(text2.toLowerCase().split(/\s+/));
    const intersection = new Set(Array.from(words1).filter(word => words2.has(word)));
    const union = new Set(Array.from(words1).concat(Array.from(words2)));
    if (union.size === 0) return 0;
    return intersection.size / union.size;
}

/**
 * メインのマッチングスコア計算エンジン
 * スコア配分: ステップ1(60) + ステップ2(40) = 100点 (合計99点上限)
 * @param userProfile 求職者のプロフィール
 * @param job 求人スペック
 * @param companyProfile 企業のプロフィール
 * @returns マッチング結果（スコアと理由）
 */
export function calculateMatchScore(
    userProfile: UserProfile,
    job: Job,
    companyProfile: CompanyProfile
): { score: number; reasons: string[] } {
    let score = 0;
    const reasons: string[] = [];

    // --- ステップ1: 重要項目のスコアリング (最大60点) ---
    // 給与 (最大35点)
    if (job.salaryMax >= userProfile.desiredAnnualSalary) {
        const point = userProfile.topPriorities.includes('salary') ? 35 : 25;
        score += point;
        reasons.push('希望給与');
    }

    // 職種 (最大25点)
    if (userProfile.desiredJobTypes.includes(job.jobCategory)) {
        const point = userProfile.topPriorities.includes('jobType') ? 25 : 15;
        score += point;
        reasons.push('希望職種');
    }

    // --- ステップ2: 価値観（制度・文化）のマッチング (最大40点) ---
    let appealPointScore = 0;
    const appealCategories: (keyof UserProfile['appealPoints'])[] = ['atmosphere', 'growth', 'wlb', 'benefits', 'organization'];
    
    appealCategories.forEach(category => {
        const userWants = new Set(userProfile.appealPoints[category]);
        const companyOffers = new Set(companyProfile.appealPoints[category]);
        const intersection = new Set(Array.from(userWants).filter(want => companyOffers.has(want)));
        
        if (intersection.size > 0) {
            // 一致項目があれば加点。
            appealPointScore += intersection.size * 2; // 1項目2点
            
            // ユーザーのTOP3のこだわりと一致すれば、さらにボーナス点(8点)を加算
            if(userProfile.topPriorities.includes(category)) {
                appealPointScore += 8;
                reasons.push('優先する価値観');
            }
        }
    });
    score += Math.min(appealPointScore, 40); // 上限を40点に

    // 最終スコアは99点を上限とする
    const finalScore = Math.min(Math.round(score), 99);

    // 理由付け: 企業が設定した最低点以上の場合は「総合的な相性」とする
    if (finalScore >= companyProfile.minMatchScore) { 
        reasons.push('総合的な相性');
    } else if (reasons.length === 0 && finalScore > 0) {
        reasons.push('基本的な条件の一致');
    }

    return {
        score: finalScore,
        reasons: Array.from(new Set(reasons)).filter(r => r !== '総合的な相性' || finalScore >= companyProfile.minMatchScore), // 理由の重複を削除
    };
}
