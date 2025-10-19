import { useEffect, useState, useCallback } from 'react';
import { getAuth, onAuthStateChanged, User } from 'firebase/auth';
import { getFirestore, collection, query, where, getDocs, doc, getDoc, updateDoc, addDoc, serverTimestamp } from 'firebase/firestore'; 
import { app } from '../../lib/firebase';
import Link from 'next/link';
import Head from 'next/head';
import { useRouter } from 'next/router';
import {
    RiSendPlaneFill,
    RiArrowLeftLine,
    RiCheckboxCircleLine,
    RiAlertLine,
} from 'react-icons/ri';
import { Loader2, AlertTriangle, Briefcase, MapPin, JapaneseYen, Clock } from 'lucide-react';

// --- 型定義 ---
interface UserProfile {
    uid?: string;
    name: string;
    skills: string;
    selfPR: string;
    desiredJobTypes: string[];
    // 💡 AIマッチングの必須項目
    desiredAnnualSalary?: number; 
}
interface Job {
    id: string;
    jobTitle: string;
    location: string;
    salaryMin: number;
    salaryMax: number;
    salaryType: '年収' | '月給' | '時給';
    employmentType: string;
    recruiterId: string; // 💡 応募時に必要
}
interface ApplicantData {
    userId: string;
    recruitmentId: string;
    partnerId: string; // 💡 企業ID
    status: 'applied' | 'accepted' | 'rejected';
    appliedAt: any; // serverTimestamp()
}

export default function JobApplyPage() {
    const router = useRouter();
    // URLから求人IDを取得 (例: /users/apply-job?recruitmentId=XYZ)
    const { recruitmentId } = router.query; 

    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [isApplying, setIsApplying] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [jobData, setJobData] = useState<Job | null>(null);
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [hasApplied, setHasApplied] = useState(false);

    const db = getFirestore(app);
    const auth = getAuth(app);

    const fetchRequiredData = useCallback(async (currentUser: User, jobId: string) => {
        try {
            // 1. 求人情報 (recruitments) の取得
            const jobDocRef = doc(db, 'recruitments', jobId);
            const jobSnap = await getDoc(jobDocRef);

            if (!jobSnap.exists()) {
                setError("指定された求人情報が見つかりません。");
                return;
            }
            const data = jobSnap.data();
            setJobData({
                id: jobId,
                jobTitle: data?.jobTitle || '無題の求人',
                location: data?.location || '未定',
                salaryMin: data?.salaryMin || 0,
                salaryMax: data?.salaryMax || 0,
                salaryType: data?.salaryType || '年収',
                employmentType: data?.employmentType || '正社員',
                recruiterId: data?.uid || '' // 💡 企業IDを取得
            } as Job);
            
            // 2. 求職者プロフィール (userProfiles) の取得
            const userProfileDocRef = doc(db, 'userProfiles', currentUser.uid);
            const userProfileSnap = await getDoc(userProfileDocRef);

            if (!userProfileSnap.exists() || !userProfileSnap.data()?.desiredAnnualSalary) {
                // desiredAnnualSalaryがAIマッチングに必須のため、チェック
                setError("応募には、AIマッチング用のプロフィール（希望給与など）の登録が必要です。");
                setLoading(false);
                return;
            }
            const profileData = userProfileSnap.data() as UserProfile;
            setUserProfile(profileData);
            
            // 3. 応募履歴の確認 (applicants)
            const applicantsRef = collection(db, 'applicants');
            const q = query(
                applicantsRef,
                where('recruitmentId', '==', jobId),
                where('userId', '==', currentUser.uid)
            );
            const snap = await getDocs(q);
            setHasApplied(!snap.empty);

        } catch (e: any) {
            console.error("データの読み込みエラー:", e);
            setError(`データの読み込み中にエラーが発生しました: ${e.message}`);
        } finally {
            setLoading(false);
        }
    }, [db]);


    useEffect(() => {
        onAuthStateChanged(auth, (currentUser) => {
            if (currentUser) {
                setUser(currentUser);
                if (recruitmentId && typeof recruitmentId === 'string') {
                    fetchRequiredData(currentUser, recruitmentId);
                } else {
                    setError("URLから有効な求人IDが取得できませんでした。");
                    setLoading(false);
                }
            } else {
                 router.push('/users/login'); // 求職者ログインページへ
            }
        });
    }, [auth, recruitmentId, router, fetchRequiredData]);

    const handleApply = async () => {
        if (!user || !jobData || !userProfile || hasApplied) return;

        if (!window.confirm(`${jobData.jobTitle} に応募を確定しますか？`)) {
            return;
        }

        setIsApplying(true);
        setError(null);

        try {
            // 1. 応募ドキュメントを作成 (applicants トップレベルコレクションを使用)
            const newApplicantRef = await addDoc(collection(db, 'applicants'), {
                recruitmentId: jobData.id,
                userId: user.uid,
                partnerId: jobData.recruiterId, // 💡 企業IDを保存
                status: 'applied',
                appliedAt: serverTimestamp(),
            } as ApplicantData);
            
            setHasApplied(true);
            alert('応募が完了しました！企業の返信をお待ちください。');
            
            // 2. 通知処理 (ここでは省略)

        } catch (e) {
            console.error("応募処理エラー:", e);
            setError("応募処理中にエラーが発生しました。時間をおいて再試行してください。");
        } finally {
            setIsApplying(false);
        }
    };


    if (loading) return <div className="flex justify-center items-center h-screen"><Loader2 className="animate-spin mr-2" /> 応募データを準備中...</div>;

    if (error) return (
        <div className="p-10 text-center">
            <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h1 className="text-xl font-bold">{error}</h1>
            <Link href="/recruit/jobs" className="mt-4 inline-block text-blue-600 hover:underline">求人リストに戻る</Link>
        </div>
    );
    
    // プロフィールが不完全な場合はエラー表示
    if (!userProfile || !userProfile.desiredAnnualSalary) {
        return (
            <div className="p-10 text-center">
                <AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
                <h1 className="text-xl font-bold">プロフィールが不完全です</h1>
                <p className="mt-2 text-gray-600">応募前に、AIマッチングに必要な**希望給与**を含むプロフィールを完成させてください。</p>
                <Link href="/users/profile" className="mt-4 inline-block px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
                    プロフィールを編集する
                </Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 font-sans">
            <Head>
                <title>応募確認 | {jobData?.jobTitle}</title>
            </Head>

            <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                <Link href={`/recruit/jobs/${jobData?.id}`} className="flex items-center text-sm text-gray-600 hover:text-gray-900 font-semibold mb-6">
                    <RiArrowLeftLine className="w-4 h-4 mr-2" /> 求人詳細に戻る
                </Link>

                <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-200">
                    <h1 className="text-3xl font-bold text-gray-900 mb-6">この求人に応募しますか？</h1>
                    
                    {hasApplied ? (
                        <div className="p-6 bg-green-50 border border-green-300 text-green-700 rounded-lg flex items-center gap-3">
                            <RiCheckboxCircleLine size={32} />
                            <div>
                                <p className="font-bold text-lg">既に応募済みです。</p>
                                <p className="text-sm">企業の返信をお待ちください。</p>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-lg">
                                <h2 className="text-xl font-bold text-indigo-700">{jobData?.jobTitle}</h2>
                                <p className="text-sm text-gray-700 mt-2 flex items-center"><MapPin className="w-4 h-4 mr-1" />{jobData?.location}</p>
                                <p className="text-sm text-gray-700 flex items-center"><JapaneseYen className="w-4 h-4 mr-1" />{jobData?.salaryMin}〜{jobData?.salaryMax}{jobData?.salaryType === '年収' ? '万円' : '円'}</p>
                                <p className="text-sm text-gray-700 flex items-center"><Clock className="w-4 h-4 mr-1" />{jobData?.employmentType}</p>
                            </div>

                            <div className="border-t pt-4">
                                <h3 className="font-bold text-lg text-gray-800 flex items-center mb-3">
                                    <Briefcase className="w-5 h-5 mr-2 text-gray-500" /> 応募情報
                                </h3>
                                <p className="text-sm text-gray-600">以下のプロフィール情報が企業に提供されます。</p>
                                <ul className="mt-3 text-sm space-y-1 p-3 bg-gray-50 rounded-md border">
                                    <li><span className="font-semibold">氏名:</span> {userProfile?.name}</li>
                                    <li><span className="font-semibold">スキル:</span> {userProfile?.skills?.substring(0, 50)}...</li>
                                    <li><span className="font-semibold">自己PR:</span> {userProfile?.selfPR?.substring(0, 50)}...</li>
                                    <li><span className="font-semibold">希望職種:</span> {userProfile?.desiredJobTypes?.join(', ')}</li>
                                </ul>
                            </div>
                            
                            <button
                                onClick={handleApply}
                                disabled={isApplying}
                                className="w-full px-6 py-3 bg-green-600 text-white font-bold rounded-lg flex items-center justify-center gap-2 shadow-md hover:bg-green-700 disabled:bg-gray-400"
                            >
                                {isApplying ? (
                                    <><Loader2 className="animate-spin" /> 応募中...</>
                                ) : (
                                    <><RiSendPlaneFill /> 応募を確定する</>
                                )}
                            </button>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}