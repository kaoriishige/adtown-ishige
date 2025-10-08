import { GetServerSideProps, NextPage } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import { adminDb } from '../../../lib/firebase-admin';
import { RiStore2Line } from 'react-icons/ri';
import { ParsedUrlQuery } from 'querystring';
import type { Query, QueryDocumentSnapshot } from 'firebase-admin/firestore';

// --- 型定義 ---
interface Store {
    id: string;
    storeName: string;
    description?: string;
    mainImageUrl?: string;
}

interface PageProps {
    stores: Store[];
    category: string;
    subcategory: string;
    area: string;
}

// --- ページコンポーネント ---
const StoreListPage: NextPage<PageProps> = ({ stores, category, subcategory, area }) => {
    return (
        <div className="min-h-screen bg-gray-100">
            <Head>
                <title>{`${area}の${subcategory}一覧`}</title>
            </Head>
            <header className="bg-white shadow-sm sticky top-0 z-10">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center">
                    <Link href={`/deals/select-area?main=${encodeURIComponent(category)}&sub=${encodeURIComponent(subcategory)}`} className="text-sm text-blue-600 hover:underline">
                        ← エリア選択に戻る
                    </Link>
                </div>
            </header>
            <main className="max-w-5xl mx-auto p-4 sm:p-6 lg:p-8">
                 <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 text-center mb-8">
                    {area}の<span className="text-blue-600">{subcategory}</span>一覧
                </h1>
                {stores.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {stores.map(store => (
                            <Link key={store.id} href={`/stores/${store.id}`} className="block bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow overflow-hidden">
                                <div className="h-40 bg-gray-200 flex items-center justify-center">
                                    {store.mainImageUrl ? (
                                        <img src={store.mainImageUrl} alt={store.storeName} className="h-full w-full object-cover" />
                                    ) : (
                                        <RiStore2Line className="text-5xl text-gray-400" />
                                    )}
                                </div>
                                <div className="p-4">
                                    <h3 className="font-bold text-lg text-gray-800 truncate">{store.storeName}</h3>
                                    <p className="text-sm text-gray-600 mt-1 line-clamp-2">{store.description}</p>
                                </div>
                            </Link>
                        ))}
                    </div>
                ) : (
                    <p className="text-center text-gray-500 mt-12 bg-white p-8 rounded-lg shadow-md">この条件に一致する店舗は見つかりませんでした。</p>
                )}
            </main>
        </div>
    );
};

// --- サーバーサイドでのデータ取得 ---
interface Params extends ParsedUrlQuery {
  category: string;
  area: string;
}

export const getServerSideProps: GetServerSideProps<PageProps, Params> = async (context) => {
  const { category, area } = context.params!;
  const { sub } = context.query;
  
  const decodedCategory = decodeURIComponent(category);
  const decodedSubcategory = decodeURIComponent(sub as string);
  const decodedArea = decodeURIComponent(area);

  try {
    // Firestoreのコレクションは 'users' を参照
    let query: Query = adminDb.collection('users')
      .where('roles', 'array-contains', 'partner')
      .where('mainCategory', '==', decodedCategory);
    
    // 「その他」カテゴリ以外の場合は、サブカテゴリでも絞り込む
    if(decodedSubcategory !== 'その他') {
        query = query.where('subCategory', '==', decodedSubcategory);
    }
      
    const querySnapshot = await query.get();
    
    const stores: Store[] = [];
    querySnapshot.forEach((doc: QueryDocumentSnapshot) => {
      const data = doc.data();
      // 住所の前方一致でエリアをフィルタリング
      if (data.address && data.address.startsWith(decodedArea)) {
        stores.push({
          id: doc.id,
          storeName: data.companyName || '名称未設定',
          description: data.description || '',
          mainImageUrl: data.mainImageUrl || null,
        });
      }
    });

    return {
      props: {
        stores: JSON.parse(JSON.stringify(stores)),
        category: decodedCategory,
        subcategory: decodedSubcategory,
        area: decodedArea,
      },
    };
  } catch (error) {
    console.error("店舗データの取得に失敗:", error);
    return { props: { stores: [], category: decodedCategory, subcategory: decodedSubcategory, area: decodedArea } };
  }
};

export default StoreListPage;