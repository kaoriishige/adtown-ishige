import { NextPage } from 'next';
import Head from 'next/head';
import { useState } from 'react';
import Link from 'next/link';

const ManageDealsPage: NextPage = () => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [price, setPrice] = useState('');
    const [originalPrice, setOriginalPrice] = useState('');
    const [type, setType] = useState('future-ticket');
    const [isLoading, setIsLoading] = useState(false);
    const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [message, setMessage] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setStatus('idle');
        setMessage('');

        try {
            const response = await fetch('/api/partner/submit-deal', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title, description, price, originalPrice, type }),
            });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || '登録に失敗しました。');
            }
            setStatus('success');
            setMessage('新しいチケットを登録しました！');
            // フォームをリセット
            setTitle(''); setDescription(''); setPrice(''); setOriginalPrice('');
        } catch (err: any) {
            setStatus('error');
            setMessage(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <Head>
                <title>チケットの作成・管理</title>
            </Head>
            <div className="max-w-2xl mx-auto p-4 pt-10">
                <h1 className="text-3xl font-bold text-center mb-6">チケットの作成・管理</h1>

                <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md space-y-4">
                    <div>
                        <label htmlFor="title" className="block text-sm font-medium text-gray-700">チケット名</label>
                        <input type="text" id="title" value={title} onChange={e => setTitle(e.target.value)} required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" placeholder="例：特製ラーメン1杯" />
                    </div>
                    <div>
                        <label htmlFor="description" className="block text-sm font-medium text-gray-700">説明</label>
                        <textarea id="description" value={description} onChange={e => setDescription(e.target.value)} required rows={4} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" placeholder="チケットの内容を詳しく説明してください。"></textarea>
                    </div>
                    <div>
                        <label htmlFor="price" className="block text-sm font-medium text-gray-700">販売ポイント数</label>
                        <input type="number" id="price" value={price} onChange={e => setPrice(e.target.value)} required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" placeholder="例: 800" />
                    </div>
                    <div>
                        <label htmlFor="originalPrice" className="block text-sm font-medium text-gray-700">通常価格（任意）</label>
                        <input type="number" id="originalPrice" value={originalPrice} onChange={e => setOriginalPrice(e.target.value)} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" placeholder="例: 1000" />
                    </div>
                    <div>
                        <label htmlFor="type" className="block text-sm font-medium text-gray-700">種類</label>
                        <select id="type" value={type} onChange={e => setType(e.target.value)} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 bg-white">
                            <option value="future-ticket">未来のチケット</option>
                            <option value="food-loss">フードロス削減</option>
                            <option value="donation">子ども食堂への寄付</option>
                        </select>
                    </div>

                    <button type="submit" disabled={isLoading} className="w-full py-3 text-lg font-bold text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition">
                        {isLoading ? '登録中...' : 'この内容でチケットを登録する'}
                    </button>

                    {status === 'success' && <p className="text-green-600">{message}</p>}
                    {status === 'error' && <p className="text-red-600">{message}</p>}
                </form>
                <div className="text-center mt-8">
                    <Link href="/partner/dashboard" className="text-blue-600 hover:underline">
                        パートナーダッシュボードへ戻る
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default ManageDealsPage;