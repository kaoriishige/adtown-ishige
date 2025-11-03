/**
 * ai-matching-engine.ts: スコア計算ロジック
 * 🚨 注意: このファイルはpages/apiからimportして使用されます。
 */

// Firebase Admin SDKのインポートは、ロジックに不要なため削除しました。

// --- 型定義 ---
export interface UserProfile {
    uid?: string;
    desiredSalaryMin: number; 
    desiredSalaryMax: number; 
    desiredLocation: string;
    desiredJobTypes: string[];
    skills: string; 
    desiredEmploymentType: string; 
    preferredWorkingHours: string; 
    preferredWorkingDays: string[]; 
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
    employmentType: string; 
    workingHours: string; 
    workingDays: string[]; 
    requiredSkills: string; 
    welcomeSkills: string; 
    remotePolicy: string;
    appealPoints: CompanyProfile['appealPoints'];
}


/**
 * 簡易的なテキストの類似性を評価するAI関数（シミュレーション）
 */
export function getSemanticSimilarity(userSkills: string, jobRequirements: string): number {
    if (!userSkills || !jobRequirements) return 0;
    
    // スキルを単語に分割
    const userWords = new Set(userSkills.toLowerCase().split(/[,\s・、。.]+/).filter(w => w.length > 1));
    const requiredWords = new Set(jobRequirements.toLowerCase().split(/[,\s・、。.]+/).filter(w => w.length > 1));
    
    // 共通する単語の数を計算
    const intersectionSize = Array.from(requiredWords).filter(word => userWords.has(word)).length;
    
    // 必須スキルに対する一致率を返す
    return requiredWords.size > 0 ? intersectionSize / requiredWords.size : 0;
}

/**
 * 勤務曜日のマッチング度を計算する関数
 */
export function calculateDayMatch(userDays: string[], jobDays: string[]): number {
    if (jobDays.length === 0) return 0;
    if (userDays.length === 0) return 0;

    const jobDaysSet = new Set(jobDays);
    // ユーザーが希望する曜日と求人がカバーする曜日の共通部分をカウント
    const matchedDaysCount = userDays.filter(day => jobDaysSet.has(day)).length;

    // 求人の要求日数に対するカバー率
    return matchedDaysCount / jobDays.length;
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

    // --- 1. 重要項目のスコアリング (最大65点) ---

    // 1-1. 給与 (最大30点)
    // 警告解消のため利用する変数
    const userDesiredSalary = (userProfile.desiredSalaryMin + userProfile.desiredSalaryMax) / 2 || 0; 
    const jobAverageSalary = (job.salaryMin + job.salaryMax) / 2 || 0;

    let salaryScore = 0;

    // A. 希望給与帯が求人の提示範囲と重なっているか (最大30点)
    if (userProfile.desiredSalaryMax >= job.salaryMin && userProfile.desiredSalaryMin <= job.salaryMax) {
        salaryScore += 30;
        reasons.push('希望給与帯が求人の提示範囲と重なっています');
    } 
    // B. 求人の提示額が希望の最低額以上か (最大15点)
    else if (job.salaryMax >= userProfile.desiredSalaryMax) {
        salaryScore += 15;
        reasons.push('求人の提示額があなたの希望を充足しています');
    }

    // C. 🚨 userDesiredSalary を利用したロジック (中央値が近いほど加点)
    if (userDesiredSalary > 0 && jobAverageSalary > 0) {
        // 差分の絶対値を、希望中央値で割った比率
        const salaryDifferenceRatio = Math.abs(userDesiredSalary - jobAverageSalary) / userDesiredSalary; 
        
        if (salaryDifferenceRatio < 0.1) {
            salaryScore += 5; 
            reasons.push('希望給与の中央値と求人の中央値が非常に近いです');
        } else if (salaryDifferenceRatio < 0.2) {
            salaryScore += 3;
        }
    }

    score += Math.min(salaryScore, 30); // 給与スコアは30点を上限とする


    // 1-2. 職種 (最大20点)
    if (userProfile.desiredJobTypes.includes(job.jobCategory)) {
        score += 20;
        reasons.push(`希望職種(${job.jobCategory})と完全に一致します`);
    }

    // 1-3. 雇用形態 (最大5点)
    if (userProfile.desiredEmploymentType === job.employmentType) {
        score += 5;
        reasons.push('希望雇用形態が一致しています');
    }

    // 1-4. スキル適合度 (最大10点)
    const skillSimilarity = getSemanticSimilarity(userProfile.skills, job.requiredSkills);
    if (skillSimilarity > 0.4) { 
        score += Math.round(skillSimilarity * 10);
        reasons.push(`必須スキル要求度が約${Math.round(skillSimilarity * 100)}%適合しています`);
    }

    // --- 2. 条件/制度のスコアリング (最大35点) ---

    // 2-1. 勤務曜日マッチ (最大10点)
    const dayMatchRatio = calculateDayMatch(userProfile.preferredWorkingDays, job.workingDays);
    if (dayMatchRatio > 0.5) { 
        score += Math.round(dayMatchRatio * 10);
        reasons.push(`希望勤務曜日が求人の${Math.round(dayMatchRatio * 100)}%カバーしています`);
    }

    // 2-2. 勤務時間マッチ (最大5点)
    const hourMatch = getSemanticSimilarity(userProfile.preferredWorkingHours, job.workingHours);
    if (hourMatch > 0.2) {
        score += 5;
        reasons.push('希望勤務時間が概ね適合しています');
    }


    // 2-3. 価値観マッチ (最大20点)
    let appealPointScore = 0;
    const appealCategories: (keyof UserProfile['matchingValues'])[] = [
        'atmosphere', 'growth', 'wlb', 'benefits', 'organization',
    ];

    appealCategories.forEach(category => {
        const userWants = new Set(userProfile.matchingValues[category]);
        const companyOffers = new Set(job.appealPoints[category]); 
        const intersection = Array.from(userWants).filter(want => companyOffers.has(want));

        if (intersection.length > 0) {
            appealPointScore += intersection.length * 2; 
        }
    });

    score += Math.min(appealPointScore, 20); 

    // 最終スコアを計算し、99点を上限とする
    const finalScore = Math.min(Math.round(score), 99);
    
    // 理由の最終整理
    const minScore = companyProfile.minMatchScore || 60; // 企業が設定した最低許容スコア
    if (finalScore >= minScore) {
        reasons.unshift(`AIスコア${finalScore}点は企業が設定した最低許容スコア(${minScore}点)を上回っています！`);
    } else {
        reasons.unshift(`AIスコア${finalScore}点は企業の最低許容スコア(${minScore}点)を下回っています。`);
    }
    
    // 理由を最大3つに絞り込む
    const uniqueReasons = Array.from(new Set(reasons)).slice(0, 3);


    return {
        score: finalScore,
        reasons: uniqueReasons,
    };
}

