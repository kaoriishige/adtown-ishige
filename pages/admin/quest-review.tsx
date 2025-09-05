import { NextPage, GetServerSideProps } from 'next';
import { getAdminAuth, getAdminDb } from '../../lib/firebase-admin';
import nookies from 'nookies';
import { useState } from 'react';

interface SubmittedQuest {
  id: string; // userQuestId (userId + questId)
  userId: string;
  questId: string;
  title: string;
  reportText: string;
  userEmail: string;
}

interface QuestReviewPageProps {
  quests: SubmittedQuest[];
}

const QuestReviewPage: NextPage<QuestReviewPageProps> = ({ quests: initialQuests }) => {
    const [quests, setQuests] = useState(initialQuests);
    const [isLoading, setIsLoading] = useState(false);

    const handleReview = async (userId: string, questId: string, action: 'approve' | 'reject') => {
        setIsLoading(true);
        try {
            await fetch('/api/admin/review-quest', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, questId, action }),
            });
            // 処理が成功したら、一覧からそのクエストを消す
            setQuests(currentQuests => currentQuests.filter(q => q.id !== `${userId}_${questId}`));
        } catch (error) {
            alert(`処理に失敗しました: ${error}`);
        }
        setIsLoading(false);
    };

    return (
        <div className="p-8">
            <h1 className="text-2xl font-bold mb-4">クエスト承認待ち一覧</h1>
            {quests.length > 0 ? (
                <div className="space-y-4">
                    {quests.map(quest => (
                        <div key={quest.id} className="bg-white p-4 rounded-lg shadow">
                            <h2 className="font-bold">{quest.title}</h2>
                            <p className="text-sm text-gray-600">ユーザー: {quest.userEmail}</p>
                            <p className="mt-2 bg-gray-100 p-2 rounded">{quest.reportText || '(報告文はありません)'}</p>
                            <div className="mt-4 space-x-2">
                                <button onClick={() => handleReview(quest.userId, quest.questId, 'approve')} disabled={isLoading} className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600 disabled:bg-gray-400">承認</button>
                                <button onClick={() => handleReview(quest.userId, quest.questId, 'reject')} disabled={isLoading} className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 disabled:bg-gray-400">却下</button>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <p>現在、承認待ちのクエスト報告はありません。</p>
            )}
        </div>
    );
};

export const getServerSideProps: GetServerSideProps = async (context) => {
    try {
        const cookies = nookies.get(context);
        await getAdminAuth().verifySessionCookie(cookies.token, true);

        const db = getAdminDb();
        // 全ユーザーの 'acceptedQuests' サブコレクションから、ステータスが 'submitted' のものを横断検索
        const snapshot = await db.collectionGroup('acceptedQuests').where('status', '==', 'submitted').get();

        const quests = await Promise.all(snapshot.docs.map(async doc => {
            const data = doc.data();
            const userId = doc.ref.parent.parent!.id;
            const userDoc = await db.collection('users').doc(userId).get();
            return {
                id: `${userId}_${doc.id}`,
                userId: userId,
                questId: doc.id,
                title: data.title,
                reportText: data.reportText,
                userEmail: userDoc.data()?.email || '不明'
            };
        }));
        
        return { props: { quests: JSON.parse(JSON.stringify(quests)) } };

    } catch (error) {
        return { redirect: { destination: '/admin/login', permanent: false } };
    }
};

export default QuestReviewPage;