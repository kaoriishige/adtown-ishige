import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { db, auth, storage } from '@/lib/firebase';
import {
  collection, query, where, getDocs, doc, updateDoc, addDoc, serverTimestamp, arrayUnion, arrayRemove
} from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from "firebase/storage";
import { onAuthStateChanged, User } from 'firebase/auth';
import { v4 as uuidv4 } from 'uuid';

const StoreProfilePage = () => {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // ▼▼▼ 変更点1: フォームのStateを新しいデータ構造に変更 ▼▼▼
  const [storeId, setStoreId] = useState<string | null>(null);
  const [storeName, setStoreName] = useState('');
  const [address, setAddress] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [description, setDescription] = useState('');
  const [businessHours, setBusinessHours] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [snsUrls, setSnsUrls] = useState(['', '', '']);
  
  // 画像Stateをトップ画像とギャラリー画像に分離
  const [mainImageUrl, setMainImageUrl] = useState<string | null>(null);
  const [galleryImageUrls, setGalleryImageUrls] = useState<string[]>([]);
  const [mainImageFile, setMainImageFile] = useState<File | null>(null);
  const [galleryImageFiles, setGalleryImageFiles] = useState<File[]>([]);

  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  // ユーザーのログイン状態を監視
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

  // ▼▼▼ 変更点2: Firestoreから新しい画像フィールドを読み込むように変更 ▼▼▼
  const fetchStoreProfile = useCallback(async (currentUser: User) => {
    if (!currentUser) return;
    setLoading(true);
    setError(null);
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
        setPhoneNumber(storeData.phoneNumber || '');
        setDescription(storeData.description || '');
        setBusinessHours(storeData.businessHours || '');
        setWebsiteUrl(storeData.websiteUrl || '');
        const loadedSnsUrls = storeData.snsUrls || [];
        setSnsUrls([loadedSnsUrls[0] || '', loadedSnsUrls[1] || '', loadedSnsUrls[2] || '']);
        
        // 新しい画像フィールドを読み込む
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

  // ▼▼▼ 変更点3: ファイル選択ハンドラをトップ画像とギャラリーで分離 ▼▼▼
  const handleMainImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setMainImageFile(event.target.files[0]);
      if (mainImageUrl) setMainImageUrl(null);
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
    alert('画像削除機能は、保存機能が完成した次のステップで実装します。');
  };

  // ▼▼▼ 変更点4: 保存処理を新しいデータ構造に合わせて全面的に改修 ▼▼▼
  const handleSaveProfile = async () => {
    if (!user) return alert('ログインしていません。');
    setIsSaving(true);
    setError(null);

    try {
      let currentStoreId = storeId;

      if (!currentStoreId) {
        const docRef = await addDoc(collection(db, 'stores'), { 
            ownerId: user.uid, 
            status: 'pending', 
            createdAt: serverTimestamp(),
            mainImageUrl: '',
            galleryImageUrls: []
        });
        currentStoreId = docRef.id;
        setStoreId(currentStoreId);
      }
      const storeDocRef = doc(db, 'stores', currentStoreId!);

      let updatedMainImageUrl = mainImageUrl;
      if (mainImageFile) {
        const uniqueFileName = `main_${uuidv4()}_${mainImageFile.name}`;
        const fileRef = ref(storage, `stores/${currentStoreId}/${uniqueFileName}`);
        const uploadTask = await uploadBytesResumable(fileRef, mainImageFile);
        updatedMainImageUrl = await getDownloadURL(uploadTask.ref);
        setMainImageUrl(updatedMainImageUrl);
        setMainImageFile(null);
      }
      
      let newGalleryImageUrls: string[] = [];
      if (galleryImageFiles.length > 0) {
        const uploadPromises = galleryImageFiles.map(async (file) => {
            const uniqueFileName = `gallery_${uuidv4()}_${file.name}`;
            const fileRef = ref(storage, `stores/${currentStoreId}/${uniqueFileName}`);
            const uploadTask = await uploadBytesResumable(fileRef, file);
            return getDownloadURL(uploadTask.ref);
        });
        newGalleryImageUrls = await Promise.all(uploadPromises);
        setGalleryImageUrls(prev => [...prev, ...newGalleryImageUrls]);
        setGalleryImageFiles([]);
      }
      
      const finalSnsUrls = snsUrls.filter(url => url.trim() !== '');
      await updateDoc(storeDocRef, {
        storeName,
        address,
        phoneNumber,
        description,
        businessHours,
        websiteUrl,
        snsUrls: finalSnsUrls,
        mainImageUrl: updatedMainImageUrl,
        ...(newGalleryImageUrls.length > 0 && { galleryImageUrls: arrayUnion(...newGalleryImageUrls) }),
        updatedAt: serverTimestamp()
      });

      alert('店舗情報を保存しました。');

    } catch (err: any) {
      console.error("プロフィールの保存に失敗:", err);
      setError(`保存に失敗しました: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) return <div>読み込み中...</div>;
  
  // ▼▼▼ 変更点5: デバッグ用のconsole.logを追加 ▼▼▼
  console.log('現在のギャラリー画像URL:', galleryImageUrls);

  return (
    <div className="container mx-auto p-8 max-w-3xl">
      <h1 className="text-2xl font-bold mb-6">店舗プロフィールの登録・編集</h1>
      {error && <p className="text-red-500 my-4 bg-red-100 p-3 rounded">エラー: {error}</p>}
      <div className="space-y-4">
        {/* テキスト入力フィールド */}
        <div><label className="font-bold">店舗名 *</label><input type="text" value={storeName} onChange={(e) => setStoreName(e.target.value)} className="w-full p-2 border rounded mt-1" /></div>
        <div><label className="font-bold">住所 *</label><input type="text" value={address} onChange={(e) => setAddress(e.target.value)} className="w-full p-2 border rounded mt-1" /></div>
        <div><label className="font-bold">電話番号 *</label><input type="text" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} className="w-full p-2 border rounded mt-1" /></div>
        <div><label className="font-bold">店舗紹介文</label><textarea value={description} onChange={(e) => setDescription(e.target.value)} className="w-full p-2 border rounded mt-1" rows={5}></textarea></div>
        <div><label className="font-bold">営業時間</label><textarea value={businessHours} onChange={(e) => setBusinessHours(e.target.value)} className="w-full p-2 border rounded mt-1" rows={3}></textarea></div>
        
        {/* ▼▼▼ 変更点6: JSXをトップ画像とギャラリー画像の2つのセクションに分離 ▼▼▼ */}
        <div className="space-y-2">
            <label className="font-bold">トップ画像 (1枚)</label>
            <div className="p-2 border rounded min-h-[100px]">
                {mainImageUrl && <img src={mainImageUrl} alt="トップ画像" className="w-48 h-auto rounded" />}
                {mainImageFile && <img src={URL.createObjectURL(mainImageFile)} alt="プレビュー" className="w-48 h-auto rounded" />}
            </div>
            <input type="file" accept="image/*" onChange={handleMainImageChange} className="text-sm" />
        </div>

        <div className="space-y-2">
            <label className="font-bold">ギャラリー写真 (複数可)</label>
            <div className="p-2 border rounded min-h-[112px] flex flex-wrap gap-2">
                {galleryImageUrls.map((url, index) => (
                    <div key={index} className="relative">
                        <img src={url} alt={`ギャラリー画像 ${index + 1}`} className="w-24 h-24 object-cover rounded"/>
                        <button onClick={() => handleDeleteImage(url, 'gallery')} className="absolute top-[-5px] right-[-5px] bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs">X</button>
                    </div>
                ))}
            </div>
            <input type="file" multiple onChange={handleGalleryImagesChange} accept="image/*" className="text-sm" />
        </div>
        
        {/* 他の入力フィールド */}
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