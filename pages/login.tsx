import { NextPage } from 'next';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { getAuth, signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { app } from '@/lib/firebase';

const LoginPage: NextPage = () => {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ★★★ ログイン成功後の共通処理を追加 ★★★
  const handleLoginSuccess = async (idToken: string) => {
    const response = await fetch('/api/auth/sessionLogin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken }),
    });
    
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'ログインに失敗しました。');
    
    // ★★★ 役割(role)に応じて移動先を振り分ける ★★★
    if (data.role === 'admin') {
      router.push('/admin/dashboard'); // 管理者は管理者ダッシュボードへ
    } else if (data.role === 'partner') {
      router.push('/partner/dashboard'); // パートナーはパートナーダッシュボードへ
    } else {
      router.push('/mypage'); // 一般ユーザーはマイページへ
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const auth = getAuth(app);
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const idToken = await userCredential.user.getIdToken();
      await handleLoginSuccess(idToken);
    } catch (err: any) {
      setError('メールアドレスまたはパスワードが正しくありません。');
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setError(null);
    const auth = getAuth(app);
    const provider = new GoogleAuthProvider();
    try {
      const userCredential = await signInWithPopup(auth, provider);
      const idToken = await userCredential.user.getIdToken();
      await handleLoginSuccess(idToken);
    } catch (err: any) {
      setError('Googleログインに失敗しました。');
      setIsLoading(false);
    }
  };

  // ... (以降のページの見た目(JSX)部分は変更ありません)
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      {/* ... */}
    </div>
  );
};

export default LoginPage;