// pages/users/dashboard.tsx (最終安全版 - 応募履歴の取得ロジックを修正)

import { useEffect, useState } from 'react';
import { getAuth, onAuthStateChanged, User } from 'firebase/auth';
import { app } from '@/lib/firebase'; // 🚨 パスを確認
import Link from 'next/link';
import Head from 'next/head';
import {
    RiPencilRuler2Line, RiSearchLine, RiFileList3Line, RiLogoutBoxRLine,
    RiArrowRightLine, RiHandHeartLine, RiErrorWarningLine, RiDownloadLine,
    RiUser6Line, RiBriefcase4Line, RiMoneyDollarCircleLine, RiMapPinLine,
    RiTimerLine, RiCheckLine, RiCloseLine, RiSparkling2Line, RiBuilding4Line, RiEditBoxLine
} from 'react-icons/ri';
import { GetServerSideProps, NextPage } from 'next';
import { adminDb, adminAuth } from '@/lib/firebase-admin'; // 🚨 パスを確認
import nookies from 'nookies';
import { Timestamp as AdminTimestamp, FieldPath } from 'firebase-admin/firestore'; 
import { useRouter } from 'next/router';
import { signOut } from "firebase/auth"; 
import React from 'react';
import { Loader2 } from 'lucide-react'; 
import * as admin from 'firebase-admin';

// --- 型定義 (ユーザーダッシュボード用) ---
interface DetailedMatchJob {
    matchId: string; 
    recruitmentId: string;
    score: number;
    reasons: string[];
    jobTitle: string;
    employmentType: string;
    salary: string; 
    location: string;
    companyName: string;
    companyUid: string;
}
interface ContactData {
    id: string; 
    companyName?: string;
    jobTitle?: string;
    contactInfo?: string;
}
interface ApplicationHistory {
    id: string; 
    recruitmentId: string;
    jobTitle: string;
    companyName: string;
    matchStatus: 'applied' | 'accepted' | 'rejected' | 'agreed'; 
    companyFeedback?: string | null; // 💡 nullを許容
    createdAt: string; 
}
interface UserDashboardProps {
    userName: string;
    matches: DetailedMatchJob[];
    contacts: ContactData[];
    history: ApplicationHistory[];
    statusSummary: { applied: number, accepted: number, rejected: number, agreed: number };
    isProfileComplete: boolean;
    error: string | null;
    userProfileData: any; // JSONシリアライズ可能なプロファイルデータ
}

// ----------------------------------------------------------------------
// 💡 UIコンポーネント (ダッシュボードの表示に使用)
// ----------------------------------------------------------------------

const DashboardCard = ({ href, icon, title, description, color }: { href: string; icon: React.ReactNode; title: string; description: string; color: 'indigo' | 'green' | 'red' | 'yellow' | 'purple' | 'blue'; }) => {
    const colorMap: any = {
        indigo: 'bg-indigo-100 text-indigo-600 group-hover:bg-indigo-200',
        green: 'bg-green-100 text-green-600 group-hover:bg-green-200',
        red: 'bg-red-100 text-red-600 group-hover:bg-red-200',
        yellow: 'bg-yellow-100 text-yellow-600 group-hover:bg-yellow-200',
        purple: 'bg-purple-100 text-purple-600 group-hover:bg-purple-200',
        blue: 'bg-blue-100 text-blue-600 group-hover:bg-blue-200',
    };
    
    return (
        <Link href={href} legacyBehavior >
            <a
                className="group block bg-white p-6 rounded-xl shadow-lg border border-gray-100 hover:shadow-2xl hover:border-indigo-400 transition-all cursor-pointer"
            >
                <div className="flex items-start space-x-4">
                    <div className={`p-4 rounded-xl ${colorMap[color]}`}>{icon}</div>
                    <div>
                        <h3 className="text-xl font-bold text-gray-800 group-hover:text-indigo-600">{title}</h3>
                        <p className="text-gray-500 mt-1 text-sm">{description}</p>
                    </div>
                </div>
            </a>
        </Link>
    );
};

const StatusCard = ({ icon, title, count, color, description }: { icon: JSX.Element; title: string; count: number; color: string; description: string }) => (
    <div className={`p-4 rounded-xl shadow-md border ${color}`}>
        <div className="flex items-center space-x-3">
            {icon}
            <p className="text-2xl font-bold">{count}件</p>
        </div>
        <h4 className="text-lg font-semibold mt-1">{title}</h4>
        <p className="text-xs mt-1 text-gray-500">{description}</p>
    </div>
);

const MatchFactor = ({ icon, text }: { icon: JSX.Element; text: string }) => (
    <div className="flex items-center text-sm text-gray-700 bg-gray-100 px-3 py-1 rounded-full">
        {icon}
        <span className="ml-1.5">{text.substring(0, 15)}</span>
    </div>
);

const getHistoryStatusDisplay = (status: ApplicationHistory['matchStatus']) => {
    switch (status) {
        case 'applied': return { text: '企業審査中', color: 'bg-yellow-100 text-yellow-700 border-yellow-300', icon: <RiTimerLine size={16} /> };
        case 'accepted': return { text: '書類選考通過', color: 'bg-blue-100 text-blue-700 border-blue-300', icon: <RiCheckLine size={16} /> };
        case 'rejected': return { text: '見送り', color: 'bg-red-100 text-red-700 border-red-300', icon: <RiCloseLine size={16} /> };
        case 'agreed': return { text: 'マッチ成立', color: 'bg-green-100 text-green-700 border-green-300', icon: <RiHandHeartLine size={16} /> };
        default: return { text: '不明', color: 'bg-gray-100 text-gray-500 border-gray-300', icon: <RiCloseLine size={16} /> };
    }
};

const MatchingGuideModal = ({ onClose }: { onClose: () => void }) => {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
            <div className="bg-white p-8 rounded-xl max-w-xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
                <h2 className="text-2xl font-bold mb-4 flex items-center border-b pb-2 text-indigo-700">
                    <RiSparkling2Line className="mr-2" /> AI求人マッチングの使い方
                </h2>
                <div className="space-y-6 text-gray-700">
                    <p className="font-bold text-lg text-red-600">【重要】マッチングは3つの必須項目と価値観で決定されます。</p>
                    
                    <div className="border border-indigo-200 p-4 rounded-lg bg-indigo-50 space-y-3">
                        <h4 className="text-xl font-semibold text-indigo-800">利用ステップ</h4>
                        <ol className="list-decimal list-inside space-y-3 pl-4 text-sm">
                            <li>
                                <strong>プロフィール登録・編集（必須）</strong>:
                                <ul className='list-disc list-inside ml-4 mt-1 text-gray-600'>
                                    <li>**希望職種、希望給与（上限）、スキル**の3項目を必ず入力してください。</li>
                                    <li>この情報がAIマッチングの実行トリガーとなります。</li>
                                </ul>
                            </li>
                            <li>
                                <strong>AIマッチング求人の確認</strong>:
                                <ul className='list-disc list-inside ml-4 mt-1 text-gray-600'>
                                    <li>ダッシュボードの「AIによるマッチング求人」セクションを確認します。</li>
                                    <li>**80点以上**は特に相性の良い求人です。</li>
                                </ul>
                            </li>
                            <li>
                                <strong>求人詳細と応募</strong>:
                                <ul className='list-disc list-inside ml-4 mt-1 text-gray-600'>
                                    <li>**求人カード内のボタン**から応募（企業にプロフィールを送信）します。</li>
                                </ul>
                            </li>
                            <li>
                                <strong>企業審査中（応募履歴）</strong>:
                                <ul className='list-disc list-inside ml-4 mt-1 text-gray-600'>
                                    <li>企業があなたのプロフィールを確認し、選考を進めます。</li>
                                    <li>応募履歴でステータスを確認できます。</li>
                                </ul>
                            </li>
                            <li>
                                <strong>マッチ成立（連絡先交換）</strong>:
                                <ul className='list-disc list-inside ml-4 mt-1 text-gray-600'>
                                    <li>企業が応募を承認すると、「マッチ成立」となります。</li>
                                    <li>ダッシュボードの**「連絡先交換済み」**セクションに、企業名と連絡先情報が表示されます。</li>
                                </ul>
                            </li>
                        </ol>
                    </div>
                </div>
                <div className="mt-6 flex justify-end">
                    <button onClick={onClose} className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-bold">
                        閉じる
                    </button>
                </div>
            </div>
        </div>
    );
};


// ----------------------------------------------------------------------
// サーバーサイドデータ取得 (getServerSideProps) - 最終安全クエリ
// ----------------------------------------------------------------------
export const getServerSideProps: GetServerSideProps = async (context) => {
    
    const db = adminDb; 
    let currentUserUid: string;

    // 1. 認証チェック
    try {
        const cookies = nookies.get(context);
        const token = await adminAuth.verifySessionCookie(cookies.session || '', true);
        currentUserUid = token.uid;
    } catch (err) {
        return { redirect: { destination: '/users/login', permanent: false } };
    }

    // デフォルトProps
    const defaultProps: UserDashboardProps = {
        userName: 'ゲスト',
        matches: [],
        contacts: [],
        history: [],
        statusSummary: { applied: 0, accepted: 0, rejected: 0, agreed: 0 },
        isProfileComplete: false,
        error: null,
        userProfileData: null,
    };

    try {
        // --- 0. プロフィール完了状態のチェック ---
        const profileSnap = await db.collection('userProfiles').doc(currentUserUid).get();
        const profileExists = profileSnap.exists;
        const profileData = profileSnap.data();
        
        // 💡 JSONシリアライズ可能なデータに変換
        const cleanedProfileData = profileData ? JSON.parse(JSON.stringify({ 
            ...profileData, 
            updatedAt: profileData.updatedAt?.toDate()?.toISOString() || null,
        })) : null;

        defaultProps.userName = profileData?.name || 'ゲスト';
        defaultProps.userProfileData = cleanedProfileData;

        // 🚨 必須チェックロジック（メイン画面表示のトリガー）
        const hasDesiredJobTypes = Array.isArray(profileData?.desiredJobTypes) && profileData.desiredJobTypes.length > 0;
        const hasSkills = !!profileData?.skills && String(profileData.skills).trim() !== '';
        const salaryMax = profileData?.desiredSalaryMax;
        const hasDesiredSalaryMax = salaryMax !== undefined && salaryMax !== null && salaryMax !== '';
        
        const isComplete = profileExists && hasDesiredJobTypes && hasSkills && hasDesiredSalaryMax;
        
        defaultProps.isProfileComplete = !!isComplete;
        
        if (!isComplete) {
            return { props: defaultProps };
        }

        // --- 1. AIマッチング結果 (matchResults) の取得 (最新5件) ---
        const rawMatchQuery = db.collection('matchResults')
            .where('userUid', '==', currentUserUid)
            .orderBy('score', 'desc')
            .limit(5); 
        
        const matchSnap = await rawMatchQuery.get();
        const rawMatches = matchSnap.docs.map((d) => ({
            ...d.data(),
            matchId: d.id,
            recruitmentId: d.data().jobId, 
            score: d.data().score,
            reasons: d.data().matchReasons || [],
            companyUid: d.data().companyUid, 
        }));

        const uniqueRecruitmentIds = new Set<string>();
        rawMatches.forEach(m => {
            if (m.recruitmentId) {
                uniqueRecruitmentIds.add(m.recruitmentId);
            }
        });

        // --- 4. 応募履歴の取得とサマリー計算 (jobApplicants コレクションを使用) ---
        // 🚨 修正: orderBy('createdAt', 'desc') を削除し、単一 where クエリで安全にデータを取得
        const historyQuerySnap = await db.collection('jobApplicants')
            .where('userId', '==', currentUserUid)
            .get(); 
        
        const historyList: ApplicationHistory[] = [];
        const summary = { applied: 0, accepted: 0, rejected: 0, agreed: 0 };
        
        // 応募履歴の求人IDを収集し、重複を避ける
        historyQuerySnap.docs.forEach(doc => {
            if (doc.data().recruitmentId) {
                uniqueRecruitmentIds.add(doc.data().recruitmentId);
            }
        });
        const recruitmentIds = Array.from(uniqueRecruitmentIds);

        // --- 2. 関連する求人情報と企業情報を結合して取得 (チャンク処理) ---
        const recruitmentMap = new Map();
        const companyUids = new Set<string>();
        
        if (recruitmentIds.length > 0) {
            for (let i = 0; i < recruitmentIds.length; i += 10) {
                const chunkIds = recruitmentIds.slice(i, i + 10);
                const jobQuery = db.collection('recruitments').where(FieldPath.documentId(), 'in', chunkIds);
                const jobSnap = await jobQuery.get();
                jobSnap.docs.forEach(doc => {
                     if (doc.exists && doc.data()?.uid) {
                         recruitmentMap.set(doc.id, doc.data());
                         companyUids.add(doc.data().uid);
                     }
                });
            }
        }
        
        const companyMap = new Map();
        const companyUidArray = Array.from(companyUids);
          if (companyUidArray.length > 0) {
              for (let i = 0; i < companyUidArray.length; i += 10) {
                 const chunkIds = companyUidArray.slice(i, i + 10);
                 const companyQuery = db.collection('recruiters').where(FieldPath.documentId(), 'in', chunkIds);
                 const companySnap = await companyQuery.get();
                 companySnap.docs.forEach(doc => {
                     if (doc.exists && doc.data()) {
                         companyMap.set(doc.id, doc.data());
                     }
                 });
              }
         }
        
        // --- 3. 統合データの構築 (マッチング) ---
        const detailedMatches: DetailedMatchJob[] = rawMatches.reduce((acc: DetailedMatchJob[], raw) => {
            const job = recruitmentMap.get(raw.recruitmentId);
            if (!job) return acc; 
            
            const company = companyMap.get(job.uid) || {};
            const salaryText = `${job.salaryType || '年収'} ${job.salaryMin || '???'}${job.salaryType === '年収' ? '万円' : '円'}〜${job.salaryMax || '???'}${job.salaryType === '年収' ? '万円' : '円'}`;
            
            acc.push({
                matchId: raw.matchId, 
                recruitmentId: raw.recruitmentId, 
                score: raw.score || 0,
                reasons: raw.reasons?.slice(0, 3) || [], 
                jobTitle: job.jobTitle || 'タイトル未設定',
                employmentType: job.employmentType || '未設定', 
                salary: salaryText, 
                location: job.location || '不明',
                companyName: company.companyName || '企業名非公開',
                companyUid: job.uid, // 💡 企業UIDをセット
            } as DetailedMatchJob);
            return acc;
        }, []); 
        
        defaultProps.matches = detailedMatches;

        // --- 4. 応募履歴データの構築 ---
        for (const doc of historyQuerySnap.docs) {
            const data = doc.data();
            const status = data.matchStatus as ApplicationHistory['matchStatus'];
            
            if (status) {
                if (status === 'applied') summary.applied++;
                if (status === 'accepted') summary.accepted++;
                if (status === 'rejected') summary.rejected++;
                if (status === 'agreed') summary.agreed++;
            }
            
            const job = recruitmentMap.get(data.recruitmentId);
            const createdAtTimestamp = data.createdAt as AdminTimestamp; 
            
            historyList.push({
                id: doc.id,
                recruitmentId: data.recruitmentId,
                jobTitle: job?.jobTitle || data.jobTitle || 'タイトル不明',
                companyName: companyMap.get(job?.uid)?.companyName || data.companyName || '企業名不明',
                matchStatus: status || 'applied', // 応募ステータスがない場合は applied
                // 💡 修正: companyFeedbackが undefined の場合に null に変換
                companyFeedback: (data.companyFeedback === undefined || data.companyFeedback === null) ? null : data.companyFeedback, 
                createdAt: createdAtTimestamp ? createdAtTimestamp.toDate().toLocaleDateString('ja-JP') : '不明'
            });
        }
        
        // 💡 JavaScriptでソート（DBクエリを避けるため）
        historyList.sort((a, b) => {
            const dateA = new Date(a.createdAt).getTime();
            const dateB = new Date(b.createdAt).getTime();
            return dateB - dateA; 
        });

        defaultProps.statusSummary = summary;
        defaultProps.history = historyList;

        // --- 5. 双方承諾済み (contacts) の抽出 ---
        const contactsList = historyList.filter(h => h.matchStatus === 'agreed').map(h => ({
            id: h.id, 
            companyName: h.companyName, 
            jobTitle: h.jobTitle, 
            contactInfo: profileData?.phoneNumber || profileData?.email || '連絡先情報なし' 
        }));
        defaultProps.contacts = contactsList;
        
        return { props: defaultProps };


    } catch (err) {
        console.error("User Dashboard SSR Error:", err);
        const errMessage = err instanceof Error ? err.message : "不明なエラー";
        defaultProps.error = `データ取得中にエラーが発生しました: ${errMessage}。インデックスまたはセキュリティルールを確認してください。`;
        return { props: defaultProps };
    }
};


// ----------------------------------------------------------------------
// 💡 メインコンポーネント (UI)
// ----------------------------------------------------------------------
const UserDashboard: NextPage<UserDashboardProps> = (props) => {
    const { 
        userName, 
        matches, 
        contacts, 
        history, 
        statusSummary, 
        isProfileComplete, 
        error,
        userProfileData
    } = props;

    const router = useRouter();
    const auth = getAuth(app);
    const [loading, setLoading] = useState(true);
    const [isApplying, setIsApplying] = useState(false); 
    const [applyMessage, setApplyMessage] = useState<string | null>(null); 
    const [showGuide, setShowGuide] = useState(false); 

    useEffect(() => {
        const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
            setLoading(false);
            if (!currentUser) {
                router.replace('/users/login');
            }
        });
        return () => unsubscribeAuth();
    }, [auth, router]);

    const handleLogout = async () => {
        await signOut(auth);
        await fetch('/api/auth/sessionLogout', { method: 'POST' }); 
        router.push('/users/login');
    };

    // 💡 応募処理ロジック (ダッシュボード内で完結)
    const handleApply = async (jobId: string, companyUid: string) => {
        if (isApplying || !auth.currentUser || !userProfileData) return;

        setIsApplying(true);
        setApplyMessage(null);

        const jobDetail = matches.find(m => m.recruitmentId === jobId);
        if (!jobDetail) {
             setApplyMessage('❌ 応募に必要な求人データが見つかりません。');
             setIsApplying(false);
             return;
        }

        try {
            const response = await fetch('/api/match', { 
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    userProfile: userProfileData,
                    job: { id: jobId, jobTitle: jobDetail.jobTitle, companyUid: companyUid }, 
                    companyUid: companyUid,
                }),
            });
            
            const data = await response.json();

            if (!response.ok || data.error) {
                throw new Error(data.error || '応募処理が失敗しました。');
            }
            
            const score = data.matchScore || 'N/A';
            setApplyMessage(`✅ 応募完了！スコア: ${score}点。応募履歴を確認してください。`);
            router.replace(router.asPath); // 画面をリフレッシュして応募履歴を更新
        } catch (error: any) {
            setApplyMessage(`❌ 応募処理エラー: ${error.message}`);
            console.error('Apply error:', error);
        } finally {
            setIsApplying(false);
        }
    };


    // --- ローディング/エラー/未認証時の表示 ---
    if (loading) {
        return <div className="min-h-screen bg-gray-50 flex justify-center items-center"><Loader2 className="animate-spin text-indigo-600 mr-3" size={32} /> 認証情報を確認中...</div>;
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-50 font-sans p-6">
                <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4" role="alert">
                    <p className="font-bold">重大なエラー</p>
                    <p className="mt-2 text-sm">{error}</p>
                </div>
            </div>
        );
    }
    
    // ⚠️ プロフィール不完全時の UI (ここは維持)
    if (!isProfileComplete) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
                <div className="bg-white p-8 rounded-xl shadow-2xl text-center max-w-lg">
                    <RiUser6Line size={48} className="text-red-500 mx-auto mb-4" />
                    
                    <h1 className="text-2xl font-bold text-gray-900 mb-4">プロフィール登録が完了していません</h1>
                    
                    <p className="text-gray-700 mb-6">
                        AIマッチング機能を開始するには、**希望職種、給与、スキル、そして価値観**の設定が必要です。
                    </p>
                    
                    <Link href="/users/profile" legacyBehavior>
                        <a className="group block bg-white p-4 rounded-xl shadow-lg border border-gray-100 hover:shadow-2xl hover:border-indigo-400 transition-all cursor-pointer">
                            <div className="flex items-center justify-center space-x-4">
                                <div className="p-3 rounded-xl bg-red-100 text-red-600"><RiEditBoxLine size={24} /></div>
                                <div><h3 className="text-xl font-bold text-gray-800 group-hover:text-indigo-600">プロフィールを登録・編集</h3><p className="text-gray-500 mt-1 text-sm">こちらから必須情報を入力してください。</p></div>
                            </div>
                        </a>
                    </Link>

                    <p className="text-sm text-gray-500 mt-4">（企業マッチングはこの入力情報に基づいて行われます）</p>

                    <button onClick={handleLogout} className="flex items-center space-x-2 text-sm text-red-600 hover:bg-red-100 p-2 rounded-xl mx-auto mt-4">
                        <RiLogoutBoxRLine size={20} /><span>ログアウト</span>
                    </button>
                </div>
            </div>
        );
    }
    
    // ----------------------------------------------------------------------
    // 💡 メインダッシュボードUI
    // ----------------------------------------------------------------------
    return (
        <div className="min-h-screen bg-gray-50 font-sans">
            <Head><title>{`${userName}さんのダッシュボード｜AI求人マッチング`}</title></Head>

            <header className="bg-white shadow-md sticky top-0 z-10">
                <div className="max-w-6xl mx-auto px-6 py-6 flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-extrabold text-gray-900">マイ ダッシュボード</h1>
                        <p className="text-gray-500 text-sm mt-1">ようこそ、{userName} さん。</p>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="flex items-center space-x-2 text-sm text-red-600 hover:bg-red-600 hover:text-white p-3 rounded-xl bg-red-100 font-semibold shadow-sm"
                    >
                        <RiLogoutBoxRLine size={20} />
                        <span>ログアウト</span>
                    </button>
                </div>
            </header>

            <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">
                
                {/* 1. 応募状況サマリーとアクション */}
                <section>
                    <h2 className="text-2xl font-bold mb-6 border-b pb-2">1. 応募状況サマリーとアクション</h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
                        {/* Status Card 1: 応募済み（合計） */}
                        <StatusCard 
                            icon={<RiFileList3Line size={30} className="text-gray-600" />}
                            title="応募済み（合計）"
                            count={history.length}
                            color="border-gray-300 bg-white"
                            description="全応募の総数です。"
                        />
                         {/* Status Card 2: 企業審査中 */}
                         <StatusCard 
                            icon={<RiTimerLine size={30} className="text-yellow-600" />}
                            title="企業審査中"
                            count={statusSummary.applied}
                            color="border-yellow-300 bg-yellow-50 text-yellow-800"
                            description="企業が選考を進めています。"
                        />
                        {/* Status Card 3: マッチ成立 */}
                        <StatusCard 
                            icon={<RiHandHeartLine size={30} className="text-green-600" />}
                            title="マッチ成立"
                            count={statusSummary.agreed}
                            color="border-green-300 bg-green-50 text-green-800"
                            description="企業と連絡先を交換しました。"
                        />
                        {/* Status Card 4: 企業より見送り */}
                        <StatusCard 
                            icon={<RiCloseLine size={30} className="text-red-600" />}
                            title="企業より見送り"
                            count={statusSummary.rejected}
                            color="border-red-300 bg-red-50 text-red-800"
                            description="残念ながら、選考を見送られました。"
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <DashboardCard
                            href="/users/profile"
                            icon={<RiPencilRuler2Line size={28} />}
                            title="プロフィールを編集"
                            description="希望条件やスキルを更新し、マッチ精度を向上させます"
                            color="indigo"
                        />
                        <DashboardCard 
                            href="/users/match-jobs" // AI推薦求人（60点以上）
                            icon={<RiSearchLine size={28} />} 
                            title="AI推薦求人（60点以上）" 
                            description="AIが選んだ高マッチ度（60点以上）の求人を検索します" 
                            color="green" 
                        />
                        <DashboardCard 
                            href="#history" 
                            icon={<RiFileList3Line size={28} />} 
                            title="応募履歴を確認" 
                            description="企業からの最新の対応状況をチェック" 
                            color="yellow" 
                        />
                         {/* 💡 マッチング使い方ガイドカード */}
                         <div 
                            onClick={() => setShowGuide(true)} 
                            className="group block bg-white p-6 rounded-xl shadow-lg border border-gray-100 hover:shadow-2xl hover:border-purple-400 transition-all cursor-pointer md:col-span-1"
                        >
                            <div className="flex items-start space-x-4">
                                <div className="p-4 rounded-xl bg-purple-100 text-purple-600 group-hover:bg-purple-200"><RiSparkling2Line size={28} /></div>
                                <div>
                                    <h3 className="text-xl font-bold text-gray-800 group-hover:text-purple-600">マッチングの使い方ガイド</h3>
                                    <p className="text-gray-500 mt-1 text-sm">AIマッチングの仕組みと利用フローを確認します</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
                
                <hr className="my-8" />
                
                {/* 2. AIによるマッチング求人（高スコア順） */}
                <section>
                    <h2 className="text-2xl font-bold mb-6 border-b pb-2">2. AIによるマッチング求人 ({matches.length}件)</h2>
                    {applyMessage && (
                         <div className={`p-3 mb-4 rounded-lg text-sm font-semibold ${applyMessage.startsWith('✅') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                            {applyMessage}
                         </div>
                    )}
                    {matches.length === 0 ? (
                        <p className="text-gray-600 p-6 bg-white rounded-xl shadow-sm border border-gray-100">
                            現在、あなたにマッチする求人は見つかっていません。プロフィールを更新してみましょう。
                        </p>
                    ) : (
                        <div className="space-y-6">
                            {matches.map((m) => (
                                <div key={m.matchId} className="bg-white border p-5 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300">
                                    <div className="flex justify-between items-start border-b pb-3 mb-3">
                                        <div>
                                            <h3 className="text-xl font-bold text-indigo-700 hover:underline">{m.jobTitle}</h3>
                                            <p className="text-sm text-gray-500 mt-0.5">{m.companyName} | {m.employmentType}</p>
                                        </div>
                                        <div className={`p-2 rounded-lg text-white font-extrabold text-2xl shadow-md ${m.score >= 80 ? 'bg-green-500' : m.score >= 60 ? 'bg-yellow-500' : 'bg-gray-400'}`}>
                                            {m.score}点
                                        </div>
                                    </div>

                                    <div className="space-y-3 mb-4">
                                        <p className="font-semibold text-gray-700 flex items-center text-sm">
                                            <RiSparkling2Line className="mr-1.5 text-indigo-500" /> AIマッチング理由:
                                        </p>
                                        <ul className="list-disc list-inside space-y-1 text-sm text-gray-600 ml-4">
                                            {m.reasons.length > 0 ? (
                                                m.reasons.map((reason, i) => <li key={i}>{reason}</li>)
                                            ) : (
                                                <li>AIが求人の特徴とあなたのプロフィールを比較しました。</li>
                                            )}
                                        </ul>
                                    </div>

                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                                        <MatchFactor icon={<RiMoneyDollarCircleLine size={14} />} text={m.salary} />
                                        <MatchFactor icon={<RiMapPinLine size={14} />} text={m.location} />
                                        <MatchFactor icon={<RiBriefcase4Line size={14} />} text={m.employmentType} />
                                        <MatchFactor icon={<RiHandHeartLine size={14} />} text={'価値観マッチ'} />
                                    </div>
                                    
                                    {/* 💡 応募ボタンをここに直接配置 */}
                                    <button
                                        onClick={() => handleApply(m.recruitmentId, m.companyUid)}
                                        disabled={isApplying}
                                        className="w-full px-6 py-3 mt-3 text-lg font-bold text-white bg-green-600 rounded-lg shadow-md hover:bg-green-700 disabled:bg-gray-400 transition flex items-center justify-center"
                                    >
                                        {isApplying ? <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> 応募処理中...</> : 'この求人に応募する'}
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </section>
                
                <hr id="history" className="my-8" />

                {/* 3. 応募履歴リスト */}
                <section>
                    <h2 className="text-2xl font-bold mb-6 border-b pb-2">3. 応募した求人の対応状況 ({history.length}件)</h2>
                    <div className="space-y-4">
                        {history.length === 0 ? (
                            <p className="text-gray-600 p-6 bg-white rounded-xl shadow-sm border border-gray-100">まだ応募した求人はありません。</p>
                        ) : (
                            history.slice(0, 5).map((h: ApplicationHistory) => { // 最新5件のみ表示
                                const status = getHistoryStatusDisplay(h.matchStatus);
                                return (
                                    <div key={h.id} className="bg-white p-4 rounded-xl shadow-md border border-gray-100 flex justify-between items-center hover:shadow-lg transition-shadow">
                                        <div>
                                            <p className="text-lg font-bold text-gray-800">{h.jobTitle}</p>
                                            <p className="text-sm text-gray-600">{h.companyName}</p>
                                            <p className="text-xs text-gray-400 mt-1">応募日: {h.createdAt}</p>
                                            {h.matchStatus === 'rejected' && h.companyFeedback && (
                                                <p className="text-xs text-red-500 mt-1">企業フィードバック: {h.companyFeedback}</p>
                                            )}
                                        </div>
                                        
                                        <div className="flex flex-col items-end space-y-2">
                                            <div className={`inline-flex items-center px-3 py-1 text-sm font-semibold rounded-full border ${status.color}`}>
                                                {status.icon} <span className="ml-1">{status.text}</span>
                                            </div>
                                            <Link 
                                                href={`/users/job/${h.recruitmentId}`} 
                                                className="text-sm font-bold text-indigo-600 hover:text-indigo-800 flex items-center"
                                            >
                                                詳細 <RiArrowRightLine className="ml-1" size={16} />
                                            </Link>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                        {history.length > 5 && (
                             <Link href="/users/history" className="mt-4 text-center text-indigo-600 hover:underline font-bold md:col-span-2">
                                全ての応募履歴を見る ({history.length} 件) <RiArrowRightLine className="inline ml-1" />
                            </Link>
                        )}
                    </div>
                </section>

                <hr id="contacts" className="my-8" />

                {/* 4. 連絡先交換済み（マッチ成立） */}
                <section>
                    <h2 className="text-2xl font-bold mb-6 border-b pb-2 flex items-center">
                        <RiHandHeartLine className="text-green-500 mr-2" size={24} />
                        4. 連絡先交換済み（マッチ成立）
                    </h2>
                    <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
                        {contacts.length === 0 ? (
                            <p className="text-gray-600">まだ企業とのマッチングは成立していません。</p>
                        ) : (
                            <div className="space-y-3">
                                {contacts.slice(0, 3).map((c: ContactData) => ( // 最新3件
                                    <div key={c.id} className="p-3 bg-green-50 rounded-lg flex justify-between items-center">
                                        <div>
                                            <p className="font-semibold text-gray-800">{c.companyName || '企業名非公開'}</p>
                                            <p className="text-sm text-gray-600 mb-1">求人タイトル: {c.jobTitle || '未設定'}</p>
                                            <p className="text-sm text-gray-800 font-medium bg-green-100 p-1 rounded">
                                                📞 連絡先: <span className="text-green-700 font-bold">{c.contactInfo}</span>
                                            </p>
                                        </div>
                                        <RiCheckLine size={20} />
                                    </div>
                                ))}
                                {contacts.length > 3 && (
                                    <p className="text-sm text-center text-gray-500">他 {contacts.length - 3} 件...</p>
                                )}
                            </div>
                        )}
                    </div>
                </section>

            </main>

            {/* LINEお問い合わせセクション (リンク修正済み) */}
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-6">
                <section className="mt-6">
                    <div className="bg-white p-6 rounded-lg shadow-lg border border-gray-100 flex items-center justify-between">
                        <div className="flex flex-col">
                            <h2 className="text-lg font-bold text-gray-700 mb-1">LINEよりお問い合わせください。</h2>
                            <p className="text-sm text-gray-500">ご不明な点、操作方法などサポートが必要な際にご利用ください。</p>
                        </div>
                        <div 
                            className="flex-shrink-0"
                            dangerouslySetInnerHTML={{
                                // 💡 新しいリンクに修正済み
                                __html: '<a href="https://lin.ee/pwQDz7Z" target="_blank" rel="noopener noreferrer"><img src="https://scdn.line-apps.com/n/line_add_friends/btn/ja.png" alt="友だち追加" height="36" border="0"></a>'
                            }}
                        />
                    </div>
                </section>
            </div>
            
            {/* フッター操作 (ログアウトボタンのみ) */}
            <footer className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-0 pb-8">
                <section className="mt-6 grid grid-cols-1 gap-4">
                    <button
                        onClick={handleLogout}
                        className="w-full text-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gray-600 hover:bg-gray-700"
                    >
                        ログアウト
                    </button>
                </section>
            </footer>
            
            {/* 💡 マッチングガイドモーダル */}
            {showGuide && <MatchingGuideModal onClose={() => setShowGuide(false)} />}
        </div>
    );
};

export default UserDashboard;