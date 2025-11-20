import React, { useState, useEffect, useCallback, FormEvent, ChangeEvent, useMemo } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { getAuth, onAuthStateChanged, User } from 'firebase/auth';
import {
    doc,
    getDoc,
    setDoc,
    serverTimestamp,
    Timestamp 
} from 'firebase/firestore';
import { db } from '../../lib/firebase-client'; 
import {
    RiSave3Line,
    RiUserLine,
    RiHeartPulseLine,
    RiArrowRightLine,
    RiArrowLeftLine,
    RiMoneyDollarCircleLine,
    RiMapPinLine,
    RiBriefcase4Line,
    RiEditBoxLine,
    RiComputerLine,
    RiTimeLine,
    RiCalendarLine,
    RiSendPlane2Line,
    RiPencilRuler2Line, 
    RiErrorWarningLine
} from 'react-icons/ri';
import { Loader2 } from 'lucide-react';

// --- 定数 ---
const growthOptions = ['OJT（実務を通じた教育制度）', 'メンター制度（先輩社員によるサポート）', '定期的な社内研修あり', '社外研修・セミナー参加支援あり', '資格取得支援制度あり', '書籍・教材購入補助あり', 'AI・DX関連の研修あり', '海外研修・グローバル教育あり', 'キャリア面談制度あり', '評価・昇進が明確（スキルや成果で評価）', '社内表彰・インセンティブ制度あり', '他部署への異動・チャレンジを歓迎', '社員の挑戦を応援する文化', '失敗を許容する文化（トライ＆エラーを奨励）', '社内勉強会・ナレッジシェア会あり', '社外講師や専門家を招いた学習機会あり'];
const wlbOptions = ['フルリモート勤務可', '一部リモート勤務可（ハイブリッドワーク）', 'フレックスタイム制あり', '残業少なめ（月20時間以内）', '完全週休2日制', '年間休日120日以上', '有給休暇取得率が高い', '産休・育休取得実績あり', '時短勤務制度あり', '介護・看護休暇あり', '副業・兼業OK', '私服勤務OK', '勤務地選択可（地方・在宅勤務など）', '長期休暇制度あり（リフレッシュ・サバティカルなど）', '定時退社を推奨', '家庭・育児と両立しやすい環境'];
const benefitsOptions = ['社会保険完備', '通勤手当・交通費支給', '在宅勤務手当あり', '家賃補助・住宅手当あり', '家族手当あり', '賞与・ボーナスあり', '成果連動インセンティブあり', 'ストックオプション制度あり', '健康診断・人間ドック補助あり', '福利厚生サービス加入', '食事補助・社員食堂あり', '書籍・ツール購入補助あり', 'PC・デバイス支給（業務用）', '勤続表彰・特別休暇あり', '社員旅行・懇親イベントあり', '社内カフェ・フリードリンクあり', '資格手当・成果手当あり', '退職金制度あり', '定年後再雇用制度あり', '制服貸与'];
const atmosphereOptions = ['フラットな社風', 'チームワーク重視', '個人主義', '成果主義', '挑戦を歓迎する', '落ち着いた雰囲気', 'スピード感がある', 'オープンなコミュニケーション', '若手が活躍', 'ベテランが活躍', '男女問わず活躍', '多国籍チーム', 'リモート中心', 'オフィス出社中心', 'カジュアルな雰囲気', 'フォーマルな雰囲気'];
const organizationOptions = ['サステナビリティ・社会貢献を重視', '地域密着型の事業を展開', 'スタートアップ・ベンチャー志向', '安定成長志向', '社会課題解決をテーマにしている', 'AI・デジタル技術を積極活用', '顧客満足より「顧客成功」を重視', '働く人の多様性・個性を尊重', '社長・経営層と距離が近い', 'オープンで透明性のある経営'];
const desiredJobTypesList = ["営業・企画・マーケティング", "事務・管理", "販売・接客・サービス", "飲食・フード", "旅館・ホテル", "AI・IT・エンジニア", "クリエイティブ（デザイン・Webなど）", "製造・軽作業・工場", "建築・土木・設備", "配送・ドライバー", "医療・福祉", "保育園・幼稚園", "教育・講師", "専門職（士業・金融など）", "美容・理容・エステ", "農業・林業・畜産", "その他"];
const employmentTypeOptions = ["正社員", "契約社員", "アルバイト・パート", "業務委託"];
const salaryTypeOptions = ["年収", "時給", "月給"];
const remotePolicyOptions = [{ value: 'no', label: '出社必須' }, { value: 'hybrid', label: 'ハイブリッド可' }, { value: 'full', label: 'フルリモート可' }];
const ALL_DAYS = ['月', '火', '水', '木', '金', '土', '日']; 

// --- 型定義 ---
interface UserProfile {
    name: string;
    age: number | '';
    email: string;
    phoneNumber: string;
    currentJobTitle: string;
    skills: string; 
    workHistorySummary: string;
    desiredJobTypes: string[]; 
    desiredEmploymentType: string; 
    desiredSalaryType: string; 
    desiredSalaryMin: number | '';
    desiredSalaryMax: number | ''; 
    desiredLocation: string; 
    desiredRemotePolicy: string; 
    preferredWorkingHours: string; 
    preferredWorkingDays: string[]; 
    matchingValues: {
        growth: string[];
        wlb: string[];
        benefits: string[];
        atmosphere: string[];
        organization: string[];
    };
}

// 💡 ヘルパーコンポーネント: チェックボックスグループ
interface CheckboxGroupProps {
    title: string;
    category: keyof UserProfile['matchingValues'];
    options: string[];
    selectedValues: string[];
    onChange: (category: keyof UserProfile['matchingValues'], value: string) => void;
}

const CheckboxGroup: React.FC<CheckboxGroupProps> = ({ title, category, options, selectedValues, onChange }) => (
    <div className="border border-gray-200 p-4 rounded-lg bg-gray-50">
        <h3 className="text-lg font-bold text-gray-800 mb-3 border-b pb-2">{title}</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            {options.map((option) => (
                <label key={option} className="flex items-center space-x-2">
                    <input
                        type="checkbox"
                        checked={selectedValues.includes(option)}
                        onChange={() => onChange(category, option)}
                        className="form-checkbox text-indigo-600 rounded"
                    />
                    <span>{option}</span>
                </label>
            ))}
        </div>
    </div>
);


const UserProfilePage = () => {
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [step, setStep] = useState(1);
    const [isApplying, setIsApplying] = useState(false); 
    const [applyMessage, setApplyMessage] = useState<string | null>(null); 

    const [formData, setFormData] = useState<UserProfile>({
        name: '', age: '', email: '', phoneNumber: '', currentJobTitle: '', skills: '', workHistorySummary: '',
        desiredJobTypes: [], desiredEmploymentType: '正社員', desiredSalaryType: '年収', desiredSalaryMin: '',
        desiredSalaryMax: '', desiredLocation: '', desiredRemotePolicy: 'no', preferredWorkingHours: '',
        preferredWorkingDays: [],
        matchingValues: { growth: [], wlb: [], benefits: [], atmosphere: [], organization: [] },
    });

    // --- Firebase認証監視とデータ読み込み ---
    useEffect(() => {
        if (!router.isReady) return;
        const auth = getAuth();
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            if (currentUser) {
                setUser(currentUser);
                setFormData((prev) => ({ ...prev, email: currentUser.email || '' }));
                loadUserProfile(currentUser.uid);
            } else {
                router.push('/users/login');
            }
        });
        return () => unsubscribe();
    }, [router.isReady]);

    const loadUserProfile = async (uid: string) => {
        setLoading(true);
        setError(null); 
        
        try {
            const userRef = doc(db, 'userProfiles', uid);
            const snap = await getDoc(userRef);
            if (snap.exists()) {
                const data = snap.data();
                setFormData((prev) => ({
                    ...prev, ...data,
                    // null/undefinedを''に変換
                    age: data.age || '', desiredSalaryMin: data.desiredSalaryMin || '', desiredSalaryMax: data.desiredSalaryMax || '',
                    skills: data.skills || '', desiredEmploymentType: data.desiredEmploymentType || '正社員',
                    desiredSalaryType: data.desiredSalaryType || '年収', desiredRemotePolicy: data.desiredRemotePolicy || 'no',
                    desiredJobTypes: data.desiredJobTypes || [], preferredWorkingHours: data.preferredWorkingHours || '', 
                    preferredWorkingDays: data.preferredWorkingDays || [],
                    matchingValues: {
                        growth: data.matchingValues?.growth || [], wlb: data.matchingValues?.wlb || [], 
                        benefits: data.matchingValues?.benefits || [], atmosphere: data.matchingValues?.atmosphere || [], 
                        organization: data.matchingValues?.organization || [],
                    }
                }));
            }
        } catch (e) { 
            console.error('Firestore読み込みエラー:', e); 
            // 読み込みエラーが発生しても、フォームは初期値で表示を続ける
        }
        setLoading(false);
    };

    // --- フォーム操作ロジック ---
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        if (['age', 'desiredSalaryMin', 'desiredSalaryMax'].includes(name)) {
            // 入力が数値フィールドの場合は数値型を維持し、空文字の場合はそのまま維持
            setFormData((prev) => ({ ...prev, [name]: value === '' ? '' : Number(value) }));
        } else {
            setFormData((prev) => ({ ...prev, [name]: value }));
        }
    };

    const handleValueCheckboxChange = useCallback((category: keyof UserProfile['matchingValues'], value: string) => {
        setFormData((prev) => {
            const currentValues = prev.matchingValues[category] || []; 
            const newValues = currentValues.includes(value) ? currentValues.filter((v) => v !== value) : [...currentValues, value];
            return { ...prev, matchingValues: { ...prev.matchingValues, [category]: newValues } };
        });
    }, []);

    const handleJobTypeChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
        const selectedOptions = Array.from(e.target.selectedOptions).map((o) => o.value);
        setFormData((prev) => ({ ...prev, desiredJobTypes: selectedOptions }));
    }, []);
    
    const toggleDay = useCallback((day: string) => {
        setFormData(prev => {
            const currentDays = prev.preferredWorkingDays || [];
            const isSelected = currentDays.includes(day);
            const newDays = isSelected
                ? currentDays.filter(d => d !== day)
                : [...currentDays, day];
            return { ...prev, preferredWorkingDays: newDays.sort((a, b) => ALL_DAYS.indexOf(a) - ALL_DAYS.indexOf(b)) };
        });
    }, []);

    // 💡 プロフィール保存処理
    const handleSave = useCallback(async () => {
        if (!user) return false;
        setSaving(true);
        setError(null); 
        
        try {
            const userRef = doc(db, 'userProfiles', user.uid);
            
            // ★★★ 修正ロジック: 数値型が空文字のとき、確実に0として保存 ★★★
            const dataToSave = {
                ...formData, 
                // 空文字をNumber型として保存する前に0に変換
                desiredSalaryMin: formData.desiredSalaryMin === '' ? 0 : Number(formData.desiredSalaryMin),
                desiredSalaryMax: formData.desiredSalaryMax === '' ? 0 : Number(formData.desiredSalaryMax),
                age: formData.age === '' ? 0 : Number(formData.age),
                updatedAt: serverTimestamp() 
            };

            // setDocはawaitで待機し、確実にFirestoreに反映されるようにする
            await setDoc(userRef, dataToSave, { merge: true });
            setSaving(false);
            return true; 
        } catch (err: any) {
            setError(`保存中にエラーが発生しました: ${err.message}`);
            setSaving(false);
            return false; 
        }
    }, [user, formData]); // userとformDataが変更されたときのみ再生成

    // 💡 応募処理 (ステップ3から呼び出し - APIコールを削除し、リダイレクトのみ残す)
    const handleApplyFromReview = async () => {
        // 1. プロフィールを保存
        const saveSuccess = await handleSave();
        if (!saveSuccess) return; 

        // 2. 応募処理を実行 (リダイレクトのみ)
        setIsApplying(true);
        setApplyMessage(null);
        
        try {
            alert(`✅ プロフィールを保存しました。AI推薦求人を確認するため、ダッシュボードに移動します。`);
            router.push('/users/dashboard');
             
        } catch (e: any) {
             // エラーハンドリング (通常は到達しない)
             setApplyMessage(`❌ 処理中にエラーが発生しました: ${e.message}`);
        } finally {
             setIsApplying(false);
        }
    };


    // --- 必須項目チェック (useMemoで最適化) ---
    const isStep1Complete = useMemo(() => (
        !!formData.name && 
        // ageが空文字でなく、かつ0以上であること (0は許容)
        (formData.age !== '' && Number(formData.age) >= 0) && 
        String(formData.skills).trim().length > 0
    ), [formData.name, formData.age, formData.skills]);
    
    const isStep2Complete = useMemo(() => (
        formData.desiredJobTypes.length > 0 && 
        // desiredSalaryMax が空文字でなく、かつ0以上であること
        (formData.desiredSalaryMax !== '' && Number(formData.desiredSalaryMax) >= 0)
    ), [formData.desiredJobTypes, formData.desiredSalaryMax]);

    // --- ローディング中 ---
    if (loading) { return (<div className="flex justify-center items-center h-screen text-gray-600"><Loader2 className="animate-spin w-6 h-6 mr-2" /> 読み込み中...</div>); }

    // ----------------------------------------------------------------------
    // 💡 ステップ 3: 最終確認・応募画面 (価値観を完全に反映)
    // ----------------------------------------------------------------------
    const ReviewStep = () => {
        const salaryUnit = formData.desiredSalaryType === '年収' ? '万円' : '円';
        const remoteLabel = remotePolicyOptions.find(o => o.value === formData.desiredRemotePolicy)?.label || '未設定';

        // 💡 価値観データを整形するヘルパー関数
        const getFormattedValues = (category: keyof UserProfile['matchingValues']) => {
            const selected = formData.matchingValues[category];
            if (selected.length === 0) return '特に希望なし';
            // 選択肢が多すぎる場合は一部のみ表示
            return selected.slice(0, 3).join(', ') + (selected.length > 3 ? ` (+${selected.length - 3}項目)` : '');
        };
        
        const ReviewItem: React.FC<{ title: string; value: string | JSX.Element }> = ({ title, value }) => (
            <div className='grid grid-cols-5 py-2 px-4 text-sm'>
                <div className='font-semibold col-span-2'>{title}:</div>
                <div className='col-span-3'>{value}</div>
            </div>
        );


        return (
            <section className="space-y-8">
                <h2 className="text-2xl font-bold text-gray-900 border-b pb-3 flex items-center">
                    <RiEditBoxLine className="w-6 h-6 mr-3 text-green-500" />
                    ステップ 3/3: 最終確認と応募
                </h2>
                
                {/* 最終確認サマリーコンテナ */}
                <div className="border border-gray-200 rounded-lg divide-y divide-gray-100">
                    
                    {/* 基本情報 */}
                    <div className="p-4 bg-gray-100"><h3 className="font-bold text-lg text-gray-800">基本情報</h3></div>
                    <ReviewItem title='氏名' value={`${formData.name} (${formData.age}歳)`} />
                    <ReviewItem title='現在の職種' value={formData.currentJobTitle || 'なし'} />
                    <ReviewItem title='スキル概要' value={formData.skills.substring(0, 80) + (formData.skills.length > 80 ? '...' : '')} />
                    <ReviewItem title='職務経歴サマリー' value={formData.workHistorySummary || '記入なし'} />


                    {/* 希望条件 */}
                    <div className="p-4 bg-gray-100"><h3 className="font-bold text-lg text-gray-800">希望条件</h3></div>
                    <ReviewItem title='希望職種' value={formData.desiredJobTypes.join(', ') || '未設定'} />
                    <ReviewItem title='雇用形態' value={formData.desiredEmploymentType} />
                    <ReviewItem title='希望給与' value={`${formData.desiredSalaryMin}${salaryUnit} 〜 ${formData.desiredSalaryMax}${salaryUnit} (${formData.desiredSalaryType})`} />
                    <ReviewItem title='希望勤務地' value={`${formData.desiredLocation || '未設定'} (${remoteLabel})`} />
                    <ReviewItem title='勤務曜日' value={formData.preferredWorkingDays.join(', ') || '全曜日可'} />
                    <ReviewItem title='勤務時間' value={formData.preferredWorkingHours || '記入なし'} />

                    {/* 💡 マッチング価値観 (追加) */}
                    <div className="p-4 bg-gray-100"><h3 className="font-bold text-lg text-gray-800">AIマッチング価値観</h3></div>
                    <ReviewItem title='成長・教育' value={getFormattedValues('growth')} />
                    <ReviewItem title='働き方・WLB' value={getFormattedValues('wlb')} />
                    <ReviewItem title='福利厚生' value={getFormattedValues('benefits')} />
                    <ReviewItem title='社風・雰囲気' value={getFormattedValues('atmosphere')} />
                    <ReviewItem title='組織・事業姿勢' value={getFormattedValues('organization')} />

                </div>

                {/* 応募アクションエリア */}
                <div className="flex justify-between pt-4 border-t">
                    <button
                        type="button"
                        onClick={() => setStep(2)}
                        className="px-4 py-2 text-gray-600 font-bold rounded-md hover:bg-gray-100 flex items-center"
                    >
                        <RiArrowLeftLine className="mr-2" /> 戻る (修正)
                    </button>
                    <button
                        type="button" 
                        onClick={handleApplyFromReview}
                        disabled={isApplying || saving || !isStep1Complete || !isStep2Complete}
                        className="px-6 py-3 bg-indigo-600 text-white font-bold rounded-md hover:bg-indigo-700 disabled:bg-gray-400 flex items-center"
                    >
                        {isApplying || saving ? (
                            <><Loader2 className="animate-spin mr-2 w-4 h-4" />保存＆マッチング中...</>
                        ) : (
                            <><RiSendPlane2Line className="w-4 h-4 mr-2" />プロフィールを保存＆マッチングへ</>
                        )}
                    </button>
                </div>
                {applyMessage && <p className="text-center text-sm mt-3 text-red-500">{applyMessage}</p>}
            </section>
        );
    };
    
    // ----------------------------------------------------------------------
    // 💡 メインレンダリング
    // ----------------------------------------------------------------------
    return (
        <div className="min-h-screen bg-gray-50">
            <Head><title>求職者プロフィール編集</title></Head>

            <header className="bg-white shadow-sm sticky top-0 z-20">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <button onClick={() => router.push('/users/dashboard')} className="flex items-center text-sm text-gray-600 hover:text-gray-900 font-semibold">
                        <RiArrowLeftLine className="w-4 h-4 mr-2" /> ダッシュボードに戻る
                    </button>
                </div>
            </header>

            <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-6">あなたのプロフィール編集</h1>
                <p className="text-sm text-gray-600 mb-8">
                    以下の{step === 3 ? '内容を確認' : '3ステップで情報を入力'}してください。
                </p>

                {/* ★ 修正: このエラーは、主に「保存」に失敗した時に表示されるようになります */}
                {error && (<div className="p-4 mb-4 bg-red-100 text-red-700 rounded-md">{error}</div>)}
                
                {/* フォーム/レビューコンテナ */}
                <form className="bg-white p-8 rounded-lg shadow-xl space-y-6" onSubmit={(e) => { e.preventDefault(); if (step !== 3) setStep(step + 1); }}>
                    {step === 1 && (
                        /* --- ステップ 1: 基本情報・スキル --- */
                        <section className="space-y-6">
                            <h2 className="text-2xl font-bold text-gray-900 border-b pb-3 flex items-center">
                                <RiUserLine className="w-6 h-6 mr-3 text-indigo-500" /> ステップ 1/3: 基本情報・スキル
                            </h2>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* 氏名 */}
                                <div><label className="text-sm font-medium">氏名 *</label><input type="text" name="name" value={formData.name} onChange={handleChange} required className="w-full border rounded-md px-3 py-2"/></div>
                                {/* 年齢 */}
                                <div><label className="text-sm font-medium">年齢 *</label><input type="number" name="age" value={formData.age} onChange={handleChange} required className="w-full border rounded-md px-3 py-2"/></div>
                                {/* 電話番号 */}
                                <div><label className="text-sm font-medium">電話番号</label><input type="tel" name="phoneNumber" value={formData.phoneNumber} onChange={handleChange} className="w-full border rounded-md px-3 py-2"/></div>
                                 {/* 現在の職種 */}
                                <div><label className="text-sm font-medium">現在の職種</label><input type="text" name="currentJobTitle" value={formData.currentJobTitle} onChange={handleChange} className="w-full border rounded-md px-3 py-2"/></div>
                            </div>
                            {/* スキル (AIマッチング必須項目) */}
                            <div><label className="text-sm font-medium">スキル・経験概要 * (AIマッチング必須)</label><textarea name="skills" value={formData.skills} onChange={handleChange} required rows={4} placeholder="例: React/TypeScriptを3年、プロジェクトマネジメント経験あり、TOEIC 800点など" className="w-full border rounded-md px-3 py-2"/></div>
                            {/* 職務経歴サマリー */}
                            <div><label className="text-sm font-medium">職務経歴サマリー (任意)</label><textarea name="workHistorySummary" value={formData.workHistorySummary} onChange={handleChange} rows={4} className="w-full border rounded-md px-3 py-2"/></div>

                            <div className="flex justify-end pt-4 border-t">
                                <button type="submit" disabled={!isStep1Complete} className="px-6 py-3 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:bg-gray-400 flex items-center">
                                    次へ（希望条件）<RiArrowRightLine className="ml-2" />
                                </button>
                            </div>
                        </section>
                    )}
                    
                    {step === 2 && (
                        /* --- ステップ 2: 希望条件と価値観 --- */
                        <section className="space-y-8">
                            <h2 className="text-2xl font-bold text-gray-900 border-b pb-3 flex items-center">
                                <RiHeartPulseLine className="w-6 h-6 mr-3 text-red-500" /> ステップ 2/3: 希望条件とマッチング価値観
                            </h2>

                            {/* 希望スペック (AIマッチング必須項目) */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 rounded-lg bg-blue-50 border border-blue-200">
                                <div className="md:col-span-2"><h3 className="text-lg font-bold text-blue-800">AIマッチング最重要項目</h3></div>
                                
                                {/* 1. 希望職種 (AIマッチング必須項目) */}
                                <div>
                                    <label className="text-sm font-medium flex items-center mb-1"><RiBriefcase4Line className="mr-1" /> 希望職種 (複数選択可) *</label>
                                    <select name="desiredJobTypes" multiple required size={6} value={formData.desiredJobTypes} onChange={handleJobTypeChange} className="w-full border rounded-md px-3 py-2 h-40">
                                        {desiredJobTypesList.map((job) => (<option key={job} value={job}>{job}</option>))}
                                    </select>
                                    <p className="text-xs text-gray-500 mt-1">Ctrl/Commandキーで複数選択できます。</p>
                                </div>
                                
                                {/* 2. 希望給与と雇用形態 */}
                                <div className="space-y-4">
                                    {/* 希望雇用形態 */}
                                    <div><label className="text-sm font-medium flex items-center mb-1">希望雇用形態</label><select name="desiredEmploymentType" value={formData.desiredEmploymentType} onChange={handleChange} className="w-full border rounded-md px-3 py-2">
                                        {employmentTypeOptions.map((opt) => (<option key={opt} value={opt}>{opt}</option>))}</select></div>
                                    {/* 希望給与タイプ */}
                                    <div><label className="text-sm font-medium flex items-center mb-1">希望給与タイプ</label><select name="desiredSalaryType" value={formData.desiredSalaryType} onChange={handleChange} className="w-full border rounded-md px-3 py-2">
                                        {salaryTypeOptions.map((opt) => (<option key={opt} value={opt}>{opt}</option>))}</select></div>

                                    {/* 希望給与 (AIマッチング必須項目) */}
                                    <div>
                                        <label className="text-sm font-medium flex items-center mb-1"><RiMoneyDollarCircleLine className="mr-1" /> 希望給与 ({formData.desiredSalaryType} / {formData.desiredSalaryType === '年収' ? '万円' : '円'}) *</label>
                                        <div className="flex items-center space-x-2">
                                            <input type="number" name="desiredSalaryMin" value={formData.desiredSalaryMin} onChange={handleChange} placeholder="下限" className="w-full border rounded-md px-3 py-2 no-spinner"/>
                                            <span>〜</span>
                                            <input type="number" name="desiredSalaryMax" value={formData.desiredSalaryMax} onChange={handleChange} required placeholder="上限 (必須)" className="w-full border rounded-md px-3 py-2 no-spinner"/>
                                        </div>
                                    </div>
                                </div>

                                {/* 3. 希望リモートレベル / 勤務地 / 勤務時間 / 勤務曜日 */}
                                <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* 希望リモート許容レベル */}
                                    <div><label className="text-sm font-medium flex items-center mb-1"><RiComputerLine className="mr-1" /> 希望リモート許容レベル</label><select name="desiredRemotePolicy" value={formData.desiredRemotePolicy} onChange={handleChange} className="w-full border rounded-md px-3 py-2">
                                        {remotePolicyOptions.map((opt) => (<option key={opt.value} value={opt.value}>{opt.label}</option>))}</select></div>
                                    {/* 希望勤務地 */}
                                    <div><label className="text-sm font-medium flex items-center mb-1"><RiMapPinLine className="mr-1" /> 希望勤務地</label><input type="text" name="desiredLocation" value={formData.desiredLocation} onChange={handleChange} placeholder="例: 東京都、リモート可" className="w-full border rounded-md px-3 py-2"/></div>
                                    
                                    {/* 勤務時間（記入） */}
                                    <div><label className="text-sm font-medium flex items-center mb-1"><RiTimeLine className="mr-1" /> 希望勤務時間（記入）</label><input type="text" name="preferredWorkingHours" value={formData.preferredWorkingHours} onChange={handleChange} placeholder="例: 10:00〜16:00、週3日" className="w-full border rounded-md px-3 py-2"/></div>

                                    {/* 勤務曜日（印付け） */}
                                    <div>
                                        <label className="text-sm font-medium flex items-center mb-1"><RiCalendarLine className="mr-1" /> 希望勤務曜日</label>
                                        <div className="mt-1 flex flex-wrap gap-2">
                                            {ALL_DAYS.map(day => (<button key={day} type="button" onClick={() => toggleDay(day)} className={`px-4 py-2 text-sm font-medium rounded-full border transition-colors ${formData.preferredWorkingDays.includes(day) ? 'bg-indigo-600 text-white border-indigo-600 shadow-md hover:bg-indigo-700' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}>{day}</button>))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            {/* 価値観チェックボックス群 */}
                            <div className="space-y-6">
                                <p className="text-md font-semibold text-gray-700">AIマッチング要素：企業文化・価値観の希望</p>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    <CheckboxGroup title="成長・教育" category="growth" options={growthOptions} selectedValues={formData.matchingValues.growth} onChange={handleValueCheckboxChange}/>
                                    <CheckboxGroup title="働き方・WLB" category="wlb" options={wlbOptions} selectedValues={formData.matchingValues.wlb} onChange={handleValueCheckboxChange}/>
                                    <CheckboxGroup title="福利厚生" category="benefits" options={benefitsOptions} selectedValues={formData.matchingValues.benefits} onChange={handleValueCheckboxChange}/>
                                    <CheckboxGroup title="社風・雰囲気" category="atmosphere" options={atmosphereOptions} selectedValues={formData.matchingValues.atmosphere} onChange={handleValueCheckboxChange}/>
                                    <CheckboxGroup title="組織・事業姿勢" category="organization" options={organizationOptions} selectedValues={formData.matchingValues.organization} onChange={handleValueCheckboxChange}/>
                                </div>
                            </div>

                            <div className="flex justify-between pt-4 border-t">
                                <button type="button" onClick={() => setStep(1)} className="px-4 py-2 text-gray-600 font-bold rounded-md hover:bg-gray-100 flex items-center">
                                    <RiArrowLeftLine className="mr-2" /> 戻る
                                </button>
                                <button type="submit" disabled={!isStep2Complete} className="px-6 py-3 bg-indigo-600 text-white font-bold rounded-md hover:bg-indigo-700 disabled:bg-gray-400 flex items-center">
                                    次へ（最終確認）<RiArrowRightLine className="ml-2" />
                                </button>
                            </div>
                        </section>
                    )}
                    
                    {step === 3 && <ReviewStep />}
                </form>
            </main>
            
            {/* CSSの追加: input type="number"のスピナーボタンを非表示にする */}
            <style jsx global>{`
                .no-spinner::-webkit-outer-spin-button,
                .no-spinner::-webkit-inner-spin-button {-webkit-appearance: none; margin: 0;}
                .no-spinner {-moz-appearance: textfield;}
            `}</style>
        </div>
    );
};

export default UserProfilePage;