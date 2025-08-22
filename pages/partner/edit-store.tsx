import { GetServerSideProps, NextPage } from 'next';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { collection, query, where, getDocs, doc, updateDoc, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import nookies from 'nookies';
import { getAdminAuth } from '@/lib/firebase-admin';

// --- カテゴリとエリアのデータ ---
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

// 店舗データの型定義
interface Store {
  id: string;
  name: string;
  address: string;
  phone: string;
  hours: string;
  menu: string;
  recommend: string;
  coupon: string;
  googleMap: string;
  category: string;
  area: string;
}

interface EditStorePageProps {
  store: Store;
}

const PartnerEditStorePage: NextPage<EditStorePageProps> = ({ store }) => {
  const router = useRouter();
  const [formData, setFormData] = useState(store);
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const storeRef = doc(db, 'stores', store.id);
      await updateDoc(storeRef, { ...formData });
      alert('店舗情報を更新しました。');
      router.push('/partner/dashboard'); // パートナーマイページに戻る
    } catch (error) {
      console.error("更新エラー:", error);
      alert('更新中にエラーが発生しました。');
      setIsLoading(false);
    }
  };

  return (
    <div className="p-5 max-w-3xl mx-auto font-sans">
      <Link href="/partner/dashboard" className="text-blue-500 hover:underline">
        ← マイページに戻る
      </Link>
      <h1 className="text-3xl font-bold my-6 text-center">店舗情報編集</h1>
      <form onSubmit={handleSubmit} className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4 space-y-4">
        {/* ... フォームの入力欄 (admin用と同じ) ... */}
        <div>
          <label className="block text-gray-700 text-sm font-bold mb-2">店舗名</label>
          <input name="name" type="text" value={formData.name} onChange={handleChange} required className="shadow appearance-none border rounded w-full py-2 px-3"/>
        </div>
        <div>
          <label className="block text-gray-700 text-sm font-bold mb-2">カテゴリ</label>
          <select name="category" value={formData.category} onChange={handleChange} required className="shadow appearance-none border rounded w-full py-2 px-3">
            {categories.map(cat => <option key={cat.slug} value={cat.slug}>{cat.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-gray-700 text-sm font-bold mb-2">エリア</label>
          <select name="area" value={formData.area} onChange={handleChange} required className="shadow appearance-none border rounded w-full py-2 px-3">
            {areas.map(ar => <option key={ar.slug} value={ar.slug}>{ar.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-gray-700 text-sm font-bold mb-2">住所</label>
          <input name="address" type="text" value={formData.address} onChange={handleChange} required className="shadow appearance-none border rounded w-full py-2 px-3"/>
        </div>
        <div>
          <label className="block text-gray-700 text-sm font-bold mb-2">電話番号</label>
          <input name="phone" type="tel" value={formData.phone} onChange={handleChange} className="shadow appearance-none border rounded w-full py-2 px-3"/>
        </div>
        <div>
          <label className="block text-gray-700 text-sm font-bold mb-2">営業時間</label>
          <textarea name="hours" value={formData.hours} onChange={handleChange} rows={3} className="shadow appearance-none border rounded w-full py-2 px-3"/>
        </div>
        <div>
          <label className="block text-gray-700 text-sm font-bold mb-2">メニュー</label>
          <textarea name="menu" value={formData.menu} onChange={handleChange} rows={3} className="shadow appearance-none border rounded w-full py-2 px-3"/>
        </div>
        <div>
          <label className="block text-gray-700 text-sm font-bold mb-2">お店のおすすめ</label>
          <textarea name="recommend" value={formData.recommend} onChange={handleChange} rows={3} className="shadow appearance-none border rounded w-full py-2 px-3"/>
        </div>
        <div>
          <label className="block text-gray-700 text-sm font-bold mb-2">クーポン情報</label>
          <input name="coupon" type="text" value={formData.coupon} onChange={handleChange} className="shadow appearance-none border rounded w-full py-2 px-3"/>
        </div>
        <div>
          <label className="block text-gray-700 text-sm font-bold mb-2">GoogleマップのURL</label>
          <input name="googleMap" type="url" value={formData.googleMap} onChange={handleChange} className="shadow appearance-none border rounded w-full py-2 px-3"/>
        </div>
        <div className="text-center pt-4">
          <button type="submit" disabled={isLoading} className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded disabled:bg-gray-400">
            {isLoading ? '更新中...' : 'この内容で更新する'}
          </button>
        </div>
      </form>
    </div>
  );
};

export const getServerSideProps: GetServerSideProps = async (context) => {
  try {
    const adminAuth = getAdminAuth();
    const cookies = nookies.get(context);
    
    // ログイン中のパートナーの情報を取得
    const token = await adminAuth.verifySessionCookie(cookies.token, true);
    const { uid } = token;

    // パートナーのUIDに紐づく店舗情報を検索
    const storesRef = collection(db, 'stores');
    const q = query(storesRef, where('ownerUid', '==', uid), limit(1));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      // もし店舗情報がまだ紐付いていなければ、エラーページではなく、
      // 「店舗情報がありません」と表示するページにリダイレクトするなどの処理が考えられます。
      return { notFound: true };
    }

    const storeDoc = querySnapshot.docs[0];
    const data = storeDoc.data();
    const store = {
      id: storeDoc.id,
      name: data.name || '',
      address: data.address || '',
      phone: data.phone || '',
      hours: data.hours || '',
      menu: data.menu || '',
      recommend: data.recommend || '',
      coupon: data.coupon || '',
      googleMap: data.googleMap || '',
      category: data.category || '',
      area: data.area || '',
    };

    return {
      props: {
        store: JSON.parse(JSON.stringify(store)),
      },
    };
  } catch (error) {
    // ログインしていない場合は、パートナーログインページへリダイレクト
    return {
      redirect: {
        destination: '/partner/login',
        permanent: false,
      },
    };
  }
};

export default PartnerEditStorePage;