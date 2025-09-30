import { NextPage } from 'next';
import { useRouter } from 'next/router';
import { useAuth } from '../contexts/AuthContext'; // あなたの認証Contextに合わせてください
import { sendEmailVerification } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { useState } from 'react';

const VerifyEmailPage: NextPage = () => {
  // useAuth フックがない場合、ログインページに飛ばすなどの処理を検討
  // const { user } = useAuth(); 
  const [sendStatus, setSendStatus] = useState<'idle' | 'sending' | 'sent'>('idle');
  const router = useRouter();

  const handleResendEmail = async () => {
    if (auth.currentUser) {
      setSendStatus('sending');
      try {
        await sendEmailVerification(auth.currentUser);
        setSendStatus('sent');
        // alert('確認メールを再送信しました。');
      } catch (error) {
        console.error("メール再送信エラー:", error);
        alert('メールの再送信に失敗しました。');
        setSendStatus('idle');
      }
    } else {
        alert('ユーザー情報が見つかりません。再度ログインしてからお試しください。');
        router.push('/login');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="text-center p-8 max-w-2xl mx-auto bg-white rounded-lg shadow-md">
        <h1 className="text-3xl font-bold mb-4">ご登録ありがとうございます</h1>
        <p className="mb-6">
          アカウントを有効化するための確認メールを送信しました。
        </p>
        <p className="mb-8">
          メール内のリンクをクリックして、登録を完了させてください。
        </p>
        <p className="text-sm mt-8 text-gray-500">
          メールが届かない場合は、迷惑メールフォルダもご確認ください。
        </p>
        <button
          onClick={handleResendEmail}
          disabled={sendStatus !== 'idle'}
          className="mt-6 py-2 px-4 text-white bg-green-500 rounded-md hover:bg-green-600 disabled:bg-gray-400"
        >
          {sendStatus === 'idle' && '確認メールを再送信'}
          {sendStatus === 'sending' && '送信中...'}
          {sendStatus === 'sent' && '再送信しました'}
        </button>
      </div>
    </div>
  );
};

export default VerifyEmailPage;