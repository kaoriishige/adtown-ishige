import { GetServerSideProps, NextPage } from 'next';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';// 注意：パスの階層が深くなります
import { ParsedUrlQuery } from 'querystring';

interface Store {
  id: string;
  storeName: string;
  description: string;
  address: string;
  phoneNumber: string;
  businessHours: string;
  photoUrls: string[];
  websiteUrl?: string;
  snsUrls?: string[];
}

interface StoreDeal {
  id: string;
  type: 'お得情報' | 'クーポン' | 'フードロス';
  title: string;
  description: string;
  imageUrl?: string;
}

interface PageProps {
  store: Store;
  deals: StoreDeal[];
}

const StoreDetailsPage: NextPage<PageProps> = ({ store, deals }) => {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        {store.photoUrls && store.photoUrls.length > 0 && (
          <div className="h-64 rounded-lg overflow-hidden bg-gray-200 mb-4">
            <img src={store.photoUrls[0]} alt={store.storeName} className="w-full h-full object-cover" />
          </div>
        )}
        <h1 className="text-4xl font-bold">{store.storeName}</h1>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="mb-8">
            <h2 className="text-2xl font-semibold border-b pb-2 mb-4">お店について</h2>
            <p className="text-gray-700 whitespace-pre-wrap">{store.description}</p>
          </div>
          <div>
            <h2 className="text-2xl font-semibold border-b pb-2 mb-4">お得情報・クーポン</h2>
            {deals.length > 0 ? (
              <div className="space-y-4">
                {deals.map(deal => (
                  <div key={deal.id} className="border rounded-lg p-4 flex items-center">
                    {deal.imageUrl && <img src={deal.imageUrl} alt={deal.title} className="w-24 h-24 object-cover rounded-md mr-4" />}
                    <div>
                      <span className="text-xs inline-block bg-blue-200 text-blue-800 rounded-full px-2 py-1">{deal.type}</span>
                      <h3 className="text-lg font-bold mt-1">{deal.title}</h3>
                      <p className="text-sm text-gray-600 mt-1">{deal.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : <p className="text-gray-500">現在、利用できるお得情報はありません。</p>}
          </div>
        </div>
        <div className="border rounded-lg p-4 h-fit">
          <h3 className="text-xl font-semibold mb-4">基本情報</h3>
          <ul className="space-y-3 text-sm">
            <li className="flex items-start"><span className="w-6 h-6 mr-2">📍</span><span>{store.address}</span></li>
            <li className="flex items-start"><span className="w-6 h-6 mr-2">📞</span><span>{store.phoneNumber}</span></li>
            <li className="flex items-start"><span className="w-6 h-6 mr-2">⏰</span><span className="whitespace-pre-wrap">{store.businessHours}</span></li>
            {store.websiteUrl && <li className="flex items-start"><span className="w-6 h-6 mr-2">🌐</span><a href={store.websiteUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">公式サイト</a></li>}
          </ul>
        </div>
      </div>
    </div>
  );
};

interface Params extends ParsedUrlQuery {
  storeId: string;
}

export const getServerSideProps: GetServerSideProps<PageProps, Params> = async (context) => {
  const { storeId } = context.params!;
  try {
    const storeDocRef = doc(db, 'stores', storeId);
    const storeDoc = await getDoc(storeDocRef);
    if (!storeDoc.exists()) return { notFound: true };
    const storeData = storeDoc.data();
    
    // Firestore Timestampsなどをシリアライズ可能な形式に変換する必要がある場合
    const serializedStore = JSON.parse(JSON.stringify({ id: storeDoc.id, ...storeData }));

    const dealsRef = collection(db, 'storeDeals');
    const q = query(dealsRef, where("storeId", "==", storeId), where("isActive", "==", true));
    const dealsSnapshot = await getDocs(q);
    const deals = dealsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    const serializedDeals = JSON.parse(JSON.stringify(deals));
    
    return { props: { store: serializedStore, deals: serializedDeals } };
  } catch (error) {
    console.error("詳細ページのデータ取得に失敗:", error);
    return { notFound: true };
  }
};

export default StoreDetailsPage;