import { NextPage, GetServerSideProps } from 'next';
import Head from 'next/head';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import nookies from 'nookies';
import { useRouter } from 'next/router';
import { useState } from 'react';
import Link from 'next/link';

interface Quest {
  id: string;
  title: string;
  reward: number;
}

interface QuestSubmitPageProps {
  quest: Quest | null;
}

const QuestSubmitPage: NextPage<QuestSubmitPageProps> = ({ quest }) => {
    const [reportText, setReportText] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [isSuccess, setIsSuccess] = useState(false);
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setMessage('');

        try {
            const response = await fetch('/api/quests/submit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ questId: quest?.id, reportText }),
            });
            const data = await response.json();
            if (!response.ok) { throw new Error(data.error || '報告に失敗しました。'); }
            
            setIsSuccess(true);
            setMessage('クエストの完了を報告しました！運営者の承認をお待ちください。');
        } catch (err: any) {
            setMessage(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    if (!quest) { return <div>参加しているクエストが見つかりませんでした。</div>; }

    return (
        <div className="min-h-screen bg-gray-50">
            <Head><title>クエスト完了報告: {quest.title}</title></Head>
            <div className="max-w-xl mx-auto p-4 pt-10">
                <h1 className="text-3xl font-bold text-center mb-2">クエスト完了報告</h1>
                <p className="text-center text-gray-600 mb-8">{quest.title}</p>
                
                <div className="bg-white p-8 rounded-lg shadow-md">
                    {isSuccess ? (
                        <div className="text-center">
                            <p className="text-green-600 font-bold">{message}</p>
                            <Link href="/mypage" className="mt-4 inline-block bg-blue-600 text-white font-bold py-2 px-4 rounded hover:bg-blue-700">
                                マイページに戻る
                            </Link>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit}>
                            <label htmlFor="reportText" className="block text-sm font-medium text-gray-700">報告内容（任意）</label>
                            <textarea
                                id="reportText"
                                rows={5}
                                value={reportText}
                                onChange={(e) => setReportText(e.target.value)}
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                                placeholder="写真の提出が必要な場合は、別途運営から連絡します。"
                            />
                            <button type="submit" disabled={isLoading} className="w-full mt-6 py-3 text-lg font-bold text-white bg-yellow-500 rounded-lg hover:bg-yellow-600 disabled:bg-gray-400">
                                {isLoading ? '送信中...' : 'この内容で完了を報告する'}
                            </button>
                            {message && <p className="text-red-600 text-sm mt-2 text-center">{message}</p>}
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};

export const getServerSideProps: GetServerSideProps = async (context) => {
    try {
        const cookies = nookies.get(context);
        const token = await adminAuth.verifySessionCookie(cookies.token, true);
        const { uid } = token;
        const { questId } = context.params as { questId: string };

        const questDoc = await adminDb.collection('users').doc(uid).collection('acceptedQuests').doc(questId).get();
        if (!questDoc.exists) { return { props: { quest: null } }; }
        
        const data = questDoc.data();
        const quest = {
            id: questDoc.id,
            title: data?.title || '',
            reward: data?.reward || 0,
        };
        return { props: { quest: JSON.parse(JSON.stringify(quest)) } };
    } catch (error) {
        return { redirect: { destination: '/login', permanent: false } };
    }
};

export default QuestSubmitPage;