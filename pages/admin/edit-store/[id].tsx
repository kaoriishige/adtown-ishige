// pages/admin/edit-store/[id].tsx

import { GetServerSideProps } from 'next';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useState } from 'react';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase'; // ← クライアント用Firestoreのみ使用
import Head from 'next/head';

// ================================
// 管理者用：店舗情報編集ページ
// ================================
interface StoreData {
  name: string;
  address: string;
  phone: string;
  website: string;
  description: string;
}

export default function EditStorePage({ id, storeData }: { id: string; storeData: StoreData }) {
  const router = useRouter();
  const [formData, setFormData] = useState<StoreData>(storeData);
  const [loading, setLoading] = useState(false);

  // 入力変更ハンドラ
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // 更新処理
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const ref = doc(db, 'stores', id);
      await updateDoc(ref, {
        name: formData.name,
        address: formData.address,
        phone: formData.phone,
        website: formData.website,
        description: formData.description,
      });

      alert('店舗情報を更新しました');
      router.push('/admin/dashboard');
    } catch (error) {
      console.error('更新エラー:', error);
      alert('更新に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>店舗情報編集</title>
      </Head>
      <main className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">店舗情報を編集</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
              店舗名
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="mt-1 block w-full border border-gray-300 rounded-md p-2"
              required
            />
          </div>

          <div>
            <label htmlFor="address" className="block text-sm font-medium text-gray-700">
              住所
            </label>
            <input
              type="text"
              id="address"
              name="address"
              value={formData.address}
              onChange={handleChange}
              className="mt-1 block w-full border border-gray-300 rounded-md p-2"
            />
          </div>

          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
              電話番号
            </label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className="mt-1 block w-full border border-gray-300 rounded-md p-2"
            />
          </div>

          <div>
            <label htmlFor="website" className="block text-sm font-medium text-gray-700">
              ウェブサイトURL
            </label>
            <input
              type="url"
              id="website"
              name="website"
              value={formData.website}
              onChange={handleChange}
              className="mt-1 block w-full border border-gray-300 rounded-md p-2"
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700">
              店舗紹介文
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={4}
              className="mt-1 block w-full border border-gray-300 rounded-md p-2"
            />
          </div>

          <div className="flex justify-between items-center">
            <Link href="/admin/dashboard" className="text-gray-600 hover:underline">
              戻る
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? '更新中…' : '更新する'}
            </button>
          </div>
        </form>
      </main>
    </>
  );
}

// ================================
// SSRでデータを取得
// ================================
export const getServerSideProps: GetServerSideProps = async (context) => {
  const { id } = context.params as { id: string };

  // Netlify環境ではadminDbを使えないため、API経由で取得するのが安全
  // 簡略化のため、ここでは空データを返す（必要ならAPIを追加）
  const storeData: StoreData = {
    name: '',
    address: '',
    phone: '',
    website: '',
    description: '',
  };

  return {
    props: { id, storeData },
  };
};

