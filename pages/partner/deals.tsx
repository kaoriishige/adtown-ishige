import { useState, useEffect, useCallback } from 'react';
import type { NextPage } from 'next';
import Link from 'next/link';
import { db, auth, storage } from '@/lib/firebase';
import { 
  collection, query, where, getDocs, addDoc, serverTimestamp, orderBy, doc, Timestamp
} from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { onAuthStateChanged, User } from 'firebase/auth';
import { v4 as uuidv4 } from 'uuid';

// --- 型定義 ---
interface Store {
  id: string;
  ownerId: string;
}

interface Deal {
  id: string;
  type: 'お得情報' | 'クーポン' | 'フードロス';
  title: string;
  description: string;
  imageUrl?: string;
  createdAt: string;
}

// --- ページコンポーネント ---
const PartnerDealsPage: NextPage = () => {
  const [user, setUser] = useState<User | null>(null);
  const [store, setStore] = useState<Store | null>(null);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);

  // フォームのState
  const [newDealType, setNewDealType] = useState<'お得情報' | 'クーポン' | 'フードロス'>('お得情報');
  const [newDealTitle, setNewDealTitle] = useState('');
  const [newDealDescription, setNewDealDescription] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setLoading(true);
      setUser(currentUser);
      if (!currentUser) {
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  const fetchStoreAndDeals = useCallback(async (currentUser: User) => {
    try {
      setError(null);
      const storesRef = collection(db, 'stores');
      const storeQuery = query(storesRef, where("ownerId", "==", currentUser.uid));
      const storeSnapshot = await getDocs(storeQuery);

      if (storeSnapshot.empty) {
        setError("店舗情報が見つかりません。まずプロフィールを登録してください。");
        setLoading(false);
        return;
      }
      
      const storeDoc = storeSnapshot.docs[0];
      const fetchedStore = { id: storeDoc.id, ...storeDoc.data() } as Store;
      setStore(fetchedStore);

      const dealsRef = collection(db, 'storeDeals');
      const dealsQuery = query(dealsRef, where("storeId", "==", fetchedStore.id), orderBy("createdAt", "desc"));
      const dealsSnapshot = await getDocs(dealsQuery);

      const dealsData = dealsSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          type: data.type,
          title: data.title,
          description: data.description,
          imageUrl: data.imageUrl,
          createdAt: (data.createdAt as Timestamp).toDate().toISOString(),
        };
      });
      setDeals(dealsData);
    } catch (err) {
      console.error(err);
      setError("データの読み込みに失敗しました。");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) {
      fetchStoreAndDeals(user);
    }
  }, [user, fetchStoreAndDeals]);
  
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setSelectedFile(event.target.files[0]);
    }
  };

  const handleCreateDeal = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!store || !user) {
      setError("店舗情報またはユーザー情報が読み込めていません。");
      return;
    }
    setIsSubmitting(true);
    setError(null);

    try {
      let imageUrl = '';
      if (selectedFile) {
        setUploadProgress(0);
        const uniqueFileName = `${uuidv4()}_${selectedFile.name}`;
        const fileRef = ref(storage, `deals/${store.id}/${uniqueFileName}`);
        const metadata = { customMetadata: { ownerId: user.uid } };
        const uploadTask = uploadBytesResumable(fileRef, selectedFile, metadata);
        
        imageUrl = await new Promise<string>((resolve, reject) => {
          uploadTask.on('state_changed',
            (snapshot) => setUploadProgress((snapshot.bytesTransferred / snapshot.totalBytes) * 100),
            (error) => reject(error),
            async () => { resolve(await getDownloadURL(uploadTask.snapshot.ref)); }
          );
        });
      }
      
      const dealsCollectionRef = collection(db, 'storeDeals');
      await addDoc(dealsCollectionRef, {
        type: newDealType, title: newDealTitle, description: newDealDescription,
        imageUrl, storeId: store.id, ownerId: user.uid, createdAt: serverTimestamp(), isActive: true,
      });

      setNewDealTitle('');
      setNewDealDescription('');
      setSelectedFile(null);
      setUploadProgress(null);
      if (user) fetchStoreAndDeals(user);

    } catch (err: any) {
      console.error(err);
      setError(err.message || '登録中にエラーが発生しました。');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ▼▼▼ ここを修正しました ▼▼▼
  const handleDeleteDeal = async (dealId: string) => {
    if (!user) {
      alert("ログインしていません。");
      return;
    }
    if (!window.confirm("この情報を削除しますか？")) return;
    
    setError(null);
    try {
      // 認証トークンを取得
      const token = await user.getIdToken();

      // ヘッダーにトークンを含めてAPIを呼び出す
      const response = await fetch(`/api/partner/deals/${dealId}`, { 
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || '削除に失敗しました。');
      }

      setDeals(prevDeals => prevDeals.filter(deal => deal.id !== dealId));
      alert('削除しました。');

    } catch (err: any) {
      console.error(err);
      setError(err.message);
    }
  };
  // ▲▲▲ 修正はここまで ▲▲▲
  
  if (loading) return <div>読み込み中...</div>;
  if (!user) return <div>このページにアクセスするにはログインが必要です。</div>;

  return (
    <div className="container mx-auto p-8 max-w-3xl">
      <h1 className="text-2xl font-bold mb-6">お得情報・クーポン・フードロス管理</h1>
      
      <form onSubmit={handleCreateDeal} className="space-y-4 p-4 border rounded-lg mb-8">
        <h2 className="text-xl font-semibold">新規登録</h2>
        <div>
            <label>種別</label>
            <select 
              value={newDealType} 
              onChange={(e) => setNewDealType(e.target.value as 'お得情報' | 'クーポン' | 'フードロス')} 
              className="w-full p-2 border rounded mt-1"
            >
              <option value="お得情報">お得情報</option>
              <option value="クーポン">クーポン</option>
              <option value="フードロス">フードロス</option>
            </select>
        </div>
        <div><label>タイトル</label><input type="text" value={newDealTitle} onChange={(e) => setNewDealTitle(e.target.value)} required className="w-full p-2 border rounded mt-1" /></div>
        <div><label>説明文</label><textarea value={newDealDescription} onChange={(e) => setNewDealDescription(e.target.value)} required className="w-full p-2 border rounded mt-1" rows={3}></textarea></div>
        <div>
          <label>画像 (任意)</label>
          <input type="file" onChange={handleFileChange} accept="image/*" className="w-full p-2 border rounded mt-1" />
          {uploadProgress !== null && (<div className="w-full bg-gray-200 rounded-full h-2.5 my-2"><div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${uploadProgress}%` }}></div></div>)}
        </div>
        <button type="submit" disabled={isSubmitting} className="px-6 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:bg-gray-400">
          {isSubmitting ? '登録中...' : '登録する'}
        </button>
      </form>
      
      <h2 className="text-xl font-semibold">登録済みリスト</h2>
      {error && <p className="text-red-500 my-4 bg-red-100 p-3 rounded">エラー: {error}</p>}
      <div className="space-y-4 mt-4">
        {deals.length > 0 ? (
          deals.map(deal => (
            <div key={deal.id} className="p-4 border rounded-lg flex justify-between items-center gap-4">
              <div className="flex items-center min-w-0">
                {deal.imageUrl && <img src={deal.imageUrl} alt={deal.title} className="w-16 h-16 object-cover rounded mr-4 flex-shrink-0"/>}
                <div className="min-w-0">
                  <span className="text-xs bg-gray-200 rounded-full px-2 py-1">{deal.type}</span>
                  <p className="font-bold truncate">{deal.title}</p>
                  <p className="text-sm text-gray-600 truncate">{deal.description}</p>
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-xs text-gray-500 mb-2">{new Date(deal.createdAt).toLocaleDateString('ja-JP')}</p>
                <button onClick={() => handleDeleteDeal(deal.id)} className="text-red-500 hover:underline">削除</button>
              </div>
            </div>
          ))
        ) : (
          <p>まだ情報が登録されていません。</p>
        )}
      </div>

      <div className="mt-8">
        <Link href="/partner/dashboard" legacyBehavior>
          <a className="text-blue-600 hover:underline">
            ← ダッシュボードに戻る
          </a>
        </Link>
      </div>
    </div>
  );
};

export default PartnerDealsPage;