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

  // フォームのState
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

  // ログイン状態の監視
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

  // 既存の店舗情報を読み込み
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

  // ファイル選択ハンドラ
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setSelectedFiles(Array.from(event.target.files));
    }
  };

  // 保存ボタンの処理
  const handleSaveProfile = async () => {
    if (!user) return alert('ログインしていません。');
    setIsSaving(true);

    const finalSnsUrls = snsUrls.filter(url => url.trim() !== '');
    const storeData = {
      storeName, address, phoneNumber, description, businessHours, websiteUrl,
      snsUrls: finalSnsUrls, ownerId: user.uid, updatedAt: serverTimestamp(),
    };

    let currentStoreId = storeId;
    try {
      if (currentStoreId) {
        await updateDoc(doc(db, 'stores', currentStoreId), storeData);
      } else {
        const docRef = await addDoc(collection(db, 'stores'), { ...storeData, status: 'pending', createdAt: serverTimestamp(), photoUrls: [] });
        setStoreId(docRef.id);
        currentStoreId = docRef.id;
      }
    } catch (error) {
      console.error("テキスト情報の保存に失敗:", error);
      alert('エラーが発生しました。');
      setIsSaving(false); return;
    }

    if (selectedFiles.length > 0 && currentStoreId) {
      setUploadProgress(0);
      let uploadedCount = 0;
      const totalFiles = selectedFiles.length;

      const uploadPromises = selectedFiles.map(file => {
        const uniqueFileName = `${uuidv4()}_${file.name}`;
        const fileRef = ref(storage, `stores/${currentStoreId}/${uniqueFileName}`);
        const uploadTask = uploadBytesResumable(fileRef, file);

        return new Promise<string>((resolve, reject) => {
          uploadTask.on('state_changed',
            (snapshot) => {
              const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
              // 全体の進捗を計算
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
        alert('画像のアップロードに失敗しました。');
      }
    }

    setIsSaving(false);
    setUploadProgress(null);
    alert('店舗情報を保存しました。');
  };

  const handleSnsUrlChange = (index: number, value: string) => {
    const newSnsUrls = [...snsUrls];
    newSnsUrls[index] = value;
    setSnsUrls(newSnsUrls);
  };

  if (loading) return <div>読み込み中...</div>;

  return (
    <div className="container mx-auto p-8 max-w-3xl">
      <h1 className="text-2xl font-bold mb-6">店舗プロフィールの登録・編集</h1>
      <div className="space-y-4">
        <div><label className="font-bold">店舗名 *</label><input type="text" value={storeName} onChange={(e) => setStoreName(e.target.value)} className="w-full p-2 border rounded mt-1" /></div>
        <div><label className="font-bold">住所 *</label><input type="text" value={address} onChange={(e) => setAddress(e.target.value)} className="w-full p-2 border rounded mt-1" /></div>
        <div><label className="font-bold">電話番号 *</label><input type="text" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} className="w-full p-2 border rounded mt-1" /></div>
        <div><label className="font-bold">店舗紹介文</label><textarea value={description} onChange={(e) => setDescription(e.target.value)} className="w-full p-2 border rounded mt-1" rows={5}></textarea></div>
        <div><label className="font-bold">営業時間</label><textarea value={businessHours} onChange={(e) => setBusinessHours(e.target.value)} className="w-full p-2 border rounded mt-1" rows={3}></textarea></div>
        
        <div>
          <label className="font-bold">店舗写真 (複数可)</label>
          <div className="flex flex-wrap gap-2 my-2 border p-2 rounded">
            {photoUrls.length > 0 
              ? photoUrls.map(url => <img key={url} src={url} className="w-24 h-24 object-cover rounded" alt="アップロード済みの店舗写真"/>)
              : <p className="text-sm text-gray-500">まだ写真はありません。</p>
            }
          </div>
          <input type="file" multiple onChange={handleFileChange} />
          {uploadProgress !== null && (
            <div className="w-full bg-gray-200 rounded-full h-2.5 my-2"><div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${uploadProgress}%` }}></div></div>
          )}
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
        <Link href="/partner/dashboard">
          <a className="text-blue-600 hover:underline">← ダッシュボードに戻る</a>
        </Link>
      </div>
    </div>
  );
};

export default StoreProfilePage;