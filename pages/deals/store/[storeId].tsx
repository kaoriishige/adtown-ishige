import { GetServerSideProps, NextPage } from 'next';
import { useRouter } from 'next/router';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../../lib/firebase'; // パスは環境に合わせて調整してください

// --- ★★★ データ ★★★ ---
// 店舗データの型定義
interface StoreDetails {
  id: string;
  name: string;
  address: string;
  phone: string;
  hours: string;
  menu: string;
  recommend: string;
  coupon: string;
  googleMap: string;
}

// ページが受け取るpropsの型
interface StoreDetailPageProps {
  store: StoreDetails;
}

const StoreDetailPage: NextPage<StoreDetailPageProps> = ({ store }) => {
  const router = useRouter();

  // 改行を<br>タグに変換するヘルパー関数
  const formatText = (text: string) => {
    return text.split('\n').map((line, index) => (
      <span key={index}>{line}<br /></span>
    ));
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <header className="bg-white p-4 sticky top-0 z-10 shadow-sm">
        <h1 className="text-2xl font-bold text-gray-800 text-center">{store.name}</h1>
      </header>

      <main className="p-4 max-w-3xl mx-auto">
        <div className="my-4">
          <button onClick={() => router.back()} className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded-lg text-sm">
            ← 一覧に戻る
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {/* 各セクション */}
          <div className="p-5 border-b">
            <h2 className="text-lg font-semibold text-gray-800">住所</h2>
            <p className="text-gray-600 mt-1">{store.address}</p>
          </div>
          <div className="p-5 border-b">
            <h2 className="text-lg font-semibold text-gray-800">電話番号</h2>
            <a href={`tel:${store.phone}`} className="text-blue-600 hover:underline">{store.phone}</a>
          </div>
          <div className="p-5 border-b">
            <h2 className="text-lg font-semibold text-gray-800">営業時間</h2>
            <p className="text-gray-600 mt-1">{formatText(store.hours)}</p>
          </div>
          <div className="p-5 border-b">
            <h2 className="text-lg font-semibold text-gray-800">メニュー</h2>
            <p className="text-gray-600 mt-1 whitespace-pre-wrap">{formatText(store.menu)}</p>
          </div>
          <div className="p-5 border-b">
            <h2 className="text-lg font-semibold text-gray-800">お店のおすすめ</h2>
            <p className="text-gray-600 mt-1 whitespace-pre-wrap">{formatText(store.recommend)}</p>
          </div>
          {store.coupon && (
            <div className="p-5 border-b bg-yellow-50">
              <h2 className="text-lg font-semibold text-yellow-800">クーポン情報 🎟️</h2>
              <p className="text-gray-800 mt-1 font-bold">{store.coupon}</p>
            </div>
          )}
          {store.googleMap && (
            <div className="p-5">
              <h2 className="text-lg font-semibold text-gray-800 mb-2">地図</h2>
              <div className="aspect-w-16 aspect-h-9">
                <iframe
                  src={store.googleMap}
                  width="100%"
                  height="450"
                  style={{ border: 0 }}
                  allowFullScreen={false}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                ></iframe>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { storeId } = context.params as { storeId: string };

  try {
    const storeRef = doc(db, 'stores', storeId);
    const docSnap = await getDoc(storeRef);

    if (!docSnap.exists()) {
      return { notFound: true };
    }

    const data = docSnap.data();
    const store = {
      id: docSnap.id,
      name: data.name || '',
      address: data.address || '',
      phone: data.phone || '',
      hours: data.hours || '',
      menu: data.menu || '',
      recommend: data.recommend || '',
      coupon: data.coupon || '',
      googleMap: data.googleMap || '',
    };

    return {
      props: {
        store,
      },
    };
  } catch (error) {
    console.error("Error fetching store details:", error);
    return { notFound: true };
  }
};

export default StoreDetailPage;