import { GetServerSideProps, NextPage } from 'next';
import Head from 'next/head';
import { useRouter } from 'next/router';
import React, { useState } from 'react';
import { adminDb, adminAuth } from '@/lib/firebase-admin';
import nookies from 'nookies';
import {
    RiArrowLeftLine,
    RiCameraFill,
    RiFlashlightFill,
    RiMapPin2Line,
    RiErrorWarningLine,
    RiPriceTag3Line,
    RiStore2Line
} from 'react-icons/ri';

interface CreateAlertProps {
    uid: string;
    userData: any;
}

const CreateAlertPage: NextPage<CreateAlertProps> = ({ uid, userData }) => {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [preview, setPreview] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        storeName: '',
        itemName: '',
        price: '',
        location: '',
        description: '',
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!preview) return alert('商品の写真を選択してください');

        setLoading(true);
        try {
            const res = await fetch('/api/premium/half-price/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    uid,
                    ...formData,
                    imageUrl: preview,
                    authorName: userData.nickname || '匿名ユーザー',
                    createdAt: Date.now(),
                }),
            });

            if (res.ok) {
                router.push('/premium/dashboard');
            } else {
                alert('投稿に失敗しました');
            }
        } catch (err) {
            alert('通信エラーが発生しました');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#FDFCFD] pb-24 font-sans text-gray-900">
            <Head><title>爆安情報を出す - 那須アプリ</title></Head>

            <header className="bg-white border-b px-6 py-4 sticky top-0 z-50">
                <div className="max-w-xl mx-auto flex items-center gap-4">
                    <button onClick={() => router.push('/premium/dashboard')} className="p-2 hover:bg-gray-100 rounded-full transition-all">
                        <RiArrowLeftLine size={24} />
                    </button>
                    <div className="flex items-center gap-2">
                        <RiFlashlightFill className="text-orange-500" size={20} />
                        <h1 className="text-lg font-black tracking-tighter uppercase italic text-orange-600">Post Sale</h1>
                    </div>
                </div>
            </header>

            <main className="max-w-xl mx-auto px-6 pt-8">
                <form onSubmit={handleSubmit} className="space-y-8">

                    <div className="space-y-3">
                        <label className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] px-2 flex items-center gap-2">
                            <RiCameraFill /> Step 1: 商品の写真
                        </label>
                        <div
                            onClick={() => setPreview('https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=800&auto=format&fit=crop')}
                            className="aspect-video bg-gray-50 border-2 border-dashed border-gray-200 rounded-[2rem] flex flex-col items-center justify-center cursor-pointer hover:bg-gray-100 transition-colors overflow-hidden"
                        >
                            {preview ? (
                                <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                            ) : (
                                <>
                                    <RiCameraFill size={40} className="text-gray-200 mb-2" />
                                    <span className="text-[10px] font-bold text-gray-400">タップして撮影・選択</span>
                                </>
                            )}
                        </div>
                    </div>

                    <div className="space-y-3">
                        <label className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] px-2 flex items-center gap-2">
                            <RiStore2Line /> Step 2: お店はどこ？
                        </label>
                        <input
                            required
                            placeholder="例：那須スーパー、〇〇直売所"
                            className="w-full p-5 bg-white border border-gray-100 rounded-2xl font-bold text-sm shadow-sm focus:ring-2 focus:ring-orange-500 outline-none"
                            value={formData.storeName}
                            onChange={(e) => setFormData({ ...formData, storeName: e.target.value })}
                        />
                    </div>

                    <div className="space-y-3">
                        <label className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] px-2 flex items-center gap-2">
                            <RiPriceTag3Line /> Step 3: 何がいくら？
                        </label>
                        <div className="flex gap-2">
                            <input
                                required
                                placeholder="商品名 (例: 牛肉半額)"
                                className="flex-[2] p-5 bg-white border border-gray-100 rounded-2xl font-bold text-sm shadow-sm outline-none"
                                value={formData.itemName}
                                onChange={(e) => setFormData({ ...formData, itemName: e.target.value })}
                            />
                            <input
                                required
                                placeholder="価格"
                                className="flex-1 p-5 bg-white border border-gray-100 rounded-2xl font-bold text-sm shadow-sm outline-none text-orange-600"
                                value={formData.price}
                                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="space-y-3">
                        <label className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] px-2 flex items-center gap-2">
                            <RiMapPin2Line /> Step 4: 詳しい場所や状況
                        </label>
                        <textarea
                            placeholder="例：レジ近くの特設コーナー。残り5個でした！"
                            className="w-full p-5 bg-white border border-gray-100 rounded-[2rem] font-bold text-sm h-32 shadow-sm outline-none focus:border-orange-500"
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        />
                    </div>

                    <div className="bg-orange-50 p-6 rounded-[2rem] border border-orange-100 flex gap-4">
                        <RiErrorWarningLine className="text-orange-500 shrink-0" size={24} />
                        <p className="text-[10px] font-bold text-orange-800 leading-relaxed">
                            爆安速報はスピードが命です。投稿内容は即座に公開されます。
                        </p>
                    </div>

                    <button
                        disabled={loading}
                        className="w-full bg-gradient-to-r from-orange-500 to-red-600 text-white py-5 rounded-[2rem] font-black shadow-xl shadow-orange-100 active:scale-[0.98] transition-all disabled:opacity-50"
                    >
                        {loading ? '投稿中...' : 'この情報を速報する'}
                    </button>
                </form>
            </main>
        </div>
    );
};

export const getServerSideProps: GetServerSideProps = async (context) => {
    try {
        const cookies = nookies.get(context);
        const token = await adminAuth.verifySessionCookie(cookies.session || '', true);
        const userDoc = await adminDb.collection('users').doc(token.uid).get();
        const userData = userDoc.data() || {};

        if (!userData.isPaid && userData.subscriptionStatus !== 'active') {
            return { redirect: { destination: '/premium/dashboard', permanent: false } };
        }

        return {
            props: {
                uid: token.uid,
                userData: JSON.parse(JSON.stringify(userData))
            }
        };
    } catch (err) {
        return { redirect: { destination: '/users/login', permanent: false } };
    }
};

export default CreateAlertPage;