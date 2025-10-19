// pages/recruit/jobs/applicants/[userId].tsx
import { NextPage, GetServerSideProps } from 'next';
import { useRouter } from 'next/router';
import React, { useState, useCallback } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import nookies from 'nookies';

// firebase (client)
import { getFirestore, doc, updateDoc, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

// admin (server)
import { adminAuth, adminDb } from '../../../../lib/firebase-admin';
import { app } from '../../../../lib/firebase'; // client-side initialized app

// icons
import { RiArrowLeftLine, RiPencilLine, RiContactsLine, RiUserSearchLine } from 'react-icons/ri';
import { TrendingUp, DollarSign, Briefcase, AlertTriangle } from 'lucide-react';
import { RiCheckFill, RiCloseCircleLine } from 'react-icons/ri';

// --- 型定義 ---

type EngineAppealPoints = {
  atmosphere: string[];
  growth: string[];
  wlb: string[];
  benefits: string[];
  organization: string[];
};

interface EngineUserProfile {
  uid: string;
  appealPoints: EngineAppealPoints;
  skills?: string;
  desiredLocation?: string;
  desiredAnnualSalary?: number;
  desiredJobTypes?: string[];
  topPriorities?: string[];
}

interface EngineJob {
  id: string;
  salaryMin: number;
  salaryMax: number;
  jobCategory: string;
  location: string;
}

interface EngineCompanyProfile {
  minMatchScore: number;
  appealPoints: EngineAppealPoints;
}

// UI 用の拡張プロファイル
interface UserProfile extends EngineUserProfile {
  name: string;
  age?: number | string;
  email?: string | null;
  phoneNumber?: string | null;

  // boolean フラグは明示的に any ではなく boolean に
  prefersRemote: boolean;
  hasDriverLicense: boolean;
  canWorkWeekends: boolean;

  // UI 補助プロパティ
  desiredAtmosphere: string[];
  desiredGrowthOpportunities: string[];
  desiredWLBFeatures: string[];
  desiredBenefits: string[];
  desiredOrganization: string[];
}

interface Job extends EngineJob {
  jobTitle: string;
}

interface CompanyProfile extends EngineCompanyProfile {
  companyName: string;
}

interface ApplicantRecord {
  id: string;
  status: 'applied' | 'accepted' | 'rejected' | 'scouted';
  notes: string;
}

interface MatchResult {
  score: number;
  reasons: string[];
}

interface ApplicantDetailsProps {
  error?: string;
  applicant: UserProfile | null;
  job: Job | null;
  companyProfile: CompanyProfile | null;
  applicantRecord: ApplicantRecord | null;
  matchResult: MatchResult | null;
  minMatchScore: number;
}

// ダミー：実運用では本物のスコア計算を使う
const calculateMatchScore = (a: any, b: any, c: any): MatchResult => ({ score: 85, reasons: ['スキルと勤務地が合致', '希望年収が近い'] });

// 補助コンポーネント
const InfoItem: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="flex justify-between items-center border-b pb-1">
    <span className="text-gray-500">{label}:</span>
    <span className="font-semibold text-gray-800">{value}</span>
  </div>
);

// --- SSR ---
export const getServerSideProps: GetServerSideProps = async (context) => {
  const { userId, recruitmentId } = context.query;

  // 入力チェック
  if (!userId || !recruitmentId || typeof userId !== 'string' || typeof recruitmentId !== 'string') {
    return {
      props: {
        error: 'ユーザーIDまたは求人IDが不正です。',
        applicant: null,
        job: null,
        companyProfile: null,
        applicantRecord: null,
        matchResult: null,
        minMatchScore: 0,
      } as ApplicantDetailsProps,
    };
  }

  let applicant: UserProfile | null = null;
  let job: Job | null = null;
  let companyProfile: CompanyProfile | null = null;
  let applicantRecord: ApplicantRecord | null = null;
  let matchResult: MatchResult | null = null;
  let minMatchScore = 0;

  try {
    const cookies = nookies.get(context);
    const sessionCookie = cookies.session || '';
    // セッションチェック（lib/firebase-admin の実装に依存）
    const decoded = await adminAuth.verifySessionCookie(sessionCookie, true);
    const companyUid = decoded.uid;

    // 応募レコードの確認（applicants コレクション）
    const applicantSnap = await adminDb
      .collection('applicants')
      .where('userId', '==', userId)
      .where('recruitmentId', '==', recruitmentId)
      .where('partnerId', '==', companyUid)
      .limit(1)
      .get();

    if (applicantSnap.empty) {
      return {
        props: {
          error: '応募情報が見つからないか、権限がありません。',
          applicant: null,
          job: null,
          companyProfile: null,
          applicantRecord: null,
          matchResult: null,
          minMatchScore: 0,
        } as ApplicantDetailsProps,
      };
    }

    const applicantDoc = applicantSnap.docs[0];
    const applicantDataRaw = applicantDoc.data();
    applicantRecord = {
      id: applicantDoc.id,
      status: (applicantDataRaw.status as ApplicantRecord['status']) || 'applied',
      notes: applicantDataRaw.notes || '',
    };

    // プロフィール・求人・企業情報を取得
    const [userProfileSnap, jobSnap, recruiterSnap] = await Promise.all([
      adminDb.collection('userProfiles').doc(userId).get(),
      adminDb.collection('recruitments').doc(recruitmentId).get(),
      adminDb.collection('recruiters').doc(companyUid).get(),
    ]);

    if (!userProfileSnap.exists || !jobSnap.exists || !recruiterSnap.exists) {
      return {
        props: {
          error: '必要なデータの一部が見つかりません。',
          applicant: null,
          job: null,
          companyProfile: null,
          applicantRecord,
          matchResult: null,
          minMatchScore: 0,
        } as ApplicantDetailsProps,
      };
    }

    const userProfileRaw = userProfileSnap.data() as { [key: string]: any };
    const jobDataRaw = jobSnap.data() as { [key: string]: any };
    const recruiterDataRaw = recruiterSnap.data() as { [key: string]: any };

    const ensureArray = (v: any) => (Array.isArray(v) ? v : []);

    // job
    job = {
      id: recruitmentId,
      jobTitle: jobDataRaw.jobTitle ?? '',
      salaryMin: jobDataRaw.salaryMin ?? 0,
      salaryMax: jobDataRaw.salaryMax ?? 0,
      location: jobDataRaw.location ?? '',
      jobCategory: jobDataRaw.jobCategory ?? '',
    };

    // companyProfile
    companyProfile = {
      companyName: recruiterDataRaw.companyName ?? '企業名不明',
      minMatchScore: recruiterDataRaw.minMatchScore ?? 60,
      appealPoints: recruiterDataRaw.appealPoints ?? {
        atmosphere: [],
        growth: [],
        wlb: [],
        benefits: [],
        organization: [],
      },
    };
    minMatchScore = companyProfile.minMatchScore;

    // applicant の整形（真偽値は !! で統一）
    applicant = {
      uid: userId,
      name: userProfileRaw.name ?? '匿名',
      age: userProfileRaw.age ?? '非公開',
      email: userProfileRaw.email ?? null,
      phoneNumber: userProfileRaw.phoneNumber ?? null,
      topPriorities: userProfileRaw.topPriorities ?? [],
      desiredAnnualSalary: userProfileRaw.desiredAnnualSalary ?? 0,
      desiredLocation: userProfileRaw.desiredLocation ?? '',
      desiredJobTypes: userProfileRaw.desiredJobTypes ?? [],
      skills: userProfileRaw.skills ?? '',

      prefersRemote: !!userProfileRaw.prefersRemote,
      hasDriverLicense: !!userProfileRaw.hasDriverLicense,
      canWorkWeekends: !!userProfileRaw.canWorkWeekends,

      appealPoints: {
        atmosphere: ensureArray(userProfileRaw.desiredAtmosphere),
        growth: ensureArray(userProfileRaw.desiredGrowthOpportunities),
        wlb: ensureArray(userProfileRaw.desiredWLBFeatures),
        benefits: ensureArray(userProfileRaw.desiredBenefits),
        organization: ensureArray(userProfileRaw.desiredOrganization),
      },

      desiredAtmosphere: ensureArray(userProfileRaw.desiredAtmosphere),
      desiredGrowthOpportunities: ensureArray(userProfileRaw.desiredGrowthOpportunities),
      desiredWLBFeatures: ensureArray(userProfileRaw.desiredWLBFeatures),
      desiredBenefits: ensureArray(userProfileRaw.desiredBenefits),
      desiredOrganization: ensureArray(userProfileRaw.desiredOrganization),
    } as UserProfile;

    // マッチスコア計算（ダミー）
    matchResult = calculateMatchScore(applicant, job, companyProfile);

    return {
      props: {
        applicant,
        job,
        companyProfile,
        applicantRecord,
        matchResult,
        minMatchScore,
      } as ApplicantDetailsProps,
    };
  } catch (error) {
    console.error('ApplicantDetails SSR Error:', error);
    // 認証エラー等はログイン画面へ
    return {
      redirect: {
        destination: '/partner/login',
        permanent: false,
      },
    };
  }
};

// --- ページ本体 ---
const ApplicantDetailsPage: NextPage<ApplicantDetailsProps> = ({ applicant, job, companyProfile, applicantRecord, matchResult, minMatchScore, error }) => {
  const router = useRouter();
  const dbClient = getFirestore(app);
  const authClient = getAuth(app);

  const [currentStatus, setCurrentStatus] = useState<ApplicantRecord['status']>(applicantRecord?.status || 'applied');
  const [notes, setNotes] = useState<string>(applicantRecord?.notes || '');
  const [isSaving, setIsSaving] = useState(false);

  if (error || !applicant || !job || !companyProfile || !applicantRecord || !matchResult) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50">
        <div className="p-8 bg-white rounded-lg shadow-xl">
          <AlertTriangle className="w-8 h-8 text-red-500 mx-auto mb-4" />
          <p className="text-xl font-semibold text-red-700">{error || '応募者データが見つかりません。'}</p>
          <Link href="/recruit/dashboard" className="mt-4 block text-center text-indigo-600 hover:underline">
            ダッシュボードに戻る
          </Link>
        </div>
      </div>
    );
  }

  const isAccepted = currentStatus === 'accepted';
  const isRejected = currentStatus === 'rejected';

  const handleStatusChange = useCallback(
    async (newStatus: 'accepted' | 'rejected') => {
      const currentUser = authClient.currentUser;
      if (!currentUser) {
        router.push('/partner/login');
        return;
      }

      const actionText = newStatus === 'accepted' ? '承諾し、連絡先を交換' : '見送り';
      if (!window.confirm(`${applicant.name}さんを${actionText}しますか？この操作は取り消せません。`)) {
        return;
      }

      setIsSaving(true);
      try {
        const applicantDocRef = doc(dbClient, 'applicants', applicantRecord.id);

        // 応募ステータスの更新
        await updateDoc(applicantDocRef, { status: newStatus });

        if (newStatus === 'accepted') {
          // マッチング作成（連絡先交換成立）
          await addDoc(collection(dbClient, 'matches'), {
            companyUid: currentUser.uid,
            userUid: applicant.uid,
            recruitmentId: job.id,
            jobTitle: job.jobTitle,
            status: 'contact_exchange_complete',
            createdAt: serverTimestamp(),
            companyContactExchanged: true,
          });
        }

        setCurrentStatus(newStatus);
        alert(`${applicant.name}さんを${actionText}しました。`);
      } catch (e) {
        console.error(`ステータス変更失敗 (${newStatus}):`, e);
        alert(`${actionText}処理に失敗しました。`);
      } finally {
        setIsSaving(false);
      }
    },
    [applicant.name, applicant.uid, job.id, job.jobTitle, applicantRecord.id, dbClient, router, authClient]
  );

  const handleSaveNotes = async () => {
    const currentUser = authClient.currentUser;
    if (!currentUser) {
      router.push('/partner/login');
      return;
    }
    setIsSaving(true);
    try {
      const applicantDocRef = doc(dbClient, 'applicants', applicantRecord.id);
      await updateDoc(applicantDocRef, { notes: notes, notesUpdatedAt: serverTimestamp() });
      alert('メモを保存しました。');
    } catch (e) {
      console.error('メモ保存失敗:', e);
      alert('メモの保存に失敗しました。');
    } finally {
      setIsSaving(false);
    }
  };

  const AppealPointList: React.FC<{ title: string; items?: string[] }> = ({ title, items }) => (
    <div className="p-4 border rounded-lg bg-gray-50">
      <h3 className="font-bold text-gray-700 mb-2">{title}</h3>
      <div className="flex flex-wrap gap-2 text-sm">
        {items && items.length > 0 ? (
          items.map((item) => (
            <span key={item} className="px-2 py-1 bg-gray-200 text-gray-700 rounded-md">
              {item}
            </span>
          ))
        ) : (
          <span className="text-gray-500 italic text-xs">設定されていません</span>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <Head>
        <title>{applicant.name}さんの詳細 | {job.jobTitle} - {companyProfile.companyName}</title>
      </Head>

      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link href={`/recruit/applicants?recruitmentId=${job.id}`} className="flex items-center text-sm text-gray-600 hover:text-gray-900 font-semibold mb-2">
            <RiArrowLeftLine className="w-4 h-4 mr-2" /> 応募者一覧に戻る
          </Link>
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{applicant.name}さん ({applicant.age})</h1>
              <p className="text-sm text-gray-600 mt-1">
                応募求人: <span className="font-semibold text-indigo-600">{job.jobTitle}</span>
              </p>
            </div>
            <span className={`px-4 py-2 text-md font-bold rounded-full ${isAccepted ? 'bg-green-100 text-green-700' : isRejected ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
              {isAccepted ? '承諾済み' : isRejected ? '見送り済み' : '選考中'}
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-6">
          <div className="p-6 bg-white rounded-xl shadow-lg border border-gray-100 text-center">
            <TrendingUp className="w-8 h-8 mx-auto mb-2" />
            <p className="text-xl font-bold text-gray-700">AIマッチングスコア</p>
            <p className={`text-6xl font-extrabold my-3 ${matchResult && matchResult.score >= minMatchScore ? 'text-green-600' : 'text-red-500'}`}>
              {matchResult?.score ?? 'N/A'}点
            </p>
            <p className="text-sm text-gray-500">（最低許容スコア: {minMatchScore}点）</p>
          </div>

          <div className="space-y-3">
            <button
              onClick={() => handleStatusChange('accepted')}
              disabled={isAccepted || isRejected || isSaving}
              className="w-full px-4 py-3 bg-green-600 text-white rounded-lg flex items-center justify-center gap-2 text-lg font-bold shadow hover:bg-green-700 disabled:bg-gray-400"
            >
              <RiCheckFill /> {isSaving && currentStatus !== 'rejected' ? '処理中...' : '承諾 & 連絡先交換'}
            </button>
            <button
              onClick={() => handleStatusChange('rejected')}
              disabled={isAccepted || isRejected || isSaving}
              className="w-full px-4 py-3 bg-red-500 text-white rounded-lg flex items-center justify-center gap-2 text-lg font-bold shadow hover:bg-red-600 disabled:bg-gray-400"
            >
              <RiCloseCircleLine /> {isSaving && currentStatus === 'rejected' ? '処理中...' : '見送り'}
            </button>
          </div>

          {isAccepted && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <h3 className="font-bold flex items-center text-green-700 mb-2"><RiContactsLine className="mr-2" />連絡先情報（開示済み）</h3>
              <p className="text-sm">Email: {applicant.email ?? '登録なし'}</p>
              <p className="text-sm">電話: {applicant.phoneNumber ?? '登録なし'}</p>
              <p className="text-xs text-gray-600 mt-2">※ 応募者にも貴社の連絡先が開示されています。</p>
            </div>
          )}

          <div className="p-4 bg-white rounded-xl shadow-lg border border-gray-100">
            <h3 className="font-bold flex items-center text-gray-700 mb-3"><RiPencilLine className="mr-2" />内部メモ (社内非公開)</h3>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
              className="w-full p-2 border rounded-md resize-none focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="面接評価、次フェーズへのコメントなどを入力"
            />
            <button
              onClick={handleSaveNotes}
              disabled={isSaving}
              className="mt-2 w-full px-3 py-1 bg-indigo-500 text-white rounded-md text-sm hover:bg-indigo-600 disabled:bg-gray-400"
            >
              {isSaving ? '保存中...' : 'メモを保存'}
            </button>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-8">
          <div className="p-6 bg-white rounded-xl shadow-lg border border-gray-100">
            <h2 className="text-xl font-bold border-b pb-2 mb-4 flex items-center text-indigo-700">
              <TrendingUp className="w-5 h-5 mr-3" />AIスコアリング詳細
            </h2>

            {matchResult?.reasons && matchResult.reasons.length > 0 ? (
              <div className="space-y-3">
                {matchResult.reasons.map((reason, index) => (
                  <div key={index} className="flex items-start p-3 bg-blue-50 rounded-lg">
                    <RiCheckFill className="text-blue-500 mt-1 mr-3 flex-shrink-0" size={20} />
                    <p className="text-gray-700 font-medium">{reason}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">AIによるマッチング理由が見つかりませんでした。基本的な条件が合致していない可能性があります。</p>
            )}

            <h3 className="font-bold text-gray-700 mt-6 pt-4 border-t">給与・職種の一致度</h3>
            <div className="mt-2 grid grid-cols-2 gap-4 text-sm">
              <p className="p-2 bg-gray-50 rounded">
                <DollarSign className="w-4 h-4 inline mr-1" />
                求職者の希望年収: {applicant.desiredAnnualSalary ?? '記載なし'} 万円
              </p>
              <p className="p-2 bg-gray-50 rounded">
                <Briefcase className="w-4 h-4 inline mr-1" />
                求人の最高年収: {job.salaryMax ?? '記載なし'} 万円
              </p>
            </div>
          </div>

          <div className="p-6 bg-white rounded-xl shadow-lg border border-gray-100 space-y-4">
            <h2 className="text-xl font-bold border-b pb-2 mb-4 flex items-center text-gray-700">
              <RiUserSearchLine className="w-5 h-5 mr-3" />応募者プロフィール詳細
            </h2>

            <p><strong>保有スキル概要:</strong> {applicant.skills || '記載なし'}</p>
            <p><strong>希望所在地:</strong> {applicant.desiredLocation || '全国'}</p>

            <h3 className="font-bold text-gray-700 mt-6 pt-4 border-t">求職者が希望する制度・文化</h3>
            <div className="space-y-4 pt-2">
              <AppealPointList title="社風・雰囲気" items={applicant.desiredAtmosphere} />
              <AppealPointList title="成長機会" items={applicant.desiredGrowthOpportunities} />
              <AppealPointList title="WLB (ワークライフバランス)" items={applicant.desiredWLBFeatures} />
              <AppealPointList title="福利厚生" items={applicant.desiredBenefits} />
              <AppealPointList title="組織・事業" items={applicant.desiredOrganization} />
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 space-y-4">
            <h2 className="text-xl font-bold border-b pb-2 mb-4 flex items-center text-gray-700">付加情報</h2>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <InfoItem label="リモート希望" value={applicant.prefersRemote ? 'リモート可' : '出社必須'} />
              <InfoItem label="運転免許" value={applicant.hasDriverLicense ? 'あり' : 'なし'} />
              <InfoItem label="土日勤務" value={applicant.canWorkWeekends ? '可能' : '不可'} />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ApplicantDetailsPage;
