// landing-v2.tsx - 本番ランディングページ
import Head from 'next/head'

export default function LandingPage() {
  return (
    <div className="bg-white min-h-screen text-gray-800">
      <Head>
        <title>{"みんなの那須アプリ"}</title>
      </Head>
      <section className="bg-gradient-to-r from-pink-500 to-yellow-500 text-white py-20 px-6 text-center">
        <h1 className="text-5xl font-bold mb-4">みんなの那須アプリ</h1>
        <p className="text-lg font-semibold mb-6">55個の地域密着アプリが使い放題！</p>
        <p className="text-xl font-bold">今すぐ7日間無料で体験</p>
      </section>
      <section className="p-8 text-center">
        <a href="https://lin.ee/FmAmixwS" className="inline-block bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-full transition">
          LINEで無料登録する
        </a>
        <p className="mt-6 text-sm text-gray-500">登録後すぐに全アプリを利用できます</p>
      </section>
      <footer className="bg-gray-100 text-center text-xs p-4 mt-20">
        運営：みんなの那須アプリ / 株式会社adtown<br />
        〒329-2711 栃木県那須塩原市石林698-35 / TEL:0287-39-7577
      </footer>
    </div>
  )
}
