import type { NextPage } from 'next'
import Head from 'next/head'

const HomePage: NextPage = () => {
  return (
    <>
      <Head>
        <title>みんなの那須アプリ</title>
      </Head>

      <main style={{ padding: 20 }}>
        <h1>ホーム画面</h1>
        <p>ここが表示されれば Next.js は正常です。</p>
      </main>
    </>
  )
}

export default HomePage
