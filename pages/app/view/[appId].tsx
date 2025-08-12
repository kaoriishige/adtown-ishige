import { GetServerSideProps, NextPage } from 'next';
import { useRouter } from 'next/router';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../../lib/firebase'; // firebase.tsへのパスは適宜調整してください

interface WrapperProps {
  app: {
    name: string;
    url: string;
  } | null;
}

const AppWrapperPage: NextPage<WrapperProps> = ({ app }) => {
  const router = useRouter();

  if (!app) {
    return <div>アプリの情報が取得できませんでした。</div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', margin: 0 }}>
      {/* ▼▼▼ これが「額縁」部分です ▼▼▼ */}
      <header style={{
        padding: '12px 20px',
        backgroundColor: '#f8f8f8',
        borderBottom: '1px solid #e0e0e0',
        flexShrink: 0,
      }}>
        <button
          onClick={() => router.back()}
          style={{
            background: 'none',
            border: '1px solid #ccc',
            padding: '8px 16px',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px',
          }}
        >
          &larr; 戻る
        </button>
        <span style={{ marginLeft: '16px', fontWeight: 'bold' }}>{app.name}</span>
      </header>
      {/* ▲▲▲ ここまで ▲▲▲ */}

      {/* ▼▼▼ ここに外部アプリが埋め込まれます ▼▼▼ */}
      <iframe
        src={app.url}
        title={app.name}
        style={{
          width: '100%',
          height: '100%',
          border: 'none',
          flexGrow: 1,
        }}
      />
    </div>
  );
};

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { appId } = context.params!;

  try {
    const docRef = doc(db, 'apps', appId as string);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        props: {
          app: {
            name: data.name || '無題のアプリ',
            url: data.url || '',
          },
        },
      };
    }
  } catch (error) {
    console.error("Error fetching app data:", error);
  }

  return { props: { app: null } };
};

export default AppWrapperPage;