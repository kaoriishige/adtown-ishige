import { GetServerSideProps, NextPage } from 'next';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Image from 'next/image';
import { RiMapPin2Line, RiArrowLeftSLine, RiGlobalLine, RiInstagramLine, RiTwitterLine, RiFacebookCircleLine, RiPhoneLine, RiCoupon3Line } from 'react-icons/ri';

// 型定義
interface Deal {
    id: string;
    title: string;
    description: string;
    imageUrl?: string;
    isCoupon: boolean;
}
interface Store {
    id: string;
    storeName: string;
    address: string;
    phoneNumber?: string;
    mainCategory: string;
    subCategory: string;
    description: string;
    websiteUrl?: string;
    snsUrls?: string[];
    mainImageUrl?: string;
    galleryImageUrls?: string[];
    deals?: Deal[];
}

interface StoreDetailPageProps {
    store: Store | null;
}

const StoreDetailPage: NextPage<StoreDetailPageProps> = ({ store }) => {
    const router = useRouter();

    if (router.isFallback) {
        return <div>読み込み中...</div>;
    }

    if (!store) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <p>店舗が見つかりませんでした。</p>
            </div>
        );
    }

    const getSnsIcon = (url: string) => {
        if (url.includes('instagram.com')) return <RiInstagramLine className="mr-2" />;
        if (url.includes('twitter.com') || url.includes('x.com')) return <RiTwitterLine className="mr-2" />;
        if (url.includes('facebook.com')) return <RiFacebookCircleLine className="mr-2" />;
        return <RiGlobalLine className="mr-2" />;
    };

    return (
        <div className="bg-gray-100 min-h-screen">
            <Head>
                <title>{`${store.storeName} - みんなの那須アプリ`}</title>
            </Head>
            <div className="max-w-4xl mx-auto bg-white min-h-screen">
                <header className="p-4 border-b sticky top-0 bg-white z-10 flex items-center">
                    <button onClick={() => router.back()} className="p-2 rounded-full hover:bg-gray-100 mr-2">
                        <RiArrowLeftSLine size={24} />
                    </button>
                    <h1 className="text-xl font-bold truncate">{store.storeName}</h1>
                </header>

                <main>
                    <div className="relative w-full aspect-video"> 
                        <Image
                            src={store.mainImageUrl || '/images/placeholder.png'}
                            alt={store.storeName}
                            layout="fill"
                            objectFit="cover"
                            onError={(e) => { e.currentTarget.src = '/images/placeholder.png'; }}
                        />
                    </div>

                    <div className="p-6 space-y-6">
                        <h2 className="text-3xl font-bold text-gray-900">{store.storeName}</h2>

                        <div className="text-sm text-gray-500">
                            <span>{store.mainCategory}</span> &gt; <span>{store.subCategory}</span>
                        </div>

                        {store.deals && store.deals.length > 0 && (
                            <div className="border-t pt-6">
                                <h3 className="font-bold text-lg mb-4 flex items-center"><RiCoupon3Line className="mr-2 text-orange-500" />現在のお得情報・クーポン</h3>
                                <div className="space-y-4">
                                    {store.deals.map(deal => (
                                        <div key={deal.id} className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                                            <h4 className="font-bold text-orange-800">{deal.title}</h4>
                                            <p className="text-sm text-orange-700 mt-1">{deal.description}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                        
                        <div className="space-y-4 border-t pt-6">
                            <h3 className="font-bold text-lg">店舗情報</h3>
                            <div className="flex items-start">
                                <RiMapPin2Line className="mt-1 mr-3 text-gray-400 flex-shrink-0" />
                                <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(store.address)}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{store.address}</a>
                            </div>
                            {store.phoneNumber && (
                                <div className="flex items-start">
                                    <RiPhoneLine className="mt-1 mr-3 text-gray-400 flex-shrink-0" />
                                    <a href={`tel:${store.phoneNumber}`} className="text-blue-600 hover:underline">{store.phoneNumber}</a>
                                </div>
                            )}
                        </div>

                        {store.description && (
                            <div className="border-t pt-6">
                                <h3 className="font-bold text-lg mb-2">紹介文・営業時間</h3>
                                <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{store.description}</p>
                            </div>
                        )}

                        {(store.websiteUrl || (store.snsUrls && store.snsUrls.length > 0)) && (
                             <div className="border-t pt-6 space-y-2">
                                 <h3 className="font-bold text-lg mb-2">関連リンク</h3>
                                 {store.websiteUrl && (
                                     <a href={store.websiteUrl} target="_blank" rel="noopener noreferrer" className="flex items-center text-blue-600 hover:underline">
                                         <RiGlobalLine className="mr-2" /> 公式ウェブサイト
                                     </a>
                                 )}
                                 {store.snsUrls?.map((url, index) => (
                                     <a key={index} href={url} target="_blank" rel="noopener noreferrer" className="flex items-center text-blue-600 hover:underline">
                                         {getSnsIcon(url)} {new URL(url).hostname}
                                     </a>
                                 ))}
                             </div>
                        )}
                        
                        {store.galleryImageUrls && store.galleryImageUrls.length > 0 && (
                            <div className="border-t pt-6">
                                <h3 className="font-bold text-lg mb-4">ギャラリー</h3>
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                                    {store.galleryImageUrls.map((url, index) => (
                                        <div key={index} className="relative aspect-square">
                                            <Image 
                                                src={url} 
                                                alt={`ギャラリー画像 ${index + 1}`} 
                                                layout="fill" 
                                                objectFit="cover" 
                                                className="rounded-lg"
                                                onError={(e) => { e.currentTarget.src = '/images/placeholder.png'; }}
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
};

export const getServerSideProps: GetServerSideProps = async (context) => {
    // ★★★ 修正箇所: 'id' から 'storeId' に変更 ★★★
    const { storeId } = context.query;

    if (typeof storeId !== 'string') {
        return { props: { store: null } };
    }

    try {
        const apiUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/api/stores/${storeId}`;
        const res = await fetch(apiUrl);
        if (!res.ok) {
            console.error(`Failed to fetch store ${storeId}: ${res.statusText}`);
            return { props: { store: null } };
        }
        const store = await res.json();
        
        return {
            props: {
                store,
            },
        };

    } catch (error) {
        console.error("Error fetching store in SSR:", error);
        return { props: { store: null } };
    }
};

export default StoreDetailPage;