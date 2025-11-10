import { GetServerSideProps, NextPage } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from "next/router"; 
import nookies from 'nookies';
// import { adminAuth, adminDb } from '@/lib/firebase-admin'; 
import {
    RiArrowLeftLine,
    RiSearchLine,
    RiMapPinLine, 
    RiQuestionLine,
    RiLayoutGridFill,
    RiHome2Line,
} from "react-icons/ri";
import { IoSparklesSharp } from "react-icons/io5";

// エリアのダミーデータ
const areaList = ["那須塩原市", "大田原市", "那須町"];

const SearchDashboardPage: NextPage = () => {
    const router = useRouter();

    const handleGoBack = () => {
        window.location.href = "/home";
    };

    const primaryLinkStyle = "block w-full max-w-md mx-auto py-4 px-6 bg-blue-600 text-white text-lg font-bold rounded-lg shadow-lg hover:bg-blue-500 transition-transform transform hover:scale-105 text-center";

    return (
        <>
            <Head>
                <title>お店を探す</title>
                <meta name="viewport" content="width=device-width, initial-scale=1" />
            </Head>

            <div className="w-screen h-screen flex flex-col bg-gray-50 overflow-hidden">
                <header className="bg-white shadow-sm flex-shrink-0">
                    <div className="max-w-xl mx-auto p-4 flex items-center">
                        <button
                            onClick={() => router.back()}
                            className="p-2 rounded-full hover:bg-gray-100"
                        >
                            <RiArrowLeftLine className="w-6 h-6 text-gray-700" />
                        </button>
                    </div>
                </header>

                <main className="flex-1 overflow-y-auto">
                    <div className="max-w-xl mx-auto px-4 md:px-8 py-6 space-y-8">
                        
                        <p className="text-gray-600 text-center text-lg font-medium">
                            🔍 ご希望の探し方を選んでください。
                        </p>

                        {/* 1️⃣ AIクイックマッチ */}
                        <section>
                            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                                <RiQuestionLine className="mr-2 text-indigo-500" /> 最適なマッチング
                            </h2>
                            <Link href="/matching" legacyBehavior>
                                <a className={primaryLinkStyle.replace('max-w-md mx-auto py-4 px-6', 'block p-6').replace('bg-blue-600', 'bg-gradient-to-r from-blue-600 to-indigo-700').replace('hover:bg-blue-500', 'hover:-translate-y-1 hover:shadow-xl transition transform border-2 border-transparent hover:border-white')}>
                                    <div className="flex items-center space-x-4">
                                        <IoSparklesSharp className="text-5xl text-white flex-shrink-0" />
                                        <div>
                                            <h3 className="font-extrabold text-2xl text-white">
                                                AI クイックマッチ
                                            </h3>
                                            <p className="text-sm mt-1 text-white opacity-90">
                                                数問の質問で、AIがあなたのニーズに合う店舗を瞬間選定します。
                                            </p>
                                        </div>
                                    </div>
                                </a>
                            </Link>
                        </section>

                        {/* 2️⃣ 詳細条件検索 */}
                        <section>
                            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                                <RiSearchLine className="mr-2 text-red-500" /> 詳細な条件検索
                            </h2>
                            <Link href="/search-dashboard/keywords" legacyBehavior>
                                <a className="block p-4 rounded-xl shadow-md border-b-4 border-red-500 bg-white hover:bg-gray-100 transition duration-300 mb-4">
                                    <div className="flex items-center">
                                        <RiLayoutGridFill className="text-3xl mr-3 text-red-600" />
                                        <div>
                                            <h3 className="font-bold text-lg">キーワード & カテゴリ</h3>
                                            <p className="text-sm text-gray-600">
                                                全店舗の情報をキーワードや業種で絞り込みます。
                                            </p>
                                        </div>
                                    </div>
                                </a>
                            </Link>
                        </section>

                        {/* 3️⃣ エリア検索 */}
                        <section>
                            <h2 className="text-xl font-bold text-gray-800 mb-4">
                                📍 エリアから探す
                            </h2>
                            <div className="flex flex-wrap justify-center gap-4">
                                
                                {areaList.map((area: string) => (
                                    <Link
                                        // ★ リンク先: 大カテゴリ選択ページへ
                                        href={`/area-search/${area}`} 
                                        key={area}
                                        legacyBehavior
                                    >
                                        <a className="flex items-center px-5 py-2 bg-white text-gray-900 border-2 border-orange-400 rounded-full font-bold text-base hover:bg-orange-50 transition-colors shadow-sm">
                                            <RiMapPinLine className="mr-2 text-orange-500" /> {area}
                                        </a>
                                    </Link>
                                ))}
                            </div>
                        </section>
                        
                    </div>
                </main>

                {/* フッター */}
                <footer className="flex-shrink-0 bg-white shadow-2xl border-t border-gray-100">
                    <div className="max-w-xl mx-auto p-3">
                        <button
                            onClick={handleGoBack}
                            className="w-full flex items-center justify-center py-3 bg-gray-700 text-white font-bold rounded-lg hover:bg-gray-800 transition-colors"
                        >
                            <RiHome2Line className="w-5 h-5 mr-2" />
                            ホームに戻る
                        </button>
                    </div>
                </footer>
            </div>
        </>
    );
};

export default SearchDashboardPage;







