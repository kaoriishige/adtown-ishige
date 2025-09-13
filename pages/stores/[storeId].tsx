import { GetServerSideProps, NextPage } from 'next';
import { getAdminDb } from '@/lib/firebase-admin'; // Admin SDKを使用
import { ParsedUrlQuery } from 'querystring';
import { FiMapPin, FiPhone, FiClock, FiGlobe, FiXCircle, FiCreditCard, FiAward } from 'react-icons/fi';


// ▼▼▼ Firestoreのドキュメントが持つべきデータの型を定義 ▼▼▼
interface Store {
  id: string;
  storeName?: string;
  catchphrase?: string;
  description?: string;
  mainImageUrl?: string;
  galleryImageUrls?: string[];
  address?: string;
  phoneNumber?: string;
  businessHours?: string;
  closingDays?: string;
  paymentMethods?: string;
  parkingInfo?: string;
  websiteUrl?: string;
  snsUrls?: string[];
}

interface Props {
    store: Store | null;
    error?: string;
}

const StoreDetailsPage: NextPage<Props> = ({ store, error }) => {
    if (error || !store) {
        return <div className="text-center py-20">エラー: 店舗情報の読み込みに失敗しました。</div>;
    }

    return (
        <div className="bg-gray-50 min-h-screen">
            <main className="container mx-auto px-4 py-8">
                {/* --- トップ画像 --- */}
                {store.mainImageUrl ? (
                    <div className="h-64 md:h-80 rounded-lg overflow-hidden bg-gray-200 mb-6 shadow-lg">
                        <img src={store.mainImageUrl} alt={store.storeName} className="w-full h-full object-cover" />
                    </div>
                ) : <div className="h-24 bg-gray-200 rounded-lg mb-6"></div> }

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* --- メインコンテンツ --- */}
                    <div className="lg:col-span-2">
                        {/* 店舗名とキャッチコピー */}
                        <section className="bg-white p-6 rounded-lg shadow">
                            <h1 className="text-3xl md:text-4xl font-bold text-gray-800">{store.storeName}</h1>
                            {store.catchphrase && <p className="text-lg text-gray-600 mt-2">{store.catchphrase}</p>}
                            <div className="mt-4 text-yellow-500">⭐ (口コミ評価は後ほど実装)</div>
                        </section>

                        {/* ギャラリー写真 */}
                        {store.galleryImageUrls && store.galleryImageUrls.length > 0 && (
                            <section className="mt-8">
                                <h2 className="text-2xl font-semibold mb-4 text-gray-700">ギャラリー</h2>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                    {store.galleryImageUrls.map((url, index) => (
                                        <div key={index} className="aspect-square bg-gray-200 rounded-lg overflow-hidden">
                                            <img src={url} alt={`ギャラリー画像 ${index + 1}`} className="w-full h-full object-cover"/>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}
                        
                        {/* 店舗紹介文 */}
                        <section className="mt-8">
                             <h2 className="text-2xl font-semibold mb-4 text-gray-700">お店について</h2>
                             <div className="bg-white p-6 rounded-lg shadow">
                                <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{store.description}</p>
                             </div>
                        </section>

                         {/* サービス・料金（プレースホルダー） */}
                        <section className="mt-8">
                             <h2 className="text-2xl font-semibold mb-4 text-gray-700">サービス・料金</h2>
                             <div className="bg-white p-6 rounded-lg shadow text-gray-500">
                                (このセクションは、美容室の施術メニューや便利屋の料金表など、お店によって内容が大きく変わるため、後ほど本格的に実装します)
                             </div>
                        </section>

                    </div>

                    {/* --- サイドバー：店舗基本情報 --- */}
                    <aside className="lg:col-span-1">
                        <div className="bg-white p-6 rounded-lg shadow sticky top-8">
                            <h3 className="text-xl font-bold mb-4 border-b pb-2">店舗情報</h3>
                            <ul className="space-y-4 text-gray-700">
                                <li className="flex items-start"><FiMapPin className="w-5 h-5 mr-3 mt-1 text-gray-400 flex-shrink-0" /><a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(store.address || '')}`} target="_blank" rel="noopener noreferrer" className="hover:text-blue-600">{store.address}</a></li>
                                <li className="flex items-start"><FiPhone className="w-5 h-5 mr-3 mt-1 text-gray-400 flex-shrink-0" /><a href={`tel:${store.phoneNumber}`} className="hover:text-blue-600">{store.phoneNumber}</a></li>
                                <li className="flex items-start"><FiClock className="w-5 h-5 mr-3 mt-1 text-gray-400 flex-shrink-0" /><div><span className="font-semibold">営業時間:</span><br/><p className="whitespace-pre-wrap">{store.businessHours}</p></div></li>
                                {store.closingDays && <li className="flex items-start"><FiXCircle className="w-5 h-5 mr-3 mt-1 text-gray-400 flex-shrink-0" /><div><span className="font-semibold">定休日:</span><br/>{store.closingDays}</div></li>}
                                {store.paymentMethods && <li className="flex items-start"><FiCreditCard className="w-5 h-5 mr-3 mt-1 text-gray-400 flex-shrink-0" /><div><span className="font-semibold">支払い方法:</span><br/>{store.paymentMethods}</div></li>}
                                {store.parkingInfo && <li className="flex items-start"><FiAward className="w-5 h-5 mr-3 mt-1 text-gray-400 flex-shrink-0" /><div><span className="font-semibold">駐車場:</span><br/>{store.parkingInfo}</div></li>}
                                {store.websiteUrl && <li className="flex items-start"><FiGlobe className="w-5 h-5 mr-3 mt-1 text-gray-400 flex-shrink-0" /><a href={store.websiteUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline break-all">公式サイト</a></li>}
                            </ul>
                        </div>
                    </aside>
                </div>
            </main>
        </div>
    );
};

// ▼▼▼ サーバーサイドでデータを取得する部分を、新しいフィールドを取得するように修正 ▼▼▼
export const getServerSideProps: GetServerSideProps<Props, ParsedUrlQuery> = async (context) => {
    try {
        const { storeId } = context.params!;
        if (typeof storeId !== 'string') {
            return { notFound: true };
        }

        const db = getAdminDb();
        const storeDoc = await db.collection('stores').doc(storeId).get();

        if (!storeDoc.exists) {
            return { notFound: true };
        }

        const storeData = storeDoc.data()!;
        const store: Store = {
            id: storeDoc.id,
            storeName: storeData.storeName || '',
            catchphrase: storeData.catchphrase || '',
            description: storeData.description || '',
            mainImageUrl: storeData.mainImageUrl || null,
            galleryImageUrls: storeData.galleryImageUrls || [],
            address: storeData.address || '',
            phoneNumber: storeData.phoneNumber || '',
            businessHours: storeData.businessHours || '',
            closingDays: storeData.closingDays || '',
            paymentMethods: storeData.paymentMethods || '',
            parkingInfo: storeData.parkingInfo || '',
            websiteUrl: storeData.websiteUrl || '',
            snsUrls: storeData.snsUrls || [],
        };
        
        return { props: { store } };
    } catch (error) {
        console.error('店舗詳細ページのデータ取得に失敗:', error);
        return { props: { store: null, error: 'データの取得に失敗しました。' } };
    }
};

export default StoreDetailsPage;