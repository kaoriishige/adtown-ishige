import { GetServerSideProps, NextPage } from 'next';
import Head from 'next/head';

const TestPage: NextPage = () => {
  return (
    <>
      <Head>
        <title>デプロイテスト</title>
      </Head>
      <div style={{ 
        backgroundColor: '#FF69B4', // 鮮やかなピンク色
        color: 'white', 
        display: 'flex', 
        flexDirection: 'column',
        justifyContent: 'center', 
        alignItems: 'center', 
        width: '100vw', 
        height: '100vh',
        textAlign: 'center',
        fontFamily: 'sans-serif'
      }}>
        <h1 style={{ fontSize: '4rem', fontWeight: 'bold' }}>
          テスト成功！
        </h1>
        <p style={{ fontSize: '1.5rem', marginTop: '1rem' }}>
          この画面が表示されていれば、Netlifyへのデプロイは正常に機能しています。
        </p>
      </div>
    </>
  );
};

export const getServerSideProps: GetServerSideProps = async () => {
  return {
    props: {},
  };
};

export default TestPage;
