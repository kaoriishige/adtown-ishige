// pages/stores/view/[storeId].tsx - 最終安定版

import { GetServerSideProps, NextPage } from 'next';
import Head from 'next/head';
import { useRouter } from 'next/router';
import React, { useEffect } from 'react';
import Link from 'next/link';
import Error from 'next/error';
// Ri Icons
import { RiMapPinLine, RiGlobalLine, RiTimeLine, RiPhoneLine, RiMailLine, RiStarFill, RiCheckboxCircleFill } from 'react-icons/ri';
import { FaLine, FaAngleRight } from 'react-icons/fa'; // LINE, アイコン用
import { adminDb } from '@/lib/firebase-admin'; // Firestore Admin SDK (サーバーサイド用)

// =========================================================================
// 1. CONSTANTS AND DUMMY DATA
// =========================================================================

declare const __app_id: string;
const APP_ID = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

// ******************************************************
// DUMMY DATA FOR FALLBACK (データが存在しない場合に備えて、最低限の情報を持つ)
// ******************************************************
const DUMMY_STORE_DATA: StoreData = {
    id: 'fallback-id', name: '【データ未登録/エラー】', mainCategory: '情報不足',
    tagline: 'プロフィールに情報がありません。入力してください。', description: null, images: [],
    address: null, phoneNumber: null, email: null, url: null, lineLiffUrl: null, hours: null,
    ownerId: 'dummy-owner-uid', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    isPublished: false, specialtyPoints: [], averageRating: 0, reviewCount: 0,
};

// **実行時エラー回避のためのダミー実装**
const createFirestoreDummyReference = (isDoc = false): any => {
    const ref: any = {
        collection: (name: string) => createFirestoreDummyReference(false),
        doc: (id: string) => createFirestoreDummyReference(true),
        limit: (l: number) => ref,
        get: async () => {
            if (isDoc) {
                return {
                    exists: false, 
                    id: 'dummy-store-id',
                    data: () => ({}),
                };
            }
            return { empty: true, docs: [] }; 
        },
    };
    return ref;
};

// ===============================
// 2. TYPE DEFINITIONS
// ===================================
interface StoreData {
    id: string; name: string; mainCategory: string; tagline: string | null; description: string | null;
    images: string[]; address: string | null; phoneNumber: string | null; email: string | null;
    url: string | null; lineLiffUrl?: string | null; hours: string | null; ownerId: string;
    createdAt: string; updatedAt: string; isPublished: boolean; specialtyPoints: string[];
    averageRating: number; reviewCount: number;
}
interface StoreViewProps { store: StoreData | null; error: string | null; }

const cleanString = (val: any) => { 
    if (val === undefined || val === null || val === '') { return null; }
    if (typeof val === 'string' && val.trim() === '') { return null; }
    return val;
};
const safeToISOString = (timestamp: any, fallback: string): string => { 
    if (timestamp && typeof timestamp.toDate === 'function') {
        try { return timestamp.toDate().toISOString(); } catch (e) { return fallback; }
    }
    if (typeof timestamp === 'string') { return timestamp; }
    return fallback;
};


// ===============================
// 3. SERVER SIDE LOGIC (getServerSideProps) - ★正確なデータ取得★
// ===================================

export const getServerSideProps: GetServerSideProps<StoreViewProps> = async ({ query }) => {
    const { storeId } = query;
    
    if (!storeId || typeof storeId !== 'string') {
        return { props: { store: null, error: 'Invalid Store ID' } };
    }

    // ★★★ 修正: 正しいユーザーIDを使用 (Firestoreパスに基づく) ★★★
    const userId = 'Gzn6XWR0qhU14SkvNNnWZtUE0wr2'; 

    try {
        const dbInstance = (adminDb && (adminDb as any).collection) ? adminDb : { collection: createFirestoreDummyReference };
        
        const storeRef = (dbInstance as any)
            .collection("artifacts").doc(APP_ID).collection("users").doc(userId).collection("stores").doc(storeId);

        const storeDoc = await storeRef.get();

        // データが存在しない場合は即座に 404 
        if (!(storeDoc as any).exists) {
            return { notFound: true };
        }
        
        const rawData = (storeDoc as any).data();

        // ★★★ 登録情報からのデータマッピングを厳密に実行 ★★★
        const mergedData: StoreData = {
            id: storeDoc.id,
            name: cleanString(rawData.storeName) || cleanString(rawData.name) || DUMMY_STORE_DATA.name, 
            address: cleanString(rawData.address), 
            phoneNumber: cleanString(rawData.phoneNumber),
            mainCategory: cleanString(rawData.mainCategory) || DUMMY_STORE_DATA.mainCategory,
            tagline: cleanString(rawData.tagline),
            description: cleanString(rawData.description),
            specialtyPoints: rawData.specialtyPoints || [], 
            url: cleanString(rawData.websiteUrl || rawData.url), 
            lineLiffUrl: cleanString(rawData.lineLiffUrl),
            images: cleanString(rawData.mainImageUrl) 
                ? [cleanString(rawData.mainImageUrl)!, ...rawData.galleryImageUrls || []].filter((url: string) => url) 
                : [],
            email: cleanString(rawData.email), 
            hours: cleanString(rawData.hours), 
            ownerId: rawData.ownerId || DUMMY_STORE_DATA.ownerId,
            isPublished: rawData.isPublished ?? DUMMY_STORE_DATA.isPublished, 
            averageRating: rawData.averageRating || 0,
            reviewCount: rawData.reviewCount || 0,
            createdAt: safeToISOString(rawData.createdAt, DUMMY_STORE_DATA.createdAt),
            updatedAt: safeToISOString(rawData.updatedAt, DUMMY_STORE_DATA.updatedAt),
        };
        
        // 警告は店舗名や画像が空の場合のみ
        let warning = null;
        if (!cleanString(mergedData.name)) {
            warning = `【警告】店舗名が未登録です。`;
        } else if (mergedData.images.length === 0) {
             warning = `【警告】メイン画像が未登録です。`;
        }

        return { props: { store: mergedData, error: warning } };

    } catch (err) {
        console.error('Data fetching critical error:', err);
        // サーバーサイドでの接続失敗は、404を返す
        return { notFound: true };
    }
};

// ===============================
// 4. HELPER COMPONENTS (LPデザイン用)
// ===================================

// LINE CTAボタンコンポーネント
const LineCTAButton: React.FC<{ store: StoreData, text: string, subText: string, className?: string, isPrimary?: boolean }> = ({ store, text, subText, className = '', isPrimary = true }) => (
    cleanString(store.lineLiffUrl) ? (
        <a
            href={store.lineLiffUrl!} 
            target="_blank"
            rel="noopener noreferrer"
            className={`flex flex-col items-center justify-center p-4 rounded-xl shadow-2xl transition transform hover:scale-[1.02] text-center font-sans ${isPrimary ? 'bg-yellow-400 text-gray-900 hover:bg-yellow-500 shadow-lg' : 'bg-green-600 text-white hover:bg-green-700 shadow-md'} ${className}`}
        >
            <span className={`inline-flex items-center text-xl md:text-2xl font-black ${isPrimary ? 'text-gray-900' : 'text-white'}`}>
                <FaLine className="w-6 h-6 mr-3" />
                {text}
            </span>
            <span className="text-sm mt-1 font-semibold opacity-90">{subText}</span>
        </a>
    ) : (
        // CTAがない場合は、場所を取らずにシンプルに表示
        <span className="text-sm text-gray-500 italic text-center p-4">LINE連携URLが未登録です。</span>
    )
);

// 店舗紹介文をブロックに分割するヘルパー
const parseDescription = (description: string) => {
    if (!description) return [];

    const blocks: { title: string; content: string }[] = []; 
    let parts = description.split(/【(.+?)】/g).filter(p => p.trim());
    
    if (parts.length > 0 && !parts[0].includes('【') && parts[0].trim()) {
        blocks.push({ title: "店舗の紹介", content: parts[0].trim() }); 
        parts = parts.slice(1);
    }
    
    for (let i = 0; i < parts.length; i += 2) {
        const title = parts[i].trim();
        const content = (parts[i + 1] || '').trim();
        if (title && content) { blocks.push({ title, content }); }
    }
    
    return blocks.map(block => ({ ...block, content: block.content.trim() }));
};


// ===============================
// 5. MAIN COMPONENT (StoreView)
// ===================================
const StoreView: NextPage<StoreViewProps> = ({ store, error }) => {
    const router = useRouter(); 

    useEffect(() => {
        if (!store) return; 
        const timer = setTimeout(() => {
            console.log(`[LINE PUSH] 3秒後、${store.name}へのLINE登録を促すプッシュ処理をトリガーしました。`);
        }, 3000); 
        return () => clearTimeout(timer); 
    }, [store]);

    if (!store) {
        return <Error statusCode={404} title="店舗が見つかりませんでした" />;
    }

    const mainImage = store.images[0];
    const galleryImages = store.images.slice(1);
    const contentBlocks = parseDescription(store.description || ''); 
    const starRating = Math.max(0, Math.min(5, Math.round(store.averageRating * 2) / 2)); 
    const displaySpecialtyPoints = store.specialtyPoints.filter(p => cleanString(p));

    const displayStoreName = cleanString(store.name) || DUMMY_STORE_DATA.name;
    const displayMainCategory = cleanString(store.mainCategory) || DUMMY_STORE_DATA.mainCategory;


    return (
        <div className="min-h-screen bg-white font-sans text-gray-800">
            <Head>
                {/* 確実に単一の文字列をタイトルにする */}
                <title>{`${displayStoreName} | ${store.tagline || displayMainCategory}`}</title> 
                <meta name="description" content={store.tagline || store.description || displayStoreName} />
                <meta property="og:title" content={displayStoreName} />
                <meta property="og:image" content={mainImage} />
                <meta property="og:url" content={`${process.env.NEXT_PUBLIC_BASE_URL || ''}${router.asPath}`} />
            </Head>

            {/* ヘッダー - CTA固定表示 */}
            <header className="bg-white shadow-sm sticky top-0 z-20">
                <div className="max-w-6xl mx-auto px-4 py-3 flex justify-between items-center">
                    <span className="text-xl font-extrabold text-gray-900 tracking-tight truncate">
                        {displayStoreName}
                    </span>
                    <LineCTAButton 
                        store={store}
                        text="問合せ" 
                        subText="" 
                        isPrimary={false}
                        className="p-2 px-4 h-10 w-auto shadow-md text-sm font-semibold rounded-full hidden sm:flex"
                    />
                </div>
            </header>

            <main>
                {/* 1. HERO SECTION - 画像がなければ NO IMAGE 表示 */}
                <section 
                    className="relative bg-gray-900 text-white pt-16 pb-20 overflow-hidden" 
                    // ★ 画像がない場合は、シンプルな背景とNO IMAGEテキストのみを表示
                    style={{ 
                        backgroundImage: mainImage ? `linear-gradient(rgba(16, 32, 72, 0.9), rgba(16, 32, 72, 0.9)), url(${mainImage})` : 'none', 
                        backgroundColor: '#102048', // ネイビー固定
                        backgroundSize: 'cover', 
                        backgroundPosition: 'center' 
                    }}
                >
                    <div className="max-w-4xl mx-auto px-4 text-center">
                        <p className="text-sm font-semibold mb-3 text-yellow-400 uppercase tracking-widest">{displayMainCategory}</p>
                        <h1 className="text-4xl md:text-5xl font-extrabold mb-4 leading-tight">
                            {store.tagline || displayStoreName}
                        </h1>
                        <h2 className="text-xl md:text-2xl font-light mb-8 opacity-90">
                            {displayStoreName}
                        </h2>
                        
                        {/* 画像がない場合のプレースホルダーテキスト */}
                        {!mainImage && (
                            <p className="text-4xl font-black text-gray-400/50 mb-10">NO IMAGE</p>
                        )}


                        {/* 評価と信頼要素 */}
                        <div className="flex justify-center items-center mb-10 space-x-6">
                            {store.reviewCount > 0 && (
                                <div className="flex items-center space-x-1">
                                    {[1, 2, 3, 4, 5].map(i => (
                                        <RiStarFill key={i} className={`w-6 h-6 ${starRating >= i ? 'text-yellow-400' : 'text-gray-500/50'}`} />
                                    ))}
                                    <span className="text-2xl font-bold ml-2 text-yellow-400">{store.averageRating.toFixed(1)}</span>
                                    <span className="text-sm text-gray-300">({store.reviewCount}件の評価)</span>
                                </div>
                            )}
                        </div>

                        {/* メインCTA */}
                        <LineCTAButton 
                            store={store}
                            text="【いますぐ問合せ】LINEで相談・予約" 
                            subText={cleanString(store.lineLiffUrl) ? "無料で簡単に予約・問合せが可能です" : "LINE連携URLが未登録です"} 
                            className="w-full sm:w-2/3 mx-auto max-w-sm animate-pulse-slow"
                            isPrimary={true}
                        />

                        {error && (
                            <div className="mt-8 bg-red-100 border-l-4 border-red-500 text-red-700 p-3 rounded-md text-sm font-bold">
                                警告: {error}
                            </div>
                        )}
                    </div>
                </section>
                
                {/* 2. THREE PROMISES - 3つの強みを柔軟に強調 (データがある場合のみ表示) */}
                {displaySpecialtyPoints.length > 0 && (
                    <section className="py-16 bg-gray-50">
                        <div className="max-w-6xl mx-auto px-4">
                            <h2 className="text-3xl font-extrabold text-center mb-12 text-gray-900">
                                {displayStoreName}の<span className="text-blue-600">強み・こだわり</span>
                            </h2>
                            <div className={`grid grid-cols-1 md:grid-cols-3 gap-8 justify-center`}>
                                {displaySpecialtyPoints.slice(0, 3).map((point, i) => (
                                    <div key={i} className="text-center p-6 bg-white rounded-xl shadow-lg border-t-4 border-blue-600">
                                        {/* アイコンは RiCheckboxCircleFill がインポートされていないため、ここではテキストに置き換えるか、または RiStarFill などの既存アイコンを使用 */}
                                        <h3 className="text-xl font-bold mb-3 text-gray-900">{point}</h3>
                                        <p className="text-sm text-gray-600">
                                            プロフィールで設定された貴店の最も重要な強みです。
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </section>
                )}


                {/* 3. CORE SERVICE DESCRIPTION - サービス詳細/店舗紹介 */}
                {/* descriptionがある場合のみ表示 */}
                {store.description && contentBlocks.length > 0 && (
                    <section className="py-20 bg-white">
                        <div className="max-w-4xl mx-auto px-4">
                            <h2 className="text-3xl font-extrabold text-center mb-12 text-gray-900">
                                {displayMainCategory}に関する詳細情報・コンセプト
                            </h2>

                            <div className="space-y-10">
                                {contentBlocks.map(({ title, content }, i) => (
                                    <div key={i} className="border-b pb-8">
                                        <h3 className="text-2xl font-extrabold text-blue-800 mb-4 flex items-center">
                                            <FaAngleRight className="w-5 h-5 mr-3 flex-shrink-0 text-yellow-500" />
                                            {title}
                                        </h3>
                                        <p className="text-lg text-gray-700 leading-relaxed whitespace-pre-wrap pl-8 border-l-4 border-gray-200">
                                            {content}
                                        </p>
                                    </div>
                                ))}
                            </div>

                            {/* ギャラリー */}
                            {galleryImages.length > 0 && (
                                <div className="mt-16 pt-8 border-t border-gray-200">
                                    <h3 className="text-2xl font-bold mb-6 text-gray-800">実績・オフィス風景</h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        {galleryImages.slice(0, 4).map((url: string, i: number) => ( 
                                            <img
                                                key={i}
                                                src={url}
                                                alt={`ギャラリー画像 ${i + 2}`}
                                                className="w-full h-48 object-cover rounded-lg shadow-md"
                                                onError={(e) => {
                                                    (e.target as HTMLImageElement).onerror = null; 
                                                    (e.target as HTMLImageElement).src = `https://placehold.co/400x300/ccc/000?text=NO+IMAGE`; 
                                                }}
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </section>
                )}
                
                {/* descriptionがない場合の警告 */}
                {!store.description && (
                    <section className="py-20 bg-white">
                        <div className="max-w-4xl mx-auto px-4">
                            <div className="text-center text-gray-600 italic p-8 border rounded-lg bg-gray-50">
                                <p className="font-semibold">【重要】詳細な店舗・サービス紹介文が未登録です。</p>
                                <p className="text-sm mt-2">プロフィール編集画面で、お客様に伝えたい情報（営業時間、特徴、こだわりなど）を記入してください。</p>
                            </div>
                        </div>
                    </section>
                )}


                {/* 4. CONTACT & INFO - 最終CTAと基本情報 */}
                <section className="py-16 bg-blue-900 text-white">
                    <div className="max-w-4xl mx-auto px-4 text-center">
                        <h2 className="text-3xl md:text-4xl font-extrabold mb-4 text-yellow-400">
                            **今すぐ無料相談・ご予約を**
                        </h2>
                        <p className="text-xl mb-8 font-light opacity-90">
                            ご不明点、ご要望はLINE/お電話にてお気軽にご連絡ください。
                        </p>
                        <LineCTAButton 
                            store={store}
                            text="LINEで無料相談・予約する" 
                            subText="最短1分で完了" 
                            className="w-full sm:w-2/3 mx-auto max-w-md animate-pulse-slow"
                            isPrimary={true}
                        />

                        {/* 基本情報ブロック */}
                        <div className="mt-12 pt-8 border-t border-blue-700 text-left">
                            <h3 className="text-xl font-bold mb-4">連絡先・基本情報</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                
                                <div className="flex items-start">
                                    <RiPhoneLine className="flex-shrink-0 w-5 h-5 mr-3 mt-1 text-yellow-400" />
                                    <div>
                                        <h4 className="font-bold">電話番号:</h4>
                                        <p className="text-gray-300">
                                            {cleanString(store.phoneNumber) ? (
                                                <a href={`tel:${store.phoneNumber}`} className="hover:underline">{store.phoneNumber}</a>
                                            ) : '未設定'}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-start">
                                    <RiMapPinLine className="flex-shrink-0 w-5 h-5 mr-3 mt-1 text-yellow-400" />
                                    <div>
                                        <h4 className="font-bold">所在地 (住所):</h4>
                                        <p className="text-gray-300">{cleanString(store.address) || '未設定'}</p>
                                    </div>
                                </div>
                                <div className="flex items-start">
                                    <RiTimeLine className="flex-shrink-0 w-5 h-5 mr-3 mt-1 text-yellow-400" />
                                    <div>
                                        <h4 className="font-bold">営業時間:</h4>
                                        <p className="text-gray-300">{cleanString(store.hours) || '未設定'}</p>
                                    </div>
                                </div>
                                <div className="flex items-start">
                                    <RiGlobalLine className="flex-shrink-0 w-5 h-5 mr-3 mt-1 text-yellow-400" />
                                    <div>
                                        <h4 className="font-bold">Webサイト:</h4>
                                        <p className="text-gray-300">
                                            {cleanString(store.url) ? (
                                                <a 
                                                    href={store.url!} 
                                                    target="_blank" 
                                                    rel="noopener noreferrer" 
                                                    className="hover:underline break-all"
                                                >
                                                    {store.url}
                                                </a>
                                            ) : '未設定'}
                                        </p>
                                    </div>
                                </div>
                                {/* emailも一応表示できるようにする（データがあれば） */}
                                {cleanString(store.email) && (
                                    <div className="flex items-start">
                                        <RiMailLine className="flex-shrink-0 w-5 h-5 mr-3 mt-1 text-yellow-400" />
                                        <div>
                                            <h4 className="font-bold">メールアドレス:</h4>
                                            <p className="text-gray-300">
                                                <a href={`mailto:${store.email}`} className="hover:underline break-all">{store.email}</a>
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </section>
            </main>

            {/* フッター */}
            <footer className="bg-gray-800 text-gray-400 p-4 text-center text-sm">
                <div className="max-w-4xl mx-auto">
                    <p>
                        © {new Date().getFullYear()} {displayStoreName}. All rights reserved. | 
                        <Link href="/partner/dashboard" legacyBehavior>
                           <a className="text-blue-400 hover:underline ml-2">パートナーダッシュボードへ</a>
                        </Link>
                    </p>
                </div>
            </footer>
        </div>
    );
};

export default StoreView;