import { GetServerSideProps, NextPage } from 'next';
import Link from 'next/link';
import nookies from 'nookies';
import { getAdminAuth, getAdminDb } from '@/lib/firebase-admin';
import { useState, ChangeEvent } from 'react';
import { Timestamp } from 'firebase-admin/firestore';
import Head from 'next/head';

// --- 型定義 ---
interface DealItem {
  name: string;
  price: string;
  originalPrice: string;
  quantity: string;
}

interface Deal {
  id: string;
  storeName: string;
  address: string;
  phoneNumber: string;
  item: string;
  price: number | null;
  quantity: number;
  createdAt: string;
}

interface FoodLossPageProps {
  initialDeals: Deal[];
}

// --- ページコンポーネント ---
const FoodLossPage: NextPage<FoodLossPageProps> = ({ initialDeals }) => {
  const [dealType, setDealType] = useState<'fixed' | 'percentage'>('fixed');
  const [items, setItems] = useState<DealItem[]>([{ name: '', price: '', originalPrice: '', quantity: '1' }]);
  const [generalItemName, setGeneralItemName] = useState('');
  const [discountRate, setDiscountRate] = useState('');
  const [generalQuantity, setGeneralQuantity] = useState(1);
  const [sellTime, setSellTime] = useState('');
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [deals, setDeals] = useState(initialDeals);

  // --- イベントハンドラ ---
  const handleItemChange = (index: number, e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const newItems = [...items];
    newItems[index][e.target.name as keyof DealItem] = e.target.value;
    setItems(newItems);
  };

  const addItem = () => {
    setItems([...items, { name: '', price: '', originalPrice: '', quantity: '1' }]);
  };

  const removeItem = (index: number) => {
    const newItems = items.filter((_, i) => i !== index);
    setItems(newItems);
  };

  const handleEndDeal = async (dealId: string) => {
    if (!confirm('この情報の掲載を終了（完売）しますか？')) return;
    try {
      const response = await fetch(`/api/partner/end-deal`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dealId }),
      });
      if (!response.ok) throw new Error('終了処理に失敗しました。');
      setDeals(deals.filter(d => d.id !== dealId));
      setMessage({ type: 'success', text: '掲載を終了しました。' });
      setTimeout(() => setMessage(null), 3000);
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
    }
  };

  // --- フォーム送信処理 ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);

    let payload;
    if (dealType === 'fixed') {
      const processedItems = items.map(item => ({
        ...item,
        price: Number(item.price),
        originalPrice: Number(item.originalPrice) || 0,
        quantity: Number(item.quantity),
      }));
      payload = { dealType, items: processedItems, sellTime, notes };
    } else {
      payload = { 
        dealType, 
        itemName: generalItemName, 
        discountRate: Number(discountRate), 
        quantity: generalQuantity, 
        sellTime, 
        notes 
      };
    }

    try {
      const response = await fetch('/api/partner/submit-deal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || '登録に失敗しました。');
      
      setDeals([data.newDeal, ...deals]); 
      setMessage({ type: 'success', text: '新しいフードロス情報を登録しました！' });
      
      setItems([{ name: '', price: '', originalPrice: '', quantity: '1' }]);
      setGeneralItemName('');
      setDiscountRate('');
      setGeneralQuantity(1);
      setSellTime('');
      setNotes('');
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  const inputStyle = "shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline";

  return (
    <>
      <Head>
        <title>フードロス情報の登録＆管理</title>
      </Head>
      <div className="p-5 max-w-4xl mx-auto">
        <Link href="/partner/dashboard" className="text-blue-500 hover:underline">
          ← ダッシュボードに戻る
        </Link>
        <h1 className="text-3xl font-bold my-6 text-center">フードロス情報の登録＆管理</h1>

        {message && (
          <div className={`p-3 rounded text-center mb-6 ${message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            {message.text}
          </div>
        )}

        <div className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">新規登録</h2>
          <form onSubmit={handleSubmit} className="bg-white shadow-md rounded px-8 pt-6 pb-8 space-y-6">
            <div className="flex border rounded-lg p-1 bg-gray-100">
              <button type="button" onClick={() => setDealType('fixed')} className={`w-1/2 p-2 rounded-md font-semibold transition-colors ${dealType === 'fixed' ? 'bg-white shadow' : 'text-gray-500'}`}>
                個別価格で設定
              </button>
              <button type="button" onClick={() => setDealType('percentage')} className={`w-1/2 p-2 rounded-md font-semibold transition-colors ${dealType === 'percentage' ? 'bg-white shadow' : 'text-gray-500'}`}>
                一括割引率で設定
              </button>
            </div>

            {dealType === 'fixed' && (
              <div className="space-y-4">
                {items.map((item, index) => (
                  <div key={index} className="p-4 border rounded-md space-y-3 relative bg-gray-50">
                    {items.length > 1 && (
                      <button type="button" onClick={() => removeItem(index)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full h-6 w-6 flex items-center justify-center text-sm">×</button>
                    )}
                    <div>
                      <label className="block text-gray-700 font-bold mb-1">商品名</label>
                      <input name="name" type="text" value={item.name} onChange={(e) => handleItemChange(index, e)} required className={inputStyle}/>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-gray-700 font-bold mb-1">販売価格 (円)</label>
                        <input name="price" type="number" value={item.price} onChange={(e) => handleItemChange(index, e)} required min="0" className={inputStyle}/>
                      </div>
                      <div>
                        <label className="block text-gray-700 font-bold mb-1">通常価格 (円)<span className="text-sm font-normal text-gray-500 ml-1">任意</span></label>
                        <input name="originalPrice" type="number" value={item.originalPrice} onChange={(e) => handleItemChange(index, e)} min="0" className={inputStyle}/>
                      </div>
                    </div>
                    <div>
                      <label className="block text-gray-700 font-bold mb-1">個数</label>
                      <input name="quantity" type="number" value={item.quantity} onChange={(e) => handleItemChange(index, e)} required min="1" className={inputStyle}/>
                    </div>
                  </div>
                ))}
                <button type="button" onClick={addItem} className="w-full bg-gray-200 text-gray-700 font-bold py-2 px-4 rounded hover:bg-gray-300 transition-colors">
                  ＋ 商品を追加する
                </button>
              </div>
            )}

            {dealType === 'percentage' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-gray-700 font-bold mb-2">対象商品</label>
                  <input type="text" value={generalItemName} onChange={(e) => setGeneralItemName(e.target.value)} required placeholder="例：パン詰め合わせ、お惣菜各種" className={inputStyle}/>
                </div>
                <div>
                  <label className="block text-gray-700 font-bold mb-2">割引率 (%)</label>
                  <input type="number" value={discountRate} onChange={(e) => setDiscountRate(e.target.value)} required placeholder="例: 30" min="1" max="100" className={inputStyle}/>
                </div>
                <div>
                  <label className="block text-gray-700 font-bold mb-2">個数</label>
                  <input type="number" value={generalQuantity} onChange={(e) => setGeneralQuantity(Number(e.target.value))} required min="1" className={inputStyle}/>
                </div>
              </div>
            )}
            
            <hr/>

            <div className="space-y-4">
              <div>
                <label className="block text-gray-700 font-bold mb-2">販売時間 <span className="text-sm font-normal text-red-500 ml-1">必須</span></label>
                <input type="text" value={sellTime} onChange={(e) => setSellTime(e.target.value)} placeholder="例: 17:00〜19:00" required className={inputStyle}/>
              </div>
              <div>
                <label className="block text-gray-700 font-bold mb-2">備考 <span className="text-sm font-normal text-gray-500 ml-1">任意</span></label>
                <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} placeholder="例: なくなり次第終了です" className={inputStyle}></textarea>
              </div>
            </div>
            
            <div className="text-center pt-4">
              <button type="submit" disabled={isLoading} className="bg-green-500 hover:bg-green-700 text-white font-bold py-3 px-8 rounded-lg shadow-md disabled:bg-gray-400 disabled:cursor-not-allowed transition-all">
                {isLoading ? '登録中...' : 'この内容で登録する'}
              </button>
            </div>
          </form>
        </div>

        <div>
          <h2 className="text-2xl font-semibold mb-4">現在、掲載中の情報</h2>
          <div className="bg-white shadow-md rounded-lg">
            {deals.length === 0 ? (
              <p className="text-center text-gray-500 py-8">現在、掲載中の情報はありません。</p>
            ) : (
              <ul className="divide-y divide-gray-200">
                {deals.map(deal => (
                  <li key={deal.id} className="p-4 flex justify-between items-center">
                    <div>
                      <p className="text-sm font-semibold text-gray-600">{deal.storeName}</p>
                      <p className="font-bold text-lg mt-1">{deal.item}</p>
                      <p className="text-sm text-gray-500 mt-1">{deal.address}</p>
                      <p className="text-sm text-gray-500">{deal.phoneNumber}</p>
                      <p className="text-sm text-gray-600 mt-2">
                        {deal.price ? `${deal.price.toLocaleString()}円 - ` : ''}
                        残り{deal.quantity}個
                      </p>
                      <p className="text-xs text-gray-400 mt-1">登録日時: {deal.createdAt}</p>
                    </div>
                    <button onClick={() => handleEndDeal(deal.id)} className="bg-red-500 text-white font-bold py-1 px-3 rounded text-sm hover:bg-red-600 transition-colors">
                      完売/終了
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

// --- サーバーサイドでのデータ初期取得 ---
export const getServerSideProps: GetServerSideProps = async (context) => {
  try {
    const cookies = nookies.get(context);
    const token = await getAdminAuth().verifySessionCookie(cookies.token, true);
    const { uid } = token;

    const userDoc = await getAdminDb().collection('users').doc(uid).get();
    if (!userDoc.exists || userDoc.data()?.role !== 'partner') {
        return { redirect: { destination: '/partner/login', permanent: false } };
    }

    const snapshot = await getAdminDb().collection('foodLossDeals')
      .where('partnerUid', '==', uid)
      .where('isActive', '==', true)
      .orderBy('createdAt', 'desc')
      .get();
      
    const deals = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        storeName: data.storeName,
        address: data.address,
        phoneNumber: data.phoneNumber,
        item: data.item || data.itemName, 
        price: data.price || null,
        quantity: data.quantity,
        createdAt: (data.createdAt as Timestamp).toDate().toLocaleString('ja-JP', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit'}),
      }
    });
    return { props: { initialDeals: JSON.parse(JSON.stringify(deals)) } };
  } catch (err) {
    return { redirect: { destination: '/partner/login', permanent: false } };
  }
};

export default FoodLossPage;