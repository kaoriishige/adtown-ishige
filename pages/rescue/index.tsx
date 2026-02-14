import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { db } from '../../lib/firebase-client';
import { 
  collection, query, where, onSnapshot, orderBy, limit, doc, getDoc 
} from 'firebase/firestore';
import { 
  RiShoppingBagLine, RiMapPinLine, RiTimeLine, RiInformationLine, 
  RiArrowRightSLine, RiPhoneLine, RiPriceTag3Line, RiStore2Line, RiSearchLine
} from 'react-icons/ri';
import { IoSparklesSharp } from 'react-icons/io5';

interface FoodLossItem {
  id: string;
  storeId: string;
  storeName: string;
  title: string;
  price: number;
  originalPrice?: number;
  quantity: string;
  pickupTime?: string;
  status: 'available' | 'sold_out';
  imageUrl?: string;
  createdAt: any;
}

interface FoodLossStore {
  storeName: string;
  category: string;
  address: string;
  phone: string;
}

const appId = process.env.NEXT_PUBLIC_APP_ID || process.env.NEXT_PUBLIC_FIREBASE_APP_ID || 'default-app-id';

const RescuePage = () => {
  const [items, setItems] = useState<FoodLossItem[]>([]);
  const [storeData, setStoreData] = useState<{[key: string]: FoodLossStore}>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const itemsRef = collection(db, 'artifacts', appId, 'food_loss_items');
    const q = query(
      itemsRef, 
      where('status', '==', 'available'),
      orderBy('createdAt', 'desc'),
      limit(100)
    );

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const fetchedItems = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as FoodLossItem[];
      
      setItems(fetchedItems);

      // 各商品の店舗情報を個別に取得
      const uniqueStoreIds = Array.from(new Set(fetchedItems.map(i => i.storeId)));
      const newStoreData: {[key: string]: FoodLossStore} = { ...storeData };
      
      for (const sid of uniqueStoreIds) {
        if (!newStoreData[sid]) {
          const sRef = doc(db, 'artifacts', appId, 'food_loss_stores', sid);
          const sSnap = await getDoc(sRef);
          if (sSnap.exists()) {
            newStoreData[sid] = sSnap.data() as FoodLossStore;
          }
        }
      }
      setStoreData(newStoreData);
      setLoading(false);
    }, (err) => {
      console.error("Rescue fetch error:", err);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className="min-h-screen bg-rose-50 font-sans pb-20">
      <Head>
        <title>フードロス・レスキュー | みんなの那須</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0" />
      </Head>

      {/* ヒーローセクション */}
      <header className="bg-rose-500 text-white pt-12 pb-16 px-6 relative overflow-hidden">
        <div className="max-w-xl mx-auto relative z-10">
          <div className="inline-flex items-center bg-white/20 px-4 py-1.5 rounded-full text-xs font-black mb-4 backdrop-blur-md">
            <IoSparklesSharp className="mr-1.5 text-yellow-300" /> フードロス削減プロジェクト
          </div>
          <h1 className="text-5xl font-black mb-3 tracking-tighter leading-tight">
            フードロス・<br /><span className="text-yellow-300">レスキュー</span>
          </h1>
          <p className="text-sm opacity-90 font-bold leading-relaxed max-w-sm">
            那須の美味しいものが、捨てられる前に。<br />
            お店まで足を運んで、お得に「レスキュー」しましょう！
          </p>
        </div>
        
        {/* 背景装飾 */}
        <div className="absolute top-[-10%] right-[-10%] w-72 h-72 bg-rose-400 rounded-full blur-3xl opacity-50"></div>
        <div className="absolute bottom-[-20%] left-[-10%] w-64 h-64 bg-white/10 rounded-full blur-2xl"></div>
      </header>

      <main className="max-w-xl mx-auto px-4 -mt-8 relative z-10 space-y-6">
        {loading ? (
          <div className="bg-white p-16 rounded-[2.5rem] shadow-xl border flex flex-col items-center">
            <div className="w-12 h-12 border-4 border-rose-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-6 text-slate-400 font-black tracking-widest text-xs uppercase">Loading Rescue Info</p>
          </div>
        ) : items.length === 0 ? (
          <div className="bg-white p-12 rounded-[2.5rem] shadow-xl border text-center space-y-6">
            <div className="w-24 h-24 bg-rose-50 rounded-full flex items-center justify-center mx-auto">
              <RiShoppingBagLine className="text-4xl text-rose-200" />
            </div>
            <div>
              <p className="text-xl font-black text-slate-800 leading-snug">現在はレスキュー待ちの商品は<br />ありません。</p>
              <p className="text-xs text-slate-400 mt-3 font-bold">また後ほどチェックしてみてください！</p>
            </div>
          </div>
        ) : (
          items.map(item => {
            const store = storeData[item.storeId];
            return (
              <div key={item.id} className="bg-white rounded-[2rem] shadow-xl overflow-hidden border-2 border-rose-100/50 hover:shadow-2xl transition-all">
                <div className="flex p-5 gap-5">
                  {item.imageUrl ? (
                    <img src={item.imageUrl} className="w-28 h-28 object-cover rounded-3xl shadow-inner flex-shrink-0" />
                  ) : (
                    <div className="w-28 h-28 bg-rose-50 rounded-3xl flex items-center justify-center flex-shrink-0">
                      <RiShoppingBagLine className="text-4xl text-rose-100" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start mb-0.5">
                        <span className="bg-rose-500 text-white text-[9px] font-black px-2.5 py-1 rounded-full uppercase tracking-tighter">
                          Rescue Now!
                        </span>
                        <p className="text-[10px] font-black text-rose-300 flex items-center">
                           #{item.id.slice(-4).toUpperCase()}
                        </p>
                      </div>
                      <h2 className="text-xl font-black text-slate-900 leading-tight mb-1 truncate">{item.title}</h2>
                      <div className="flex items-center gap-2">
                        <p className="text-[11px] font-black text-rose-600 bg-rose-50 px-2 py-0.5 rounded-lg border border-rose-100">
                          {item.quantity}
                        </p>
                        {item.pickupTime && (
                          <p className="text-[11px] font-black text-rose-600 bg-rose-50 px-2 py-0.5 rounded-lg border border-rose-100 flex items-center">
                            <RiTimeLine className="mr-1" /> {item.pickupTime}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-baseline gap-2 mt-2">
                      <span className="text-2xl font-black text-rose-600">¥{item.price.toLocaleString()}</span>
                      {item.originalPrice && (
                        <span className="text-sm text-slate-400 line-through font-bold">¥{item.originalPrice.toLocaleString()}</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* 店舗詳細情報 */}
                <div className="bg-slate-50 p-5 border-t border-slate-100 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm border border-slate-100 text-indigo-600">
                      <RiStore2Line size={24} />
                    </div>
                    <div>
                      <p className="text-sm font-black text-slate-800">{item.storeName}</p>
                      <p className="text-[10px] font-bold text-slate-400">{store?.category || 'フード'}</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 gap-2">
                    <div className="flex items-start gap-2 text-xs text-slate-600 font-bold bg-white p-2.5 rounded-xl border border-slate-100">
                      <RiMapPinLine className="mt-0.5 text-indigo-500 flex-shrink-0" />
                      <span>{store?.address || '住所情報なし'}</span>
                    </div>
                    {store?.phone && (
                      <a href={`tel:${store.phone}`} className="flex items-center gap-2 text-xs text-indigo-600 font-black bg-white p-2.5 rounded-xl border border-indigo-50 shadow-sm active:bg-indigo-50">
                        <RiPhoneLine className="text-base" />
                        <span>電話で問い合わせ: {store.phone}</span>
                      </a>
                    )}
                  </div>

                  <Link href={`/stores/view/${item.storeId}`} legacyBehavior>
                    <a className="flex items-center justify-center gap-2 w-full py-3 mt-2 bg-indigo-600 text-white font-black text-sm rounded-xl shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition">
                      店舗詳細・マップを見る
                      <RiArrowRightSLine />
                    </a>
                  </Link>
                </div>
              </div>
            )
          })
        )}

        {/* ガイド */}
        <section className="bg-white p-8 rounded-[2rem] border-2 border-dashed border-rose-200">
          <h3 className="text-base font-black text-rose-800 flex items-center mb-4">
            <RiInformationLine className="mr-2 text-xl" /> レスキューの仕組みとお願い
          </h3>
          <ul className="text-xs text-rose-700/80 space-y-3 font-bold leading-relaxed">
            <li className="flex gap-2">
              <span className="text-rose-400">•</span>
              数量限定、早い者勝ちです。お取り置きは直接お電話で店舗にご相談ください。
            </li>
            <li className="flex gap-2">
              <span className="text-rose-400">•</span>
              最新の情報を掲載していますが、店頭で売り切れている場合もございます。
            </li>
            <li className="flex gap-2">
              <span className="text-rose-400">•</span>
              フードロス削減は、地域の「美味しい」を未来につなぐ活動です。応援よろしくお願いします！
            </li>
          </ul>
        </section>

        <div className="pt-6 flex flex-col items-center gap-6">
            <Link href="/" className="text-slate-400 font-black text-xs uppercase tracking-widest hover:text-rose-500 transition">
                ← Back to Home
            </Link>
        </div>
      </main>

      <footer className="mt-20 p-10 text-center">
        <p className="text-[10px] text-rose-300 font-black uppercase tracking-[0.3em]">
          Food Loss Rescue Project by AdTown
        </p>
      </footer>
    </div>
  );
};

export default RescuePage;
