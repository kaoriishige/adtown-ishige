import { GetServerSideProps, NextPage } from 'next';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useState } from 'react';
import nookies from 'nookies';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

// Propsの型定義
interface PayoutSettingsProps {
  user: {
    uid: string;
  };
  payoutInfo: {
    bankName: string;
    branchName: string;
    accountType: string;
    accountNumber: string;
    accountHolder: string;
  };
}

const PartnerPayoutSettingsPage: NextPage<PayoutSettingsProps> = ({ user, payoutInfo }) => {
  const router = useRouter();
  const [formData, setFormData] = useState(payoutInfo);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);

    try {
      const payoutRef = doc(db, 'payouts', user.uid);
      await setDoc(payoutRef, formData, { merge: true });
      setMessage({ type: 'success', text: '口座情報を保存しました！' });
    } catch (error) {
      console.error("口座情報の保存エラー:", error);
      setMessage({ type: 'error', text: '保存中にエラーが発生しました。' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-5 max-w-2xl mx-auto font-sans">
      <Link href="/partner/dashboard" className="text-blue-500 hover:underline">
        ← マイページに戻る
      </Link>
      <h1 className="text-3xl font-bold my-6 text-center">報酬受取口座の登録・編集</h1>
      <form onSubmit={handleSubmit} className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4 space-y-4">
        {/* (フォームの各入力欄は省略) */}
        <div>
          <label className="block text-gray-700 text-sm font-bold mb-2">金融機関名</label>
          <input name="bankName" type="text" value={formData.bankName} onChange={handleChange} required className="shadow appearance-none border rounded w-full py-2 px-3"/>
        </div>
        <div>
          <label className="block text-gray-700 text-sm font-bold mb-2">支店名</label>
          <input name="branchName" type="text" value={formData.branchName} onChange={handleChange} required className="shadow appearance-none border rounded w-full py-2 px-3"/>
        </div>
        <div>
          <label className="block text-gray-700 text-sm font-bold mb-2">預金種別</label>
          <select name="accountType" value={formData.accountType} onChange={handleChange} required className="shadow appearance-none border rounded w-full py-2 px-3 bg-white">
            <option>普通</option>
            <option>当座</option>
          </select>
        </div>
        <div>
          <label className="block text-gray-700 text-sm font-bold mb-2">口座番号</label>
          <input name="accountNumber" type="text" value={formData.accountNumber} onChange={handleChange} required className="shadow appearance-none border rounded w-full py-2 px-3"/>
        </div>
        <div>
          <label className="block text-gray-700 text-sm font-bold mb-2">口座名義（カタカナ）</label>
          <input name="accountHolder" type="text" value={formData.accountHolder} onChange={handleChange} required className="shadow appearance-none border rounded w-full py-2 px-3"/>
        </div>
        
        {message && (
          <div className={`p-3 rounded text-center my-4 ${message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            {message.text}
          </div>
        )}

        {/* ▼▼▼ セキュリティに関する注意書きを追加 ▼▼▼ */}
        <div className="text-center mt-6 text-xs text-gray-500">
          <p>🔒 お客様の口座情報は暗号化され、安全に保管されます。</p>
        </div>

        <div className="text-center pt-2">
          <button type="submit" disabled={isLoading} className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded disabled:bg-blue-300">
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
    const token = await adminAuth.verifySessionCookie(cookies.token, true);
    const { uid } = token;

    const payoutRef = adminDb.collection('payouts').doc(uid);
    const docSnap = await payoutRef.get();

    let payoutInfo = {
      bankName: '',
      branchName: '',
      accountType: '普通',
      accountNumber: '',
      accountHolder: '',
    };

    if (docSnap.exists) {
      payoutInfo = docSnap.data() as typeof payoutInfo;
    }

    return {
      props: {
        user: { uid },
        payoutInfo: JSON.parse(JSON.stringify(payoutInfo)),
      },
    };
  } catch (err) {
    return {
      redirect: {
        destination: '/partner/login',
        permanent: false,
      },
    };
  }
};

export default PartnerPayoutSettingsPage;