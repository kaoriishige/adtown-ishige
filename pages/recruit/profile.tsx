import { useRouter } from 'next/router';
import React, { useState, useEffect } from 'react';
import { getAuth, onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'; 
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage'; 
import { db, storage } from '@/lib/firebase'; 
import Head from 'next/head'; 

// ★ 修正: RiAlertFill, RiImageEditLine, RiCloseCircleLine, RiLoader4Line はアイコンとして使用するため、個別にインポート
import { RiAlertFill, RiImageEditLine, RiCloseCircleLine, RiLoader4Line } from 'react-icons/ri'; 

import Link from 'next/link'; // ★ 修正: Link をインポート
import {
    Loader2, Building, HeartHandshake, Camera, Video, X, ArrowLeft,
    AlertTriangle, Send, CheckSquare, ShieldCheck, ShieldAlert, RefreshCcw, 
    HelpCircle, TrendingUp
} from 'lucide-react'; 


// --- チェックボックスの選択肢 (企業全体に関するもののみ残す) ---
const atmosphereOptions = [
    "フラットな社風", "チームワーク重視", "個人主義", "成果主義", "挑戦を歓迎する",
    "落ち着いた雰囲気", "スピード感がある", "オープンなコミュニケーション", "若手が活躍",
    "ベテランが活躍", "男女問わず活躍", "多国籍チーム", "リモート中心", "オフィス出社中心",
    "カジュアルな雰囲気", "フォーマルな雰囲気"
];


const organizationOptions = [
    "サステナビリティ・社会貢献を重視", "地域密着型の事業を展開",
    "スタートアップ・ベンチャー志向", "安定成長志向",
    "社会課題解決をテーマにしている", "AI・デジタル技術を積極活用",
    "顧客満足より「顧客成功」を重視", "働く人の多様性・個性を尊重",
    "社長・経営層と距離が近い", "オープンで透明性のある経営"
];


// --- 型定義 ---
type VerificationStatus = 'unverified' | 'pending_review' | 'verified' | 'rejected';

interface CompanyProfile {
    companyName: string;
    address: string;
    phoneNumber: string;
    website: string;
    ourMission: string;
    whatWeDo: string;
    ourCulture: string;
    messageToCandidates: string;
    galleryImageUrls: string[];
    videoUrl: string;
    verificationStatus: VerificationStatus;
    aiFeedback: string;
    minMatchScore: number;
    appealPoints: {
        atmosphere: string[];
        organization: string[];
        growth?: string[]; 
        wlb?: string[];
        benefits?: string[];
    };
    // ★ isPaidは状態管理用として必要
    isPaid: boolean;
}


const CompanyProfilePage = () => {
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [error, setError] = useState<string | null>(null);
    
    // ★★★ 課金ステータス(isPaid)を state で管理 ★★★
    const [isPaid, setIsPaid] = useState(false);


    const [formData, setFormData] = useState<CompanyProfile>({
        companyName: '',
        address: '',
        phoneNumber: '',
        website: '',
        ourMission: '',
        whatWeDo: '',
        ourCulture: '',
        messageToCandidates: '',
        galleryImageUrls: [],
        videoUrl: '',
        verificationStatus: 'unverified',
        aiFeedback: '',
        minMatchScore: 60,
        appealPoints: {
            atmosphere: [],
            organization: [],
            // 初期値は空配列で設定するが、型定義はオプショナル
            growth: [], 
            wlb: [],
            benefits: []
        },
        isPaid: false, // 初期値
    });


    // --- Firebase認証状態の監視とデータ取得 ---
    useEffect(() => {
        const auth = getAuth();
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            if (currentUser) {
                setUser(currentUser);
                loadCompanyProfile(currentUser.uid);
            } else {
                router.push('/partner/login'); // 求人パートナーもパートナーログインを使用していると仮定
            }
        });
        return () => unsubscribe();
    }, [router]);


    // --- Firestoreからプロフィール読み込み (★★★ isPaid も取得) ★★★
    const loadCompanyProfile = async (uid: string) => {
        setLoading(true);
        // 許可されている 'users' ドキュメントを参照
        const userRef = doc(db, 'users', uid); 
        
        try {
            const userSnap = await getDoc(userRef);

            if (userSnap.exists()) {
                const data = userSnap.data();
                
                // ★ isPaid ステータスをセット (recruitSubscriptionStatus を参照)
                const isRecruitPaid = data.recruitSubscriptionStatus === 'Paid' || data.recruitSubscriptionStatus === 'active';
                setIsPaid(isRecruitPaid);

                // ★ 既存のプロフィール情報をセット (usersドキュメントに求人プロファイルデータが混在していると仮定)
                setFormData(prev => ({
                    ...prev,
                    // 課金ステータス
                    isPaid: isRecruitPaid,
                    // 求人プロファイルデータ (usersドキュメントから読み取る)
                    companyName: data.companyName || data.storeName || '', // companyNameがない場合 storeNameを使用
                    address: data.address || '',
                    phoneNumber: data.phoneNumber || '',
                    website: data.website || '',
                    ourMission: data.ourMission || '',
                    whatWeDo: data.whatWeDo || '',
                    ourCulture: data.ourCulture || '',
                    messageToCandidates: data.messageToCandidates || '',
                    galleryImageUrls: data.galleryImageUrls || [],
                    videoUrl: data.videoUrl || '',
                    verificationStatus: data.verificationStatus || 'unverified',
                    aiFeedback: data.aiFeedback || '',
                    minMatchScore: data.minMatchScore || 60,
                    appealPoints: {
                        atmosphere: data.appealPoints?.atmosphere || [],
                        organization: data.appealPoints?.organization || [],
                        growth: data.appealPoints?.growth || [],
                        wlb: data.appealPoints?.wlb || [],
                        benefits: data.appealPoints?.benefits || [],
                    }
                }));
            } else {
                // userドキュメントが存在しない場合
                setError("ユーザー情報が見つかりません。");
            }

        } catch (e) {
            console.error("Firestore読み込みエラー:", e);
            setError("データの読み込みに失敗しました。Firestoreの設定をご確認ください。");
        }
        setLoading(false);
    };


    // --- 入力変更 (変更なし) ---
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        if (name === 'minMatchScore') {
            const numValue = Number(value);
            const controlledValue = Math.max(60, Math.min(99, numValue));
            setFormData(prev => ({ ...prev, [name]: controlledValue }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };


    // --- チェックボックス変更 (変更なし) ---
    const handleAppealCheckboxChange = (category: keyof CompanyProfile['appealPoints'], value: string) => {
        setFormData(prev => {
            // オプショナルプロパティでも空配列を保証して操作
            const currentValues = prev.appealPoints[category] || []; 
            const newValues = currentValues.includes(value)
                ? currentValues.filter(item => item !== value)
                : [...currentValues, value];
            return { ...prev, appealPoints: { ...prev.appealPoints, [category]: newValues } };
        });
    };


    // --- 画像アップロード (フリーズ対策修正) ---
    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || !user) {
            setError("画像ファイルを選択してください。");
            return;
        }
        const files = Array.from(e.target.files);
        setIsUploading(true);
        setError(null);
        setUploadProgress(0);

        const uploadPromises = files.map(file => {
            const storageRef = ref(storage, `recruiters/${user.uid}/images/${Date.now()}_${file.name}`);
            const uploadTask = uploadBytesResumable(storageRef, file);
            
            // ★ FIX: ここで個別の Promise 内に try/catch を追加し、失敗しても Promise.all がハングしないようにする
            return new Promise<string>((resolve, reject) => {
                uploadTask.on('state_changed',
                    (snapshot: any) => setUploadProgress((snapshot.bytesTransferred / snapshot.totalBytes) * 100),
                    (error: any) => { 
                        console.error("Upload failed:", error);
                        // エラーを捕捉し、Promise を reject する
                        reject(error);
                    },
                    () => getDownloadURL(uploadTask.snapshot.ref).then(resolve).catch(reject)
                );
            });
        });

        Promise.allSettled(uploadPromises) // ★ FIX: allSettled を使用し、一つでも失敗しても全体がハングしないようにする
            .then(results => {
                const successfulUrls = results
                    .filter((res): res is PromiseFulfilledResult<string> => res.status === 'fulfilled')
                    .map(res => res.value);
                
                const failedCount = results.length - successfulUrls.length;

                setFormData(prev => ({
                    ...prev,
                    galleryImageUrls: [...prev.galleryImageUrls, ...successfulUrls]
                }));

                if (failedCount > 0) {
                     setError(`一部の画像（${failedCount}ファイル）のアップロードに失敗しました。ファイルサイズやStorageルールをご確認ください。`);
                } else if (successfulUrls.length > 0) {
                     // 成功メッセージは表示しない（保存ボタン押下時まで待つ）
                }
            })
            .catch(() => {
                // Promise.allSettled は catch に入らないため、実質 unused
            })
            .finally(() => {
                setIsUploading(false);
                setUploadProgress(0);
            });
    };


    // --- 画像削除 (変更なし) ---
    const removeImage = async (imageUrl: string) => {
        if (!window.confirm("この画像を削除しますか？")) return;
        try {
            const imageRef = ref(storage, imageUrl);
            await deleteObject(imageRef);
            setFormData(prev => ({
                ...prev,
                galleryImageUrls: prev.galleryImageUrls.filter(url => url !== imageUrl)
            }));
        } catch (error) {
            setError("画像の削除に失敗しました。時間をおいて再試行してください。");
            console.error("削除エラー:", error);
        }
    };


    // --- ★★★ 保存＆AI審査申請 (フリーズ対策済み) ★★★ ---
    const handleSaveAndSubmitForReview = async (e: React.FormEvent, isManualReset: boolean = false) => {
        e.preventDefault();
        if (!user) return;
        
        setSaving(true);
        setError(null);

        const appealPointsToSave: { [key: string]: string[] | undefined } = { ...formData.appealPoints };
        
        // 空の配列を Firestore に送るのを防ぐ (オプショナルなフィールド)
        if (appealPointsToSave.growth && appealPointsToSave.growth.length === 0) delete appealPointsToSave.growth;
        if (appealPointsToSave.wlb && appealPointsToSave.wlb.length === 0) delete appealPointsToSave.wlb;
        if (appealPointsToSave.benefits && appealPointsToSave.benefits.length === 0) delete appealPointsToSave.benefits;

        try {
            // 1. 'users' ドキュメントを更新
            const userRef = doc(db, 'users', user.uid);
            
            // isPaid を分解代入で安全に除外
            const { isPaid, ...formDataWithoutIsPaid } = formData; 

            const dataToSave = {
                ...(isManualReset ? {} : { 
                    ...formDataWithoutIsPaid, // isPaidを除外したプロファイルデータ
                    appealPoints: appealPointsToSave,
                }), 
                verificationStatus: 'pending_review' as VerificationStatus,
                aiFeedback: isManualReset ? 'AI審査を強制的に再実行します...' : 'AIが内容を審査中です... (通常、数分で完了します)',
                updatedAt: serverTimestamp()
            };
            
            // setDocでマージ書き込み
            await setDoc(userRef, dataToSave, { merge: true });
            
            // UIを更新
            setFormData(prev => ({...prev, verificationStatus: 'pending_review', aiFeedback: isManualReset ? 'AI審査を強制的に再実行します...' : 'AIが内容を審査中です...'}));


            // 2. AI審査APIの呼び出し
            const response = await fetch('/api/recruit/profile-review', { 
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ uid: user.uid })
            });
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: `HTTP Error: ${response.status}` }));
                throw new Error(errorData.error || `AI審査APIの呼び出しに失敗しました。(${response.status})`);
            }

            // 3. ユーザーに通知し、ダッシュボードへリダイレクト
            alert('✅ プロフィールを保存し、AI審査を開始しました。ダッシュボードに戻り、結果をご確認ください。');
            router.push('/recruit/dashboard');


        } catch (err: any) {
            setError(`エラーが発生しました: ${err.message}`);
            console.error("申請エラー:", err);
            
            setFormData(prev => ({...prev, verificationStatus: 'rejected', aiFeedback: 'システムエラーにより審査は中断されました。内容を確認し、再申請してください。'}));
        } finally {
            setSaving(false);
        }
    };
    
    // 💡 強制リセット用のヘルパー関数
    const handleManualReset = () => {
        if (window.confirm('AI審査がフリーズした場合、この操作で強制的に再審査を開始できます。フォーム内容は保存されません。続行しますか？')) {
            handleSaveAndSubmitForReview({ preventDefault: () => {} } as React.FormEvent, true); 
        }
    };


    // --- ステータス表示 ---
    const getStatusBanner = () => {
        switch (formData.verificationStatus) {
            case 'pending_review':
                return (
                    <div className="p-4 mb-8 bg-yellow-100 text-yellow-800 rounded-lg flex items-center text-sm">
                        <RefreshCcw className="w-5 h-5 mr-2 animate-spin" />{formData.aiFeedback}
                    </div>
                );
            case 'verified':
                return (
                    <div className="p-4 mb-8 bg-green-100 text-green-800 rounded-lg flex items-center text-sm">
                        <ShieldCheck className="w-5 h-5 mr-2" />{formData.aiFeedback || 'AIによって承認されました。このプロフィールは公開されています。'}
                    </div>
                );
            case 'rejected':
                return (
                    <div className="p-4 mb-8 bg-red-100 text-red-800 rounded-lg text-sm">
                        <div className="flex items-center font-bold">
                            <ShieldAlert className="w-5 h-5 mr-2" />AIからの修正指摘
                        </div>
                        <p className="mt-2 whitespace-pre-wrap">{formData.aiFeedback}</p>
                        <Link href="/trust-and-safety" className="mt-3 inline-flex items-center text-xs font-bold text-blue-700 hover:underline">
                            <HelpCircle size={14} className="mr-1" />AIの審査基準を確認する
                        </Link>
                    </div>
                );
            default:
                return (
                    <div className="p-4 mb-8 bg-gray-100 text-gray-800 rounded-lg text-sm">
                        プロフィールを入力し、「保存してAI登録審査を申請」をクリックしてください。
                    </div>
                );
        }
    };


    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <Loader2 className="animate-spin mr-2" /> 読み込み中...
            </div>
        );
    }


    return (
        <div className="min-h-screen bg-gray-50">
            <Head>
                <title>企業プロフィール編集</title>
            </Head>


            <header className="bg-white shadow-sm sticky top-0 z-20">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <button
                        onClick={() => router.push('/recruit/dashboard')}
                        className="flex items-center text-sm text-gray-600 hover:text-gray-900 font-semibold"
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" /> ダッシュボードに戻る
                    </button>
                </div>
            </header>


            <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                
                {/* 課金ステータス通知 */}
                {isPaid && (
                    <div className="p-4 mb-6 bg-indigo-100 text-indigo-800 rounded-lg font-bold">
                        ⭐︎ AIマッチング許容スコアを自由に設定できます。
                    </div>
                )}
                {!isPaid && (
                    <div className="p-4 mb-6 bg-yellow-100 text-yellow-800 rounded-lg">
                        AIマッチング許容スコアは**デフォルトの60点に固定**されています。自由に設定することができます。
                    </div>
                )}


                <form onSubmit={handleSaveAndSubmitForReview} className="bg-white p-8 rounded-lg shadow-md space-y-12">
                    {/* タイトルとボタン */}
                    <div className="flex justify-between items-start">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">企業プロフィールの編集</h1>
                            <p className="mt-2 text-sm text-gray-600">入力内容はAIにより審査され、求職者に信頼性の高い情報として表示されます。</p>
                        </div>
                        <button
                            type="submit"
                            disabled={saving || isUploading}
                            className="px-6 py-3 bg-indigo-600 text-white font-bold rounded-md hover:bg-indigo-700 disabled:bg-gray-400 flex items-center"
                        >
                            {saving ? <><Loader2 className="animate-spin mr-2" />AI審査中...</> : <><Send className="w-4 h-4 mr-2" />保存してAI登録審査を申請</>}
                        </button>
                    </div>


                    {getStatusBanner()}
                    
                    {/* 💡 強制リセットボタンのエリア */}
                    {formData.verificationStatus === 'pending_review' && (
                        <div className="mb-4 p-4 bg-gray-100 border border-gray-300 rounded-lg text-center">
                            <p className="text-sm font-semibold text-gray-700 mb-2">AI審査がフリーズした場合：</p>
                            <button
                                type="button" // フォーム送信を防ぐ
                                onClick={handleManualReset}
                                disabled={saving || !user}
                                className="inline-flex items-center px-4 py-2 bg-yellow-500 text-white font-bold rounded-md hover:bg-yellow-600 disabled:bg-gray-400 text-sm"
                            >
                                <RefreshCcw className="w-4 h-4 mr-2" />
                                強制的に審査をリセット・再実行する
                            </button>
                            <p className="text-xs text-gray-500 mt-2">※ フォーム内容は保存されません。最新の状態を取得し、審査を再開します。</p>
                        </div>
                    )}


                    {/* ★★★ マッチングスコア (★ 常にフォームを表示するように変更) ★★★ */}
                    <section className="space-y-4 p-6 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <h2 className="text-xl font-semibold text-yellow-800 flex items-center">
                            <TrendingUp className="w-5 h-5 mr-2" />AIマッチング許容スコア設定
                        </h2>
                        <p className="text-sm text-yellow-700">
                            応募者リストに表示されるための最低スコアです。60〜99点の範囲で設定できます。
                            高く設定するほど、マッチ度の高い候補者のみが表示されます。
                        </p>
                        <div className={`mt-4 ${!isPaid ? 'opacity-60 pointer-events-none' : ''}`}>
                            <label htmlFor="minMatchScore" className="block text-sm font-bold text-gray-700">
                                最低許容スコア (60〜99点)
                            </label>
                            <input
                                type="number"
                                id="minMatchScore"
                                name="minMatchScore"
                                value={formData.minMatchScore}
                                onChange={handleChange}
                                min="60"
                                max="99"
                                required
                                disabled={!isPaid} // 有料時のみ編集可能
                                className="mt-1 block w-32 px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-xl font-bold text-center"
                            />
                            <p className="text-xs text-gray-500 mt-1">※ 無料プランでは60点に固定されます。</p>
                        </div>
                    </section>
                    {/* ★★★ 変更ここまで ★★★ */}


                    {/* 基本情報 */}
                    <section className="space-y-6">
                        <h2 className="text-xl font-semibold border-b pb-2 text-gray-800 flex items-center">
                            <Building className="w-5 h-5 mr-3 text-gray-500" />基本情報
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label htmlFor="companyName" className="block text-sm font-medium text-gray-700">企業名・店舗名 *</label>
                                <input type="text" id="companyName" name="companyName" value={formData.companyName} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500" />
                            </div>
                            <div>
                                <label htmlFor="address" className="block text-sm font-medium text-gray-700">所在地 *</label>
                                <input type="text" id="address" name="address" value={formData.address} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500" />
                            </div>
                            <div>
                                <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700">電話番号</label>
                                <input type="tel" id="phoneNumber" name="phoneNumber" value={formData.phoneNumber} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500" />
                            </div>
                            <div>
                                <label htmlFor="website" className="block text-sm font-medium text-gray-700">ウェブサイトURL</label>
                                <input type="url" id="website" name="website" value={formData.website} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500" />
                            </div>
                        </div>
                    </section>


                    {/* 企業理念 */}
                    <section className="space-y-6">
                        <h2 className="text-xl font-semibold border-b pb-2 text-gray-800 flex items-center">
                            <HeartHandshake className="w-5 h-5 mr-3 text-gray-500" />企業の魅力・理念
                        </h2>
                        <div>
                            <label htmlFor="ourMission" className="block text-sm font-medium text-gray-700">Our Mission (私たちが目指すこと) *</label>
                            <p className="text-xs text-gray-500 mb-1">会社の存在意義や、社会にどのような価値を提供したいかを具体的に記述してください。</p>
                            <textarea id="ourMission" name="ourMission" value={formData.ourMission} onChange={handleChange} required rows={4} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500" />
                        </div>
                        <div>
                            <label htmlFor="whatWeDo" className="block text-sm font-medium text-gray-700">What We Do (事業内容) *</label>
                            <p className="text-xs text-gray-500 mb-1">どのような事業・サービスを展開しているかを、求職者に分かりやすく説明してください。</p>
                            <textarea id="whatWeDo" name="whatWeDo" value={formData.whatWeDo} onChange={handleChange} required rows={4} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500" />
                        </div>
                        <div>
                            <label htmlFor="ourCulture" className="block text-sm font-medium text-gray-700">Our Culture (文化・風土)</label>
                            <p className="text-xs text-gray-500 mb-1">職場の雰囲気、社員の働き方、コミュニケーションの取り方など、会社の文化を教えてください。</p>
                            <textarea id="ourCulture" name="ourCulture" value={formData.ourCulture} onChange={handleChange} rows={4} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500" />
                        </div>
                        <div>
                            <label htmlFor="messageToCandidates" className="block text-sm font-medium text-gray-700">未来の仲間へのメッセージ</label>
                            <p className="text-xs text-gray-500 mb-1">どのような人に仲間になってほしいか、候補者への期待を込めたメッセージをどうぞ。</p>
                            <textarea id="messageToCandidates" name="messageToCandidates" value={formData.messageToCandidates} onChange={handleChange} rows={4} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500" />
                        </div>
                    </section>


                    {/* アピールポイント (社風・組織のみ) */}
                    <section className="space-y-6">
                        <h2 className="text-xl font-semibold border-b pb-2 text-gray-800 flex items-center">
                            <CheckSquare className="w-5 h-5 mr-3 text-gray-500" />AIマッチング用 価値観・制度 (2項目のみ)
                        </h2>


                        {/* 🏢 社風・雰囲気 */}
                        <div className="p-4 border rounded-lg">
                            <h3 className="font-bold text-gray-700 mb-3">🏢 社風・雰囲気</h3>
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                {atmosphereOptions.map(option => (
                                    <label key={option} className="flex items-center space-x-2 text-sm">
                                        <input
                                            type="checkbox"
                                            checked={formData.appealPoints.atmosphere.includes(option)}
                                            onChange={() => handleAppealCheckboxChange('atmosphere', option)}
                                            className="rounded text-indigo-600 focus:ring-indigo-500"
                                        />
                                        <span>{option}</span>
                                    </label>
                                ))}
                            </div>
                        </div>


                        {/* 🌍 組織・事業 */}
                        <div className="p-4 border rounded-lg">
                            <h3 className="font-bold text-gray-700 mb-3">🌍 組織・事業</h3>
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                {organizationOptions.map(option => (
                                    <label key={option} className="flex items-center space-x-2 text-sm">
                                        <input
                                            type="checkbox"
                                            checked={formData.appealPoints.organization.includes(option)}
                                            onChange={() => handleAppealCheckboxChange('organization', option)}
                                            className="rounded text-indigo-600 focus:ring-indigo-500"
                                        />
                                        <span>{option}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                    </section>


                    {/* ギャラリー＆動画 */}
                    <section className="space-y-6">
                        <h2 className="text-xl font-semibold border-b pb-2 text-gray-800 flex items-center">
                            <Camera className="w-5 h-5 mr-3 text-gray-500" />ギャラリー＆動画
                        </h2>
                        <div>
                            <label htmlFor="videoUrl" className="block text-sm font-medium text-gray-700 flex items-center">
                                <Video className="w-4 h-4 mr-2" />紹介動画URL (YouTube, Vimeoなど)
                            </label>
                            <input type="url" id="videoUrl" name="videoUrl" value={formData.videoUrl} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500" placeholder="https://www.youtube.com/watch?v=..." />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">
                                職場やメンバーの写真をアップロード
                            </label>
                            <div className="mt-2 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                                <div className="space-y-1 text-center">
                                    <Camera className="mx-auto h-12 w-12 text-gray-400" />
                                    <div className="flex text-sm text-gray-600">
                                        <label htmlFor="file-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500">
                                            <span>ファイルを選択</span>
                                            <input id="file-upload" name="file-upload" type="file" className="sr-only" multiple onChange={handleImageUpload} accept="image/png, image/jpeg, image/gif" disabled={isUploading} />
                                        </label>
                                        <p className="pl-1">またはドラッグ＆ドロップ</p>
                                    </div>
                                    <p className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB</p>
                                </div>
                            </div>
                            {isUploading && (
                                <div className="w-full bg-gray-200 rounded-full h-2.5 mt-4">
                                    <div className="bg-indigo-600 h-2.5 rounded-full" style={{ width: `${uploadProgress}%` }}></div>
                                </div>
                            )}
                        </div>
                        {formData.galleryImageUrls.length > 0 && (
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {formData.galleryImageUrls.map((url, index) => (
                                    <div key={index} className="relative group">
                                        <img src={url} alt={`Gallery image ${index + 1}`} className="w-full h-32 object-cover rounded-md" />
                                        <button
                                            type="button"
                                            onClick={() => removeImage(url)}
                                            className="absolute top-1 right-1 bg-black bg-opacity-50 text-white rounded-full p-1 hover:bg-opacity-75"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>


                    {/* エラー表示と保存ボタン */}
                    {error && (
                        <div className="p-4 bg-red-100 text-red-700 rounded-md flex items-center">
                            <AlertTriangle className="w-5 h-5 mr-2" /> {error}
                        </div>
                    )}


                    <div className="pt-6 border-t border-gray-200 flex justify-end">
                        <button
                            type="submit"
                            disabled={saving || isUploading}
                            className="px-8 py-3 bg-indigo-600 text-white font-bold rounded-md hover:bg-indigo-700 disabled:bg-gray-400 flex items-center text-lg"
                        >
                            {saving ? <><Loader2 className="animate-spin mr-2" />AI審査中...</> : <><Send className="w-4 h-4 mr-2" />保存してAI登録審査を申請</>}
                        </button>
                    </div>
                </form>
            </main>
            <style jsx>{`.input { @apply block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500; } .checkbox { @apply h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500; }`}</style>
        </div>
    );
};


export default CompanyProfilePage;


