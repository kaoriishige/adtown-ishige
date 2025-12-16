// dashboard.tsx

import { useEffect, useState, useCallback, useMemo } from 'react';
import { getAuth, onAuthStateChanged, signOut } from 'firebase/auth';
import { app } from '@/lib/firebase-client';
import Link from 'next/link';
import Head from 'next/head';
import {
    RiPencilRuler2Line, RiSearchLine, RiFileList3Line, RiLogoutBoxRLine,
    RiArrowRightLine, RiHandHeartLine,
    RiUser6Line, RiBriefcase4Line, RiMoneyDollarCircleLine, RiMapPinLine,
    RiTimerLine, RiCheckLine, RiCloseLine, RiSparkling2Line, RiEditBoxLine,
    RiDeleteBinLine, RiArrowLeftLine
} from 'react-icons/ri';
import { GetServerSideProps, NextPage } from 'next';
import nookies from 'nookies';
import type * as admin from 'firebase-admin';
import { FieldPath } from 'firebase-admin/firestore';
import { useRouter } from 'next/router';
import React from 'react';
import { Loader2 } from 'lucide-react';

// --- 型定義 (省略なし) ---
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
    id: string; // 応募ドキュメントのID
    recruitmentId: string;
    jobTitle: string;
    companyName: string;
    matchStatus: 'applied' | 'accepted' | 'rejected' | 'agreed';
    companyFeedback?: string | null;
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
    userProfileData: any;
    isAuthenticated: boolean;
}

// --- UIコンポーネント (省略) ---
const DashboardCard = React.memo(({ href, icon, title, description, color }: { href: string; icon: React.ReactNode; title: string; description: string; color: 'indigo' | 'green' | 'red' | 'yellow' | 'purple' | 'blue'; }) => {
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
});
DashboardCard.displayName = 'DashboardCard';

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
    // ... (UIコンポーネントのロジックは省略) ...
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
// ★★★ サーバーサイドロジック (求人情報取得デバッグ強化済み) ★★★
// ----------------------------------------------------------------------
export const getServerSideProps: GetServerSideProps = async (context) => {
    
    const { adminDb, adminAuth } = await import('@/lib/firebase-admin');

    const db = adminDb as admin.firestore.Firestore; 
    const auth = adminAuth as admin.auth.Auth;
    
    let currentUserUid: string | null = null;
    
    const cookies = nookies.get(context);
    const sessionCookie = cookies.session || '';

    // Step 0: 認証チェック
    if (!sessionCookie) {
        return { redirect: { destination: '/users/login', permanent: false } };
    }
    
    try {
        const token = await auth.verifySessionCookie(sessionCookie, true);
        currentUserUid = token.uid;
        console.log('--- DASHBOARD FETCH START ---');
        console.log(`User UID: ${currentUserUid}`);

    } catch (err: any) {
        nookies.destroy(context, 'session', { path: '/' }); 
        console.error('AUTH ERROR [DASHBOARD]:', err.message);
        return { redirect: { destination: '/users/login', permanent: false } };
    }
    
    const defaultProps: UserDashboardProps = {
        userName: 'ゲスト',
        matches: [],
        contacts: [],
        history: [],
        statusSummary: { applied: 0, accepted: 0, rejected: 0, agreed: 0 },
        isProfileComplete: false,
        error: null,
        userProfileData: null,
        isAuthenticated: true,
    };
    
    if (!currentUserUid) {
        return { redirect: { destination: '/users/login', permanent: false } };
    }

    try {
        const profileSnap = await db.collection('userProfiles').doc(currentUserUid).get();
        const profileData = profileSnap.data();
        
        const cleanedProfileData = profileData ? JSON.parse(JSON.stringify({ 
            ...profileData, 
            updatedAt: (profileData.updatedAt as admin.firestore.Timestamp)?.toDate()?.toISOString() || null,
        })) : null;

        defaultProps.userName = profileData?.name || 'ゲスト';
        defaultProps.userProfileData = cleanedProfileData;

        // プロフィール必須項目のチェック
        const hasDesiredJobTypes = Array.isArray(profileData?.desiredJobTypes) && profileData.desiredJobTypes.length > 0;
        const hasSkills = !!profileData?.skills && String(profileData.skills).trim() !== '';
        const salaryMax = profileData?.desiredSalaryMax;
        const hasDesiredSalaryMax = salaryMax !== undefined && salaryMax !== null && salaryMax !== '';
        
        const isComplete = profileSnap.exists && hasDesiredJobTypes && hasSkills && hasDesiredSalaryMax;
        
        defaultProps.isProfileComplete = !!isComplete;
        
        if (!isComplete) {
            console.log('Profile is incomplete. Skipping data fetch.');
            return { props: defaultProps };
        }
        
        console.log('Profile complete. Starting data queries...');
        
        // --- データ取得ロジック ---
        
        // 1. 応募履歴の取得と応募済みIDの特定
        const historyQuerySnap = await db.collection('applicants').where('userUid', '==', currentUserUid).get(); 
        console.log(`[applicants] historyQuerySnap size: ${historyQuerySnap.docs.length}件`);
        
        const historyList: ApplicationHistory[] = [];
        const summary = { applied: 0, accepted: 0, rejected: 0, agreed: 0 };
        const uniqueRecruitmentIds = new Set<string>(); 
        const appliedJobIds = new Set<string>(); 

        historyQuerySnap.docs.forEach(doc => {
            const data = doc.data();
            const recruitmentId = data.recruitmentId;
            if (recruitmentId) {
                uniqueRecruitmentIds.add(recruitmentId);
                appliedJobIds.add(recruitmentId); 
            }
        });
        
        // 2. AIマッチング結果の取得と応募済み除外
        const rawMatchQuery = db.collection('matchResults')
            .where('userUid', '==', currentUserUid)
            .orderBy('score', 'desc')
            .limit(5); 
        
        const matchSnap = await rawMatchQuery.get();
        console.log(`[matchResults] matchSnap size (before filter): ${matchSnap.docs.length}件`);
        
        const rawMatches = matchSnap.docs
            .map((d) => ({
                ...d.data(),
                matchId: d.id,
                recruitmentId: d.data().jobId, 
                score: d.data().score,
                reasons: d.data().matchReasons || [],
                companyUid: d.data().companyUid, 
            }))
            .filter(m => !appliedJobIds.has(m.recruitmentId));
            
        console.log(`[matchResults] matchSnap size (after filter): ${rawMatches.length}件`);
            
        rawMatches.forEach(m => {
            if (m.recruitmentId) {
                uniqueRecruitmentIds.add(m.recruitmentId);
            }
        });

        const recruitmentIds = Array.from(uniqueRecruitmentIds);

        // 3. 関連する求人情報と企業情報を結合 (バッチ取得)
        const recruitmentMap = new Map();
        const companyUids = new Set<string>();
        
        if (recruitmentIds.length > 0) {
            console.log(`Fetching ${recruitmentIds.length} recruitments...`);
            
            // ★★★ 追加デバッグロジック: 取得できないIDをチェック ★★★
            const foundRecruitmentIds = new Set<string>();
            
            for (let i = 0; i < recruitmentIds.length; i += 10) {
                const chunkIds = recruitmentIds.slice(i, i + 10);
                const jobQuery = db.collection('recruitments').where(FieldPath.documentId(), 'in', chunkIds);
                const jobSnap = await jobQuery.get();
                
                jobSnap.docs.forEach(doc => {
                    if (doc.exists && doc.data()?.uid) {
                        recruitmentMap.set(doc.id, doc.data());
                        companyUids.add(doc.data().uid);
                        foundRecruitmentIds.add(doc.id); // 取得できたIDを記録
                    }
                });
            }
            
            // 取得できなかったIDをログ出力
            const notFoundIds = recruitmentIds.filter(id => !foundRecruitmentIds.has(id));
            if (notFoundIds.length > 0) {
                 console.error(`!!! CRITICAL WARNING: ${notFoundIds.length} recruitment IDs were not found in 'recruitments' collection. These job(s) will be ignored.`);
                 console.error('MISSING RECRUITMENT IDs:', notFoundIds);
            }
            // ★★★ デバッグロジック終了 ★★★
        }
        
        const companyMap = new Map();
        const companyUidArray = Array.from(companyUids);
        
        if (companyUidArray.length > 0) {
            console.log(`Fetching ${companyUidArray.length} companies...`);
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
        
        // マッチングデータの構築 
        const detailedMatches: DetailedMatchJob[] = rawMatches.reduce((acc: DetailedMatchJob[], raw) => {
            const job = recruitmentMap.get(raw.recruitmentId);
            
            // 求人データが取得できなかった場合はスキップ
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
                companyUid: job.uid, 
            } as DetailedMatchJob);
            return acc;
        }, []); 
        
        defaultProps.matches = detailedMatches; 
        console.log(`Final detailedMatches count: ${detailedMatches.length}件`);

        // 応募履歴データの構築とサマリーの集計
        for (const doc of historyQuerySnap.docs) {
            const data = doc.data();
            const status = (data.status || data.matchStatus || 'applied') as ApplicationHistory['matchStatus'];
            
            if (status === 'agreed') {
                summary.agreed++;
            } else if (status === 'rejected') {
                summary.rejected++;
            } else {
                summary.applied++;
            }
            
            const job = recruitmentMap.get(data.recruitmentId);
            const createdAtTimestamp = data.createdAt as admin.firestore.Timestamp; 
            
            historyList.push({
                id: doc.id, 
                recruitmentId: data.recruitmentId,
                jobTitle: job?.jobTitle || data.jobTitle || 'タイトル不明',
                companyName: companyMap.get(job?.uid)?.companyName || data.companyName || '企業名不明',
                matchStatus: status, 
                companyFeedback: (data.companyFeedback === undefined || data.companyFeedback === null) ? null : data.companyFeedback, 
                createdAt: createdAtTimestamp ? createdAtTimestamp.toDate().toLocaleDateString('ja-JP') : '不明'
            });
        }
        
        historyList.sort((a, b) => {
            const dateA = new Date(a.createdAt).getTime();
            const dateB = new Date(b.createdAt).getTime();
            return dateB - dateA; 
        });

        defaultProps.statusSummary = summary;
        defaultProps.history = historyList;
        console.log('Final status summary:', summary);
        
        // 連絡先交換済みの抽出
        const contactsList = historyList.filter(h => h.matchStatus === 'agreed').map(h => ({
            id: h.id, 
            companyName: h.companyName, 
            jobTitle: h.jobTitle, 
            contactInfo: profileData?.phoneNumber || profileData?.email || '連絡先情報なし' 
        }));
        defaultProps.contacts = contactsList;
        
        console.log('--- DASHBOARD FETCH END ---');

        return { props: defaultProps };

    } catch (err) {
        console.error("User Dashboard Data Fetch Error:", err);
        const errMessage = err instanceof Error ? err.message : "不明なエラー";
        defaultProps.error = `データ取得中にエラーが発生しました: ${errMessage}。インデックスまたはセキュリティルールを確認してください。`;
        defaultProps.isAuthenticated = true; 
        return { props: defaultProps };
    }
};


// ----------------------------------------------------------------------
// 💡 メインコンポーネント (UI - 変更なし)
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
        userProfileData,
        isAuthenticated
    } = props;

    const router = useRouter();
    const auth = useMemo(() => getAuth(app), []);
    
    const [loading, setLoading] = useState(true);
    const [isApplying, setIsApplying] = useState(false); 
    const [isDeleting, setIsDeleting] = useState<string | null>(null); 
    const [isDismissing, setIsDismissing] = useState<string | null>(null); 
    const [applyMessage, setApplyMessage] = useState<string | null>(null); 
    const [showGuide, setShowGuide] = useState(false); 

    useEffect(() => {
        if (isAuthenticated) {
            setLoading(false);
            return;
        }

        const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
            if (currentUser) {
                setLoading(false);
            } else {
                setLoading(false); 
            }
        });
        return () => unsubscribeAuth();
    }, [auth, isAuthenticated]);

    const handleLogout = async () => {
        const confirmLogout = window.confirm("ログアウトしますか？");
        if (!confirmLogout) return;
        
        try {
            await fetch('/api/auth/sessionLogout', { method: 'POST' });
            await signOut(auth);
        } catch (error) {
            console.error('ログアウト処理中にエラーが発生しました:', error);
        } finally {
            router.push('/users/login');
        }
    };

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
            
            const matchToDelete = matches.find(m => m.recruitmentId === jobId)?.matchId;
            if (matchToDelete) {
                fetch('/api/users/deleteMatch', {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ matchId: matchToDelete }),
                }).catch(err => console.error('Auto-dismiss match after apply failed:', err));
            }


            const score = data.matchScore || 'N/A';
            setApplyMessage(`✅ 応募完了！スコア: ${score}点。応募履歴を確認してください。`);
            
            router.replace(router.asPath); 
        } catch (error: any) {
            setApplyMessage(`❌ 応募処理エラー: ${error.message}`); 
            console.error('Apply error:', error);
        } finally {
            setIsApplying(false);
        }
    };

    const handleDismissMatch = async (matchId: string) => {
        if (isDismissing) return;

        if (!window.confirm("このAI推薦求人を見送りますか？リストから削除され、再推薦されることはありません。")) {
            return;
        }

        setIsDismissing(matchId);
        setApplyMessage(null);

        try {
            const response = await fetch('/api/users/deleteMatch', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ matchId: matchId }),
            });

            const data = await response.json();

            if (!response.ok || data.error) {
                throw new Error(data.error || '求人削除処理が失敗しました。');
            }

            setApplyMessage('✅ AI推薦求人を見送りリストから削除しました。');
            router.replace(router.asPath); 

        } catch (error: any) {
            setApplyMessage(`❌ 削除エラー: ${error.message}`); 
            console.error('Dismiss match error:', error);
        } finally {
            setIsDismissing(null);
        }
    };
    
    const handleDeleteApplication = async (applicationId: string) => {
        if (isDeleting) return; 
        if (!window.confirm("本当にこの応募を取り消しますか？この操作は元に戻せません。")) {
            return;
        }

        setIsDeleting(applicationId); 
        setApplyMessage(null); 

        try {
            const response = await fetch('/api/users/deleteApplication', {
                method: 'DELETE', 
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ applicationId: applicationId }),
            });

            const data = await response.json();

            if (!response.ok || data.error) {
                throw new Error(data.error || '削除に失敗しました。');
            }

            setApplyMessage('✅ 応募を削除しました。');
            router.replace(router.asPath); 

        } catch (error: any) {
            setApplyMessage(`❌ 削除エラー: ${error.message}`);
            console.error('Delete error:', error);
        } finally {
            setIsDeleting(null); 
        }
    };


    if (loading) {
        return <div className="min-h-screen bg-gray-50 flex justify-center items-center"><Loader2 className="animate-spin text-indigo-600 mr-3" size={32} /> データ準備中...</div>;
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-50 font-sans p-6">
                <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4" role="alert">
                    <p className="font-bold">データ取得エラー</p>
                    <p className="mt-2 text-sm">{error}</p>
                </div>
            </div>
        );
    }
    
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
                    <Link href="/home" legacyBehavior>
                        <a className="flex items-center space-x-2 text-sm text-gray-600 hover:bg-gray-100 p-2 rounded-xl mx-auto mt-4">
                            <RiArrowLeftLine size={20} /><span>アプリホームへ戻る</span>
                        </a>
                    </Link>
                </div>
            </div>
        );
    }
    
    // --- メインダッシュボードUI ---
    return (
        <div className="min-h-screen bg-gray-50 font-sans">
            <Head><title>{`${userName}さんのダッシュボード｜AI求人マッチング`}</title></Head>

            {showGuide && <MatchingGuideModal onClose={() => setShowGuide(false)} />}

            <header className="bg-white shadow-md sticky top-0 z-10">
                <div className="max-w-6xl mx-auto px-6 py-6 flex justify-between items-center">
                    <Link href="/home" legacyBehavior>
                        <a className="flex items-center space-x-2 text-base text-indigo-600 hover:bg-indigo-50 p-3 rounded-xl font-semibold shadow-sm transition-colors">
                            <RiArrowLeftLine size={20} />
                            <span>アプリホームへ</span>
                        </a>
                    </Link>
                    
                    <div className="text-right">
                        <h1 className="text-3xl font-extrabold text-gray-900">マイ ダッシュボード</h1>
                        <p className="text-gray-500 text-sm mt-1">ようこそ、{userName} さん。</p>
                    </div>
                    
                    <button 
                        onClick={handleLogout} 
                        className="flex items-center space-x-2 text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded-xl transition-colors font-semibold"
                    >
                        <RiLogoutBoxRLine size={20} />
                        <span>ログアウト</span>
                    </button>
                </div>
            </header>

            <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">
                
                {applyMessage && (
                    <div className={`p-4 rounded-lg font-bold text-center shadow-md ${applyMessage.startsWith('✅') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {applyMessage}
                    </div>
                )}
                
                {/* 1. 応募状況サマリーとアクション */}
                <section>
                    <h2 className="text-2xl font-bold mb-6 border-b pb-2">1. 応募状況サマリーとアクション</h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
                        <StatusCard 
                            icon={<RiFileList3Line size={30} className="text-gray-600" />}
                            title="応募済み（合計）"
                            count={history.length}
                            color="border-gray-300 bg-white"
                            description="全応募の総数です。"
                        />
                        <StatusCard 
                            icon={<RiTimerLine size={30} className="text-yellow-600" />}
                            title="企業審査中"
                            count={statusSummary.applied} 
                            color="border-yellow-300 bg-yellow-50 text-yellow-800"
                            description="企業が選考を進めています。"
                        />
                        <StatusCard 
                            icon={<RiHandHeartLine size={30} className="text-green-600" />}
                            title="マッチ成立"
                            count={statusSummary.agreed}
                            color="border-green-300 bg-green-50 text-green-800"
                            description="企業と連絡先を交換しました。"
                        />
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
                            href="/users/match-jobs"
                            icon={<RiSearchLine size={28} />} 
                            title="AI推薦求人（60点以上）" 
                            description="AIが選んだ高マッチ度（60点以上）の求人を検索します" 
                            color="blue"
                        />
                        <div onClick={() => setShowGuide(true)}>
                            <DashboardCard
                                href="#"
                                icon={<RiSparkling2Line size={28} />}
                                title="AIマッチングの使い方"
                                description="AIマッチングの仕組みと利用ステップを確認します"
                                color="yellow"
                            />
                        </div>
                    </div>
                </section>
                
                {/* 2. AIによるマッチング求人（トップ5のみ表示） */}
                <section>
                    <h2 className="text-2xl font-bold mb-6 border-b pb-2">2. AIによるマッチング求人 ({matches.length}件表示中)</h2>
                    <div className="space-y-6">
                        {matches.length === 0 ? (
                            <div className="text-center p-8 bg-white rounded-xl shadow border border-gray-100">
                                <p className="text-lg text-gray-600">現在、あなたのプロフィールにマッチする新しい求人はありません。</p>
                                <p className="text-sm text-gray-500 mt-2">プロフィールを更新するか、新しい求人が追加されるのをお待ちください。</p>
                            </div>
                        ) : (
                            matches.slice(0, 5).map(match => (
                                <div key={match.matchId} className="bg-white p-6 rounded-xl shadow-lg border-l-4 border-indigo-500 flex justify-between items-start space-x-6">
                                    <div>
                                        <div className="flex items-center mb-2">
                                            <span className={`text-xl font-extrabold mr-3 p-1 rounded ${match.score >= 80 ? 'bg-green-500 text-white' : 'bg-indigo-100 text-indigo-600'}`}>{match.score}点</span>
                                            <h3 className="text-xl font-bold text-gray-900">{match.jobTitle}</h3>
                                        </div>
                                        <p className="text-gray-600 mb-3">{match.companyName}</p>
                                        <div className="flex items-center space-x-4 text-sm text-gray-700 mb-3">
                                            <span className="flex items-center"><RiBriefcase4Line className="mr-1.5" />{match.employmentType}</span>
                                            <span className="flex items-center"><RiMoneyDollarCircleLine className="mr-1.5" />{match.salary}</span>
                                            <span className="flex items-center"><RiMapPinLine className="mr-1.5" />{match.location}</span>
                                        </div>
                                        <div className="flex flex-wrap gap-2 mt-3">
                                            {match.reasons.map((reason, index) => (
                                                <MatchFactor key={index} icon={<RiCheckLine size={16} />} text={reason} />
                                            ))}
                                        </div>
                                    </div>
                                    <div className="flex-shrink-0 flex flex-col space-y-2">
                                        <Link href={`/jobs/${match.recruitmentId}`} legacyBehavior>
                                            <a className="px-4 py-2 bg-indigo-600 text-white font-bold rounded-lg text-center hover:bg-indigo-700 transition-colors">詳細を見る</a>
                                        </Link>
                                        <button 
                                            onClick={() => handleApply(match.recruitmentId, match.companyUid)}
                                            disabled={isApplying || !!isDismissing}
                                            className="px-4 py-2 bg-green-500 text-white font-bold rounded-lg text-center hover:bg-green-600 transition-colors disabled:opacity-50"
                                        >
                                            {isApplying ? <Loader2 className="animate-spin" size={20} /> : 'この求人に応募'}
                                        </button>
                                        <button 
                                            onClick={() => handleDismissMatch(match.matchId)}
                                            disabled={isApplying || isDismissing === match.matchId}
                                            className="flex items-center justify-center space-x-1 text-sm text-gray-500 hover:text-red-500 p-2 rounded-lg"
                                        >
                                            <RiDeleteBinLine size={16} />
                                            <span>見送り/非表示</span>
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                        {matches.length > 5 && (
                            <Link href="/users/match-jobs" legacyBehavior>
                                <a className="block text-center p-4 bg-gray-100 text-indigo-600 font-bold rounded-xl hover:bg-gray-200 transition-colors mt-4">
                                    すべてのAI推薦求人を見る ({matches.length}件) <RiArrowRightLine className="inline ml-1" />
                                </a>
                            </Link>
                        )}
                    </div>
                </section>

                {/* 3. 連絡先交換済みの企業 */}
                <section>
                    <h2 className="text-2xl font-bold mb-6 border-b pb-2">3. マッチ成立（連絡先交換済み）</h2>
                    <div className="space-y-4">
                        {contacts.length === 0 ? (
                            <div className="text-center p-8 bg-white rounded-xl shadow border border-gray-100">
                                <p className="text-lg text-gray-600">まだ企業とのマッチ成立（連絡先交換）はありません。</p>
                                <p className="text-sm text-gray-500 mt-2">積極的に応募し、次のステップに進みましょう。</p>
                            </div>
                        ) : (
                            contacts.map(contact => (
                                <div key={contact.id} className="bg-white p-4 rounded-xl shadow border-l-4 border-green-500 flex justify-between items-center">
                                    <div>
                                        <h4 className="text-lg font-bold text-green-700 flex items-center"><RiHandHeartLine className="mr-2" />マッチ成立: {contact.companyName}</h4>
                                        <p className="text-gray-600 text-sm mt-1">{contact.jobTitle} への応募</p>
                                        <p className="text-indigo-600 font-semibold mt-2 break-all">連絡先: {contact.contactInfo || '企業側より提供され次第表示されます'}</p>
                                    </div>
                                    <Link href={`/jobs/${history.find(h => h.id === contact.id)?.recruitmentId}`} legacyBehavior>
                                        <a className="px-4 py-2 bg-gray-200 text-gray-700 font-bold rounded-lg hover:bg-gray-300 transition-colors text-sm">詳細</a>
                                    </Link>
                                </div>
                            ))
                        )}
                    </div>
                </section>

                {/* 4. 応募履歴 */}
                <section>
                    <h2 className="text-2xl font-bold mb-6 border-b pb-2">4. 応募履歴</h2>
                    <div className="space-y-4">
                        {history.length === 0 ? (
                            <div className="text-center p-8 bg-white rounded-xl shadow border border-gray-100">
                                <p className="text-lg text-gray-600">まだ応募履歴はありません。</p>
                                <p className="text-sm text-gray-500 mt-2">AI推薦求人から応募を始めてみましょう。</p>
                            </div>
                        ) : (
                            history.map(app => {
                                const statusDisplay = getHistoryStatusDisplay(app.matchStatus);
                                return (
                                    <div key={app.id} className="bg-white p-4 rounded-xl shadow border-l-4 border-gray-300 flex justify-between items-center">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center space-x-3">
                                                <span className={`px-3 py-1 text-xs font-semibold rounded-full border ${statusDisplay.color} flex items-center`}>
                                                    {statusDisplay.icon}<span className="ml-1">{statusDisplay.text}</span>
                                                </span>
                                                <p className="text-sm text-gray-500">{app.createdAt} 応募</p>
                                            </div>
                                            <h4 className="text-lg font-bold text-gray-800 mt-1 truncate">{app.jobTitle}</h4>
                                            <p className="text-gray-600 text-sm">{app.companyName}</p>
                                            {app.companyFeedback && (
                                                <p className="text-xs text-red-500 mt-1">フィードバック: {app.companyFeedback.substring(0, 50)}...</p>
                                            )}
                                        </div>
                                        <div className="flex-shrink-0 flex items-center space-x-2 ml-4">
                                            <Link href={`/jobs/${app.recruitmentId}`} legacyBehavior>
                                                <a className="px-3 py-1 bg-gray-200 text-gray-700 font-bold rounded-lg hover:bg-gray-300 transition-colors text-sm">求人詳細</a>
                                            </Link>
                                            <button 
                                                onClick={() => handleDeleteApplication(app.id)}
                                                disabled={isDeleting === app.id}
                                                className="flex items-center justify-center space-x-1 text-sm text-gray-500 hover:text-red-500 p-2 rounded-lg disabled:opacity-50"
                                            >
                                                {isDeleting === app.id ? <Loader2 className="animate-spin" size={16} /> : <RiDeleteBinLine size={16} />}
                                            </button>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </section>

            </main>

            <footer className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center text-gray-500 text-sm border-t mt-12">
                <p>&copy; {new Date().getFullYear()} AI Job Matching System. All rights reserved.</p>
            </footer>
        </div>
    );
};

export default UserDashboard;