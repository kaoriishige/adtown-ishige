import { NextPage, GetServerSideProps } from 'next';
import { getAdminAuth, getAdminDb } from '../../lib/firebase-admin';
import nookies from 'nookies';
import { useState } from 'react';
import Link from 'next/link';

interface PendingReview {
  id: string;
  userId: string;
  storeName: string;
  text: string;
  imageUrl: string;
  userEmail: string;
}

interface ReviewApprovalPageProps {
  reviews: PendingReview[];
}

const ReviewApprovalPage: NextPage<ReviewApprovalPageProps> = ({ reviews: initialReviews }) => {
    const [reviews, setReviews] = useState(initialReviews);
    const [isLoading, setIsLoading] = useState(false);

    const handleReview = async (reviewId: string, action: 'approve' | 'reject') => {
        setIsLoading(true);
        try {
            await fetch('/api/admin/approve-review', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ reviewId, action }),
            });
            // 処理が成功したら、一覧からその投稿を消す
            setReviews(currentReviews => currentReviews.filter(r => r.id !== reviewId));
        } catch (error) {
            alert(`処理に失敗しました: ${error}`);
        }
        setIsLoading(false);
    };

    return (
        <div className="p-8">
            <h1 className="text-2xl font-bold mb-4">投稿の承認待ち一覧</h1>
            <Link href="/admin" className="text-blue-600 hover:underline mb-4 inline-block">← 管理メニューに戻る</Link>
            {reviews.length > 0 ? (
                <div className="space-y-6">
                    {reviews.map(review => (
                        <div key={review.id} className="bg-white p-4 rounded-lg shadow grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="md:col-span-1">
                                <img src={review.imageUrl} alt="投稿写真" className="rounded-lg w-full h-auto object-cover" />
                            </div>
                            <div className="md:col-span-2">
                                <h2 className="font-bold text-lg">{review.storeName}</h2>
                                <p className="text-sm text-gray-600">ユーザー: {review.userEmail}</p>
                                <p className="mt-2 bg-gray-100 p-3 rounded text-gray-800">{review.text}</p>
                                <div className="mt-4 space-x-2">
                                    <button onClick={() => handleReview(review.id, 'approve')} disabled={isLoading} className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600 disabled:bg-gray-400">承認 (+5 P)</button>
                                    <button onClick={() => handleReview(review.id, 'reject')} disabled={isLoading} className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 disabled:bg-gray-400">却下</button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <p>現在、承認待ちの投稿はありません。</p>
            )}
        </div>
    );
};

export const getServerSideProps: GetServerSideProps = async (context) => {
    try {
        const cookies = nookies.get(context);
        await getAdminAuth().verifySessionCookie(cookies.token, true);

        const db = getAdminDb();
        const snapshot = await db.collection('reviews').where('status', '==', 'pending').orderBy('createdAt', 'asc').get();

        const reviews = await Promise.all(snapshot.docs.map(async doc => {
            const data = doc.data();
            const userDoc = await db.collection('users').doc(data.userId).get();
            return {
                id: doc.id,
                userId: data.userId,
                storeName: data.storeName,
                text: data.text,
                imageUrl: data.imageUrl,
                userEmail: userDoc.data()?.email || '不明'
            };
        }));
        
        return { props: { reviews: JSON.parse(JSON.stringify(reviews)) } };

    } catch (error) {
        return { redirect: { destination: '/admin/login', permanent: false } };
    }
};

export default ReviewApprovalPage;