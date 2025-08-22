import { GetServerSideProps, NextPage } from 'next';
import Link from 'next/link';
import { useRouter } from 'next/router';

// --- ★★★ データ ★★★ ---
// 表示するエリアのデータ
const areas = [
  { name: '那須塩原市', slug: 'nasushiobara' },
  { name: '大田原市', slug: 'ohtawara' },
  { name: '那須町', slug: 'nasu' },
];

// URLのslugから日本語のカテゴリ名に変換するための対応表
const categoryNames: { [key: string]: string } = {
  'restaurant': '飲食店',
  'hair-salon': '美容室',
  'beauty': 'Beauty',
  'health': 'Health',
  'living': '暮らし',
  'leisure': 'レジャー',
};

// ページが受け取るpropsの型
interface AreaSelectPageProps {
  categorySlug: string;
  categoryName: string;
}

const AreaSelectPage: NextPage<AreaSelectPageProps> = ({ categorySlug, categoryName }) => {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <header className="bg-white p-4 text-center sticky top-0 z-10 shadow-sm">
        <h1 className="text-2xl font-bold text-gray-800">{categoryName}のお店を探す</h1>
        <p className="text-gray-600 mt-1">エリアを選択してください</p>
      </header>

      <main className="p-4 max-w-3xl mx-auto">
        <div className="text-center my-4">
          <button onClick={() => router.back()} className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded-lg text-sm">
            ← カテゴリ選択に戻る
          </button>
        </div>

        {/* --- エリア選択ボタン --- */}
        <div className="flex flex-col items-center gap-4 my-8">
          {areas.map((area) => (
            <Link key={area.slug} href={`/deals/${categorySlug}/${area.slug}`} className="block w-full max-w-sm p-4 bg-white rounded-lg shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300 text-center">
              <h2 className="text-xl font-bold text-gray-800">{area.name}</h2>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
};

export const getServerSideProps: GetServerSideProps = async (context) => {
  const categorySlug = context.params?.category as string || '';
  const categoryName = categoryNames[categorySlug] || 'お店'; // 対応表にない場合は「お店」と表示

  return {
    props: {
      categorySlug,
      categoryName,
    },
  };
};

export default AreaSelectPage;