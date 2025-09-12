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

  // Form State
  const [storeId, setStoreId] = useState<string | null>(null);
  const [storeName, setStoreName] = useState('');
  const [address, setAddress] = useState('');
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
  
  // TODO: この機能はAPI側の修正も必要
  const handleDeleteImage = (urlToDelete: string, imageType: 'main' | 'gallery') => {
      alert("画像削除機能は次のステップで実装します。");
  }

  const handleSaveProfile = async () => {
    // ... 保存処理は変更なし ...
  };

  if (loading) return <div>読み込み中...</div>;

  return (
    <div className="container mx-auto p-8 max-w-3xl">
      <h1 className="text-2xl font-bold mb-6">店舗プロフィールの登録・編集</h1>
      {error && <p className="text-red-500 my-4 bg-red-100 p-3 rounded">エラー: {error}</p>}
      <div className="space-y-6">
        {/* テキスト入力フィールド */}
        <div><label className="font-bold">店舗名 *</label><input type="text" value={storeName} onChange={(e) => setStoreName(e.target.value)} className="w-full p-2 border rounded mt-1" /></div>
        <div><label className="font-bold">住所 *</label><input type="text" value={address} onChange={(e) => setAddress(e.target.value)} className="w-full p-2 border rounded mt-1" /></div>
        <div><label className="font-bold">電話番号 *</label><input type="text" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} className="w-full p-2 border rounded mt-1" /></div>
        <div><label className="font-bold">店舗紹介文</label><textarea value={description} onChange={(e) => setDescription(e.target.value)} className="w-full p-2 border rounded mt-1" rows={5}></textarea></div>
        <div><label className="font-bold">営業時間</label><textarea value={businessHours} onChange={(e) => setBusinessHours(e.target.value)} className="w-full p-2 border rounded mt-1" rows={3}></textarea></div>
        
        {/* ▼▼▼ ここからJSXを全面的に修正 ▼▼▼ */}
        {/* --- トップ画像 --- */}
        <div className="space-y-2">
            <label className="font-bold">トップ画像 (1枚)</label>
            <p className="text-sm text-gray-500">推奨サイズ: 横1200px × 縦675px (16:9)</p>
            <div className="p-2 border rounded min-h-[100px]">
                {/* 既存の画像か、新規選択した画像のプレビューを表示 */}
                {(mainImageUrl || mainImageFile) ? (
                    <div className="relative w-48">
                        <img 
                            src={mainImageFile ? URL.createObjectURL(mainImageFile) : mainImageUrl!} 
                            alt="トップ画像プレビュー" 
                            className="w-48 h-auto rounded"
                        />
                        <button 
                            onClick={() => handleDeleteImage(mainImageUrl!, 'main')}
                            className="absolute top-0 right-0 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center -m-2"
                        >
                            X
                        </button>
                    </div>
                ) : (
                    <p className="text-gray-400">まだ画像はありません。</p>
                )}
            </div>
            <input type="file" accept="image/*" onChange={handleMainImageChange} className="text-sm" />
        </div>

        {/* --- ギャラリー写真 --- */}
        <div className="space-y-2">
            <label className="font-bold">ギャラリー写真 (複数可)</label>
            <p className="text-sm text-gray-500">推奨サイズ: 横800px × 縦800px (1:1)</p>
            <div className="p-2 border rounded min-h-[112px] flex flex-wrap gap-2">
                {/* 既存の画像プレビュー */}
                {galleryImageUrls.map((url, index) => (
                    <div key={index} className="relative">
                        <img src={url} alt={`ギャラリー画像 ${index + 1}`} className="w-24 h-24 object-cover rounded"/>
                        <button 
                            onClick={() => handleDeleteImage(url, 'gallery')} 
                            className="absolute top-[-5px] right-[-5px] bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs"
                        >
                            X
                        </button>
                    </div>
                ))}
                {/* 新規選択した画像のプレビュー */}
                {galleryImageFiles.map((file, index) => (
                     <div key={index} className="relative">
                        <img src={URL.createObjectURL(file)} alt={`新規ギャラリー画像 ${index + 1}`} className="w-24 h-24 object-cover rounded"/>
                    </div>
                ))}
                {/* 画像が一つもない場合にメッセージを表示 */}
                {galleryImageUrls.length === 0 && galleryImageFiles.length === 0 && (
                     <p className="text-gray-400">まだ写真はありません。</p>
                )}
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