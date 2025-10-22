/**
 * このファイルは、企業と求職者のデータを比較し、マッチングスコアを算出するコアエンジンです。
 * スコアリングは、重要項目（給与・職種）と価値観（制度・文化）の一致度に基づいて行われます。
 */

// --- 型定義 ---
export interface UserProfile {
  uid?: string;
  // 必須入力項目（例：pages/users/profile.tsxのStep 2に対応）
  desiredSalaryMin: number; // 万円単位
  desiredSalaryMax: number; // 万円単位
  desiredLocation: string;
  desiredJobTypes: string[];
  skills: string; // 履歴書相当のスキル
  // 価値観
  matchingValues: {
    atmosphere: string[];
    growth: string[];
    wlb: string[];
    benefits: string[];
    organization: string[];
  };
}

export interface CompanyProfile {
  appealPoints: {
    atmosphere: string[];
    growth: string[];
    wlb: string[];
    benefits: string[];
    organization: string[];
  };
  minMatchScore: number;
}

export interface Job {
  id: string;
  jobTitle: string;
  salaryMin: number;
  salaryMax: number;
  location: string;
  jobCategory: string;
  // 企業側のマッチング価値観をJobにも含める（APIロジックから推測）
  appealPoints: CompanyProfile['appealPoints'];
}

/**
 * テキストの類似性を評価するAI関数（シミュレーション）
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
 */
export function calculateMatchScore(
  userProfile: UserProfile,
  job: Job,
  companyProfile: CompanyProfile
): { score: number; reasons: string[] } {
  let score = 0;
  const reasons: string[] = [];
  
  // ⚠️ 注意: APIコードに依存した簡易スコアリングロジックです。
  // 実際には、userProfile.topPriorities の定義がないため、ここでは簡略化します。
  
  // --- ステップ1: 重要項目のスコアリング (最大60点) ---
  const userDesiredSalary = (userProfile.desiredSalaryMin + userProfile.desiredSalaryMax) / 2 || 0;
  
  // 1. 給与 (最大30点) - 求人の提示額がユーザーの希望範囲内か
  if (job.salaryMin <= userDesiredSalary && job.salaryMax >= userDesiredSalary) {
      score += 30;
      reasons.push('希望年収の範囲内です');
  } else if (job.salaryMax > userDesiredSalary) {
      // ユーザーの希望より高い場合も高評価
      score += 15;
      reasons.push('提示給与があなたの希望を満たしています');
  }

  // 2. 職種 (最大20点)
  if (userProfile.desiredJobTypes.includes(job.jobCategory)) {
      score += 20;
      reasons.push('希望職種と完全に一致します');
  }

  // 3. 勤務地 (最大10点) - 簡易一致
  if (job.location.includes(userProfile.desiredLocation) || userProfile.desiredLocation.includes(job.location)) {
      score += 10;
      reasons.push('希望勤務地と一致します');
  }
  
  // --- ステップ2: 価値観（制度・文化）のマッチング (最大40点) ---
  let appealPointScore = 0;
  const appealCategories: (keyof UserProfile['matchingValues'])[] = [
    'atmosphere',
    'growth',
    'wlb',
    'benefits',
    'organization',
  ];

  appealCategories.forEach(category => {
    const userWants = new Set(userProfile.matchingValues[category]);
    // 企業はCompanyProfileではなくJobまたはRecruitmentsにappealPointsを持っているはずですが、
    // APIのロジックに従いCompanyProfile/Jobの両方を参照する想定でJobのappealPointsを使用します。
    const companyOffers = new Set(job.appealPoints[category]); 
    const intersection = new Set(Array.from(userWants).filter(want => companyOffers.has(want)));

    if (intersection.size > 0) {
      // 一致する価値観1つにつき4点
      appealPointScore += intersection.size * 4; 
      reasons.push(`価値観: ${Array.from(intersection)[0]} などが一致`);
    }
  });

  score += Math.min(appealPointScore, 40); // 最大40点

  const finalScore = Math.min(Math.round(score), 99);
  
  // 理由の最終整理
  if (finalScore >= (companyProfile.minMatchScore || 60)) {
    reasons.push('総合的な相性は抜群です！');
  } else if (reasons.length === 0 && finalScore > 0) {
    reasons.push('基本的な条件は満たしています');
  }
  
  // 理由をユニーク化
  const uniqueReasons = Array.from(new Set(reasons)).slice(0, 3);


  return {
    score: finalScore,
    reasons: uniqueReasons,
  };
}

