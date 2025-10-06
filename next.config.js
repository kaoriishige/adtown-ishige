// next.config.js

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    unoptimized: true,
  },
  webpack: (config, { isServer, webpack }) => {
    // クライアントサイドでのみ設定を適用
    if (!isServer) {
      config.resolve.fallback = {
        fs: false,
        net: false,
        tls: false,
        child_process: false,
        http2: false,
        // これまでのフォールバック設定
      };
    }

    // WebAssemblyの問題に対応するため、実験的な設定を追加
    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
    };

    // Node.jsの内部モジュールを解決するルールを追加
    config.plugins.push(
      new webpack.NormalModuleReplacementPlugin(
        /^node:/,
        (resource) => {
          resource.request = resource.request.replace(/^node:/, "");
        }
      )
    );

    config.module.rules.push({
      test: /\.wasm$/,
      type: "webassembly/async",
    });

    return config;
  },
};

module.exports = nextConfig;






















































