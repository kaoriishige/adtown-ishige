import { Html, Head, Main, NextScript, DocumentContext } from 'next/document';

function Document() {
  // ★★★ 重要: 環境変数をサーバーサイドで取得し、JSON文字列に変換する ★★★
  
  // クライアントサイドで使用するFirebase設定
  const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || '',
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || '',
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || '',
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '',
  };

  const firebaseConfigJSON = JSON.stringify(firebaseConfig);
  
  // アプリIDと認証トークン（Canvas仕様のグローバル変数）
  const appGlobalVars = `
    window.__firebase_config = '${firebaseConfigJSON}';
    window.__initial_auth_token = ''; // Next.js環境では通常空か、サーバー側でトークン生成が必要
    window.__app_id = 'nasu-app-id'; 
  `;

  return (
    <Html lang="ja">
      <Head />
      <body>
        {/*
          Firebaseのクライアント設定変数を、HTML読み込み時にwindowオブジェクトに埋め込む。
          これにより、クライアントサイドのコード（FridgeManager.tsx）が、
          サーバーから渡された設定を 'window.__firebase_config' 経由で安全に読み込める。
        */}
        <script
          id="firebase-config-embed"
          dangerouslySetInnerHTML={{
            __html: appGlobalVars,
          }}
        />
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}

// サーバーサイドでの処理が必要な場合は getServerSideProps ではなく getInitialProps または getServerSideProps を使う
// DocumentContext は Next.js の仕様変更に対応するためそのまま残します
Document.getInitialProps = async (ctx: DocumentContext) => {
  const initialProps = await ctx.defaultGetInitialProps(ctx);
  return { ...initialProps };
};

export default Document;