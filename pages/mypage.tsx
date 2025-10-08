import { GetServerSideProps, NextPage } from 'next';
import Head from 'next/head';
import React from 'react';
import { adminDb, getUidFromCookie } from '../lib/firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';
import * as admin from 'firebase-admin';
import Link from 'next/link';

// ===============================
// 型定義
// ===============================
interface Bookmark {
    id: string;
    title: string;
    storeName: string;
    imageUrl?: string;
    type: 'deal' | 'flyer';
}

interface MyPageProps {
    userName: string;
    bookmarks: Bookmark[];
}

// ===============================
// メインページコンポーネント
// ===============================
const MyPage: NextPage<MyPageProps> = ({ userName, bookmarks }) => {
    const deals = bookmarks.filter(b => b.type === 'deal');
    const flyers = bookmarks.filter(b => b.type === 'flyer');

    return (
        <div className="min-h-screen bg-gray-100">
            <Head>
                <title>マイページ</title>
                <script src="https://cdn.tailwindcss.com"></script>
            </Head>
            <div className="max-w-4xl mx-auto p-4 sm:p-8">
                <header className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-800">マイページ</h1>
                    <p className="text-gray-600 mt-2">ようこそ、{userName}さん</p>
                </header>

                <section>
                    <h2 className="text-2xl font-semibold text-gray-700 mb-4">保存したお得情報</h2>
                    {deals.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {deals.map(deal => (
                                <Link key={deal.id} href={`/deals/${deal.id}`} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                                    {deal.imageUrl && <img src={deal.imageUrl} alt={deal.title} className="w-full h-32 object-cover" />}
                                    <div className="p-4">
                                        <h3 className="font-bold text-gray-800">{deal.title}</h3>
                                        <p className="text-sm text-gray-600 mt-1">{deal.storeName}</p>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    ) : (
                        <p className="text-gray-500 bg-white p-6 rounded-lg shadow-sm">保存したお得情報はありません。</p>
                    )}
                </section>

                <section className="mt-12">
                    <h2 className="text-2xl font-semibold text-gray-700 mb-4">保存したチラシ</h2>
                     {flyers.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {flyers.map(flyer => (
                                <Link key={flyer.id} href={`/flyers`} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                                     {flyer.imageUrl && <img src={flyer.imageUrl} alt={flyer.title} className="w-full h-48 object-cover" />}
                                    <div className="p-4">
                                        <h3 className="font-bold text-gray-800">{flyer.title}</h3>
                                        <p className="text-sm text-gray-600 mt-1">{flyer.storeName}</p>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    ) : (
                         <p className="text-gray-500 bg-white p-6 rounded-lg shadow-sm">保存したチラシはありません。</p>
                    )}
                </section>
            </div>
        </div>
    );
};

// ===============================
// サーバーサイド処理
// ===============================
export const getServerSideProps: GetServerSideProps = async (context) => {
    try {
        const uid = await getUidFromCookie(context);
        if (!uid) {
            return { redirect: { destination: '/login', permanent: false } };
        }

        const userDoc = await adminDb.collection('users').doc(uid).get();
        if (!userDoc.exists) {
             return { redirect: { destination: '/login', permanent: false } };
        }
        const userName = userDoc.data()?.displayName || 'ゲスト';

        // --- ブックマークされたお得情報を取得 ---
        const bookmarkedDealsSnapshot = await adminDb.collection('users').doc(uid).collection('bookmarkedDeals').get();
        const dealIds = bookmarkedDealsSnapshot.docs.map((doc: admin.firestore.QueryDocumentSnapshot) => doc.id);
        
        // --- ブックマークされたチラシを取得 ---
        const bookmarkedFlyersSnapshot = await adminDb.collection('users').doc(uid).collection('bookmarkedFlyers').get();
        const flyerIds = bookmarkedFlyersSnapshot.docs.map((doc: admin.firestore.QueryDocumentSnapshot) => doc.id);

        const bookmarks: Bookmark[] = [];

        // お得情報の詳細を取得
        if (dealIds.length > 0) {
            const dealsSnapshot = await adminDb.collection('deals').where(admin.firestore.FieldPath.documentId(), 'in', dealIds).get();
            dealsSnapshot.forEach((doc: admin.firestore.QueryDocumentSnapshot) => {
                const data = doc.data();
                bookmarks.push({
                    id: doc.id,
                    title: data.title || '無題',
                    storeName: data.storeName || '店舗不明',
                    imageUrl: data.imageUrl || null,
                    type: 'deal',
                });
            });
        }
        
        // チラシ情報の詳細を取得
        if (flyerIds.length > 0) {
            const flyersSnapshot = await adminDb.collection('flyers').where(admin.firestore.FieldPath.documentId(), 'in', flyerIds).get();
            flyersSnapshot.forEach((doc: admin.firestore.QueryDocumentSnapshot) => {
                const data = doc.data();
                bookmarks.push({
                    id: doc.id,
                    title: data.title || '無題',
                    storeName: data.storeName || '店舗不明',
                    imageUrl: data.imageUrl || null,
                    type: 'flyer',
                });
            });
        }

        return {
            props: {
                userName,
                bookmarks,
            },
        };

    } catch (error) {
        console.error("Error fetching mypage data:", error);
        return {
            props: {
                userName: 'ゲスト',
                bookmarks: [],
            },
        };
    }
};

export default MyPage;