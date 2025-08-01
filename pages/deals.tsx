import { GetStaticProps, NextPage } from 'next';
import Head from 'next/head';
import { getAdminDb } from '../lib/firebase-admin'; // 関数をインポート
import { Timestamp } from 'firebase-admin/firestore';

// Dealデータの型定義
interface Deal {
  id: string;
  productName: string;
  price: number;
  shopName: string;
  updatedAt: string; // JSONで渡せるように文字列型に
  // 必要に応じて他のフィールドも追加
}

interface DealsPageProps {
  deals: Deal[];
}

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

export const getStaticProps: GetStaticProps = async () => {
  // ★★★ ここから修正 ★★★
  const adminDb = getAdminDb(); // 関数を呼び出してDBインスタンスを取得

  // adminDbが取得できなかった場合（初期化失敗時）は、エラーを返して処理を中断
  if (!adminDb) {
    console.error("Firebase Admin on DealsPage failed to initialize.");
    return { props: { deals: [] } };
  }
  // ★★★ ここまで修正 ★★★

  try {
    const dealsRef = adminDb.collection('deals');
    const querySnapshot = await dealsRef.orderBy('updatedAt', 'desc').get();

    const deals = querySnapshot.docs.map(doc => {
      const data = doc.data();
      const dealData: { [key: string]: any } = { id: doc.id };

      for (const key in data) {
        const value = data[key];
        // TimestampオブジェクトはISO文字列に変換、それ以外はそのまま
        if (value instanceof Timestamp) {
          dealData[key] = value.toDate().toISOString();
        } else {
          dealData[key] = value;
        }
      }
      // 型アサーションでDeal型に変換
      return dealData as Deal;
    });

    return {
      props: {
        deals,
      },
      revalidate: 60, // 60秒ごとにページを再生成
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