import { NextPage } from 'next';
import { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase'; // 絶対パスを使用

// --- ★★★ カテゴリとエリアのデータ ★★★ ---
// データベースに保存する値(slug)と、表示名(name)を定義します
const categories = [
  { name: '飲食店', slug: 'restaurant' },
  { name: '美容室', slug: 'hair-salon' },
  { name: 'Beauty', slug: 'beauty' },
  { name: 'Health', slug: 'health' },
  { name: '暮らし', slug: 'living' },
  { name: 'レジャー', slug: 'leisure' },
];

const areas = [
  { name: '那須塩原市', slug: 'nasushiobara' },
  { name: '大田原市', slug: 'ohtawara' },
  { name: '那須町', slug: 'nasu' },
];

const AddStorePage: NextPage = () => {
  const router = useRouter();
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [hours, setHours] = useState('');
  const [menu, setMenu] = useState('');
  const [recommend, setRecommend] = useState('');
  const [coupon, setCoupon] = useState('');
  const [googleMap, setGoogleMap] = useState('');
  const [category, setCategory] = useState(categories[0].slug);
  const [area, setArea] = useState(areas[0].slug);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !address || !category || !area) {
      alert('店舗名、住所、カテゴリ、エリアは必須です。');
      return;
    }
    setIsLoading(true);
    try {
      await addDoc(collection(db, 'stores'), {
        name,
        address,
        phone,
        hours,
        menu,
        recommend,
        coupon,
        googleMap,
        category,
        area,
        createdAt: new Date(),
      });
      alert('新しい店舗を登録しました。');
      // 登録後、店舗管理の一覧ページに移動するのが一般的です
      // (一覧ページは今後作成します)
      router.push('/admin'); 
    } catch (error) {
      console.error("店舗登録エラー:", error);
      alert('登録中にエラーが発生しました。');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-5 max-w-3xl mx-auto font-sans">
      <Link href="/admin" className="text-blue-500 hover:underline">
        ← 管理メニューに戻る
      </Link>
      <h1 className="text-3xl font-bold my-6 text-center">新規店舗登録</h1>
      <form onSubmit={handleSubmit} className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4 space-y-4">
        
        <div>
          <label className="block text-gray-700 text-sm font-bold mb-2">店舗名</label>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} required className="shadow appearance-none border rounded w-full py-2 px-3"/>
        </div>

        <div>
          <label className="block text-gray-700 text-sm font-bold mb-2">カテゴリ</label>
          <select value={category} onChange={(e) => setCategory(e.target.value)} required className="shadow appearance-none border rounded w-full py-2 px-3">
            {categories.map(cat => <option key={cat.slug} value={cat.slug}>{cat.name}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-gray-700 text-sm font-bold mb-2">エリア</label>
          <select value={area} onChange={(e) => setArea(e.target.value)} required className="shadow appearance-none border rounded w-full py-2 px-3">
            {areas.map(ar => <option key={ar.slug} value={ar.slug}>{ar.name}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-gray-700 text-sm font-bold mb-2">住所</label>
          <input type="text" value={address} onChange={(e) => setAddress(e.target.value)} required className="shadow appearance-none border rounded w-full py-2 px-3"/>
        </div>

        <div>
          <label className="block text-gray-700 text-sm font-bold mb-2">電話番号</label>
          <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className="shadow appearance-none border rounded w-full py-2 px-3"/>
        </div>

        <div>
          <label className="block text-gray-700 text-sm font-bold mb-2">営業時間</label>
          <input type="text" value={hours} onChange={(e) => setHours(e.target.value)} className="shadow appearance-none border rounded w-full py-2 px-3"/>
        </div>
        
        <div>
          <label className="block text-gray-700 text-sm font-bold mb-2">メニュー（主な商品を3つほど）</label>
          <textarea value={menu} onChange={(e) => setMenu(e.target.value)} rows={3} className="shadow appearance-none border rounded w-full py-2 px-3"/>
        </div>

        <div>
          <label className="block text-gray-700 text-sm font-bold mb-2">お店のおすすめポイント</label>
          <textarea value={recommend} onChange={(e) => setRecommend(e.target.value)} rows={3} className="shadow appearance-none border rounded w-full py-2 px-3"/>
        </div>

        <div>
          <label className="block text-gray-700 text-sm font-bold mb-2">クーポン情報</label>
          <input type="text" value={coupon} onChange={(e) => setCoupon(e.target.value)} className="shadow appearance-none border rounded w-full py-2 px-3"/>
        </div>

        <div>
          <label className="block text-gray-700 text-sm font-bold mb-2">GoogleマップのURL</label>
          <input type="url" value={googleMap} onChange={(e) => setGoogleMap(e.target.value)} className="shadow appearance-none border rounded w-full py-2 px-3"/>
        </div>

        <div className="text-center pt-4">
          <button type="submit" disabled={isLoading} className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded disabled:bg-gray-400">
            {isLoading ? '登録中...' : 'この内容で店舗を登録する'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddStorePage;