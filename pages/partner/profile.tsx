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

  // ▼▼▼ 変更点: フォームのStateを新しいデータ構造に合わせる ▼▼▼
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

  // ▼▼▼ 変更点: Firestoreから新しい画像フィールドを読み込むように変更 ▼▼▼
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

  // ▼▼▼ 変更点: ファイル選択ハンドラをトップ画像とギャラリーで分離 ▼▼▼
  const handleMainImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setMainImageFile(event.target.files[0]);
    }
  };

  const handleGalleryImagesChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setGalleryImageFiles(Array.from(event.target.files));
    }
  };
  
  const handleSnsUrlChange = (index: number, value: string) => {
    const newSnsUrls = [...snsUrls];
    newSnsUrls[index] = value;
    setSnsUrls(newSnsUrls);
  };

  const handleDeleteImage = async (imageUrlToDelete: string, imageType: 'main' | 'gallery') => {
    // この機能はAPI側の修正も必要になるため、後ほど実装します
    alert('画像削除機能は現在開発中です。');
  };

  // ▼▼▼ 変更点: 保存処理を新しいデータ構造に合わせて全面的に改修 ▼▼▼
  const handleSaveProfile = async () => {
    if (!user) return alert('ログインしていません。');
    setIsSaving(true);
    setError(null);

    try {
      let currentStoreId = storeId;
      // Step 1: テキストデータの保存（または新規作成）
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

      // Step 2: トップ画像のアップロードとURL保存
      let newMainImageUrl = mainImageUrl;
      if (mainImageFile) {
        const uniqueFileName = `${uuidv4()}_${mainImageFile.name}`;
        const fileRef = ref(storage, `stores/${currentStoreId}/${uniqueFileName}`);
        const uploadTask = await uploadBytesResumable(fileRef, mainImageFile);
        newMainImageUrl = await getDownloadURL(uploadTask.ref);
        setMainImageUrl(newMainImageUrl);
        setMainImageFile(null);
      }
      
      // Step 3: ギャラリー画像のアップロードとURL保存
      let newGalleryImageUrls: string[] = [];
      if (galleryImageFiles.length > 0) {
        const uploadPromises = galleryImageFiles.map(async (file) => {
            const uniqueFileName = `${uuidv4()}_${file.name}`;
            const fileRef = ref(storage, `stores/${currentStoreId}/${uniqueFileName}`);
            const uploadTask = await uploadBytesResumable(fileRef, file);
            return getDownloadURL(uploadTask.ref);
        });
        newGalleryImageUrls = await Promise.all(uploadPromises);
        setGalleryImageUrls(prev => [...prev, ...newGalleryImageUrls]);
        setGalleryImageFiles([]);
      }
      
      // Step 4: 全ての情報をFirestoreに保存
      const finalSnsUrls = snsUrls.filter(url => url.trim() !== '');
      await updateDoc(storeDocRef, {
        storeName,
        address,
        phoneNumber,
        description,
        businessHours,
        websiteUrl,
        snsUrls: finalSnsUrls,
        mainImageUrl: newMainImageUrl,
        galleryImageUrls: arrayUnion(...newGalleryImageUrls),
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

  return (
    <div className="container mx-auto p-8 max-w-3xl">
      <h1 className="text-2xl font-bold mb-6">店舗プロフィールの登録・編集</h1>
      {error && <p className="text-red-500 my-4 bg-red-100 p-3 rounded">エラー: {error}</p>}
      
      {/* ... テキスト入力フィールド (変更なし) ... */}

      {/* ▼▼▼ 変更点: 画像アップロード部分を2つに分離 ▼▼▼ */}
      {/* --- トップ画像 --- */}
      <div className="mb-6">
        <label className="block text-gray-700 text-sm font-bold mb-2">
          トップ画像 (お店のページ上部に表示されます)
        </label>
        {mainImageUrl && (
          <div className="relative w-48 h-32 mb-2">
            <img src={mainImageUrl} alt="トップ画像" className="w-full h-full object-cover rounded-md" />
            <button type="button" onClick={() => handleDeleteImage(mainImageUrl, 'main')} className="absolute top-0 right-0 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center -mt-2 -mr-2">×</button>
          </div>
        )}
        <input type="file" accept="image/*" onChange={handleMainImageChange} className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"/>
      </div>

      {/* --- ギャラリー写真 --- */}
      <div className="mb-6">
        <label className="block text-gray-700 text-sm font-bold mb-2">
          ギャラリー写真 (検索結果やお店のページに表示されます)
        </label>
        <div className="flex flex-wrap gap-4 mb-2 min-h-[112px] border p-2 rounded">
          {galleryImageUrls.map((url, index) => (
            <div key={index} className="relative w-24 h-24">
              <img src={url} alt={`ギャラリー画像 ${index + 1}`} className="w-full h-full object-cover rounded-md" />
              <button type="button" onClick={() => handleDeleteImage(url, 'gallery')} className="absolute top-0 right-0 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center -mt-2 -mr-2">×</button>
            </div>
          ))}
        </div>
        <input type="file" accept="image/*" multiple onChange={handleGalleryImagesChange} className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"/>
      </div>
      
      {/* ... SNS URL入力フィールドと保存ボタン (変更なし) ... */}

      <button onClick={handleSaveProfile} disabled={isSaving} className="px-6 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:bg-gray-400">
        {isSaving ? '保存中...' : '保存する'}
      </button>

      <div className="mt-8">
        <Link href="/partner/dashboard">← ダッシュボードに戻る</Link>
      </div>
    </div>
  );
};

export default StoreProfilePage;