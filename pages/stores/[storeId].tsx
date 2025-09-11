import { GetServerSideProps, NextPage } from 'next';
import { getAdminDb } from '@/lib/firebase-admin';
import Head from 'next/head';

// --- 型定義 ---
interface Store {
  id: string;
  storeName: string;
  address: string;
  phoneNumber: string;
  description: string;
  businessHours: string;
  websiteUrl?: string;
  photoUrls?: string[];
}

interface StoreDetailPageProps {
  store: Store | null;
}

// --- ページコンポーネント ---
const StoreDetailPage: NextPage<StoreDetailPageProps> = ({ store }) => {

  if (!store) {
    return <div>店舗が見つかりませんでした。</div>;
  }

  return (
    <>
      <Head>
        <title>{store.storeName} | みんなの那須アプリ</title>
        <meta name="description" content={store.description} />
      </Head>

      <div className="max-w-4xl mx-auto p-4 md:p-8">
        {/* 画像ギャラリー */}
        {store.photoUrls && store.photoUrls.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            {store.photoUrls.map(url => (
              <div key={url} className="aspect-w-16 aspect-h-9 rounded-lg overflow-hidden">
                <img src={url} alt={store.storeName} className="w-full h-full object-cover" />
              </div>
            ))}
          </div>
        )}

        <div className="bg-white p-8 rounded-xl shadow-lg">
          {/* 店舗名 */}
          <h1 className="text-4xl font-bold text-gray-800 mb-4">{store.storeName}</h1>

          {/* 基本情報 */}
          <div className="space-y-4 text-lg text-gray-700">
            <p><strong>住所:</strong> {store.address}</p>
            <p><strong>電話番号:</strong> {store.phoneNumber}</p>
            <p><strong>営業時間:</strong> {store.businessHours}</p>
            {store.websiteUrl && (
              <p>
                <strong>ウェブサイト:</strong> 
                <a href={store.websiteUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline ml-2">
                  サイトを見る
                </a>
              </p>
            )}
          </div>

          {/* 店舗紹介文 */}
          <div className="mt-8 pt-6 border-t">
            <h2 className="text-2xl font-bold mb-3">店舗紹介</h2>
            <p className="text-gray-600 whitespace-pre-wrap">{store.description}</p>
          </div>
        </div>
      </div>
    </>
  );
};

// --- サーバーサイドでのデータ取得 ---
export const getServerSideProps: GetServerSideProps = async (context) => {
  try {
    const { storeId } = context.params as { storeId: string };

    const db = getAdminDb();
    const storeDocRef = db.collection('stores').doc(storeId);
    const docSnap = await storeDocRef.get();

    if (!docSnap.exists) {
      return { notFound: true }; // データが見つからなければ404ページを表示
    }

    const data = docSnap.data();
    // タイムスタンプを文字列に変換
    const storeData = JSON.parse(JSON.stringify({ id: docSnap.id, ...data }));

    return {
      props: {
        store: storeData,
      },
    };

  } catch (error) {
    console.error("店舗詳細の取得に失敗:", error);
    return { notFound: true }; // エラー時も404ページ
  }
};

export default StoreDetailPage;