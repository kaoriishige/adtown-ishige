import { GetServerSideProps, NextPage } from 'next';
import Link from 'next/link';
import nookies from 'nookies';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { useState } from 'react';

// --- 型定義 ---
interface ReferralSettings {
  partnerRewardRate: number; // 0.3 for 30%
  userRewardRate: number; // 0.2 for 20%
  payoutThreshold: number; // 3000
}

interface SettingsPageProps {
  initialSettings: ReferralSettings;
}

// --- ページコンポーネント ---
const AdminSettingsPage: NextPage<SettingsPageProps> = ({ initialSettings }) => {
  const [settings, setSettings] = useState(initialSettings);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    const isRate = id.includes('RewardRate');
    const numericValue = isRate ? parseFloat(value) / 100 : parseInt(value, 10);
    setSettings(prev => ({ ...prev, [id]: numericValue }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);
    try {
      const response = await fetch('/api/admin/save-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || '保存に失敗しました。');
      setMessage({ type: 'success', text: '設定を保存しました。' });
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-5 max-w-2xl mx-auto">
      <Link href="/admin" className="text-blue-500 hover:underline">← 管理メニューに戻る</Link>
      <h1 className="text-3xl font-bold my-6 text-center">各種設定</h1>
      <form onSubmit={handleSave} className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4 space-y-6">
        <div>
          <label htmlFor="partnerRewardRate" className="block text-gray-700 font-bold mb-2">パートナー紹介報酬率 (%)</label>
          <input id="partnerRewardRate" type="number" value={settings.partnerRewardRate * 100} onChange={handleChange} required className="shadow appearance-none border rounded w-full py-2 px-3"/>
        </div>
        <div>
          <label htmlFor="userRewardRate" className="block text-gray-700 font-bold mb-2">一般ユーザー紹介報酬率 (%)</label>
          <input id="userRewardRate" type="number" value={settings.userRewardRate * 100} onChange={handleChange} required className="shadow appearance-none border rounded w-full py-2 px-3"/>
        </div>
        <div>
          <label htmlFor="payoutThreshold" className="block text-gray-700 font-bold mb-2">最低支払い基準額 (円)</label>
          <input id="payoutThreshold" type="number" value={settings.payoutThreshold} onChange={handleChange} required className="shadow appearance-none border rounded w-full py-2 px-3"/>
        </div>
        {message && (
          <div className={`p-3 rounded text-center ${message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            {message.text}
          </div>
        )}
        <div className="text-center pt-4">
          <button type="submit" disabled={isLoading} className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded">
            {isLoading ? '保存中...' : '設定を保存する'}
          </button>
        </div>
      </form>
    </div>
  );
};

// --- サーバーサイドで現在の設定値を取得 ---
export const getServerSideProps: GetServerSideProps = async (context) => {
  try {
    const cookies = nookies.get(context);
    await adminAuth.verifySessionCookie(cookies.token, true);
    
    const settingsDoc = await adminDb.collection('settings').doc('referral').get();
    
    const defaultSettings = {
      partnerRewardRate: 0.3,
      userRewardRate: 0.2,
      payoutThreshold: 3000,
    };
    
    const initialSettings = settingsDoc.exists ? settingsDoc.data() : defaultSettings;

    return { props: { initialSettings: JSON.parse(JSON.stringify(initialSettings)) } };
  } catch (err) {
    return { redirect: { destination: '/admin/login', permanent: false } };
  }
};

export default AdminSettingsPage;