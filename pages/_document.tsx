import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html lang="ja">
      <Head>
        {/* manifest.jsonは削除済み */}
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}