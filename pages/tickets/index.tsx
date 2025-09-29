import { NextPage, GetServerSideProps } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import { adminDb } from '../../lib/firebase-admin';

// 型定義
interface Deal {
  id: string;
  title: string;
  description: string;
  price: number;
  originalPrice?: number;
  storeName: string;
  type: 'future-ticket' | 'food-loss' | 'donation';
}

interface TicketsPageProps {
  deals: Deal[];
}

const TicketsPage: NextPage<TicketsPageProps> = ({ deals }) => {
  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'future-ticket': return { label: '未来のチケット', bg: 'bg-blue-100', text: 'text-blue-800' };
      case 'food-loss': return { label: 'フードロス削減', bg: 'bg-green-100', text: 'text-green-800' };
      case 'donation': return { label: '子ども食堂支援', bg: 'bg-pink-100', text: 'text-pink-800' };
      default: return { label: 'お知らせ', bg: 'bg-gray-100', text: 'text-gray-800' };
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Head>
        <title>未来のチケット＆お得情報 - なっぴー</title>
      </Head>
      <div className="max-w-3xl mx-auto p-4 pt-10">
        <h1 className="text-3xl font-bold text-center mb-2">未来のチケット</h1>
        <p className="text-center text-gray-600 mb-8">特別な体験や、フードロス削減のお得情報を見つけよう！</p>
        
        {deals.length > 0 ? (
          <div className="space-y-4">
            {deals.map((deal) => {
              const typeStyle = getTypeLabel(deal.type);
              return (
                <Link href={`/tickets/${deal.id}`} key={deal.id} className="block bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
                  <div className="flex justify-between items-start">
                    <h2 className="text-2xl font-bold mb-2">{deal.title}</h2>
                    <span className={`text-xs font-semibold px-2 py-1 rounded-full ${typeStyle.bg} ${typeStyle.text}`}>
                      {typeStyle.label}
                    </span>
                  </div>
                  <p className="text-gray-500 text-sm mb-3">{deal.storeName}</p>
                  <p className="text-gray-700 mb-4">{deal.description}</p>
                  <div className="text-right">
                    {deal.originalPrice && (
                      <span className="text-gray-500 line-through mr-2">{deal.originalPrice.toLocaleString()}円</span>
                    )}
                    <span className="text-2xl font-bold text-blue-600">{deal.price.toLocaleString()}</span>
                    <span className="font-bold"> P</span>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <p className="text-center text-gray-500">現在、利用可能なチケットはありません。</p>
        )}
      </div>
    </div>
  );
};

// サーバーサイドでデータを事前に取得
export const getServerSideProps: GetServerSideProps = async () => {
  const db = adminDb;
  const snapshot = await db.collection('deals').where('isActive', '==', true).orderBy('createdAt', 'desc').get();
  
  const deals = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        title: data.title || '',
        description: data.description || '',
        price: data.price || 0,
        originalPrice: data.originalPrice || null,
        storeName: data.storeName || '',
        type: data.type || 'future-ticket',
      };
  });

  return {
    props: {
      deals: JSON.parse(JSON.stringify(deals)),
    },
  };
};

export default TicketsPage;