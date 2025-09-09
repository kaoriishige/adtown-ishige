import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
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

    const storeData = {
      storeName,
      address,
      phoneNumber,
      description,
      businessHours,
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
        <button onClick={handleSaveProfile} className="px-6 py-2 bg-green-500 text-white rounded hover:bg-green-600">
          保存する
        </button>
      </div>
    </div>
  );
};

export default StoreProfilePage;