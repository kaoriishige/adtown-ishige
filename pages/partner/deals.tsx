import type { GetServerSideProps, NextPage } from 'next';
import Link from 'next/link';
import { useState } from 'react';
import { app } from '@/lib/firebase';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import nookies from 'nookies';
import { getAdminAuth, getAdminDb } from '@/lib/firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';

interface Deal {
  id: string;
  title: string;
  type: 'お得情報' | 'クーポン' | 'フードロス';
  description: string;
  createdAt: string;
  imageUrl?: string;
}

interface DealsPageProps {
  initialDeals: Deal[];
}

const DealsPage: NextPage<DealsPageProps> = ({ initialDeals }) => {
    const [deals, setDeals] = useState<Deal[]>(initialDeals);
    const [dealType, setDealType] = useState<'お得情報' | 'クーポン' | 'フードロス'>('お得情報');
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleDelete = async (dealId: string) => {
        if (!window.confirm('この情報を本当に削除しますか？')) {
            return;
        }
        try {
            const response = await fetch(`/api/partner/deals/${dealId}`, {
                method: 'DELETE',
            });
            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || '削除に失敗しました。');
            }
            setDeals(currentDeals => currentDeals.filter(deal => deal.id !== dealId));
            alert('情報を削除しました。');
        } catch (error: any) {
            console.error('削除エラー:', error);
            alert(`エラー: ${error.message}`);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isSubmitting) return;
        setIsSubmitting(true);

        try {
            let newImageUrl: string | undefined = undefined;
            if (imageFile) {
                const storage = getStorage(app);
                const storageRef = ref(storage, `deals/${Date.now()}_${imageFile.name}`);
                const snapshot = await uploadBytes(storageRef, imageFile);
                newImageUrl = await getDownloadURL(snapshot.ref);
            }

            const response = await fetch('/api/partner/deals', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title,
                    type: dealType,
                    description,
                    imageUrl: newImageUrl,
                }),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || '登録に失敗しました。');
            }

            const newDealData = await response.json();
            const formattedNewDeal = {
                ...newDealData,
                createdAt: new Date(newDealData.createdAt.seconds * 1000).toLocaleDateString('ja-JP'),
            };
            
            setDeals(prev => [formattedNewDeal, ...prev]);
            
            setTitle('');
            setDescription('');
            setImageFile(null);
            (document.getElementById('image-upload') as HTMLInputElement).value = "";
            alert('新しい情報を登録しました！');
        } catch (error: any) {
            console.error("登録エラー:", error);
            alert(`エラー: ${error.message}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <header className="bg-white shadow-sm">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <h1 className="text-2xl font-bold text-gray-900">お得情報・クーポン・フードロス管理</h1>
                </div>
            </header>
            <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">画像 (任意)</label>
                            <input type="file" id="image-upload" onChange={(e) => setImageFile(e.target.files ? e.target.files[0] : null)} accept="image/png, image/jpeg" className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"/>
                        </div>
                        <div className="text-right">
                             <button type="submit" disabled={isSubmitting} className="inline-flex justify-center py-2 px-6 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 disabled:bg-gray-400">
                                {isSubmitting ? '登録中...' : '登録する'}
                            </button>
                        </div>
                    </form>
                </section>
                <section>
                    <h2 className="text-xl font-bold text-gray-800 mb-4">登録済みリスト</h2>
                    <div className="bg-white rounded-lg shadow-sm">
                        <ul className="divide-y divide-gray-200">
                            {deals.map(deal => (
                                <li key={deal.id} className="p-4 flex items-start space-x-4">
                                    {deal.imageUrl && <img src={deal.imageUrl} alt={deal.title} className="w-24 h-24 object-cover rounded-md flex-shrink-0" />}
                                    <div className="flex-grow">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <span className={`inline-flex items-center px-2-5 py-0-5 rounded-full text-xs font-medium ${deal.type === 'クーポン' ? 'bg-blue-100 text-blue-800' : deal.type === 'フードロス' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'}`}>
                                                    {deal.type}
                                                </span>
                                                <p className="font-semibold text-gray-800 mt-1">{deal.title}</p>
                                            </div>
                                            <div className="text-right flex-shrink-0 ml-4">
                                                <p className="text-xs text-gray-400">{deal.createdAt}</p>
                                                <button onClick={() => handleDelete(deal.id)} className="text-sm text-red-500 hover:text-red-700 mt-2">削除</button>
                                            </div>
                                        </div>
                                        <p className="text-sm text-gray-500 mt-1">{deal.description}</p>
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
export const getServerSideProps: GetServerSideProps = async (context) => {
    try {
        const cookies = nookies.get(context);
        const token = await getAdminAuth().verifySessionCookie(cookies.token, true);
        const { uid: partnerId } = token;

        const db = getAdminDb();
        const dealsSnapshot = await db.collection('partners').doc(partnerId).collection('deals').orderBy('createdAt', 'desc').get();
        
        const initialDeals = dealsSnapshot.docs.map(doc => {
            const data = doc.data();
            const createdAt = data.createdAt as Timestamp;
            return {
                id: doc.id,
                title: data.title,
                type: data.type,
                description: data.description,
                imageUrl: data.imageUrl || null,
                createdAt: createdAt.toDate().toLocaleDateString('ja-JP'),
            };
        });

        return {
            props: {
                initialDeals,
            },
        };
    } catch (error) {
        console.error("サーバーサイドエラー:", error);
        return {
            redirect: {
                destination: '/partner/login',
                permanent: false,
            },
        };
    }
};

export default DealsPage;