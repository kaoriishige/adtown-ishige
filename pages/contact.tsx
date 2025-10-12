import { GetServerSideProps, NextPage } from 'next';
import Head from 'next/head';
import { adminDb, getUidFromCookie } from '../lib/firebase-admin'; // ★ パスを修正

interface ContactProps {
  isLoggedIn: boolean;
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  try {
    const uid = await getUidFromCookie(context);
    return { props: { isLoggedIn: !!uid } };
  } catch (error) {
    return { props: { isLoggedIn: false } };
  }
};

const ContactPage: NextPage<ContactProps> = ({ isLoggedIn }) => {
  return (
    <div>
      <Head>
        <title>お問い合わせ</title>
      </Head>
      <h1>お問い合わせ</h1>
      <p>このページは現在準備中です。</p>
      {isLoggedIn ? <p>ログイン済みです。</p> : <p>ログインしていません。</p>}
    </div>
  );
};

export default ContactPage;
