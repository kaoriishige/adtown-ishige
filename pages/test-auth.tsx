import { GetServerSideProps, NextPage } from 'next';
import nookies from 'nookies';
import { getAdminAuth, getAdminDb } from '../lib/firebase-admin';
import Head from 'next/head';

interface TestPageProps {
  user: {
    uid: string;
    email: string;
  };
  plan: string;
  isFirestoreReadable: boolean;
}

const TestAuthPage: NextPage<TestPageProps> = ({ user, plan, isFirestoreReadable }) => {
  return (
    <div style={{ fontFamily: 'sans-serif', padding: '20px' }}>
      <Head>
        <title>認証テストページ</title>
      </Head>
      <h1>認証テストページ</h1>
      <hr />
      <h2>認証情報</h2>
      <p><strong>UID:</strong> {user.uid}</p>
      <p><strong>Email:</strong> {user.email}</p>
      <p><strong>プラン:</strong> <span style={{ color: plan === 'paid_480' ? 'green' : 'red', fontWeight: 'bold' }}>{plan}</span></p>

      <hr />
      <h2>Firestore接続テスト</h2>
      <p>
        <strong>Admin SDKによるusersコレクションの読み取り:</strong> 
        {isFirestoreReadable ? 
          <span style={{ color: 'green', fontWeight: 'bold' }}>成功</span> : 
          <span style={{ color: 'red', fontWeight: 'bold' }}>失敗</span>
        }
      </p>
    </div>
  );
};

export const getServerSideProps: GetServerSideProps = async (context) => {
  try {
    const cookies = nookies.get(context);
    if (!cookies.token) {
      return { redirect: { destination: '/login', permanent: false } };
    }

    const token = await getAdminAuth().verifySessionCookie(cookies.token, true);
    
    let plan = 'N/A';
    let isFirestoreReadable = false;

    try {
      const userDoc = await getAdminDb().collection('users').doc(token.uid).get();
      if (userDoc.exists) {
        plan = userDoc.data()?.plan || 'free';
        isFirestoreReadable = true; // ここまで到達すれば読み取り成功
      }
    } catch (error) {
      // Firestoreの読み取りでエラーが発生しても、ページは表示させる
      console.error("Firestore read failed in test page:", error);
      isFirestoreReadable = false;
    }

    return {
      props: {
        user: {
          uid: token.uid,
          email: token.email || '',
        },
        plan,
        isFirestoreReadable,
      },
    };
  } catch (error) {
    console.error("Auth failed in test page:", error);
    return { redirect: { destination: '/login', permanent: false } };
  }
};

export default TestAuthPage;