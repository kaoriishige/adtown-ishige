import { GetServerSideProps, NextPage } from 'next';
import Head from 'next/head';
import { useRouter } from 'next/router';
import React from 'react';
import { adminDb, adminAuth } from '@/lib/firebase-admin';
import nookies from 'nookies';
import {
    RiFlashlightFill,
    RiAddLine,
    RiMapPin2Fill,
    RiTimeLine,
    RiStore2Line,
    RiArrowLeftLine
} from 'react-icons/ri';

// 時間経過を表示するフォーマッター
const formatTimeAgo = (timestamp: number) => {
    const diff = Date.now() - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'たった今';
    if (minutes < 60) return `${minutes}分前`;
    if (hours < 24) return `${hours}時間前`;
    return `${days}日前`;
};

interface Post {
    id: string;
    storeName: string;
    itemName: string;
    price: string;
    imageUrl: string;
    description: string;
    authorName: string;
    createdAt: number;
}

interface HalfPriceIndexProps {
    initialPosts: Post[];
}

const HalfPriceIndexPage: NextPage<HalfPriceIndexProps> = ({ initialPosts }) => {
    const router = useRouter();

    return (
        <div className="min-h-screen bg-[#F8F9FA] pb-32 font-sans text-gray-900 text-left">
            <Head><title>爆安速報 - 那須アプリ</title></Head>

            {/* ヘッダーエリア */}
            <header className="bg-white border-b px-6 py-4 sticky top-0 z-50 shadow-sm">
                <div className="max-w-xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <button onClick={() => router.push('/premium/dashboard')} className="p-1 hover:bg-gray-100 rounded-full transition-colors">
                            <RiArrowLeftLine size={24} />
                        </button>
                        <div className="flex items-center gap-1">
                            <RiFlashlightFill className="text-orange-500" size={24} />
                            <h1 className="text-xl font-black tracking-tighter uppercase italic text-orange-600 leading-none">Flash Sale</h1>
                        </div>
                    </div>
                    <span className="text-[10px] font-bold bg-orange-100 text-orange-600 px-3 py-1 rounded-full">LIVE 那須</span>
                </div>
            </header>

            {/* メインフィード */}
            <main className="max-w-xl mx-auto px-4 pt-6 space-y-6">
                {initialPosts.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-[2rem] border-2 border-dashed border-gray-100">
                        <RiFlashlightFill size={48} className="mx-auto text-gray-200 mb-4" />
                        <p className="text-gray-400 font-bold">現在、爆安情報はありません</p>
                    </div>
                ) : (
                    initialPosts.map((post) => (
                        <div key={post.id} className="bg-white rounded-[2.5rem] overflow-hidden shadow-sm border border-gray-50 group">
                            {/* ビジュアルセクション */}
                            <div className="aspect-[4/3] relative overflow-hidden bg-gray-100">
                                <img
                                    src={post.imageUrl}
                                    alt={post.itemName}
                                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                />
                                <div className="absolute top-4 left-4">
                                    <div className="bg-orange-600 text-white text-xs font-black px-4 py-2 rounded-full shadow-lg flex items-center gap-1 border border-orange-400/20">
                                        <RiFlashlightFill /> {post.price}
                                    </div>
                                </div>
                                <div className="absolute bottom-4 right-4">
                                    <div className="bg-black/50 backdrop-blur-md text-white text-[10px] font-bold px-3 py-1.5 rounded-full flex items-center gap-1">
                                        <RiTimeLine size={12} />
                                        {formatTimeAgo(post.createdAt)}
                                    </div>
                                </div>
                            </div>

                            {/* コンテンツ詳細 */}
                            <div className="p-6 space-y-3">
                                <h2 className="text-xl font-black text-gray-900 leading-tight">{post.itemName}</h2>

                                <div className="flex items-center gap-2 text-orange-600 font-bold text-sm">
                                    <RiStore2Line size={18} />
                                    <span>{post.storeName}</span>
                                </div>

                                <p className="text-gray-500 text-sm font-medium leading-relaxed bg-gray-50 p-4 rounded-2xl border border-gray-100 whitespace-pre-wrap text-left">
                                    {post.description}
                                </p>

                                <div className="pt-2 flex items-center justify-between border-t border-gray-50">
                                    <div className="flex items-center gap-2">
                                        <div className="w-6 h-6 bg-orange-100 rounded-full flex items-center justify-center text-left">
                                            <span className="text-[10px] font-bold text-orange-600">{post.authorName ? post.authorName[0] : '匿'}</span>
                                        </div>
                                        <span className="text-[11px] font-bold text-gray-400">{post.authorName || '匿名ユーザー'}</span>
                                    </div>
                                    <button className="flex items-center gap-1 text-[11px] font-black text-blue-500 bg-blue-50 px-4 py-1.5 rounded-full active:scale-95 transition-transform">
                                        <RiMapPin2Fill size={12} /> 地図
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </main>

            {/* 画面下部中央に配置した「登録」ボタン */}
            <div className="fixed bottom-8 left-0 right-0 flex justify-center z-[100] px-6 pointer-events-none">
                <button
                    onClick={() => router.push('/premium/half-price/create')}
                    className="pointer-events-auto flex items-center gap-2 px-8 py-4 bg-gradient-to-br from-orange-500 to-red-600 text-white rounded-full shadow-[0_10px_30px_rgba(249,115,22,0.4)] active:scale-90 transition-all border border-orange-400/30"
                >
                    <RiAddLine size={24} />
                    <span className="font-black tracking-[0.2em] text-sm">登録</span>
                </button>
            </div>
        </div>
    );
};

export const getServerSideProps: GetServerSideProps = async (context) => {
    try {
        const cookies = nookies.get(context);
        const token = await adminAuth.verifySessionCookie(cookies.session || '', true);

        const snapshot = await adminDb.collection('half_price_alerts')
            .orderBy('createdAt', 'desc')
            .limit(20)
            .get();

        const initialPosts = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        return {
            props: {
                initialPosts: JSON.parse(JSON.stringify(initialPosts))
            }
        };
    } catch (err) {
        return { redirect: { destination: '/users/login', permanent: false } };
    }
};

export default HalfPriceIndexPage;