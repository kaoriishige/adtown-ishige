import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head'; 
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase'; // 🚨 Firebase Client SDK
import { GetServerSideProps, NextPage } from 'next';
import nookies from 'nookies';
import { adminAuth, adminDb } from '@/lib/firebase-admin'; // 🚨 Firebase Admin SDK
import * as admin from 'firebase-admin';

// Lucide Icons
import { 
    Loader2, Building, Briefcase, ArrowLeft, Sparkles, MessageSquare, JapaneseYen, MapPin, 
    Laptop, Send, CheckSquare, Clock, Trash2, RotateCcw, TrendingUp, AlertTriangle // AlertTriangle をインポート
} from 'lucide-react';
import Link from 'next/link';
import React from 'react';

// --- create.tsxと共有される選択肢データ (再定義) ---
const jobCategoryOptions = ["営業・企画・マーケティング", "事務・管理", "販売・接客・サービス", "飲食・フード", "IT・エンジニア", "クリエイティブ（デザイン・Webなど）", "製造・軽作業・工場", "建築・土木・設備", "配送・ドライバー", "医療・福祉・保育", "教育・講師", "専門職（士業・金融など）", "その他"];
const employmentTypeOptions = ["正社員", "契約社員", "アルバイト・パート", "業務委託"];
const growthOptions = ["OJT（実務を通じた教育制度）", "メンター制度（先輩社員によるサポート）", "定期的な社内研修あり", "社外研修・セミナー参加支援あり", "資格取得支援制度あり", "書籍・教材購入補助あり", "AI・DX関連の研修あり", "海外研修・グローバル教育あり", "キャリア面談制度あり", "評価・昇進が明確（スキルや成果で評価）", "社内表彰・インセンティブ制度あり", "他部署への異動・チャレンジを歓迎", "社員の挑戦を応援する文化", "失敗を許容する文化（トライ＆エラーを奨励）", "社内勉強会・ナレッジシェア会あり", "社外講師や専門家を招いた学習機会あり"];
const wlbOptions = ["フルリモート勤務可", "一部リモート勤務可（ハイブリッドワーク）", "フレックスタイム制あり", "残業少なめ（月20時間以内）", "完全週休2日制", "年間休日120日以上", "有給休暇取得率が高い", "産休・育休取得実績あり", "時短勤務制度あり", "介護・看護休暇あり", "副業・兼業OK", "私服勤務OK", "勤務地選択可（地方・在宅勤務など）", "長期休暇制度あり（リフレッシュ・サバティカルなど）", "定時退社を推奨", "家庭・育児と両立しやすい環境"];
const benefitsOptions = ["社会保険完備", "通勤手当・交通費支給", "在宅勤務手当あり", "家賃補助・住宅手当あり", "家族手当あり", "賞与・ボーナスあり", "成果連動インセンティブあり", "ストックオプション制度あり", "健康診断・人間ドック補助あり", "福利厚生サービス（例：リロクラブ、ベネフィットステーション等）加入", "食事補助・社員食堂あり", "書籍・ツール購入補助あり", "PC・デバイス支給（業務用）", "勤続表彰・特別休暇あり", "社員旅行・懇親イベントあり", "社内カフェ・フリードリンクあり", "資格手当・成果手当あり", "退職金制度あり", "定年後再雇用制度あり", "制服貸与"];
const atmosphereOptions = ["フラットな社風", "チームワーク重視", "個人主義", "成果主義", "挑戦を歓迎する", "落ち着いた雰囲気", "スピード感がある", "オープンなコミュニケーション", "若手が活躍", "ベテランが活躍", "男女問わず活躍", "多国籍チーム", "リモート中心", "オフィス出社中心", "カジュアルな雰囲気", "フォーマルな雰囲気"];
const organizationOptions = ["サステナビリティ・社会貢献を重視", "地域密着型の事業を展開", "スタートアップ・ベンチャー志向", "安定成長志向", "社会課題解決をテーマにしている", "AI・デジタル技術を積極活用", "顧客満足より「顧客成功」を重視", "働く人の多様性・個性を尊重", "社長・経営層と距離が近い", "オープンで透明性のある経営"];


// --- 型定義 ---
interface JobData {
    jobId: string;
    uid: string; // オーナーUID
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
    status: 'draft' | 'pending_review' | 'verified' | 'rejected';
    aiFeedback: string;
    companyName: string;
    isProfileVerified: boolean;
    appealPoints: {
        atmosphere: string[];
        organization: string[];
        growth: string[];
        wlb: string[];
        benefits: string[];
    };
}

interface EditPageProps {
    jobData: JobData | null;
    error?: string;
}

// --- SSR: データ読み込みと権限チェック (変更なし) ---
export const getServerSideProps: GetServerSideProps = async (context) => {
    const jobId = context.query.id as string;

    if (!jobId) {
        return { props: { error: 'JobIDが指定されていません。', jobData: null } };
    }

    try {
        const cookies = nookies.get(context);
        const token = await adminAuth.verifySessionCookie(cookies.session || '', true);
        const { uid } = token;

        // 1. 求人データ取得
        const jobRef = adminDb.collection('recruitments').doc(jobId);
        const jobDoc = await jobRef.get();

        if (!jobDoc.exists) {
            return { props: { error: '指定された求人は存在しません。', jobData: null } };
        }

        const jobDataRaw = jobDoc.data()! as { [key: string]: any };

        // 2. 権限チェック: 求人のオーナーであるか確認
        if (jobDataRaw.uid !== uid) {
            return { redirect: { destination: '/recruit/dashboard?error=permission', permanent: false } };
        }

        // 3. 企業情報（プロフィール認証状態と会社名）の取得
        const recruiterSnap = await adminDb.collection('recruiters').doc(uid).get();
        const userSnap = await adminDb.collection('users').doc(uid).get();
        
        let companyName = userSnap.data()?.companyName || "未設定の会社名";
        let isProfileVerified = recruiterSnap.data()?.verificationStatus === 'verified' || false;

        const jobData: JobData = {
            jobId,
            uid: jobDataRaw.uid,
            jobTitle: jobDataRaw.jobTitle || '',
            employmentType: jobDataRaw.employmentType || '正社員',
            jobCategory: jobDataRaw.jobCategory || '',
            salaryType: jobDataRaw.salaryType || '年収',
            salaryMin: jobDataRaw.salaryMin || 0,
            salaryMax: jobDataRaw.salaryMax || 0,
            location: jobDataRaw.location || '',
            workingHours: jobDataRaw.workingHours || '',
            remotePolicy: jobDataRaw.remotePolicy || 'no',
            requiredSkills: jobDataRaw.requiredSkills || '',
            welcomeSkills: jobDataRaw.welcomeSkills || '',
            jobDescription: jobDataRaw.jobDescription || '',
            status: jobDataRaw.status || 'draft',
            aiFeedback: jobDataRaw.aiFeedback || '',
            companyName: companyName,
            isProfileVerified: isProfileVerified,
            appealPoints: jobDataRaw.appealPoints || { growth: [], wlb: [], benefits: [], atmosphere: [], organization: [] },
        };

        return { props: { jobData } };

    } catch (error) {
        console.error("EditPage SSR Error:", error);
        // 認証失敗時はログインへリダイレクト
        return { redirect: { destination: '/partner/login', permanent: false } };
    }
};

const JobEditPage: NextPage<EditPageProps> = ({ jobData, error }) => {
    const router = useRouter();
    const auth = getAuth();
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [formData, setFormData] = useState<Omit<JobData, 'jobId' | 'companyName' | 'isProfileVerified'>>(jobData || {} as any);
    const [currentJobStatus, setCurrentJobStatus] = useState(jobData?.status || 'draft');
    const [aiMessage, setAiMessage] = useState(jobData?.aiFeedback || 'データ読み込み完了。');
    
    const isProfileVerified = jobData?.isProfileVerified || false;
    const isJobVerified = currentJobStatus === 'verified';
    const isJobRejected = currentJobStatus === 'rejected';
    // 💡 審査中か、審査がリジェクトされた状態を判定
    const isJobPendingOrRejected = currentJobStatus === 'pending_review' || currentJobStatus === 'rejected';

    useEffect(() => {
        if (error || !jobData) {
            alert(error || '求人データが見つかりませんでした。');
            router.push('/recruit/jobs');
        }
        if(jobData) {
             setFormData(jobData);
        }
    }, [error, jobData, router]);

    // フォームデータがない場合は早期リターン
    if (error || !jobData) return <div className="flex justify-center items-center h-screen text-red-600">{error || '求人データの読み込みに失敗しました。'}</div>;

    // --- フォームハンドラー ---
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value } as any));
    };
    
    const handleJobCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const { value } = e.target;
        setFormData(prev => ({ ...prev, jobCategory: value } as any));
    };

    const handleAppealCheckboxChange = (category: keyof JobData['appealPoints'], value: string) => {
        setFormData(prev => {
            const currentValues = prev.appealPoints[category] || [];
            const newValues = currentValues.includes(value)
                ? currentValues.filter(item => item !== value)
                : [...currentValues, value];
            return { ...prev, appealPoints: { ...prev.appealPoints, [category]: newValues } } as any;
        });
    };

    // --- AI審査の再申請/リセット処理 (handleSubmitとロジックを共有) ---
    const initiateReview = async (isManualReset: boolean = false) => {
        if (!isProfileVerified) { 
            alert('企業プロフィールが未承認のため、求人を更新できません。');
            return;
        }

        setSaving(true);
        const jobDocRef = doc(db, 'recruitments', jobData.jobId);
        
        try {
            // フォームデータを更新し、ステータスを 'pending_review' に設定
            await updateDoc(jobDocRef, {
                // 手動リセットの場合は、フォームデータは更新しないが、申請ボタンでは更新する
                ...(isManualReset ? {} : {
                    jobTitle: formData.jobTitle,
                    employmentType: formData.employmentType,
                    jobCategory: formData.jobCategory,
                    salaryType: formData.salaryType,
                    salaryMin: Number(formData.salaryMin) || 0,
                    salaryMax: Number(formData.salaryMax) || 0,
                    location: formData.location,
                    workingHours: formData.workingHours,
                    remotePolicy: formData.remotePolicy,
                    requiredSkills: formData.requiredSkills,
                    welcomeSkills: formData.welcomeSkills,
                    jobDescription: formData.jobDescription,
                    appealPoints: formData.appealPoints,
                }),
                status: 'pending_review', // AI審査のためステータスを戻す
                aiFeedback: isManualReset ? 'AI審査を強制的に再実行します...' : 'AIが求人内容を再審査中です...',
                updatedAt: serverTimestamp(),
            });
            setCurrentJobStatus('pending_review');
            setAiMessage(isManualReset ? 'AI審査を強制的に再実行します...' : 'AIが求人内容を再審査中です...');

            // AI再審査APIの呼び出し（再審査をトリガー）
            const idToken = await auth.currentUser?.getIdToken();
            const response = await fetch('/api/recruit/initiate-match', { 
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${idToken}` },
                body: JSON.stringify({ jobId: jobData.jobId, uid: jobData.uid }),
            });
            
            // サーバーエラー時に強制却下ロジックが走るため、ここで500エラーをキャッチ
            if (!response.ok) {
                 const errorData = await response.json().catch(() => ({ error: `HTTP Error: ${response.status}` }));
                 throw new Error(errorData.error || `AI審査APIの呼び出しに失敗しました: ${response.status}`);
            }

            // 成功レスポンスを受け取った後、審査完了を待たずにリダイレクト
            alert('求人の再審査を申請しました。ダッシュボードで結果を確認してください。');
            router.replace('/recruit/dashboard'); // ダッシュボードにリダイレクト

        } catch (err: any) {
            alert(`エラーが発生しました: ${err.message}`);
            
            // エラーが発生した場合、サーバー側で status: 'rejected' に設定されているはずだが、
            // クライアント側でもすぐに UI を更新
            setCurrentJobStatus('rejected');
            setAiMessage('更新処理中にエラーが発生しました。内容を確認し、再申請してください。');
        } finally {
            setSaving(false);
        }
    };
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        initiateReview(false); // 通常の更新と審査申請
    };

    const handleManualReset = () => {
        if (window.confirm('AI審査がフリーズした場合、この操作で強制的に再審査を開始できます。フォーム内容は保存されません。続行しますか？')) {
            initiateReview(true); // 手動リセット（フォームデータは送信しない）
        }
    };


    // --- 求人削除処理 (変更なし) ---
    const handleDelete = async () => {
        if (!window.confirm('本当にこの求人情報を削除しますか？この操作は元に戻せません。')) return;

        setDeleting(true);
        try {
            const jobDocRef = doc(db, 'recruitments', jobData.jobId);
            await deleteDoc(jobDocRef);
            
            alert('求人情報が正常に削除されました。');
            router.push('/recruit/jobs'); // 一覧ページに戻る

        } catch (err) {
            alert('求人の削除に失敗しました。');
            console.error(err);
        } finally {
            setDeleting(false);
        }
    };


    // UI要素: 求人ステータスバッジ (変更なし)
    const JobStatusBadge = () => {
        let text = '下書き';
        let color = 'bg-gray-100 text-gray-700';
        let icon = <Briefcase className="w-4 h-4 mr-1" />;

        switch (currentJobStatus) {
            case 'verified':
                text = 'AI承認済み（公開中）';
                color = 'bg-green-100 text-green-700';
                icon = <CheckSquare className="w-4 h-4 mr-1" />;
                break;
            case 'pending_review':
                text = 'AI審査中';
                color = 'bg-yellow-100 text-yellow-700';
                icon = <Loader2 className="w-4 h-4 mr-1 animate-spin" />;
                break;
            case 'rejected':
                text = '修正要請';
                color = 'bg-red-100 text-red-700';
                icon = <AlertTriangle className="w-4 h-4 mr-1" />;
                break;
        }
        return <span className={`inline-flex items-center px-3 py-1 text-sm font-medium rounded-full ${color}`}>{icon}{text}</span>;
    };


    return (
        <div className="min-h-screen bg-gray-50">
            <Head><title>求人編集: {jobData.jobTitle} - {jobData.companyName}</title></Head>
            <header className="bg-white shadow-sm sticky top-0 z-20">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
                    <button onClick={() => router.push('/recruit/jobs')} className="flex items-center text-sm text-gray-600 hover:text-gray-900 font-semibold">
                        <ArrowLeft className="w-4 h-4 mr-2" /> 求人一覧に戻る
                    </button>
                    <button onClick={handleDelete} disabled={deleting} className="text-red-500 hover:text-red-700 disabled:opacity-50 flex items-center text-sm font-semibold">
                        {deleting ? <Loader2 className="animate-spin mr-2 w-4 h-4" /> : <Trash2 className="w-4 h-4 mr-1" />}
                        {deleting ? '削除中...' : '求人を削除'}
                    </button>
                </div>
            </header>
            <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <p className="text-sm font-semibold text-indigo-600 flex items-center"><Building className="w-4 h-4 mr-2" />{jobData.companyName}</p>
                        <h1 className="text-3xl font-bold text-gray-900 mt-1">求人の編集: {jobData.jobTitle}</h1>
                    </div>
                    <JobStatusBadge />
                </div>

                {/* AIフィードバック/ステータス表示エリア */}
                <div className={`p-4 mb-4 rounded-lg text-sm border-l-4 ${isJobRejected ? 'bg-red-50 border-red-500 text-red-800' : isJobVerified ? 'bg-green-50 border-green-500 text-green-800' : 'bg-yellow-50 border-yellow-500 text-yellow-800'}`}>
                    <p className="font-bold mb-1">AI/審査状況:</p>
                    <p className="text-xs">{aiMessage}</p>
                    {isJobRejected && (
                        <p className="text-xs mt-2 font-semibold">👆 **修正が必要です。**内容を修正後、ページ下部のボタンで再審査を申請してください。</p>
                    )}
                </div>
                
                {/* 💡 強制リセットボタンのエリア */}
                {isJobPendingOrRejected && currentJobStatus === 'pending_review' && (
                    <div className="mb-8 p-4 bg-gray-100 border border-gray-300 rounded-lg text-center">
                        <p className="text-sm font-semibold text-gray-700 mb-2">AI審査がフリーズした場合：</p>
                        <button
                            onClick={handleManualReset}
                            disabled={saving || !isProfileVerified}
                            className="inline-flex items-center px-4 py-2 bg-yellow-500 text-white font-bold rounded-md hover:bg-yellow-600 disabled:bg-gray-400 text-sm"
                        >
                            <RotateCcw className="w-4 h-4 mr-2" />
                            強制的に再審査をトリガーする
                        </button>
                        <p className="text-xs text-gray-500 mt-2">※ フォーム内容は送信されません。最新の状態を取得し、審査を再開します。</p>
                    </div>
                )}

                
                {/* プロフィール未承認アラート (求人登録・更新ができない状態) */}
                {!isProfileVerified && (
                    <div className="p-4 mb-8 bg-red-100 text-red-800 rounded-lg text-sm">
                        <p className="font-bold">企業プロフィールが未承認のため、求人の公開はできません。</p>
                        <Link href="/recruit/profile" className="mt-2 inline-block font-bold text-indigo-700 hover:underline">
                            プロフィール編集ページへ
                        </Link>
                    </div>
                )}
                
                <form onSubmit={handleSubmit} className="bg-white p-8 rounded-lg shadow-xl space-y-10">
                    
                    {/* フォームセクション (未承認時は非活性化) */}
                    <section className="space-y-6" style={{ opacity: isProfileVerified ? 1 : 0.5, pointerEvents: isProfileVerified ? 'auto' : 'none' }}>
                        
                        {/* 募集要項 */}
                        <h2 className="text-xl font-semibold border-b pb-2 text-gray-800 flex items-center"><Briefcase className="w-5 h-5 mr-3 text-gray-500" />募集要項</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div><label htmlFor="jobTitle" className="block text-sm font-medium text-gray-700">求人タイトル *</label><input type="text" id="jobTitle" name="jobTitle" value={formData.jobTitle} onChange={handleChange} required className="mt-1 block w-full input" placeholder="例：【未経験OK】地域の魅力を伝えるWebマーケター" /></div>
                            <div><label htmlFor="employmentType" className="block text-sm font-medium text-gray-700">雇用形態 *</label><select id="employmentType" name="employmentType" value={formData.employmentType} onChange={handleChange} className="mt-1 block w-full input">{employmentTypeOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}</select></div>
                        </div>
                        <div>
                            <label htmlFor="jobCategory" className="block text-sm font-medium text-gray-700">職種カテゴリ *</label>
                            <select id="jobCategory" name="jobCategory" value={formData.jobCategory} onChange={handleJobCategoryChange} required className="mt-1 block w-full input">
                                <option value="">職種を選択してください</option>
                                {jobCategoryOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                            </select>
                        </div>

                        {/* AIマッチング最重要項目 (給与・勤務地) */}
                        <section className="space-y-6 p-6 rounded-lg bg-blue-50 border border-blue-200">
                            <h2 className="text-xl font-semibold text-blue-800 flex items-center"><Sparkles className="w-5 h-5 mr-2" />AIマッチング最重要項目</h2>
                            <p className="text-sm text-blue-700">※ 給与と勤務地は、AIが候補者をマッチングする際の**最も重要な基準**となります。正確に入力してください。</p>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 flex items-center"><JapaneseYen className="w-4 h-4 mr-1" />給与タイプ *</label>
                                <div className="mt-2 flex gap-4">
                                    <label className="flex items-center"><input type="radio" name="salaryType" value="年収" checked={formData.salaryType === '年収'} onChange={handleChange} className="h-4 w-4 checkbox" /><span className="ml-2 text-sm text-gray-700">年収</span></label>
                                    <label className="flex items-center"><input type="radio" name="salaryType" value="時給" checked={formData.salaryType === '時給'} onChange={handleChange} className="h-4 w-4 checkbox" /><span className="ml-2 text-sm text-gray-700">時給</span></label>
                                    <label className="flex items-center"><input type="radio" name="salaryType" value="月給" checked={formData.salaryType === '月給'} onChange={handleChange} className="h-4 w-4 checkbox" /><span className="ml-2 text-sm text-gray-700">月給</span></label>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
                                <div><label htmlFor="salaryMin" className="block text-sm font-medium text-gray-700">最低{formData.salaryType}（{formData.salaryType === '年収' ? '万円' : '円'}） *</label><input type="number" id="salaryMin" name="salaryMin" value={formData.salaryMin} onChange={handleChange} required className="mt-1 block w-full input" placeholder={formData.salaryType === '年収' ? '例：350' : '例：1200'} /></div>
                                <div><label htmlFor="salaryMax" className="block text-sm font-medium text-gray-700">最高{formData.salaryType}（{formData.salaryType === '年収' ? '万円' : '円'}） *</label><input type="number" id="salaryMax" name="salaryMax" value={formData.salaryMax} onChange={handleChange} required className="mt-1 block w-full input" placeholder={formData.salaryType === '年収' ? '例：600' : '例：2500'} /></div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div><label htmlFor="workingHours" className="block text-sm font-medium text-gray-700 flex items-center"><Clock className="w-4 h-4 mr-1" />勤務時間 *</label><textarea id="workingHours" name="workingHours" value={formData.workingHours} onChange={handleChange} required rows={2} className="mt-1 block w-full input" placeholder="例：10:00〜19:00（休憩1時間）など" /></div>
                                <div><label htmlFor="location" className="block text-sm font-medium text-gray-700 flex items-center"><MapPin className="w-4 h-4 mr-1" />勤務地 *</label><input type="text" id="location" name="location" value={formData.location} onChange={handleChange} required className="mt-1 block w-full input" /></div>
                                <div><label htmlFor="remotePolicy" className="block text-sm font-medium text-gray-700 flex items-center"><Laptop className="w-4 h-4 mr-1" />リモートワーク許容レベル *</label><select id="remotePolicy" name="remotePolicy" value={formData.remotePolicy} onChange={handleChange} className="mt-1 block w-full input"><option value="no">出社必須</option><option value="hybrid">ハイブリッド可</option><option value="full">フルリモート可</option></select></div>
                            </div>
                        </section>

                        {/* 求人独自の制度・文化 (チェックボックスセクション) */}
                        <section className="space-y-8">
                            <h2 className="text-xl font-semibold border-b pb-2 text-gray-800 flex items-center"><CheckSquare className="w-5 h-5 mr-3 text-gray-500" />この求人独自の制度・文化</h2>
                            
                            {/* 成長機会 */}
                            <div className="p-4 border rounded-lg space-y-4">
                                <h3 className="font-bold text-gray-700">🚀 成長機会</h3>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    {growthOptions.map(opt => (<label key={opt} className="flex items-center space-x-2 text-sm"><input type="checkbox" checked={formData.appealPoints.growth.includes(opt)} onChange={() => handleAppealCheckboxChange('growth', opt)} className="h-4 w-4 checkbox" /><span>{opt}</span></label>))}
                                </div>
                            </div>

                            {/* ワークライフバランス */}
                            <div className="p-4 border rounded-lg space-y-4">
                                <h3 className="font-bold text-gray-700">🕰️ ワークライフバランス</h3>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    {wlbOptions.map(opt => (<label key={opt} className="flex items-center space-x-2 text-sm"><input type="checkbox" checked={formData.appealPoints.wlb.includes(opt)} onChange={() => handleAppealCheckboxChange('wlb', opt)} className="h-4 w-4 checkbox" /><span>{opt}</span></label>))}
                                </div>
                            </div>
                            
                            {/* 福利厚生 */}
                            <div className="p-4 border rounded-lg space-y-4">
                                <h3 className="font-bold text-gray-700">💰 福利厚生・手当</h3>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    {benefitsOptions.map(opt => (<label key={opt} className="flex items-center space-x-2 text-sm"><input type="checkbox" checked={formData.appealPoints.benefits.includes(opt)} onChange={() => handleAppealCheckboxChange('benefits', opt)} className="h-4 w-4 checkbox" /><span>{opt}</span></label>))}
                                </div>
                            </div>

                            {/* 社風・組織（企業プロフィールから継承） */}
                            <div className="p-4 border rounded-lg space-y-4">
                                <h3 className="font-bold text-gray-700">🏢 社風・組織</h3>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    {atmosphereOptions.map(opt => (<label key={opt} className="flex items-center space-x-2 text-sm"><input type="checkbox" checked={formData.appealPoints.atmosphere.includes(opt)} onChange={() => handleAppealCheckboxChange('atmosphere', opt)} className="h-4 w-4 checkbox" /><span>{opt}</span></label>))}
                                </div>
                                <h3 className="font-bold text-gray-700 mt-4">🌍 組織・事業</h3>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    {organizationOptions.map(opt => (<label key={opt} className="flex items-center space-x-2 text-sm"><input type="checkbox" checked={formData.appealPoints.organization.includes(opt)} onChange={() => handleAppealCheckboxChange('organization', opt)} className="h-4 w-4 checkbox" /><span>{opt}</span></label>))}
                                </div>
                            </div>

                        </section>

                        {/* 具体的な仕事内容・スキル */}
                        <section className="space-y-6">
                            <h2 className="text-xl font-semibold border-b pb-2 text-gray-800 flex items-center"><MessageSquare className="w-5 h-5 mr-3 text-gray-500" />具体的な仕事内容・スキル</h2>
                            <div><label htmlFor="jobDescription" className="block text-sm font-medium text-gray-700">具体的な仕事内容 *</label><textarea id="jobDescription" name="jobDescription" value={formData.jobDescription} onChange={handleChange} required rows={6} className="mt-1 block w-full input" placeholder="業務内容、1日の流れ、使用するツールなどを具体的に記載してください。"></textarea></div>
                            <div><label htmlFor="requiredSkills" className="block text-sm font-medium text-gray-700">必須スキル・経験</label><textarea id="requiredSkills" name="requiredSkills" value={formData.requiredSkills} onChange={handleChange} rows={4} className="mt-1 block w-full input" placeholder="例：・普通自動車第一種運転免許&#10;・基本的なPCスキル（Word, Excel）"></textarea></div>
                            <div><label htmlFor="welcomeSkills" className="block text-sm font-medium text-gray-700">歓迎スキル・経験</label><textarea id="welcomeSkills" name="welcomeSkills" value={formData.welcomeSkills} onChange={handleChange} rows={4} className="mt-1 block w-full input" placeholder="例：・Webマーケティングの実務経験&#10;・Adobe Photoshop, Illustratorの使用経験"></textarea></div>
                        </section>

                        <div className="flex justify-end pt-6 border-t">
                            <button type="submit" disabled={saving || !isProfileVerified} className="w-full md:w-auto px-8 py-3 bg-indigo-600 text-white font-bold rounded-md hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center">
                                {saving ? <><Loader2 className="animate-spin mr-2" />更新中...</> : <><RotateCcw className="w-4 h-4 mr-2" />更新してAI再審査を申請</>}
                            </button>
                        </div>
                    </section>
                </form>
            </main>
            <style jsx>{`.input { @apply block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500; } .checkbox { @apply h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500; }`}</style>
        </div>
    );
};

export default JobEditPage;