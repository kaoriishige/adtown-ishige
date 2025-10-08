import { NextPage } from 'next';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Head from 'next/head';
import { RiMapPinLine } from 'react-icons/ri';

const areas = ["那須塩原市", "大田原市", "那須町"];

const SelectAreaPage: NextPage = () => {
    const router = useRouter();
    const { main, sub } = router.query;

    if (!main || !sub) {
        return <div className="flex h-screen items-center justify-center">読み込み中...</div>;
    }

    return (
        <div className="min-h-screen bg-gray-50 font-sans p-4 flex flex-col items-center">
            <Head>
                <title>エリアを選択 - {main as string}</title>
            </Head>
            <header className="w-full max-w-4xl text-center py-6">
                <h1 className="text-2xl font-bold text-gray-800">エリアを選択してください</h1>
                <p className="text-gray-600 mt-2">
                    カテゴリ: {main as string} {sub !== 'その他' && `> ${sub as string}`}
                </p>
            </header>

            <main className="w-full max-w-sm space-y-4">
                {areas.map(area => (
                    <Link 
                        key={area}
                        href={`/deals/${encodeURIComponent(main as string)}/${encodeURIComponent(area)}?sub=${encodeURIComponent(sub as string)}`}
                        className="block w-full p-5 bg-white rounded-lg shadow-md hover:shadow-xl text-center text-xl font-semibold text-gray-700 transition-transform transform hover:-translate-y-1"
                    >
                        <div className="flex items-center justify-center">
                            <RiMapPinLine className="mr-3 text-blue-600" />
                            {area}
                        </div>
                    </Link>
                ))}
            </main>

            <footer className="mt-8">
                {/* --- ▼▼▼ 修正箇所 ▼▼▼ --- */}
                <Link href="/deals" className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-6 rounded-lg">
                    ← カテゴリ選択に戻る
                </Link>
                {/* --- ▲▲▲ ここまで ▲▲▲ --- */}
            </footer>
        </div>
    );
};

export default SelectAreaPage;
