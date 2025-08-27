const withPWA = require('next-pwa')({
  dest: 'public'
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // ... 他の設定
};

module.exports = withPWA(nextConfig);



















































