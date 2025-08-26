import { GetServerSideProps, NextPage } from 'next';
import Link from 'next/link';
import nookies from 'nookies';
import { getAdminAuth, getAdminDb } from '@/lib/firebase-admin';
import { useState, ChangeEvent } from 'react';
import { Timestamp, FieldValue } from 'firebase-admin/firestore';
import Head from 'next/head';

// --- 型定義 ---
interface Deal {
  id: string;
  title: string;
  description: string;
  imageUrl?: string;
  linkUrl?: string;
  createdAt: string;
  storeName?: string;
  address?: string;
  phoneNumber?: string;
}

interface PartnerDealsPageProps {
  initialDeals: Deal[];
}

// --- ページコンポーネント ---
const PartnerDealsPage: NextPage<PartnerDealsPageProps> = ({ initialDeals }) => {
  const [deals, setDeals] = useState<Deal[]>(initialDeals);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImageFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setMessage(null);

    try {
      let imageUrl = '';
      if (imageFile) {
        const formData = new FormData();
        formData.append('image', imageFile);

        const uploadRes = await fetch('/api/partner/upload-image', {
          method: 'POST',
          body: formData,
        });
        const uploadData = await uploadRes.json();
        if (!uploadRes.ok) throw new Error(uploadData.error || '画像アップロードに失敗しました。');
        imageUrl = uploadData.imageUrl;
      }

      const createDealRes = await fetch('/api/partner/create-deal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description, linkUrl, imageUrl }),
      });
      const createDealData = await createDealRes.json();
      if (!createDealRes.ok) throw new Error(createDealData.error || '情報の登録に失敗しました。');
      
      setDeals([createDealData.newDeal, ...deals]);
      setMessage('新しいお得情報を登録しました！');
      setTitle('');
      setDescription('');
      setLinkUrl('');
      setImageFile(null);
      (e.target as HTMLFormElement).reset();

    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleEndDeal = async (dealId: string) => {
    if (!confirm('このお得情報の掲載を終了しますか？')) return;
    try {
      const response = await fetch(`/api/partner/end-deal`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dealId }),
      });
      if (!response.ok) throw new Error('終了処理に失敗しました。');
      setDeals(deals.filter(d => d.id !== dealId));
      setMessage('掲載を終了しました。');
      setTimeout(() => setMessage(null), 3000);
    } catch (error: any) {
      setMessage(error.message);
    }
  };

  const inputStyle = "shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline";

  return (
    <>
      <Head><title>店舗お得情報の登録・管理</title></Head>
      <div className="p-5 max-w-4xl mx-auto">
        <Link href="/partner/dashboard" className="text-blue-500 hover:underline">← ダッシュボードに戻る</Link>
        <h1 className="text-3xl font-bold my-6 text-center">店舗お得情報の登録・管理</h1>

        {message && <div className="p-3 rounded text-center mb-6 bg-green-100 text-green-800">{message}</div>}
        {error && <div className="p-3 rounded text-center mb-6 bg-red-100 text-red-800">{error}</div>}

        <div className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">新規登録</h2>
          <form onSubmit={handleSubmit} className="bg-white shadow-md rounded px-8 pt-6 pb-8 space-y-6">
            <div>
              <label className="block text-gray-700 font-bold mb-2">タイトル <span className="text-red-500">*</span></label>
              <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} required className={inputStyle} />
            </div>
            <div>
              <label className="block text-gray-700 font-bold mb-2">説明文 (テキスト)</label>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={5} className={inputStyle} />
            </div>
            <div>
              <label className="block text-gray-700 font-bold mb-2">画像 (任意)</label>
              <input type="file" accept="image/jpeg, image/png" onChange={handleImageChange} className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"/>
            </div>
            <div>
              <label className="block text-gray-700 font-bold mb-2">関連URL (任意)</label>
              <input type="url" value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} placeholder="https://..." className={inputStyle} />
            </div>
            <div className="text-center pt-4">
              <button type="submit" disabled={isLoading} className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg shadow-md disabled:bg-gray-400">
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
                  <li key={deal.id} className="p-4 flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
                    {deal.imageUrl && (
                      <div className="sm:mr-4">
                        <img src={deal.imageUrl} alt={deal.title} className="w-24 h-24 object-cover rounded-md" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-lg">{deal.title}</p>
                      <p className="text-sm text-gray-700 mt-1">{deal.storeName}</p>
                      <p className="text-sm text-gray-700 mt-1">{deal.address}</p>
                      <p className="text-sm text-gray-700 mt-1">{deal.phoneNumber}</p>
                      <p className="text-sm text-gray-500 mt-1 truncate">{deal.description}</p>
                      <p className="text-xs text-gray-400 mt-1">登録日時: {deal.createdAt}</p>
                    </div>
                    <div className="flex space-x-2">
                      <button onClick={() => handleEndDeal(deal.id)} className="bg-red-500 text-white font-bold py-1 px-3 rounded text-sm hover:bg-red-600 transition-colors">
                        掲載終了
                      </button>
                    </div>
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

    const snapshot = await getAdminDb().collection('storeDeals')
      .where('partnerUid', '==', uid)
      .orderBy('createdAt', 'desc')
      .get();
      
    const deals = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        title: data.title,
        description: data.description,
        imageUrl: data.imageUrl || null,
        linkUrl: data.linkUrl || null,
        createdAt: (data.createdAt as Timestamp).toDate().toLocaleString('ja-JP'),
        storeName: data.storeName || null,
        address: data.address || null,
        phoneNumber: data.phoneNumber || null,
      };
    });
    
    return { props: { initialDeals: JSON.parse(JSON.stringify(deals)) } };
  } catch (err) {
    console.error("getServerSidePropsでエラーが発生しました:", err);
    return { redirect: { destination: '/partner/login', permanent: false } };
  }
};

export default PartnerDealsPage;