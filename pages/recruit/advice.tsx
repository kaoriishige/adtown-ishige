import { NextPage, GetServerSideProps } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import React, { useState, useEffect } from 'react';
import {
  RiLightbulbFlashLine,
  RiArrowLeftLine,
  RiLoader4Line,
  RiErrorWarningLine,
  RiSendPlaneLine
} from 'react-icons/ri';
import nookies from 'nookies';
import { adminAuth, adminDb } from '@/lib/firebase-admin';

// --- 型定義 ---
interface AppealPoints {
  growth?: string[];
  wlb?: string[];
  benefits?: string[];
  atmosphere?: string[];
  organization?: string[];
}

interface Recruitment {
  id: string;
  title: string;
  description: string;
  jobTitle: string;
  salaryMin: number;
  salaryMax: number;
  salaryType: string;
  location: string;
  employmentType: string;
  remotePolicy: string;
  workingHours: string;
  appealPoints: AppealPoints;
}

interface ScoreGuideItem {
  range: string;
  label: string;
  meaning: string;
}

interface AdviceData {
  summary: string;
  suggestions: string[];
  riskScore: number;
  conversionRate?: number;
  scoreMeaning?: string;
  scoreLevel?: string;
  scoreGuide?: ScoreGuideItem[];
  premiumRecommendation?: string;
}

interface AdvicePageProps {
  isPaid: boolean;
  companyName: string;
  recruitments: Recruitment[];
  error?: string;
}

// ----------------------------------------------------------------
// --- サーバーサイド認証とデータ取得 ---
// ----------------------------------------------------------------
export const getServerSideProps: GetServerSideProps = async (context) => {
  try {
    const cookies = nookies.get(context);
    const token = await adminAuth.verifySessionCookie(cookies.session || '', true);
    const { uid } = token;

    const userSnap = await adminDb.collection('users').doc(uid).get();
    const userData = userSnap.data();

    const isPaid =
      userData?.isPaid === true ||
      userData?.recruitSubscriptionStatus === 'active' ||
      userData?.recruitSubscriptionStatus === 'Paid';

    if (!isPaid) {
      return { redirect: { destination: '/recruit/subscribe_plan', permanent: false } };
    }

    // --- 求人情報の取得 ---
    const recruitmentsSnap = await adminDb
      .collection('recruitments')
      .where('uid', '==', uid)
      .get();

    const recruitments: Recruitment[] = recruitmentsSnap.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        title: data.jobTitle || 'タイトル未設定',
        description: data.jobDescription || '説明未設定',
        jobTitle: data.jobTitle || 'タイトル未設定',
        salaryMin: data.salaryMin || 0,
        salaryMax: data.salaryMax || 0,
        salaryType: data.salaryType || '年収',
        location: data.location || '勤務地未設定',
        employmentType: data.employmentType || '正社員',
        remotePolicy: data.remotePolicy || 'no',
        workingHours: data.workingHours || '未設定',
        appealPoints: data.appealPoints || {},
      };
    });

    return {
      props: {
        isPaid,
        companyName: userData?.companyName || '企業様',
        recruitments,
      },
    };
  } catch (error) {
    console.error('Error in getServerSideProps (advice):', error);
    return { redirect: { destination: '/recruit/subscribe_plan', permanent: false } };
  }
};

// ----------------------------------------------------------------
// --- AIアドバイス API呼び出し ---
// ----------------------------------------------------------------
const fetchAdvice = async (recruitmentData: Recruitment): Promise<AdviceData> => {
  const response = await fetch('/api/recruit/ai-advice', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(recruitmentData),
  });

  if (!response.ok) {
    throw new Error('AIアドバイスの取得に失敗しました。サーバー側のログを確認してください。');
  }

  const data = await response.json();
  return data as AdviceData;
};

// ----------------------------------------------------------------
// --- ページコンポーネント ---
// ----------------------------------------------------------------
const AdvicePage: NextPage<AdvicePageProps> = ({ isPaid, companyName, recruitments, error }) => {
  const router = useRouter();
  const [selectedRecruitment, setSelectedRecruitment] = useState<Recruitment | null>(null);
  const [advice, setAdvice] = useState<AdviceData | null>(null);
  const [loading, setLoading] = useState(false);
  const [requestError, setRequestError] = useState<string | null>(error || null);

  useEffect(() => {
    if (!isPaid) {
      router.replace('/recruit/subscribe_plan');
    }
  }, [isPaid, router]);

  const handleAnalyze = async () => {
    if (!selectedRecruitment) {
      setRequestError('分析対象の求人を選択してください。');
      return;
    }

    setLoading(true);
    setAdvice(null);
    setRequestError(null);

    try {
      const result = await fetchAdvice(selectedRecruitment);
      setAdvice(result);
    } catch (e: any) {
      setRequestError(e.message || 'AIとの通信中にエラーが発生しました。');
    } finally {
      setLoading(false);
    }
  };

  if (error) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50 p-4">
        <div className="text-center p-8 bg-white rounded-lg shadow-xl max-w-md">
          <RiErrorWarningLine size={48} className="text-red-500 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-gray-900 mb-2">初期データ取得エラー</h1>
          <p className="text-gray-600">{error}</p>
          <Link
            href="/recruit/dashboard"
            className="mt-4 inline-flex items-center text-indigo-600 hover:underline"
          >
            <RiArrowLeftLine className="mr-1" /> ダッシュボードに戻る
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <Head>
        <title>AI求人アドバイス ({companyName})</title>
      </Head>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
        <Link
          href="/recruit/dashboard"
          className="flex items-center text-sm text-gray-600 hover:text-gray-900 font-semibold mb-6"
        >
          <RiArrowLeftLine className="w-4 h-4 mr-2" /> ダッシュボードに戻る
        </Link>

        <div className="flex items-center space-x-4 border-b pb-4">
          <RiLightbulbFlashLine size={36} className="text-indigo-600" />
          <h1 className="text-3xl font-bold text-gray-900">AI求人アドバイス</h1>
        </div>

        {/* --- 分析対象選択 --- */}
        <div className="p-6 bg-indigo-50 border border-indigo-200 rounded-xl shadow-lg">
          <h2 className="text-xl font-bold text-indigo-800 mb-4">分析対象の求人を選択</h2>

          {recruitments.length === 0 ? (
            <div className="text-center p-8 text-gray-600">
              <RiErrorWarningLine className="w-8 h-8 mx-auto mb-2" />
              <p>現在、承認済みの求人がありません。求人を作成・審査申請してください。</p>
              <Link
                href="/recruit/jobs/create"
                className="mt-3 inline-block text-indigo-600 hover:underline font-semibold"
              >
                <RiSendPlaneLine className="w-4 h-4 mr-1 inline" /> 新しい求人を作成する
              </Link>
            </div>
          ) : (
            <div className="flex flex-col space-y-3">
              <select
                className="p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                value={selectedRecruitment?.id || ''}
                onChange={(e) => {
                  const id = e.target.value;
                  const rec = recruitments.find((r) => r.id === id);
                  setSelectedRecruitment(rec || null);
                  setAdvice(null);
                  setRequestError(null);
                }}
              >
                <option value="" disabled>
                  --- 分析したい求人を選択してください ---
                </option>
                {recruitments.map((rec) => (
                  <option key={rec.id} value={rec.id}>
                    {rec.title}
                  </option>
                ))}
              </select>

              <button
                onClick={handleAnalyze}
                disabled={!selectedRecruitment || loading}
                className="px-6 py-3 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 flex items-center justify-center transition-colors shadow-md"
              >
                {loading ? (
                  <>
                    <RiLoader4Line className="animate-spin mr-2" /> AIが分析中...
                  </>
                ) : (
                  <>
                    <RiSendPlaneLine className="mr-2" /> AIに改善アドバイスを依頼する
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {/* --- エラーメッセージ --- */}
        {requestError && (
          <div className="p-4 bg-red-100 border-l-4 border-red-500 text-red-800 rounded-md">
            <p className="font-bold flex items-center">
              <RiErrorWarningLine className="mr-2" />
              エラー: {requestError}
            </p>
          </div>
        )}

        {/* --- AIアドバイス結果 --- */}
        {advice && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900 border-b pb-2 flex items-center">
              AI分析結果（対象: {selectedRecruitment?.title}）
            </h2>

            {/* スコア情報 */}
            <div className="bg-white p-6 rounded-xl shadow-md border">
              <h3 className="text-xl font-bold text-indigo-700 mb-3">スコア情報</h3>
              <p className="text-gray-800 text-lg font-semibold">
                総合評価：<span className="text-indigo-600">{advice.scoreLevel}</span>
                （リスクスコア：{advice.riskScore}/100
              </p>
              <p className="mt-2 text-gray-700">{advice.scoreMeaning}</p>

              {advice.scoreGuide && advice.scoreGuide.length > 0 && (
                <div className="mt-4">
                  <h4 className="text-md font-bold text-gray-800 mb-2">
                    スコアガイド（参考）
                  </h4>
                  <ul className="text-sm text-gray-700 list-disc ml-6 space-y-1">
                    {advice.scoreGuide.map((g, i) => (
                      <li key={i}>
                        <strong>{g.range}</strong>：{g.label} ― {g.meaning}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* 改善サマリー */}
            <div className="bg-white p-6 rounded-xl shadow-md border">
              <h3 className="text-xl font-bold text-green-700 mb-3 flex items-center">
                <RiLightbulbFlashLine className="mr-2" /> 改善サマリー
              </h3>
              <p className="whitespace-pre-wrap text-gray-700">{advice.summary}</p>
            </div>

            {/* 改善提案 */}
            <div className="bg-white p-6 rounded-xl shadow-md border">
              <h3 className="text-xl font-bold text-red-700 mb-4 flex items-center">
                <RiErrorWarningLine className="mr-2" /> 改善提案リスト
              </h3>
              <ul className="list-disc list-inside space-y-3 pl-4">
                {advice.suggestions.map((s, i) => (
                  <li key={i} className="text-gray-700 text-sm">
                    {s}
                  </li>
                ))}
              </ul>
            </div>

            {/* プレミアム改善案 */}
            {advice.premiumRecommendation && (
              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-lg">
                <p className="text-yellow-800 font-semibold mb-1">
                  さらに効果を高める改善案：
                </p>
                <p className="text-sm text-yellow-900 whitespace-pre-wrap">
                  {advice.premiumRecommendation}
                </p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default AdvicePage;

