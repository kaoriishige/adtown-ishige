import { GetServerSideProps, NextPage } from 'next';
import Link from 'next/link';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../../lib/firebase'; // TODO: パスを確認
import { ParsedUrlQuery } from 'querystring';

// --- 型定義 ---
interface Store {
  id: string;
  storeName: string;
  description?: string;
  photoUrls?: string[];
  area: string;
}

interface PageProps {
  stores: Store[];
  category: string;
  subcategory: string;
}

// --- ページコンポーネント ---
const SearchResultsPage: NextPage<PageProps> = ({ stores, category, subcategory }) => {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <p className="text-sm text-gray-500">{category}</p>
        <h1 className="text-3xl font-bold">{subcategory}</h1>
        <p className="mt-2">{stores.length}件のお店が見つかりました</p>
      </div>

      {stores.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {stores.map((store) => (
            <Link href={`/store/${store.id}`} key={store.id}>
              <a className="block border rounded-lg overflow-hidden shadow-sm hover:shadow-lg transition-shadow duration-300">
                <div className="h-48 bg-gray-200">
                  {store.photoUrls && store.photoUrls.length > 0 && (
                    <img src={store.photoUrls[0]} alt={store.storeName} className="w-full h-full object-cover" />
                  )}
                </div>
                <div className="p-4">
                  <h2 className="text-xl font-semibold truncate">{store.storeName}</h2>
                  <p className="text-gray-600 mt-2 text-sm h-20 overflow-hidden">{store.description}</p>
                  <span className="text-xs inline-block bg-gray-200 rounded-full px-2 py-1 mt-2">{store.area}</span>
                </div>
              </a>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-20">
          <p>この条件に合う店舗は見つかりませんでした。</p>
        </div>
      )}
    </div>
  );
};

// --- サーバーサイドでのデータ取得 ---
interface Params extends ParsedUrlQuery {
  category: string;
  subcategory: string;
}

export const getServerSideProps: GetServerSideProps<PageProps, Params> = async (context) => {
  const { category, subcategory } = context.params!;
  
  const decodedCategory = decodeURIComponent(category);
  const decodedSubcategory = decodeURIComponent(subcategory);

  try {
    const storesRef = collection(db, 'stores');
    const q = query(
      storesRef,
      where('status', '==', 'approved'), // 承認済みの店舗のみ
      where('category.main', '==', decodedCategory),
      where('category.sub', '==', decodedSubcategory)
    );

    const querySnapshot = await getDocs(q);
    const stores = querySnapshot.docs.map(doc => ({
      id: doc.id,
      storeName: doc.data().storeName || '',
      description: doc.data().description || '',
      photoUrls: doc.data().photoUrls || [],
      area: doc.data().area || '',
    }));

    return {
      props: {
        stores,
        category: decodedCategory,
        subcategory: decodedSubcategory,
      },
    };
  } catch (error) {
    console.error("店舗データの取得に失敗:", error);
    return { props: { stores: [], category: decodedCategory, subcategory: decodedSubcategory } };
  }
};

export default SearchResultsPage;