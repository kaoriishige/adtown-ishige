import { useState, useEffect, useCallback, useMemo, FC } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';

// Firebaseのインポート
import { db, auth, storage } from '../../lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import {
    collection, query, getDocs, doc,
    updateDoc, addDoc, serverTimestamp, arrayUnion, DocumentData, 
    Firestore // 型をインポート
} from 'firebase/firestore';
import {
    ref, uploadBytesResumable, getDownloadURL,
    FirebaseStorage // 型をインポート
} from 'firebase/storage';

import { v4 as uuidv4 } from 'uuid';
// ★ React Icons のインポート
import { RiFocus2Line, RiCheckLine } from 'react-icons/ri';

// ★★★ 外部ファイルのインポート ★★★
import { VALUE_QUESTIONS, QuestionSet, COMMON_QUESTIONS_GENERAL } from '../../lib/aiValueTemplate'; 
import { categoryData, mainCategories } from '../../lib/categoryData'; 

// グローバル変数の型を宣言
declare const __app_id: string;

// グローバル変数からアプリIDを取得
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

// *******************************************************
// プレースホルダー (変更なし)
// *******************************************************
const descriptionPlaceholders: { [key: string]: string } = {
    '飲食関連': '【お店のこだわり】\n例：地元那須の新鮮な野菜をたっぷり使ったイタリアンです。\n\n【おすすめメニュー】\n例：とちぎ和牛のグリル、季節野菜のバーニャカウダ\n\n【席数】\n例：30席（カウンター10席、テーブル20席）\n\n【個室】\n例：あり（4名様用×2室）\n\n【禁煙・喫煙】\n例：全席禁煙\n\n【駐車場】\n例：あり（10台）\n\n【営業時間】\n例：\n[月～金]\n11:00～15:00 (L.O. 14:30)\n17:00～22:00 (L.O. 21:30)\n[土・日・祝]\n11:00～22:00 (L.O. 21:30)\n\n【定休日】\n例：毎週水曜日、第2火曜日',
    '美容室・理容室': '【得意なスタイル】\n例：ショートカット、透明感のあるカラーリングが得意です。\n\n【お店の雰囲気】\n例：白を基調とした落ち着いた空間で、リラックスした時間をお過ごしいただけます。\n\n【席数】\n例：4席\n\n【駐車場】\n例：あり（店舗前に2台）\n\n【営業時間】\n例：\n平日 10:00～20:00\n土日祝 9:00～19:00\n\n【定休日】\n例：毎週火曜日',
    '整体・整骨院・鍼灸院': '【こんな症状はお任seください】\n例：長年の肩こりや腰痛、産後の骨盤矯正など、根本改善を目指します。\n\n【施術の特徴】\n例：一人ひとりの身体の状態に合わせたオーダーメイドの施術を行います。\n\n【設備】\n例：個室あり、着替え貸出あり\n\n【駐車場】\n例：あり（10台）\n\n【予約】\n例：完全予約制\n\n【営業時間】\n例：\n9:00～12:00 / 14:00～20:00\n\n【定休日】\n例：日曜日・祝日',
    'デフォルト': '【お店・会社の特徴】\n例：地域に根ざして50年。お客様一人ひとりに寄り添ったサービスを心がけています。\n\n【主なサービス内容】\n例：\n・〇〇の販売\n・〇〇の修理・メンテナンス\n\n【駐車場】\n例：あり（10台）\n\n【営業時間】\n例：\n9:00～18:00\n\n【定休日】\n例：土日祝',
};

// *******************************************************
// ヘルパー関数 (変更なし)
// *******************************************************
const getNormalizedIndustryKey = (main: string, sub: string): string => {
    const checkCategory = sub && sub !== 'その他' ? sub : main;
    if (checkCategory.includes('カフェ') || checkCategory.includes('喫茶店') || checkCategory.includes('パン屋')) return 'cafe';
    if (checkCategory.includes('レストラン') || checkCategory.includes('食堂') || checkCategory.includes('居酒屋') || checkCategory.includes('ラーメン') || checkCategory.includes('寿司')) return 'restaurant';
    if (checkCategory.includes('美容室') || checkCategory.includes('理容室')) return 'beauty';
    if (checkCategory.includes('整体') || checkCategory.includes('整骨院') || checkCategory.includes('鍼灸院')) return 'health';
    if (checkCategory.includes('ホテル') || checkCategory.includes('旅館') || checkCategory.includes('貸し別荘')) return 'lodging';
    if (main === 'スポーツ関連' || checkCategory.includes('sports') || checkCategory.includes('ジム') || checkCategory.includes('ゴルフ') || checkCategory.includes('フィットネス') || checkCategory.includes('道場')) return 'sports';
    if (checkCategory.includes('動物病院') || checkCategory.includes('ペット')) return 'pet_related';
    return 'general';
};

// *******************************************************
// 型定義 (変更あり)
// *******************************************************
interface IndustrySpecificData {
    seats?: string; // 飲食
    privateRooms?: string; // 飲食
    smoking?: 'yes' | 'no' | 'partial' | ''; // 飲食
    specialtyCut?: string; // 美容
}

// ★★★ 修正点1: 「3つの強み」の型をオブジェクトに変更 ★★★
interface SpecialtyPoint {
  title: string;
  description: string;
}

// ==========================================================
// ★ AIマッチングフォーム (価値観選択) (変更なし)
// ==========================================================
interface MatchingValuesFormProps {
    mainCategory: string;
    subCategory: string;
    selectedValues: string[];
    setSelectedValues: React.Dispatch<React.SetStateAction<string[]>>;
}

const MatchingValuesForm: FC<MatchingValuesFormProps> = ({
    mainCategory,
    subCategory,
    selectedValues,
    setSelectedValues,
}) => {
    
    // 1. 制限数を定義
    const MAX_CATEGORY_SELECTION = 3; // 各カテゴリで3個まで
    const MAX_CUSTOM_SELECTION = 10; // 自由入力は10個まで

    const [customValue, setCustomValue] = useState("");
    const [selectedItems, setSelectedItems] = useState<string[]>(selectedValues);

    useEffect(() => {
        setSelectedItems(selectedValues);
    }, [selectedValues]);

    // 2. 質問セットの取得ロジック 
    const getIndustryKey = (main: string, sub: string): string => {
        if (VALUE_QUESTIONS[sub]) {
            return sub;
        }
        const mainOtherKey = `${main}_その他`;
        if (VALUE_QUESTIONS[mainOtherKey]) {
            return mainOtherKey;
        }
        return "その他"; 
    };
    
    const industryKey = getIndustryKey(mainCategory, subCategory);
    const questions = VALUE_QUESTIONS[industryKey] || VALUE_QUESTIONS['その他'] || COMMON_QUESTIONS_GENERAL;
    
    // 全ての「定義済み選択肢」のリスト
    const allDefinedOptions = useMemo(() => {
        return questions ? Object.values(questions).flat() : [];
    }, [questions]);

    // 3. 選択肢がどの質問カテゴリに属するかを特定する
    const getQuestionTitleByValue = (value: string): string | null => {
        if (!questions) return null;
        for (const [title, options] of Object.entries(questions)) {
            if (options.includes(value)) {
                return title;
            }
        }
        return null;
    };


    // 4. トグル（選択・解除）処理
    const handleToggle = (value: string) => {
        const isSelected = selectedItems.includes(value);
        const questionTitle = getQuestionTitleByValue(value);
        
        let newItems: string[];

        if (isSelected) {
            newItems = selectedItems.filter((v) => v !== value);
        }
        else if (questionTitle) {
            const currentCategorySelections = selectedItems.filter(item =>
                getQuestionTitleByValue(item) === questionTitle
            ).length;

            if (currentCategorySelections >= MAX_CATEGORY_SELECTION) {
                alert(`「${questionTitle}」カテゴリでは、最大${MAX_CATEGORY_SELECTION}個までしか選択できません。`);
                return;
            }
            
            newItems = [...selectedItems, value];

        } else {
             newItems = selectedItems.filter((v) => v !== value);
        }
        
        setSelectedItems(newItems);
        setSelectedValues(newItems); 
    };


    // 5. 自由入力の追加処理
    const handleAddCustom = () => {
        if (!customValue.trim()) return;
        
        const currentCustomCount = selectedItems.filter(v => !allDefinedOptions.includes(v)).length;

        if (currentCustomCount >= MAX_CUSTOM_SELECTION) {
            alert(`自由入力は最大${MAX_CUSTOM_SELECTION}個まで登録可能です`);
            return;
        }

        if (!selectedItems.includes(customValue.trim())) {
            const newItems = [...selectedItems, customValue.trim()];
            setSelectedItems(newItems);
            setSelectedValues(newItems);
        }
        setCustomValue("");
    };


    const FocusIcon = () => (<RiFocus2Line className="w-6 h-6 mr-2" />);
    const CheckIcon = () => (<RiCheckLine className="w-5 h-5 inline-block mr-1" />);

    // 6. ボタンの無効化ロジック
    const isOptionDisabled = (optionValue: string): boolean => {
        if (selectedItems.includes(optionValue)) return false; 
        
        const questionTitle = getQuestionTitleByValue(optionValue);
        if (!questionTitle) return false; 
        
        const currentCategorySelections = selectedItems.filter(item =>
            getQuestionTitleByValue(item) === questionTitle
        ).length;

        return currentCategorySelections >= MAX_CATEGORY_SELECTION;
    };
    
    // 7. 現在の自由入力項目を抽出
    const customValues = selectedItems.filter(v => !allDefinedOptions.includes(v));


    return (
        <div className="border-4 border-indigo-500 p-6 rounded-xl bg-indigo-50 shadow-xl mt-8">
            <h2 className="text-xl md:text-2xl font-black text-indigo-800 mb-4 flex items-center">
                <FocusIcon />
                AIマッチング用 サービス（目的）別価値観登録
            </h2>

            <p className="text-sm text-gray-700 mb-6 border-b pb-3">
                小分類「
                <span className="font-semibold text-indigo-700">
                    {subCategory || "未選択"}
                </span>
                」に基づいた価値観質問です。
                各質問カテゴリ内で、**最大{MAX_CATEGORY_SELECTION}個まで**の強みを選択してください。
                <span className="font-bold text-red-600 ml-2">({selectedItems.length} 個選択中)</span>
                <span className="text-gray-500 ml-2">(フォーム全体の合計数)</span>
            </p>

            {questions && Object.entries(questions).map(([questionTitle, options], qIdx) => (
                <div key={qIdx} className="mb-6 p-4 bg-white rounded-lg shadow-sm">
                    <h3 className="font-bold text-indigo-700 mb-2">{questionTitle}</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {options.map((option: string, i: number) => { 
                            const isSelected = selectedItems.includes(option);
                            const isDisabled = isOptionDisabled(option);

                            return (
                                <button
                                    key={i}
                                    type="button"
                                    onClick={() => handleToggle(option)}
                                    disabled={isDisabled}
                                    className={`p-2 text-left rounded-md border transition-all flex items-center ${
                                        isSelected
                                            ? "bg-indigo-600 text-white border-indigo-600 shadow-md"
                                            : "bg-gray-50 hover:bg-indigo-50 border-gray-300 text-gray-700"
                                    } ${isDisabled ? "opacity-60 cursor-not-allowed" : ""}`}
                                >
                                    <span className="text-left font-medium">
                                        {isSelected && <RiCheckLine className="inline mr-1" />}
                                        {option}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            ))}


            {/* その他入力欄 */}
            <div className="mt-8 border-t pt-4">
                <label className="block font-semibold mb-3 text-gray-800 text-base">
                    その他（自由入力）
                </label>
                <p className="text-sm text-gray-600 mb-2">
                    上記の選択肢にない強み（例：ペット同伴可、子連れ歓迎 など）があれば追加してください。
                </p>

                <div className="flex flex-col sm:flex-row gap-3">
                    <input
                        type="text"
                        value={customValue}
                        onChange={(e) => setCustomValue(e.target.value)}
                        placeholder={`例：ペット同伴可 (最大${MAX_CUSTOM_SELECTION}個まで)`}
                        disabled={customValues.length >= MAX_CUSTOM_SELECTION}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-400 disabled:bg-gray-100"
                    />
                    <button
                        type="button"
                        onClick={handleAddCustom}
                        disabled={!customValue.trim() || customValues.length >= MAX_CUSTOM_SELECTION}
                        className="bg-indigo-600 text-white px-5 py-2 rounded-lg shadow hover:bg-indigo-700 disabled:bg-gray-400"
                    >
                        追加
                    </button>
                </div>


                {/* 入力したカスタム項目の確認表示 */}
                <div className="mt-4 flex flex-wrap gap-2">
                    {customValues.map((v: string, i: number) => (
                        <span key={`custom-${i}`} className="px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full text-sm font-medium flex items-center">
                            {v}
                            <button
                                type="button"
                                onClick={() => handleToggle(v)} // 自由入力アイテムも削除可能
                                className="ml-2 text-indigo-500 hover:text-indigo-800 font-bold"
                            >
                                &times;
                            </button>
                        </span>
                    ))}
                </div>
            </div>
        </div>
    );
};
// ==========================================================
// ★ メインのページコンポーネント (StoreProfilePage)
// ==========================================================
const StoreProfilePage: FC = () => {
    const router = useRouter();
    
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true); 
    const [isSaving, setIsSaving] = useState(false);
    const [storeId, setStoreId] = useState<string | null>(null);
    const [storeName, setStoreName] = useState('');
    const [address, setAddress] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [mainCategory, setMainCategory] = useState('');
    const [subCategory, setSubCategory] = useState('');
    const [otherMainCategory, setOtherMainCategory] = useState('');
    const [otherSubCategory, setOtherSubCategory] = useState('');
    const [subCategoryOptions, setSubCategoryOptions] = useState<string[]>([]);
    const [description, setDescription] = useState('');
    const [targetUserInterests, setTargetUserInterests] = useState('');
    
    // ★★★ 修正点2: Stateの型と初期値を変更 ★★★
    const [specialtyPoints, setSpecialtyPoints] = useState<SpecialtyPoint[]>([
      { title: '', description: '' },
      { title: '', description: '' },
      { title: '', description: '' },
    ]);

    const [lineOfficialId, setLineOfficialId] = useState('');
    const [lineLiffUrl, setLineLiffUrl] = useState('');
    const [websiteUrl, setWebsiteUrl] = useState('');
    const [snsUrls, setSnsUrls] = useState(['', '', '']);
    const [mainImageUrl, setMainImageUrl] = useState<string | null>(null);
    const [galleryImageUrls, setGalleryImageUrls] = useState<string[]>([]);
    const [mainImageFile, setMainImageFile] = useState<File | null>(null);
    const [galleryImageFiles, setGalleryImageFiles] = useState<File[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [industryData, setIndustryData] = useState<IndustrySpecificData>({});
    const [matchingValues, setMatchingValues] = useState<string[]>([]); // AIマッチング用価値観

    const descriptionPlaceholder = useMemo(() => {
        const key = subCategory.includes('整体') || subCategory.includes('整骨院') || subCategory.includes('鍼灸院')
            ? '整体・整骨院・鍼灸院'
            : mainCategory === '美容・健康関連'
            ? '美容室・理容室'
            : mainCategory === '飲食関連'
            ? '飲食関連'
            : 'デフォルト';
        return descriptionPlaceholders[key] || descriptionPlaceholders['デフォルト'];
    }, [mainCategory, subCategory]);


    // ★ 認証ロジック (変更なし)
    useEffect(() => {
        if (!auth || !auth.onAuthStateChanged) {
            console.error("Firebase Auth is not available.");
            setLoading(false);
            router.push('/partner/login');
            return;
        }
        
        const unsubscribe = onAuthStateChanged(auth, (currentUser: User | null) => {
            if (currentUser) {
                setUser(currentUser);
            } else {
                setUser(null);
                setLoading(false); 
                router.push('/partner/login');
            }
        });
        return () => unsubscribe();
    }, [router]);


    // ★ 店舗情報フェッチ (変更あり)
    const fetchStoreProfile = useCallback(async (currentUser: User) => {
        if (!currentUser || !db) {
            console.error("User or Firestore is not available.");
            setLoading(false);
            return;
        }
        
        try {
            const storesRef = collection(db as Firestore, 'artifacts', appId, 'users', currentUser.uid, 'stores');
            const q = query(storesRef);
            const querySnapshot = await getDocs(q);

            if (!querySnapshot.empty) {
                const storeDoc = querySnapshot.docs[0];
                const storeData: DocumentData = storeDoc.data();
                
                const loadedSubCategory = storeData.subCategory || '';

                setStoreId(storeDoc.id);
                setStoreName(storeData.storeName || '');
                setAddress(storeData.address || '');
                setPhoneNumber(storeData.phoneNumber || '');
                setMainCategory(storeData.mainCategory || '');
                setSubCategory(loadedSubCategory); 
                setOtherMainCategory(storeData.otherMainCategory || '');
                setOtherSubCategory(storeData.otherSubCategory || '');
                setDescription(storeData.description || '');
                setTargetUserInterests(storeData.targetUserInterests || '');
                
                // ★★★ 修正点3: 読み込みロジックを変更 (古いstring[]にも対応) ★★★
                const loadedData = storeData.specialtyPoints || [];
                let formattedPoints: SpecialtyPoint[];

                if (loadedData.length > 0 && typeof loadedData[0] === 'string') {
                    // 古い形式 (string[]) から新しい形式 (SpecialtyPoint[]) に変換
                    formattedPoints = (loadedData as string[]).map((title: string) => ({
                        title: title,
                        description: '', // 古いデータには説明がないため空にする
                    }));
                } else {
                    // 新しい形式 (SpecialtyPoint[])
                    formattedPoints = loadedData;
                }

                setSpecialtyPoints([
                    formattedPoints[0] || { title: '', description: '' },
                    formattedPoints[1] || { title: '', description: '' },
                    formattedPoints[2] || { title: '', description: '' },
                ]);
                // ★★★ 修正ここまで ★★★

                setLineOfficialId(storeData.lineOfficialId || '');
                setLineLiffUrl(storeData.lineLiffUrl || '');
                setWebsiteUrl(storeData.websiteUrl || '');
                setSnsUrls(storeData.snsUrls || ['', '', '']);
                setMainImageUrl(storeData.mainImageUrl || null);
                setGalleryImageUrls(storeData.galleryImageUrls || []);
                setIndustryData({
                    seats: storeData.seats || '',
                    privateRooms: storeData.privateRooms || '',
                    smoking: storeData.smoking || '',
                    specialtyCut: storeData.specialtyCut || '',
                });
                setMatchingValues(storeData.matchingValues || []);
            } else {
                setMatchingValues([]); // 新規作成時
            }
        } catch (err: any) {
            console.error("店舗情報の取得に失敗:", err);
            setError("店舗情報の読み込みに失敗しました。");
        } finally {
            setLoading(false); 
        }
    }, [appId]); 

    useEffect(() => {
        if (user) {
            fetchStoreProfile(user);
        }
    }, [user, fetchStoreProfile]);


    // ★ カテゴリ変更時のAIマッチング値リセット処理 (削除済み)
    useEffect(() => {
        if (mainCategory && categoryData[mainCategory as keyof typeof categoryData]) {
            setSubCategoryOptions(categoryData[mainCategory as keyof typeof categoryData]);
        } else {
            setSubCategoryOptions([]);
        }
        // setMatchingValues([]); // リセット処理を削除 (意図した動作)
    }, [mainCategory]);
    
    const handleSubCategoryChange = (newSubCategory: string) => {
        if (newSubCategory === subCategory) return;
        setSubCategory(newSubCategory);
        // setMatchingValues([]); // リセット処理を削除 (意図した動作)
    };

    // ----------------------------------------------------
    // その他ユーティリティハンドラー (変更あり)
    // ----------------------------------------------------

    const handleIndustryDataChange = (key: keyof IndustrySpecificData, value: string) => {
        setIndustryData(prev => ({ ...prev, [key]: value }));
    };

    const handleMainImageChange = (event: React.ChangeEvent<HTMLInputElement>) => { if (event.target.files && event.target.files[0]) { setMainImageFile(event.target.files[0]); } };
    const handleGalleryImagesChange = (event: React.ChangeEvent<HTMLInputElement>) => { if (event.target.files) { setGalleryImageFiles(prev => [...prev, ...Array.from(event.target.files!)]); } };
    
    const handleSnsUrlChange = (index: number, value: string) => { 
        setSnsUrls(prev => {
            const newSnsUrls = [...prev];
            newSnsUrls[index] = value;
            return newSnsUrls;
        });
    };

    // ★★★ 修正点4: 「3つの強み」用のハンドラを修正 ★★★
    const handleSpecialtyPointChange = (
      index: number,
      field: keyof SpecialtyPoint, // 'title' | 'description'
      value: string
    ) => {
      const newSpecialtyPoints = [...specialtyPoints];
      newSpecialtyPoints[index] = {
        ...newSpecialtyPoints[index],
        [field]: value,
      };
      setSpecialtyPoints(newSpecialtyPoints);
    };

    const handleDeleteImage = async (imageUrlToDelete: string, imageType: 'main' | 'gallery') => {
        if (!user || !storeId) {
            setError("エラーが発生しました。ページを再読み込みしてください。");
            return;
        }

        const customConfirm = (message: string): Promise<boolean> => {
            return new Promise((resolve) => {
                const messageBox = document.createElement('div');
                messageBox.innerHTML = `
                    <div style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 9999; display: flex; justify-content: center; align-items: center;">
                        <div style="background: white; padding: 20px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                            <p style="margin-top: 0; color: #333;">${message}</p>
                            <button id="confirm-delete-yes" style="margin-top: 15px; padding: 8px 15px; background: #dc3545; color: white; border: none; border-radius: 4px; cursor: pointer; margin-right: 10px;">削除する</button>
                            <button id="confirm-delete-no" style="margin-top: 15px; padding: 8px 15px; background: #6c757d; color: white; border: none; border-radius: 4px; cursor: pointer;">キャンセル</button>
                        </div>
                    </div>
                `;
                document.body.appendChild(messageBox);
                
                const handleYes = (e: Event) => { e.preventDefault(); messageBox.remove(); resolve(true); };
                const handleNo = (e: Event) => { e.preventDefault(); messageBox.remove(); resolve(false); };

                messageBox.querySelector('#confirm-delete-yes')?.addEventListener('click', handleYes);
                messageBox.querySelector('#confirm-delete-no')?.addEventListener('click', handleNo);
            });
        };

        const shouldDelete = await customConfirm("この写真を本当に削除しますか？この操作は元に戻せません。");
        if (!shouldDelete) {
            return;
        }

        setError(null);
        try {
            const token = await user.getIdToken();
            const response = await fetch('/api/partner/delete-image', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({ storeId, imageUrl: imageUrlToDelete, imageType }),
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || "削除に失敗しました。");
            }

            if (imageType === 'main') {
                setMainImageUrl(null);
            } else {
                setGalleryImageUrls(prev => prev.filter(url => url !== imageUrlToDelete));
            }
        } catch (err: any) {
            console.error("画像削除エラー:", err);
            setError(err.message);
        }
    };

    // ----------------------------------------------------
    // ★ 保存ロジック (変更あり)
    // ----------------------------------------------------
    const handleSaveProfile = async () => {
        if (!user || !db || !storage) {
            setError('ログインしていないか、Firebaseの初期化に失敗しました。');
            return;
        }

        // カテゴリの必須チェック
        if (!mainCategory) {
            setError('カテゴリ（大分類）は必須項目です。');
            setIsSaving(false);
            return;
        }

        if (mainCategory !== 'その他' && !subCategory) {
            setError('カテゴリ（小分類）は必須項目です。');
            setIsSaving(false);
            return;
        }
        
        if (mainCategory === 'その他' && !otherMainCategory) {
            setError('カテゴリ（大分類）で「その他」を選択した場合は、詳細なカテゴリ名を記入してください。');
            setIsSaving(false);
            return;
        }

        // AIマッチング価値観の必須チェック
        if (matchingValues.length === 0) {
            setError('AIマッチング用の価値観を1つ以上選択してください。');
            setIsSaving(false);
            return;
        }

        setIsSaving(true);
        setError(null);

        try {
            const firestore = db as Firestore;
            const storageInstance = storage as FirebaseStorage;

            const userStoresCollectionRef = collection(firestore, 'artifacts', appId, 'users', user.uid, 'stores');
            let currentStoreId = storeId;

            const normalizedIndustryKey = getNormalizedIndustryKey(mainCategory, subCategory);
            
            // ★★★ 修正点5: 保存時のフィルターロジックを変更 ★★★
            // タイトルが入力されているものだけを保存対象とする
            const filteredSpecialtyPoints = specialtyPoints.filter(
              p => p.title.trim() !== ''
            );

            // 1. Firestoreデータ保存
            const allStoreData = {
                storeName, address, phoneNumber, mainCategory, subCategory,
                otherMainCategory: mainCategory === 'その他' ? otherMainCategory : '',
                otherSubCategory: subCategory === 'その他' ? otherSubCategory : '',
                description, targetUserInterests, 
                specialtyPoints: filteredSpecialtyPoints, // ★ 修正したデータを保存
                matchingValues: matchingValues, 
                lineOfficialId: lineOfficialId, lineLiffUrl: lineLiffUrl, websiteUrl,
                snsUrls: snsUrls.filter(url => url.trim() !== ''), ownerId: user.uid, updatedAt: serverTimestamp(),
                normalizedIndustryKey: normalizedIndustryKey, ...industryData,
            };

            if (!currentStoreId) {
                const docRef = await addDoc(userStoresCollectionRef, { ...allStoreData, status: 'pending', createdAt: serverTimestamp(), mainImageUrl: '', galleryImageUrls: [] });
                currentStoreId = docRef.id;
                setStoreId(currentStoreId);
            } else {
                const storeDocRefForUpdate = doc(userStoresCollectionRef, currentStoreId);
                await updateDoc(storeDocRefForUpdate, allStoreData);
            }

            // 2. 画像のアップロードとFirestore更新
            let imageUploadFailed = false;
            let uploadErrorMessage = '';

            if (storage && currentStoreId) {
                const storeDocRef = doc(userStoresCollectionRef, currentStoreId);

                // メイン画像処理
                if (mainImageFile) {
                    try {
                        const uniqueFileName = `main_${uuidv4()}_${mainImageFile.name}`;
                        const storagePath = `users/${user.uid}/stores/${currentStoreId}/${uniqueFileName}`;
                        const fileRef = ref(storageInstance, storagePath);
                        const uploadTask = await uploadBytesResumable(fileRef, mainImageFile);
                        const updatedMainImageUrl = await getDownloadURL(uploadTask.ref);
                        await updateDoc(storeDocRef, { mainImageUrl: updatedMainImageUrl });
                        setMainImageUrl(updatedMainImageUrl);
                    } catch (err: any) {
                        imageUploadFailed = true;
                        uploadErrorMessage += `メイン画像のアップロードに失敗: ${err.message}\n`;
                        console.error("Main Image Upload Failed:", err);
                    }
                }

                // ギャラリー画像処理
                if (galleryImageFiles.length > 0) {
                    const newGalleryImageUrls: string[] = [];
                    for (const file of galleryImageFiles) {
                        try {
                            const uniqueFileName = `gallery_${uuidv4()}_${file.name}`;
                            const storagePath = `users/${user.uid}/stores/${currentStoreId}/${uniqueFileName}`;
                            const fileRef = ref(storageInstance, storagePath);
                            const uploadTask = await uploadBytesResumable(fileRef, file);
                            const downloadURL = await getDownloadURL(uploadTask.ref);
                            newGalleryImageUrls.push(downloadURL);
                        } catch (err: any) {
                            imageUploadFailed = true;
                            uploadErrorMessage += `ギャラリー画像 (${file.name}) のアップロードに失敗: ${err.message}\n`;
                            console.error(`Gallery Image Upload Failed (${file.name}):`, err);
                        }
                    }
                    if (newGalleryImageUrls.length > 0) {
                        await updateDoc(storeDocRef, { galleryImageUrls: arrayUnion(...newGalleryImageUrls) });
                        setGalleryImageUrls(prev => [...prev, ...newGalleryImageUrls]);
                    }
                }
            }

            setMainImageFile(null);
            setGalleryImageFiles([]);

            if (imageUploadFailed) {
                 setError(`店舗情報は保存されましたが、画像アップロード中にエラーが発生しました:\n\n${uploadErrorMessage}\n\n原因: Storageのルール、タイムアウト、またはネットワークの問題を確認してください。`);
            } else {
                 setError('店舗情報を保存しました。');
            }
            
            router.reload();

        } catch (err: any) {
            console.error("!!! SAVE FAILED !!! An error occurred in handleSaveProfile:", err);
            let errorMessage = `保存に失敗しました: ${err.message}`;
            if (err.code === 'permission-denied' || (err.code && err.code.includes('storage/unauthorized'))) {
                errorMessage += "\n\n【重要】Firebase Storage の権限エラーです。ルールを確認してください。";
            }
            setError(errorMessage);
        } finally {
            setIsSaving(false);
        }
    };


    // ----------------------------------------------------
    // UIレンダリングヘルパー (変更なし)
    // ----------------------------------------------------


    const RenderRestaurantFields = () => (
        <div className="mt-6 p-4 border rounded-md bg-white">
            <h3 className="font-bold text-lg mb-3 border-b pb-2">【飲食関連】詳細情報</h3>
            <div className="space-y-4">
                <div>
                    <label className="font-bold">総席数 (例: 30席)</label>
                    <input type="text" value={industryData.seats || ''} onChange={e => handleIndustryDataChange('seats', e.target.value)} className="w-full p-2 border rounded mt-1" placeholder="例: 30席" />
                </div>
                <div>
                    <label className="font-bold">個室の有無・席数 (例: 4名個室 x 2室)</label>
                    <input type="text" value={industryData.privateRooms || ''} onChange={e => handleIndustryDataChange('privateRooms', e.target.value)} className="w-full p-2 border rounded mt-1" placeholder="例: あり（4名用 x 2室）" />
                </div>
                <div>
                    <label className="font-bold">禁煙・喫煙</label>
                    <select value={industryData.smoking || ''} onChange={e => handleIndustryDataChange('smoking', e.target.value)} className="w-full p-2 border rounded mt-1">
                        <option value="">選択してください</option>
                        <option value="no">全席禁煙</option>
                        <option value="yes">全席喫煙可</option>
                        <option value="partial">分煙あり</option>
                    </select>
                </div>
            </div>
        </div>
    );


    const RenderBeautyFields = () => (
        <div className="mt-6 p-4 border rounded-md bg-white">
            <h3 className="font-bold text-lg mb-3 border-b pb-2">【美容・健康関連】詳細情報</h3>
            <div className="space-y-4">
                <div>
                    <label className="font-bold">特に得意なスタイル・施術</label>
                    <input type="text" value={industryData.specialtyCut || ''} onChange={e => handleIndustryDataChange('specialtyCut', e.target.value)} className="w-full p-2 border rounded mt-1" placeholder="例: ショートカット、産後の骨盤矯正" />
                </div>
            </div>
        </div>
    );


    const renderIndustrySpecificFields = () => {
        if (mainCategory === '飲食関連') return <RenderRestaurantFields />;
        if (mainCategory === '美容・健康関連' || subCategory.includes('整体') || subCategory.includes('整骨院') || subCategory.includes('鍼灸院')) return <RenderBeautyFields />;
        return null;
    };
    

    if (loading) return <div>読み込み中...</div>;


    return (
        <div className="container mx-auto p-4 md:p-8 max-w-3xl">
            <h1 className="text-2xl font-bold mb-6 text-gray-800">店舗プロフィールの登録・編集</h1>
            
            
            <div className="space-y-8">
                {/* 1. 基本情報 (変更なし) */}
                <div className="space-y-6 p-4 border rounded-md bg-white shadow-sm">
                    <h2 className="text-xl font-bold border-b pb-2 text-gray-700">基本情報・カテゴリ</h2>
                    <div><label className="font-bold">店舗名 *</label><input type="text" value={storeName} onChange={(e) => setStoreName(e.target.value)} className="w-full p-2 border rounded mt-1" /></div>
                    <div><label className="font-bold">住所 *</label><input type="text" value={address} onChange={(e) => setAddress(e.target.value)} className="w-full p-2 border rounded mt-1" /></div>
                    {address && ( <div className="mt-4"><iframe width="100%" height="300" style={{ border: 0 }} loading="lazy" allowFullScreen src={`https://maps.google.co.jp/maps?output=embed&q=${encodeURIComponent(address)}`}></iframe></div> )}
                    
                    <div>
                        <label className="font-bold">電話番号 *</label>
                        <p className="text-sm text-gray-600 font-medium">※ ユーザー向けの店舗詳細ページに表示されます。</p>
                        <input 
                            type="text" 
                            value={phoneNumber} 
                            onChange={(e) => setPhoneNumber(e.target.value)} 
                            className="w-full p-2 border rounded mt-1" 
                            placeholder="例: 0287-XX-XXXX"
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border rounded-md bg-gray-50">
                        <div>
                            <label className="font-bold">カテゴリ（大分類）*</label>
                            <select value={mainCategory} onChange={e => setMainCategory(e.target.value)} className="w-full p-2 border rounded mt-1">
                                <option value="">選択してください</option>
                                {mainCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                            </select>
                            {mainCategory === 'その他' && ( <input type="text" value={otherMainCategory} onChange={e => setOtherMainCategory(e.target.value)} placeholder="カテゴリ名を入力" className="w-full p-2 border rounded mt-2"/> )}
                        </div>
                        <div>
                            <label className="font-bold">カテゴリ（小分類）*</label>
                            <select
                                value={subCategory}
                                onChange={e => handleSubCategoryChange(e.target.value)}
                                disabled={!mainCategory}
                                className="w-full p-2 border rounded mt-1 disabled:bg-gray-100"
                            >
                                <option value="">大分類を先に選択</option>
                                {subCategoryOptions.map(sub => <option key={sub} value={sub}>{sub}</option>)}
                            </select>
                            {subCategory === 'その他' && ( <input type="text" value={otherSubCategory} onChange={e => setOtherSubCategory(e.target.value)} placeholder="カテゴリ名を入力" className="w-full p-2 border rounded mt-2"/> )}
                        </div>
                    </div>
                </div>

                {/* 2. サービス（目的）別価値観登録 (変更なし) */}
                {subCategory && (
                    <MatchingValuesForm
                        mainCategory={mainCategory}
                        subCategory={subCategory}
                        selectedValues={matchingValues}
                        setSelectedValues={setMatchingValues}
                    />
                )}

                {/* 3. 店舗紹介と特化ポイント (変更あり) */}
                <div className="space-y-6 p-4 border rounded-md bg-white shadow-sm">
                    <h2 className="text-xl font-bold border-b pb-2 text-gray-700">店舗紹介・強み・詳細情報</h2>
                    <div>
                        <div className="flex justify-between items-center mb-1">
                            <div>
                                <label className="font-bold">店舗紹介文・営業時間（詳しくお書きください）</label>
                                <p className="text-sm text-gray-500 mt-1">営業時間や定休日、**駐車場の有無**もこちらにご記入ください。</p>
                            </div>
                            <button type="button" onClick={() => setDescription(descriptionPlaceholder)} className="bg-blue-500 text-white text-sm font-bold py-2 px-4 rounded hover:bg-blue-600 transition-colors">テンプレートを貼り付け</button>
                        </div>
                        <textarea value={description} onChange={e => setDescription(e.target.value)} className="w-full p-2 border rounded mt-1" rows={15} placeholder="カテゴリを選択後、「テンプレートを貼り付け」ボタンを押すと入力が簡単になります。"></textarea>
                    </div>

                    {renderIndustrySpecificFields()}

                    {/* ★★★ 修正点6: 「3つの強み」のJSXを変更 ★★★ */}
                    <div className="border p-4 rounded-md bg-yellow-50">
                        <label className="font-bold block mb-3 text-lg text-yellow-800">貴店の特化ポイント（3つの強み）</label>
                        <p className="text-sm text-gray-600 mb-3">
                            アプリの店舗一覧や AI マッチングの際、ユーザーが店舗を判断する最重要ポイントとして表示されます。
                        </p>
                        
                        <div className="space-y-4">
                            {specialtyPoints.map((point, index) => (
                                <div key={index} className="p-3 border bg-white rounded shadow-sm">
                                    <label className="text-gray-600 font-semibold text-base">強み {index + 1}</label>
                                    <div className="mt-2">
                                        <label className="text-sm font-bold text-gray-700">タイトル (必須)</label>
                                        <input
                                            type="text"
                                            value={point.title}
                                            onChange={e => handleSpecialtyPointChange(index, 'title', e.target.value)}
                                            className="w-full p-2 border rounded mt-1"
                                            placeholder={
                                                index === 0 ? "例：AIコンサルティング" : 
                                                index === 1 ? "例：脳科学マーケティング" : 
                                                "例：企業課題解決アプリ開発"
                                            }
                                            maxLength={50}
                                        />
                                    </div>
                                    <div className="mt-2">
                                        <label className="text-sm font-bold text-gray-700">説明文 (任意)</label>
                                        <textarea
                                            value={point.description}
                                            onChange={e => handleSpecialtyPointChange(index, 'description', e.target.value)}
                                            className="w-full p-2 border rounded mt-1"
                                            rows={2}
                                            placeholder="例：プロフィールで設定された貴店の最も重要な強みです。"
                                            maxLength={100}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>

                        <p className="text-xs text-gray-500 mt-2">※ 最大3つまで、簡潔に記入してください。タイトルは必須です。</p>
                    </div>
                    {/* ★★★ 修正ここまで ★★★ */}

                    <div>
                        <label className="font-bold">希望するターゲット層の関心事 (AI補足情報)</label>
                        <p className="text-sm text-gray-500 mt-1">
                            AIが、貴店が獲得したい顧客の具体的な興味や関心（例: オーガニック、ペット愛好家、子育て世代など）を学習するための補足情報です。（任意）
                        </p>
                        <textarea
                            value={targetUserInterests}
                            onChange={e => setTargetUserInterests(e.target.value)}
                            className="w-full p-2 border rounded mt-1"
                            rows={3}
                            placeholder="例：週末に体験イベントに参加したいアクティブな層、価格よりも品質を重視する層など。"
                        />
                    </div>
                </div>

                {/* 4. 画像・SNS・連携情報 (変更なし) */}
                <div className="space-y-6 p-4 border rounded-md bg-white shadow-sm">
                    <h2 className="text-xl font-bold border-b pb-2 text-gray-700">画像・SNS・連携情報</h2>

                    {/* LINE連携情報 */}
                    <div className="border p-4 rounded-md bg-green-50">
                        <h3 className="font-bold text-lg mb-3 border-b pb-2 text-green-700">LINE連携情報</h3>
                        <div className="space-y-3">
                            <div>
                                <label className="font-bold">LINE 公式アカウントID</label>
                                <input type="text" value={lineOfficialId} onChange={e => setLineOfficialId(e.target.value)} className="w-full p-2 border rounded mt-1" placeholder="@を含めたIDを入力してください（例: @xxxxxxxxx）" />
                            </div>
                            <div>
                                <label className="font-bold">LINE 友だち追加/LIFF URL</label>
                                <input type="url" value={lineLiffUrl} onChange={e => setLineLiffUrl(e.target.value)} className="w-full p-2 border rounded mt-1" placeholder="https://lin.ee/xxxxxx または LIFF URL" />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="font-bold">ホームページトップ画像 (1枚)</label>
                        <p className="text-sm text-gray-500">推奨サイズ: 横1200px × 縦675px (16:9)</p>
                        <div className="p-2 border rounded min-h-[100px]">
                            {(mainImageUrl || mainImageFile) ? (
                                <div className="relative inline-block">
                                    <img src={mainImageFile ? URL.createObjectURL(mainImageFile) : mainImageUrl!} alt="トップ画像プレビュー" className="w-48 h-auto rounded" />
                                    <button type="button" onClick={() => { if (mainImageFile) { setMainImageFile(null); const input = document.getElementById('main-image-input') as HTMLInputElement; if (input) input.value = ''; } else if (mainImageUrl) { handleDeleteImage(mainImageUrl, 'main'); } }} className="absolute top-0 right-0 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center -m-2">X</button>
                                </div>
                            ) : ( <p className="text-gray-400">まだ画像はありません。</p> )}
                        </div>
                        <input type="file" accept="image/*" onChange={handleMainImageChange} className="text-sm" id="main-image-input" />
                    </div>
                    <div className="space-y-2">
                        <label className="font-bold">ギャラリー写真 (店舗の雰囲気・サービス風景、複数可)</label>
                        <p className="text-sm text-gray-500">推奨サイズ: 横800px × 縦800px (1:1)</p>
                        <div className="p-2 border rounded min-h-[112px] flex flex-wrap gap-2">
                            {galleryImageUrls && galleryImageUrls.filter(url => url).map((url, index) => (
                                <div key={index} className="relative">
                                    <img src={url} alt={`ギャラリー画像 ${index + 1}`} className="w-24 h-24 object-cover rounded" onError={(e) => { (e.target as HTMLImageElement).parentElement!.style.display = 'none'; }} />
                                    <button type="button" onClick={() => handleDeleteImage(url, 'gallery')} className="absolute top-[-5px] right-[-5px] bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs">X</button>
                                </div>
                            ))}
                            {galleryImageFiles.map((file, index) => (
                                <div key={index} className="relative">
                                    <img src={URL.createObjectURL(file)} alt={`新規ギャラリー画像 ${index + 1}`} className="w-24 h-24 object-cover rounded"/>
                                    <button type="button" onClick={() => setGalleryImageFiles(galleryImageFiles.filter((_, i) => i !== index))} className="absolute top-[-5px] right-[-5px] bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs">X</button>
                                </div>
                            ))}
                            {galleryImageUrls.filter(url => url).length === 0 && galleryImageFiles.length === 0 && (<p className="text-gray-400">まだ写真はありません。</p>)}
                        </div>
                        <input type="file" accept="image/*" onChange={handleGalleryImagesChange} className="text-sm" />
                    </div>

                    <div><label className="font-bold">公式ウェブサイトURL</label><input type="url" value={websiteUrl} onChange={e => setWebsiteUrl(e.target.value)} className="w-full p-2 border rounded mt-1" placeholder="https://..." /></div>
                    <div><label className="font-bold">SNS URL 1</label><input type="url" value={snsUrls[0]} onChange={e => handleSnsUrlChange(0, e.target.value)} className="w-full p-2 border rounded mt-1" placeholder="https://..." /></div>
                    <div><label className="font-bold">SNS URL 2</label><input type="url" value={snsUrls[1]} onChange={e => handleSnsUrlChange(1, e.target.value)} className="w-full p-2 border rounded mt-1" placeholder="https://..." /></div>
                    <div><label className="font-bold">SNS URL 3</label><input type="url" value={snsUrls[2]} onChange={e => handleSnsUrlChange(2, e.target.value)} className="w-full p-2 border rounded mt-1" placeholder="." /></div>
                </div>


                {/* 5. 保存ボタン (変更なし) */}
                <button onClick={handleSaveProfile} disabled={isSaving} className="w-full px-6 py-3 bg-green-600 text-white text-xl font-bold rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition-colors shadow-lg">
                    {isSaving ? '保存中...' : '店舗情報をすべて保存する'}
                </button>
                
                {error && (
                    <p className={`my-4 p-3 rounded whitespace-pre-wrap ${error === '店舗情報を保存しました。' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-500'}`}>
                        {error}
                    </p>
                )}

            </div>


            <div className="mt-8">
                <Link href="/partner/dashboard" legacyBehavior>
                    <a className="text-blue-600 hover:underline">← ダッシュボードに戻る</a>
                </Link>
            </div>
        </div>
    );
};

export default StoreProfilePage;