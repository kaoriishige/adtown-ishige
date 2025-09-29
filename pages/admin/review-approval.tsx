import { NextPage, GetServerSideProps } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import nookies from 'nookies';
import { adminAuth, getAdminDb } from '../../lib/firebase-admin';

const ReviewApprovalPage: NextPage = () => {
    return (
        <div className="min-h-screen bg-gray-100">
            <Head>
                <title>投稿承認</title>
            </Head>
            <header className="bg-white shadow-sm">
                <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
                    <h1 className="text-xl font-bold text-gray-900">投稿承認</h1>
                    <Link href="/admin" className="text-sm text-blue-600 hover:underline">
                        管理メニューに戻る
                    </Link>
                </div>
            </header>
            <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                <div className="bg-white p-8 rounded-lg shadow">
                    <h2 className="text-lg font-semibold mb-4">承認待ちの投稿一覧</h2>
                    {/* 今後、ここに承認待ちの投稿（レビューなど）一覧が表示されるようになります */}
                    <p className="text-gray-500">現在、承認待ちの投稿はありません。</p>
                </div>
            </main>
        </div>
    );
};

// --- 管理者専用の認証保護 ---
export const getServerSideProps: GetServerSideProps = async (context) => {
    try {
        const cookies = nookies.get(context);
        if (!cookies.token) {
            return { redirect: { destination: '/admin/login', permanent: false } };
        }
        const token = await adminAuth().verifySessionCookie(cookies.token, true);

        // FirestoreのDBで 'role' をチェックする方法に統一
        const userDoc = await getAdminDb().collection('users').doc(token.uid).get();
        if (!userDoc.exists || userDoc.data()?.role !== 'admin') {
            return { redirect: { destination: '/admin/login', permanent: false } };
        }

        return { props: {} };
    } catch (error) {
        return { redirect: { destination: '/admin/login', permanent: false } };
    }
};

export default ReviewApprovalPage;