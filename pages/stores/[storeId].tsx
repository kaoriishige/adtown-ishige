import { GetServerSideProps, NextPage } from 'next';
import { adminDb } from '@/lib/firebase-admin';
import { ParsedUrlQuery } from 'querystring';
import { useState } from 'react';
import { FiMapPin, FiPhone, FiClock, FiGlobe, FiXCircle, FiCreditCard, FiAward, FiUsers, FiLock } from 'react-icons/fi';

// Firestoreのデータ型定義
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
  seatsInfo?: string;
  privateRoomInfo?: string;
  budgetLunch?: string;
  budgetDinner?: string;
  websiteUrl?: string;
  snsUrls?: string[];
}

// 口コミデータの型定義 (今回は表示のみ)
interface Review {
    id: string;
    authorName: string;
    rating: number;
    comment: string;
    createdAt: string; // サーバーサイドで文字列に変換
}

interface Props {
    store: Store;
    reviews: Review[]; // 口コミデータも受け取る
    error?: string;
}

const StoreDetailsPage: NextPage<Props> = ({ store, reviews, error }) => {
    const [modalImage, setModalImage] = useState<string | null>(null);

    if (error || !store) {
        return <div className="text-center py-20">エラー: 店舗情報の読み込みに失敗しました。</div>;
    }

    return (
        <div className="bg-gray-50 min-h-screen">
            <main className="container mx-auto px-4 py-8">
                {/* --- トップ画像 --- */}
                {store.mainImageUrl && (
                    <div className="h-64 md:h-96 rounded-lg overflow-hidden bg-gray-200 mb-6 shadow-lg relative">
                        <img src={store.mainImageUrl} alt={store.storeName} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* --- メインコンテンツ --- */}
                    <div className="lg:col-span-2">
                        <section className="bg-white p-6 rounded-lg shadow -mt-24 relative z-10">
                            <h1 className="text-3xl md:text-4xl font-bold text-gray-800">{store.storeName}</h1>
                            {store.catchphrase && <p className="text-lg text-gray-600 mt-2">{store.catchphrase}</p>}
                            <div className="flex items-center mt-4">
                                <span className="text-yellow-500 flex items-center text-xl font-bold">
                                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path></svg>
                                    <span>3.5</span> 
                                </span>
                                <span className="text-gray-500 ml-4">（口コミ評価は後ほど実装）</span>
                            </div>
                        </section>

                        <section className="mt-8">
                            <h2 className="text-2xl font-semibold mb-4 text-gray-700">ギャラリー</h2>
                            <div className="grid grid-cols-3 md:grid-cols-4 gap-4">
                                {store.galleryImageUrls?.map((url, index) => (
                                    <div key={index} className="aspect-square bg-gray-200 rounded-lg overflow-hidden cursor-pointer hover:opacity-80 transition-opacity" onClick={() => setModalImage(url)}>
                                        <img src={url} alt={`ギャラリー画像 ${index + 1}`} className="w-full h-full object-cover"/>
                                    </div>
                                ))}
                            </div>
                        </section>
                        
                        <section className="mt-8">
                             <h2 className="text-2xl font-semibold mb-4 text-gray-700">お店・サービスについて</h2>
                             <div className="bg-white p-6 rounded-lg shadow prose max-w-none">
                                <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{store.description}</p>
                             </div>
                        </section>

                        <section className="mt-8">
                             <h2 className="text-2xl font-semibold mb-4 text-gray-700">口コミ</h2>
                             <div className="bg-white p-6 rounded-lg shadow text-gray-500">
                                (口コミ機能は後ほど本格的に実装します)
                             </div>
                        </section>
                    </div>

                    {/* --- サイドバー --- */}
                    <aside className="lg:col-span-1">
                        <div className="bg-white p-6 rounded-lg shadow sticky top-8">
                            <h3 className="text-xl font-bold mb-4 border-b pb-2">基本情報</h3>
                            <ul className="space-y-4 text-gray-700">
                                <li className="flex items-start"><FiMapPin className="w-5 h-5 mr-3 mt-1 text-gray-400 flex-shrink-0" /><a href={`https://maps.google.com/maps?q=${encodeURIComponent(store.address || '')}`} target="_blank" rel="noopener noreferrer" className="hover:text-blue-600">{store.address}</a></li>
                                <li className="flex items-start"><FiPhone className="w-5 h-5 mr-3 mt-1 text-gray-400 flex-shrink-0" /><a href={`tel:${store.phoneNumber}`} className="hover:text-blue-600">{store.phoneNumber}</a></li>
                                {store.businessHours && <li className="flex items-start"><FiClock className="w-5 h-5 mr-3 mt-1 text-gray-400 flex-shrink-0" /><div><span className="font-semibold">営業時間:</span><br/><p className="whitespace-pre-wrap">{store.businessHours}</p></div></li>}
                                {store.closingDays && <li className="flex items-start"><FiXCircle className="w-5 h-5 mr-3 mt-1 text-gray-400 flex-shrink-0" /><div><span className="font-semibold">定休日:</span><br/>{store.closingDays}</div></li>}
                                <li className="font-bold pt-2 border-t mt-4">価格帯・支払い</li>
                                {store.budgetDinner && <li className="flex items-start"><span className="font-bold mr-2">夜:</span> {store.budgetDinner}</li>}
                                {store.budgetLunch && <li className="flex items-start"><span className="font-bold mr-2">昼:</span> {store.budgetLunch}</li>}
                                {store.paymentMethods && <li className="flex items-start"><FiCreditCard className="w-5 h-5 mr-3 mt-1 text-gray-400 flex-shrink-0" /><div><span className="font-semibold">支払い方法:</span><br/>{store.paymentMethods}</div></li>}
                                <li className="font-bold pt-2 border-t mt-4">設備など</li>
                                {store.seatsInfo && <li className="flex items-start"><FiUsers className="w-5 h-5 mr-3 mt-1 text-gray-400 flex-shrink-0" /><div><span className="font-semibold">席情報:</span><br/>{store.seatsInfo}</div></li>}
                                {store.privateRoomInfo && <li className="flex items-start"><FiLock className="w-5 h-5 mr-3 mt-1 text-gray-400 flex-shrink-0" /><div><span className="font-semibold">個室:</span><br/>{store.privateRoomInfo}</div></li>}
                                {store.parkingInfo && <li className="flex items-start"><FiAward className="w-5 h-5 mr-3 mt-1 text-gray-400 flex-shrink-0" /><div><span className="font-semibold">駐車場:</span><br/>{store.parkingInfo}</div></li>}
                                {store.websiteUrl && <li className="flex items-start"><FiGlobe className="w-5 h-5 mr-3 mt-1 text-gray-400 flex-shrink-0" /><a href={store.websiteUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline break-all">公式サイト</a></li>}
                            </ul>
                        </div>
                    </aside>
                </div>
            </main>

            {/* --- 画像拡大モーダル --- */}
            {modalImage && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50" onClick={() => setModalImage(null)}>
                    <img src={modalImage} alt="拡大画像" className="max-w-[90vw] max-h-[90vh]"/>
                    <button className="absolute top-4 right-4 text-white text-3xl">&times;</button>
                </div>
            )}
        </div>
    );
};

export const getServerSideProps: GetServerSideProps<Props, ParsedUrlQuery> = async (context) => {
    try {
        const { storeId } = context.params!;
        if (typeof storeId !== 'string') { return { notFound: true }; }

        const db = adminDb;
        const storeDocRef = db.collection('stores').doc(storeId);
        
        // 店舗情報と口コミ情報を並行して取得
        const [storeDoc, reviewsSnapshot] = await Promise.all([
            storeDocRef.get(),
            storeDocRef.collection('reviews').orderBy('createdAt', 'desc').limit(5).get() // 口コミを5件取得
        ]);

        if (!storeDoc.exists) { return { notFound: true }; }

        const storeData = storeDoc.data()!;
        const store: Store = {
            id: storeDoc.id,
            storeName: storeData.storeName,
            catchphrase: storeData.catchphrase,
            description: storeData.description,
            mainImageUrl: storeData.mainImageUrl || null,
            galleryImageUrls: storeData.galleryImageUrls || [],
            address: storeData.address,
            phoneNumber: storeData.phoneNumber,
            businessHours: storeData.businessHours,
            closingDays: storeData.closingDays,
            paymentMethods: storeData.paymentMethods,
            parkingInfo: storeData.parkingInfo,
            seatsInfo: storeData.seatsInfo,
            privateRoomInfo: storeData.privateRoomInfo,
            budgetLunch: storeData.budgetLunch,
            budgetDinner: storeData.budgetDinner,
            websiteUrl: storeData.websiteUrl,
            snsUrls: storeData.snsUrls || [],
        };

        const reviews: Review[] = reviewsSnapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                authorName: data.authorName,
                rating: data.rating,
                comment: data.comment,
                createdAt: (data.createdAt.toDate()).toLocaleDateString('ja-JP'), // Timestampを日付文字列に変換
            };
        });
        
        return { props: { store, reviews } };
    } catch (error) {
        console.error('店舗詳細ページのデータ取得に失敗:', error);
        return { props: { store: null!, reviews: [], error: 'データの取得に失敗しました。' } };
    }
};

export default StoreDetailsPage;