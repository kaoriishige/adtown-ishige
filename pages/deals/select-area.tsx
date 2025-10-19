import { NextPage } from 'next';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link'; // 👈 この行を追加します！
import { RiArrowLeftSLine } from 'react-icons/ri'; 

// エリア選択ロジックを想定した最小構成
const SelectAreaPage: NextPage = () => {
    const router = useRouter();
    const { main } = router.query;

    if (!main) {
        return <div>カテゴリが指定されていません。</div>;
    }

    return (
        <div className="min-h-screen bg-gray-50 font-sans p-4 flex flex-col items-center">
            <Head>
                {/* 【修正】不正な文字列結合を修正し、正しい形式にしました */}
                <title>{`エリアを選択 - ${main as string}`}</title>
            </Head>
            
            <header className="w-full max-w-xl mb-6 flex items-center">
                <button onClick={() => router.back()} className="p-2 rounded-full hover:bg-gray-200">
                    <RiArrowLeftSLine size={24} />
                </button>
                <h1 className="text-xl font-bold ml-3">エリアを選択</h1>
            </header>

            <main className="w-full max-w-xl">
                <p className="text-gray-600 mb-4">
                    選択中のカテゴリ: <span className="font-semibold">{main as string}</span>
                </p>

                {/* 実際にはここでエリアの一覧を表示し、ユーザーに選択させます */}
                <div className="bg-white p-4 rounded-lg shadow">
                    <p className="text-gray-500">エリア選択 UI がここに表示されます...</p>
                    {/* ダミーのエリアリスト */}
                    <ul className="mt-4 space-y-2">
                        {['那須塩原市', '大田原市', '那須町'].map(area => (
                            <li key={area} className="border-b last:border-b-0 py-2">
                                <Link href={`/deals/${main}/${area}?sub=すべて`} passHref legacyBehavior>
                                    <a className="text-blue-600 hover:underline">{area}</a>
                                </Link>
                            </li>
                        ))}
                    </ul>
                </div>
            </main>
        </div>
    );
};

export default SelectAreaPage;
