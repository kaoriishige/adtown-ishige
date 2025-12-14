/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: {
    ignoreDuringBuilds: true, // ビルド時にeslintエラーで止めない
  },
  typescript: {
    ignoreBuildErrors: true, // 型エラーでビルドを止めない
  },
  images: {
    unoptimized: true, // ← ここが重要。Netlify で next/image の問題回避
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
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
        pathname: '**',
      },
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


























































