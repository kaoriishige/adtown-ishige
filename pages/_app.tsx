import type { AppProps } from 'next/app'
import { useEffect, useState } from 'react'
import liff from '@line/liff'
import '@/styles/globals.css'

export default function MyApp({ Component, pageProps }: AppProps) {
  const [initialized, setInitialized] = useState(false)

  useEffect(() => {
    const init = async () => {
      // LIFF_ID がある場合だけ LIFF 初期化
      if (process.env.NEXT_PUBLIC_LIFF_ID) {
        try {
          await liff.init({
            liffId: process.env.NEXT_PUBLIC_LIFF_ID,
          })
        } catch (e) {
          console.error('LIFF init failed', e)
        }
      }

      // 🔥 重要：LIFF 成否に関係なく描画を許可
      setInitialized(true)
    }

    init()
  }, [])

  // 初期化中だけローディング（真っ白回避）
  if (!initialized) {
    return <div style={{ padding: 20 }}>Loading...</div>
  }

  return <Component {...pageProps} />
}






