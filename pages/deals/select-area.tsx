import { NextPage } from 'next';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link'; 
import React from 'react';
import { RiArrowLeftSLine } from 'react-icons/ri'; 

// エリア選択ロジックを想定した最小構成
const SelectAreaPage: NextPage = () => {
    const router = useRouter();
    // 💡 修正: main と sub の両方をクエリから取得
    const { main, sub } = router.query; 
    
    // エリアのリスト (那須塩原市の画像に合わせたダミーリスト)
    const areaList = ['那須塩原市', '大田原市', '那須町'];

    const mainCategory = main as string;
    const subCategory = sub as string;

    if (!mainCategory || !subCategory) {
        return (
            <div className="min-h-screen flex justify-center items-center">
                <p className='text-red-600'>カテゴリ情報が不足しています。一つ前の画面に戻ってください。</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 font-sans p-4 flex flex-col items-center">
            <Head>
                {/* 【修正】タイトルに小カテゴリを含め、正しい形式に修正 */}
                <title>{`エリアを選択 - ${mainCategory} > ${subCategory}`}</title>
            </Head>
            
            <header className="w-full max-w-xl mb-6 flex items-center">
                <button onClick={() => router.back()} className="p-2 rounded-full hover:bg-gray-200">
                    <RiArrowLeftSLine size={24} />
                </button>
                <h1 className="text-xl font-bold ml-3">エリアを選択</h1>
            </header>

            <main className="w-full max-w-xl">
                <p className="text-gray-600 mb-4 text-center">
                    選択中のカテゴリ: <span className="font-semibold text-indigo-600">{mainCategory}</span>
                </p>
                <div className="bg-white p-6 rounded-lg shadow">
                    <p className="text-gray-500 mb-4">エリア選択 UI がここに表示されます...</p>
                    
                    {/* ダミーのエリアリスト */}
                    <ul className="mt-4 space-y-2">
                        {areaList.map(area => {
                             // 💡 修正: 次の店舗一覧ページに全てのカテゴリ情報を渡す
                             const href = `/deals/store/list?main=${encodeURIComponent(mainCategory)}&area=${encodeURIComponent(area)}&sub=${encodeURIComponent(subCategory)}`;
                            
                             return (
                                <li key={area} className="border-b last:border-b-0 py-3">
                                    <Link href={href} passHref legacyBehavior>
                                        <a className="text-blue-600 hover:underline text-lg font-medium">
                                            {area}
                                        </a>
                                    </Link>
                                </li>
                            );
                        })}
                    </ul>
                </div>
            </main>
        </div>
    );
};

export default SelectAreaPage;
