import '@/styles/globals.css';
import type { AppProps } from 'next/app';
import { AuthProvider } from '../contexts/AuthContext'; // AuthProviderをインポート

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <AuthProvider> {/* このAuthProviderで全体を囲む */}
      <Component {...pageProps} />
    </AuthProvider>
  );
}

export default MyApp;

