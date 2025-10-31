import { GetServerSideProps, NextPage } from 'next';
import Link from 'next/link';
import Head from 'next/head';
// 🚨 必要に応じてプロジェクトのパスへ調整してください
import { adminDb, adminAuth } from '@/lib/firebase-admin'; 
import nookies from 'nookies';
import {
    RiBuilding4Line, RiFileList3Line, RiUserSearchLine, RiLogoutBoxRLine,
    RiLayout2Line, RiContactsLine, RiLoader2Line,
    RiAdvertisementLine, RiErrorWarningLine, RiArrowRightLine, RiHandHeartLine,
    RiAwardLine, RiPencilRuler2Line, RiCheckLine, RiHourglassLine, RiEditCircleLine, RiDownloadLine,
    RiBrainLine, RiLightbulbFlashLine, // ★ 有料機能用アイコン
    RiCloseCircleLine, RiAlertFill, RiLoader4Line // ★ 解約モーダル用
} from 'react-icons/ri';
import { useRouter } from 'next/router';
import { signOut, getAuth, onAuthStateChanged } from "firebase/auth"; 
import { app } from "@/lib/firebase"; // 🚨 必要に応じてプロジェクトのパスへ調整
import { useState, useEffect } from 'react';
import React from 'react';

// --- 型定義 ---
interface Candidate {
    id: string;
    name: string;
    age: string | number;
    desiredJob: string;
    skills: string;
    score?: number;
    reasons?: string[];
    contactInfo?: string;
    recruitmentId?: string;
}

export type RecruitmentStatus = 'pending_review' | 'verified' | 'rejected' | 'draft' | 'active' | 'paused';

interface Recruitment {
    id: string;
    title: string;
    status: RecruitmentStatus;
    verificationStatus?: RecruitmentStatus;
    aiFeedback?: string;
    applicantsCount: number;
}

interface DashboardProps {
    companyName: string;
    candidates: Candidate[];
    contacts: Candidate[];
    recruitments: Recruitment[];
    isUserAdPartner: boolean;
    minMatchScore: number;
    profileExists: boolean;
    queryFailed: boolean;
    reviewSummary: { totalJobsCount: number, verified: number, pending: number, rejected: number, activeTotal: number };
    isPaid: boolean; // ★★★ 課金ステータスを追加 ★★★
    partnerData: { // ★★★ 広告パートナーダッシュボードとの互換性のため追加 ★★★
        uid: string;
        companyName: string;
        email: string;
        roles: string[];
        isPaid: boolean;
    };
}

// --- AIMatchingGuide コンポーネント (そのまま) ---
const AIMatchingGuide = ({ show, onClose }: { show: boolean, onClose: () => void }) => {
    if (!show) return null;
    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
            <div className="bg-white p-6 rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
                <h2 className="text-2xl font-bold mb-4 flex items-center border-b pb-2">
                    AIマッチングシステムの詳細な使い方
                </h2>
                <div className="space-y-6 text-gray-700">
                    <p className="font-bold text-lg text-indigo-600">AIは「給与」「職種」「価値観」の3要素でスコアリングします。</p>
                    <div className="border p-4 rounded-lg bg-gray-50">
                        <h4 className="text-xl font-semibold mb-3">📄 企業パートナー向け運用ガイド</h4>
                        <ol className="list-decimal list-inside space-y-2 pl-4 text-sm">
                            <li>Step 1: 企業プロフィール編集でAI許容スコアと企業のアピールポイントを設定し、保存してAI登録審査を申請します。</li>
                            <li>Step 2: 新規求人作成で給与と職種を設定し、AI審査を申請すると、自動で公開されます。</li>
                            <li>Step 3: 全求人一覧を確認してください。</li>
                            <li>Step 4: 応募者リスト確認でAIスコア順に応募者を確認します。</li>
                            <li>Step 5: 意思表示（承諾 or 見送り）を行い、マッチング成立させます。</li>
                            <li>Step 6: マッチ成立した候補者の連絡先はダッシュボード下部に表示されます。</li>
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

// ★★★ DashboardCard コンポーネントを ActionButton (広告ダッシュボード) と同様のロジックに変更 ★★★
interface DashboardCardProps {
    href: string;
    icon: React.ReactNode;
    title: string;
    description: string;
    color: 'indigo' | 'green' | 'red' | 'yellow' | 'purple' | 'blue';
    isPro: boolean; // 有料機能か
    isPaid: boolean; // 支払済みか
    onClick?: (e: React.MouseEvent<HTMLAnchorElement>) => void; // モーダル用
}

const DashboardCard = ({ href, icon, title, description, color, isPro, isPaid, onClick }: DashboardCardProps) => {
    const colorMap: any = {
        indigo: 'bg-indigo-100 text-indigo-600 group-hover:bg-indigo-200',
        green: 'bg-green-100 text-green-600 group-hover:bg-green-200',
        red: 'bg-red-100 text-red-600 group-hover:bg-red-200',
        yellow: 'bg-yellow-100 text-yellow-600 group-hover:bg-yellow-200',
        purple: 'bg-purple-100 text-purple-600 group-hover:bg-purple-200',
        blue: 'bg-blue-100 text-blue-600 group-hover:bg-blue-200',
    };
    
    const isDisabled = isPro && !isPaid;
    // ★ 求人用の課金ページパス (ご自身のプロジェクトに合わせて変更してください)
    const finalHref = isDisabled ? "/recruit/subscribe_plan" : href; 

    const cardContent = (
        <a 
            onClick={onClick}
            className={`group block bg-white p-6 rounded-xl shadow-lg border border-gray-100 transition-all ${
                isDisabled
                ? 'opacity-50 cursor-not-allowed bg-gray-50'
                : 'hover:shadow-2xl hover:border-indigo-400 cursor-pointer'
            }`}
        >
            <div className="flex items-start space-x-4">
                <div className={`p-4 rounded-xl ${colorMap[color]} ${isDisabled ? 'grayscale' : ''}`}>{icon}</div>
                <div>
                    <h3 className={`text-xl font-bold ${isDisabled ? 'text-gray-500' : 'text-gray-800 group-hover:text-indigo-600'}`}>
                        {title}
                        {isPro && (
                            <span className={`ml-2 px-2 py-0.5 text-xs font-semibold rounded-full text-white ${isPaid ? 'bg-green-500' : 'bg-red-500'}`}>
                                {isPaid ? 'ご利用中' : '有料限定'}
                            </span>
                        )}
                    </h3>
                    <p className={`mt-1 text-sm ${isDisabled ? 'text-gray-400' : 'text-gray-500'}`}>{description}</p>
                </div>
            </div>
        </a>
    );
    
    if (onClick) {
        return cardContent; // モーダル用
    }

    return (
        <Link href={finalHref} legacyBehavior>
            {cardContent}
        </Link>
    );
};
// ★★★ DashboardCard 修正ここまで ★★★


// --- RecruitmentCard コンポーネント (そのまま) ---
const RecruitmentCard = ({ recruitment }: { recruitment: Recruitment }) => {
    // ... (既存の RecruitmentCard コードは変更なし) ...
    const getStatusDisplay = (status: RecruitmentStatus) => {
        switch (status) {
            case 'pending_review':
                return { text: '申請中', color: 'bg-yellow-100 text-yellow-700 border-yellow-300' };
            case 'verified':
                return { text: '許可', color: 'bg-green-100 text-green-700 border-green-300' };
            case 'rejected':
                return { text: '編集要請', color: 'bg-red-100 text-red-700 border-red-300' };
            case 'draft':
            case 'active':
            case 'paused':
            default:
                return { text: '下書き', color: 'bg-gray-100 text-gray-500 border-gray-300' };
        }
    };

    const statusDisplay = getStatusDisplay(recruitment.verificationStatus || recruitment.status);

    return (
        <div className="bg-white p-4 rounded-xl shadow-md border border-gray-100 flex justify-between items-start hover:shadow-lg transition-shadow">
            <div>
                <h3 className="text-lg font-bold text-gray-800">{recruitment.title}</h3>
                <div className={`mt-1 inline-block px-2 py-0.5 text-xs font-semibold rounded-full border ${statusDisplay.color}`}>
                    {statusDisplay.text}
                </div>
                {recruitment.verificationStatus === 'rejected' && (
                    <p className="text-xs text-red-500 mt-1 italic">
                        ※ 理由: {recruitment.aiFeedback || '詳細は求人編集画面で確認してください。'}
                    </p>
                )}
                <p className="text-sm text-gray-600 mt-2">応募者数: {recruitment.applicantsCount} 件</p>
            </div>
            
            <Link
                href={`/recruit/jobs/edit?id=${recruitment.id}`}
                className="text-sm font-bold text-indigo-600 hover:text-indigo-800 flex items-center mt-1"
            >
                編集・詳細 <RiPencilRuler2Line className="ml-1" />
            </Link>
        </div>
    );
};

// --- ★★★ getServerSideProps: isPaid と partnerData を追加 ★★★ ---
export const getServerSideProps: GetServerSideProps = async (context) => {
    let queryFailed = false;
    const candidates: Candidate[] = [];
    const contacts: Candidate[] = [];
    let recruitments: Recruitment[] = [];
    const reviewSummary = { totalJobsCount: 0, verified: 0, pending: 0, rejected: 0, activeTotal: 0 };

    try {
        const cookies = nookies.get(context);
        const token = await adminAuth.verifySessionCookie(cookies.session || '', true);
        const { uid } = token;

        const recruiterSnap = await adminDb.collection('recruiters').doc(uid).get();
        const userSnap = await adminDb.collection('users').doc(uid).get();
        if (!userSnap.exists) throw new Error("Company user not found.");

        const userData = userSnap.data()!;
        let companyName = userData.companyName || userData.email || "未設定の会社名";
        let minMatchScore = 60;
        const isUserAdPartner = userData.roles?.includes('adver') || false;
        const profileExists = recruiterSnap.exists;

        // ★★★ isPaid を users コレクションから取得 ★★★
        const isPaid = !!userData.isPaid; 

        if (profileExists) {
            const recruiterData = recruiterSnap.data()!;
            companyName = recruiterData.companyName || companyName;
            minMatchScore = recruiterData.minMatchScore || 60;
        }

        // --- recruitments 取得とサマリー計算 ---
        try {
            const recruitmentsQuery = await adminDb
                .collection('recruitments')
                .where('uid', '==', uid)
                .orderBy('createdAt', 'desc')
                .get();
            
            const applicantsCountPromises: Promise<{ id: string, size: number }>[] = [];
            const allJobs = recruitmentsQuery.docs.map(doc => {
                const r = doc.data();
                const verificationStatus = (r.verificationStatus as RecruitmentStatus) || (r.status as RecruitmentStatus) || 'draft';
                const status = (r.status as RecruitmentStatus) || 'paused';

                if (verificationStatus === 'pending_review') reviewSummary.pending++;
                if (verificationStatus === 'rejected') reviewSummary.rejected++;
                if (verificationStatus === 'verified') {
                    reviewSummary.verified++;
                    if (status === 'active') reviewSummary.activeTotal++;
                }

                applicantsCountPromises.push(
                    adminDb.collection('applicants')
                        .where('recruitmentId', '==', doc.id)
                        .get()
                        .then(snap => ({ id: doc.id, size: snap.size }))
                );

                return {
                    id: doc.id,
                    title: r.jobTitle || 'タイトル未設定',
                    status: status,
                    verificationStatus: verificationStatus,
                    aiFeedback: r.aiFeedback || '',
                    applicantsCount: 0,
                };
            });

            reviewSummary.totalJobsCount = allJobs.length;
            const applicantsCounts = await Promise.all(applicantsCountPromises);
            const applicantsCountMap = new Map(applicantsCounts.map(a => [a.id, a.size]));

            recruitments = allJobs.map(job => ({
                ...job,
                applicantsCount: applicantsCountMap.get(job.id) || 0,
            }));
        } catch (e) {
            console.error("Firestore Recruitments Query Failed:", e);
            queryFailed = true;
        }

        // --- AI推薦候補者 (candidates) 取得 ---
        if (profileExists && isPaid) { // ★ 有料会員のみ候補者を取得
            const candidatesQuery = await adminDb
                .collection('applicants')
                .where('partnerId', '==', uid)
                .where('status', '==', 'applied')
                .limit(5)
                .get();
            // ... (candidates の取得ロジックは変更なし) ...
            for (const doc of candidatesQuery.docs) {
                const app = doc.data();
                const userProfileSnap = await adminDb.collection('userProfiles').doc(app.userId).get();
                
                if (userProfileSnap.exists) {
                    const u = userProfileSnap.data()!;
                    candidates.push({
                        id: app.userId,
                        name: u.name || '匿名ユーザー',
                        age: u.age || '不明',
                        desiredJob: u.desiredJobTypes?.[0] || '未設定',
                        skills: (u.skills && typeof u.skills === 'string') ? (u.skills.substring(0, 50) + (u.skills.length > 50 ? '...' : '')) : 'スキル概要なし',
                        score: app.score || 0,
                        reasons: app.matchReasons || [],
                        recruitmentId: app.recruitmentId,
                    });
                }
            }
        }

        // --- 連絡先交換済み (contacts) 取得 ---
        if (profileExists && isPaid) { // ★ 有料会員のみ連絡先を取得
            const contactsSnap = await adminDb
                .collection('matches')
                .where('companyUid', '==', uid)
                .where('status', '==', 'contact_exchange_complete')
                .get();
            // ... (contacts の取得ロジックは変更なし) ...
            for (const doc of contactsSnap.docs) {
                const m = doc.data();
                const contactUserSnap = await adminDb.collection('userProfiles').doc(m.userUid).get();
                
                if (contactUserSnap.exists) {
                    const u = contactUserSnap.data()!;
                    contacts.push({
                        id: m.userUid,
                        name: u.name || '匿名',
                        age: u.age || '不明',
                        desiredJob: u.desiredJobTypes?.[0] || '未設定',
                        skills: u.skills || '',
                        contactInfo: u.phoneNumber || u.email || '連絡先情報なし',
                    });
                }
            }
        }

        // ★★★ props に isPaid と partnerData を追加 ★★★
        return {
            props: { 
                companyName, 
                candidates, 
                contacts, 
                recruitments, 
                isUserAdPartner, 
                minMatchScore, 
                profileExists, 
                queryFailed, 
                reviewSummary,
                isPaid, // 追加
                partnerData: { // 追加
                    uid: uid,
                    companyName: companyName,
                    email: userData.email || '',
                    roles: userData.roles || [],
                    isPaid: isPaid,
                }
            },
        };
    } catch (error) {
        console.error("Error in recruit/dashboard:", error);
        return { redirect: { destination: '/partner/login', permanent: false } };
    }
};

// --- ★★★ ページ本体 (レイアウト変更、モーダル・案内文追加) ★★★ ---
const RecruitDashboard: NextPage<DashboardProps> = (props) => {
    const { 
        companyName, candidates, contacts, recruitments, isUserAdPartner, 
        minMatchScore, profileExists, queryFailed, reviewSummary, 
        isPaid, partnerData // isPaid と partnerData を受け取る
    } = props;

    const router = useRouter();
    const { payment_status } = router.query;
    const auth = getAuth(app);
    const [showGuide, setShowGuide] = useState(false);
    const [showCancelModal, setShowCancelModal] = useState(false); // ★ 解約モーダル

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (!user && !profileExists) {
                router.replace('/partner/login');
            }
        });
        return () => unsubscribe(); 
    }, [router, auth, profileExists]);
    
    // ★ 決済完了後のトークンリフレッシュ
    useEffect(() => {
        const refresh = async () => {
            await auth.currentUser?.getIdToken(true).catch(e => console.error("Token refresh failed:", e)); 
        };
        if (payment_status === 'success') {
            console.log("Payment Status:", payment_status);
            refresh();
        }
    }, [auth, payment_status]);

    // ★ 解約モーダルを開く
    const handleOpenCancelModal = (e: React.MouseEvent<HTMLAnchorElement>) => {
        e.preventDefault();
        setShowCancelModal(true);
    };

    // CandidateCard (変更なし)
    const CandidateCard = ({ candidate }: { candidate: Candidate }) => (
        <div className="flex justify-between items-center py-3">
            <div>
                <p className="font-semibold text-gray-900">{candidate.name} ({candidate.age})</p>
                <p className="text-xs text-gray-500">希望: {candidate.desiredJob}</p>
                <div className="mt-1">
                    <span className={`text-sm font-bold px-2 py-0.5 rounded ${((candidate.score ?? 0) >= minMatchScore) ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                        AIスコア: {candidate.score ?? 0}点
                    </span>
                </div>
            </div>
            <Link
                href={`/recruit/applicants?recruitmentId=${candidate.recruitmentId}&candidateId=${candidate.id}`}
                className="text-sm font-bold text-indigo-600 hover:text-indigo-800 flex items-center"
            >
                詳細を見る <RiArrowRightLine className="ml-1" />
            </Link>
        </div>
    );

    // プロフィール未登録時の表示 (変更なし)
    if (!profileExists) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
                <div className="bg-white p-8 rounded-xl shadow-2xl text-center max-w-lg">
                    <RiErrorWarningLine size={48} className="text-red-500 mx-auto mb-4" />
                    <h1 className="text-2xl font-bold text-gray-900 mb-4">プロフィール登録が完了していません</h1>
                    <p className="text-gray-700 mb-6">
                        AIマッチング機能を開始するには、企業情報とAIマッチング基準の設定が必要です。
                    </p>
                    <DashboardCard
                        href="/recruit/profile"
                        icon={<RiBuilding4Line size={28} />}
                        title="プロフィールを登録・編集"
                        description="こちらから必須情報を入力してください。"
                        color="red"
                        isPro={false} // プロフ登録は無料
                        isPaid={isPaid}
                    />
                    <button
                        onClick={async () => {
                            await signOut(auth);
                            await fetch('/api/auth/sessionLogout', { method: 'POST' });
                            router.push('/partner/login');
                        }}
                        className="flex items-center space-x-2 text-sm text-red-600 hover:bg-red-800 p-2 rounded-xl mx-auto mt-4"
                    >
                        <RiLogoutBoxRLine size={20} />
                        <span>ログアウト</span>
                    </button>
                </div>
            </div>
        );
    }

    // ★ ログアウト処理
    const handleLogout = async () => {
        await signOut(auth);
        await fetch('/api/auth/sessionLogout', { method: 'POST' });
        router.push('/partner/login');
    };
    
    // サマリーカード (変更なし)
    const ReviewSummaryCard = ({ icon, title, count, color, description }: { icon: JSX.Element, title: string, count: number, color: string, description: string }) => (
        <div className={`p-4 rounded-xl shadow-md border ${color}`}>
            <div className="flex items-center space-x-3">
                {icon}
                <p className="text-2xl font-bold">{count}件</p>
            </div>
            <h4 className="text-lg font-semibold mt-1">{title}</h4>
            <p className="text-xs mt-1 text-gray-500">{description}</p>
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50 font-sans">
            <Head><title>AI求人パートナー ダッシュボード ({isPaid ? '有料会員' : '無料会員'})</title></Head>

            {/* ★★★ 解約確認モーダル (広告パートナーから移植) ★★★ */}
            {showCancelModal && (
                <div 
                    className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
                    onClick={() => setShowCancelModal(false)}
                >
                    <div 
                        className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="p-6 text-center">
                            <div className="flex justify-center mb-4">
                                <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
                                    <RiAlertFill className="h-10 w-10 text-red-600" />
                                </div>
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900 mb-3">本当に解約しますか？</h2>
                            <p className="text-gray-600 mb-6">
                                「解約手続きに進む」ボタンを押すと、サブスクリプションの解約ページに移動します。
                            </p>
                            <div className="flex flex-col sm:flex-row gap-3">
                                <button
                                    onClick={() => setShowCancelModal(false)}
                                    className="w-full px-4 py-3 rounded-lg font-semibold bg-gray-200 text-gray-700 hover:bg-gray-300 transition-colors"
                                >
                                    キャンセル
                                </button>
                                <Link href="/cancel-subscription" legacyBehavior>
                                    <a className="w-full px-4 py-3 rounded-lg font-semibold text-white bg-red-600 hover:bg-red-700 transition-colors text-center">
                                        解約手続きに進む
                                    </a>
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ★★★ ヘッダー (広告パートナーと同様のレイアウトに変更) ★★★ */}
            <header className="bg-white shadow-sm sticky top-0 z-10">
                <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">AI求人パートナー ダッシュボード</h1>
                        <p className="text-sm text-gray-600 mt-1">
                            ようこそ、<span className="font-bold">{companyName}</span> 様 
                            <span className={`ml-2 px-2 py-0.5 text-xs font-semibold rounded-full text-white ${isPaid ? 'bg-indigo-600' : 'bg-gray-500'}`}>
                                {isPaid ? '有料AIプラン' : '無料プラン'}
                            </span>
                        </p>
                    </div>
                    <div className="flex flex-col items-end text-right">
                        <button
                            onClick={handleLogout}
                            className="flex items-center space-x-2 text-sm text-gray-600 hover:text-red-600 p-2 rounded-lg transition-colors font-semibold"
                        >
                            <RiLogoutBoxRLine size={20} />
                            <span>ログアウト</span>
                        </button>
                        <p className="text-xs text-gray-500 mt-1 max-w-xs">
                            ログインは、ブラウザでadtownと検索してホームページから行ってください。
                        </p>
                    </div>
                </div>
            </header>
            
            <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">
                
                {queryFailed && (
                    <div className="p-4 bg-red-100 border-l-4 border-red-500 text-red-800 rounded-lg">
                        <p className="font-bold flex items-center">
                            <RiErrorWarningLine className="mr-2" />
                            データ読み込みエラー: Firestore インデックスが必要な可能性があります
                        </p>
                    </div>
                )}

                {/* ★★★ 有料プラン誘導バナー (isPaid: falseの場合のみ表示) ★★★ */}
                {!isPaid && (
                    <div className="mb-8 p-6 bg-yellow-100 border-4 border-yellow-400 text-yellow-800 rounded-lg shadow-lg text-center">
                        <h2 className="text-2xl font-extrabold text-yellow-900">
                            💡 現在、無料の求人掲載をご利用中です
                        </h2>
                        <p className="mt-2 text-lg">
                            **AIマッチング** と **AIアドバイス** を利用して、採用のミスマッチを防ぎ、コストを削減しましょう！
                        </p>
                        <Link href="/recruit/subscribe_plan" legacyBehavior>
                            {/* ★ 求人用の課金ページパス (ご自身のプロジェクトに合わせて変更してください) */}
                            <a className="inline-block mt-4 bg-orange-600 text-white font-extrabold py-3 px-8 rounded-full shadow-lg hover:bg-orange-700 transition duration-150">
                                有料AIプランに申し込む
                            </a>
                        </Link>
                    </div>
                )}
                
                {/* ★★★ 決済ステータス表示 (広告パートナーから移植) ★★★ */}
                {payment_status === 'success' && isPaid && (
                    <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 rounded-md mb-8">
                        <p className="font-bold">有料AIプランのご登録ありがとうございます！</p>
                        <p>すべての機能がご利用可能になりました。</p>
                    </div>
                )}


                {/* ★★★ 1. 求人管理（複数の求人掲載無料） ★★★ */}
                <section>
                    <h2 className="text-2xl font-bold mb-6 border-b pb-2">1. 求人管理（複数の求人掲載無料）</h2>
                    {/* ★★★ 変更点: カードの順番を変更 ★★★ */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <DashboardCard
                            href="/recruit/profile"
                            icon={<RiBuilding4Line size={28} />}
                            title="企業プロフィールを編集"
                            description="AIマッチングの基準となる会社情報、ロゴを設定します"
                            color="indigo"
                            isPro={false} // 無料
                            isPaid={isPaid}
                        />
                        <DashboardCard
                            href="/recruit/jobs/create" 
                            icon={<RiFileList3Line size={28} />} 
                            title="新しい求人の作成" 
                            description="給与・勤務条件を設定し、AI審査を申請" 
                            color="green"
                            isPro={false} // 無料
                            isPaid={isPaid}
                        />
                        <DashboardCard 
                            href="/recruit/jobs" 
                            icon={<RiLayout2Line size={28} />} 
                            title="全求人一覧を管理" 
                            description="求人の編集・公開設定を変更" 
                            color="blue"
                            isPro={false} // 無料
                            isPaid={isPaid}
                        />
                    </div>
                </section>

                <hr className="my-8" />

                {/* ★★★ 2. AI機能（有料） ★★★ */}
                <section>
                    <h2 className="text-2xl font-bold mb-6 border-b pb-2">2. AI機能（有料）</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <DashboardCard 
                            href="/recruit/applicants"
                            icon={<RiUserSearchLine size={28} />} 
                            title="AIマッチング候補者リスト"
                            description="AIが推薦するマッチ度の高い応募者を確認します"
                            color="yellow"
                            isPro={true} // 有料
                            isPaid={isPaid}
                        />
                        <DashboardCard 
                            href="/recruit/advice" // ★ 仮のパス
                            icon={<RiLightbulbFlashLine size={28} />} 
                            title="AI求人アドバイス" 
                            description="AIが求人票を分析し、改善点を提案します" 
                            color="purple"
                            isPro={true} // 有料
                            isPaid={isPaid}
                        />
                        <DashboardCard 
                            href="/recruit/export-contacts"
                            icon={<RiDownloadLine size={28} />} 
                            title="連絡先CSVダウンロード" 
                            description="マッチングが成立した候補者の連絡先を一覧で出力します" 
                            color="green"
                            isPro={true} // 有料
                            isPaid={isPaid}
                        />
                    </div>
                </section>
                
                <hr className="my-8" />

                {/* ★★★ 3. 応募・審査状況 ★★★ */}
                <section>
                    <h2 className="text-2xl font-bold mb-6 border-b pb-2">3. 応募・審査状況</h2>
                    
                    {/* サマリー */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                        <ReviewSummaryCard
                            icon={<RiCheckLine size={30} className="text-green-600" />}
                            title="審査承認済 (公開可能)"
                            count={reviewSummary.verified}
                            color="border-green-300 bg-green-50 text-green-800"
                            description={`現在公開中の求人: ${reviewSummary.activeTotal} 件`}
                        />
                        <ReviewSummaryCard
                            icon={<RiHourglassLine size={30} className="text-yellow-600" />}
                            title="AI審査中"
                            count={reviewSummary.pending}
                            color="border-yellow-300 bg-yellow-50 text-yellow-800"
                            description="AIが求人内容をスコアリングしています。"
                        />
                        <ReviewSummaryCard
                            icon={<RiEditCircleLine size={30} className="text-red-600" />}
                            title="修正要請 / 却下"
                            count={reviewSummary.rejected}
                            color="border-red-300 bg-red-50 text-red-800"
                            description="AIが指摘した箇所を編集し、再申請が必要です。"
                        />
                        <div onClick={() => setShowGuide(true)} className="group cursor-pointer p-4 rounded-xl shadow-md border border-gray-100 bg-white hover:bg-indigo-50 transition-colors">
                            <RiAwardLine size={30} className="text-indigo-600" />
                            <h4 className="text-lg font-semibold mt-1 text-indigo-700">AIマッチングガイド</h4>
                            <p className="text-xs mt-1 text-gray-500">システムの仕組みと運用フローを確認</p>
                        </div>
                    </div>

                    {/* 個別求人ステータス */}
                    <h3 className="text-xl font-bold mb-4">個別求人ステータス（最新の審査状況）</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {recruitments.length === 0 && !queryFailed ? (
                            <div className="p-6 bg-white rounded-xl shadow-lg border border-gray-100 md:col-span-2">
                                <p className="text-gray-600">まだ求人は登録されていません。「新しい求人の作成」から始めましょう。</p>
                            </div>
                        ) : (
                            recruitments.slice(0, 4).map((r) => <RecruitmentCard key={r.id} recruitment={r} />)
                        )}
                        {recruitments.length > 4 && (
                            <Link href="/recruit/jobs" className="mt-4 text-center text-indigo-600 hover:underline font-bold md:col-span-2">
                                全ての求人を見る ({recruitments.length} 件) <RiArrowRightLine className="inline ml-1" />
                            </Link>
                        )}
                    </div>
                </section>
                
                <hr className="my-8" />
                
                {/* ★★★ 4. アカウント管理 (解約ボタン) ★★★ */}
                <section>
                    <h2 className="text-2xl font-bold mb-6 border-b pb-2">4. アカウント管理</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {isPaid && (
                             <DashboardCard
                                href="/cancel-subscription" // hrefはダミー
                                icon={<RiCloseCircleLine size={28} />}
                                title="サブスクリプションの解約"
                                description="有料AIプランの自動更新を停止（解約）します"
                                color="red"
                                isPro={true} // 有料会員専用
                                isPaid={isPaid}
                                onClick={handleOpenCancelModal} // モーダルを開く
                            />
                        )}
                        {/* 広告パートナーでない場合のみ表示 */}
                        {!isUserAdPartner && (
                            <DashboardCard 
                                href="/partner/ad-subscribe" // 広告パートナー登録LPへ
                                icon={<RiAdvertisementLine size={28} />} 
                                title="広告掲載パートナーになる" 
                                description="集客AIやクーポン機能も利用する" 
                                color="purple"
                                isPro={false} // これは別サービスへの誘導
                                isPaid={isPaid}
                            />
                        )}
                    </div>
                </section>

                {/* 5. 応募者とマッチングの管理 (有料機能なのでisPaidでラップ) */}
                {isPaid && (
                    <section>
                        <h2 className="text-2xl font-bold mb-6 border-b pb-2">5. マッチング結果（有料）</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
                               <h3 className="text-xl font-bold mb-4 flex items-center">
                                   <RiUserSearchLine className="mr-2 text-yellow-600" size={24} />
                                   AI推薦候補者リスト (最新5件)
                               </h3>
                               {candidates.length === 0 ? (
                                   <p className="text-gray-600">現在、新しい応募者はいません。</p>
                               ) : (
                                   <div className="divide-y divide-gray-100">
                                       {candidates.map((c) => (<CandidateCard key={c.id} candidate={c} />))}
                                   </div>
                               )}
                               <Link href="/recruit/applicants" className="mt-4 block text-center text-indigo-600 hover:underline text-sm font-bold">
                                   全応募者リストを見る
                               </Link>
                            </div>

                            <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
                                <h3 className="text-xl font-bold mb-4 flex items-center">
                                    <RiContactsLine className="mr-2 text-blue-600" size={24} />
                                    連絡先交換済みリスト ({contacts.length}件)
                                </h3>
                                {contacts.length === 0 ? (
                                    <p className="text-gray-600">まだマッチングが成立した候補者はいません。</p>
                                ) : (
                                    <div className="space-y-3">
                                        {contacts.slice(0, 3).map((c) => (
                                            <div key={c.id} className="p-3 bg-blue-50 rounded-lg flex justify-between items-center">
                                                <div>
                                                    <p className="font-semibold text-gray-900">{c.name} 様</p>
                                                    <p className="text-xs text-gray-600">連絡先: {c.contactInfo}</p>
                                                </div>
                                                <RiCheckLine className="text-blue-500" size={20} />
                                            </div>
                                        ))}
                                        {contacts.length > 3 && (
                                            <p className="text-sm text-center text-gray-500">他 {contacts.length - 3} 件...</p>
                                        )}
                                    </div>
                                )}
                                <Link 
                                    href="/recruit/export-contacts"
                                    className="mt-4 block text-center text-green-600 hover:underline text-sm font-bold"
                                >
                                    <RiDownloadLine className="inline mr-1" /> 連絡先CSVをダウンロード
                                </Link>
                            </div>
                        </div>
                    </section>
                )}
            </main>
            
            {/* ★★★ フッター（広告パートナーと同様のレイアウトに変更） ★★★ */}
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
                                __html: '<a href="https://lin.ee/aMc9H5W" target="_blank" rel="noopener noreferrer"><img src="https://scdn.line-apps.com/n/line_add_friends/btn/ja.png" alt="友だち追加" height="36" border="0"></a>'
                            }}
                        />
                    </div>
                </section>
            </div>

            <AIMatchingGuide show={showGuide} onClose={() => setShowGuide(false)} />

            <footer className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-0 pb-8">
                <section className="mt-6 grid grid-cols-1 gap-4">
                    <button
                        onClick={handleLogout}
                        className="w-full text-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gray-600 hover:bg-gray-700"
                    >
                        ログアウト
                    </button>
                    <p className="text-xs text-gray-500 mt-2 text-center">
                        ログインは、ブラウザでadtownと検索してホームページから行ってください。
                    </p>
                </section>
            </footer>
        </div>
    );
};

export default RecruitDashboard;



















