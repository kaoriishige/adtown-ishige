import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link'; // Linkコンポーネントをインポート
import { db, auth } from '@/lib/firebase';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  doc, 
  updateDoc, 
  addDoc, 
  serverTimestamp 
} from 'firebase/firestore';
import { onAuthStateChanged, User } from 'firebase/auth';

const StoreProfilePage = () => {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  
  const [storeId, setStoreId] = useState<string | null>(null);
  const [storeName, setStoreName] = useState('');
  const [address, setAddress] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [description, setDescription] = useState('');
  const [businessHours, setBusinessHours] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [snsUrls, setSnsUrls] = useState(['', '', '']);

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
      setSnsUrls([
        loadedSnsUrls[0] || '',
        loadedSnsUrls[1] || '',
        loadedSnsUrls[2] || '',
      ]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (user) {
      fetchStoreProfile(user);
    }
  }, [user, fetchStoreProfile]);

  const handleSaveProfile = async () => {
    if (!user) return alert('ログインしていません。');

    const finalSnsUrls = snsUrls.filter(url => url.trim() !== '');

    const storeData = {
      storeName,
      address,
      phoneNumber,
      description,
      businessHours,
      websiteUrl,
      snsUrls: finalSnsUrls,
      ownerId: user.uid,
      updatedAt: serverTimestamp(),
    };

    try {
      if (storeId) {
        const storeDocRef = doc(db, 'stores', storeId);
        await updateDoc(storeDocRef, storeData);
      } else {
        const storesCollectionRef = collection(db, 'stores');
        await addDoc(storesCollectionRef, {
          ...storeData,
          status: 'pending',
          createdAt: serverTimestamp(),
        });
      }
      alert('店舗情報を保存しました。');
    } catch (error) {
      console.error("店舗情報の保存に失敗しました:", error);
      alert('エラーが発生しました。');
    }
  };
  
  const handleSnsUrlChange = (index: number, value: string) => {
    const newSnsUrls = [...snsUrls];
    newSnsUrls[index] = value;
    setSnsUrls(newSnsUrls);
  };

  if (loading) return <div>読み込み中...</div>;

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-2xl font-bold mb-6">店舗プロフィールの登録・編集</h1>
      <div className="space-y-4">
        <div>
          <label>店舗名 *</label>
          <input type="text" value={storeName} onChange={(e) => setStoreName(e.target.value)} className="w-full p-2 border rounded" />
        </div>
        <div>
          <label>住所 *</label>
          <input type="text" value={address} onChange={(e) => setAddress(e.target.value)} className="w-full p-2 border rounded" />
        </div>
        <div>
          <label>電話番号 *</label>
          <input type="text" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} className="w-full p-2 border rounded" />
        </div>
        <div>
          <label>店舗紹介文</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="w-full p-2 border rounded" rows={5}></textarea>
        </div>
        <div>
          <label>営業時間</label>
          <textarea value={businessHours} onChange={(e) => setBusinessHours(e.target.value)} className="w-full p-2 border rounded" rows={3}></textarea>
        </div>
        {/* --- ↓↓↓ ここからがご要望の追加項目 ↓↓↓ --- */}
        <div>
          <label>店舗写真 (複数可)</label>
          <div className="p-4 border rounded bg-gray-50">
            <p className="text-sm text-gray-500">（ファイルアップロード機能は別途実装が必要です）</p>
          </div>
        </div>
        {/* --- ↑↑↑ ここまでがご要望の追加項目 ↑↑↑ --- */}
        <div>
          <label>公式ウェブサイトURL</label>
          <input type="url" value={websiteUrl} onChange={(e) => setWebsiteUrl(e.target.value)} className="w-full p-2 border rounded" placeholder="https://..." />
        </div>
        <div>
          <label>SNS URL 1</label>
          <input type="url" value={snsUrls[0]} onChange={(e) => handleSnsUrlChange(0, e.target.value)} className="w-full p-2 border rounded" placeholder="https://..." />
        </div>
        <div>
          <label>SNS URL 2</label>
          <input type="url" value={snsUrls[1]} onChange={(e) => handleSnsUrlChange(1, e.target.value)} className="w-full p-2 border rounded" placeholder="https://..." />
        </div>
        <div>
          <label>SNS URL 3</label>
          <input type="url" value={snsUrls[2]} onChange={(e) => handleSnsUrlChange(2, e.target.value)} className="w-full p-2 border rounded" placeholder="https://..." />
        </div>
        
        <button onClick={handleSaveProfile} className="px-6 py-2 bg-green-500 text-white rounded hover:bg-green-600">
          保存する
        </button>
      </div>

      {/* --- ↓↓↓ ここからがご要望の追加項目 ↓↓↓ --- */}
      <div className="mt-8">
        <Link href="/partner/dashboard">
          <a className="text-blue-600 hover:underline">
            ← ダッシュボードに戻る
          </a>
        </Link>
      </div>
      {/* --- ↑↑↑ ここまでがご要望の追加項目 ↑↑↑ --- */}
    </div>
  );
};

export default StoreProfilePage;