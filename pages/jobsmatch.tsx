/* global adminAuth */
import { NextPage, GetServerSideProps } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import nookies from 'nookies';
import { adminAuth } from '@/lib/firebase-admin'; // サーバーサイド認証用
import { RiUserSettingsLine, RiArrowRightLine } from 'react-icons/ri';
import { IoSparklesSharp } from 'react-icons/io5';

interface JobMatchingPageProps {
    isLoggedIn: boolean;
    // 必要であればユーザーの基本情報（UID, 名前など）をここで渡す
}

const JobMatchingAIPage: NextPage<JobMatchingPageProps> = ({ isLoggedIn }) => {
    // ログインしていない場合、ページは描画されるが、重要なリンクはログインを要求する
    // ただし、このページは公開ページであるという前提で、ログインを強制しない

    return (
        <>
            <Head>
                <title>AIマッチング - あなたの理想の仕事を見つける</title>
            </Head>
            <div className="bg-gray-50 min-h-screen font-sans">
                <div className="max-w-md mx-auto bg-white shadow-xl min-h-screen">
                    
                    <header className="p-6 bg-gradient-to-r from-purple-600 to-pink-700 text-white sticky top-0 z-10 rounded-b-xl">
                        <Link href="/" className="text-sm opacity-80 flex items-center mb-2">
                            &lt; ホームに戻る
                        </Link>
                        <h1 className="text-3xl font-bold flex items-center">
                            <IoSparklesSharp className="text-3xl mr-3" />
                            AI求人マッチング (求職者向け)
                        </h1>
                        <p className="text-sm mt-2 opacity-90">あなたの価値観に合う那須地域の仕事を探します。</p>
                    </header>

                    <main className="p-4 space-y-6">
                        
                        <section className="bg-purple-50 p-6 rounded-xl border border-purple-200 shadow-md">
                            <h2 className="text-xl font-bold text-purple-800 mb-3">
                                🎯 あなたの理想をAIが分析
                            </h2>
                            <p className="text-gray-700 mb-4">
                                マッチングを始めるには、あなたの希望条件とスキルをAIに伝える必要があります。
                            </p>
                            
                            <div className="space-y-4">
                                <Link href={isLoggedIn ? "/profile/edit-job-preferences" : "/users/login"} legacyBehavior>
                                    <a className="block w-full text-center py-3 rounded-lg shadow-md bg-purple-600 text-white font-bold hover:bg-purple-700 transition-colors flex items-center justify-center">
                                        <RiUserSettingsLine className="mr-2" size={20} />
                                        {isLoggedIn ? "希望プロフィールを編集・確認" : "ログインして希望プロフィールを設定"}
                                        <RiArrowRightLine className="ml-2" size={20} />
                                    </a>
                                </Link>

                                <div className="p-4 bg-white rounded-lg border">
                                    <h3 className="font-bold text-gray-800 mb-2">現在のマッチング状況 (ダミー)</h3>
                                    <p className="text-sm text-gray-600">
                                        設定完了後、AIが毎日求人データベースをスキャンし、マッチ度の高い順にここに表示します。
                                    </p>
                                    <div className="mt-3 text-center text-lg font-semibold text-pink-600">
                                        準備中...
                                    </div>
                                </div>
                            </div>
                        </section>
                        
                    </main>

                    <footer className="text-center mt-8 pb-4 space-y-8">
                        <p className="text-xs text-gray-400 pt-4">© 2025 株式会社adtown</p>
                    </footer>
                </div>
            </div>
        </>
    );
};

// --- サーバーサイドでの認証チェック ---
export const getServerSideProps: GetServerSideProps = async (context) => {
    try {
        const cookies = nookies.get(context);
        const sessionCookie = cookies.session || '';
        
        // セッションクッキーがあれば検証
        await adminAuth.verifySessionCookie(sessionCookie, true);
        
        // 検証が成功すればログイン済みと見なす
        return { props: { isLoggedIn: true } };

    } catch (e) {
        // セッションクッキーがない、または検証失敗（期限切れなど）
        return { props: { isLoggedIn: false } };
    }
};

export default JobMatchingAIPage;