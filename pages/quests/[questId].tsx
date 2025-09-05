import { GetServerSideProps, NextPage } from 'next';
import Head from 'next/head';
import { useRouter } from 'next/router';

interface QuestPageProps {
  questId?: string;
}

const QuestDetailPage: NextPage<QuestPageProps> = ({ questId }) => {
  const router = useRouter();

  if (router.isFallback) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <Head>
        <title>Quest Details</title>
      </Head>
      <main>
        <h1>Quest Detail Page</h1>
        <p>Details for quest ID: {questId}</p>
        {/* ここにクエスト詳細ページの実際のコンテンツが入ります */}
      </main>
    </div>
  );
};

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { params } = context;
  const questId = params?.questId as string;

  return {
    props: {
      questId: questId || null,
    },
  };
};

export default QuestDetailPage;
