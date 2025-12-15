// pages/_app.tsx

import type { AppProps } from 'next/app';
import '@/styles/globals.css';
// 1. AuthProvider をインポート
import { AuthProvider } from '../contexts/AuthContext'; 

export default function MyApp({ Component, pageProps }: AppProps) {
  return (
    // 2. AuthProvider で Component を囲む
    <AuthProvider>
      <Component {...pageProps} />
    </AuthProvider>
  );
}