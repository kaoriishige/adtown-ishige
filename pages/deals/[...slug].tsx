import { GetServerSideProps, NextPage } from 'next';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import Image from 'next/image';
import { RiMapPin2Line, RiArrowLeftSLine } from 'react-icons/ri'; 


// --- Store data type definition ---
interface Store {
  id: string;
  storeName: string;
  address: string;
  mainCategory?: string;
  subCategory?: string;
  mainImageUrl?: string;
  description: string;
}

interface StoreListPageProps {
  stores: Store[];
  mainCategory: string;
  subCategory: string;
  area: string;
}

// 修正後の Store Card Component
const StoreCard: React.FC<{ store: Store }> = ({ store }) => {
  return (
    // 💡 修正点 1: legacyBehaviorとpassHrefを削除。classNameを<Link>に直接適用。
    // <Link>の直下は単一の要素である<div>になります。
    <Link 
      href={`/stores/${store.id}`} 
      className="block bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow overflow-hidden cursor-pointer"
    >
      <div className="w-full"> 
        <div className="relative h-40 w-full">
          <Image
            src={store.mainImageUrl || '/images/placeholder.png'}
            alt={store.storeName}
            // 💡 修正点 2: layout/objectFitをfill/styleに置き換え、Next.js 13+の推奨に対応。
            fill 
            sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, 33vw"
            style={{ objectFit: "cover" }}
            onError={(e) => { (e.target as HTMLImageElement).src = '/images/placeholder.png'; }}
          />
        </div>
        <div className="p-4">
          <h3 className="font-bold text-lg text-gray-800">{store.storeName}</h3>
          <p className="text-sm text-gray-500 flex items-center mt-1">
            <RiMapPin2Line className="mr-1" />
            {store.address}
          </p>
          <p className="text-sm text-gray-600 mt-2 line-clamp-2">
            {store.description?.split('\n')[0] || ''}
          </p>
        </div>
      </div>
    </Link>
  );
};

// --- ページコンポーネント ---
const StoreListPage: NextPage<StoreListPageProps> = ({ stores, mainCategory, subCategory, area }) => {
  const router = useRouter();
  
  const title = `${area}の${subCategory}一覧`;

  return (
    <div className="bg-gray-100 min-h-screen">
      <Head>
        <title>{`${title} - みんなの那須アプリ`}</title>
      </Head>

      <div className="max-w-4xl mx-auto bg-white min-h-screen">
        <header className="p-4 border-b sticky top-0 bg-white z-10">
          <div className="flex items-center">
            <button onClick={() => router.back()} className="p-2 rounded-full hover:bg-gray-100 mr-2">
              <RiArrowLeftSLine size={24} />
            </button>
            <div>
              <h1 className="text-xl font-bold">{title}</h1>
              <p className="text-xs text-gray-500">{`カテゴリ: ${mainCategory} > ${subCategory}`}</p>
            </div>
          </div>
        </header>

        <main className="p-4">
          {stores.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {stores.map(store => (
                <StoreCard key={store.id} store={store} />
              ))}
            </div>
          ) : (
            <div className="text-center py-10 px-4 bg-gray-50 rounded-lg">
              <p className="text-gray-600">この条件に一致する店舗は見つかりませんでした。</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

// --- サーバーサイドデータ取得 ---
export const getServerSideProps: GetServerSideProps = async (context) => {
  const { slug, sub} = context.query;
  console.log("--- ページ処理開始([...slug].tsx) ---");

  if (!Array.isArray(slug) || slug.length < 2) {
    return { notFound: true };
  }
  const [mainCategory, area] = slug;

  const subCategory = Array.isArray(sub) ? sub[0] : sub || ''; 

  try {
    // ローカル環境とVercel環境でURLを切り替える設定を維持
    const baseUrl = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : 'http://localhost:3000';
      
    const params = new URLSearchParams({
      main: mainCategory,
      sub: subCategory as string,
      area: area,
    });
    
    const apiUrl = `${baseUrl}/api/stores?${params.toString()}`;
    console.log(`[PAGE-DEBUG] APIを呼び出します: ${apiUrl}`);

    const res = await fetch(apiUrl);

    if (!res.ok) {
      console.error(`[PAGE-ERROR] APIからの応答が異常です: ${res.status} ${res.statusText}`);
      const errorText = await res.text();
      console.error(`[PAGE-ERROR] エラー内容: ${errorText}`);
      throw new Error('Failed to fetch stores');
    }

    const stores = await res.json() as Store[]; 
    console.log(`[PAGE-DEBUG] APIから ${stores.length} 件の店舗データを取得しました。`);

    return {
      props: {
        stores,
        mainCategory,
        subCategory,
        area,
      },
    };
  } catch (error: any) { 
    console.error("[PAGE-ERROR] getServerSideProps でAPIの呼び出しに失敗しました:", error.message);
    
    // エラー発生時もページ情報自体は props として返す（店舗リストは空）
    return {
      props: {
        stores: [],
        mainCategory,
        subCategory,
        area,
      },
    };
  }
};

export default StoreListPage;