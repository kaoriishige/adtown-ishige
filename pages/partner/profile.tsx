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

const StoreProfilePage = () => {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Form State
  const [storeId, setStoreId] = useState<string | null>(null);
  const [storeName, setStoreName] = useState('');
  const [address, setAddress] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [description, setDescription] = useState('');
  const [businessHours, setBusinessHours] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [snsUrls, setSnsUrls] = useState(['', '', '']);
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Auth observer
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

  // Fetch existing store profile
  const fetchStoreProfile = useCallback(async (currentUser: User) => {
    if (!currentUser) return;
    setLoading(true);
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
      setPhotoUrls(storeData.photoUrls || []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (user) {
      fetchStoreProfile(user);
    }
  }, [user, fetchStoreProfile]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setSelectedFiles(Array.from(event.target.files));
    }
  };

  const handleSnsUrlChange = (index: number, value: string) => {
    const newSnsUrls = [...snsUrls];
    newSnsUrls[index] = value;
    setSnsUrls(newSnsUrls);
  };
  
  // ▼▼▼ ここを修正しました ▼▼▼
  // Image delete function
  const handleDeleteImage = async (imageUrlToDelete: string) => {
    // ユーザーがログインしているか、storeIdがあるかを確認
    if (!user || !storeId || !window.confirm("この写真を削除しますか？")) return;
    setError(null);

    try {
      // 認証に必要なIDトークンを取得 👈 **追加**
      const token = await user.getIdToken();

      const response = await fetch('/api/partner/delete-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // ヘッダーに認証トークンを追加 👈 **追加**
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ storeId, imageUrl: imageUrlToDelete }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "削除に失敗しました。");
      }
      
      setPhotoUrls(prev => prev.filter(url => url !== imageUrlToDelete));
      alert("写真を削除しました。");

    } catch (err: any) {
      console.error(err);
      setError(err.message);
    }
  };
  // ▲▲▲ 修正はここまで ▲▲▲

  // Save profile function
  const handleSaveProfile = async () => {
    if (!user) return alert('ログインしていません。');
    setIsSaving(true);
    setError(null);
    
    const finalSnsUrls = snsUrls.filter(url => url.trim() !== '');
    const textData = { storeName, address, phoneNumber, description, businessHours, websiteUrl, snsUrls: finalSnsUrls, ownerId: user.uid, updatedAt: serverTimestamp() };
    
    let currentStoreId = storeId;
    try {
      if (currentStoreId) {
        await updateDoc(doc(db, 'stores', currentStoreId), textData);
      } else {
        const docRef = await addDoc(collection(db, 'stores'), { ...textData, status: 'pending', createdAt: serverTimestamp(), photoUrls: [] });
        setStoreId(docRef.id);
        currentStoreId = docRef.id;
      }
    } catch (error) {
      console.error("テキスト情報の保存に失敗:", error);
      setError('テキスト情報の保存に失敗しました。');
      setIsSaving(false);
      return;
    }

    if (selectedFiles.length > 0 && currentStoreId) {
      setUploadProgress(0);
      let uploadedCount = 0;
      const totalFiles = selectedFiles.length;

      const uploadPromises = selectedFiles.map(file => {
        const uniqueFileName = `${uuidv4()}_${file.name}`;
        const fileRef = ref(storage, `stores/${currentStoreId}/${uniqueFileName}`);
        const metadata = { customMetadata: { ownerId: user.uid } };
        const uploadTask = uploadBytesResumable(fileRef, file, metadata);

        return new Promise<string>((resolve, reject) => {
          uploadTask.on('state_changed',
            (snapshot) => {
              const overallProgress = ((uploadedCount + (snapshot.bytesTransferred / snapshot.totalBytes)) / totalFiles) * 100;
              setUploadProgress(overallProgress);
            },
            (error) => reject(error),
            async () => {
              uploadedCount++;
              const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
              resolve(downloadURL);
            }
          );
        });
      });
      try {
        const newPhotoUrls = await Promise.all(uploadPromises);
        const storeDocRef = doc(db, 'stores', currentStoreId);
        await updateDoc(storeDocRef, { photoUrls: arrayUnion(...newPhotoUrls) });
        setPhotoUrls(prev => [...prev, ...newPhotoUrls]);
        setSelectedFiles([]);
      } catch (error) {
        console.error("画像アップロードまたはURL保存に失敗:", error);
        setError('画像のアップロードに失敗しました。');
      }
    }
    
    setIsSaving(false);
    setUploadProgress(null);
    if (!error) {
      alert('店舗情報を保存しました。');
    }
  };

  if (loading) return <div>読み込み中...</div>;

  return (
    <div className="container mx-auto p-8 max-w-3xl">
      <h1 className="text-2xl font-bold mb-6">店舗プロフィールの登録・編集</h1>
      {error && <p className="text-red-500 my-4 bg-red-100 p-3 rounded">エラー: {error}</p>}
      <div className="space-y-4">
        <div><label className="font-bold">店舗名 *</label><input type="text" value={storeName} onChange={(e) => setStoreName(e.target.value)} className="w-full p-2 border rounded mt-1" /></div>
        <div><label className="font-bold">住所 *</label><input type="text" value={address} onChange={(e) => setAddress(e.target.value)} className="w-full p-2 border rounded mt-1" /></div>
        <div><label className="font-bold">電話番号 *</label><input type="text" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} className="w-full p-2 border rounded mt-1" /></div>
        <div><label className="font-bold">店舗紹介文</label><textarea value={description} onChange={(e) => setDescription(e.target.value)} className="w-full p-2 border rounded mt-1" rows={5}></textarea></div>
        <div><label className="font-bold">営業時間</label><textarea value={businessHours} onChange={(e) => setBusinessHours(e.target.value)} className="w-full p-2 border rounded mt-1" rows={3}></textarea></div>
        
        <div>
          <label className="font-bold">店舗写真 (複数可)</label>
          <div className="flex flex-wrap gap-2 my-2 border p-2 rounded min-h-[112px]">
            {photoUrls.length > 0
              ? photoUrls.map(url => (
                  <div key={url} className="relative">
                    <img src={url} className="w-24 h-24 object-cover rounded" alt="アップロード済みの店舗写真"/>
                    <button 
                      onClick={() => handleDeleteImage(url)}
                      className="absolute top-[-5px] right-[-5px] bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold shadow-md hover:bg-red-700"
                      aria-label="写真を削除"
                    >
                      X
                    </button>
                  </div>
                ))
              : <p className="text-sm text-gray-500 self-center">まだ写真はありません。</p>
            }
          </div>
          <input type="file" multiple onChange={handleFileChange} accept="image/*" />
          {uploadProgress !== null && (<div className="w-full bg-gray-200 rounded-full h-2.5 my-2"><div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${uploadProgress}%` }}></div></div>)}
        </div>
        
        <div><label className="font-bold">公式ウェブサイトURL</label><input type="url" value={websiteUrl} onChange={(e) => setWebsiteUrl(e.target.value)} className="w-full p-2 border rounded mt-1" placeholder="https://..." /></div>
        <div><label className="font-bold">SNS URL 1</label><input type="url" value={snsUrls[0]} onChange={(e) => handleSnsUrlChange(0, e.target.value)} className="w-full p-2 border rounded mt-1" placeholder="https://..." /></div>
        <div><label className="font-bold">SNS URL 2</label><input type="url" value={snsUrls[1]} onChange={(e) => handleSnsUrlChange(1, e.target.value)} className="w-full p-2 border rounded mt-1" placeholder="https://..." /></div>
        <div><label className="font-bold">SNS URL 3</label><input type="url" value={snsUrls[2]} onChange={(e) => handleSnsUrlChange(2, e.target.value)} className="w-full p-2 border rounded mt-1" placeholder="https://..." /></div>
        
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