import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { signOut, onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '../lib/firebase';

const MyPage = () => {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRedirecting, setIsRedirecting] = useState(false);

  // ログイン状態を監視
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
      } else {
        router.push('/login'); // ログインしていなければログインページへ
      }
      setLoading(false);
    });
    return () => unsubscribe(); // クリーンアップ
  }, [router]);

  // ★★★ エラー修正箇所 ★★★
  // ログアウト処理を定義
  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push('/'); // ログアウト後にトップページへ
    } catch (error) {
      console.error('Logout failed', error);
      alert('ログアウトに失敗しました。');
    }
  };

  // 報酬口座登録の処理
  const handleRegisterPayouts = async () => {
    if (!user) {
      alert('ログイン情報が見つかりません。');
      return;
    }
    setIsRedirecting(true);
    try {
      const token = await user.getIdToken();
      const response = await fetch('/api/create-connect-account', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Stripeアカウント連携の準備に失敗しました。');
      }

      const { url } = await response.json();
      window.location.href = url; // Stripeのページへ移動

    } catch (error) {
      console.error(error);
      alert(`エラーが発生しました: ${error instanceof Error ? error.message : '時間をおいて再度お試しください。'}`);
      setIsRedirecting(false);
    }
  };

  if (loading || !user) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p>読み込み中...</p>
      </div>
    );
  }

  const buttonStyle = "w-full max-w-lg p-4 mb-4 text-lg font-bold text-white bg-blue-500 rounded-lg hover:bg-blue-600 transition-colors disabled:bg-gray-400";

  return (
    <div className="p-5 text-center my-10">
      <h1 className="text-3xl font-bold mb-4">マイページ</h1>
      <p className="mb-8">ようこそ、{user.email}さん</p>
      
      <div className="flex flex-col items-center">
        <Link href="/home">
          <a className={buttonStyle}>アプリページはこちら</a>
        </Link>
        
        <button onClick={handleRegisterPayouts} disabled={isRedirecting} className={buttonStyle}>
          {isRedirecting ? '準備中...' : '報酬受取口座を登録・編集する'}
        </button>
        
        <Link href="/referral-info">
           <a className={buttonStyle}>紹介用URLとQRコード</a>
        </Link>
        
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
          <a className={buttonStyle}>お問い合わせ・アプリ希望</a>
        </Link>
        <Link href="/cancel-subscription">
          <a className={buttonStyle}>解約希望の方はこちら</a>
        </Link>
        <button onClick={handleLogout} className="mt-8 bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded">
          ログアウト
        </button>
      </div>
    </div>
  );
};


