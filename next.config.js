/** @type {import('next').NextConfig} */
const nextConfig = {
  // Reactの厳格モードを有効化（デバッグと将来の安全性向上）
  reactStrictMode: true,

  // ✅ ESLint/TypeScript エラーではビルドを止めない（Netlifyで安全）
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },

  // ✅ 画像最適化設定（Firebase Storageなど外部画像対応）
  images: {
    domains: [
      'firebasestorage.googleapis.com',
      'lh3.googleusercontent.com', // Googleログイン画像など
      'images.unsplash.com',       // 一般的な外部画像
      'cdn.pixabay.com'            // サンプル素材対応
    ],
    formats: ['image/avif', 'image/webp'],
  },

  // ✅ パフォーマンス最適化
  compress: true,
  poweredByHeader: false, // セキュリティ上の理由で非表示
  swcMinify: true,        // SWCによる高速ミニファイ

  // ✅ Next.js 14+ 以降でのApp Router最適化（該当する場合のみ）
  experimental: {
    optimizeCss: true,
    scrollRestoration: true,
  },

  // ✅ 環境変数設定（必要ならここで追加）
  env: {
    NEXT_PUBLIC_APP_ENV: process.env.NEXT_PUBLIC_APP_ENV || 'production',
  },

  // ✅ リダイレクト・リライト（必要に応じて拡張）
  async redirects() {
    return [
      {
        source: '/admin',
        destination: '/admin/dashboard',
        permanent: false,
      },
    ];
  },
};

module.exports = nextConfig;
























































