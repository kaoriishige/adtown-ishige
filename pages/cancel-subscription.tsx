import { GetServerSideProps, NextPage } from 'next';
import Link from 'next/link';
import nookies from 'nookies';
import { adminAuth } from '../lib/firebase-admin';

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
  // ここにStripeと連携して解約するAPIを呼び出すロジックを追加します
  const handleCancel = () => {
    alert('解約処理を行いました（実際の処理は未実装です）');
  };

  return (
    <div className="p-5 max-w-xl mx-auto my-10">
      <Link href="/mypage" className="text-blue-500 hover:underline">
        ← マイページに戻る
      </Link>
      <div className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4 mt-6 text-center border-t-4 border-red-500">
        <h1 className="text-2xl font-bold my-4 text-red-700">サブスクリプションの解約</h1>
        <p className="text-gray-700 mb-6">
          「みんなの那須アプリ」のサブスクリプションを解約します。<br />
          解約手続きを行うと、現在の請求期間の終了日をもってサービスが停止され、それ以降の請求は発生しません。
        </p>
        <button 
          onClick={handleCancel}
          className="bg-red-500 hover:bg-red-700 text-white font-bold py-3 px-8 rounded-lg text-lg"
        >
          解約手続きを進める
        </button>
      </div>
    </div>
  );
};

// --- サーバーサイドでの認証チェック ---
export const getServerSideProps: GetServerSideProps = async (context) => {
  try {
    const cookies = nookies.get(context);
    const token = await adminAuth.verifySessionCookie(cookies.token, true);
    
    return {
      props: {
        user: { 
          uid: token.uid, 
          email: token.email || '' 
        },
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

export default CancelSubscriptionPage;
