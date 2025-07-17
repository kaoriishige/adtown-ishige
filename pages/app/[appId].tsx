import { GetServerSideProps, NextPage } from 'next';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase'; // あなたのFirebase設定ファイルへのパス

// ページのPropsの型を定義
interface AppProps {
  app: {
    id: string;
    name: string;
    genre: string;
    url: string;
  } | null;
}

// ページコンポーネント
const AppPage: NextPage<AppProps> = ({ app }) => {
  // データが見つからない場合の表示
  if (!app) {
    return <div>アプリが見つかりませんでした。</div>;
  }

  return (
    <div style={{ padding: '40px', textAlign: 'center' }}>
      <h1>{app.name}</h1>
      <p>ジャンル: {app.genre}</p>
      <a 
        href={app.url} 
        target="_blank" 
        rel="noopener noreferrer"
        style={{
          display: 'inline-block',
          marginTop: '20px',
          padding: '15px 30px',
          fontSize: '18px',
          fontWeight: 'bold',
          color: 'white',
          backgroundColor: '#0070f3',
          textDecoration: 'none',
          borderRadius: '8px'
        }}
      >
        このアプリを使ってみる
      </a>
    </div>
  );
};

// サーバーサイドでデータを取得する処理
export const getServerSideProps: GetServerSideProps = async (context) => {
  const { appId } = context.params!; // URLからドキュメントIDを取得

  try {
    const docRef = doc(db, 'apps', appId as string);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      // ドキュメントが存在する場合、そのデータをPropsとしてページに渡す
      return {
        props: {
          app: {
            id: docSnap.id,
            ...docSnap.data(),
          },
        },
      };
    } else {
      // ドキュメントが存在しない場合
      return { props: { app: null } };
    }
  } catch (error) {
    console.error("Error fetching document:", error);
    return { props: { app: null } };
  }
};

export default AppPage;
