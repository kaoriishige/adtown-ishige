/** @type {import('next').NextConfig} */
const nextConfig = {
  // ここに他の設定があるかもしれませんが、そのままで大丈夫です

  // 以下のimagesブロックを追加
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'scdn.line-apps.com',
        port: '',
        pathname: '/n/line_add_friends/btn/**',
      },
    ],
  },
};

module.exports = nextConfig;




















































