// pages/recruit/applicants.tsx (最低許容スコア 動的反映版)

import { useEffect, useState, useCallback } from 'react';
import { getAuth, onAuthStateChanged, User, Auth } from 'firebase/auth'; 
import { getFirestore, collection, query, where, getDocs, doc, getDoc, updateDoc, addDoc, serverTimestamp, Firestore } from 'firebase/firestore'; 
import { app } from '../../lib/firebase';
import Link from 'next/link';
import Head from 'next/head';
import { useRouter } from 'next/router';
import {
    RiUserSearchLine,
    RiCheckFill,
    RiCloseCircleLine,
    RiContactsLine,
    RiArrowLeftLine,
} from 'react-icons/ri';
import { Loader2, AlertTriangle } from 'lucide-react'; 

import { calculateMatchScore, Job, CompanyProfile, UserProfile as AIMatchingUserProfile } from '@/lib/ai-matching-engine'; 

// --- ローカルの型定義 (外部型と一致させることを目的とする) ---
interface LocalUserProfile {
    uid?: string;
    name: string; 
    
    desiredSalaryMin: number;
    desiredSalaryMax: number;
    desiredEmploymentType: string;
    preferredWorkingHours: string;
    
    topPriorities: string[];
    desiredLocation: string;
    desiredJobTypes: string[];
    skills: string;
    
    appealPoints: {
        atmosphere: string[];
        growth: string[];
        wlb: string[];
        benefits: string[];
        organization: string[];
    };
    
    desiredAtmosphere: string[];
    desiredGrowthOpportunities: string[];
    desiredWLBFeatures: string[];
    desiredBenefits: string[];
    desiredOrganization: string[];
}


// 応募者データ (リスト表示用)
interface ApplicantData {
    id: string;
    userId: string;
    recruitmentId: string;
    appliedAt: { toDate: () => Date };
    status: 'applied' | 'accepted' | 'rejected' | 'scouted'; 
    score?: number;
    reasons?: string[];
    name?: string; 
    desiredJob?: string; 
    skills?: string; 
}

// 企業プロフィールのAIマッチングエンジン型を拡張
interface ExtendedCompanyProfile extends CompanyProfile {
    companyName: string; 
}

interface CompanyMeta {
    minMatchScore: number;
    companyProfile: ExtendedCompanyProfile;
}


export default function ApplicantsPage() {
    const router = useRouter();
    const recruitmentId = router.query.recruitmentId as string; 
    
    const [applicants, setApplicants] = useState<ApplicantData[]>([]);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<User | null>(null);
    const [jobData, setJobData] = useState<Job | null>(null);
    const [companyMeta, setCompanyMeta] = useState<CompanyMeta | null>(null);
    const [error, setError] = useState<string | null>(null);
    
    // ★ 修正点: minMatchScore の初期値を 60 に設定（設定可能な最低値に近い値）
    // 実際に表示される値は Firestore から取得されます。
    const [minMatchScore, setMinMatchScore] = useState<number>(60);

    const db: Firestore = getFirestore(app);
    const auth: Auth = getAuth(app);

    // データフェッチのロジック
    const fetchMatchingData = useCallback(async (currentUser: User, jobId: string) => {
        if (!currentUser || !jobId) return;

        try {
            // 1. 求人情報 (recruitments) の取得
            const jobDocRef = doc(db, 'recruitments', jobId);
            const jobSnap = await getDoc(jobDocRef);

            if (!jobSnap.exists() || jobSnap.data()?.uid !== currentUser.uid) {
                setError("この求人情報が見つからないか、あなたに編集権限がありません。");
                setLoading(false);
                return;
            }

            const jobDataRaw = jobSnap.data();
            
            const job: Job = {
                id: jobId,
                jobTitle: jobDataRaw.jobTitle || '',
                salaryMin: jobDataRaw.salaryMin || 0,
                salaryMax: jobDataRaw.salaryMax || 0,
                location: jobDataRaw.location || '',
                jobCategory: jobDataRaw.jobCategory || '',
                employmentType: jobDataRaw.employmentType || '正社員',
                workingHours: jobDataRaw.workingHours || '',
                workingDays: jobDataRaw.workingDays || [],
                requiredSkills: jobDataRaw.requiredSkills || '',
                welcomeSkills: jobDataRaw.welcomeSkills || '',
                remotePolicy: jobDataRaw.remotePolicy || 'no',
                appealPoints: jobDataRaw.appealPoints || { growth: [], wlb: [], benefits: [], atmosphere: [], organization: [] },
            };
            setJobData(job);

            // 2. 企業プロフィール (recruiters) の取得
            const companyDocRef = doc(db, 'recruiters', currentUser.uid);
            const companySnap = await getDoc(companyDocRef);

            if (!companySnap.exists()) {
                 setError("企業プロフィール（AIマッチング設定）が見つかりません。");
                 setLoading(false);
                 return;
            }
            const companyDataRaw = companySnap.data();
            
            // ★ 修正点: Firestoreから取得した minMatchScore を変数に格納し、stateも更新
            // データが存在しない、または無効な場合は、設定可能な最小値60を使用（設定範囲が60〜99のため）
            const fetchedMinMatchScore = (typeof companyDataRaw.minMatchScore === 'number' && companyDataRaw.minMatchScore >= 60 && companyDataRaw.minMatchScore <= 99) 
                                           ? companyDataRaw.minMatchScore : 60; 
            
            setMinMatchScore(fetchedMinMatchScore); // state を更新して画面表示に反映

            const companyProfile: ExtendedCompanyProfile = {
                companyName: companyDataRaw.companyName || '', 
                minMatchScore: fetchedMinMatchScore,
                appealPoints: {
                    atmosphere: companyDataRaw.appealPoints?.atmosphere || [],
                    growth: companyDataRaw.appealPoints?.growth || [],
                    wlb: companyDataRaw.appealPoints?.wlb || [],
                    benefits: companyDataRaw.appealPoints?.benefits || [],
                    organization: companyDataRaw.appealPoints?.organization || [],
                }
            };
            setCompanyMeta({ minMatchScore: fetchedMinMatchScore, companyProfile });

            // 3. 応募者データ (applicants) の取得
            const applicantsRef = collection(db, 'applicants'); 
            const qApplicants = query(applicantsRef, where('recruitmentId', '==', jobId));
            const applicantsSnap = await getDocs(qApplicants);

            const scoredApplicants: ApplicantData[] = [];

            // 4. 各応募者のプロフィールを取得し、スコアリングを実行
            for (const applicantDoc of applicantsSnap.docs) {
                const applicantData = applicantDoc.data();
                const userId = applicantData.userId;

                // 4.1. 求職者プロフィール (userProfiles) の取得
                const userProfileDocRef = doc(db, 'userProfiles', userId); 
                const userProfileSnap = await getDoc(userProfileDocRef);
                
                if (userProfileSnap.exists()) {
                    const userProfileRaw = userProfileSnap.data() as any;
                    
                    const userProfile: LocalUserProfile = { 
                         uid: userId,
                         name: userProfileRaw.name || '匿名', 
                         topPriorities: userProfileRaw.topPriorities || [],
                         
                         desiredSalaryMin: userProfileRaw.desiredAnnualSalaryMin || userProfileRaw.desiredAnnualSalary || 0,
                         desiredSalaryMax: userProfileRaw.desiredAnnualSalaryMax || userProfileRaw.desiredAnnualSalary || 0,
                         desiredEmploymentType: userProfileRaw.desiredEmploymentType || userProfileRaw.desiredJobTypes?.[0] || '',
                         preferredWorkingHours: userProfileRaw.preferredWorkingHours || '',

                         desiredLocation: userProfileRaw.desiredLocation || '',
                         desiredJobTypes: userProfileRaw.desiredJobTypes || [],
                         skills: userProfileRaw.skills || '',
                         appealPoints: {
                            atmosphere: userProfileRaw.desiredAtmosphere || [],
                            growth: userProfileRaw.desiredGrowthOpportunities || [],
                            wlb: userProfileRaw.desiredWLBFeatures || [],
                            benefits: userProfileRaw.desiredBenefits || [],
                            organization: userProfileRaw.desiredOrganization || [],
                         },
                         desiredAtmosphere: userProfileRaw.desiredAtmosphere || [],
                         desiredGrowthOpportunities: userProfileRaw.desiredGrowthOpportunities || [],
                         desiredWLBFeatures: userProfileRaw.desiredWLBFeatures || [],
                         desiredBenefits: userProfileRaw.desiredBenefits || [],
                         desiredOrganization: userProfileRaw.desiredOrganization || [],
                    };

                    // 4.3. スコア計算
                    const { score, reasons } = calculateMatchScore(userProfile as unknown as AIMatchingUserProfile, job, companyProfile);

                    // 4.4. フィルタリング: 企業が設定した最低スコア以上の場合のみリストに追加
                    if (score >= fetchedMinMatchScore) {
                        scoredApplicants.push({
                            ...applicantData,
                            id: applicantDoc.id,
                            name: userProfile.name, 
                            desiredJob: userProfile.desiredJobTypes.join(', '), 
                            skills: userProfile.skills, 
                            score,
                            reasons,
                        } as ApplicantData);
                    }
                }
            }

            // スコアの高い順にソート
            scoredApplicants.sort((a, b) => (b.score || 0) - (a.score || 0));
            setApplicants(scoredApplicants);

        } catch (e: any) {
            console.error("応募者データの取得またはスコアリングに失敗:", e);
            if (e.message.includes('permission')) {
                setError("データの読み込み中にエラーが発生しました: Firestoreのセキュリティルールにより、応募者プロフィールへのアクセスが拒否されました。ルールを確認してください。");
            } else {
                setError(`データの読み込み中にエラーが発生しました: ${e.message}`);
            }
        } finally {
            setLoading(false);
        }
    }, [db]);


    useEffect(() => {
        if (!router.isReady) return;

        onAuthStateChanged(auth, (currentUser) => {
            if (currentUser) {
                setUser(currentUser);
                
                if (recruitmentId) {
                    fetchMatchingData(currentUser, recruitmentId);
                } else {
                    alert("求人IDが指定されていません。ダッシュボードに戻ります。");
                    router.push('/recruit/dashboard');
                    setLoading(false);
                }
            } else {
                 router.push('/partner/login');
            }
        });
    }, [auth, recruitmentId, router, fetchMatchingData, router.isReady]);


    // --- 連絡先交換（承諾）処理 ---
    const handleContactExchange = async (applicant: ApplicantData) => {
        if (!window.confirm(`${applicant.name || 'この応募者'}さんと連絡先を交換しますか？この操作は取り消せません。`)) {
            return;
        }

        try {
            // 1. マッチングドキュメントを matches コレクションに作成
            const newMatchRef = await addDoc(collection(db, 'matches'), {
                companyUid: user?.uid,
                userUid: applicant.userId,
                recruitmentId: applicant.recruitmentId,
                jobTitle: jobData?.jobTitle || '求人情報なし', 
                status: 'contact_exchange_complete', 
                createdAt: serverTimestamp(), 
                updatedAt: serverTimestamp(),
                companyContactExchanged: true, 
                userContactExchanged: true, 
            });

            // 2. 応募ステータスを更新（'accepted'）
            const applicantDocRef = doc(db, 'applicants', applicant.id); 
            await updateDoc(applicantDocRef, { status: 'accepted' });

            alert(`承諾し、連絡先交換を完了しました。求職者には通知されます。マッチングID: ${newMatchRef.id}`);
            
            setApplicants(prev => prev.map(a => a.id === applicant.id ? { ...a, status: 'accepted' } : a));

        } catch (e) {
            console.error("連絡先交換処理に失敗:", e);
            alert("連絡先交換処理に失敗しました。システム管理者にお問い合わせください。");
        }
    };
    
    // --- 見送り（却下）処理 ---
    const handleRejectApplicant = async (applicant: ApplicantData) => {
        if (!window.confirm(`${applicant.name || 'この応募者'}さんを見送りますか？この操作は元に戻せません。`)) {
             return;
        }

        try {
            // 1. 応募ステータスを更新（'rejected'）
            const applicantDocRef = doc(db, 'applicants', applicant.id); 
            await updateDoc(applicantDocRef, { status: 'rejected' });

            alert(`${applicant.name || '応募者'}さんを見送りました。`);

            setApplicants(prev => prev.map(a => a.id === applicant.id ? { ...a, status: 'rejected' } : a));
        } catch (e) {
            console.error("見送り処理に失敗:", e);
            alert("見送り処理に失敗しました。");
        }
    };


    if (loading) return <div className="flex justify-center items-center h-screen text-lg text-indigo-600"><Loader2 className="animate-spin mr-2" /> データ読み込み中...</div>;

    // 表示用の最低スコアは state (minMatchScore) から取得
    const displayMinScore = minMatchScore;

    return (
        <div className="min-h-screen bg-gray-50 font-sans">
            <Head>
                <title>応募者一覧（AIスコア付き） | {jobData?.jobTitle || '求人'}の応募者</title>
            </Head>

            <header className="bg-white shadow-sm sticky top-0 z-10">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <Link href="/recruit/dashboard" className="flex items-center text-sm text-gray-600 hover:text-gray-900 font-semibold mb-2">
                        <RiArrowLeftLine className="w-4 h-4 mr-2" /> ダッシュボードに戻る
                    </Link>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                        <RiUserSearchLine className="text-indigo-500 mr-2" size={24} />
                        {jobData ? jobData.jobTitle : '求人'}の応募者一覧
                    </h1>
                    <p className="text-sm text-gray-600 mt-1">
                        最低許容スコア: <span className="font-bold text-red-500">{displayMinScore}点</span> 以上の候補者のみ表示
                    </p>
                </div>
            </header>

            <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                 {error && (
                     <div className="p-4 mb-6 bg-red-100 text-red-700 rounded-lg flex items-center">
                          <AlertTriangle className="w-5 h-5 mr-2" /> {error}
                     </div>
                 )}

                {applicants.length === 0 ? (
                    <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-xl bg-white">
                        <RiUserSearchLine size={60} className="text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-600 text-lg">現在、最低許容スコア({displayMinScore}点)以上の応募者はいません。</p>
                        <p className="text-sm text-gray-500 mt-2">求人情報を編集してAIスコアを改善しましょう。</p>
                    </div>
                ) : (
                    <ul className="space-y-4">
                        {applicants.map((a) => (
                            <li
                                key={a.id}
                                className={`bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition ${a.status === 'rejected' ? 'opacity-50 border-red-300' : ''}`}
                            >
                                <div className="flex justify-between items-start flex-wrap">
                                    {/* 左側: 応募者情報とスコア */}
                                    <div className="flex-1 min-w-[200px]">
                                        <p className="font-semibold text-gray-800 text-lg">{a.name || '匿名ユーザー'}</p>
                                        <p className="text-sm text-gray-600">
                                            希望職種: {a.desiredJob || '未設定'}
                                        </p>
                                        
                                        {a.score !== undefined && (
                                            <p className="text-md font-bold mt-2 flex items-center">
                                                AIスコア: 
                                                <span className={`ml-2 text-xl ${a.score >= 80 ? 'text-green-600' : 'text-yellow-600'}`}>
                                                    {a.score}点
                                                </span>
                                            </p>
                                        )}
                                        
                                        {a.reasons && a.reasons.length > 0 && (
                                            <div className="mt-2 flex flex-wrap gap-1">
                                                <span className="text-xs font-semibold text-gray-500">マッチ理由:</span>
                                                {a.reasons.map((r, i) => (
                                                    <span key={i} className="text-xs px-2 py-0.5 rounded bg-blue-50 text-blue-700">
                                                        {r}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                        <p className="text-xs text-gray-400 mt-2">
                                            応募日: {a.appliedAt?.toDate?.()?.toLocaleString?.() || '---'}
                                        </p>
                                    </div>

                                    {/* 右側: アクションボタン */}
                                    <div className="flex flex-col gap-2 mt-4 md:mt-0 min-w-[200px]">
                                        {a.status === 'accepted' ? (
                                            <div className="text-center p-2 bg-green-100 text-green-700 rounded-lg font-bold flex items-center justify-center gap-1">
                                                <RiContactsLine /> 連絡先交換済み
                                            </div>
                                        ) : a.status === 'rejected' ? (
                                             <div className="text-center p-2 bg-red-100 text-red-700 rounded-lg font-bold flex items-center justify-center gap-1">
                                                 <RiCloseCircleLine /> 見送り済み
                                             </div>
                                        ) : (
                                            <>
                                                <button
                                                     onClick={() => handleContactExchange(a)}
                                                     className="px-4 py-2 bg-green-600 text-white rounded-lg flex items-center justify-center gap-1 text-sm shadow hover:bg-green-700 font-semibold"
                                                >
                                                     <RiCheckFill /> 承諾 & 連絡先交換
                                                </button>
                                                <Link
                                                     href={`/recruit/jobs/applicants/${a.userId}?recruitmentId=${a.recruitmentId}`} 
                                                     className="px-4 py-2 bg-indigo-600 text-white rounded-lg flex items-center justify-center gap-1 text-sm shadow hover:bg-indigo-700 font-semibold"
                                                >
                                                     <RiUserSearchLine /> 詳細プロフィール
                                                </Link>
                                                <button
                                                     onClick={() => handleRejectApplicant(a)}
                                                     className="px-4 py-2 bg-gray-500 text-white rounded-lg flex items-center justify-center gap-1 text-sm shadow hover:bg-gray-600 font-semibold"
                                                >
                                                     <RiCloseCircleLine /> 見送り
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>

                                {/* 連絡先情報 (承諾後) */}
                                {a.status === 'accepted' && (
                                    <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2 w-full">
                                        <RiContactsLine className="text-green-500" />
                                        <span className="text-sm text-gray-700 font-semibold">
                                            連絡先開示済み。求職者に連絡を取ってください。
                                        </span>
                                    </div>
                                )}
                            </li>
                        ))}
                    </ul>
                )}
            </main>
        </div>
    );
}