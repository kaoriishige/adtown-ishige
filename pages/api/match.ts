import { NextApiRequest, NextApiResponse } from 'next';
import { adminDb } from '@/lib/firebase-admin';
import * as admin from 'firebase-admin';

// --- 型定義を追加 (pages/recruit/jobs/create.tsx からコピー) ---
interface CustomField {
  id: string;
  title: string;
  content: string;
}
// -----------------------------------------------------------------

// --- 1. マッチングの重み設定 (ランキング準拠) ---
const MATCH_WEIGHTS = {
  // 1位: 給与・待遇, 10位: 福利厚生
  SALARY_BENEFIT: 15,
  BENEFIT_PER_HIT: 3,

  // 2位: 勤務地・通勤条件 (リモート含む)
  LOCATION: 12,
  REMOTE_MATCH: 10,

  // 3位: 仕事内容, 8位: 雇用形態
  JOB_CATEGORY: 10,
  EMPLOYMENT_TYPE: 4,

  // 4位: 成長機会, 9位: 職場環境, 6位: WLB
  GROWTH_ATMOSPHERE: 8,
  WLB_FEATURES: 7,
};

// --- 2. ユーティリティ関数 ---

/**
 * 給与の文字列から最低/最高額の数値を抽出する（簡易版）
 * 例: "350万円〜500万円" -> { min: 350, max: 500 }
 */
const parseSalaryRange = (salaryStr: string): { min: number; max: number } => {
  // 全角数字を半角に変換、"万円"、"以上"などを除去
  const normalized = salaryStr
    .replace(/[０-９]/g, (s) =>
      String.fromCharCode(s.charCodeAt(0) - 0xFEE0)
    )
    // ✅ 不要なエスケープ削除
    .replace(/[^0-9〜\-.+]/g, '');

  const parts = normalized.split(/[〜\-]/);

  const min = parseFloat(parts[0] || '0');
  let max = min;

  if (parts.length > 1) {
    max = parseFloat(parts[parts.length - 1]);
  }

  // "以上" の場合は最高額を非常に高く設定
  if (normalized.includes('以上') || normalized.includes('+')) {
    max = 9999;
  }

  return { min: min, max: max || min };
};

/**
 * テキストから特定のキーワードがいくつ含まれているかを数える
 */
const countKeywordMatches = (text: string, keywordList: string[]): number => {
  if (!text || !keywordList.length) return 0;
  const lowerText = text.toLowerCase();
  let count = 0;
  for (const keyword of keywordList) {
    if (lowerText.includes(keyword.toLowerCase())) {
      count++;
    }
  }
  return count;
};

// --- 3. メインマッチングロジック ---

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // ★認証はここでは省略しますが、実際にはセッショントークン等で認証を行う必要があります。
  const uid = req.query.uid as string;
  if (!uid) {
    return res.status(401).json({ error: 'User ID is required.' });
  }

  try {
    // 3-A. 求職者プロフィールの取得
    const userDoc = await adminDb.collection('users').doc(uid).get();
    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User profile not found.' });
    }
    const userProfile = userDoc.data() as any;

    // 3-B. 公開中の求人情報の全取得
    const jobsSnapshot = await adminDb
      .collection('jobs')
      .where('status', '==', 'active')
      .get();
    const jobs = jobsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as any[];

    const matchingResults: { job: any; score: number; details: string[] }[] = [];

    // 3-C. 各求人とのマッチングスコア計算
    for (const job of jobs) {
      let totalScore = 0;
      const matchDetails: string[] = [];

      // --- 1. 職種カテゴリ (JOB_CATEGORY, 10点) ---
      const jobCategory = job.jobCategory;
      if (jobCategory && userProfile.desiredJobTypes?.includes(jobCategory)) {
        totalScore += MATCH_WEIGHTS.JOB_CATEGORY;
        matchDetails.push(
          `✅ 職種カテゴリが一致 (${MATCH_WEIGHTS.JOB_CATEGORY}点)`
        );
      }

      // --- 2. 雇用形態 (EMPLOYMENT_TYPE, 4点) ---
      const employmentType = job.employmentType;
      if (
        employmentType &&
        userProfile.desiredEmploymentTypes?.includes(employmentType)
      ) {
        totalScore += MATCH_WEIGHTS.EMPLOYMENT_TYPE;
        matchDetails.push(
          `✅ 雇用形態が一致 (${MATCH_WEIGHTS.EMPLOYMENT_TYPE}点)`
        );
      }

      // --- 3. 勤務地とリモート (LOCATION, REMOTE_MATCH) ---
      const userLocation = userProfile.desiredLocation || '';
      const jobLocation = job.workLocation || '';

      if (userLocation && jobLocation && jobLocation.includes(userLocation)) {
        totalScore += MATCH_WEIGHTS.LOCATION;
        matchDetails.push(`✅ 勤務地が一致 (${MATCH_WEIGHTS.LOCATION}点)`);
      }

      const remoteMatch = job.remoteLevel === userProfile.desiredRemoteLevel;
      if (remoteMatch) {
        totalScore += MATCH_WEIGHTS.REMOTE_MATCH;
        matchDetails.push(
          `✅ リモート希望レベルが一致 (${MATCH_WEIGHTS.REMOTE_MATCH}点)`
        );
      }

      // --- 4. 給与・待遇 (SALARY_BENEFIT, 15点) ---
      const userSalary = parseSalaryRange(
        userProfile.desiredAnnualSalary || ''
      );
      const jobSalary = parseSalaryRange(job.salary || '');

      const salaryOverlap =
        userSalary.min <= jobSalary.max && jobSalary.min <= userSalary.max;

      if (salaryOverlap && userSalary.min > 0) {
        totalScore += MATCH_WEIGHTS.SALARY_BENEFIT;
        matchDetails.push(
          `✅ 給与レンジが希望と適合 (${MATCH_WEIGHTS.SALARY_BENEFIT}点)`
        );
      }

      // --- 5. ワークライフバランス (WLB_FEATURES, 7点) ---
      const wlbScore = countKeywordMatches(
        job.holidays || '' + job.workingHours || '',
        userProfile.desiredWLBFeatures || []
      );
      if (wlbScore > 0) {
        totalScore += MATCH_WEIGHTS.WLB_FEATURES + wlbScore;
        matchDetails.push(
          `✅ WLB（休日/休暇）の特徴 ${wlbScore}項目一致 (+${
            MATCH_WEIGHTS.WLB_FEATURES + wlbScore
          }点)`
        );
      }

      // --- 6. 雰囲気・成長機会・福利厚生 (複合チェック) ---
      const jobAppealText =
        job.customFields?.map((f: CustomField) => f.content).join(' ') || '';
      const allUserKeywords = [
        ...(userProfile.preferredAtmosphere || []),
        ...(userProfile.desiredGrowthOpportunities || []),
        ...(userProfile.desiredBenefits || []),
      ];

      const appealMatches = countKeywordMatches(jobAppealText, allUserKeywords);

      if (appealMatches > 0) {
        totalScore += MATCH_WEIGHTS.GROWTH_ATMOSPHERE;
        const benefitMatches = countKeywordMatches(
          job.benefits || '',
          userProfile.desiredBenefits || []
        );
        totalScore += benefitMatches * MATCH_WEIGHTS.BENEFIT_PER_HIT;

        matchDetails.push(
          `✅ 成長/雰囲気/福利厚生のキーワード ${
            appealMatches + benefitMatches
          }項目一致 (+${
            MATCH_WEIGHTS.GROWTH_ATMOSPHERE +
            benefitMatches * MATCH_WEIGHTS.BENEFIT_PER_HIT
          }点)`
        );
      }

      matchingResults.push({ job, score: totalScore, details: matchDetails });
    }

    // 3-D. スコアの高い順にソートして結果を返す
    matchingResults.sort((a, b) => b.score - a.score);

    return res.status(200).json({
      status: 'success',
      results: matchingResults,
      message: `${matchingResults.length}件の求人についてAIマッチングスコアを計算しました。`,
    });
  } catch (error: any) {
    console.error('Matching API Error:', error);
    return res
      .status(500)
      .json({
        error:
          error.message || 'サーバー側で予期せぬエラーが発生しました。',
      });
  }
}
