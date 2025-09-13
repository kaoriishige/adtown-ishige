import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { db, auth, storage } from '@/lib/firebase';
import {
  collection, query, where, getDocs, doc, updateDoc, addDoc, serverTimestamp, arrayUnion
} from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { onAuthStateChanged, User } from 'firebase/auth';
import { v4 as uuidv4 } from 'uuid';

// ▼▼▼ 追加: カテゴリデータ ▼▼▼
const categoryData = {
    "飲食関連": ["レストラン・食堂", "カフェ・喫茶店", "居酒屋・バー", "パン屋（ベーカリー）", "和菓子・洋菓子店", "ラーメン店", "そば・うどん店", "寿司屋"],
    "買い物関連": ["農産物直売所・青果店", "精肉店・鮮魚店", "個人経営の食料品店", "酒店", "ブティック・衣料品店", "雑貨店・民芸品店", "書店", "花屋", "お土産店"],
    "美容・健康関連": ["美容室・理容室", "ネイルサロン", "エステサロン", "リラクゼーション・マッサージ", "整体・整骨院・鍼灸院", "個人経営の薬局", "クリニック・歯科医院"],
    "住まい・暮らし関連": ["工務店・建築・リフォーム", "水道・電気工事", "不動産会社", "クリーニング店", "造園・植木屋", "便利屋"],
    "教育・習い事関連": ["学習塾・家庭教師", "ピアノ・音楽教室", "英会話教室", "書道・そろばん教室", "スポーツクラブ・道場", "パソコン教室", "料理教室"],
    "車・バイク関連": ["自動車販売店・自動車整備・修理工場", "ガソリンスタンド", "バイクショップ"],
    "観光・レジャー関連": ["ホテル・旅館・ペンション", "日帰り温泉施設", "観光施設・美術館・博物館", "体験工房（陶芸・ガラスなど）", "牧場・農園", "キャンプ場・グランピング施設", "ゴルフ場", "貸し別荘"],
    "ペット関連": ["動物病院", "トリミングサロン", "ペットホテル・ドッグラン"],
    "専門サービス関連": ["弁護士・税理士・行政書士などの士業", "デザイン・印刷会社", "写真館", "保険代理店", "カウンセリング", "コンサルティング"],
};
const mainCategories = Object.keys(categoryData);

const StoreProfilePage = () => {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Form State
  const [storeId, setStoreId] = useState<string | null>(null);
  const [storeName, setStoreName] = useState('');
  const [address, setAddress] = useState('');

  // ▼▼▼ 追加: カテゴリを管理するState ▼▼▼
  const [mainCategory, setMainCategory] = useState('');
  const [subCategory, setSubCategory] = useState('');
  const [subCategoryOptions, setSubCategoryOptions] = useState<string[]>([]);

  const [phoneNumber, setPhoneNumber] = useState('');
  const [description, setDescription] = useState('');
  const [businessHours, setBusinessHours] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [snsUrls, setSnsUrls] = useState(['', '', '']);
  const [mainImageUrl, setMainImageUrl] = useState<string | null>(null);
  const [galleryImageUrls, setGalleryImageUrls] = useState<string[]>([]);
  const [mainImageFile, setMainImageFile] = useState<File | null>(null);
  const [galleryImageFiles, setGalleryImageFiles] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
      } else {
        router.push('/login');
      }
    });
    return () => unsubscribe();
  }, [router]);

  const fetchStoreProfile = useCallback(async (currentUser: User) => {
    if (!currentUser) return;
    setLoading(true);
    try {
      const storesRef = collection(db, 'stores');
      const q = query(storesRef, where("ownerId", "==", currentUser.uid));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const storeDoc = querySnapshot.docs[0];
        const storeData = storeDoc.data();
        setStoreId(storeDoc.id);
        setStoreName(storeData.storeName || '');
        setAddress(storeData.address || '');

        // ▼▼▼ 追加: 既存のカテゴリ情報を読み込む ▼▼▼
        setMainCategory(storeData.mainCategory || '');
        setSubCategory(storeData.subCategory || '');

        setPhoneNumber(storeData.phoneNumber || '');
        setDescription(storeData.description || '');
        setBusinessHours(storeData.businessHours || '');
        setWebsiteUrl(storeData.websiteUrl || '');
        setSnsUrls(storeData.snsUrls || ['', '', '']);
        setMainImageUrl(storeData.mainImageUrl || null);
        setGalleryImageUrls(storeData.galleryImageUrls || []);
      }
    } catch (err) {
      console.error("店舗情報の取得に失敗:", err);
      setError("店舗情報の読み込みに失敗しました。");
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (user) {
      fetchStoreProfile(user);
    }
  }, [user, fetchStoreProfile]);
  
  // ▼▼▼ 追加: 大分類→小分類の連動ロジック ▼▼▼
  useEffect(() => {
    if (mainCategory && categoryData[mainCategory as keyof typeof categoryData]) {
      setSubCategoryOptions(categoryData[mainCategory as keyof typeof categoryData]);
    } else {
      setSubCategoryOptions([]);
    }
  }, [mainCategory]);


  const handleMainImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setMainImageFile(event.target.files[0]);
    }
  };

  const handleGalleryImagesChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setGalleryImageFiles(prev => [...prev, ...Array.from(event.target.files!)]);
    }
  };
  
  const handleSnsUrlChange = (index: number, value: string) => {
    const newSnsUrls = [...snsUrls];
    newSnsUrls[index] = value;
    setSnsUrls(newSnsUrls);
  };
  
  const handleDeleteImage = async (imageUrlToDelete: string, imageType: 'main' | 'gallery') => {
    if (!user || !storeId) {
      alert("エラーが発生しました。ページを再読み込みしてください。");
      return;
    }
    if (!window.confirm("この写真を本当に削除しますか？この操作は元に戻せません。")) {
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
      alert("写真を削除しました。");

    } catch (err: any) {
      console.error("画像削除エラー:", err);
      setError(err.message);
    }
  };

  const handleSaveProfile = async () => {
    if (!user) return alert('ログインしていません。');

    // ▼▼▼ 追加: カテゴリ選択のバリデーション ▼▼▼
    if (!mainCategory || !subCategory) {
        alert('カテゴリ（大分類・小分類）は必須項目です。');
        return;
    }

    setIsSaving(true);
    setError(null);

    try {
      let currentStoreId = storeId;
      const finalSnsUrls = snsUrls.filter(url => url.trim() !== '');

      // 保存するテキストデータにカテゴリを追加
      const textData = {
          storeName, address, mainCategory, subCategory, phoneNumber, 
          description, businessHours, websiteUrl,
          snsUrls: finalSnsUrls,
          ownerId: user.uid,
          updatedAt: serverTimestamp(),
      };

      if (!currentStoreId) {
        const docRef = await addDoc(collection(db, 'stores'), { 
            ...textData,
            status: 'pending', createdAt: serverTimestamp(),
            mainImageUrl: '', galleryImageUrls: []
        });
        currentStoreId = docRef.id;
        setStoreId(currentStoreId);
      } else {
        await updateDoc(doc(db, 'stores', currentStoreId), textData);
      }
      
      const storeDocRef = doc(db, 'stores', currentStoreId!);

      let updatedMainImageUrl = mainImageUrl;
      if (mainImageFile) {
        const uniqueFileName = `main_${uuidv4()}_${mainImageFile.name}`;
        const fileRef = ref(storage, `stores/${currentStoreId}/${uniqueFileName}`);
        const uploadTask = await uploadBytesResumable(fileRef, mainImageFile);
        updatedMainImageUrl = await getDownloadURL(uploadTask.ref);
      }
      
      const newGalleryImageUrls: string[] = [];
      if (galleryImageFiles.length > 0) {
        for (const file of galleryImageFiles) {
            const uniqueFileName = `gallery_${uuidv4()}_${file.name}`;
            const fileRef = ref(storage, `stores/${currentStoreId}/${uniqueFileName}`);
            const uploadTask = await uploadBytesResumable(fileRef, file);
            const downloadURL = await getDownloadURL(uploadTask.ref);
            newGalleryImageUrls.push(downloadURL);
        }
      }
      
      await updateDoc(storeDocRef, {
        mainImageUrl: updatedMainImageUrl,
        ...(newGalleryImageUrls.length > 0 && { galleryImageUrls: arrayUnion(...newGalleryImageUrls) }),
      });

      if (mainImageFile) setMainImageUrl(updatedMainImageUrl);
      if (newGalleryImageUrls.length > 0) setGalleryImageUrls(prev => [...prev, ...newGalleryImageUrls]);
      setMainImageFile(null);
      setGalleryImageFiles([]);

      alert('店舗情報を保存しました。');

    } catch (err: any) {
      console.error("プロフィールの保存に失敗:", err);
      setError(`保存に失敗しました: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) return <div>読み込み中...</div>;

  return (
    <div className="container mx-auto p-8 max-w-3xl">
      <h1 className="text-2xl font-bold mb-6">店舗プロフィールの登録・編集</h1>
      {error && <p className="text-red-500 my-4 bg-red-100 p-3 rounded">エラー: {error}</p>}
      <div className="space-y-6">
        <div><label className="font-bold">店舗名 *</label><input type="text" value={storeName} onChange={(e) => setStoreName(e.target.value)} className="w-full p-2 border rounded mt-1" /></div>
        <div><label className="font-bold">住所 *</label><input type="text" value={address} onChange={(e) => setAddress(e.target.value)} className="w-full p-2 border rounded mt-1" /></div>
        
        {/* ▼▼▼ 追加: カテゴリ選択用のJSX ▼▼▼ */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border p-4 rounded-md">
            <div>
                <label className="font-bold">カテゴリ（大分類）*</label>
                <select value={mainCategory} onChange={e => setMainCategory(e.target.value)} className="w-full p-2 border rounded mt-1">
                    <option value="">選択してください</option>
                    {mainCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
            </div>
            <div>
                <label className="font-bold">カテゴリ（小分類）*</label>
                <select value={subCategory} onChange={e => setSubCategory(e.target.value)} disabled={!mainCategory} className="w-full p-2 border rounded mt-1 disabled:bg-gray-100">
                    <option value="">大分類を先に選択</option>
                    {subCategoryOptions.map(sub => <option key={sub} value={sub}>{sub}</option>)}
                </select>
            </div>
        </div>
        
        <div><label className="font-bold">電話番号 *</label><input type="text" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} className="w-full p-2 border rounded mt-1" /></div>
        <div><label className="font-bold">店舗紹介文</label><textarea value={description} onChange={(e) => setDescription(e.target.value)} className="w-full p-2 border rounded mt-1" rows={5}></textarea></div>
        <div><label className="font-bold">営業時間</label><textarea value={businessHours} onChange={(e) => setBusinessHours(e.target.value)} className="w-full p-2 border rounded mt-1" rows={3}></textarea></div>
        
        {/* --- 画像関連 (変更なし) --- */}
        <div className="space-y-2">
            <label className="font-bold">トップ画像 (1枚)</label>
            <p className="text-sm text-gray-500">推奨サイズ: 横1200px × 縦675px (16:9)</p>
            <div className="p-2 border rounded min-h-[100px]">
                {(mainImageUrl || mainImageFile) ? (
                    <div className="relative inline-block">
                        <img 
                            src={mainImageFile ? URL.createObjectURL(mainImageFile) : mainImageUrl!} 
                            alt="トップ画像プレビュー" 
                            className="w-48 h-auto rounded"
                        />
                        <button 
                            type="button"
                            onClick={() => {
                                if (mainImageFile) {
                                    setMainImageFile(null);
                                    const input = document.getElementById('main-image-input') as HTMLInputElement;
                                    if (input) input.value = '';
                                } else if (mainImageUrl) {
                                    handleDeleteImage(mainImageUrl, 'main');
                                }
                            }}
                            className="absolute top-0 right-0 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center -m-2"
                        >
                            X
                        </button>
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
                        <img 
                            src={url} 
                            alt={`ギャラリー画像 ${index + 1}`} 
                            className="w-24 h-24 object-cover rounded"
                            onError={(e) => { (e.target as HTMLImageElement).parentElement!.style.display = 'none'; }}
                        />
                        <button 
                            type="button"
                            onClick={() => handleDeleteImage(url, 'gallery')} 
                            className="absolute top-[-5px] right-[-5px] bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs"
                        >
                            X
                        </button>
                    </div>
                ))}
                {galleryImageFiles.map((file, index) => (
                     <div key={index} className="relative">
                        <img src={URL.createObjectURL(file)} alt={`新規ギャラリー画像 ${index + 1}`} className="w-24 h-24 object-cover rounded"/>
                        <button 
                            type="button"
                            onClick={() => setGalleryImageFiles(galleryImageFiles.filter((_, i) => i !== index))}
                            className="absolute top-[-5px] right-[-5px] bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs"
                        >
                            X
                        </button>
                     </div>
                ))}
                {galleryImageUrls.filter(url => url).length === 0 && galleryImageFiles.length === 0 && (
                     <p className="text-gray-400">まだ写真はありません。</p>
                )}
            </div>
            <input type="file" multiple onChange={handleGalleryImagesChange} accept="image/*" className="text-sm" />
        </div>
        
        {/* --- SNS と 保存ボタン (変更なし) --- */}
        <div><label className="font-bold">公式ウェブサイトURL</label><input type="url" value={websiteUrl} onChange={(e) => setWebsiteUrl(e.target.value)} className="w-full p-2 border rounded mt-1" placeholder="https://..." /></div>
        <div><label className="font-bold">SNS URL 1</label><input type="url" value={snsUrls[0]} onChange={(e) => handleSnsUrlChange(0, e.target.value)} className="w-full p-2 border rounded mt-1" placeholder="https://..." /></div>
        <div><label className="font-bold">SNS URL 2</label><input type="url" value={snsUrls[1]} onChange={(e) => handleSnsUrlChange(1, e.target.value)} className="w-full p-2 border rounded mt-1" placeholder="https://..." /></div>
        <div><label className="font-bold">SNS URL 3</label><input type="url" value={snsUrls[2]} onChange={(e) => handleSnsUrlChange(2, e.target.value)} className="w-full p-2 border rounded mt-1" placeholder="https-..." /></div>
        
        <button onClick={handleSaveProfile} disabled={isSaving} className="px-6 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:bg-gray-400">
          {isSaving ? '保存中...' : '保存する'}
        </button>
      </div>

      <div className="mt-8">
        <Link href="/partner/dashboard">← ダッシュボードに戻る</Link>
      </div>
    </div>
  );
};

export default StoreProfilePage;