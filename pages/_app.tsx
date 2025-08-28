import '@/styles/globals.css';
import type { AppProps } from 'next/app';
import { PWAProvider } from '../contexts/PWAContext'; // ★ インポート

export default function App({ Component, pageProps }: AppProps) {
  return (
    // ★ PWAProviderで全体を囲む
    <PWAProvider>
      <Component {...pageProps} />
    </PWAProvider>
  );
}

