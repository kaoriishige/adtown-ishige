import { NextPage } from 'next';
import Link from 'next/link';
import { useRouter } from 'next/router';

// --- カテゴリデータを「地元資本」を軸に更新 ---
const categories = [
  { 
    name: '住まい・リフォーム', 
    emoji: '🏡', 
    slug: 'housing', 
    description: '地元工務店、リフォーム' 
  },
  { 
    name: '車・バイク', 
    emoji: '🚗', 
    slug: 'automotive', 
    description: '新車・中古車販売、整備' 
  },
  { 
    name: '教育・習い事', 
    emoji: '🎓', 
    slug: 'education', 
    description: '学習塾、ピアノ、英会話' 
  },
  { 
    name: 'グルメ・カフェ', 
    emoji: '🍔', 
    slug: 'gourmet', 
    description: '地域に根差した飲食店' 
  },
  { 
    name: '美容・健康', 
    emoji: '💅', 
    slug: 'beauty-health', 
    description: '美容室、エステ、整体' 
  },
  { 
    name: '産直・専門店', 
    emoji: '🌿', 
    slug: 'local-products', 
    description: '農産物、お土産、個人商店' 
  },
  { 
    name: '宿泊・温泉', 
    emoji: '♨️', 
    slug: 'lodging-onsen', 
    description: 'ホテル、旅館、日帰り温泉' 
  },
  { 
    name: '専門サービス', 
    emoji: '🛠️', 
    slug: 'professional-services', 
    description: '修理、クリーニング、士業' 
  },
];

const DealsTopPage: NextPage = () => {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <header className="bg-white p-4 text-center sticky top-0 z-10 shadow-sm">
        <h1 className="text-2xl font-bold text-gray-800">地域のお店を応援</h1>
        <p className="text-gray-600 mt-1">カテゴリを選択してください</p>
      </header>

      <main className="p-4 max-w-4xl mx-auto">
        <div className="text-center my-4">
          <button onClick={() => router.back()} className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded-lg text-sm">
            ← メインページに戻る
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 my-8">
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