'use client';

import { useState } from 'react';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { app } from '@/lib/firebase';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const login = async () => {
    setError('');
    try {
      const auth = getAuth(app);
      await signInWithEmailAndPassword(auth, email, pw);
      router.push('/admin');
    } catch (err: any) {
      setError('ログインに失敗しました');
    }
  };

  return (
    <div className="p-6 max-w-sm mx-auto">
      <h1 className="text-xl font-bold mb-4">管理者ログイン</h1>
      <input
        type="email"
        placeholder="Email"
        className="w-full border p-2 mb-2"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <input
        type="password"
        placeholder="Password"
        className="w-full border p-2 mb-4"
        value={pw}
        onChange={(e) => setPw(e.target.value)}
      />
      <button className="bg-blue-600 text-white px-4 py-2 rounded w-full" onClick={login}>
        ログイン
      </button>
      {error && <p className="text-red-600 mt-2">{error}</p>}
    </div>
  );
}
