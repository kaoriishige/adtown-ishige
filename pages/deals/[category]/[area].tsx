import { GetServerSideProps, NextPage } from 'next';
import Link from 'next/link';
import { useRouter } from 'next/router';

// --- ★★★ データ ★★★ ---
// 店舗データの型定義
interface StoreData {
  id: string; // idは行番号などで代用
  name: string;
  address: string;
  category: string;
  area: string;
}

// URLのslugから日本語の名前に変換するための対応表
const categoryNames: { [key: string]: string } = {
  'restaurant': '飲食店',
  'hair-salon': '美容室',
  'beauty': 'Beauty',
  'health': 'Health',
  'living': '暮らし',
  'leisure': 'レジャー',
};
const areaNames: { [key: string]: string } = {
  'nasushiobara': '那須塩原市',
  'ohtawara': '大田原市',
  'nasu': '那須町',
};

// ページが受け取るpropsの型
interface StoreListPageProps {
  stores: StoreData[];
  categoryName: string;
  areaName: string;
}

const StoreListPage: NextPage<StoreListPageProps> = ({ stores, categoryName, areaName }) => {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <header className="bg-white p-4 text-center sticky top-0 z-10 shadow-sm">
        <h1 className="text-2xl font-bold text-gray-800">{areaName}の{categoryName}一覧</h1>
      </header>

      <main className="p-4 max-w-3xl mx-auto">
        <div className="text-center my-4">
          <button onClick={() => router.back()} className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded-lg text-sm">
            ← エリア選択に戻る
          </button>
        </div>

        {/* --- 店舗一覧 --- */}
        <div className="space-y-4 my-8">
          {stores.length > 0 ? (
            stores.map((store) => (
              <Link key={store.id} href={`/store/${store.id}`} className="block p-5 bg-white rounded-lg shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                <h2 className="text-xl font-bold text-blue-600">{store.name}</h2>
                <p className="text-gray-600 mt-1">{store.address}</p>
              </Link>
            ))
          ) : (
            <div className="text-center p-8 bg-white rounded-lg shadow-md">
              <p className="text-gray-500">この条件に合う店舗はまだ登録されていません。</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

// --- ★★★ ここからが重要な変更点 ★★★ ---
export const getServerSideProps: GetServerSideProps = async (context) => {
  const { category, area } = context.params as { category: string; area: string; };

  let stores: StoreData[] = [];
  try {
    // 1. Googleスプレッドシートの公開URLを指定します
    //    必ずご自身のスプレッドシートのURLに書き換えてください
    const SPREADSHEET_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQujHRiZb1d4MKRnhqnWCk5gn8lWJjndZxidg8ZgUxgrKe6hDwviEp3bVuyxHzy0z0zlJyUqB6u0txB/pub?gid=1261367864&single=true&output=csv";
    
    // 2. スプレッドシートからデータを取得
    const response = await fetch(SPREADSHEET_URL);
    const csvText = await response.text();
    
    // 3. 取得したCSVデータを扱いやすい形に変換
    const rows = csvText.split('\n').slice(1); // ヘッダー行を除外
    const allStores = rows.map((row, index) => {
      const columns = row.split(',');
      return {
        id: String(index + 1), // 行番号をIDとして使用
        timestamp: columns[0],
        name: columns[1],
        address: columns[2],
        phone: columns[3],
        hours: columns[4],
        menu: columns[5],
        recommend: columns[6],
        coupon: columns[7],
        googleMap: columns[8],
        category: columns[9], // カテゴリのslug (例: restaurant)
        area: columns[10],     // エリアのslug (例: nasushiobara)
      };
    });

    // 4. カテゴリとエリアで、表示する店舗を絞り込む
    stores = allStores.filter(store => store.category === category && store.area === area);

  } catch (error) {
    console.error("Error fetching stores from Google Sheet:", error);
  }
  
  const categoryName = categoryNames[category] || 'お店';
  const areaName = areaNames[area] || 'エリア';

  return {
    props: {
      stores,
      categoryName,
      areaName,
    },
  };
};

export default StoreListPage;