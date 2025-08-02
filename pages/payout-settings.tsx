// pages/payout-settings.tsx

// --- ライブラリのインポート ---
import { useState, FormEvent, ChangeEvent } from 'react';
import { GetServerSideProps, NextPage } from 'next';
import Link from 'next/link';
import nookies from 'nookies';
import { getAdminAuth, getAdminDb } from '../lib/firebase-admin'; // ★ 新しい方法でインポート

// --- 型定義 ---

// 報酬受取口座情報の型
interface PayoutInfo {
  bankName: string;
  branchName: string;
  accountType: '普通' | '当座';
  accountNumber: string;
  accountHolderName: string;
}

// ページコンポーネントが受け取るpropsの型
interface PayoutSettingsPageProps {
  initialPayoutInfo: PayoutInfo | null;
}


// --- ページコンポーネント（ブラウザで動作） ---

const PayoutSettingsPage: NextPage<PayoutSettingsPageProps> = ({ initialPayoutInfo }) => {
  // フォームの入力値を管理
  const [formData, setFormData] = useState<PayoutInfo>(initialPayoutInfo || {
    bankName: '',
    branchName: '',
    accountType: '普通',
    accountNumber: '',
    accountHolderName: '',
  });

  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');

  // フォーム入力の変更をハンドル
  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // フォーム送信時の処理
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');

    try {
      // APIにデータを送信して保存
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
      setMessage(error instanceof Error ? error.message : '不明なエラーが発生しました。');
    } finally {
      setIsLoading(false);
    }
  };

  // ページの見た目 (JSX)
  return (
    <div className="p-5 max-w-2xl mx-auto my-10 bg-gray-50">
      <Link href="/mypage" className="text-blue-500 hover:underline">
        ← マイページに戻る
      </Link>
      <h1 className="text-3xl font-bold my-6 text-center">報酬受取口座の登録・編集</h1>
      
      <form onSubmit={handleSubmit} className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4">
        {message && (
          <div className={`p-4 mb-4 rounded text-center font-bold ${message.includes('失敗') || message.includes('エラー') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
            {message}
          </div>
        )}

        <div className="mb-4">
          <label htmlFor="bankName" className="block text-gray-700 text-sm font-bold mb-2">金融機関名</label>
          <input id="bankName" type="text" name="bankName" value={formData.bankName} onChange={handleChange} className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700" required placeholder="例：那須信用金庫" />
        </div>
        <div className="mb-4">
          <label htmlFor="branchName" className="block text-gray-700 text-sm font-bold mb-2">支店名</label>
          <input id="branchName" type="text" name="branchName" value={formData.branchName} onChange={handleChange} className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700" required placeholder="例：本店営業部" />
        </div>
        <div className="mb-4">
          <label htmlFor="accountType" className="block text-gray-700 text-sm font-bold mb-2">預金種目</label>
          <select id="accountType" name="accountType" value={formData.accountType} onChange={handleChange} className="shadow border rounded w-full py-2 px-3 bg-white">
            <option value="普通">普通</option>
            <option value="当座">当座</option>
          </select>
        </div>
        <div className="mb-4">
          <label htmlFor="accountNumber" className="block text-gray-700 text-sm font-bold mb-2">口座番号</label>
          <input id="accountNumber" type="text" name="accountNumber" value={formData.accountNumber} onChange={handleChange} className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700" required placeholder="7桁の半角数字" pattern="\d{1,7}" title="7桁までの半角数字で入力してください" />
        </div>
        <div className="mb-6">
          <label htmlFor="accountHolderName" className="block text-gray-700 text-sm font-bold mb-2">口座名義（カナ）</label>
          <input id="accountHolderName" type="text" name="accountHolderName" value={formData.accountHolderName} onChange={handleChange} className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700" required placeholder="例：ナス タロウ" />
        </div>

        <div className="text-center">
          <button type="submit" disabled={isLoading} className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline disabled:bg-gray-400">
            {isLoading ? '保存中...' : 'この内容で保存する'}
          </button>
        </div>
      </form>
    </div>
  );
};


// --- サーバーサイド処理（ページ表示前に実行） ---

export const getServerSideProps: GetServerSideProps = async (context) => {
  // ★ 新しい方法でAuthとDBを呼び出す
  const adminAuth = getAdminAuth();
  const adminDb = getAdminDb();

  if (!adminAuth || !adminDb) {
    console.error("Firebase Admin on PayoutSettings failed to initialize.");
    return { redirect: { destination: '/login', permanent: false } };
  }

  try {
    // Cookieからユーザー情報を取り出し、本人か確認
    const cookies = nookies.get(context);
    const token = await adminAuth.verifyIdToken(cookies.token);
    const { uid } = token;

    // Firestoreから、現在の口座設定を取得
    const userPayoutDoc = await adminDb.collection('payouts').doc(uid).get();
    
    const existingInfo = userPayoutDoc.exists ? userPayoutDoc.data() : null;

    // ページコンポーネントに初期値として渡す
    return {
      props: {
        // JSONに変換できないTimestamp型などを安全に変換
        initialPayoutInfo: JSON.parse(JSON.stringify(existingInfo)),
      },
    };
  } catch (error) {
    console.error("Payout settings page SSR error:", error);
    // ログインページにリダイレクトさせる
    return {
      redirect: {
        destination: '/login',
        permanent: false,
      },
    };
  }
};

export default PayoutSettingsPage;