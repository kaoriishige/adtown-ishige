import { NextPage } from 'next';
import { useRouter } from 'next/router';
import React from 'react';
import Head from 'next/head';

const RecruitCancelPage: NextPage = () => {
  const router = useRouter();

  // 戻るボタンの処理
  const handleBack = () => {
    // 参照元が不明なため、一旦ダッシュボードに戻るように設定
    router.push('/recruit/dashboard'); 
  };

  return (
    // 💡 修正点1: style={{ ... }} に修正
    <div style={{ padding: '40px', maxWidth: '600px', margin: '0 auto', textAlign: 'center' }}>
      <Head>
        <title>登録キャンセル完了</title>
      </Head>
      
      <div className="bg-white p-8 rounded-lg shadow-xl mt-10">
        <h1 className="text-3xl font-bold text-red-600 mb-4">
          登録キャンセルを受け付けました
        </h1>
        
        <p className="text-gray-700 mb-6">
          ご提供いただいた求人パートナー登録のキャンセル手続きが完了いたしました。
          全ての情報がデータベースから削除されましたことをお知らせします。
        </p>

        <p className="text-gray-500 text-sm mb-8">
          またのご利用を心よりお待ちしております。
        </p>

        {/* 💡 修正点2: 孤立していたボタンをメインのJSX内に移動 */}
        <button
          onClick={handleBack}
          className="w-full bg-gray-500 text-white font-bold py-3 rounded-lg hover:bg-gray-600 transition"
        >
          ダッシュボードに戻る
        </button>
      </div>

    </div>
  );
};

export default RecruitCancelPage;