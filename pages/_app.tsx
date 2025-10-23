import '@/styles/globals.css';
import type { AppProps } from 'next/app';
import { PWAProvider } from '../contexts/PWAContext';

// このimport文が必ず存在することを確認してください
import '../lib/firebase-client';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <PWAProvider>
      <Component {...pageProps} />
    </PWAProvider>
  );
}
