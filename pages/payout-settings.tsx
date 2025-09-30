import { GetServerSideProps, NextPage } from 'next';
import Link from 'next/link';
import nookies from 'nookies';
import { adminAuth, adminDb } from '../lib/firebase-admin';
import { useState } from 'react';

// --- 型定義 ---
interface PayoutSettings {
  bankName: string;
  branchName: string;
  accountType: 'ordinary' | 'checking';
  accountNumber: string;
  accountName: string;
}

// Propsの型定義
interface PayoutSettingsPageProps {
  initialSettings: PayoutSettings | null;
}

// --- ページコンポーネント ---
const PayoutSettingsPage: NextPage<PayoutSettingsPageProps> = ({ initialSettings }) => {
  const [settings, setSettings] = useState<PayoutSettings>(initialSettings || {
    bankName: '',
    branchName: '',
    accountType: 'ordinary',
    accountNumber: '',
    accountName: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { id, value } = e.target;
    setSettings(prev => ({ ...prev, [id]: value }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);

    try {
      const response = await fetch('/api/payout/save-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || '保存に失敗しました。');
      }
      setMessage({ type: 'success', text: '口座情報を保存しました！' });
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center min-h-screen bg-gray-50 pt-10">
      <div className="w-full max-w-2xl">
        <div className="mb-6 px-4">
          <Link href="/mypage" className="text-blue-500 hover:underline">
            ← マイページに戻る
          </Link>
        </div>
        
        <div className="bg-white shadow-md rounded-lg p-8">
          <h1 className="text-2xl font-bold mb-6 text-center text-gray-800">報酬受取口座の登録・編集</h1>
          
          <form onSubmit={handleSave}>
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="bankName">金融機関名</label>
              <input id="bankName" value={settings.bankName} onChange={handleChange} className="w-full p-2 border rounded shadow-sm" type="text" placeholder="例：楽天銀行" required />
            </div>
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="branchName">支店名</label>
              <input id="branchName" value={settings.branchName} onChange={handleChange} className="w-full p-2 border rounded shadow-sm" type="text" placeholder="例：第一営業支店" required />
            </div>
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="accountType">預金種目</label>
              <select id="accountType" value={settings.accountType} onChange={handleChange} className="w-full p-2 border rounded bg-white shadow-sm">
                <option value="ordinary">普通</option>
                <option value="checking">当座</option>
              </select>
            </div>
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="accountNumber">口座番号</label>
              <input id="accountNumber" value={settings.accountNumber} onChange={handleChange} className="w-full p-2 border rounded shadow-sm" type="text" placeholder="7桁の半角数字" required pattern="\d{7}" />
            </div>
            <div className="mb-6">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="accountName">口座名義（カナ）</label>
              <input id="accountName" value={settings.accountName} onChange={handleChange} className="w-full p-2 border rounded shadow-sm" type="text" placeholder="例：スズキ タロウ" required />
            </div>
            
            {message && (
              <div className={`p-3 rounded text-center my-4 ${message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                {message.text}
              </div>
            )}

            <div className="text-center mt-6 text-xs text-gray-500">
              <p>🔒 お客様の口座情報は暗号化され、安全に保管されます。</p>
            </div>

            <div className="text-center mt-4">
              <button type="submit" disabled={isLoading} className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg text-lg disabled:bg-blue-300">
                {isLoading ? '保存中...' : '保存する'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export const getServerSideProps: GetServerSideProps = async (context) => {
  try {
    const cookies = nookies.get(context);
    const token = await adminAuth.verifySessionCookie(cookies.token, true);
    
    const userDoc = await adminDb.collection('users').doc(token.uid).get();
    const payoutSettings = userDoc.data()?.payoutSettings || null;

    return { 
      props: {
        initialSettings: JSON.parse(JSON.stringify(payoutSettings)),
      } 
    };
  } catch (error) {
    return {
      redirect: {
        destination: '/login',
        permanent: false,
      },
    };
  }
};

export default PayoutSettingsPage;