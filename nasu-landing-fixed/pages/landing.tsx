import Head from 'next/head'

export default function LandingPage() {
  return (
    <>
      <Head>
        <title>みんなの那須アプリ｜予告ランディング</title>
      </Head>

      <div
        style={{
          background: 'linear-gradient(to right, #3b82f6, #9333ea)',
          minHeight: '100vh',
          color: 'white',
          textAlign: 'center',
          padding: '4rem 1rem',
        }}
      >
        <p style={{ fontSize: '1.5rem', color: '#fca5a5', fontWeight: 'bold' }}>
          緊急予告!!
        </p>
        <h1 style={{ fontSize: '3rem', fontWeight: 'bold', margin: '1rem 0' }}>
          みんなの那須アプリ
        </h1>
        <p style={{ fontSize: '1.5rem', color: '#fdba74', fontWeight: 'bold' }}>
          まもなくスタート予定!!
        </p>
        <p style={{ margin: '2rem auto', maxWidth: '500px', fontSize: '1rem' }}>
          特売・運勢・診断・地域情報アプリなど55選、すべて使い放題！
        </p>

        <div style={{ marginTop: '3rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem' }}>
            LINE登録はこちら
          </h2>
          <a
            href="https://lin.ee/d3CIGrJ"
            target="_blank"
            rel="noopener noreferrer"
          >
            <img
              src="https://scdn.line-apps.com/n/line_add_friends/btn/ja.png"
              alt="友だち追加"
              height="36"
              style={{ border: 0 }}
            />
          </a>
          <p style={{ fontSize: '0.9rem', color: '#e5e7eb', marginTop: '0.5rem' }}>
            ※ボタンをタップしてLINE登録
          </p>
        </div>
      </div>
    </>
  )
}