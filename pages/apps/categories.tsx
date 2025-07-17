// pages/apps/categories.tsx
import Link from 'next/link';

const emotionCategories = [
  { label: '困っている', slug: 'trouble' },
  { label: 'ヒマつぶし', slug: 'killing-time' },
  { label: 'お得を探したい', slug: 'saving' },
  { label: 'つながりたい', slug: 'connection' },
  { label: '自分を知りたい', slug: 'self' },
  { label: '色んなこと知りたい', slug: 'curious' },
  { label: 'もっと学べる', slug: 'learn' },
  { label: 'スッキリしたい', slug: 'refresh' },
  { label: 'ワクワクしたい', slug: 'exciting' },
  { label: '癒やされたい', slug: 'heal' },
  { label: '誰かの役に立ちたい', slug: 'helpful' },
];

const functionCategories = [
  { label: '生活情報', slug: 'life' },
  { label: '健康支援', slug: 'health' },
  { label: '子育て', slug: 'childcare' },
  { label: 'フードロス', slug: 'foodloss' },
  { label: '診断', slug: 'diagnosis' },
  { label: '運勢', slug: 'fortune' },
  { label: '人間関係', slug: 'relationship' },
  { label: '節約・特売', slug: 'saving-sale' },
  { label: 'エンタメ', slug: 'entertainment' },
  { label: '地域活動', slug: 'community' },
  { label: '仕事・副業', slug: 'work' },
  { label: '防災・安全', slug: 'safety' },
  { label: '教育・学習', slug: 'education' },
  { label: '金融・お金管理', slug: 'finance' },
  { label: '趣味・文化', slug: 'hobby' },
  { label: 'シェア・譲渡', slug: 'sharing' },
];

export default function AppsTopPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">みんなの那須アプリ 55選</h1>

      <h2 className="text-xl font-semibold mt-8 mb-2">🎭 感情ジャンルで選ぶ</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {emotionCategories.map((cat) => (
          <Link
            key={cat.slug}
            href={`/apps/emotion/${cat.slug}`}
            className="bg-blue-100 hover:bg-blue-200 text-blue-800 text-sm px-4 py-2 rounded text-center"
          >
            {cat.label}
          </Link>
        ))}
      </div>

      <h2 className="text-xl font-semibold mt-8 mb-2">🧩 機能ジャンルで選ぶ</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {functionCategories.map((cat) => (
          <Link
            key={cat.slug}
            href={`/apps/function/${cat.slug}`}
            className="bg-green-100 hover:bg-green-200 text-green-800 text-sm px-4 py-2 rounded text-center"
          >
            {cat.label}
          </Link>
        ))}
      </div>
    </div>
  );
}

