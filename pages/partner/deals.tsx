import type { NextPage } from 'next';
import Link from 'next/link';
import { useState, ChangeEvent, FormEvent } from 'react';

// 仮のデータ型定義
type Deal = {
  id: string;
  title: string;
  type: 'お得情報' | 'クーポン' | 'フードロス';
  description: string;
  createdAt: string;
};

const DealsPage: NextPage = () => {
    const [dealType, setDealType] = useState<'お得情報' | 'クーポン' | 'フードロス'>('お得情報');
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');

    // 本来はAPIから取得する既存のお得情報リスト
    const [deals, setDeals] = useState<Deal[]>([
        { id: '1', title: '本日のランチセット100円引き！', type: 'クーポン', description: '画面提示で適用されます。', createdAt: '2025/09/07' },
        { id: '2', title: 'パンの詰め合わせ 30% OFF', type: 'フードロス', description: '閉店間際限定です。', createdAt: '2025/09/06' },
    ]);

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        const newDeal: Deal = {
            id: new Date().toISOString(),
            title,
            type: dealType,
            description,
            createdAt: new Date().toLocaleDateString('ja-JP'),
        };
        // ここにAPIを呼び出してデータを保存する処理を実装
        setDeals(prev => [newDeal, ...prev]);
        setTitle('');
        setDescription('');
        alert('新しい情報を登録しました！');
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <header className="bg-white shadow-sm">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <h1 className="text-2xl font-bold text-gray-900">お得情報・クーポン・フードロス管理</h1>
                </div>
            </header>

            <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* 新規登録フォーム */}
                <section className="bg-white p-8 rounded-lg shadow-sm mb-8">
                    <h2 className="text-xl font-bold text-gray-800 mb-4">新規登録</h2>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">種別</label>
                            <select value={dealType} onChange={(e) => setDealType(e.target.value as any)} className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm">
                                <option>お得情報</option>
                                <option>クーポン</option>
                                <option>フードロス</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">タイトル</label>
                            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} required className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">説明文</label>
                            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm" />
                        </div>
                        <div className="text-right">
                             <button type="submit" className="inline-flex justify-center py-2 px-6 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700">
                                登録する
                            </button>
                        </div>
                    </form>
                </section>

                {/* 登録済みリスト */}
                <section>
                    <h2 className="text-xl font-bold text-gray-800 mb-4">登録済みリスト</h2>
                    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                        <ul className="divide-y divide-gray-200">
                            {deals.map(deal => (
                                <li key={deal.id} className="p-4 flex justify-between items-center">
                                    <div>
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${deal.type === 'クーポン' ? 'bg-blue-100 text-blue-800' : deal.type === 'フードロス' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'}`}>
                                            {deal.type}
                                        </span>
                                        <p className="font-semibold text-gray-800 mt-1">{deal.title}</p>
                                        <p className="text-sm text-gray-500">{deal.description}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs text-gray-400">{deal.createdAt}</p>
                                        <button className="text-sm text-red-500 hover:text-red-700 mt-2">削除</button>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>
                </section>
                <div className="mt-8">
                   <Link href="/partner/dashboard" className="text-sm font-medium text-gray-600 hover:text-gray-900">
                        ← ダッシュボードに戻る
                    </Link>
                </div>
            </main>
        </div>
    );
};

export default DealsPage;