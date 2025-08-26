import { GetServerSideProps, NextPage } from 'next';
import Link from 'next/link';
import nookies from 'nookies';
import { getAdminAuth } from '@/lib/firebase-admin';
import { useState, ChangeEvent } from 'react';
import Head from 'next/head'; // Headをインポート

// --- 型定義 ---
interface DealItem {
  name: string;
  price: string;
  originalPrice: string;
  quantity: string;
}

// --- ページコンポーネント ---
const SubmitDealPage: NextPage = () => {
  const [dealType, setDealType] = useState<'fixed' | 'percentage'>('fixed');
  
  const [items, setItems] = useState<DealItem[]>([{ name: '', price: '', originalPrice: '', quantity: '1' }]);
  
  const [generalItemName, setGeneralItemName] = useState('');
  const [discountRate, setDiscountRate] = useState('');
  const [generalQuantity, setGeneralQuantity] = useState(1);

  const [sellTime, setSellTime] = useState('');
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);

    let payload;
    if (dealType === 'fixed') {
      payload = { dealType, items, sellTime, notes };
    } else {
      payload = { dealType, itemName: generalItemName, discountRate, quantity: generalQuantity, sellTime, notes };
    }

    try {
      const response = await fetch('/api/partner/submit-deal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || '登録に失敗しました。');
      setMessage({ type: 'success', text: 'フードロス情報を登録しました！' });
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

  return (
    <>
      {/* ▼▼▼ スタイル定義を追加 ▼▼▼ */}
      <Head>
        <title>フードロス情報の登録</title>
        <style>{`
          .input-style {
            appearance: none;
            border-width: 1px;
            border-radius: 0.375rem;
            width: 100%;
            padding: 0.5rem 0.75rem;
            box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
          }
        `}</style>
      </Head>
      <div className="p-5 max-w-2xl mx-auto">
        <Link href="/partner/dashboard" className="text-blue-500 hover:underline">
          ← ダッシュボードに戻る
        </Link>
        <h1 className="text-3xl font-bold my-6 text-center">フードロス情報の登録</h1>
        
        <form onSubmit={handleSubmit} className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4 space-y-6">
          <div className="flex border rounded-lg p-1 bg-gray-100">
            <button type="button" onClick={() => setDealType('fixed')} className={`w-1/2 p-2 rounded-md font-semibold ${dealType === 'fixed' ? 'bg-white shadow' : ''}`}>
              個別価格で設定
            </button>
            <button type="button" onClick={() => setDealType('percentage')} className={`w-1/2 p-2 rounded-md font-semibold ${dealType === 'percentage' ? 'bg-white shadow' : ''}`}>
              一括割引率で設定
            </button>
          </div>

          {dealType === 'fixed' && (
            <div className="space-y-4">
              {items.map((item, index) => (
                <div key={index} className="p-3 border rounded-md space-y-2 relative">
                  {items.length > 1 && (
                    <button type="button" onClick={() => removeItem(index)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full h-6 w-6 flex items-center justify-center">×</button>
                  )}
                  <div>
                    <label className="block text-gray-700 font-bold mb-1">商品名</label>
                    <input name="name" type="text" value={item.name} onChange={(e) => handleItemChange(index, e)} required className="input-style"/>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-gray-700 font-bold mb-1">販売価格 (円)</label>
                      <input name="price" type="number" value={item.price} onChange={(e) => handleItemChange(index, e)} required className="input-style"/>
                    </div>
                    <div>
                      <label className="block text-gray-700 font-bold mb-1">通常価格 (円)</label>
                      <input name="originalPrice" type="number" value={item.originalPrice} onChange={(e) => handleItemChange(index, e)} className="input-style"/>
                    </div>
                  </div>
                  <div>
                    <label className="block text-gray-700 font-bold mb-1">個数</label>
                    <input name="quantity" type="number" value={item.quantity} onChange={(e) => handleItemChange(index, e)} required min="1" className="input-style"/>
                  </div>
                </div>
              ))}
              <button type="button" onClick={addItem} className="w-full bg-gray-200 text-gray-700 font-bold py-2 px-4 rounded hover:bg-gray-300">
                ＋ 商品を追加する
              </button>
            </div>
          )}

          {dealType === 'percentage' && (
            <div className="space-y-4">
              <div>
                <label className="block text-gray-700 font-bold mb-2">対象商品</label>
                <input type="text" value={generalItemName} onChange={(e) => setGeneralItemName(e.target.value)} required placeholder="例：パン詰め合わせ、お惣菜各種" className="input-style"/>
              </div>
              <div>
                <label className="block text-gray-700 font-bold mb-2">割引率 (%)</label>
                <input type="number" value={discountRate} onChange={(e) => setDiscountRate(e.target.value)} required placeholder="例: 30" className="input-style"/>
              </div>
              <div>
                <label className="block text-gray-700 font-bold mb-2">個数</label>
                <input type="number" value={generalQuantity} onChange={(e) => setGeneralQuantity(Number(e.target.value))} required min="1" className="input-style"/>
              </div>
            </div>
          )}
          
          <hr/>

          <div>
              <label className="block text-gray-700 font-bold mb-2">販売時間</label>
              <input type="text" value={sellTime} onChange={(e) => setSellTime(e.target.value)} placeholder="例: 17:00〜19:00" className="input-style"/>
          </div>
          <div>
            <label className="block text-gray-700 font-bold mb-2">備考</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} className="input-style"></textarea>
          </div>
          
          {message && (
            <div className={`p-3 rounded text-center ${message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
              {message.text}
            </div>
          )}
          <div className="text-center pt-4">
            <button type="submit" disabled={isLoading} className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-6 rounded">
              {isLoading ? '登録中...' : '登録する'}
            </button>
          </div>
        </form>
      </div>
    </>
  );
};

export const getServerSideProps: GetServerSideProps = async (context) => {
  try {
    const cookies = nookies.get(context);
    const token = await getAdminAuth().verifySessionCookie(cookies.token, true);
    if (token.role !== 'partner') {
      return { redirect: { destination: '/partner/login', permanent: false } };
    }
    return { props: {} };
  } catch (err) {
    return { redirect: { destination: '/partner/login', permanent: false } };
  }
};

export default SubmitDealPage;