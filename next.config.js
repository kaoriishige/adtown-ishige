/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // ▼▼▼ ここから追記 ▼▼▼
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'scdn.line-apps.com',
        port: '',
        pathname: '/n/line_add_friends/btn/ja.png',
      },
    ],
  },
  // ▲▲▲ ここまで追記 ▲▲▲
};

module.exports = nextConfig;



















































