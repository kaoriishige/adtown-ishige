import { NextPage } from 'next';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { app } from '../../lib/firebase'; // ← あなたのfirebaseクライアント初期化ファイルを指定

const PartnerDashboard: NextPage = () => {
  const router = useRouter();
  const [message, setMessage] = useState('ようこそ、パートナー様！');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const autoLogin = async () => {
      // URLに 'status=success' が含まれている場合のみ自動ログインを実行
      if (router.query.status === 'success') {
        const email = localStorage.getItem('signupEmail');
        const password = localStorage.getItem('signupPassword');

        if (email && password) {
          try {
            setMessage('決済が完了しました。自動的にログインしています...');
            const auth = getAuth(app);
            await signInWithEmailAndPassword(auth, email, password);
            
            setMessage('ログインに成功しました！ダッシュボードへようこそ。');
            setIsLoading(false);

          } catch (error) {
            console.error('Auto-login failed:', error);
            setMessage('自動ログインに失敗しました。お手数ですが、ログインページから再度ログインしてください。');
            setIsLoading(false);
            router.push('/login'); // ログインページへ誘導
          } finally {
            // ★重要★ 処理が成功しても失敗しても、パスワードは必ず削除
            localStorage.removeItem('signupEmail');
            localStorage.removeItem('signupPassword');
          }
        } else {
            setIsLoading(false);
        }
      } else {
        setIsLoading(false);
      }
    };

    autoLogin();
  }, [router.query]);

  if (isLoading) {
    return (
        <div className="flex justify-center items-center h-screen">
            <p>{message}</p>
        </div>
    );
  }

  return (
    <div>
      <h1>パートナーダッシュボード</h1>
      <p>{message}</p>
      {/* ここに、報酬履歴や紹介用QRコードなどを表示するコンポーネントを配置していきます */}
    </div>
  );
};

export default PartnerDashboard;