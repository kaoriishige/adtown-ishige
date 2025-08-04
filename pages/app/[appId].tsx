import { GetServerSideProps, NextPage } from 'next';
import { doc, getDoc, Timestamp } from 'firebase/firestore'; // Timestampをインポート
import { db } from '../../lib/firebase'; // あなたのFirebase設定ファイルへのパス

// ページのPropsの型を定義
// createdAtを文字列として追加します
interface AppProps {
  app: {
    id: string;
    name: string;
    genre: string;
    url: string;
    createdAt: string; // 日付は文字列として受け取ります
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
      {/* 念のため、日付も表示してみましょう */}
      <p style={{ marginTop: '20px', color: '#888' }}>
        作成日: {new Date(app.createdAt).toLocaleDateString()}
      </p>
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
      // ドキュメントが存在する場合
      const data = docSnap.data();
      
      // ★★★★★ ここが修正ポイントです ★★★★★
      // FirestoreのTimestampオブジェクトを、JSONで扱える文字列に変換します
      const appData = {
        id: docSnap.id,
        name: data.name || '',
        genre: data.genre || '',
        url: data.url || '',
        // createdAtが存在し、Timestampであれば文字列に変換、なければnullを設定
        createdAt: data.createdAt instanceof Timestamp 
          ? data.createdAt.toDate().toISOString() 
          : new Date().toISOString(),
      };

      return {
        props: {
          app: appData,
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