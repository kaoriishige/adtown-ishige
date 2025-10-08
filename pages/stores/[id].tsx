import { GetServerSideProps, NextPage } from 'next';
import Head from 'next/head';
import { adminDb } from '@/lib/firebase-admin';
import Link from 'next/link';
import { RiMapPin2Line, RiGlobalLine } from 'react-icons/ri';
import { Timestamp } from 'firebase-admin/firestore';

// --- 型定義 ---
interface StoreProfile {
    id: string;
    companyName: string;
    address: string;
    description: string;
    mainImageUrl: string | null;
    galleryImageUrls: string[];
    phoneNumber: string;
    websiteUrl: string;
    snsUrls: string[];
    mainCategory: string; // 戻るボタンのリンク生成に必要
    subCategory: string; // 戻るボタンのリンク生成に必要
}

interface Deal {
    id: string;
    title: string;
    description: string;
    imageUrl: string | null;
    type: 'お得情報' | 'クーポン' | 'フードロス';
    createdAt: string;
}

interface StoreDetailPageProps {
    store: StoreProfile | null;
    deals: Deal[];
}

const StoreDetailPage: NextPage<StoreDetailPageProps> = ({ store, deals }) => {
    if (!store) {
        return (
             <div className="flex h-screen items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl font-bold mb-4">エラー</h1>
                    <p>店舗情報が見つかりませんでした。</p>
                    <Link href="/deals" className="text-blue-600 hover:underline mt-4 inline-block">
                        カテゴリ選択に戻る
                    </Link>
                </div>
            </div>
        );
    }
    
    // 戻るボタンのリンク先を動的に生成
    const backHref = store.mainCategory && store.address
        ? `/deals/${encodeURIComponent(store.mainCategory)}/${encodeURIComponent(store.address.split(/市|町/)[0] + (store.address.includes('市') ? '市' : '町'))}?sub=${encodeURIComponent(store.subCategory)}`
        : '/deals';

    return (
        <div className="bg-gray-100 min-h-screen">
            <Head>
                <title>{store.companyName}</title>
            </Head>

            <header className="bg-white shadow-sm sticky top-0 z-10">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center">
                    <Link href={backHref} className="text-sm text-blue-600 hover:underline">
                        ← 店舗一覧に戻る
                    </Link>
                </div>
            </header>

            <main className="max-w-5xl mx-auto p-4 sm:p-6 lg:p-8">
                {store.mainImageUrl && (
                    <div className="relative h-64 md:h-80 rounded-lg shadow-lg overflow-hidden mb-8">
                        <img src={store.mainImageUrl} alt={store.companyName} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                        <h1 className="absolute bottom-6 left-6 text-3xl md:text-4xl font-extrabold text-white" style={{textShadow: '0 2px 4px rgba(0,0,0,0.5)'}}>{store.companyName}</h1>
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow-md">
                        <h2 className="text-xl font-bold text-gray-800 border-b pb-2 mb-4">店舗紹介</h2>
                        <p className="text-gray-600 whitespace-pre-wrap">{store.description}</p>
                        
                        {store.galleryImageUrls.length > 0 && (
                             <div className="mt-8">
                                <h3 className="text-lg font-bold text-gray-800 border-b pb-2 mb-4">ギャラリー</h3>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                    {store.galleryImageUrls.map((url, index) => (
                                        <a key={index} href={url} target="_blank" rel="noopener noreferrer">
                                            <img src={url} alt={`ギャラリー画像 ${index + 1}`} className="w-full h-24 object-cover rounded-md shadow-sm hover:scale-105 transition-transform" />
                                        </a>
                                    ))}
                                </div>
                            </div>
                        )}

                        <h2 className="text-xl font-bold text-gray-800 border-b pb-2 mt-8 mb-4">地図</h2>
                        <div className="aspect-w-16 aspect-h-9 rounded-lg overflow-hidden">
                            <iframe
                                src={`https://maps.google.com/maps?q=${encodeURIComponent(store.address)}&output=embed`}
                                width="100%"
                                height="100%"
                                style={{ border: 0 }}
                                allowFullScreen={false}
                                loading="lazy"
                                referrerPolicy="no-referrer-when-downgrade"
                            ></iframe>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="bg-white p-6 rounded-lg shadow-md">
                            <h3 className="text-lg font-bold mb-4 border-b pb-2">店舗情報</h3>
                            <ul className="space-y-3 text-sm">
                                <li className="flex items-start"><RiMapPin2Line className="mt-1 mr-2 flex-shrink-0 text-gray-500" /><span>{store.address}</span></li>
                                {store.phoneNumber && <li className="flex items-center"><span className="font-bold mr-2">TEL:</span><span>{store.phoneNumber}</span></li>}
                                {store.websiteUrl && <li className="flex items-center"><RiGlobalLine className="mr-2 flex-shrink-0 text-gray-500" /><a href={store.websiteUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline truncate">{store.websiteUrl}</a></li>}
                            </ul>
                        </div>

                        {deals.length > 0 && (
                            <div className="bg-white p-6 rounded-lg shadow-md">
                                <h3 className="text-lg font-bold mb-4 border-b pb-2">最新のお得情報</h3>
                                <div className="space-y-4">
                                    {deals.map(deal => (
                                        <div key={deal.id} className="border-b pb-3 last:border-b-0">
                                            <p className={`font-bold ${deal.type === 'クーポン' ? 'text-green-600' : 'text-blue-700'}`}>{deal.title}</p>
                                            <p className="text-sm text-gray-600 mt-1 whitespace-pre-wrap">{deal.description}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
};

export const getServerSideProps: GetServerSideProps = async (context) => {
    const { id } = context.params as { id: string };

    try {
        const storeDoc = await adminDb.collection('users').doc(id).get();
        if (!storeDoc.exists) {
            return { notFound: true };
        }
        const storeData = storeDoc.data()!;

        const dealsSnapshot = await adminDb.collection('storeDeals').where('ownerId', '==', id).orderBy('createdAt', 'desc').get();
        const deals = dealsSnapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                title: data.title,
                description: data.description,
                imageUrl: data.imageUrl || null,
                type: data.type,
                createdAt: (data.createdAt as Timestamp).toDate().toISOString(),
            };
        });

        const store: StoreProfile = {
            id: storeDoc.id,
            companyName: storeData.companyName || '',
            address: storeData.address || '',
            description: storeData.description || '',
            mainImageUrl: storeData.mainImageUrl || null,
            galleryImageUrls: storeData.galleryImageUrls || [],
            phoneNumber: storeData.phoneNumber || '',
            websiteUrl: storeData.websiteUrl || '',
            snsUrls: storeData.snsUrls || [],
            mainCategory: storeData.mainCategory || '',
            subCategory: storeData.subCategory || '',
        };

        return { props: { store: JSON.parse(JSON.stringify(store)), deals: JSON.parse(JSON.stringify(deals)) } };

    } catch (error) {
        console.error(`Error fetching store detail for id ${id}:`, error);
        return { notFound: true };
    }
};

export default StoreDetailPage;