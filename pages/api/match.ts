import { NextApiRequest, NextApiResponse } from 'next';
import { adminDb } from '@/lib/firebase-admin';
// import * as admin from 'firebase-admin';  // エラー解消のため削除

// --- 型定義 ---
interface CustomField {
  id: string;
  title: string;
  content: string;
}

// --- マッチングの重み設定 ---
const MATCH_WEIGHTS = {
  SALARY_BENEFIT: 15,
  BENEFIT_PER_HIT: 3,
  LOCATION: 12,
  REMOTE_MATCH: 10,
  JOB_CATEGORY: 10,
  EMPLOYMENT_TYPE: 4,
  GROWTH_ATMOSPHERE: 8,
  WLB_FEATURES: 7,
  // 💡 追加: スキルマッチの重み
  SKILL_MATCHING: 20, // スキルマッチングの基本点
  SKILL_PER_HIT: 5,  // スキル1つあたりの加点
};

// --- ユーティリティ関数 ---
const parseSalaryRange = (salaryStr: string): { min: number; max: number } => {
  const normalized = salaryStr
    .replace(/[０-９]/g, (s) => String.fromCharCode(s.charCodeAt(0) - 0xFEE0))
    .replace(/[^0-9〜+.-]/g, '');

  const parts = normalized.split(/[-〜]/);

  const min = parseFloat(parts[0] || '0');
  let max = min;

  if (parts.length > 1) {
    max = parseFloat(parts[parts.length - 1]);
  }

  if (normalized.includes('以上') || normalized.includes('+')) {
    max = 9999;
  }

  return { min: min, max: max || min };
};

const countKeywordMatches = (text: string, keywordList: string[]): number => {
  if (!text || !keywordList.length) return 0;
  const lowerText = text.toLowerCase();
  let count = 0;
  for (const keyword of keywordList) {
    const escapedKeyword = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(escapedKeyword, 'i');
    if (regex.test(lowerText)) {
      count++;
    }
  }
  return count;
};

// --- メイン ---
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const uid = req.query.uid as string;
  if (!uid) {
    return res.status(401).json({ error: 'User ID is required.' });
  }

  try {
    const userDoc = await adminDb.collection('userProfiles').doc(uid).get(); 
    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User profile not found.' });
    }
    const userProfile = userDoc.data() as any; 

    const jobsSnapshot = await adminDb
      .collection('recruitments') 
      .where('status', '==', 'active')
      .get();
    const jobs = jobsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as any[];

    const matchingResults: { job: any; score: number; details: string[] }[] = [];

    // ユーザーのスキルセットを準備
    const userSkills = userProfile.skills 
      ? String(userProfile.skills).split(/[,\s、]+/)
        .map((s: string) => s.trim().toLowerCase()) // ★修正済
        .filter((s: string) => s) // ★修正済
      : [];


    for (const job of jobs) {
      let totalScore = 0;
      const matchDetails: string[] = [];

      // ------------------------------------
      // 🌟 追加: スキルマッチングロジック
      // ------------------------------------
      const requiredSkillsText = job.requiredSkills || ''; 
      
      const requiredSkills = requiredSkillsText.split(/[,\n、]+/)
        .map((s: string) => s.trim().toLowerCase()) // ★修正済
        .filter((s: string) => s); // ★修正済
      
      let skillMatchCount = 0;
      const matchedSkills: string[] = [];

      for (const reqSkill of requiredSkills) {
        if (userSkills.includes(reqSkill)) {
          skillMatchCount++;
          matchedSkills.push(reqSkill);
        }
      }

      if (skillMatchCount > 0) {
        const skillScore = MATCH_WEIGHTS.SKILL_MATCHING + skillMatchCount * MATCH_WEIGHTS.SKILL_PER_HIT; 
        totalScore += skillScore;
        matchDetails.push(`🌟 必須スキル ${skillMatchCount} 項目が一致（${matchedSkills.join(', ')}） (+${skillScore}点)`);
      }
      
      // ------------------------------------
      // 既存のロジック
      // ------------------------------------

      // 職種カテゴリ
      const jobCategory = job.jobCategory;
      if (jobCategory && userProfile.desiredJobTypes?.includes(jobCategory)) {
        totalScore += MATCH_WEIGHTS.JOB_CATEGORY;
        matchDetails.push(`✅ 職種カテゴリが一致 (${MATCH_WEIGHTS.JOB_CATEGORY}点)`);
      }

      // 雇用形態
      const employmentType = job.employmentType;
      if (employmentType && userProfile.desiredEmploymentTypes?.includes(employmentType)) {
        totalScore += MATCH_WEIGHTS.EMPLOYMENT_TYPE;
        matchDetails.push(`✅ 雇用形態が一致 (${MATCH_WEIGHTS.EMPLOYMENT_TYPE}点)`);
      }

      // 勤務地・リモート
      const userLocation = userProfile.desiredLocation || '';
      const jobLocation = job.workLocation || '';

      if (userLocation && jobLocation && jobLocation.includes(userLocation)) {
        totalScore += MATCH_WEIGHTS.LOCATION;
        matchDetails.push(`✅ 勤務地が一致 (${MATCH_WEIGHTS.LOCATION}点)`);
      }

      const remoteMatch = job.remoteLevel === userProfile.desiredRemoteLevel;
      if (remoteMatch) {
        totalScore += MATCH_WEIGHTS.REMOTE_MATCH;
        matchDetails.push(`✅ リモート希望レベルが一致 (${MATCH_WEIGHTS.REMOTE_MATCH}点)`);
      }

      // 給与
      const userSalary = parseSalaryRange(userProfile.desiredAnnualSalary || '');
      const jobSalary = parseSalaryRange(job.salary || '');

      const salaryOverlap = userSalary.min <= jobSalary.max && jobSalary.min <= userSalary.max;

      if (salaryOverlap && userSalary.min > 0) {
        totalScore += MATCH_WEIGHTS.SALARY_BENEFIT;
        matchDetails.push(`✅ 給与レンジが希望と適合 (${MATCH_WEIGHTS.SALARY_BENEFIT}点)`);
      }

      // WLB
      const wlbScore = countKeywordMatches(
        (job.holidays || '') + (job.workingHours || ''),
        userProfile.desiredWLBFeatures || []
      );
      if (wlbScore > 0) {
        const score = MATCH_WEIGHTS.WLB_FEATURES + wlbScore;
        totalScore += score;
        matchDetails.push(
          `✅ WLB（休日/休暇）の特徴 ${wlbScore}項目一致 (+${score}点)`
        );
      }

      // 成長/雰囲気/福利厚生
      const jobAppealText =
        job.customFields?.map((f: CustomField) => f.content).join(' ') || '';
      const allUserKeywords = [
        ...(userProfile.preferredAtmosphere || []),
        ...(userProfile.desiredGrowthOpportunities || []),
        ...(userProfile.desiredBenefits || []),
      ];

      const appealMatches = countKeywordMatches(jobAppealText, allUserKeywords);

      if (appealMatches > 0) {
        let keywordScore = MATCH_WEIGHTS.GROWTH_ATMOSPHERE;

        const benefitMatches = countKeywordMatches(
          job.benefits || '',
          userProfile.desiredBenefits || []
        );
        keywordScore += benefitMatches * MATCH_WEIGHTS.BENEFIT_PER_HIT;
        
        totalScore += keywordScore;

        matchDetails.push(
          `✅ 成長/雰囲気/福利厚生のキーワード ${
            appealMatches + benefitMatches
          }項目一致 (+${keywordScore}点)`
        );
      }

      matchingResults.push({ job, score: totalScore, details: matchDetails });
    }

    matchingResults.sort((a, b) => b.score - a.score);

    return res.status(200).json({
      status: 'success',
      results: matchingResults,
      message: `${matchingResults.length}件の求人についてAIマッチングスコアを計算しました。`,
    });
  } catch (error: any) {
    console.error('Matching API Error:', error);
    return res.status(500).json({
      error: error.message || 'サーバー側で予期せぬエラーが発生しました。',
    });
  }
}

