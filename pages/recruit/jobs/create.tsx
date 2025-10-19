// pages/recruit/jobs/create.tsx
import Head from 'next/head';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { getAuth, onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc, addDoc, collection, serverTimestamp, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase'; // 🚨 Firebase Client SDK
import { Loader2, Building, Briefcase, ArrowLeft, Sparkles, MessageSquare, JapaneseYen, MapPin, Laptop, Send, CheckSquare, Clock, Tag } from 'lucide-react';
import Link from 'next/link';

// --- このページで必要な選択肢データ (修正) ---
const jobCategoryOptions = [
    "営業・企画・マーケティング", 
    "事務・管理", 
    "販売・接客・サービス", 
    "飲食・フード", 
    "旅館・ホテル",
    "AI・IT・エンジニア", 
    "クリエイティブ（デザイン・Webなど）", 
    "製造・軽作業・工場", 
    "建築・土木・設備", 
    "配送・ドライバー", 
    "医療・福祉", 
    "保育園・幼稚園",
    "教育・講師", 
    "専門職（士業・金融など）", 
    "美容・理容・エステ",
    "農業・林業・畜産",
    "その他"
];
const employmentTypeOptions = ["正社員", "契約社員", "アルバイト・パート", "業務委託"];

// 企業プロフィールと求職者プロフィールで共有される価値観チェックリスト (変更なし)
const growthOptions = ["OJT（実務を通じた教育制度）", "メンター制度（先輩社員によるサポート）", "定期的な社内研修あり", "社外研修・セミナー参加支援あり", "資格取得支援制度あり", "書籍・教材購入補助あり", "AI・DX関連の研修あり", "海外研修・グローバル教育あり", "キャリア面談制度あり", "評価・昇進が明確（スキルや成果で評価）", "社内表彰・インセンティブ制度あり", "他部署への異動・チャレンジを歓迎", "社員の挑戦を応援する文化", "失敗を許容する文化（トライ＆エラーを奨励）", "社内勉強会・ナレッジシェア会あり", "社外講師や専門家を招いた学習機会あり"];
const wlbOptions = ["フルリモート勤務可", "一部リモート勤務可（ハイブリッドワーク）", "フレックスタイム制あり", "残業少なめ（月20時間以内）", "完全週休2日制", "年間休日120日以上", "有給休暇取得率が高い", "産休・育休取得実績あり", "時短勤務制度あり", "介護・看護休暇あり", "副業・兼業OK", "私服勤務OK", "勤務地選択可（地方・在宅勤務など）", "長期休暇制度あり（リフレッシュ・サバティカルなど）", "定時退社を推奨", "家庭・育児と両立しやすい環境"];
const benefitsOptions = ["社会保険完備", "通勤手当・交通費支給", "在宅勤務手当あり", "家賃補助・住宅手当あり", "家族手当あり", "賞与・ボーナスあり", "成果連動インセンティブあり", "ストックオプション制度あり", "健康診断・人間ドック補助あり", "福利厚生サービス（例：リロクラブ、ベネフィットステーション等）加入", "食事補助・社員食堂あり", "書籍・ツール購入補助あり", "PC・デバイス支給（業務用）", "勤続表彰・特別休暇あり", "社員旅行・懇親イベントあり", "社内カフェ・フリードリンクあり", "資格手当・成果手当あり", "退職金制度あり", "定年後再雇用制度あり", "制服貸与"];
const atmosphereOptions = ["フラットな社風", "チームワーク重視", "個人主義", "成果主義", "挑戦を歓迎する", "落ち着いた雰囲気", "スピード感がある", "オープンなコミュニケーション", "若手が活躍", "ベテランが活躍", "男女問わず活躍", "多国籍チーム", "リモート中心", "オフィス出社中心", "カジュアルな雰囲気", "フォーマルな雰囲気"];
const organizationOptions = ["サステナビリティ・社会貢献を重視", "地域密着型の事業を展開", "スタートアップ・ベンチャー志向", "安定成長志向", "社会課題解決をテーマにしている", "AI・デジタル技術を積極活用", "顧客満足より「顧客成功」を重視", "働く人の多様性・個性を尊重", "社長・経営層と距離が近い", "オープンで透明性のある経営"];


const JobCreatePage = () => {
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [companyName, setCompanyName] = useState('');
    const [profileStatus, setProfileStatus] = useState<'verified' | 'pending' | 'rejected' | 'draft'>('draft'); // 💡 プロフィール承認状態をより詳細に管理
    const isProfileVerified = profileStatus === 'verified';
    const [aiFeedbackProfile, setAiFeedbackProfile] = useState(''); // プロフィールからのAIフィードバック

    const [formData, setFormData] = useState({
        jobTitle: '',
        employmentType: '正社員',
        jobCategory: '',
        otherJobCategory: '', 
        salaryType: '年収', 
        salaryMin: '',
        salaryMax: '',
        location: '',
        workingHours: '', 
        remotePolicy: 'no',
        requiredSkills: '',
        welcomeSkills: '',
        jobDescription: '',
        appealPoints: {
            growth: [] as string[],
            wlb: [] as string[],
            benefits: [] as string[],
            atmosphere: [] as string[], 
            organization: [] as string[],
        },
    });

    // --- Firebase認証状態の監視とデータ取得 ---
    useEffect(() => {
        const auth = getAuth();
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            if (currentUser) {
                setUser(currentUser);
                // 企業プロフィールを 'recruiters' コレクションから読み込む
                const recruiterRef = doc(db, 'recruiters', currentUser.uid);
                const snap = await getDoc(recruiterRef);
                
                if (snap.exists()) {
                    const companyData = snap.data();
                    setCompanyName(companyData.companyName || '');
                    // 💡 プロフィールステータスをセット
                    setProfileStatus(companyData.verificationStatus || 'draft');
                    setAiFeedbackProfile(companyData.aiFeedback || '');
                    
                    // 企業プロフィールから AppealPoints と Location を初期値として読み込む
                    setFormData(prev => ({
                        ...prev,
                        location: companyData.address || '', 
                        appealPoints: {
                            ...prev.appealPoints,
                            // 企業プロフィールから読み込み、求人側で編集可能に
                            growth: companyData.appealPoints?.growth || [],
                            wlb: companyData.appealPoints?.wlb || [],
                            benefits: companyData.appealPoints?.benefits || [],
                            atmosphere: companyData.appealPoints?.atmosphere || [],
                            organization: companyData.appealPoints?.organization || [],
                        }
                    }));
                } else {
                    // recruiters ドキュメントがない場合
                    setCompanyName('プロフィール未登録');
                    setProfileStatus('draft');
                }
            } else {
                router.push('/partner/login');
            }
            setLoading(false);
        });
        return () => unsubscribe();
    }, [router]);

    // フォーム入力処理
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleJobCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const { value } = e.target;
        setFormData(prev => ({
            ...prev,
            jobCategory: value,
            otherJobCategory: value === 'その他' ? prev.otherJobCategory : ''
        }));
    };

    const handleAppealCheckboxChange = (category: keyof typeof formData.appealPoints, value: string) => {
        setFormData(prev => {
            const currentValues = prev.appealPoints[category];
            const newValues = currentValues.includes(value)
                ? currentValues.filter(item => item !== value)
                : [...currentValues, value];
            return { ...prev, appealPoints: { ...prev.appealPoints, [category]: newValues } };
        });
    };

    // --- 求人登録とAI審査の申請 ---
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        // 💡 企業プロフィール承認チェック
        if (!user || !isProfileVerified) { 
            alert('企業プロフィールが未承認のため、求人を登録できません。先にプロフィールを承認してください。');
            return;
        }

        setSaving(true);
        let newJobId = '';
        try {
            // 💡 修正: コレクションを 'recruitments' に変更
            const docRef = await addDoc(collection(db, 'recruitments'), { 
                jobTitle: formData.jobTitle,
                employmentType: formData.employmentType,
                // その他が選択された場合は自由入力を採用
                jobCategory: formData.jobCategory === 'その他' ? formData.otherJobCategory : formData.jobCategory,
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
                uid: user.uid, // 企業ID
                
                // ==========================================================
                // 💡 修正箇所: 運用ステータス(status)は常に 'draft' にリセット
                // 審査APIが active に上書きできる状態を保証する
                // ==========================================================
                verificationStatus: 'pending_review', // 審査ステータス: 審査待ち
                status: 'draft',                     // 運用ステータス: 常に下書きにリセット
                // ==========================================================
                
                aiFeedback: 'AIが求人内容を審査中です...',
                createdAt: serverTimestamp(),
            });
            newJobId = docRef.id;

            // 💡 AI審査APIの呼び出し（求人登録後、即座に実行）
            // このAPIはCloud Functionsをトリガーし、AIによる求人スコアリングと審査を行います。
            const response = await fetch('/api/recruit/initiate-match', { 
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ jobId: newJobId, uid: user.uid }), 
            });
            if (!response.ok) {
                // API呼び出し自体が失敗した場合
                throw new Error('AI審査システムの初期化に失敗しました。');
            }
            
            alert('求人を保存し、AI登録審査を開始しました。ダッシュボードで結果を確認してください。');
            router.push('/recruit/dashboard');

        } catch (err: any) {
            alert(`エラーが発生しました: ${err.message}`);
            if (newJobId) {
                // エラーが発生した場合、求人ステータスを修正要請に戻す
                const jobDocRef = doc(db, 'recruitments', newJobId); 
                await updateDoc(jobDocRef, {
                    verificationStatus: 'rejected',
                    status: 'draft',
                    aiFeedback: 'AI審査システムの呼び出し中にエラーが発生しました。内容を確認して再編集・申請してください。'
                });
            }
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="flex justify-center items-center h-screen text-lg text-indigo-600"><Loader2 className="animate-spin mr-3" /> 認証とプロファイルデータを読み込み中...</div>;

    // 企業プロフィールのアラートメッセージ
    const getProfileAlertMessage = () => {
        switch (profileStatus) {
            case 'pending':
                return { 
                    title: '企業プロフィールは現在「AI審査中」です。', 
                    body: `求人登録はプロフィール承認後に可能になります。AIからのフィードバック: ${aiFeedbackProfile || '承認待ちです。'}`,
                    color: 'bg-yellow-100 text-yellow-800'
                };
            case 'rejected':
                return { 
                    title: '企業プロフィールは「修正要請」の状態です。', 
                    body: `先に企業プロフィールを編集し、再申請が必要です。AIからのフィードバック: ${aiFeedbackProfile || '内容を確認してください。'}`,
                    color: 'bg-red-100 text-red-800'
                };
            case 'draft':
            default:
                return { 
                    title: '企業プロフィールが未登録です。', 
                    body: 'AIマッチング機能を開始するには、先に企業プロフィールを完成させ、AI審査の承認を受けてください。',
                    color: 'bg-red-100 text-red-800'
                };
        }
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <Head><title>新規求人作成 - {companyName}</title></Head>
            <header className="bg-white shadow-sm sticky top-0 z-20">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <button onClick={() => router.push('/recruit/dashboard')} className="flex items-center text-sm text-gray-600 hover:text-gray-900 font-semibold">
                        <ArrowLeft className="w-4 h-4 mr-2" /> ダッシュボードに戻る
                    </button>
                </div>
            </header>
            <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                
                {/* 💡 プロフィール未承認アラート (視認性向上) */}
                {!isProfileVerified && (
                    <div className={`p-4 mb-8 ${getProfileAlertMessage().color} rounded-lg text-sm border-l-4 border-current`}>
                        <p className="font-bold">{getProfileAlertMessage().title}</p>
                        <p className="text-xs mt-1">{getProfileAlertMessage().body}</p>
                        <Link href="/recruit/profile" className="mt-2 inline-block font-bold text-indigo-700 hover:underline">
                            プロフィール編集ページへ
                        </Link>
                    </div>
                )}
                
                <form onSubmit={handleSubmit} className="bg-white p-8 rounded-lg shadow-xl space-y-10">
                    <div>
                        <p className="text-sm font-semibold text-indigo-600 flex items-center"><Building className="w-4 h-4 mr-2" />{companyName}</p>
                        <h1 className="text-3xl font-bold text-gray-900 mt-1">新規求人の作成</h1>
                        <p className="mt-2 text-sm text-gray-600">この求人独自の「スペック」を入力してください。入力後、AIによるマッチングスコアリングと審査が自動で開始されます。</p>
                    </div>

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
                            {formData.jobCategory === 'その他' && (
                                <input type="text" name="otherJobCategory" value={formData.otherJobCategory} onChange={handleChange} required className="mt-2 block w-full input" placeholder="職種名を具体的に入力してください" />
                            )}
                        </div>

                        {/* 💡 AIマッチング最重要項目 (給与・勤務地) - 強調 */}
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

                        {/* 求人独自の制度・文化 */}
                        <section className="space-y-8">
                            <h2 className="text-xl font-semibold border-b pb-2 text-gray-800 flex items-center"><CheckSquare className="w-5 h-5 mr-3 text-gray-500" />この求人独自の制度・文化</h2>
                            <p className="text-sm text-gray-600 -mt-6">企業プロフィールから自動入力されています。この求人に当てはまらない場合はチェックを外してください。</p>
                            
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
                                <h3 className="font-bold text-gray-700">🏢 社風・組織（企業プロフィールから継承）</h3>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    {atmosphereOptions.map(opt => (<label key={opt} className="flex items-center space-x-2 text-sm"><input type="checkbox" checked={formData.appealPoints.atmosphere.includes(opt)} onChange={() => handleAppealCheckboxChange('atmosphere', opt)} className="h-4 w-4 checkbox" /><span>{opt}</span></label>))}
                                </div>
                                <h3 className="font-bold text-gray-700 mt-4">🌍 組織・事業（企業プロフィールから継承）</h3>
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
                                {saving ? <><Loader2 className="animate-spin mr-2" />AI審査を送信中...</> : <><Send className="w-4 h-4 mr-2" />保存してAI登録審査を申請</>}
                            </button>
                        </div>
                    </section>
                </form>
            </main>
            <style jsx>{`.input { @apply block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500; } .checkbox { @apply h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500; }`}</style>
        </div>
    );
};

export default JobCreatePage;

