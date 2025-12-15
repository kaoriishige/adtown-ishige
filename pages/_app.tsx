// pages/_app.tsx
import type { AppProps } from 'next/app'
import { useEffect } from 'react'
import '@/styles/globals.css'

export default function App({ Component, pageProps }: AppProps) {
  useEffect(() => {
    // ✅ LINE内ブラウザでのみLIFFを使う
    if (typeof window === 'undefined') return
    if (!window.navigator.userAgent.includes('Line')) return

    const initLiff = async () => {
      try {
        const liff = (await import('@line/liff')).default
        await liff.init({
          liffId: process.env.NEXT_PUBLIC_LIFF_ID!,
        })

        if (!liff.isLoggedIn()) {
          liff.login()
        }
      } catch (err) {
        console.error('LIFF init error', err)
      }
    }

    initLiff()
  }, [])

  return <Component {...pageProps} />
}



