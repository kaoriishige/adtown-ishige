import { GetServerSideProps, NextPage } from 'next';
import Link from 'next/link';
import nookies from 'nookies';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { useState } from 'react';
import { Timestamp } from 'firebase-admin/firestore';

interface Deal {
  id: string;
  item: string;
  price: number;
  quantity: number;
  createdAt: string;
}

interface ManageDealsPageProps {
  initialDeals: Deal[];
}

const ManageDealsPage: NextPage<ManageDealsPageProps> = ({ initialDeals }) => {
  const [deals, setDeals] = useState(initialDeals);
  const [message, setMessage] = useState<string | null>(null);

  const handleEndDeal = async (dealId: string) => {
    if (!confirm('この情報の掲載を終了しますか？（売り切れなど）')) return;
    try {
      const response = await fetch(`/api/partner/end-deal`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dealId }),
      });
      if (!response.ok) throw new Error('終了処理に失敗しました。');
      
      setDeals(deals.filter(d => d.id !== dealId));
      setMessage('掲載を終了しました。');
      setTimeout(() => setMessage(null), 3000);
    } catch (error: any) {
      alert(error.message);
    }
  };

  return (
    <div className="p-5 max-w-4xl mx-auto">
      <Link href="/partner/dashboard" className="text-blue-500 hover:underline">
        ← ダッシュボードに戻る
      </Link>
      <h1 className="text-3xl font-bold my-6 text-center">掲載情報の管理</h1>
      
      {message && (
        <div className="bg-green-100 text-green-800 p-3 rounded text-center mb-4">
          {message}
        </div>
      )}

      <div className="bg-white shadow-md rounded-lg p-4">
        {deals.length === 0 ? (
          <p className="text-center text-gray-500 py-8">現在、掲載中の情報はありません。</p>
        ) : (
          <ul className="divide-y">
            {deals.map(deal => (
              <li key={deal.id} className="p-4 flex justify-between items-center">
                <div>
                  <p className="font-bold text-lg">{deal.item}</p>
                  <p className="text-sm text-gray-600">{deal.price.toLocaleString()}円 - 残り{deal.quantity}個</p>
                  <p className="text-xs text-gray-400">登録日時: {deal.createdAt}</p>
                </div>
                <button 
                  onClick={() => handleEndDeal(deal.id)}
                  className="bg-red-500 text-white font-bold py-1 px-3 rounded text-sm hover:bg-red-600"
                >
                  終了
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export const getServerSideProps: GetServerSideProps = async (context) => {
  try {
    const cookies = nookies.get(context);
    const token = await adminAuth.verifySessionCookie(cookies.token, true);
    const { uid } = token;

    // ▼▼▼【重要】ここが修正点です ▼▼▼
    // ログイン情報ではなく、データベースを直接確認して役割をチェックします。
    const userDoc = await adminDb.collection('users').doc(uid).get();
    if (!userDoc.exists || userDoc.data()?.role !== 'partner') {
        return { redirect: { destination: '/partner/login', permanent: false } };
    }

    const snapshot = await adminDb.collection('foodLossDeals')
      .where('partnerUid', '==', uid)
      .where('isActive', '==', true)
      .orderBy('createdAt', 'desc')
      .get();
      
    const deals = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        item: data.item,
        price: data.price,
        quantity: data.quantity,
        createdAt: (data.createdAt as Timestamp).toDate().toLocaleString('ja-JP'),
      }
    });

    return { props: { initialDeals: JSON.parse(JSON.stringify(deals)) } };
  } catch (err) {
    return { redirect: { destination: '/partner/login', permanent: false } };
  }
};

export default ManageDealsPage;
