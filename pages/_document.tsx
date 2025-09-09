import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html lang="ja">
      <Head>
        {/* manifest.jsonへのリンクが完全に削除された状態 */}
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}