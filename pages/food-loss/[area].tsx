import { GetServerSideProps, NextPage } from 'next';
import Link from 'next/link';
import Head from 'next/head';
import { getAdminDb } from '@/lib/firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';

// --- 型定義 ---
interface Deal {
  id: string;
  storeName: string;
  address: string;
  item: string;
  price: number;
  originalPrice: number;
  quantity: number;
  sellTime: string;
  notes: string;
}

interface FoodLossPageProps {
  area: string;
  deals: Deal[];
  error?: string;
}

const areaNames: { [key: string]: string } = {
  nasushiobara: '那須塩原市',
  otawara: '大田原市',
  nasu: '那須町',
};

// --- ページコンポーネント ---
const FoodLossPage: NextPage<FoodLossPageProps> = ({ area, deals, error }) => {
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
          
          {!error && deals.length === 0 && (
            <p className="text-center text-gray-500 text-lg mt-10">現在、このエリアのフードロス情報はありません。</p>
          )}

          <div className="space-y-6">
            {deals.map((deal) => (
              <div key={deal.id} className="bg-white p-6 rounded-lg shadow-md border-l-4 border-green-500">
                <h2 className="text-2xl font-bold text-gray-800">{deal.storeName}</h2>
                <p className="text-gray-500 text-sm mb-4">{deal.address}</p>
                <div className="bg-green-50 p-4 rounded-lg">
                  <p className="text-xl font-semibold text-green-800">{deal.item}</p>
                  <div className="flex items-baseline space-x-2 mt-2">
                    <span className="text-3xl font-bold text-red-600">{deal.price.toLocaleString()}円</span>
                    {deal.originalPrice > 0 && <span className="text-gray-500 line-through">{deal.originalPrice.toLocaleString()}円</span>}
                  </div>
                  <p className="text-gray-700 mt-2">残り: {deal.quantity}個</p>
                  {deal.sellTime && <p className="text-sm text-gray-600 mt-2">販売時間: {deal.sellTime}</p>}
                  {deal.notes && <p className="text-sm text-gray-600 mt-2">備考: {deal.notes}</p>}
                </div>
              </div>
            ))}
          </div>
        </main>
      </div>
    </>
  );
};

// --- サーバーサイドでデータを取得 ---
export const getServerSideProps: GetServerSideProps = async (context) => {
  const { area } = context.params!;
  const validAreas = ['nasushiobara', 'otawara', 'nasu'];

  if (typeof area !== 'string' || !validAreas.includes(area)) {
    return { notFound: true };
  }

  try {
    const snapshot = await getAdminDb().collection('foodLossDeals')
      .where('area', '==', area)
      .where('isActive', '==', true) // **完売していない情報のみ取得**
      .orderBy('createdAt', 'desc')
      .get();
      
    const deals = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        storeName: data.storeName,
        address: data.address,
        item: data.item,
        price: data.price,
        originalPrice: data.originalPrice,
        quantity: data.quantity,
        sellTime: data.sellTime,
        notes: data.notes,
      };
    });

    return { props: { area, deals: JSON.parse(JSON.stringify(deals)) } };
  } catch (error: any) {
    console.error("Error fetching food loss deals:", error.message);
    return {
      props: {
        area,
        deals: [],
        error: '情報の取得に失敗しました。',
      },
    };
  }
};

export default FoodLossPage;