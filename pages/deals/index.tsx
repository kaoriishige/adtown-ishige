import { GetServerSideProps, NextPage } from 'next';
import Link from 'next/link';
import Head from 'next/head';
import { useRouter } from 'next/router'; 
import { adminDb } from '@/lib/firebase-admin'; // 🚨 パスを確認
import React from 'react';
import { MapPin, Tag, ArrowLeft, ArrowRight, DollarSign, Store, Loader2, MessageSquare } from 'lucide-react'; 
import { FieldPath } from 'firebase-admin/firestore'; 

// --- 型定義 ---
interface StoreSummary {
    id: string;
    storeName: string;
    mainCategory: string;
    subCategory: string;
    area: string;
    address: string;
    couponCount: number; // 💡 クーポン件数を表示
    landingPageUrl: string; 
}

interface DealsListPageProps {
    stores: StoreSummary[];
    mainCategory: string;
    subCategory: string;
    area: string;
    error: string | null;
}

// ----------------------------------------------------------------------
// サーバーサイドデータ取得 (クエリパラメータでのフィルタリング)
// ----------------------------------------------------------------------
export const getServerSideProps: GetServerSideProps = async (context) => {
    // クエリパラメータから情報を取得
    const mainCategory = context.query.main as string;
    const area = context.query.area as string;
    const subCategory = context.query.sub as string || 'すべて';

    if (!mainCategory || !area) {
        return { props: { stores: [], mainCategory: '不明', subCategory: subCategory, area: '不明', error: "カテゴリまたはエリア情報が不足しています。" } };
    }
    
    // エリアとカテゴリ名のデコード (URLエンコード対策)
    const decodedArea = decodeURIComponent(area);
    const decodedMain = decodeURIComponent(mainCategory);

    try {
        // 1. stores コレクションからデータを取得するためのクエリを構築
        let query = adminDb.collection('stores')
            .where('status', 'in', ['approved', 'active']) // 公開中の店舗のみ
            .where('mainCategory', '==', decodedMain)
            .where('area', '==', decodedArea);
            
        // 'すべて' ではない場合のみ、subCategoryでフィルタリングを追加
        if (subCategory && subCategory !== 'すべて' && subCategory !== 'すべて' /* 重複チェック */) {
             query = query.where('subCategory', '==', subCategory);
        }
        
        // 🚨 複合インデックスが必須: status (A), mainCategory (A), area (A), subCategory (A)
        const storesSnap = await query.get();

        const stores: StoreSummary[] = storesSnap.docs.map(doc => {
            const data = doc.data();
            
            return {
                id: doc.id,
                storeName: data.storeName || '店舗名未登録',
                mainCategory: decodedMain,
                subCategory: data.subCategory || subCategory,
                area: decodedArea,
                address: data.address || '住所不明',
                couponCount: data.couponCount || 0, // 💡 deals コレクションから取得が必要
                // 💡 ランディングページへのリンク (動的ルーティングを使用)
                landingPageUrl: `/deals/store/${doc.id}`, 
            };
        });

        return { 
            props: { 
                stores, 
                mainCategory: decodedMain, 
                subCategory: subCategory, 
                area: decodedArea, 
                error: null 
            } 
        };

    } catch (err: any) {
        console.error("Deals List SSR Error:", err);
        return { 
            props: { 
                stores: [], 
                mainCategory: decodedMain, 
                subCategory: subCategory, 
                area: decodedArea, 
                error: `データ取得中に予期せぬエラーが発生しました: ${err.message}. インデックスまたはセキュリティルールを確認してください。` 
            } 
        };
    }
};

// ----------------------------------------------------------------------
// ページコンポーネント (UI)
// ----------------------------------------------------------------------
const DealsListPage: NextPage<DealsListPageProps> = ({ stores, mainCategory, subCategory, area, error }) => {
    const router = useRouter();

    if (error) {
        return <div className="min-h-screen p-10 text-red-600 bg-red-50">{error}</div>;
    }

    // UI表示用のカテゴリテキスト
    const categoryText = subCategory === 'すべて' ? mainCategory : `${mainCategory} > ${subCategory}`;

    return (
        <div className="min-h-screen bg-gray-50">
            <Head><title>{area} の店舗一覧 | {mainCategory}</title></Head>
            
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                
                <button 
                    onClick={() => router.back()}
                    className="text-indigo-600 hover:underline flex items-center mb-6"
                >
                    <ArrowLeft size={18} className="mr-2" /> エリア選択に戻る
                </button>

                <h1 className="text-3xl font-bold text-gray-900 mb-2">{area} の店舗一覧</h1>
                <p className="text-sm text-gray-600 mb-6">
                    カテゴリ: <strong className="text-indigo-600">{categoryText}</strong>
                </p>

                {stores.length === 0 ? (
                    <div className="p-10 text-center bg-white rounded-xl shadow-lg">
                        <p className="text-lg text-gray-600">この条件に一致する店舗は見つかりませんでした。</p>
                        <p className="text-sm text-gray-500 mt-2">（カテゴリ、またはエリアを変更してお試しください）</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {stores.map((store) => (
                            <Link href={store.landingPageUrl} key={store.id} legacyBehavior>
                                <a 
                                    className="block bg-white p-6 rounded-xl shadow-lg border border-gray-100 hover:shadow-xl hover:border-indigo-400 transition-all"
                                >
                                    <div className="flex justify-between items-start">
                                        <h2 className="text-xl font-bold text-gray-900">{store.storeName}</h2>
                                        {store.couponCount > 0 && (
                                            <span className="text-sm font-bold text-green-700 bg-green-100 px-3 py-1 rounded-full flex items-center">
                                                <DollarSign size={16} className='mr-1' /> クーポン {store.couponCount} 件あり
                                            </span>
                                        )}
                                    </div>

                                    <div className="mt-3 text-sm text-gray-600 space-y-1">
                                        <div className="flex items-center">
                                            <MapPin size={16} className="mr-2 text-red-500" />
                                            {store.address}
                                        </div>
                                        <div className="flex items-center">
                                            <Tag size={16} className="mr-2 text-blue-500" />
                                            {store.subCategory}
                                        </div>
                                    </div>
                                    <div className="mt-4 flex justify-end text-indigo-600 font-semibold items-center">
                                        店舗詳細へ <ArrowRight size={18} className="ml-1" />
                                    </div>
                                </a>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default DealsListPage;
