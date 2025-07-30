import { GetStaticProps, NextPage } from 'next';
import Link from 'next/link';
import Image from 'next/image';
// ▼▼▼ Firestoreの型をインポート（ビルドに影響しない安全なインポートです） ▼▼▼
import type { QueryDocumentSnapshot } from 'firebase-admin/firestore';

// チラシ情報の型定義
interface Deal {
  id: string;
  shopName: string; // スーパー名
  imageUrl: string; // チラシ画像のURL
  period?: string;   // セール期間など
}

// ページが受け取るpropsの型
interface DealsPageProps {
  deals: Deal[];
}

const DealsPage: NextPage<DealsPageProps> = ({ deals }) => {
  return (
    <div className="bg-gray-50 min-h-screen">
      <header className="text-center py-8">
        <h1 className="text-4xl font-bold text-gray-800">店舗お得情報</h1>
        <p className="text-gray-600 mt-2">各店舗の最新チラシをチェック！</p>
        <Link href="/home" className="text-blue-500 hover:underline mt-4 inline-block">
          ← アプリ一覧に戻る
        </Link>
      </header>
      <main className="container mx-auto p-4 md-p-8">
        <div className="grid grid-cols-1 sm-grid-cols-2 lg-grid-cols-3 gap-6">
          {deals.length > 0 ? (
            deals.map(deal => (
              <div key={deal.id} className="bg-white rounded-lg border border-gray-200 shadow-md overflow-hidden hover-shadow-xl transition-shadow">
                <div className="relative w-full h-56">
                  <Image
                    src={deal.imageUrl}
                    alt={`${deal.shopName}のチラシ`}
                    layout="fill"
                    objectFit="cover"
                  />
                </div>
                <div className="p-5">
                  <h2 className="text-2xl font-bold text-gray-900">{deal.shopName}</h2>
                  {deal.period && <p className="text-gray-600 mt-2">期間: {deal.period}</p>}
                </div>
              </div>
            ))
          ) : (
            <p className="col-span-full text-center text-gray-500">現在、お得情報はありません。</p>
          )}
        </div>
      </main>
    </div>
  );
};

// ページ表示前にサーバー側でデータを取得する
export const getStaticProps: GetStaticProps = async () => {
  const admin = require('../lib/firebase-admin').default;
  const db = admin.firestore();
  
  try {
    const dealsSnapshot = await db.collection('deals').orderBy('shopName').get();
    
    // ▼▼▼ docに型を指定 ▼▼▼
    const deals = dealsSnapshot.docs.map((doc: QueryDocumentSnapshot) => ({
      id: doc.id,
      ...doc.data(),
    })) as Deal[];

    return {
      props: {
        deals,
      },
      revalidate: 3600, // 1時間ごとにデータを再取得
    };
  } catch (error) {
    console.error("Failed to fetch deals:", error);
    return { props: { deals: [] } }; // エラー時は空の配列を渡す
  }
};

export default DealsPage;