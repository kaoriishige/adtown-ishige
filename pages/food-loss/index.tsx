import { NextPage } from 'next';
import Link from 'next/link';
import Head from 'next/head';

const FoodLossTopPage: NextPage = () => {
  const areas = [
    { name: '那須塩原市', path: 'nasushiobara' },
    { name: '大田原市', path: 'otawara' },
    { name: '那須町', path: 'nasu' },
  ];

  const buttonStyle = "block w-full max-w-lg text-center text-white font-bold py-5 px-6 my-4 rounded-lg shadow-md transition transform hover:scale-105 text-xl";

  return (
    <>
      <Head>
        <title>フードロス情報 - エリア選択</title>
      </Head>
      <div className="flex flex-col items-center justify-center min-h-screen bg-green-50 p-4">
        <header className="text-center mb-10">
          <h1 className="text-4xl font-bold text-green-800">フードロス情報</h1>
          <p className="text-lg text-gray-600 mt-2">情報を確認したいエリアを選択してください</p>
        </header>

        <main className="w-full flex flex-col items-center">
          {areas.map((area) => (
            <Link 
              key={area.path} 
              href={`/food-loss/${area.path}`} 
              className={`${buttonStyle} bg-gradient-to-r from-green-500 to-teal-500`}
            >
              {area.name}
            </Link>
          ))}
        </main>

        <footer className="mt-12">
          <Link href="/home" className="text-blue-600 hover:underline">
            &larr; ホームに戻る
          </Link>
        </footer>
      </div>
    </>
  );
};

export default FoodLossTopPage;