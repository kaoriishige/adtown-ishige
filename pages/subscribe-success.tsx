import { NextPage } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import { RiCheckboxCircleFill } from 'react-icons/ri';

const SubscribeSuccessPage: NextPage = () => {
  return (
    <>
      <Head>
        <title>{"ご登録ありがとうございます！"}</title>
      </Head>
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-2xl shadow-lg text-center">
          
          <div className="flex justify-center">
            <RiCheckboxCircleFill className="w-16 h-16 text-green-500" />
          </div>

          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              アップグレードが完了しました！
            </h1>
            <p className="mt-3 text-gray-600">
              ご登録いただき、誠にありがとうございます。全ての機能が利用可能になりました。
            </p>
            <p className="mt-1 text-sm text-gray-500">
              下のボタンからマイページへお進みください。
            </p>
          </div>

          <Link 
            href="/mypage" 
            className="block w-full px-6 py-3 text-lg font-semibold text-white bg-blue-500 rounded-lg shadow-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-all duration-300 ease-in-out"
          >
            マイページへ進む
          </Link>

        </div>
      </div>
    </>
  );
};

export default SubscribeSuccessPage;