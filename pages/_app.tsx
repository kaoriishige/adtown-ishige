import type { AppProps } from 'next/app'
import { useEffect, useState } from 'react'
import liff from '@line/liff'
import '@/styles/globals.css'

export default function MyApp({ Component, pageProps }: AppProps) {
  const [liffReady, setLiffReady] = useState(false)

  useEffect(() => {
    const initLIFF = async () => {
      try {
        if (!process.env.NEXT_PUBLIC_LIFF_ID) {
          console.error('LIFF ID が未設定')
          return
        }

        await liff.init({
          liffId: process.env.NEXT_PUBLIC_LIFF_ID,
        })

        // ★ login はここでやらない ★
        setLiffReady(true)
      } catch (e) {
        console.error('LIFF init error', e)
      }
    }

    initLIFF()
  }, [])

  if (!liffReady) return null

  return <Component {...pageProps} />
}






