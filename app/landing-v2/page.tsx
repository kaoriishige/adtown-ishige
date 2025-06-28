// app/landing-v2/page.tsx
'use client';

import { Gift } from 'lucide-react';

export default function LandingV2() {
  return (
    <div className="bg-white text-center py-20">
      <h1 className="text-4xl font-bold text-blue-700 mb-4">これは本番ランディングページ</h1>
      <p className="text-lg mb-6">/landing-v2 に配置された App Router 構成です。</p>
      <a href="https://lin.ee/7GKI01W" target="_blank" rel="noopener noreferrer">
        <img
          src="https://scdn.line-apps.com/n/line_add_friends/btn/ja.png"
          alt="友だち追加"
          height="36"
          className="mx-auto"
        />
      </a>
    </div>
  );
}
