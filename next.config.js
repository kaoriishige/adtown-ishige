/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'scdn.line-apps.com',
        port: '',
        pathname: '/n/line_add_friends/btn/ja.png',
      },
      {
        protocol: 'https',
        hostname: 'minna-no-nasu-app.netlify.app',
        port: '',
        pathname: '/images/**', // ← Netlifyの公開画像を許可
      },
    ],
  },
};

module.exports = nextConfig;





















































