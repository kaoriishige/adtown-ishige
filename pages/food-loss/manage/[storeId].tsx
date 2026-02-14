import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { db, storage } from '../../../lib/firebase-client';
import { 
  collection, query, where, addDoc, updateDoc, doc, 
  serverTimestamp, onSnapshot, orderBy, getDoc, setDoc
} from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { v4 as uuidv4 } from 'uuid';
import { 
  RiAddLine, RiCheckLine, RiErrorWarningLine, RiImageAddLine, 
  RiLoader4Line, RiExternalLinkLine, RiStore2Line, RiMapPinLine, 
  RiPhoneLine, RiPriceTag3Line, RiTimeLine, RiShoppingBagLine
} from 'react-icons/ri';

// --- 型定義 ---
interface FoodLossStore {
  storeId: string;
  storeName: string;
  category: string;
  address: string;
  phone: string;
  description?: string;
  businessHours?: string;
  createdAt: any;
}

interface FoodLossItem {
  id: string;
  storeId: string;
  storeName: string;
  title: string;
  price: number;
  originalPrice?: number;
  quantity: string;
  pickupTime: string;
  status: 'available' | 'sold_out';
  imageUrl?: string;
  createdAt: any;
}

declare const __app_id: string;
const appId = process.env.NEXT_PUBLIC_APP_ID || (typeof __app_id !== 'undefined' ? __app_id : 'default-app-id');

const FoodLossManagePage = () => {
  const router = useRouter();
  const { storeId } = router.query;

  const [storeProfile, setStoreProfile] = useState<FoodLossStore | null>(null);
  const [items, setItems] = useState<FoodLossItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isNewStore, setIsNewStore] = useState(false);

  useEffect(() => {
    // lib/firebase-client.ts からインポートされた db インスタンスのプロジェクトIDを確認
    const projectId = (db as any)._databaseId?.projectId || 'unknown';
    console.log("Portal UI: Current Firebase Project ID:", projectId);
  }, []);
  
  const [regStoreName, setRegStoreName] = useState('');
  const [regCategory, setRegCategory] = useState('');
  const [regAddress, setRegAddress] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regDescription, setRegDescription] = useState('');
  const [regBusinessHours, setRegBusinessHours] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [registrationStep, setRegistrationStep] = useState(1);
  const [tempItems, setTempItems] = useState<any[]>([]);

  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [originalPrice, setOriginalPrice] = useState('');
  const [quantity, setQuantity] = useState('');
  const [pickupTime, setPickupTime] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [pendingItems, setPendingItems] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!storeId) return;
    const checkStore = async () => {
      const storePath = `artifacts/${appId}/food_loss_stores/${storeId}`;
      console.log("Portal UI: checking store at path:", storePath);
      try {
        const storeRef = doc(db, 'artifacts', appId, 'food_loss_stores', storeId as string);
        const storeSnap = await getDoc(storeRef);
        if (storeSnap.exists()) {
          console.log("Portal UI: Store profile found!");
          setStoreProfile(storeSnap.data() as FoodLossStore);
          setIsNewStore(false);
        } else {
          console.log("Portal UI: Store profile NOT found, showing setup.");
          setIsNewStore(true);
        }
      } catch (err: any) {
        console.error("Portal UI: Store check error details:", err.code, err.message);
      } finally {
        setLoading(false);
      }
    };
    checkStore();
  }, [storeId]);

  useEffect(() => {
    if (!storeId || isNewStore) return;
    const itemsRef = collection(db, 'artifacts', appId, 'food_loss_items');
    console.log("Portal UI: Fetching items from path:", itemsRef.path);
    const q = query(itemsRef, where('storeId', '==', storeId));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      console.log("Portal UI: Fetched items count:", snapshot.size);
      const fetchedItems = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as FoodLossItem[];
      // メモリ内でソート
      fetchedItems.sort((a, b) => {
        const timeA = a.createdAt?.seconds || 0;
        const timeB = b.createdAt?.seconds || 0;
        return timeB - timeA;
      });
      setItems(fetchedItems);
    }, (err: any) => {
      console.error("Portal UI: Items fetch error details:", err.code, err.message, "Path:", itemsRef.path);
    });
    return () => unsubscribe();
  }, [storeId, isNewStore]);

  const handleNextStep = (e: React.FormEvent) => {
    e.preventDefault();
    setRegistrationStep(2);
    window.scrollTo(0, 0);
  };

  const addTempItem = () => {
    if (!title || !price || !quantity) {
      alert("商品名、価格、個数は必須です");
      return;
    }
    const newItem = {
      id: Math.random().toString(36).substr(2, 9),
      title,
      price: parseInt(price),
      originalPrice: originalPrice ? parseInt(originalPrice) : undefined,
      quantity,
      pickupTime,
      imageFile: imageFile, 
      localUrl: imageFile ? URL.createObjectURL(imageFile) : '',
      status: 'available'
    };
    setTempItems([...tempItems, newItem]);
    setTitle(''); setPrice(''); setOriginalPrice(''); setQuantity(''); setPickupTime(''); setImageFile(null);
  };

  const handleFinalRegistration = async () => {
    if (isRegistering) return;
    setIsRegistering(true);
    try {
      const storeData: FoodLossStore = {
        storeId: storeId as string,
        storeName: regStoreName,
        category: regCategory,
        address: regAddress,
        phone: regPhone,
        description: regDescription,
        businessHours: regBusinessHours,
        createdAt: serverTimestamp()
      };
      await setDoc(doc(db, 'artifacts', appId, 'food_loss_stores', storeId as string), storeData);
      
      for (const item of tempItems) {
        let finalImageUrl = '';
        if (item.imageFile) {
          const extension = item.imageFile.name.split('.').pop();
          const fileName = `${Date.now()}_${uuidv4()}.${extension}`;
          const storageRef = ref(storage, `food_loss/${storeId}/${fileName}`);
          const uploadTask = uploadBytesResumable(storageRef, item.imageFile);
          finalImageUrl = await new Promise((resolve, reject) => {
            uploadTask.on('state_changed', null, (err) => reject(err), async () => resolve(await getDownloadURL(uploadTask.snapshot.ref)));
          });
        }

        const itemData = { 
          storeId, 
          storeName: regStoreName, 
          title: item.title,
          price: item.price,
          originalPrice: item.originalPrice,
          quantity: item.quantity,
          pickupTime: item.pickupTime,
          status: item.status,
          imageUrl: finalImageUrl,
          createdAt: serverTimestamp(), 
          updatedAt: serverTimestamp() 
        };
        await setDoc(doc(db, 'artifacts', appId, 'food_loss_items', item.id), itemData);
      }
      setIsNewStore(false);
      setStoreProfile(storeData);
    } catch (err) {
      console.error("Registration error:", err);
      alert("登録に失敗しました。");
    } finally {
      setIsRegistering(false);
    }
  };

  const addPendingItem = () => {
    if (!title || !price || !quantity) {
      alert("商品名、価格、個数は必須です");
      return;
    }
    setPendingItems([...pendingItems, {
      id: Math.random().toString(36).substr(2, 9),
      title, 
      price: parseInt(price), 
      originalPrice: originalPrice ? parseInt(originalPrice) : undefined,
      quantity, 
      pickupTime, 
      imageFile: imageFile,
      localUrl: imageFile ? URL.createObjectURL(imageFile) : '',
      status: 'available'
    }]);
    setTitle(''); setPrice(''); setOriginalPrice(''); setQuantity(''); setPickupTime(''); setImageFile(null);
  };

  const handleBulkPublish = async () => {
    if (isSubmitting || pendingItems.length === 0) return;
    setIsSubmitting(true);
    try {
      for (const item of pendingItems) {
        let finalImageUrl = '';
        if (item.imageFile) {
          const extension = item.imageFile.name.split('.').pop();
          const fileName = `${Date.now()}_${uuidv4()}.${extension}`;
          const storageRef = ref(storage, `food_loss/${storeId}/${fileName}`);
          const uploadTask = uploadBytesResumable(storageRef, item.imageFile);
          finalImageUrl = await new Promise((resolve, reject) => {
            uploadTask.on('state_changed', null, (err) => reject(err), async () => resolve(await getDownloadURL(uploadTask.snapshot.ref)));
          });
        }

        const itemData = { 
          storeId, 
          storeName: storeProfile?.storeName || '', 
          title: item.title,
          price: item.price,
          originalPrice: item.originalPrice,
          quantity: item.quantity,
          pickupTime: item.pickupTime,
          status: item.status,
          imageUrl: finalImageUrl,
          createdAt: serverTimestamp(), 
          updatedAt: serverTimestamp() 
        };
        await setDoc(doc(db, 'artifacts', appId, 'food_loss_items', item.id), itemData);
      }
      setPendingItems([]);
      alert("全商品を一括公開しました！");
    } catch (err) {
      console.error("Bulk publish error:", err);
      alert("公開に失敗しました。");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!storeId || !storeProfile || isSubmitting) return;
    setIsSubmitting(true); setError(null); setUploadProgress(0);
    try {
      let finalImageUrl = '';
      if (imageFile) {
        const extension = imageFile.name.split('.').pop();
        const fileName = `${Date.now()}_${uuidv4()}.${extension}`;
        const storageRef = ref(storage, `food_loss/${storeId}/${fileName}`);
        const uploadTask = uploadBytesResumable(storageRef, imageFile);
        finalImageUrl = await new Promise((resolve, reject) => {
          uploadTask.on('state_changed', 
            (snapshot) => setUploadProgress((snapshot.bytesTransferred / snapshot.totalBytes) * 100),
            (error) => reject(error),
            async () => resolve(await getDownloadURL(uploadTask.snapshot.ref))
          );
        });
      }
      const itemData: any = {
        storeId, storeName: storeProfile.storeName, title, price: parseInt(price),
        originalPrice: originalPrice ? parseInt(originalPrice) : undefined,
        quantity, pickupTime, status: 'available', imageUrl: finalImageUrl,
        createdAt: serverTimestamp(), updatedAt: serverTimestamp(),
      };
      await addDoc(collection(db, 'artifacts', appId, 'food_loss_items'), itemData);
      setTitle(''); setPrice(''); setOriginalPrice(''); setQuantity(''); setPickupTime(''); setImageFile(null); setUploadProgress(null);
      alert('登録しました！');
    } catch (err: any) {
      console.error("Post error:", err);
      setError("登録に失敗しました: " + (err.message || "不明なエラー"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (item: FoodLossItem) => {
    try {
      const newStatus = item.status === 'available' ? 'sold_out' : 'available';
      await updateDoc(doc(db, 'artifacts', appId, 'food_loss_items', item.id), { status: newStatus });
    } catch (err) {
      console.error("Status update error:", err);
    }
  };

  if (!storeId) return <div className="p-8 text-center mt-20">URLが正しくありません</div>;
  if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-50 font-bold text-slate-500">読み込み中...</div>;

  if (isNewStore) {
    return (
      <div className="min-h-screen bg-indigo-50 p-4 font-sans pb-20">
        <Head><title>店舗登録 | フードロス・レスキュー</title></Head>
        <div className="max-w-md mx-auto mt-6">
          <div className="flex items-center justify-center mb-8 gap-4">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black ${registrationStep >= 1 ? 'bg-indigo-600 text-white' : 'bg-white text-slate-300 shadow'}`}>1</div>
            <div className={`h-1 w-12 rounded-full ${registrationStep >= 2 ? 'bg-indigo-600' : 'bg-slate-200'}`}></div>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black ${registrationStep >= 2 ? 'bg-indigo-600 text-white' : 'bg-white text-slate-300 shadow'}`}>2</div>
          </div>
          <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
            {registrationStep === 1 ? (
              <>
                <div className="bg-indigo-600 p-8 text-white text-center">
                  <RiStore2Line className="text-5xl mx-auto mb-2" />
                  <h1 className="text-2xl font-black">店舗プロフィールの登録</h1>
                  <p className="text-xs opacity-80 mt-2">まずはお店の情報を教えてください</p>
                </div>
                <form onSubmit={handleNextStep} className="p-8 space-y-5">
                  <div><label className="text-xs font-black text-slate-400 block mb-1">店名</label>
                    <input type="text" required value={regStoreName} onChange={e => setRegStoreName(e.target.value)} className="w-full p-4 bg-slate-50 rounded-xl font-bold border-none outline-none focus:ring-2 focus:ring-indigo-600" /></div>
                  <div><label className="text-xs font-black text-slate-400 block mb-1">ジャンル</label>
                    <input type="text" required value={regCategory} onChange={e => setRegCategory(e.target.value)} className="w-full p-4 bg-slate-50 rounded-xl font-bold border-none outline-none focus:ring-2 focus:ring-indigo-600" /></div>
                  <div><label className="text-xs font-black text-slate-400 block mb-1">電話番号</label>
                    <input type="tel" required value={regPhone} onChange={e => setRegPhone(e.target.value)} className="w-full p-4 bg-slate-50 rounded-xl font-bold border-none outline-none focus:ring-2 focus:ring-indigo-600" /></div>
                  <div><label className="text-xs font-black text-slate-400 block mb-1">住所</label>
                    <input type="text" required value={regAddress} onChange={e => setRegAddress(e.target.value)} className="w-full p-4 bg-slate-50 rounded-xl font-bold border-none outline-none focus:ring-2 focus:ring-indigo-600" /></div>
                  <div><label className="text-xs font-black text-slate-400 block mb-1">営業時間</label>
                    <input type="text" required value={regBusinessHours} onChange={e => setRegBusinessHours(e.target.value)} className="w-full p-4 bg-slate-50 rounded-xl font-bold border-none outline-none focus:ring-2 focus:ring-indigo-600" /></div>
                  <button type="submit" className="w-full bg-indigo-600 text-white font-black py-4 rounded-2xl shadow-lg mt-4">次へ進む：商品を登録</button>
                </form>
              </>
            ) : (
              <>
                <div className="bg-rose-500 p-8 text-white text-center">
                  <RiShoppingBagLine className="text-5xl mx-auto mb-2" />
                  <h1 className="text-2xl font-black">商品の登録</h1>
                  <p className="text-xs opacity-80 mt-2">今回レスキューしてほしい商品を<br/>すべて入力してください</p>
                </div>
                <div className="p-8 space-y-6">
                  {tempItems.length > 0 && (
                    <div className="space-y-3">
                      {tempItems.map((item, idx) => (
                        <div key={idx} className="bg-slate-50 p-4 rounded-2xl border flex justify-between items-center gap-3">
                          {item.localUrl && <img src={item.localUrl} className="w-12 h-12 rounded-lg object-cover" />}
                          <div className="flex-1 min-w-0">
                            <p className="font-black text-slate-800 truncate text-sm">{item.title}</p>
                            <p className="text-xs font-bold text-rose-500">¥{item.price.toLocaleString()} <span className="text-slate-400 line-through ml-1">{item.originalPrice ? `¥${item.originalPrice.toLocaleString()}` : ''}</span></p>
                          </div>
                          <button onClick={() => setTempItems(tempItems.filter((_, i) => i !== idx))} className="text-slate-300 p-2">×</button>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="bg-rose-50 p-6 rounded-3xl space-y-4 border border-rose-100">
                    <div className="flex items-center gap-4 mb-2">
                      <div className="w-16 h-16 bg-white rounded-xl border-2 border-dashed border-rose-200 flex items-center justify-center overflow-hidden relative">
                        {imageFile ? <img src={URL.createObjectURL(imageFile)} className="w-full h-full object-cover" /> : <RiImageAddLine className="text-xl text-rose-300" />}
                        <input type="file" accept="image/*" onChange={e => setImageFile(e.target.files?.[0] || null)} className="absolute inset-0 opacity-0 cursor-pointer" />
                      </div>
                      <p className="text-[10px] font-black text-rose-400 leading-tight">商品の写真を<br/>追加する</p>
                    </div>
                    <input type="text" placeholder="商品名 (例: 特製カレー)" value={title} onChange={e => setTitle(e.target.value)} className="w-full p-3 bg-white rounded-xl outline-none font-bold" />
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <p className="text-[10px] font-black text-rose-300 mb-1 ml-1">販売価格</p>
                        <input type="text" inputMode="numeric" placeholder="500" value={price} onChange={e => setPrice(e.target.value)} className="w-full p-3 bg-white rounded-xl outline-none font-bold text-rose-600" />
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-rose-300 mb-1 ml-1">定価</p>
                        <input type="text" inputMode="numeric" placeholder="1000" value={originalPrice} onChange={e => setOriginalPrice(e.target.value)} className="w-full p-3 bg-white rounded-xl outline-none font-bold text-slate-400" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <input type="text" placeholder="個数 (例: 3個)" value={quantity} onChange={e => setQuantity(e.target.value)} className="w-full p-3 bg-white rounded-xl outline-none font-bold" />
                      <div>
                <p className="text-[10px] font-black text-rose-300 mb-1 ml-1">受取開始時間</p>
                <input type="text" placeholder="何時から（例: 17:00〜）" value={pickupTime} onChange={e => setPickupTime(e.target.value)} className="w-full p-3 bg-white rounded-xl outline-none font-bold" />
                      </div>
                    </div>
                    <button onClick={addTempItem} className="w-full bg-rose-100 text-rose-600 font-black py-4 rounded-xl hover:bg-rose-200 transition">＋ リストに追加</button>
                  </div>
                  <div className="flex flex-col gap-3">
                    <button onClick={handleFinalRegistration} disabled={isRegistering || tempItems.length === 0} className="w-full bg-indigo-600 text-white font-black py-4 rounded-2xl shadow-lg disabled:bg-slate-300"> {isRegistering ? '保存中...' : `一括登録して公開する (${tempItems.length}件)`} </button>
                    <button onClick={() => setRegistrationStep(1)} className="text-xs font-bold text-slate-400 text-center">← 店舗情報に戻る</button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-20">
      <Head><title>{`${storeProfile?.storeName} - フードロス管理`}</title></Head>
      <header className="bg-white border-b sticky top-0 z-10 p-4 shadow-sm flex justify-between items-center">
        <div className="min-w-0"><h1 className="font-black text-lg text-slate-800 truncate">{storeProfile?.storeName}</h1><p className="text-[10px] font-bold text-slate-400">{storeProfile?.category}</p></div>
        <img src="https://scdn.line-apps.com/n/line_add_friends/btn/ja.png" alt="友だち追加" height="30" className="h-8" />
      </header>
      <main className="max-w-md mx-auto p-4 space-y-8">
        <section>
          <h2 className="text-sm font-black text-slate-800 mb-3 ml-1">現在掲載中の商品</h2>
          <div className="space-y-3">
            {items.length === 0 ? <div className="bg-white p-8 rounded-2xl border-2 border-dashed text-center text-slate-400 font-bold">商品は掲載されていません</div> :
              items.map(item => (
                <div key={item.id} className={`bg-white p-4 rounded-2xl shadow border flex items-center gap-4 transition-opacity ${item.status === 'sold_out' ? 'opacity-60 bg-slate-50' : ''}`}>
                  <div className="flex-1 min-w-0">
                    <p className={`font-black text-lg truncate ${item.status === 'sold_out' ? 'text-slate-400' : 'text-slate-800'}`}>{item.title}</p>
                    <p className="text-[10px] text-orange-500 font-bold">残り: {item.quantity} / 受取開始: {item.pickupTime}</p>
                    <div className="flex items-baseline gap-2 mt-1">
                      <p className={`text-xl font-black ${item.status === 'sold_out' ? 'text-slate-400' : 'text-red-600'}`}>¥{item.price.toLocaleString()}</p>
                      {item.originalPrice && (
                        <p className="text-xs font-bold text-slate-400 line-through">¥{item.originalPrice.toLocaleString()}</p>
                      )}
                    </div>
                  </div>
                  <button onClick={() => handleToggleStatus(item)} className={`px-4 py-2 rounded-xl font-black text-xs transition-colors ${item.status === 'available' ? 'bg-rose-500 text-white' : 'bg-indigo-100 text-indigo-600'}`}>
                    {item.status === 'available' ? '販売終了' : '販売を再開'}
                  </button>
                </div>
              ))}
          </div>
        </section>

        <section className="bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-100">
          <div className="bg-indigo-600 p-6 text-white flex items-center gap-4">
            <RiAddLine className="text-2xl" />
            <div><h2 className="text-lg font-black">情報を追加する</h2><p className="text-[10px] opacity-70">複数まとめて公開できます</p></div>
          </div>
          {pendingItems.length > 0 && (
            <div className="p-6 bg-slate-50 border-b space-y-4">
              <div className="space-y-2">
                {pendingItems.map((item, idx) => (
                  <div key={idx} className="bg-white p-3 rounded-xl border flex items-center gap-3">
                    {item.localUrl && <img src={item.localUrl} className="w-10 h-10 rounded-lg object-cover" />}
                    <div className="flex-1 min-w-0">
                      <p className="font-black text-xs truncate">{item.title}</p>
                      <p className="text-[10px] font-bold text-rose-500">¥{item.price.toLocaleString()} <span className="text-slate-400 line-through ml-1">{item.originalPrice ? `¥${item.originalPrice.toLocaleString()}` : ''}</span></p>
                    </div>
                    <button onClick={() => setPendingItems(pendingItems.filter((_, i) => i !== idx))} className="text-slate-300 p-1">×</button>
                  </div>
                ))}
              </div>
              <button onClick={handleBulkPublish} disabled={isSubmitting} className="w-full bg-rose-500 text-white font-black py-4 rounded-2xl shadow-lg hover:bg-rose-600 transition disabled:bg-slate-300 flex items-center justify-center gap-2">
                {isSubmitting ? <RiLoader4Line className="animate-spin" /> : <RiCheckLine />} 一括公開する ({pendingItems.length}件)
              </button>
            </div>
          )}
          <div className="p-6 space-y-4">
            <div className="flex items-center gap-4 mb-2">
              <div className="w-20 h-20 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 flex items-center justify-center overflow-hidden relative group">
                {imageFile ? (
                  <img src={URL.createObjectURL(imageFile)} className="w-full h-full object-cover" />
                ) : (
                  <RiImageAddLine className="text-2xl text-slate-300" />
                )}
                <input type="file" accept="image/*" onChange={e => setImageFile(e.target.files?.[0] || null)} className="absolute inset-0 opacity-0 cursor-pointer" />
              </div>
              <div className="flex-1">
                <p className="text-[10px] font-black text-slate-400 uppercase mb-1">商品写真</p>
                <p className="text-xs text-slate-500 font-bold leading-tight">おいしそうな写真を<br/>選びましょう</p>
              </div>
            </div>

            <input type="text" placeholder="商品名 (例: 本日のパン詰め合わせ)" value={title} onChange={e => setTitle(e.target.value)} className="w-full p-4 bg-slate-50 rounded-xl font-bold outline-none border-none focus:ring-2 focus:ring-indigo-500" />
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-[10px] font-black text-slate-400 mb-1 ml-1">販売価格 (税込)</p>
                <input type="text" inputMode="numeric" placeholder="例: 500" value={price} onChange={e => setPrice(e.target.value)} className="w-full p-4 bg-slate-50 rounded-xl font-black text-rose-600 outline-none border-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 mb-1 ml-1">通常価格 (定価)</p>
                <input type="text" inputMode="numeric" placeholder="例: 1000" value={originalPrice} onChange={e => setOriginalPrice(e.target.value)} className="w-full p-4 bg-slate-50 rounded-xl font-bold text-slate-400 outline-none border-none focus:ring-2 focus:ring-indigo-500" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <input type="text" placeholder="個数 (例: 3個)" value={quantity} onChange={e => setQuantity(e.target.value)} className="w-full p-4 bg-slate-50 rounded-xl font-bold outline-none border-none focus:ring-2 focus:ring-indigo-500" />
              <div>
                <p className="text-[10px] font-black text-slate-400 mb-1 ml-1">受取開始時間</p>
                <input type="text" placeholder="何時から（例: 18:00〜）" value={pickupTime} onChange={e => setPickupTime(e.target.value)} className="w-full p-4 bg-slate-50 rounded-xl font-bold text-orange-600 outline-none border-none focus:ring-2 focus:ring-indigo-500" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button onClick={addPendingItem} className="bg-slate-100 text-slate-800 font-black py-4 rounded-2xl flex items-center justify-center gap-2 hover:bg-slate-200"><RiAddLine /> リストに追加</button>
              <button onClick={handlePost} disabled={isSubmitting} className="bg-indigo-600 text-white font-black py-4 rounded-2xl shadow-lg flex items-center justify-center gap-2 hover:bg-indigo-700 disabled:bg-slate-300">
                {isSubmitting ? <RiLoader4Line className="animate-spin" /> : <RiCheckLine />} 今すぐ公開
              </button>
            </div>
          </div>
        </section>
        
        <section className="bg-slate-900 text-white p-8 rounded-3xl shadow-2xl text-center relative overflow-hidden">
          <h3 className="text-xl font-black mb-3">公式パートナーになりませんか？</h3>
          <p className="text-sm text-slate-400 font-bold mb-6">強力な集客機能とAIマッチングが使い放題。</p>
          <a href="/partner/signup" className="inline-flex items-center gap-2 bg-white text-slate-900 font-black py-4 px-8 rounded-2xl">詳しく見る <RiExternalLinkLine /></a>
        </section>
      </main>
      <footer className="p-10 text-center opacity-30 select-none"><p className="text-[10px] font-black uppercase tracking-widest text-slate-600">Food Loss Rescue Admin v2.0</p></footer>
    </div>
  );
};

export default FoodLossManagePage;
