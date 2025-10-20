// pages/partner/payout-settings.tsx
import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import nookies from 'nookies';
import { GetServerSideProps, NextPage } from 'next';
import { Loader2 } from 'lucide-react';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { app } from '@/lib/firebase'; // ← 必ず初期化済みFirebaseをimport
import { adminAuth, adminDb } from '@/lib/firebase-admin';

// --- 型定義 ---
interface PayoutSettings {
  bankName: string;
  branchName: string;
  accountType: '普通' | '当座';
  accountNumber: string;
  accountHolder: string;
  stripeAccountId: string | null;
}

interface PayoutSettingsPageProps {
  initialSettings: PayoutSettings | null;
  uid: string | null;
}

// ===============================
// メインコンポーネント
// ===============================
const PayoutSettingsPage: NextPage<PayoutSettingsPageProps> = ({ initialSettings, uid }) => {
  const router = useRouter();
  const title = '報酬受取口座の登録・編集';
  const auth = getAuth(app);

  const [checkingAuth, setCheckingAuth] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);

  const [settings, setSettings] = useState<PayoutSettings>(
    initialSettings || {
      bankName: '',
      branchName: '',
      accountType: '普通',
      accountNumber: '',
      accountHolder: '',
      stripeAccountId: null,
    }
  );

  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // ===============================
  // Firebase認証状態チェック
  // ===============================
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user);
        // SSRでuidがなかった場合でもCSRで再取得して補完
        if (!uid) {
          const token = await user.getIdToken();
          await fetch('/api/auth/sessionLogin', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token }),
          });
        }
      } else {
        router.replace('/partner/login');
      }
      setCheckingAuth(false);
    });
    return () => unsubscribe();
  }, [auth, router, uid]);

  // ===============================
  // ローディング中画面
  // ===============================
  if (checkingAuth) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50">
        <Loader2 className="animate-spin mr-3 text-indigo-600" />
        <span className="text-gray-600">認証を確認しています...</span>
      </div>
    );
  }

  // ===============================
  // フォームハンドラ
  // ===============================
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { id, value } = e.target;
    setSettings((prev) => ({ ...prev, [id]: value as PayoutSettings[keyof PayoutSettings] }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    setIsLoading(true);
    setMessage(null);

    try {
      const response = await fetch('/api/partner/update-payout-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid: currentUser.uid, settings }),
      });

      if (!response.ok) throw new Error('保存に失敗しました。');

      setMessage({ type: 'success', text: '支払い設定を正常に保存しました。' });
    } catch (error: any) {
      console.error('Error saving settings:', error);
      setMessage({ type: 'error', text: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <Head>
        <title>{title}</title>
      </Head>
      <div className="max-w-2xl mx-auto">
        <Link href="/partner/dashboard" className="text-blue-500 hover:underline">
          ← ダッシュボードに戻る
        </Link>
        <h1 className="text-3xl font-bold my-6 text-center">{title}</h1>

        <form onSubmit={handleSave} className="bg-white p-8 rounded-lg shadow-xl space-y-6">
          <p className="text-sm text-gray-600 border-l-4 border-orange-400 pl-3 py-1 bg-orange-50">
            紹介報酬を受け取るための金融機関口座情報を登録してください。
          </p>

          {message && (
            <div
              className={`p-3 mb-4 rounded-lg text-center ${
                message.type === 'success'
                  ? 'bg-green-100 text-green-700'
                  : 'bg-red-100 text-red-700'
              }`}
            >
              {message.text}
            </div>
          )}

          {/* 銀行情報フォーム */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="bankName" className="block text-sm font-medium text-gray-700">
                銀行名 *
              </label>
              <input
                id="bankName"
                type="text"
                value={settings.bankName}
                onChange={handleChange}
                required
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
              />
            </div>
            <div>
              <label htmlFor="branchName" className="block text-sm font-medium text-gray-700">
                支店名 *
              </label>
              <input
                id="branchName"
                type="text"
                value={settings.branchName}
                onChange={handleChange}
                required
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="accountType" className="block text-sm font-medium text-gray-700">
                口座種別 *
              </label>
              <select
                id="accountType"
                value={settings.accountType}
                onChange={handleChange}
                required
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 bg-white"
              >
                <option value="普通">普通</option>
                <option value="当座">当座</option>
              </select>
            </div>
            <div>
              <label htmlFor="accountNumber" className="block text-sm font-medium text-gray-700">
                口座番号 *
              </label>
              <input
                id="accountNumber"
                type="text"
                pattern="[0-9]*"
                value={settings.accountNumber}
                onChange={handleChange}
                required
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
              />
            </div>
          </div>

          <div>
            <label htmlFor="accountHolder" className="block text-sm font-medium text-gray-700">
              口座名義 (カタカナ) *
            </label>
            <input
              id="accountHolder"
              type="text"
              value={settings.accountHolder}
              onChange={handleChange}
              required
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 transition-colors flex items-center justify-center"
          >
            {isLoading ? (
              <>
                <Loader2 className="animate-spin mr-2" /> 保存中...
              </>
            ) : (
              '支払い設定を保存する'
            )}
          </button>
        </form>

        <button
          onClick={() => router.push('/partner/dashboard')}
          className="mt-6 px-4 py-2 text-indigo-600 hover:underline"
        >
          &larr; ダッシュボードに戻る
        </button>
      </div>
    </div>
  );
};

// ===============================
// SSR認証チェック（任意で維持）
// ===============================
export const getServerSideProps: GetServerSideProps = async (context) => {
  try {
    const cookies = nookies.get(context);
    const session = cookies.session;

    if (!session) {
      // Cookieがない場合はCSRに任せる（リダイレクトせず props返却）
      return { props: { initialSettings: null, uid: null } };
    }

    const token = await adminAuth.verifySessionCookie(session, true);
    const uid = token.uid;

    const doc = await adminDb.collection('partners').doc(uid).get();
    if (!doc.exists) return { props: { initialSettings: null, uid } };

    const data = doc.data();
    const initialSettings: PayoutSettings = {
      bankName: data?.payoutSettings?.bankName || '',
      branchName: data?.payoutSettings?.branchName || '',
      accountType: data?.payoutSettings?.accountType || '普通',
      accountNumber: data?.payoutSettings?.accountNumber || '',
      accountHolder: data?.payoutSettings?.accountHolder || '',
      stripeAccountId: data?.stripeAccountId || null,
    };

    return { props: { initialSettings, uid } };
  } catch (error) {
    console.error('getServerSideProps error:', error);
    return { props: { initialSettings: null, uid: null } };
  }
};

export default PayoutSettingsPage;

