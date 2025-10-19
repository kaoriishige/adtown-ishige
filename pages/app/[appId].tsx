import { GetServerSideProps, NextPage } from 'next';
import { useRouter } from 'next/router'; 
import { doc, getDoc, Timestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import React from 'react'; // Reactを明示的にインポート

// ページのPropsの型を定義
interface AppProps {
  app: {
    id: string;
    name: string;
    genre: string;
    url: string;
    createdAt: string;
  } | null;
}

// ページコンポーネント
const AppPage: NextPage<AppProps> = ({ app }) => {
  const router = useRouter(); // routerを初期化

  // データが見つからない場合の表示
  if (!app) {
    return <div>アプリが見つかりませんでした。</div>;
  }

  return (
    <div style={{ padding: '40px', fontFamily: 'sans-serif' }}>
      
      {/* 戻るボタン */}
      <div style={{ marginBottom: '40px' }}>
        <button
          onClick={() => router.back()}
          style={{
            background: 'none',
            border: 'none',
            padding: '0',
            color: '#0070f3',
            cursor: 'pointer',
            fontSize: '16px',
            textDecoration: 'underline',
          }}
        >
          &larr; アプリのジャンル選択に戻る
        </button>
      </div>

      <div style={{ textAlign: 'center' }}>
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
        <p style={{ marginTop: '20px', color: '#888' }}>
          作成日: {new Date(app.createdAt).toLocaleDateString()}
        </p>
      </div>
    </div>
  );
};

// サーバーサイドでデータを取得する処理 (変更なし)
export const getServerSideProps: GetServerSideProps = async (context) => {
  // グローバル変数の型を宣言 (Next.js環境では通常不要ですが、VS Codeのエラーを避けるため)
  // declare const __app_id: string;

  const { appId } = context.params!;
  // const appId = (context.params?.appId as string) || ''; // 実際はappIdが必須

  try {
    // データベースパスの定義 (仮に 'apps' コレクションから直接取得すると仮定)
    const docRef = doc(db, 'apps', appId as string); 
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      
      const appData = {
        id: docSnap.id,
        name: data.name || '',
        genre: data.genre || '',
        url: data.url || '',
        // Timestampオブジェクトの場合はtoDate().toISOString()に変換
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
      return { props: { app: null } };
    }
  } catch (error) {
    console.error("Error fetching document:", error);
    return { props: { app: null } };
  }
};

export default AppPage;