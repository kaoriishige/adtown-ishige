import { useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useAuth } from '../contexts/AuthContext';
import { signOut } from 'firebase/auth';
import { auth } from '../lib/firebase';

const MyPage = () => {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  const handleLogout = async () => {
    await signOut(auth);
    router.push('/');
  };

  if (loading || !user) {
    return <p>読み込み中...</p>;
  }

  const buttonStyle = "w-full max-w-lg p-4 mb-4 text-lg font-bold text-white bg-blue-500 rounded-lg hover:bg-blue-600 transition-colors";

  return (
    <div className="p-5 text-center my-10">
      <h1 className="text-3xl font-bold mb-4">マイページ</h1>
      <p className="mb-8">ようこそ、{user.email}さん</p>
      
      <div className="flex flex-col items-center">
        {/* ▼▼ ボタンのテキストと順番を変更 ▼▼ */}
        <Link href="/home">
          <button className={buttonStyle}>アプリページはこちら</button>
        </Link>
        <Link href="/referral-info">
          <button className={buttonStyle}>紹介用URLリンクとQRコードを表示・保存する</button>
        </Link>
        {/* ▲▲ ここまで変更 ▲▲ */}
        
        <div className="max-w-2xl bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-6 my-8 rounded-lg text-left">
          <h2 className="text-2xl font-bold mb-4 text-yellow-800">紹介制度で“実質無料”どころか、副収入に！</h2>
          <ul className="list-disc list-inside space-y-2">
            <li>8月末までに紹介した方には → 紹介報酬[30%]ずっと継続!!</li>
            <li>9月より初めて紹介された方は→紹介報酬[20%]</li>
            <li>あなたのリンク経由で登録されるだけでOK</li>
            <li>報酬は即時アカウントに反映</li>
            <li>月5人紹介すれば月額アプリ料金分以上が還元</li>
            <li>100人紹介すれば、毎月約30,000円の報酬を継続でGET！</li>
            <li>追加の設定は不要、すぐ開始可能</li>
          </ul>
          <p className="text-xs mt-4">※紹介報酬は、紹介された方が980円で継続課金した場合の計算です。</p>
        </div>

        <Link href="/contact">
          <button className={buttonStyle}>お問い合わせ・アプリ希望はこちら</button>
        </Link>
        <Link href="/cancel-subscription">
          <button className={buttonStyle}>解約希望の方はこちら</button>
        </Link>
        <button onClick={handleLogout} className="mt-8 bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded">
          ログアウト
        </button>
      </div>
    </div>
  );
};

export default MyPage;



