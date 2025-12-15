import type { AppProps } from 'next/app'
import { useEffect, useState } from 'react'
import liff from '@line/liff'
import '@/styles/globals.css'

export default function MyApp({ Component, pageProps }: AppProps) {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const init = async () => {
      try {
        // 🔴 LIFF ID が無い or LINE外なら LIFFを完全にスキップ
        if (
          !process.env.NEXT_PUBLIC_LIFF_ID ||
          typeof window === 'undefined' ||
          !liff.isInClient()
        ) {
          setReady(true)
          return
        }

        await liff.init({
          liffId: process.env.NEXT_PUBLIC_LIFF_ID,
        })

        setReady(true)
      } catch (e) {
        console.error('LIFF error', e)
        // 🔴 失敗しても必ず描画する
        setReady(true)
      }
    }

    init()
  }, [])

  if (!ready) return null

  return <Component {...pageProps} />
}







