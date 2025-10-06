import { GetServerSideProps, NextPage } from 'next';
import Head from 'next/head';
import { useState } from 'react';
import { adminDb, getPartnerUidFromCookie } from '../../lib/firebase-admin'; // firebase-adminのパスを調整
import { db } from '@/lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { useRouter } from 'next/router';

// --- 型定義 ---
interface Profile {
  companyName: string;
  industry: string;
  website: string;
  address: string;
  description: string;
}

interface ProfilePageProps {
  profile: Profile;
  uid: string;
}

// --- サーバーサイド処理 ---
export const getServerSideProps: GetServerSideProps = async (context) => {
  const uid = await getPartnerUidFromCookie(context);
  if (!uid) {
    return { redirect: { destination: '/partner/login', permanent: false } };
  }
  const userDoc = await adminDb.collection('users').doc(uid).get();
  if (!userDoc.exists) {
    return { notFound: true };
  }
  const userData = userDoc.data()!;

  const profile: Profile = {
    companyName: userData.companyName || '',
    industry: userData.industry || '',
    website: userData.website || '',
    address: userData.address || '',
    description: userData.description || '',
  };

  return { props: { profile, uid } };
};

// --- ページコンポーネント ---
const RecruitProfilePage: NextPage<ProfilePageProps> = ({ profile, uid }) => {
  const router = useRouter();
  const [formData, setFormData] = useState<Profile>(profile);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);
    try {
      const userRef = doc(db, 'users', uid);
      await updateDoc(userRef, { ...formData });
      setMessage({ type: 'success', text: 'プロフィールを更新しました。' });
    } catch (err) {
      setMessage({ type: 'error', text: 'プロフィールの更新に失敗しました。' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Head>
        <title>【求人】企業プロフィールの編集</title>
      </Head>
      <header className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">企業プロフィールの編集（求人用）</h1>
           <button onClick={() => router.push('/recruit/dashboard')} className="text-sm text-blue-600 hover:underline">
              求人ダッシュボードに戻る
            </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleSave} className="bg-white p-8 rounded-lg shadow-md space-y-6">
          {/* ...フォーム要素は省略（以前のコードと同じ）... */}
          <div>
            <label htmlFor="companyName">企業名・店舗名</label>
            <input type="text" name="companyName" value={formData.companyName} onChange={handleChange} />
          </div>
          <div>
            <label htmlFor="description">企業紹介文</label>
            <textarea name="description" value={formData.description} onChange={handleChange} rows={5} />
          </div>
          {/* 他のフィールドも同様に追加 */}
          <div className="flex justify-end pt-4">
            <button type="submit" disabled={isLoading}>
              {isLoading ? '保存中...' : '保存する'}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
};

export default RecruitProfilePage;