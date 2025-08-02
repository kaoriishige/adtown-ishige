import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { GetServerSideProps, NextPage } from 'next';
import { getAdminAuth } from '../lib/firebase-admin';
import Stripe from 'stripe';

// ページが受け取るPropsの型
interface WelcomePageProps {
  success: boolean;
  error?: string;
}

const WelcomePage: NextPage<WelcomePageProps> = ({ success, error }) => {
  const router = useRouter();
  const [message, setMessage] = useState('決済情報を確認しています...');

  useEffect(() => {
    // サーバーサイドでエラーがあった場合
    if (error) {
      setMessage(`エラー: ${error} 5秒後にログインページに戻ります。`);
      setTimeout(() => router.push('/login'), 5000);
      return;
    }
    
    // 成功した場合
    if (success) {
      setMessage('登録ありがとうございます！ログインページへ移動します。');
      // 3秒後にログインページへ移動
      setTimeout(() => {
        router.push('/login');
      }, 3000);
    }
  }, [success, error, router]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="text-center p-6 bg-white rounded-lg shadow-md">
        <h1 className="text-2xl font-bold mb-4">登録処理中</h1>
        <p>{message}</p>
        <div className="mt-6">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
        </div>
      </div>
    </div>
  );
};

// サーバーサイドで決済情報だけを確認する
export const getServerSideProps: GetServerSideProps = async (context) => {
  const { session_id } = context.query;

  if (typeof session_id !== 'string') {
    return { props: { success: false, error: 'セッションIDがありません。' } };
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

  try {
    // Stripeに問い合わせて、決済が本物か確認するだけ
    await stripe.checkout.sessions.retrieve(session_id);

    // 確認できれば成功
    return { props: { success: true } };

  } catch (error) {
    console.error('Welcomeページのサーバーサイドでエラー:', error);
    return { props: { success: false, error: '決済情報の検証に失敗しました。' } };
  }
};

export default WelcomePage;