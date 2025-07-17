import { useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useAuth } from '../contexts/AuthContext';
import { signOut } from 'firebase/auth'; // 【変更点1】signOutをインポート
import { auth } from '../lib/firebase';

const CancelSubscriptionPage = () => {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  const handleCancel = async () => {
    if (confirm('本当に解約しますか？この操作を行うと、次の更新日以降、全てのアプリが利用できなくなります。')) {
      // ここに、将来的にStripeのサブスクリプションをキャンセルするAPIを呼び出す処理が入ります。
      
      try {
        await signOut(auth); // 【変更点2】ログアウト処理を追加
        alert('解約手続きを受け付けました。ご利用いただき、誠にありがとうございました。');
        router.push('/'); // 【変更点3】トップページに戻るように修正
      } catch (error) {
        alert('ログアウト中にエラーが発生しました。');
        console.error(error);
      }
    }
  };

  if (loading || !user) {
    return <p>読み込み中...</p>;
  }

  return (
    <div className="p-5 max-w-xl mx-auto my-10 text-center">
      <Link href="/mypage" className="text-blue-500 hover:underline">
        ← マイページに戻る
      </Link>
      <h1 className="text-3xl font-bold my-6 text-red-600">サブスクリプションの解約</h1>
      
      <div className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4">
        <p className="mb-4">
          「みんなの那須アプリ」のサブスクリプションを解約します。
        </p>
        <p className="mb-6 text-sm text-gray-600">
          解約手続きを行うと、現在の請求期間の終了日をもってサービスが停止され、それ以降の請求は発生しません。
        </p>
        <button
          onClick={handleCancel}
          className="w-full bg-red-500 hover:bg-red-700 text-white font-bold py-3 px-4 rounded focus:outline-none focus:shadow-outline"
        >
          解約手続きを進める
        </button>
      </div>
    </div>
  );
};

export default CancelSubscriptionPage;

