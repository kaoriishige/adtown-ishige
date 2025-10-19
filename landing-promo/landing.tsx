// landing.tsx - 予告ランディングページ
import Head from 'next/head'

export default function LandingPage() {
  return (
    <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white min-h-screen flex flex-col justify-center items-center text-center p-8">
      <Head>
        <title>{"みんなの那須アプリ - 予告"}</title>
      </Head>
      <h1 className="text-5xl font-bold mb-4">みんなの那須アプリ</h1>
      <p className="text-xl mb-6">まもなく公開！</p>
      <p className="text-md">地域の55個のアプリが使い放題！<br />まずは7日間無料でお試しください。</p>
    </div>
  )
}
