import { useState, useEffect } from 'react';
import { NextPage, GetServerSideProps } from 'next';
import Link from 'next/link';
import { useRouter } from 'next/router'; // useRouterをインポート
import { getFirestore } from 'firebase/firestore'; // クライアント用のインポートは削除可能
import { app } from '@/lib/firebase';
import nookies from 'nookies';
import { getAdminAuth, getAdminDb } from '../lib/firebase-admin';


// アイコン
import { FcGoogle } from 'react-icons/fc';
import { FaYahoo } from 'react-icons/fa';
import { IoSparklesSharp } from 'react-icons/io5';
import { RiLayoutGridFill, RiAlarmWarningLine, RiQuestionLine } from 'react-icons/ri'; // RiQuestionLine を追加


// --- 型定義 ---
// （Ad, HomePageProps の型定義は変更なし）
interface Ad {
  id: string;
  imageUrl: string;
  linkUrl: string;
  altText: string;
}


interface HomePageProps {
  user: {
    uid: string;
    email: string | null;
  };
}




// --- 検索ツールのデータ ---
// （searchTools のデータは変更なし）
const searchTools = [
  {
    name: 'Google 検索',
    href: 'https://www.google.co.jp',
    Icon: FcGoogle,
    bgColor: 'bg-white',
    textColor: 'text-gray-800',
  },
  {
    name: 'Yahoo! JAPAN',
    href: 'https://www.yahoo.co.jp',
    Icon: FaYahoo,
    bgColor: 'bg-red-600',
    textColor: 'text-white',
  },
  {
    name: 'AI検索',
    href: 'https://www.perplexity.ai',
    Icon: IoSparklesSharp,
    bgColor: 'bg-black',
    textColor: 'text-white',
  },
];




const HomePage: NextPage<HomePageProps> = ({ user }) => {
  const router = useRouter(); // useRouterフックを使用
  // （ads, loadingAds, isModalOpen, isClient などのstateは変更なし）
  const [ads, setAds] = useState<Ad[]>([]);
  const [loadingAds, setLoadingAds] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isClient, setIsClient] = useState(false);




  // （useEffect, genres, emergencyContacts のデータは変更なし）
  useEffect(() => {
    setIsClient(true);
    // 広告取得のロジックは省略
  }, []);


  const genres = [
    '生活情報', '健康支援', '節約・特売', '人間関係', '教育・学習',
    '子育て', '防災・安全', '診断・運勢', 'エンタメ', '趣味・文化',
  ];


  const emergencyContacts = [
    { name: '消費者ホットライン', number: '188', description: '商品やサービスのトラブル', url: 'https://www.caa.go.jp/policies/policy/local_cooperation/local_consumer_administration/hotline/', },
    { name: '救急安心センター', number: '#7119', description: '急な病気やケガで救急車を呼ぶか迷った時', url: 'https://www.fdma.go.jp/publication/portal/post2.html', },
    { name: '休日夜間急患診療所', number: '0287-64-4110', description: '那須塩原市の休日・夜間の急病', url: 'https://www.city.nasushiobara.tochigi.jp/soshikikarasagasu/kenkozoshinka/yobo/1/3/3055.html', },
    { name: '水道のトラブル', number: '090-2463-6638', description: '（那須塩原市指定業者）水漏れ・つまりなど', url: 'https://www.city.nasushiobara.tochigi.jp/soshikikarasagasu/jogesuidobu/gyomuannai/1/5/1749.html', },
  ];




  return (
    <div className="bg-gray-100 min-h-screen">
      <div className="max-w-md mx-auto">
        {/* --- ヘッダー (変更なし) --- */}
        <header className="text-center p-6 bg-white shadow-sm">
          <h1 className="text-3xl font-bold text-gray-800">みんなの那須アプリ</h1>
          <p className="text-gray-600 mt-2">ようこそ、{user.email}さん</p>
        </header>


        <main className="p-4 space-y-6">
          {/* --- ジャンル選択 (変更なし) --- */}
          <section className="bg-white p-6 rounded-xl shadow-md">
            <h2 className="text-xl font-bold text-gray-800 text-center mb-4">
              アプリをジャンルで探す
            </h2>
            <div className="flex flex-wrap justify-center gap-2">
              {genres.map((genre) => (
                <Link key={genre} href={`/genre/${genre}`} className="bg-blue-100 text-blue-800 text-sm font-semibold py-2 px-4 rounded-full hover:bg-blue-200 transition-colors">
                    {genre}
                </Link>
              ))}
            </div>
          </section>


          {/* ★★★ ここから新規追加 ★★★ */}
          {/* --- 有料プランへのアップグレードCTA --- */}
          <section className="bg-white p-6 rounded-xl shadow-md border-2 border-yellow-400">
            <h2 className="text-xl font-bold text-gray-800 text-center mb-2">
              限定機能で、年間<span className="text-red-600">9.3万円</span>以上お得に！
            </h2>
            <p className="text-center text-gray-600 mb-4">
              チラシ比較、限定クーポン、フードロス情報など、全ての節約機能が解放されます。
            </p>
            <button
              onClick={() => router.push('/subscribe')} // 決済ページへ遷移
              className="w-full text-center p-4 rounded-xl shadow-md transition transform hover:-translate-y-1 bg-gradient-to-r from-red-500 to-orange-500 text-white"
            >
              <span className="font-bold text-lg">月額480円で全ての機能を見る</span>
            </button>
          </section>
          {/* ★★★ ここまで新規追加 ★★★ */}




          {/* --- 緊急連絡先 (変更なし) --- */}
          <section className="bg-white p-6 rounded-xl shadow-md">
            <button onClick={() => setIsModalOpen(true)} className="w-full flex items-center justify-center text-center text-red-800 font-bold py-3 px-6 rounded-lg shadow-md transition transform hover:scale-105 bg-red-200 hover:bg-red-300">
              <RiAlarmWarningLine className="mr-2" /> お困りのときは (緊急連絡先)
            </button>
          </section>


          {/* --- 検索ツール (変更なし) --- */}
          <section className="bg-white p-6 rounded-xl shadow-md">
             {/* 検索ツールの表示ロジックは省略 */}
          </section>


          {/* ★★★ ここを削除 ★★★ */}
          {/* --- 店舗情報 & フードロス (セクションごと削除) --- */}
          {/*
          <section className="grid grid-cols-2 gap-4">
            ...
          </section>
          */}


          {/* --- 広告 (変更なし) --- */}
          {isClient && (
            <section>
              {/* 広告表示ロジックは省略 */}
            </section>
          )}


          {/* --- すべてのアプリ (変更なし) --- */}
          <section>
            <Link href="/apps/all" className="block text-center p-6 rounded-xl shadow-md transition transform hover:-translate-y-1 bg-gradient-to-r from-cyan-500 to-blue-500 text-white">
              <RiLayoutGridFill className="mx-auto text-4xl mb-2" />
              <span className="font-bold text-lg">すべてのアプリを見る</span>
            </Link>
          </section>


          {/* --- フッター --- */}
          <footer className="text-center mt-8 pb-4">
             {/* ★★★ ここから変更 ★★★ */}
            <div className="space-y-4">
                <Link href="/contact" className="flex items-center justify-center text-sm text-gray-600 hover:text-blue-600 hover:underline">
                    <RiQuestionLine className="mr-1" /> お問い合わせ
                </Link>
                <Link href="/mypage" className="text-sm text-gray-600 hover:text-blue-600 hover:underline">
                    マイページに戻る
                </Link>
            </div>
            {/* ★★★ ここまで変更 ★★★ */}
            <p className="text-xs text-gray-400 mt-4">© 2025 株式会社adtown</p>
          </footer>
        </main>
      </div>


      {/* --- 緊急連絡先モーダル (変更なし) --- */}
      {isModalOpen && (
        <div>
          {/* モーダルの表示ロジックは省略 */}
        </div>
      )}
    </div>
  );
};




// --- SSR認証処理 ---
export const getServerSideProps: GetServerSideProps = async (context) => {
  try {
    const cookies = nookies.get(context);
    const token = await getAdminAuth().verifySessionCookie(cookies.token, true); // セッション切れチェックを有効に
    const userDoc = await getAdminDb().collection('users').doc(token.uid).get();


    if (!userDoc.exists) {
      return { redirect: { destination: '/login', permanent: false } };
    }


    const userData = userDoc.data() || {};
   
    // ★★★ ここからロジック変更 ★★★
    const userPlan = userData.plan || 'free'; // planを取得、なければ 'free'


    // もし有料会員 (paid_480) がこのページにアクセスしたら、マイページにリダイレクト
    if (userPlan === 'paid_480') {
      return { redirect: { destination: '/mypage', permanent: false } };
    }
    // ★★★ ここまでロジック変更 ★★★


    return {
      props: {
        user: {
          uid: token.uid,
          email: token.email || null,
        },
      },
    };
  } catch (err) {
    // セッションクッキーが無効、または期限切れの場合
    return { redirect: { destination: '/login', permanent: false } };
  }
};


export default HomePage;


