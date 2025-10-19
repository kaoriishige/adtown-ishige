import { GetServerSideProps, NextPage } from 'next';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { adminDb } from '@/lib/firebase-admin';
import nookies from 'nookies';
import { adminAuth } from '@/lib/firebase-admin';

interface Quest {
    id: string;
    title: string;
    description: string;
    reward: number;
    category: string;
}

interface QuestDetailPageProps {
  quest: Quest | null;
}

const QuestDetailPage: NextPage<QuestDetailPageProps> = ({ quest }) => {
  const router = useRouter();

  if (router.isFallback || !quest) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <Head>
        <title>{{quest.title} - クエスト詳細}</title>
      </Head>
      <main className="max-w-xl mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4">{quest.title}</h1>
        <div className="bg-white p-6 rounded-lg shadow-md">
            <p className="text-lg font-semibold text-yellow-600 mb-4">{quest.reward.toLocaleString()} ポイント</p>
            <p className="text-gray-700 whitespace-pre-wrap">{quest.description}</p>
        </div>
      </main>
    </div>
  );
};

export const getServerSideProps: GetServerSideProps = async (context) => {
    const { params } = context;
    const questId = params?.questId as string;

    try {
        const cookies = nookies.get(context);
        if (!cookies.token) {
            return { redirect: { destination: '/login', permanent: false } };
        }
        await adminAuth.verifySessionCookie(cookies.token, true);

        if (!questId) {
            return { notFound: true };
        }

        const db = adminDb;
        const questDoc = await db.collection('quests').doc(questId).get();

        if (!questDoc.exists) {
            return { notFound: true };
        }
        
        const questData = questDoc.data();
        const quest = {
            id: questDoc.id,
            title: questData?.title || '',
            description: questData?.description || '',
            reward: questData?.reward || 0,
            category: questData?.category || '',
        };

        return {
            props: {
                quest: JSON.parse(JSON.stringify(quest)),
            },
        };

    } catch (error) {
        return { redirect: { destination: '/login', permanent: false } };
    }
};

export default QuestDetailPage;
