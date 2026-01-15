import type { AppProps } from 'next/app';
import '@/styles/globals.css';
import { AuthProvider } from '../contexts/AuthContext';
import { useRouter } from 'next/router';
import { useEffect } from 'react';
import { setCookie } from 'nookies'; // nookiesをインポート

export default function MyApp({ Component, pageProps }: AppProps) {
  const router = useRouter();

  useEffect(() => {
    // URLのクエリパラメータから "ref" を取得
    const { ref } = router.query;

    if (ref && typeof ref === 'string') {
      // 紹介者IDをCookieに30日間保存
      setCookie(null, 'referredBy', ref, {
        maxAge: 30 * 24 * 60 * 60, // 30日間有効
        path: '/', // サイト全体で有効
        sameSite: 'lax',
      });
      console.log('Referrer ID saved to cookie:', ref);
    }
  }, [router.query.ref]);

  return (
    <AuthProvider>
      <Component {...pageProps} />
    </AuthProvider>
  );
}