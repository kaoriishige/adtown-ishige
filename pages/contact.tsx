import { GetServerSideProps, NextPage } from 'next';
import Head from 'next/head';
import { adminAuth } from '@/lib/firebase-admin'; // ★修正: adminAuthを直接インポート
import nookies from 'nookies';

// --- 型定義 ---
interface ContactProps {
    isLoggedIn: boolean;
}

// --- サーバーサイド処理 ---
export const getServerSideProps: GetServerSideProps = async (context) => {
    let isLoggedIn = false;
    try {
        // ★修正: getUidFromCookieを使わず、セッションクッキーが存在するかどうかでログイン状態を判断
        const cookies = nookies.get(context);
        if (cookies.session) {
            await adminAuth.verifySessionCookie(cookies.session, true);
            isLoggedIn = true;
        }
    } catch (error) {
        // クッキーが無効な場合は isLoggedIn は false のまま
        isLoggedIn = false;
    }

    return {
        props: {
            isLoggedIn,
        },
    };
};

// --- ページコンポーネント本体 ---
const ContactPage: NextPage<ContactProps> = ({ isLoggedIn }) => {
    return (
        <div>
            <Head>
                <title>お問い合わせ</title>
            </Head>
            <main>
                <h1>お問い合わせ</h1>
                <p>ログイン状態: {isLoggedIn ? 'ログイン済み' : '未ログイン'}</p>
                {/* ここにお問い合わせフォームのコンポーネントなどを配置します */}
            </main>
        </div>
    );
};

export default ContactPage;
