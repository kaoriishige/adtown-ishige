import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { db, auth, storage } from '../../lib/firebase';
import {
    collection, query, getDocs, doc, updateDoc, addDoc, serverTimestamp, arrayUnion, where // whereをインポート
} from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { onAuthStateChanged, User } from 'firebase/auth';
import { v4 as uuidv4 } from 'uuid';

// グローバル変数の型を宣言
declare const __app_id: string;

// グローバル変数からアプリIDを取得
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

// カテゴリデータ (省略していません)
const categoryData = {
    "飲食関連": ["レストラン・食堂", "カフェ・喫茶店", "居酒屋・バー", "パン屋（ベーカリー）", "和菓子・洋菓子店", "ラーメン店", "そば・うどん店", "寿司屋", "その他"],
    "買い物関連": ["農産物直売所・青果店", "精肉店・鮮魚店", "個人経営の食料品店", "酒店", "ブティック・衣料品店", "雑貨店・民芸品店", "書店", "花屋", "お土産店", "その他"],
    "美容・健康関連": ["美容室・理容室", "ネイルサロン", "エステサロン", "リラクゼーション・マッサージ", "整体・整骨院・鍼灸院", "個人経営の薬局", "クリニック・歯科医院", "その他"],
    "住まい・暮らし関連": ["工務店・建築・リフォーム", "水道・電気工事", "不動産会社", "クリーニング店", "造園・植木屋", "便利屋", "その他"],
    "教育・習い事関連": ["学習塾・家庭教師", "ピアノ・音楽教室", "英会話教室", "書道・そろばん教室", "スポーツクラブ・道場", "パソコン教室", "料理教室", "その他"],
    "車・バイク関連": ["自動車販売店・自動車整備・修理工場", "ガソリンスタンド", "バイクショップ", "その他"],
    "観光・レジャー関連": ["ホテル・旅館・ペンション", "日帰り温泉施設", "観光施設・美術館・博物館", "体験工房（陶芸・ガラスなど）", "牧場・農園", "キャンプ場・グランピング施設", "ゴルフ場", "貸し別荘", "その他"],
    "ペット関連": ["動物病院", "トリミングサロン", "ペットホテル・ドッグラン", "その他"],
    "専門サービス関連": ["弁護士・税理士・行政書士などの士業", "デザイン・印刷会社", "写真館", "保険代理店", "カウンセリング", "コンサルティング", "その他"],
    "その他": ["その他"],
};
const mainCategories = Object.keys(categoryData);

// 店舗紹介文のテンプレート
const descriptionPlaceholders: { [key: string]: string } = {
    '飲食関連': '【お店のこだわり】\n例：地元那須の新鮮な野菜をたっぷり使ったイタリアンです。\n\n【おすすめメニュー】\n例：とちぎ和牛のグリル、季節野菜のバーニャカウダ\n\n【席数】\n例：30席（カウンター10席、テーブル20席）\n\n【個室】\n例：あり（4名様用×2室）\n\n【禁煙・喫煙】\n例：全席禁煙\n\n【駐車場】\n例：あり（10台）\n\n【営業時間】\n例：\n[月～金]\n11:00～15:00 (L.O. 14:30)\n17:00～22:00 (L.O. 21:30)\n[土・日・祝]\n11:00～22:00 (L.O. 21:30)\n\n【定休日】\n例：毎週水曜日、第2火曜日',
    '美容室・理容室': '【得意なスタイル】\n例：ショートカット、透明感のあるカラーリングが得意です。\n\n【お店の雰囲気】\n例：白を基調とした落ち着いた空間で、リラックスした時間をお過ごしいただけます。\n\n【席数】\n例：4席\n\n【駐車場】\n例：あり（店舗前に2台）\n\n【営業時間】\n例：\n平日 10:00～20:00\n土日祝 9:00～19:00\n\n【定休日】\n例：毎週火曜日',
    '整体・整骨院・鍼灸院': '【こんな症状はお任せください】\n例：長年の肩こりや腰痛、産後の骨盤矯正など、根本改善を目指します。\n\n【施術の特徴】\n例：一人ひとりの身体の状態に合わせたオーダーメイドの施術を行います。\n\n【設備】\n例：個室あり、着替え貸出あり\n\n【予約】\n例：完全予約制\n\n【営業時間】\n例：\n9:00～12:00 / 14:00～20:00\n\n【定休日】\n例：日曜日・祝日',
    'デフォルト': '【お店・会社の特徴】\n例：地域に根ざして50年。お客様一人ひとりに寄り添ったサービスを心がけています。\n\n【主なサービス内容】\n例：\n・〇〇の販売\n・〇〇の修理・メンテナンス\n\n【営業時間】\n例：\n9:00～18:00\n\n【定休日】\n例：土日祝',
};

const EditStorePage = () => { // コンポーネント名を変更
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
    const [websiteUrl, setWebsiteUrl] = useState('');
    const [snsUrls, setSnsUrls] = useState(['', '', '']);
    const [mainImageUrl, setMainImageUrl] = useState<string | null>(null);
    const [galleryImageUrls, setGalleryImageUrls] = useState<string[]>([]);
    const [mainImageFile, setMainImageFile] = useState<File | null>(null);
    const [galleryImageFiles, setGalleryImageFiles] = useState<File[]>([]);
    const [error, setError] = useState<string | null>(null);
    
    const descriptionPlaceholder = useMemo(() => {
        if (mainCategory.includes('美容') || mainCategory.includes('健康')) return descriptionPlaceholders['美容室・理容室'];
        if (subCategory.includes('整体') || subCategory.includes('整骨院')) return descriptionPlaceholders['整体・整骨院・鍼灸院'];
        if (mainCategory === '飲食関連') return descriptionPlaceholders['飲食関連'];
        return descriptionPlaceholders['デフォルト'];
    }, [mainCategory, subCategory]);


    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            if (currentUser) {
                setUser(currentUser);
            } else {
                router.push('/partner/login');
            }
        });
        return () => unsubscribe();
    }, [router]);

    const fetchStoreProfile = useCallback(async (currentUser: User) => {
        if (!currentUser) return;
        setLoading(true);
        try {
            // 🟢 修正点 1: 読み込み先を 'ads' コレクションに変更
            const adsRef = collection(db, 'ads');
            // 🟢 修正点 2: ログインユーザーのID (ownerId) でフィルタリング
            const q = query(adsRef, where('ownerId', '==', currentUser.uid));
            const querySnapshot = await getDocs(q);

            if (!querySnapshot.empty) {
                const storeDoc = querySnapshot.docs[0];
                const storeData = storeDoc.data();
                setStoreId(storeDoc.id);
                setStoreName(storeData.storeName || '');
                setAddress(storeData.address || '');
                setPhoneNumber(storeData.phoneNumber || '');
                setMainCategory(storeData.mainCategory || '');
                setSubCategory(storeData.subCategory || '');
                setOtherMainCategory(storeData.otherMainCategory || '');
                setOtherSubCategory(storeData.otherSubCategory || '');
                setDescription(storeData.description || '');
                setWebsiteUrl(storeData.websiteUrl || '');
                setSnsUrls(storeData.snsUrls || ['', '', '']);
                setMainImageUrl(storeData.mainImageUrl || null);
                setGalleryImageUrls(storeData.galleryImageUrls || []);
            }
        } catch (err: any) {
            console.error("店舗情報の取得に失敗:", err);
            let errorMessage = "店舗情報の読み込みに失敗しました。";
            if (err.code === 'permission-denied') {
                errorMessage += " Firebaseのセキュリティルールを確認してください。";
            }
            setError(errorMessage);
        }
        setLoading(false);
    }, []);

    useEffect(() => {
        if (user) {
            fetchStoreProfile(user);
        }
    }, [user, fetchStoreProfile]);
    
    useEffect(() => {
        if (mainCategory && categoryData[mainCategory as keyof typeof categoryData]) {
            setSubCategoryOptions(categoryData[mainCategory as keyof typeof categoryData]);
        } else {
            setSubCategoryOptions([]);
        }
    }, [mainCategory]);


    const handleMainImageChange = (event: React.ChangeEvent<HTMLInputElement>) => { if (event.target.files && event.target.files[0]) { setMainImageFile(event.target.files[0]); } };
    const handleGalleryImagesChange = (event: React.ChangeEvent<HTMLInputElement>) => { if (event.target.files) { setGalleryImageFiles(prev => [...prev, ...Array.from(event.target.files!)]); } };
    const handleSnsUrlChange = (index: number, value: string) => { const newSnsUrls = [...snsUrls]; newSnsUrls[index] = value; setSnsUrls(newSnsUrls); };
    
    const handleDeleteImage = async (imageUrlToDelete: string, imageType: 'main' | 'gallery') => {
        if (!user || !storeId) {
            alert("エラーが発生しました。ページを再読み込みしてください。");
            return;
        }
        if (!window.confirm("この写真を本当に削除しますか？この操作は元に戻せません。")) {
            return;
        }
        
        // 🚨 注意: サーバー側API /api/partner/delete-image の修正も必要です。
        
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
            alert("写真を削除しました。");

        } catch (err: any) {
            console.error("画像削除エラー:", err);
            setError(err.message);
        }
    };

    const handleSaveProfile = async () => {
        if (!user) {
            console.error("Save failed: User is not logged in.");
            return alert('ログインしていません。');
        }

        console.log("--- 1. SAVE PROCESS STARTED ---");
        console.log("User ID:", user.uid);

        if (!mainCategory || (mainCategory !== 'その他' && !subCategory)) { return alert('カテゴリ（大分類・小分類）は必須項目です。'); }
        if (mainCategory === 'その他' && !otherMainCategory) { return alert('カテゴリ（大分類）で「その他」を選んだ場合は、内容を入力してください。'); }
        if (subCategory === 'その他' && !otherSubCategory) { return alert('カテゴリ（小分類）で「その他」を選んだ場合は、内容を入力してください。'); }

        setIsSaving(true);
        setError(null);

        try {
            // 🟢 修正点 3: 保存先をトップレベルの 'ads' コレクションに変更
            const adsCollectionRef = collection(db, 'ads'); 
            console.log("--- 2. Firestore Path ---");
            console.log("Attempting to write to collection: ads");
            
            let currentStoreId = storeId;
            
            // 🟢 修正点 4: 永続的な ownerId をデータに含める
            const textData = { 
                storeName, address, phoneNumber, 
                mainCategory, subCategory, 
                otherMainCategory: mainCategory === 'その他' ? otherMainCategory : '', 
                otherSubCategory: subCategory === 'その他' ? otherSubCategory : '', 
                description, websiteUrl, 
                snsUrls: snsUrls.filter(url => url.trim() !== ''), 
                ownerId: user.uid, // ★ パートナーを識別するための最重要フィールド
                updatedAt: serverTimestamp(), 
            };
            console.log("--- 3. Firestore Data ---");
            console.log("Data to save:", textData);

            if (!currentStoreId) {
                console.log("Creating new document in 'ads'...");
                const docRef = await addDoc(adsCollectionRef, { 
                    ...textData, 
                    status: 'pending', 
                    createdAt: serverTimestamp(), 
                    mainImageUrl: '', 
                    galleryImageUrls: [] 
                });
                currentStoreId = docRef.id;
                setStoreId(currentStoreId);
                console.log("SUCCESS: New document created with ID:", currentStoreId);
            } else {
                console.log("Updating existing document in 'ads':", currentStoreId);
                const storeDocRefForUpdate = doc(adsCollectionRef, currentStoreId);
                await updateDoc(storeDocRefForUpdate, textData);
                console.log("SUCCESS: Document updated.");
            }
            
            const storeDocRef = doc(adsCollectionRef, currentStoreId!);

            if (mainImageFile) {
                const uniqueFileName = `main_${uuidv4()}_${mainImageFile.name}`;
                // 🟢 修正点 5: Storage パスを ads に変更 (推奨)
                const storagePath = `ads/${currentStoreId}/${uniqueFileName}`; 
                console.log("--- 4. Main Image Upload ---");
                console.log("Uploading to Storage path:", storagePath);
                const fileRef = ref(storage, storagePath);
                const uploadTask = await uploadBytesResumable(fileRef, mainImageFile);
                const updatedMainImageUrl = await getDownloadURL(uploadTask.ref);
                await updateDoc(storeDocRef, { mainImageUrl: updatedMainImageUrl });
                setMainImageUrl(updatedMainImageUrl);
                console.log("SUCCESS: Main image uploaded.");
            }
            
            if (galleryImageFiles.length > 0) {
                console.log(`--- 5. Gallery Image Upload (${galleryImageFiles.length} files) ---`);
                const newGalleryImageUrls: string[] = [];
                for (const file of galleryImageFiles) {
                    const uniqueFileName = `gallery_${uuidv4()}_${file.name}`;
                    // 🟢 修正点 6: Storage パスを ads に変更 (推奨)
                    const storagePath = `ads/${currentStoreId}/${uniqueFileName}`; 
                    console.log("Uploading to Storage path:", storagePath);
                    const fileRef = ref(storage, storagePath);
                    const uploadTask = await uploadBytesResumable(fileRef, file);
                    const downloadURL = await getDownloadURL(uploadTask.ref);
                    newGalleryImageUrls.push(downloadURL);
                }
                await updateDoc(storeDocRef, { galleryImageUrls: arrayUnion(...newGalleryImageUrls) });
                setGalleryImageUrls(prev => [...prev, ...newGalleryImageUrls]);
                console.log("SUCCESS: Gallery images uploaded.");
            }
            
            setMainImageFile(null);
            setGalleryImageFiles([]);

            console.log("--- 6. SAVE PROCESS COMPLETED ON CLIENT ---");
            alert('店舗情報を保存しました。');

        } catch (err: any) {
            console.error("!!! SAVE FAILED !!! An error occurred in handleSaveProfile:", err);
            let errorMessage = `保存に失敗しました: ${err.message}`;
            if (err.code === 'permission-denied' || (err.code && err.code.includes('storage/unauthorized'))) {
                errorMessage += "\n\n【重要】これはFirebaseの権限エラーです。FirebaseコンソールでFirestoreとStorage両方のセキュリティルールが正しく設定されているか確認してください。";
            }
            setError(errorMessage);
        } finally {
            setIsSaving(false);
        }
    };

    if (loading) return <div>読み込み中...</div>;

    return (
        <div className="container mx-auto p-8 max-w-3xl">
            <h1 className="text-2xl font-bold mb-6">店舗プロフィールの登録・編集</h1>
            {error && <p className="text-red-500 my-4 bg-red-100 p-3 rounded whitespace-pre-wrap">エラー: {error}</p>}
            <div className="space-y-6">
                <div><label className="font-bold">店舗名 *</label><input type="text" value={storeName} onChange={(e) => setStoreName(e.target.value)} className="w-full p-2 border rounded mt-1" /></div>
                <div><label className="font-bold">住所 *</label><input type="text" value={address} onChange={(e) => setAddress(e.target.value)} className="w-full p-2 border rounded mt-1" /></div>
                {address && ( <div className="mt-4"><iframe width="100%" height="300" style={{ border: 0 }} loading="lazy" allowFullScreen src={`https://maps.google.co.jp/maps?output=embed&q=${encodeURIComponent(address)}`}></iframe></div> )}
                <div><label className="font-bold">電話番号 *</label><input type="text" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} className="w-full p-2 border rounded mt-1" /></div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border p-4 rounded-md">
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
                        <select value={subCategory} onChange={e => setSubCategory(e.target.value)} disabled={!mainCategory} className="w-full p-2 border rounded mt-1 disabled:bg-gray-100">
                            <option value="">大分類を先に選択</option>
                            {subCategoryOptions.map(sub => <option key={sub} value={sub}>{sub}</option>)}
                        </select>
                        {subCategory === 'その他' && ( <input type="text" value={otherSubCategory} onChange={e => setOtherSubCategory(e.target.value)} placeholder="カテゴリ名を入力" className="w-full p-2 border rounded mt-2"/> )}
                    </div>
                </div>
                
                <div>
                    <div className="flex justify-between items-center mb-1">
                        <div>
                            <label className="font-bold">店舗紹介文・営業時間</label>
                            <p className="text-sm text-gray-500 mt-1">営業時間や定休日もこちらにご記入ください。</p>
                        </div>
                        <button type="button" onClick={() => setDescription(descriptionPlaceholder)} className="bg-blue-500 text-white text-sm font-bold py-2 px-4 rounded hover:bg-blue-600 transition-colors">テンプレートを貼り付け</button>
                    </div>
                    <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="w-full p-2 border rounded mt-1" rows={15} placeholder="カテゴリを選択後、「テンプレートを貼り付け」ボタンを押すと入力が簡単になります。"></textarea>
                </div>
                
                <div className="space-y-2">
                    <label className="font-bold">トップ画像 (1枚)</label>
                    <p className="text-sm text-gray-500">推奨サイズ: 横1200px × 縦675px (16:9)</p>
                    <div className="p-2 border rounded min-h-[100px]">
                        {(mainImageUrl || mainImageFile) ? (
                            <div className="relative inline-block">
                                <img src={mainImageFile ? URL.createObjectURL(mainImageFile) : mainImageUrl!} alt="トップ画像プレビュー" className="w-48 h-auto rounded" />
                                <button type="button" onClick={() => { if (mainImageFile) { setMainImageFile(null); const input = document.getElementById('main-image-input') as HTMLInputElement; if (input) input.value = ''; } else if (mainImageUrl) { handleDeleteImage(mainImageUrl, 'main'); } }} className="absolute top-0 right-0 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center -m-2">X</button>
                            </div>
                        ) : ( <p className="text-gray-400">まだ画像はありません。</p> )}
                    </div>
                    <input id="main-image-input" type="file" accept="image/*" onChange={handleMainImageChange} className="text-sm" />
                </div>
                <div className="space-y-2">
                    <label className="font-bold">ギャラリー写真 (複数可)</label>
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
                    <input type="file" multiple onChange={handleGalleryImagesChange} accept="image/*" className="text-sm" />
                </div>
                
                <div><label className="font-bold">公式ウェブサイトURL</label><input type="url" value={websiteUrl} onChange={(e) => setWebsiteUrl(e.target.value)} className="w-full p-2 border rounded mt-1" placeholder="https://..." /></div>
                <div><label className="font-bold">SNS URL 1</label><input type="url" value={snsUrls[0]} onChange={(e) => handleSnsUrlChange(0, e.target.value)} className="w-full p-2 border rounded mt-1" placeholder="https://..." /></div>
                <div><label className="font-bold">SNS URL 2</label><input type="url" value={snsUrls[1]} onChange={(e) => handleSnsUrlChange(1, e.target.value)} className="w-full p-2 border rounded mt-1" placeholder="https://..." /></div>
                <div><label className="font-bold">SNS URL 3</label><input type="url" value={snsUrls[2]} onChange={(e) => handleSnsUrlChange(2, e.target.value)} className="w-full p-2 border rounded mt-1" placeholder="https-..." /></div>
                
                <button onClick={handleSaveProfile} disabled={isSaving} className="px-6 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:bg-gray-400">
                    {isSaving ? '保存中...' : '保存する'}
                </button>
            </div>

            <div className="mt-8">
                <Link href="/partner/dashboard" legacyBehavior><a className="text-blue-600 hover:underline">← ダッシュボードに戻る</a></Link>
            </div>
        </div>
    );
};

export default EditStorePage;