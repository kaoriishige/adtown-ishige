import { GetServerSideProps, NextPage } from 'next';
import Head from 'next/head';
import { useRouter } from 'next/router';
import React, { useEffect } from 'react';
import Link from 'next/link';
import Error from 'next/error';
// Ri Icons
import { RiMapPinLine, RiGlobalLine, RiTimeLine, RiPhoneLine, RiMailLine, RiStarFill, RiCheckboxCircleFill, RiCheckLine, RiFocus2Line, RiTwitterXLine, RiInstagramLine, RiFacebookBoxLine, RiYoutubeLine, RiExternalLinkLine } from 'react-icons/ri';
import { FaLine, FaAngleRight, FaTiktok } from 'react-icons/fa'; // LINE, アイコン用
import { adminDb } from '@/lib/firebase-admin'; // Firestore Admin SDK (サーバーサイド用)
import type { Firestore, QueryDocumentSnapshot } from 'firebase-admin/firestore';


// =========================================================================
// 1. CONSTANTS AND DUMMY DATA
// =========================================================================

// (APP_ID の定義はサーバーサイドでは機能しないため、コメントアウトまたは削除)
// declare const __app_id: string;
// const APP_ID = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

// ******************************************************
// DUMMY DATA FOR FALLBACK (データが存在しない場合に備えて、最低限の情報を持つ)
// ******************************************************
const DUMMY_STORE_DATA: StoreData = {
    id: 'fallback-id', name: '【データ未登録/エラー】', mainCategory: '情報不足',
    tagline: 'プロフィールに情報がありません。入力してください。', description: null, images: [],
    address: null, phoneNumber: null, email: null, url: null, lineLiffUrl: null, hours: null,
    ownerId: 'dummy-owner-uid', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    isPublished: false, specialtyPoints: [], averageRating: 0, reviewCount: 0,
    matchingValues: [], snsUrls: [], // LPに表示するために型を追加
};

// **実行時エラー回避のためのダミー実装 (TypeScriptエラー回避のため残します)**
const createFirestoreDummyReference = (isDoc = false): any => {
    const ref: any = {
        collection: (name: string) => createFirestoreDummyReference(false),
        collectionGroup: (name: string) => ref,
        doc: (id: string) => createFirestoreDummyReference(true),
        where: (field: string, op: string, value: any) => ref,
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
        path: 'dummy/path'
    };
    return ref;
};

// ===============================
// 2. TYPE DEFINITIONS
// ===================================

// ★★★ 修正点1: 「3つの強み」の型をオブジェクトに変更 ★★★
interface SpecialtyPoint {
    title: string;
    description: string;
}

interface StoreData {
    id: string; name: string; mainCategory: string; tagline: string | null; description: string | null;
    images: string[]; address: string | null; phoneNumber: string | null; email: string | null;
    url: string | null; lineLiffUrl?: string | null; hours: string | null; ownerId: string;
    createdAt: string; updatedAt: string; isPublished: boolean;
    specialtyPoints: SpecialtyPoint[]; // ★ 型を string[] から SpecialtyPoint[] に変更
    averageRating: number; reviewCount: number;
    matchingValues: string[]; // LPに表示するために型を追加
    snsUrls: string[]; // SNS URLの配列
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

// ★★★ 編集画面のカテゴリ定義を忠実に再現 (LP表示用) ★★★
// (変更なし)
interface MatchingCategory {
    title: string;
    options: string[];
}
const ALL_MATCHING_VALUES: MatchingCategory[] = [
    {
        title: "専門性・実績", options: [
            '特定の分野（経営、Web、人事）に特化',
            '豊富な実績・具体的な成功事例',
            '業界・業種への深い理解',
            '最新の知識・情報に精通',
            '的確な課題分析・診断力',
        ]
    },
    {
        title: "提案力・解決力", options: [
            '机上の空論でなく実行可能な提案',
            '企業の課題・本質を的確に把握',
            '複数の解決策・選択肢を提示',
            '期待を超えるアイデア・付加価値の提供',
            '成果（売上・コスト削減）にコミット',
        ]
    },
    {
        title: "ヒアリング力・伴走力", options: [
            '経営者の悩み・ビジョンを深くヒアリング',
            '親身になって相談に乗ってくれる',
            '専門用語を使わず分かりやすく説明',
            '実行まで伴走・サポート',
            '社内スタッフへの研修・指導',
        ]
    },
    {
        title: "価格の透明性・適正さ", options: [
            '料金体系（顧問、プロジェクト）が明確',
            '事前に詳細な見積もりを提示',
            '価格以上の価値がある',
            '予算に応じたプランを提案',
            '各種補助金・助成金の活用を提案',
        ]
    },
    {
        title: "人物・信頼感", options: [
            '話しやすく相談しやすい人柄',
            '長期的なパートナーとして信頼できる',
            'レスポンスが早く丁寧',
            '秘密厳守・誠実な対応',
            '地元（那須）の経済・事情に精通',
        ]
    }
];
// ★★★ 編集画面のカテゴリ定義ここまで ★★★


// ===============================
// 3. SERVER SIDE LOGIC (getServerSideProps) - 404エラー対策適用済み
// ===================================

export const getServerSideProps: GetServerSideProps<StoreViewProps> = async ({ query }) => {
    const { storeId } = query;

    if (!storeId || typeof storeId !== 'string') {
        return { props: { store: null, error: 'Invalid Store ID' } };
    }

    try {
        const dbInstance = (adminDb && (adminDb as any).collection) ? (adminDb as Firestore) : (createFirestoreDummyReference() as Firestore);
        const dbRef: Firestore = dbInstance;

        let storeDoc: QueryDocumentSnapshot | undefined = undefined;

        console.log(`[getServerSideProps] Searching collectionGroup("stores") for storeId: ${storeId}`);

        const storesQuery = dbRef.collectionGroup("stores");
        const querySnapshot = await storesQuery.get();

        storeDoc = querySnapshot.docs.find(doc => doc.id === storeId);

        if (!storeDoc) {
            console.log(`[CollectionGroup Search] Store ID ${storeId} not found across all users. (No match found)`);
            return { notFound: true };
        }

        const rawData = storeDoc.data();

        const foundStoreId = storeDoc.id;
        const foundOwnerId = rawData.ownerId || DUMMY_STORE_DATA.ownerId;
        const descriptionText = cleanString(rawData.description) || '';

        const hoursMatch = descriptionText.match(/【営業時間】([\s\S]+?)(?=【|\s*$)/);

        // ★★★ 修正点2: 読み込みロジックを変更 (古いstring[]にも対応) ★★★
        const loadedSpecialtyPoints = rawData.specialtyPoints || [];
        let formattedSpecialtyPoints: SpecialtyPoint[];

        if (loadedSpecialtyPoints.length > 0 && typeof loadedSpecialtyPoints[0] === 'string') {
            // 古い形式 (string[]) から新しい形式 (SpecialtyPoint[]) に変換
            formattedSpecialtyPoints = (loadedSpecialtyPoints as string[]).map((title: string) => ({
                title: title,
                description: '', // 古いデータには説明がないため空にする
            }));
        } else {
            // 新しい形式 (SpecialtyPoint[])
            formattedSpecialtyPoints = loadedSpecialtyPoints;
        }
        // ★★★ 修正ここまで ★★★

        const mergedData: StoreData = {
            id: foundStoreId,
            name: cleanString(rawData.storeName) || cleanString(rawData.name) || DUMMY_STORE_DATA.name,
            address: cleanString(rawData.address),
            phoneNumber: cleanString(rawData.phoneNumber) || cleanString(rawData.tel),
            mainCategory: cleanString(rawData.mainCategory) || DUMMY_STORE_DATA.mainCategory,
            tagline: cleanString(rawData.tagline),
            description: descriptionText,
            specialtyPoints: formattedSpecialtyPoints, // ★ 修正したデータをセット
            url: cleanString(rawData.websiteUrl || rawData.url),
            lineLiffUrl: cleanString(rawData.lineLiffUrl),
            images: cleanString(rawData.mainImageUrl)
                ? [cleanString(rawData.mainImageUrl)!, ...rawData.galleryImageUrls || []].filter((url: string) => url)
                : [],
            email: cleanString(rawData.email),
            hours: hoursMatch ? hoursMatch[1].trim() : cleanString(rawData.hours),
            ownerId: foundOwnerId,
            isPublished: rawData.isPublished ?? DUMMY_STORE_DATA.isPublished,
            averageRating: rawData.averageRating || 0,
            reviewCount: rawData.reviewCount || 0,
            createdAt: safeToISOString(rawData.createdAt, DUMMY_STORE_DATA.createdAt),
            updatedAt: safeToISOString(rawData.updatedAt, DUMMY_STORE_DATA.updatedAt),
            matchingValues: rawData.matchingValues || [],
            snsUrls: rawData.snsUrls || [],
        };

        let warning = null;
        if (!cleanString(mergedData.name)) {
            warning = `【警告】店舗名が未登録です。`;
        } else if (mergedData.images.length === 0) {
            warning = `【警告】メイン画像が未登録です。`;
        }

        return { props: { store: mergedData, error: warning } };

    } catch (err) {
        console.error('Data fetching critical error:', err);
        return { notFound: true };
    }
};

// ===============================
// 4. HELPER COMPONENTS (LPデザイン用)
// ===================================

/**
 * ★★★ 修正点（追加）: テキスト整形関数 ★★★
 * (変更なし)
 */
const formatLongText = (text: string | null | undefined): JSX.Element => {
    if (!text) return <></>;

    const lines = text.split('\n').filter(line => line.trim() !== '');
    let listItems: string[] = [];
    const elements: JSX.Element[] = [];
    let currentKey = 0;

    const pushList = () => {
        if (listItems.length > 0) {
            elements.push(
                <ul key={`list-${currentKey++}`} className="list-disc list-inside pl-4 my-4 space-y-2">
                    {listItems.map((item, itemIndex) => (
                        <li key={itemIndex} className="text-lg text-gray-700 leading-relaxed">{item}</li>
                    ))}
                </ul>
            );
            listItems = []; // リストをリセット
        }
    };

    lines.forEach(line => {
        const trimmedLine = line.trim();
        if (trimmedLine.startsWith('■') || trimmedLine.startsWith('●')) {
            listItems.push(trimmedLine.substring(1).trim());
        } else {
            pushList(); // もし直前までリストが続いていたら、ここでリストを出力
            elements.push(
                <p key={`p-${currentKey++}`} className="mb-4 text-lg text-gray-700 leading-relaxed">{trimmedLine}</p>
            );
        }
    });

    pushList();

    return <>{elements}</>;
};

/**
 * SNSアイコンを取得するヘルパー関数
 */
const getSnsIcon = (url: string) => {
    const lowercaseUrl = url.toLowerCase();
    if (lowercaseUrl.includes('instagram.com')) return <RiInstagramLine className="w-5 h-5 mr-3 mt-1 text-pink-500" />;
    if (lowercaseUrl.includes('twitter.com') || lowercaseUrl.includes('x.com')) return <RiTwitterXLine className="w-5 h-5 mr-3 mt-1 text-gray-900" />;
    if (lowercaseUrl.includes('facebook.com')) return <RiFacebookBoxLine className="w-5 h-5 mr-3 mt-1 text-blue-600" />;
    if (lowercaseUrl.includes('youtube.com') || lowercaseUrl.includes('youtu.be')) return <RiYoutubeLine className="w-5 h-5 mr-3 mt-1 text-red-600" />;
    if (lowercaseUrl.includes('tiktok.com')) return <FaTiktok className="w-5 h-5 mr-3 mt-1 text-black" />;
    return <RiExternalLinkLine className="w-5 h-5 mr-3 mt-1 text-gray-500" />;
};

/**
 * SNS名の表示名を取得するヘルパー関数
 */
const getSnsName = (url: string) => {
    const lowercaseUrl = url.toLowerCase();
    if (lowercaseUrl.includes('instagram.com')) return 'Instagram';
    if (lowercaseUrl.includes('twitter.com') || lowercaseUrl.includes('x.com')) return 'Twitter(X)';
    if (lowercaseUrl.includes('facebook.com')) return 'Facebook';
    if (lowercaseUrl.includes('youtube.com') || lowercaseUrl.includes('youtu.be')) return 'YouTube';
    if (lowercaseUrl.includes('tiktok.com')) return 'TikTok';
    return 'SNS/他リンク';
};


// LINE CTAボタンコンポーネント (変更なし)
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
        <span className="text-sm text-gray-500 italic text-center p-4">LINE連携URLが未登録です。</span>
    )
);

// 店舗紹介文をブロックに分割するヘルパー (変更なし)
const parseDescription = (description: string) => {
    if (!description) return [];

    const blocks: { title: string; content: string }[] = [];
    let parts = description.split(/【(.+?)】/g).filter(p => p.trim());

    if (parts.length > 0 && !description.trim().startsWith('【')) {
        blocks.push({ title: "店舗の紹介", content: parts[0].trim() });
        parts = parts.slice(1);
    }

    for (let i = 0; i < parts.length; i += 2) {
        const title = parts[i].trim();
        if (title === '営業時間') continue;

        const content = (parts[i + 1] || '').trim();
        if (title && content) { blocks.push({ title, content }); }
    }

    return blocks.map(block => ({ ...block, content: block.content.trim() }));
};


// ===============================
// 5. MAIN COMPONENT (StoreView)
// ===================================

// ★★★ renderMatchingValues (変更なし) ★★★
// (このコンポーネントは、元から文字列の配列 "matchingValues" を扱うため、変更不要です)
const renderMatchingValues = (matchingValues: string[]) => {
    if (!matchingValues || matchingValues.length === 0) return null;

    const selectedSet = new Set(matchingValues);
    const allOptionsSet = new Set(ALL_MATCHING_VALUES.flatMap(group => group.options));
    const customValues = matchingValues.filter(v => !allOptionsSet.has(v));
    const groupedSelectedValues: { title: string, options: string[] }[] = [];

    ALL_MATCHING_VALUES.forEach(group => {
        const selectedOptions = group.options.filter(value => selectedSet.has(value));
        if (selectedOptions.length > 0) {
            groupedSelectedValues.push({
                title: group.title,
                options: selectedOptions
            });
        }
    });

    if (groupedSelectedValues.length === 0 && customValues.length === 0) return null;

    const MatchingValueItem = ({ value }: { value: string }) => (
        <span className="bg-indigo-600 text-white shadow-md font-medium border-indigo-600 p-2 rounded-md flex items-center text-sm sm:text-base">
            <RiCheckLine className="w-4 h-4 mr-2 flex-shrink-0" />
            {value}
        </span>
    );

    return (
        <div className="border-4 border-indigo-500 p-4 md:p-6 rounded-xl bg-indigo-50 shadow-xl mt-8">
            <h2 className="text-xl md:text-2xl font-black text-indigo-800 mb-4 flex items-center">
                <RiFocus2Line className="w-6 h-6 mr-2" />
                AIマッチング用 サービス（目的）別価値観登録
            </h2>
            <p className="text-sm text-gray-700 mb-6 border-b pb-3">
                小分類「<span className="font-semibold text-indigo-700">コンサルティング</span>」に基づき、貴店で**選択された強み**を表示しています。
                <span className="font-bold text-red-600 ml-1">({matchingValues.length} 個選択済み)</span>
            </p>

            {groupedSelectedValues.map((group, groupIndex) => (
                <div key={groupIndex} className="mb-6 p-4 bg-white rounded-lg shadow-sm">
                    <h3 className="font-bold text-indigo-700 mb-3">{group.title}</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {group.options.map((value, optionIndex) => (
                            <MatchingValueItem
                                key={optionIndex}
                                value={value}
                            />
                        ))}
                    </div>
                </div>
            ))}

            {customValues.length > 0 && (
                <div className="mt-6 pt-4 border-t border-indigo-200">
                    <h3 className="font-bold text-indigo-700 mb-3">
                        その他（自由入力）
                    </h3>
                    <p className="text-sm text-gray-600 mb-3">
                        カスタムで登録された強み:
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {customValues.map((v, i) => (
                            <MatchingValueItem
                                key={`custom-${i}`}
                                value={v}
                            />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};
// ★★★ renderMatchingValues 定義ここまで ★★★


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

    // ★★★ 修正点3: 「3つの強み」のフィルターロジックを修正 ★★★
    // p (オブジェクト) の title (文字列) が空でないことを確認する
    const displaySpecialtyPoints = store.specialtyPoints.filter(p => p && p.title && p.title.trim() !== '');

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
                <div className="max-w-4xl mx-auto px-4 py-3 flex justify-between items-center">
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
                {/* ★★★ 修正点4: JSXの表示ロジックを変更 ★★★ */}
                {displaySpecialtyPoints.length > 0 && (
                    <section className="py-16 bg-gray-50">
                        <div className="max-w-4xl mx-auto px-4">
                            <h2 className="text-3xl font-extrabold text-center mb-12 text-gray-900">
                                {displayStoreName}の<span className="text-blue-600">強み・こだわり</span>
                            </h2>
                            <div className={`grid grid-cols-1 md:grid-cols-3 gap-8 justify-center`}>
                                {displaySpecialtyPoints.slice(0, 3).map((point, i) => (
                                    <div key={i} className="text-center p-6 bg-white rounded-xl shadow-lg border-t-4 border-blue-600">
                                        <RiCheckboxCircleFill className="w-8 h-8 mx-auto text-blue-500 mb-3" />

                                        {/* ★ ここを修正: {point} -> {point.title} */}
                                        <h3 className="text-xl font-bold mb-3 text-gray-900">{point.title}</h3>

                                        {/* ★ ここを修正: ハードコードされたPタグ -> {point.description} を表示 */}
                                        <p className="text-sm text-gray-600">
                                            {point.description || 'プロフィールで設定された貴店の最も重要な強みです。'}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </section>
                )}

                {/* 3. AIマッチング用 サービス（目的）別価値観登録 セクションの追加 */}
                {(store.matchingValues && store.matchingValues.length > 0) && (
                    <section className="py-16 bg-indigo-50 border-t-4 border-indigo-200">
                        <div className="max-w-4xl mx-auto px-4">
                            {renderMatchingValues(store.matchingValues)}
                        </div>
                    </section>
                )}


                {/* 4. CORE SERVICE DESCRIPTION - サービス詳細/店舗紹介 */}
                {contentBlocks.length > 0 ? (
                    <section className="py-20 bg-white">
                        <div className="max-w-4xl mx-auto px-4">
                            <h2 className="text-3xl font-extrabold text-center mb-12 text-gray-900">
                                {displayMainCategory}に関する詳細情報・コンセプト
                            </h2>

                            <div className="space-y-10">
                                {contentBlocks.map(({ title, content }, i) => (
                                    <div key={i} className="border-b pb-8">
                                        <h3 className="text-2xl font-extrabold text-blue-800 mb-6 flex items-center">
                                            <FaAngleRight className="w-5 h-5 mr-3 flex-shrink-0 text-yellow-500" />
                                            {title}
                                        </h3>
                                        <div className="pl-8 border-l-4 border-gray-200">
                                            {/* (変更なし) formatLongTextが自動で整形 */}
                                            {formatLongText(content)}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* ギャラリー (変更なし) */}
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
                ) : (
                    // descriptionが空か、parseDescriptionでブロックが0個だった場合の警告
                    <section className="py-20 bg-gray-50">
                        <div className="max-w-4xl mx-auto px-4">
                            <div className="text-center text-gray-600 italic p-8 border rounded-lg bg-white">
                                <p className="font-semibold">【重要】詳細な店舗・サービス紹介文が未登録です。</p>
                                <p className="text-sm mt-2">プロフィール編集画面で、お客様に伝えたい情報（営業時間、特徴、こだわりなど）を記入してください。</p>
                            </div>
                        </div>
                    </section>
                )}


                {/* 5. CONTACT & INFO - 最終CTAと基本情報 (変更なし) */}
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
                            subText={cleanString(store.lineLiffUrl) ? "無料で簡単に予約・問合せが可能です" : "LINE連携URLが未登録です"}
                            className="w-full sm:w-2/3 mx-auto max-w-md animate-pulse-slow"
                            isPrimary={true}
                        />

                        {/* 基本情報ブロック */}
                        <div className="mt-12 pt-8 border-t border-blue-700 text-left">
                            <h3 className="text-xl font-bold mb-4">連絡先・基本情報</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">

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
                                        <p className="text-gray-300 whitespace-pre-wrap break-words">
                                            {cleanString(store.hours) || '未設定'}
                                        </p>
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
                                {store.snsUrls && store.snsUrls.map((url, index) => (
                                    <div key={index} className="flex items-start">
                                        {getSnsIcon(url)}
                                        <div>
                                            <h4 className="font-bold">{getSnsName(url)}:</h4>
                                            <p className="text-gray-300">
                                                <a
                                                    href={url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="hover:underline break-all"
                                                >
                                                    {url}
                                                </a>
                                            </p>
                                        </div>
                                    </div>
                                ))}
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