// pages/payout-settings.tsx

import { useState } from 'react';
import { GetServerSideProps, NextPage } from 'next';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { admin } from '../lib/firebase-admin';
import nookies from 'nookies';

// ページが受け取るデータの型
interface PayoutInfo {
  bankName: string;
  branchName: string;
  accountType: '普通' | '当座';
  accountNumber: string;
  accountHolderName: string;
}

interface PayoutSettingsPageProps {
  user: {
    uid: string;
    email: string;
  };
  payoutInfo: PayoutInfo | null;
}

const PayoutSettingsPage: NextPage<PayoutSettingsPageProps> = ({ user, payoutInfo }) => {
  const router = useRouter();
  const [formData, setFormData] = useState<PayoutInfo>(payoutInfo || {
    bankName: '',
    branchName: '',
    accountType: '普通',
    accountNumber: '',
    accountHolderName: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');
    try {
      const response = await fetch('/api/payout/save-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || '保存に失敗しました。');
      }
      setMessage('口座情報を正常に保存しました。');

    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'エラーが発生しました。');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-5 max-w-2xl mx-auto my-10">
      <Link href="/mypage" className="text-blue-500 hover:underline">← マイページに戻る</Link>
      <h1 className="text-3xl font-bold my-6 text-center">報酬受取口座の登録・編集</h1>
      
      <form onSubmit={handleSubmit} className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4">
        {message && (
          <div className={`p-4 mb-4 rounded text-center ${message.includes('失敗') || message.includes('エラー') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
            {message}
          </div>
        )}

        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2">金融機関名</label>
          <input type="text" name="bankName" value={formData.bankName} onChange={handleChange} className="shadow appearance-none border rounded w-full py-2 px-3" required placeholder="例：楽天銀行" />
        </div>
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2">支店名</label>
          <input type="text" name="branchName" value={formData.branchName} onChange={handleChange} className="shadow appearance-none border rounded w-full py-2 px-3" required placeholder="例：第一営業支店" />
        </div>
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2">預金種目</label>
          <select name="accountType" value={formData.accountType} onChange={handleChange} className="shadow border rounded w-full py-2 px-3">
            <option value="普通">普通</option>
            <option value="当座">当座</option>
          </select>
        </div>
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2">口座番号</label>
          <input type="text" name="accountNumber" value={formData.accountNumber} onChange={handleChange} className="shadow appearance-none border rounded w-full py-2 px-3" required placeholder="7桁の半角数字" pattern="\d{7}" />
        </div>
        <div className="mb-6">
          <label className="block text-gray-700 text-sm font-bold mb-2">口座名義（カナ）</label>
          <input type="text" name="accountHolderName" value={formData.accountHolderName} onChange={handleChange} className="shadow appearance-none border rounded w-full py-2 px-3" required placeholder="例：スズキ タロウ" />
        </div>

        <div className="text-center">
          <button type="submit" disabled={isLoading} className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded disabled:bg-gray-400">
            {isLoading ? '保存中...' : 'この内容で保存する'}
          </button>
        </div>
      </form>
    </div>
  );
};

export const getServerSideProps: GetServerSideProps = async (context) => {
  try {
    const cookies = nookies.get(context);
    const token = await admin.auth().verifyIdToken(cookies.token);
    const { uid, email } = token;

    const db = admin.firestore();
    const userDoc = await db.collection('users').doc(uid).get();
    const payoutInfo = userDoc.data()?.payoutInfo || null;

    return {
      props: {
        user: { uid, email: email || '' },
        payoutInfo: JSON.parse(JSON.stringify(payoutInfo)), // Timestampをシリアライズ
      },
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