import { GetServerSideProps, NextPage } from 'next';
import Link from 'next/link';
import Head from 'next/head';

// フードロス情報の型定義
interface FoodLossItem {
  timestamp: string;
  storeName: string;
  address: string;
  area: 'nasushiobara' | 'otawara' | 'nasu'; // エリアを限定
  item: string;
  price: number;
  originalPrice: number;
  quantity: number;
  notes: string;
}

// ページのPropsの型定義
interface FoodLossPageProps {
  area: string;
  items: FoodLossItem[];
  error?: string;
}

// エリア名の日本語変換マップ
const areaNames: { [key: string]: string } = {
  nasushiobara: '那須塩原市',
  otawara: '大田原市',
  nasu: '那須町',
};

const FoodLossPage: NextPage<FoodLossPageProps> = ({ area, items, error }) => {
  const areaName = areaNames[area] || '指定エリア';

  return (
    <>
      <Head>
        <title>フードロス情報 - {areaName}</title>
      </Head>
      <div className="min-h-screen bg-gray-50 p-4 md:p-8">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-green-700">フードロス情報</h1>
          <p className="text-2xl text-gray-600 mt-2">{areaName}</p>
          <Link href="/food-loss" className="text-blue-600 hover:underline mt-4 inline-block">
            &larr; エリア選択に戻る
          </Link>
        </header>

        <main className="max-w-4xl mx-auto">
          {error && <p className="text-red-500 text-center bg-red-100 p-4 rounded-lg">{error}</p>}
          
          {!error && items.length === 0 && (
            <p className="text-center text-gray-500 text-lg mt-10">現在、このエリアのフードロス情報はありません。</p>
          )}

          <div className="space-y-6">
            {items.map((item, index) => (
              <div key={index} className="bg-white p-6 rounded-lg shadow-md border-l-4 border-green-500 transition transform hover:scale-105">
                <h2 className="text-2xl font-bold text-gray-800">{item.storeName}</h2>
                <p className="text-gray-500 text-sm mb-4">{item.address}</p>
                <div className="bg-green-50 p-4 rounded-lg">
                  <p className="text-xl font-semibold text-green-800">{item.item}</p>
                  <div className="flex items-baseline space-x-2 mt-2">
                    <span className="text-3xl font-bold text-red-600">{item.price.toLocaleString()}円</span>
                    <span className="text-gray-500 line-through">{item.originalPrice.toLocaleString()}円</span>
                  </div>
                  <p className="text-gray-700 mt-2">残り: {item.quantity}個</p>
                  {item.notes && <p className="text-sm text-gray-600 mt-2">備考: {item.notes}</p>}
                </div>
              </div>
            ))}
          </div>
        </main>
      </div>
    </>
  );
};

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { area } = context.params!;
  const validAreas = ['nasushiobara', 'otawara', 'nasu'];

  if (typeof area !== 'string' || !validAreas.includes(area)) {
    return { notFound: true }; // 無効なエリアの場合は404ページを表示
  }

  try {
    // Google Apps ScriptでデプロイしたAPIのURLを環境変数から取得
    const API_URL = process.env.GOOGLE_SHEET_API_URL;
    if (!API_URL) {
      throw new Error('GOOGLE_SHEET_API_URL is not defined in environment variables.');
    }

    const res = await fetch(API_URL);
    if (!res.ok) {
      throw new Error(`Failed to fetch data from Google Sheet API. Status: ${res.status}`);
    }
    const allItems: FoodLossItem[] = await res.json();

    // URLで指定されたエリアの情報のみフィルタリング
    const items = allItems.filter(item => item.area === area);

    return {
      props: {
        area,
        items,
      },
    };
  } catch (error: any) {
    console.error("Error in getServerSideProps for food-loss:", error.message);
    return {
      props: {
        area,
        items: [],
        error: '情報の取得に失敗しました。時間をおいて再度お試しください。',
      },
    };
  }
};

export default FoodLossPage;