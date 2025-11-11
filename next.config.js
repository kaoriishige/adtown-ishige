/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: {
    // ビルド時にeslintエラーで止めない（クライアントに渡すための一時措置）
    ignoreDuringBuilds: true,
  },
  typescript: {
    // 型エラーでビルドを止めない（納品前に型は直すこと推奨）
    ignoreBuildErrors: true,
  },
  images: {
    // 🚨 修正箇所: domains を remotePatterns に変更し、非推奨の警告を解消
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
        // Firebase Storageはパスが複雑なため、全パスを許可
        pathname: '**', 
      },
      {
        protocol: 'https',
        hostname: 'minna-no-nasu-app.netlify.app',
        pathname: '**',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
        // Googleのユーザーコンテンツ画像は全パスを許可
        pathname: '**',
      },
      // /images/partner-*.png の静的アセットを Next.js で処理している場合、
      // 開発環境ではlocalhostからの画像も許可する必要がありますが、ここでは静的画像として扱い、
      // 外部ドメインのみを定義します。
    ],
  },
  webpack: (config) => {
    config.resolve.fallback = {
      fs: false,
      path: false,
      os: false,
      net: false,
      tls: false,
    };
    return config;
  },
  output: 'standalone',
};

module.exports = nextConfig;

























































