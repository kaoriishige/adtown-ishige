import Head from 'next/head';

export default function LandingPage() {
  return (
    <>
      <Head>
        <title>{"みんなの那須アプリ｜予告ランディング"}</title>
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
        <p style={ fontSize: '1.5rem', color: '#fca5a5', fontWeight: 'bold' }>緊急予告!!</p>
        <h1 style={ fontSize: '3rem', fontWeight: 'bold', margin: '1rem 0' }>みんなの那須アプリ</h1>
        <p style={ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem' }>まもなくスタート予定</p>
        <p style={ fontSize: '1.25rem', fontWeight: 'bold', color: '#fff' }>🎉 まずは7日間無料でお試し使い放題！</p>
        <p style={ fontSize: '1rem', marginTop: '1rem', maxWidth: '600px', margin: '0 auto' }>
          特売情報・今日の運勢・相性診断・地域情報アプリ、あなたに役立つ55選、ぜんぶ入り使い放題！
        </p>
        <div style={ marginTop: '4rem' }>
          <a href="https://lin.ee/xFbam0U" target="_blank" rel="noopener noreferrer">
            <img
              src="https://scdn.line-apps.com/n/line_add_friends/btn/ja.png"
              alt="友だち追加"
              height="36"
              style={ border: 0 }
            />
          </a>
        </div>
      </div>
    </>
  );
}