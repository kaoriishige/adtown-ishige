import { GetServerSideProps, NextPage } from 'next';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Image from 'next/image'; // Next.jsのImageコンポーネントを使用
import { RiArrowLeftSLine, RiGlobalLine, RiInstagramLine, RiTwitterLine, RiFacebookBoxLine } from 'react-icons/ri';
import { Timestamp, FieldPath } from 'firebase/firestore'; 
import { adminDb } from '../../../lib/firebase-admin'; // 🚨 パスを確認
import React, { useCallback, useEffect, useState } from 'react'; // React hooksを追加
import { 
    Phone, MapPin, Tag, Globe, MessageSquare, Clock, X,
    AlertTriangle, // 💡 修正 1: AlertTriangle をインポート
    Link as LinkIcon, 
    Monitor, // 💡 修正 2 代替アイコンとしてMonitorをインポート
    ArrowLeft
} from 'lucide-react'; // Lucideアイコンを使用

declare const __app_id: string;
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

// ========================= 型定義 =========================
interface StoreData {
    id: string;
    storeName: string;
    address: string;
    phoneNumber: string;
    mainCategory: string;
    subCategory: string;
    description: string;
    websiteUrl?: string;
    snsUrls?: string[];
    mainImageUrl?: string;
    galleryImageUrls?: string[];
    ownerId: string;
    status: string;
    storeId?: string;
}

interface DealData {
    id: string;
    type: 'お得情報' | 'クーポン' | 'フードロス';
    title: string;
    description: string;
    imageUrl?: string;
    createdAt: string;
}

interface Props {
    store: StoreData | null;
    deals: DealData[];
    error?: string;
}

// ========================= SSR 部分 =========================
export const getServerSideProps: GetServerSideProps<Props> = async (context) => {
    const { storeId } = context.params as { storeId: string };

    if (!storeId) { return { props: { store: null, deals: [], error: '店舗IDが指定されていません。' } }; }

    try {
        // -------- 店舗検索 --------
        const storesCollectionGroupRef = adminDb.collectionGroup('stores').where('storeId', '==', storeId);
        const querySnapshot = await storesCollectionGroupRef.limit(1).get();

        if (querySnapshot.empty) { return { props: { store: null, deals: [], error: '指定された店舗が見つかりません。' } }; }

        const storeDoc = querySnapshot.docs[0];
        const rawStoreData = storeDoc.data();
        const storeStatus = rawStoreData.status;

        if (storeStatus !== 'approved' && storeStatus !== 'active') {
            return { props: { store: null, deals: [], error: '指定された店舗は公開されていません。' } };
        }

        // -------- ownerId 抽出 --------
        const pathSegments = storeDoc.ref.path.split('/');
        const ownerId = pathSegments[3]; 
        if (!ownerId) { return { props: { store: null, deals: [], error: '店舗オーナー情報が不正です。' } }; }

        const storeData: StoreData = { id: storeDoc.id, ...rawStoreData, ownerId, status: storeStatus } as StoreData;

        // -------- ディール取得 --------
        const dealsRef = adminDb.collection('artifacts').doc(appId).collection('users').doc(ownerId)
            .collection('stores').doc(storeId).collection('deals');

        const dealsQuery = dealsRef.where('isActive', '==', true).orderBy('createdAt', 'desc').limit(10);
        const dealsSnapshot = await dealsQuery.get();

        const dealsData: DealData[] = dealsSnapshot.docs.map((doc) => {
            const data = doc.data();
            return {
                id: doc.id,
                type: data.type || 'お得情報',
                title: data.title || 'タイトルなし',
                description: data.description || '説明なし',
                imageUrl: data.imageUrl,
                createdAt: (data.createdAt as Timestamp)?.toDate().toLocaleDateString('ja-JP', { year: 'numeric', month: '2-digit', day: '2-digit'}) || '',
            };
        });

        return { props: { store: storeData, deals: dealsData } };
    } catch (error: any) {
        console.error('🔥 Firestore query error:', error);
        return {
            props: { store: null, deals: [], error: `データの読み込み中に予期せぬエラーが発生しました。詳細: ${error.message}`, },
        };
    }
};

// ========================= UI =========================
const StoreDetailPage: NextPage<Props> = ({ store, deals, error }) => {
    const router = useRouter();

    if (error) {
        return (
            <div className="min-h-screen p-4 flex justify-center items-center bg-gray-50">
                <div className="text-center p-8 bg-white rounded-xl shadow-lg">
                    <AlertTriangle size={32} className="mx-auto text-red-500 mb-4" /> {/* 💡 修正: AlertTriangle を利用 */}
                    <p className="text-red-500 my-4 bg-red-100 p-3 rounded">{error}</p>
                    <button onClick={() => router.back()} className="mt-4 text-indigo-600 hover:underline flex items-center mx-auto">
                        <RiArrowLeftSLine size={24} className="mr-1" /> 戻る
                    </button>
                </div>
            </div>
        );
    }

    if (!store) {
        return <div className="min-h-screen p-4 flex justify-center items-center">店舗情報が見つかりませんでした。</div>;
    }
    
    // トップ画像とギャラリー画像を統合 (最初の画像はトップ画像、以降はギャラリー)
    const allImages = [store.mainImageUrl, ...(store.galleryImageUrls || [])].filter(url => url);

    const getSnsIcon = (url: string) => {
        if (url.includes('twitter.com') || url.includes('x.com')) return <RiTwitterLine size={24} className="text-gray-600 hover:text-blue-500" />;
        if (url.includes('instagram.com')) return <RiInstagramLine size={24} className="text-gray-600 hover:text-pink-600" />;
        if (url.includes('facebook.com')) return <RiFacebookBoxLine size={24} className="text-gray-600 hover:text-blue-800" />;
        return <RiGlobalLine size={24} className="text-gray-600 hover:text-gray-800" />;
    };

    return (
        <div className="min-h-screen bg-gray-50 font-sans">
            <Head>
                <title>{`${store.storeName} - 店舗情報`}</title>
            </Head>

            {/* ヘッダー/戻るボタン */}
            <header className="bg-white p-4 sticky top-0 z-10 shadow-sm flex items-center">
                <button onClick={() => router.back()} className="p-2 rounded-full hover:bg-gray-200 absolute left-2">
                    <RiArrowLeftSLine size={28} />
                </button>
                <h1 className="text-xl font-bold mx-auto text-gray-800 truncate">{store.storeName}</h1>
            </header>

            <main className="max-w-4xl mx-auto pb-8">
                
                {/* 1. トップ画像と基本情報 (ワイドトップ画像 16:9) */}
                <div className="bg-white shadow-2xl overflow-hidden mb-6">
                    {store.mainImageUrl && (
                        // 💡 トップ画像推奨サイズ: 横1200px × 縦675px (16:9)
                        <div className="w-full relative aspect-video bg-gray-200">
                            <Image 
                                src={store.mainImageUrl} 
                                alt={`${store.storeName} トップ画像`} 
                                fill // fillを使ってレスポンシブにアスペクト比を維持
                                style={{ objectFit: 'cover' }}
                                priority
                                sizes="(max-width: 768px) 100vw, 800px" // 適切なsizesを設定
                            />
                        </div>
                    )}
                    
                    <div className="p-6">
                        <h1 className="text-4xl font-extrabold text-gray-900 mb-2">{store.storeName}</h1>
                        <p className="text-sm text-gray-500 mb-4">
                            <span className="font-semibold text-indigo-600">{store.mainCategory}</span> / {store.subCategory}
                        </p>

                        {/* 基本連絡先 */}
                        <div className="space-y-3 text-md text-gray-700 border-t pt-4">
                            <div className="flex items-start"><MapPin size={20} className="mr-2 text-red-500 flex-shrink-0 mt-0.5" /> <span>{store.address}</span></div>
                            <div className="flex items-start"><Phone size={20} className="mr-2 text-green-600 flex-shrink-0 mt-0.5" /> <span>{store.phoneNumber}</span></div>
                            {store.websiteUrl && (<div className="flex items-start"><Globe size={20} className="mr-2 text-blue-500 flex-shrink-0 mt-0.5" /><a href={store.websiteUrl} target="_blank" rel="noopener noreferrer" className='text-blue-600 hover:underline'>公式サイトはこちら</a></div>)}
                        </div>
                        
                        {/* SNSリンク */}
                        {(store.snsUrls || []).filter(url => url).length > 0 && (
                            <div className="flex space-x-4 mt-4 pt-4 border-t">
                                {(store.snsUrls || []).filter(url => url).map((url, index) => (
                                    <a key={index} href={url} target="_blank" rel="noopener noreferrer" className="group">
                                        {getSnsIcon(url)}
                                    </a>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* 2. 店舗紹介文 */}
                <section className="bg-white p-6 rounded-xl shadow-lg space-y-4">
                    <h2 className="text-2xl font-bold border-b pb-2 flex items-center"><MessageSquare size={24} className='mr-2 text-gray-600' /> 店舗紹介・営業時間</h2>
                    <p className="whitespace-pre-wrap text-gray-700">{store.description}</p>
                </section>

                {/* 3. ギャラリー画像 (1:1 タイル表示) */}
                {allImages.length > 1 && (
                    <section className="space-y-4">
                        <h2 className="text-2xl font-bold border-b pb-2 flex items-center"><Monitor size={24} className='mr-2 text-gray-600' /> ギャラリー</h2> {/* 💡 修正: Imageと競合しないMonitorアイコンを使用 */}
                        <div className="grid grid-cols-3 gap-3">
                            {allImages.slice(1).map((url, index) => ( // トップ画像を除外
                                <div key={index} className="aspect-square relative rounded-lg overflow-hidden">
                                    <Image 
                                        src={url!} 
                                        alt={`${store.storeName}ギャラリー ${index + 1}`} 
                                        fill 
                                        style={{ objectFit: 'cover' }}
                                        sizes="(max-width: 600px) 30vw, 250px"
                                    />
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* 4. お得情報・クーポンリスト */}
                <section className="bg-white p-6 rounded-xl shadow-lg space-y-4">
                    <h2 className="text-2xl font-bold border-b pb-2 flex items-center"><Tag size={24} className='mr-2 text-indigo-600' /> お得情報・クーポン</h2>
                    
                    {deals.length === 0 ? (
                        <p className='text-gray-500'>現在、この店舗からお得な情報やクーポンは発行されていません。</p>
                    ) : (
                        <div className="space-y-3">
                            {deals.map(deal => (
                                <div key={deal.id} className={`p-4 rounded-lg border shadow-sm ${deal.type === 'クーポン' ? 'border-green-400 bg-green-50' : deal.type === 'フードロス' ? 'border-red-400 bg-red-50' : 'border-blue-400 bg-blue-50'}`}>
                                    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-gray-700 text-white">{deal.type}</span>
                                    <h3 className="text-lg font-bold mt-1">{deal.title}</h3>
                                    {deal.imageUrl && <img src={deal.imageUrl} alt={deal.title} className="w-full h-auto object-cover rounded mt-2 max-h-48"/>}
                                    <p className="text-sm text-gray-700 mt-1 whitespace-pre-wrap">{deal.description}</p>
                                    <p className="text-xs text-gray-500 mt-2">発行日: {deal.createdAt}</p>
                                </div>
                            ))}
                        </div>
                    )}
                </section>
            </main>
        </div>
    );
};

export default StoreDetailPage;
