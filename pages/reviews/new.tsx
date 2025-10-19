import { NextPage } from 'next';
import Head from 'next/head';
import { useState } from 'react';
import { useRouter } from 'next/router';

const NewReviewPage: NextPage = () => {
    const [text, setText] = useState('');
    const [image, setImage] = useState<File | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [isSuccess, setIsSuccess] = useState(false);
    const router = useRouter();

    // 仮の店舗情報。本来は店舗ページなどから渡される
    const storeInfo = { id: 'dummyStoreId', name: 'レストラン那須' };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!image) {
            setMessage('写真を選択してください。');
            return;
        }
        setIsLoading(true);
        setMessage('');

        const formData = new FormData();
        formData.append('storeId', storeInfo.id);
        formData.append('storeName', storeInfo.name);
        formData.append('text', text);
        formData.append('image', image);

        try {
            const response = await fetch('/api/reviews/submit', {
                method: 'POST',
                body: formData,
            });
            const data = await response.json();
            if (!response.ok) { throw new Error(data.error || '投稿に失敗しました。'); }
            
            setIsSuccess(true);
            setMessage('投稿が完了しました！運営者の承認後、ポイントが付与されます。');
        } catch (err: any) {
            setMessage(err.message);
        } finally {
            setIsLoading(false);
        }
    };
    
    return (
        <div className="min-h-screen bg-gray-50">
            <Head><title>{"思い出を投稿する"}</title></Head>
            <div className="max-w-xl mx-auto p-4 pt-10">
                <h1 className="text-3xl font-bold text-center mb-2">思い出を投稿</h1>
                <p className="text-center text-gray-600 mb-8">{storeInfo.name}での体験をシェアしよう！</p>
                
                <div className="bg-white p-8 rounded-lg shadow-md">
                    {isSuccess ? (
                        <div className="text-center">
                            <p className="text-green-600 font-bold">{message}</p>
                            <button onClick={() => router.back()} className="mt-4 bg-blue-600 text-white font-bold py-2 px-4 rounded hover:bg-blue-700">
                                戻る
                            </button>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label htmlFor="image" className="block text-sm font-medium text-gray-700">写真</label>
                                <input type="file" id="image" accept="image/*" onChange={(e) => e.target.files && setImage(e.target.files[0])} required className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"/>
                            </div>
                            <div>
                                <label htmlFor="text" className="block text-sm font-medium text-gray-700">感想</label>
                                <textarea id="text" rows={5} value={text} onChange={(e) => setText(e.target.value)} required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" placeholder="楽しかったこと、美味しかったものなどを教えてください！" />
                            </div>
                            <button type="submit" disabled={isLoading} className="w-full py-3 text-lg font-bold text-white bg-pink-500 rounded-lg hover:bg-pink-600 disabled:bg-gray-400">
                                {isLoading ? '投稿中...' : 'この内容で投稿する'}
                            </button>
                            {message && <p className="text-red-600 text-sm mt-2 text-center">{message}</p>}
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};

export default NewReviewPage;