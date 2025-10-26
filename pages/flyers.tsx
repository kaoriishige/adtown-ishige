import { GetServerSideProps, NextPage } from 'next';
import Head from 'next/head';
import Script from 'next/script'; // 💡 修正 1: next/script をインポート
import React from 'react';
// ★★★ 修正箇所: importのパスを修正（仮に正しいものとして維持） ★★★
import { adminDb } from '../lib/firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';
import * as admin from 'firebase-admin';

// ===============================
// 型定義
// ===============================
interface Flyer {
    id: string;
    title: string;
    imageUrl: string;
    storeName: string;
    publishedAt: string;
}

interface FlyersProps {
    flyers: Flyer[];
}

// ===============================
// メインページコンポーネント
// ===============================
const FlyersPage: NextPage<FlyersProps> = ({ flyers }) => {
    return (
        <div className="min-h-screen bg-gray-100 p-4 sm:p-8">
            <Head>
                <title>{"チラシ情報"}</title>
                {/* 削除: <script src="https://cdn.tailwindcss.com"></script> */}
            </Head>
            
            {/* 💡 修正 2: Tailwind CSS CDNを <Script> コンポーネントで非同期読み込み */}
            {/* beforeInteractive戦略で、ページがハイドレーションされる前に読み込む */}
            <Script
                src="https://cdn.tailwindcss.com"
                strategy="beforeInteractive"
            />
            
            <div className="max-w-4xl mx-auto">
                <header className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-800">最新のチラシ情報</h1>
                    <p className="text-gray-500 mt-2">地域のお得な情報をお見逃しなく！</p>
                </header>

                {flyers.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {flyers.map((flyer) => (
                            <div key={flyer.id} className="bg-white rounded-lg shadow-md overflow-hidden">
                                <img src={flyer.imageUrl} alt={flyer.title} className="w-full h-48 object-cover" />
                                <div className="p-4">
                                    <h2 className="text-lg font-bold text-gray-800">{flyer.title}</h2>
                                    <p className="text-sm text-gray-600 mt-1">{flyer.storeName}</p>
                                    <p className="text-xs text-gray-400 mt-2">掲載日: {flyer.publishedAt}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-16 bg-white rounded-lg shadow-md">
                        <p className="text-gray-500">現在、掲載されているチラシはありません。</p>
                    </div>
                )}
            </div>
        </div>
    );
};

// ===============================
// サーバーサイド処理
// ===============================
export const getServerSideProps: GetServerSideProps = async () => {
    try {
        // 🚨 Note: FirestoreのorderByを使用する場合、フィールド（'publishedAt'）に対して
        // indexが設定されていないと、実行時にエラーになる可能性があります。
        // Next.jsのプロジェクト構造から、Firebase Admin SDKが使用されていることが推測されます。
        const flyersSnapshot = await adminDb.collection('flyers')
            .where('published', '==', true)
            .orderBy('publishedAt', 'desc')
            .get();

        const storesSnapshot = await adminDb.collection('stores').get();
        const storeNames: { [key: string]: string } = {};
        storesSnapshot.docs.forEach((doc: admin.firestore.QueryDocumentSnapshot) => {
            storeNames[doc.id] = doc.data().name || '店舗名不明';
        });

        const flyers = flyersSnapshot.docs.map((doc: admin.firestore.QueryDocumentSnapshot) => {
            const data = doc.data();
            const publishedAt = data.publishedAt as Timestamp;
            return {
                id: doc.id,
                title: data.title || '無題のチラシ',
                imageUrl: data.imageUrl || '',
                storeName: storeNames[data.storeId] || '店舗名不明',
                publishedAt: publishedAt.toDate().toLocaleDateString('ja-JP'),
            };
        });

        return {
            props: {
                flyers,
            },
        };
    } catch (error) {
        console.error("Error fetching flyers:", error);
        return {
            props: {
                flyers: [],
            },
        };
    }
};

export default FlyersPage;