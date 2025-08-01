import { GetStaticProps, NextPage } from 'next';
import Head from 'next/head';
import { adminDb } from '../lib/firebase-admin'; // あなたのfirebase-admin初期化ファイルのパス
import { Timestamp } from 'firebase-admin/firestore'; // Timestampの型をインポート

// ページに渡されるdealデータの型定義
// 日付はJSONに変換可能な `string` 型にしておきます
interface Deal {
  id: string;
  productName: string;
  price: number;
  shopName: string;
  // 他にもフィールドがあればここに追加
  updatedAt: string; // 日付は文字列として扱う
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
  try {
    const dealsRef = adminDb.collection('deals');
    const querySnapshot = await dealsRef.orderBy('updatedAt', 'desc').get();

    const deals = querySnapshot.docs.map(doc => {
      const data = doc.data();

      // エラーの原因だったFirestoreのTimestampオブジェクトを、
      // Next.jsが理解できるISO形式の文字列に変換します。
      const dealData: { [key: string]: any } = {
        id: doc.id,
      };

      for (const key in data) {
        const value = data[key];
        // 値がTimestampオブジェクトであれば文字列に変換、そうでなければそのまま使う
        if (value instanceof Timestamp) {
          dealData[key] = value.toDate().toISOString();
        } else {
          dealData[key] = value;
        }
      }
      
      return dealData;
    });

    return {
      props: {
        deals,
      },
      // 60秒ごとにページを再生成（ISR）
      revalidate: 60, 
    };
  } catch (error) {
    console.error("Error fetching deals for getStaticProps:", error);
    return {
      // エラーが発生した場合は、空の配列を返す
      props: {
        deals: [],
      },
    };
  }
};

export default DealsPage;