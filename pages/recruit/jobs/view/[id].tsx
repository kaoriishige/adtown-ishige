import { GetServerSideProps, NextPage } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { adminDb, adminAuth } from '@/lib/firebase-admin'; 
import nookies from 'nookies';
import {
    RiCheckLine, RiHourglassLine, RiErrorWarningLine, RiHeartFill,
    RiImageEditLine, 
} from 'react-icons/ri';
import {
    Briefcase, Sparkles, JapaneseYen, MapPin, Laptop, Send, Clock, Tag, UserCheck,
    CalendarDays, Building, HeartHandshake, Camera, Video, ArrowLeft,
    AlertTriangle, TrendingUp, MessageSquare
} from 'lucide-react'; 
import React from 'react';

// =================================================================================
// --- 型定義の統合 ---
// =================================================================================
type VerificationStatus = 'unverified' | 'pending_review' | 'verified' | 'rejected';
export type RecruitmentStatus = 'pending_review' | 'verified' | 'rejected' | 'draft' | 'active' | 'paused' | 'paused_by_user'; 

interface CompanyProfileView {
    companyName: string;
    address: string;
    website: string;
    ourMission: string;
    whatWeDo: string;
    ourCulture: string;
    messageToCandidates: string;
    galleryImageUrls: string[];
    videoUrl: string;
    minMatchScore: number;
    profileVerificationStatus: VerificationStatus;
    profileAiFeedback: string;
    appealPoints_company: {
        atmosphere: string[];
        organization: string[];
    };
}

interface JobDataView {
    id: string;
    jobTitle: string;
    employmentType: string;
    jobCategory: string;
    salaryType: string;
    salaryMin: number;
    salaryMax: number;
    location: string;
    workingHours: string;
    remotePolicy: string;
    requiredSkills: string;
    welcomeSkills: string;
    jobDescription: string;
    hiringBackground: string;
    idealCandidate: string;
    salaryStructure: string;
    paidLeaveSystem: string;
    workingDays: string[];
    verificationStatus: RecruitmentStatus;
    aiFeedback: string;
    appealPoints_job: {
        growth: string[];
        wlb: string[];
        benefits: string[];
        atmosphere: string[];
        organization: string[];
    };
}

interface ViewPageProps {
    jobData: JobDataView | null;
    profileData: CompanyProfileView | null;
    error: string | null;
    isRecruiter: boolean;
}

// =================================================================================
// --- サーバーサイドデータ取得 ---
// =================================================================================
export const getServerSideProps: GetServerSideProps<ViewPageProps> = async (context) => {
    const { id } = context.query;

    if (typeof id !== 'string') {
        return { props: { jobData: null, profileData: null, error: "無効な求人IDです。", isRecruiter: false } };
    }

    let isRecruiter = false;
    let uid: string | null = null;
    let jobData: JobDataView | null = null;
    let profileData: CompanyProfileView | null = null;

    // 1. 認証チェック
    try {
        const cookies = nookies.get(context);
        const token = await adminAuth.verifySessionCookie(cookies.session || '', true);
        uid = token.uid;
        
        const userSnap = await adminDb.collection('users').doc(uid!).get();
        const userData = userSnap.data();
        
        // userSnap.exists はプロパティとして使用
        if (userSnap.exists) { 
            if (userData?.roles?.includes('recruit')) {
                isRecruiter = true;
            }
        }
    } catch (e) {
        isRecruiter = false;
    }
    
    // 2. 求人データ取得
    try {
        const jobDoc = await adminDb.collection('recruitments').doc(id).get();

        // jobDoc.exists はプロパティとして使用
        if (!jobDoc.exists) {
            return { props: { jobData: null, profileData: null, error: "指定された求人は見つかりませんでした。", isRecruiter } };
        }

        const data = jobDoc.data()!;
        uid = data.uid || uid; 
        const verificationStatus: RecruitmentStatus = (data.verificationStatus as RecruitmentStatus) || (data.status as RecruitmentStatus) || 'draft';

        // 企業パートナーでない場合、'verified' または 'active' の求人のみ公開
        if (!isRecruiter && verificationStatus !== 'verified' && data.status !== 'active') {
             return { props: { jobData: null, profileData: null, error: "この求人は公開されていません。", isRecruiter } };
        }

        jobData = {
            id: jobDoc.id,
            jobTitle: data.jobTitle || 'タイトル未設定',
            employmentType: data.employmentType || '正社員',
            jobCategory: data.jobCategory || '未設定',
            salaryType: data.salaryType || '年収',
            salaryMin: Number(data.salaryMin) || 0, 
            salaryMax: Number(data.salaryMax) || 0, 
            location: data.location || '勤務地未定',
            workingHours: data.workingHours || '未設定',
            remotePolicy: data.remotePolicy || 'no',
            requiredSkills: data.requiredSkills || '特になし',
            welcomeSkills: data.welcomeSkills || '特になし',
            jobDescription: data.jobDescription || '詳細な職務内容は記載されていません。',
            hiringBackground: data.hiringBackground || '未設定',
            idealCandidate: data.idealCandidate || '未設定',
            salaryStructure: data.salaryStructure || '未設定',
            paidLeaveSystem: data.paidLeaveSystem || '未設定',
            workingDays: data.workingDays || [],
            verificationStatus: verificationStatus,
            aiFeedback: data.aiFeedback || '',
            appealPoints_job: {
                growth: data.appealPoints?.growth || [],
                wlb: data.appealPoints?.wlb || [],
                benefits: data.appealPoints?.benefits || [],
                atmosphere: data.appealPoints?.atmosphere || [],
                organization: data.appealPoints?.organization || [],
            },
        };
    } catch (e) {
        console.error("Error fetching job data:", e);
        return { props: { jobData: null, profileData: null, error: "求人データの読み込み中にエラーが発生しました。", isRecruiter } };
    }

    // 3. 企業プロフィールデータ取得 (uidがわかっている場合)
    if (uid) {
        try {
            const userSnap = await adminDb.collection('users').doc(uid).get();
            
            // userSnap.exists はプロパティとして使用
            if (userSnap.exists) { 
                const data = userSnap.data()!;
                profileData = {
                    companyName: data.companyName || data.storeName || '企業名未設定',
                    address: data.address || '未設定',
                    website: data.website || '未設定',
                    ourMission: data.ourMission || '未設定',
                    whatWeDo: data.whatWeDo || '未設定',
                    ourCulture: data.ourCulture || '未設定',
                    messageToCandidates: data.messageToCandidates || '未設定',
                    galleryImageUrls: data.galleryImageUrls || [],
                    videoUrl: data.videoUrl || '',
                    minMatchScore: data.minMatchScore || 60,
                    profileVerificationStatus: data.verificationStatus || 'unverified',
                    profileAiFeedback: data.aiFeedback || '',
                    appealPoints_company: {
                        atmosphere: data.appealPoints?.atmosphere || [],
                        organization: data.appealPoints?.organization || [],
                    }
                };
            }
        } catch (e) {
            console.error("Error fetching profile data:", e);
        }
    }

    return { props: { jobData, profileData, error: null, isRecruiter } };
};

// =================================================================================
// --- ユーティリティ & ヘルパー関数 ---
// =================================================================================

/**
 * YouTubeの標準URL、短縮URL、埋め込みURLから動画IDを抽出し、埋め込み可能なURLを生成する。
 */
const getYouTubeEmbedUrl = (url: string) => {
    if (!url) return '';

    const watchRegex = /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})(?:.+)?/i;
    const match = url.match(watchRegex);

    if (match && match[1]) {
        const videoId = match[1];
        return `https://www.youtube.com/embed/${videoId}?rel=0`;
    }

    return url;
};


const StatusBadge = ({ status }: { status: RecruitmentStatus }) => {
    switch (status) {
        case 'verified':
            return <span className="inline-flex items-center px-3 py-1 text-sm font-semibold rounded-full bg-green-100 text-green-800"><RiCheckLine className="mr-1" /> 承認済み・公開中</span>;
        case 'pending_review':
            return <span className="inline-flex items-center px-3 py-1 text-sm font-semibold rounded-full bg-yellow-100 text-yellow-800"><RiHourglassLine className="mr-1" /> AI審査中</span>;
        case 'rejected':
            return <span className="inline-flex items-center px-3 py-1 text-sm font-semibold rounded-full bg-red-100 text-red-800"><RiErrorWarningLine className="mr-1" /> 修正要請/非公開</span>;
        default:
            return <span className="inline-flex items-center px-3 py-1 text-sm font-semibold rounded-full bg-gray-100 text-gray-800">下書き/停止中</span>;
    }
};

const SectionTitle = ({ icon: Icon, title }: { icon: React.ElementType, title: string }) => (
    <h2 className="text-2xl font-bold text-gray-800 border-b pb-2 mb-4 flex items-center">
        <Icon className="w-6 h-6 mr-3 text-indigo-600" />
        {title}
    </h2>
);

const DetailItem = ({ icon: Icon, label, value }: { icon: React.ElementType, label: string, value: string | number }) => (
    <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
        <p className="text-sm font-medium text-gray-600 flex items-center">
            <Icon className="w-4 h-4 mr-1" /> {label}
        </p>
        <p className="text-lg font-bold text-gray-800 mt-1 whitespace-pre-wrap">{value}</p>
    </div>
);

const AppealChips = ({ items }: { items: string[] }) => (
    <div className="flex flex-wrap gap-2 mt-2">
        {(items.length > 0 ? items : ['未設定']).map((item, i) => (
            <span key={i} className="text-xs bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full font-medium">
                {item}
            </span>
        ))}
    </div>
);

// =================================================================================
// --- メインページコンポーネント ---
// =================================================================================
const JobViewPage: NextPage<ViewPageProps> = ({ jobData, profileData, error, isRecruiter }) => {
    const router = useRouter();
    const id = router.query.id as string;
    
    // データがない場合はエラー表示
    if (error || !jobData) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-6">
                <Head><title>エラー | 求人プレビュー</title></Head>
                <div className="text-center p-10 bg-white shadow-xl rounded-xl max-w-lg">
                    <AlertTriangle size={48} className="text-red-500 mx-auto mb-4" />
                    <h1 className="text-2xl font-bold text-gray-800 mb-2">エラーが発生しました</h1>
                    <p className="text-gray-600 mb-6">{error || '求人データが見つかりません。'}</p>
                    <Link href="/recruit/dashboard" className="text-indigo-600 hover:text-indigo-800 flex items-center justify-center font-semibold">
                        <ArrowLeft className="w-4 h-4 mr-1" /> ダッシュボードに戻る
                    </Link>
                </div>
            </div>
        );
    }

    const companyName = profileData?.companyName || jobData.jobTitle.split('の')[0] || '企業名不明';
    const remoteDisplay = jobData.remotePolicy === 'full' ? 'フルリモート可' : jobData.remotePolicy === 'hybrid' ? 'ハイブリッド可' : '出社必須';

    return (
        <div className="min-h-screen bg-gray-50 font-sans">
            <Head><title>{jobData.jobTitle} | {companyName} の求人</title></Head>

            <header className="bg-white shadow-sm sticky top-0 z-10">
                <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
                    <Link href="/recruit/dashboard" className="text-sm font-semibold text-gray-600 hover:text-indigo-600 flex items-center">
                        <ArrowLeft className="w-4 h-4 mr-1" /> 企業ダッシュボードへ戻る
                    </Link>
                    {isRecruiter && (
                        <Link href={`/recruit/jobs/edit?id=${id}`} className="px-4 py-2 bg-indigo-600 text-white font-bold rounded-md hover:bg-indigo-700 text-sm flex items-center">
                            <RiImageEditLine className="mr-1" size={16}/> この求人を編集する
                        </Link>
                    )}
                </div>
            </header>

            <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                <div className="bg-white p-8 rounded-xl shadow-2xl border border-gray-100 space-y-12">
                    
                    {/* タイトル & ステータス */}
                    <div className="mb-6 border-b pb-4">
                        <div className="flex justify-between items-start mb-2">
                            <StatusBadge status={jobData.verificationStatus} />
                            <button className="text-red-500 hover:text-red-700 p-1 rounded-full bg-red-50 transition-colors">
                                <RiHeartFill size={20} />
                            </button>
                        </div>
                        <h1 className="text-4xl font-extrabold text-gray-900 mt-2">{jobData.jobTitle}</h1>
                        <p className="text-xl font-semibold text-indigo-600 flex items-center mt-1">
                            <Building className="w-6 h-6 mr-2" />{companyName}
                        </p>
                    </div>

                    {/* AIマッチング最重要項目 */}
                    <section className="p-6 rounded-xl bg-blue-50 border border-blue-200">
                        <SectionTitle icon={Sparkles} title="AIマッチング最重要項目" />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <DetailItem 
                                icon={JapaneseYen} 
                                label={`給与 (${jobData.salaryType})`} 
                                value={`${jobData.salaryMin.toLocaleString()} 〜 ${jobData.salaryMax.toLocaleString()} ${jobData.salaryType === '年収' ? '万円' : jobData.salaryType === '時給' ? '円' : '円'}`} 
                            />
                            <DetailItem icon={MapPin} label="勤務地" value={jobData.location} />
                            <DetailItem icon={Clock} label="勤務時間" value={jobData.workingHours} />
                            <DetailItem icon={Laptop} label="リモートワーク" value={remoteDisplay} />
                        </div>
                        <div className='mt-6'>
                            <p className="font-semibold text-gray-700 flex items-center"><CalendarDays className="w-4 h-4 mr-2" /> 勤務曜日</p>
                            <AppealChips items={jobData.workingDays} />
                        </div>
                    </section>
                    
                    {/* 採用の詳細・人物像 */}
                    <section className="space-y-6">
                        <SectionTitle icon={UserCheck} title="採用の詳細・求める人物像" />
                        <DetailItem label="採用背景" value={jobData.hiringBackground} icon={Briefcase} />
                        <DetailItem label="求める人物像" value={jobData.idealCandidate} icon={UserCheck} />
                        <DetailItem label="昇給・賞与体系" value={jobData.salaryStructure} icon={JapaneseYen} />
                        <DetailItem label="有給休暇取得制度" value={jobData.paidLeaveSystem} icon={CalendarDays} />
                    </section>

                    {/* 具体的な仕事内容・スキル */}
                    <section className="space-y-6">
                        <SectionTitle icon={MessageSquare} title="具体的な仕事内容・スキル" />
                        <DetailItem label="具体的な仕事内容" value={jobData.jobDescription} icon={Briefcase} />
                        <DetailItem label="必須スキル・経験" value={jobData.requiredSkills} icon={Tag} />
                        <DetailItem label="歓迎スキル・経験" value={jobData.welcomeSkills} icon={Tag} />
                    </section>

                    {/* 求人独自の制度・文化 */}
                    <section className="space-y-6 p-6 bg-gray-100 rounded-xl border">
                        <SectionTitle icon={Tag} title="求人独自の制度・文化" />
                        
                        <div className='space-y-4'>
                            <h3 className="font-bold text-gray-700 flex items-center">🚀 成長機会</h3>
                            <AppealChips items={jobData.appealPoints_job.growth} />
                        </div>
                        
                        <div className='space-y-4'>
                            <h3 className="font-bold text-gray-700 flex items-center">⏳ ワークライフバランス</h3>
                            <AppealChips items={jobData.appealPoints_job.wlb} />
                        </div>
                        
                        <div className='space-y-4'>
                            <h3 className="font-bold text-gray-700 flex items-center">💰 福利厚生・手当</h3>
                            <AppealChips items={jobData.appealPoints_job.benefits} />
                        </div>
                    </section>

                    {/* 企業プロフィール情報 (連携表示) */}
                    {profileData && (
                        <section className="space-y-8 mt-12 pt-8 border-t border-gray-200">
                            <SectionTitle icon={Building} title={`${companyName} の企業プロフィール`} />
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <DetailItem icon={HeartHandshake} label="Our Mission (私たちが目指すこと)" value={profileData.ourMission} />
                                <DetailItem icon={Building} label="What We Do (事業内容)" value={profileData.whatWeDo} />
                                <DetailItem icon={Briefcase} label="Our Culture (文化・風土)" value={profileData.ourCulture} />
                                <DetailItem icon={Send} label="未来の仲間へのメッセージ" value={profileData.messageToCandidates} />
                            </div>

                            <div className='space-y-4'>
                                <h3 className="font-bold text-gray-700 flex items-center"><TrendingUp className="w-5 h-5 mr-2" /> 社風・雰囲気 (企業全体)</h3>
                                <AppealChips items={profileData.appealPoints_company.atmosphere} />
                            </div>
                            <div className='space-y-4'>
                                <h3 className="font-bold text-gray-700 flex items-center"><Building className="w-5 h-5 mr-2" /> 組織・事業 (企業全体)</h3>
                                <AppealChips items={profileData.appealPoints_company.organization} />
                            </div>

                            {/* ギャラリー */}
                            {profileData.galleryImageUrls.length > 0 && (
                                <div>
                                    <h3 className="font-bold text-gray-700 flex items-center mt-6 mb-3"><Camera className="w-5 h-5 mr-2" /> ギャラリー</h3>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        {profileData.galleryImageUrls.map((url, index) => (
                                            <img key={index} src={url} alt={`Gallery ${index + 1}`} className="w-full h-32 object-cover rounded-md shadow-md" />
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* 動画 (高さ修正済み) */}
                            {profileData.videoUrl && (
                                <div>
                                    <h3 className="font-bold text-gray-700 flex items-center mt-6 mb-3"><Video className="w-5 h-5 mr-2" /> 紹介動画</h3>
                                    
                                    {/* ★★★ 高さ修正箇所 ★★★ */}
                                    <div className="relative pt-[56.25%]">
                                        <iframe
                                            src={getYouTubeEmbedUrl(profileData.videoUrl)}
                                            title="Company Introduction Video"
                                            frameBorder="0"
                                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                            allowFullScreen
                                            className="absolute top-0 left-0 w-full h-full rounded-md shadow-lg"
                                        ></iframe>
                                    </div>
                                    {/* ★★★ 修正箇所ここまで ★★★ */}

                                </div>
                            )}
                        </section>
                    )}


                    {/* 応募ボタン (一般ユーザー向け) */}
                    {!isRecruiter && (
                        <div className="mt-10 pt-6 border-t text-center">
                             <Link href={`/apply?jobId=${id}`} className="inline-block px-12 py-4 bg-green-600 text-white text-xl font-extrabold rounded-full shadow-lg hover:bg-green-700 transition duration-150">
                                この求人に応募する
                            </Link>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default JobViewPage;