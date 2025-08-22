import { NextPage } from 'next';
import Link from 'next/link';
import { useRouter } from 'next/router';

// --- カテゴリデータ ---
const categories = [
  { name: '飲食店', emoji: '🍔', slug: 'restaurant' },
  { name: '美容室', emoji: '💇‍♀️', slug: 'hair-salon' },
  { name: 'Beauty', emoji: '💅', slug: 'beauty', description: 'エステ, ネイル, エクステなど' },
  { name: 'Health', emoji: '🧘', slug: 'health', description: '整体, ヨガ, マッサージなど' },
  { name: '暮らし', emoji: '🏡', slug: 'living' },
  { name: 'レジャー', emoji: '🏞️', slug: 'leisure' },
];

const DealsTopPage: NextPage = () => {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <header className="bg-white p-4 text-center sticky top-0 z-10 shadow-sm">
        <h1 className="text-2xl font-bold text-gray-800">店舗のお得情報</h1>
        <p className="text-gray-600 mt-1">カテゴリを選択してください</p>
      </header>

      <main className="p-4 max-w-3xl mx-auto">
        <div className="text-center my-4">
          <button onClick={() => router.back()} className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded-lg text-sm">
            ← メインページに戻る
          </button>
        </div>

        {/* --- カテゴリ選択ボタン --- */}
        <div className="grid grid-cols-2 gap-4 my-8">
          {categories.map((category) => (
            <Link key={category.slug} href={`/deals/${category.slug}`} className="block p-6 bg-white rounded-lg shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300 text-center">
              <div className="text-5xl mb-2">{category.emoji}</div>
              <h2 className="text-xl font-bold text-gray-800">{category.name}</h2>
              {category.description && (
                <p className="text-xs text-gray-500 mt-1">{category.description}</p>
              )}
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
};

export default DealsTopPage;