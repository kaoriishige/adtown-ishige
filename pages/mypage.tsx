import { GetServerSideProps, NextPage } from 'next';
import Head from 'next/head';
import { adminDb, adminAuth } from '@/lib/firebase-admin'; // ★修正: adminAuthを直接インポート
import nookies from 'nookies';

// --- 型定義 ---
interface MyPageProps {
    userName: string;
    email: string;
}

// --- サーバーサイド処理 ---
export const getServerSideProps: GetServerSideProps = async (context) => {
    try {
        // ★修正: getUidFromCookieを使わず、ここで直接認証を行う
        const cookies = nookies.get(context);
        const token = await adminAuth.verifySessionCookie(cookies.session || '', true);
        const { uid, email } = token;

        const userDoc = await adminDb.collection('users').doc(uid).get();
        const userName = userDoc.data()?.name || 'ゲスト';

        return {
            props: {
                userName,
                email: email || '',
            },
        };

    } catch (error) {
        // 認証失敗時はログインページなどにリダイレクト
        return {
            redirect: {
                destination: '/login', // ログインページを想定
                permanent: false,
            },
        };
    }
};


// --- ページコンポーネント本体 ---
const MyPage: NextPage<MyPageProps> = ({ userName, email }) => {
    
    return (
        <div>
            <Head>
                <title>{"マイページ"}</title>
            </Head>
            <main>
                <h1>マイページ</h1>
                <p>ようこそ、{userName} さん</p>
                <p>登録メールアドレス: {email}</p>
                {/* ここにマイページ用のコンテンツを追加します */}
            </main>
        </div>
    );
};

export default MyPage;