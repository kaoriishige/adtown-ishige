import { GetServerSideProps, NextPage } from 'next';
import Link from 'next/link';
import nookies from 'nookies';
import { adminAuth } from '../lib/firebase-admin';
import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { RiArrowLeftLine, RiLoader4Line } from 'react-icons/ri';

// --- 型定義 ---
interface User {
  uid: string;
  email: string;
}

interface CancelPageProps {
  user: User;
}

// --- ページコンポーネント ---
const CancelSubscriptionPage: NextPage<CancelPageProps> = ({ user }) => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null);

  const handleCancel = async () => {
    setIsLoading(true);
    setMessage(null);

    try {
      // ★★★ 変更点: APIのパスを /api/cancel-subscription に修正 ★★★
      const response = await fetch('/api/cancel-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ uid: user.uid }), // ユーザーIDをAPIに送信
      });

      // レスポンスがJSONでない場合（これ自体がエラー）
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
         throw new Error("サーバーから予期しない形式の応答がありました。");
      }
      
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || '解約処理に失敗しました。');
      }

      // 成功した場合
      setMessage({ type: 'success', text: '解約処理が正常に完了しました。3秒後にダッシュボードに戻ります。' });
      
      // 3秒後にダッシュボードへリダイレクト
      setTimeout(() => {
        router.push('/partner/dashboard');
      }, 3000);

    } catch (error: any) {
      console.error('Cancel subscription error:', error);
      // 'Unexpected token' エラーの場合、より分かりやすいメッセージを表示
      if (error.message.includes('Unexpected token')) {
        setMessage({ type: 'error', text: 'サーバーとの通信に失敗しました。APIが正しく応答していません。' });
      } else {
        setMessage({ type: 'error', text: `エラーが発生しました: ${error.message}` });
      }
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="p-5 max-w-xl mx-auto w-full">
        <Link href="/partner/dashboard" legacyBehavior>
          <a className="flex items-center text-indigo-600 hover:text-indigo-800 font-medium">
            <RiArrowLeftLine className="mr-1 h-5 w-5" />
            ダッシュボードに戻る
          </a>
        </Link>
        <div className="bg-white shadow-lg rounded-xl px-8 pt-6 pb-8 mb-4 mt-6 text-center border-t-4 border-red-500">
          <h1 className="text-2xl font-bold my-4 text-red-700">サブスクリプションの解約</h1>
          <p className="text-gray-700 mb-6">
            本当に有料プランのサブスクリプションを解約しますか？<br />
            解約手続きを行うと、現在の請求期間の終了日をもってサービスが停止され、それ以降の請求は発生しません。
          </p>

          {/* メッセージ表示エリア */}
          {message && (
            <div 
              className={`p-4 rounded-md my-4 text-sm font-medium ${
                message.type === 'success' 
                ? 'bg-green-100 border border-green-300 text-green-800' 
                : 'bg-red-100 border border-red-300 text-red-800'
              }`}
            >
              <p>{message.text}</p>
            </div>
          )}

          <button 
            onClick={handleCancel}
            disabled={isLoading || message?.type === 'success'}
            className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-8 rounded-lg text-lg transition-colors duration-150 flex items-center justify-center disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <RiLoader4Line className="animate-spin h-5 w-5 mr-3" />
                処理を実行中...
              </>
            ) : (
              '解約手続きを実行する'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

// --- サーバーサイドでの認証チェック ---
export const getServerSideProps: GetServerSideProps = async (context) => {
  try {
    const cookies = nookies.get(context);
    const token = await adminAuth.verifySessionCookie(cookies.session || '', true);
    
    return {
      props: {
        user: { 
          uid: token.uid, 
          email: token.email || '' 
        },
      },
    };
  } catch (error) {
    console.error("Cancel page auth error:", error);
    return {
      redirect: {
        destination: '/partner/login?error=session_expired',
        permanent: false,
      },
    };
  }
};

export default CancelSubscriptionPage;
