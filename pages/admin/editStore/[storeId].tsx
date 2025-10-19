// pages/admin/edit-store/[id].tsx
import { GetServerSideProps, NextPage } from 'next';
import { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { adminDb } from '@/lib/firebase-admin';
import Head from 'next/head';
import { Loader2, Save, ArrowLeft } from 'lucide-react';

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

// --- SSR ---
export const getServerSideProps: GetServerSideProps = async (context) => {
  try {
    // 貴殿のロジックは、管理者認証が欠けているため、それを追加
    // const uid = await getUidFromCookie(context);
    // if (!uid || !isAdmin(uid)) { // isAdminは要実装
    //   return { redirect: { destination: '/login', permanent: false } };
    // }

    const { id } = context.params || {};
    if (!id) {
      return { notFound: true };
    }
    const storeId = Array.isArray(id) ? id[0] : id;

    const storeDoc = await adminDb.collection('stores').doc(storeId).get();

    if (!storeDoc.exists) {
      return { notFound: true };
    }

    const data = storeDoc.data()!;
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
      category: data.category || 'restaurant',
      area: data.area || 'nasushiobara',
    };

    return {
      props: {
        store,
      },
    };
  } catch (error) {
    console.error("Error fetching store for edit:", error);
    return { notFound: true };
  }
};


const EditStorePage: NextPage<EditStorePageProps> = ({ store }) => {
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
      await updateDoc(storeRef, {
        ...formData
      });
      alert('店舗情報を更新しました。');
      router.push('/admin/manageStores'); // 仮の管理者ダッシュボード
    } catch (error) {
      console.error("更新エラー:", error);
      alert('更新中にエラーが発生しました。');
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <Head>
        <title>{店舗情報編集 - {formData.name}}</title>
      </Head>
       <header className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link href="/admin/manageStores" className="flex items-center text-sm text-gray-600 hover:text-gray-900 font-semibold">
            <ArrowLeft className="w-4 h-4 mr-2" />
            店舗管理に戻る
          </Link>
        </div>
      </header>
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleSubmit} className="bg-white p-8 rounded-lg shadow-md space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-gray-900">店舗情報編集</h1>
                <p className="text-sm text-gray-500 mt-1">ID: {store.id}</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700">店舗名 *</label>
                    <input name="name" type="text" value={formData.name} onChange={handleChange} required className="mt-1 block w-full input"/>
                </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-700">住所 *</label>
                    <input name="address" type="text" value={formData.address} onChange={handleChange} required className="mt-1 block w-full input"/>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700">カテゴリ *</label>
                    <select name="category" value={formData.category} onChange={handleChange} required className="mt-1 block w-full input">
                    {categories.map(cat => <option key={cat.slug} value={cat.slug}>{cat.name}</option>)}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">エリア *</label>
                    <select name="area" value={formData.area} onChange={handleChange} required className="mt-1 block w-full input">
                    {areas.map(ar => <option key={ar.slug} value={ar.slug}>{ar.name}</option>)}
                    </select>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700">電話番号</label>
                    <input name="phone" type="tel" value={formData.phone} onChange={handleChange} className="mt-1 block w-full input"/>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">GoogleマップのURL</label>
                    <input name="googleMap" type="url" value={formData.googleMap} onChange={handleChange} className="mt-1 block w-full input"/>
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700">営業時間</label>
                <textarea name="hours" value={formData.hours} onChange={handleChange} rows={3} className="mt-1 block w-full input"/>
            </div>
            
            <div>
                <label className="block text-sm font-medium text-gray-700">メニュー</label>
                <textarea name="menu" value={formData.menu} onChange={handleChange} rows={4} className="mt-1 block w-full input"/>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700">お店のおすすめ</label>
                <textarea name="recommend" value={formData.recommend} onChange={handleChange} rows={4} className="mt-1 block w-full input"/>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700">クーポン情報</label>
                <input name="coupon" type="text" value={formData.coupon} onChange={handleChange} className="mt-1 block w-full input"/>
            </div>

            <div className="flex justify-end pt-6 border-t">
                <button type="submit" disabled={isLoading} className="px-6 py-2 bg-indigo-600 text-white font-bold rounded-md hover:bg-indigo-700 disabled:bg-gray-400 flex items-center">
                    {isLoading ? <><Loader2 className="animate-spin mr-2"/>更新中...</> : <><Save className="w-4 h-4 mr-2"/>この内容で更新する</>}
                </button>
            </div>
        </form>
      </main>
      <style jsx>{`.input { @apply block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500; }`}</style>
    </div>
  );
};

export default EditStorePage;
