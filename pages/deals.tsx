import { GetStaticProps, NextPage } from 'next';
import Head from 'next/head';
import { getAdminDb } from '../lib/firebase-admin'; // ★ 修正点1: getAdminDbをインポート
import { Timestamp } from 'firebase-admin/firestore';

// 型定義
interface Deal {
  id: string;
  productName: string;
  price: number;
  shopName: string;
  updatedAt: string;
}

interface DealsPageProps {
  deals: Deal[];
}

// ページコンポーネント
const DealsPage: NextPage<DealsPageProps> = ({ deals }) => {
  return (
    <div className="bg-gray-100 min-h-screen">
      <Head>
        <title>特売情報一覧</title>
      </Head>
      <main className="max-w-4xl mx-auto py-8 px-4">
        <h1 className="text-4xl font-bold text-center mb-8">特売情報一覧</h1>
        <div className="space-y-4">
          {deals.map((deal) => (
            <div key={deal.id} className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-2xl font-semibold text-gray-800">{deal.productName}</h2>
              <p className="text-lg text-blue-600">{deal.price}円</p>
              <p className="text-md text-gray-600">{deal.shopName}</p>
              <p className="text-sm text-gray-400 mt-2">
                最終更新: {new Date(deal.updatedAt).toLocaleString('ja-JP')}
              </p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
};

// データ取得
export const getStaticProps: GetStaticProps = async () => {
  // ★ 修正点2: 関数を呼び出してDBインスタンスを取得
  const adminDb = getAdminDb();

  if (!adminDb) {
    console.error("Firebase Admin on DealsPage failed to initialize.");
    return { props: { deals: [] } };
  }

  try {
    const dealsRef = adminDb.collection('deals');
    const querySnapshot = await dealsRef.orderBy('createdAt', 'desc').get(); // orderByをcreatedAtに変更

    const deals = querySnapshot.docs.map(doc => {
      const data = doc.data();
      const createdAtTimestamp = data.createdAt as Timestamp; // createdAtをTimestampとして扱う
      return {
        id: doc.id,
        productName: data.productName || '商品名なし',
        price: data.price || 0,
        shopName: data.shopName || '店舗名なし',
        updatedAt: createdAtTimestamp.toDate().toISOString(), // createdAtをupdatedAtとして使用
      };
    });

    return {
      props: {
        deals,
      },
      revalidate: 60, // 60秒ごとにデータを再検証
    };
  } catch (error) {
    console.error("Error fetching deals for getStaticProps:", error);
    return {
      props: {
        deals: [],
      },
    };
  }
};

export default DealsPage;