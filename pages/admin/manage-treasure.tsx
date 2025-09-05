import { GetServerSideProps, NextPage } from 'next';
import Head from 'next/head';
import nookies from 'nookies';
import { getAdminAuth } from '../../lib/firebase-admin';

const ManageTreasurePage: NextPage = () => {
  return (
    <div>
      <Head>
        <title>Manage Treasure</title>
      </Head>
      <main>
        <h1>Manage Treasure Page</h1>
        <p>This is the admin page to manage treasures.</p>
        {/* ここにお宝さがし管理ページの実際のコンテンツが入ります */}
      </main>
    </div>
  );
};

export const getServerSideProps: GetServerSideProps = async (ctx) => {
    try {
        const cookies = nookies.get(ctx);
        if (!cookies.token) {
            return { redirect: { destination: '/admin/login', permanent: false } };
        }
        const token = await getAdminAuth().verifySessionCookie(cookies.token, true);
        const user = await getAdminAuth().getUser(token.uid);
        if (user.customClaims?.role !== 'admin') {
             return { redirect: { destination: '/admin/login', permanent: false } };
        }
        return { props: {} };
    } catch (error) {
        return { redirect: { destination: '/admin/login', permanent: false } };
    }
};

export default ManageTreasurePage;