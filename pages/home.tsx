import { useState } from 'react';
import { NextPage, GetServerSideProps } from 'next';
import Link from 'next/link';
import { useRouter } from 'next/router';
import nookies from 'nookies';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import Head from 'next/head';
import Image from 'next/image';
import {
  RiLayoutGridFill,
  RiAlarmWarningLine,
  RiCoupon3Line,
  RiRestaurantLine,
  RiShoppingBagLine,
  RiBriefcase4Line, 
  RiHealthBookLine, 
  RiLogoutBoxRLine, // ★ ログアウトアイコン追加
} from 'react-icons/ri';
import { IoSparklesSharp } from 'react-icons/io5'; 

// ★ Firebaseクライアントのインポート追加
import { getAuth, signOut } from 'firebase/auth';
import { app } from '@/lib/firebase'; // クライアントFirebaseのパス

interface HomePageProps {
  user: {
    uid: string;
    email: string | null;
  };
}

interface EmergencyContact {
  name: string;
  number?: string;
  description: string;
  url: string;
}

const HomePage: NextPage<HomePageProps> = ({ user }) => {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false); // ★ ログアウト処理中ステート

  // ★ ログアウト処理
  const handleLogout = async () => {
    setIsLoggingOut(true);
    const auth = getAuth(app); // クライアントAuthインスタンス取得
    try {
      // 1. サーバーサイドのセッション(Cookie)を破棄
      //    このAPIルートはセッションをクリアするだけのものです
      await fetch('/api/auth/sessionLogout', { method: 'POST' });
      
      // 2. クライアントサイドのFirebase認証をサインアウト
      await signOut(auth);
      
      // 3. ログインページにリダイレクト
      // window.location.href を使うと、ページが完全にリロードされ安全です
      window.location.href = '/users/login';
    } catch (error) {
      console.error('ログアウトに失敗しました:', error);
      // エラーが発生しても、とりあえずログインページに強制遷移
      window.location.href = '/users/login';
    }
  };


  const emergencyContacts: EmergencyContact[] = [
    { name: '消費者ホットライン', number: '188', description: '商品やサービスのトラブル', url: 'https://www.caa.go.jp/policies/policy/local_cooperation/local_consumer_administration/hotline/', },
    { name: '救急安心センター', number: '#7119', description: '急な病気やケガで救急車を呼ぶか迷った時', url: 'https://www.fdma.go.jp/publication/portal/post2.html', },
    { name: '休日夜間急患診療所', description: '那須塩原市の休日・夜間の急病', url: 'https://www.city.nasushiobara.tochigi.jp/soshikikarasagasu/kenkozoshinka/kyukyu_kyumei/1/3340.html', },
    // ★ ここから追加
    { name: '大田原市の休日・夜間の急病', description: '大田原市の休日・夜間の急病', url: 'https://www.city.ohtawara.tochigi.jp/docs/2013082771612/', },
    { name: '那須町の休日・夜間の急病', description: '那須町の休日・夜間の急病', url: 'https://www.town.nasu.lg.jp/0130/info-0000003505-1.html', },
    { name: '水道のトラブル 緊急対応 (有)クリプトン', number: '090-2463-6638', description: '地元で40年 有限会社クリプトン', url: 'https://xn--bbkyao7065bpyck41as89d.com/emergency/', },
    // ★ ここまで追加
  ];

  // ▼▼▼ ナビゲーションボタンのリンク先(href)を修正 ▼▼▼
  const mainNavButtons = [
    {
      title: '店舗マッチングAI',
      description: 'あなたの興味のあるお店を探します!!',
      href: '/search-dashboard', // 既存の「お店マッチングAI」のリンク先
      Icon: IoSparklesSharp, // 既存のアイコン
      gradient: 'bg-gradient-to-r from-blue-500 to-cyan-600',
    },
    {
      title: '求人マッチングAI',
      description: 'あなたの働きたい会社を探します!!',
      href: '/users/dashboard', // ★ 修正 (ファイル構成に基づき /recruit を指定)
      Icon: RiBriefcase4Line, // 新しいアイコン
      gradient: 'bg-gradient-to-r from-green-500 to-teal-600',
    },
    {
      title: 'スーパー特売価格.com',
      description: '特売チラシの価格比較で節約!!',
      href: '/nasu/kondate', // ★ 修正 (nasu/kondate.jsx へ)
      Icon: RiShoppingBagLine, // アイコン
      gradient: 'bg-gradient-to-r from-yellow-400 to-orange-500',
    },
    {
      title: 'ドラッグストア特売価格.com',
      description: '特売チラシの価格比較で節約!!',
      href: '/nasu', // ★ 修正 (nasu/index.js へ)
      Icon: RiHealthBookLine, // 新しいアイコン
      gradient: 'bg-gradient-to-r from-purple-500 to-pink-600',
    },
    {
      title: 'アプリのカテゴリからチェック!!',
      description: 'すべてのアプリ・機能を見る', // 説明を補足
      href: '/apps/categories', // 既存の「すべてのアプリ」のリンク先
      Icon: RiLayoutGridFill, // 既存のアイコン
      gradient: 'bg-gradient-to-r from-cyan-500 to-blue-500',
    }
  ];
  // ▲▲▲ ここまで ▲▲▲


  return (
    <>
      <Head>
        <title>{"ホーム - みんなの那須アプリ"}</title>
      </Head>
      <div className="bg-gray-100 min-h-screen">
        <div className="max-w-md mx-auto bg-white">
          <header className="text-center p-6 bg-white shadow-sm sticky top-0 z-10">
            <h1 className="text-3xl font-bold text-gray-800">みんなの那須アプリ</h1>
            <p className="text-gray-600 mt-2">ようこそ、{user.email}さん</p>
          </header>

          <main className="p-4 space-y-6">
            <section className="bg-white p-6 rounded-xl shadow-md">
              <button onClick={() => setIsModalOpen(true)} className="w-full flex items-center justify-center text-center text-red-800 font-bold py-3 px-6 rounded-lg shadow-md transition transform hover:scale-105 bg-red-100 hover:bg-red-200">
                <RiAlarmWarningLine className="mr-2 text-red-500" /> お困りのときは (緊急連絡先)
              </button>
              <p className="text-xs text-center text-gray-500 mt-2">商品やサービスのトラブル、休日・夜間の急病、水道のトラブルなどはこちら</p>
            </section>

            {/* ▼▼▼ 依頼内容に基づき、セクションを差し替え ▼▼▼ */}
            <section className="space-y-4">
              {mainNavButtons.map((item) => (
                <Link key={item.title} href={item.href} legacyBehavior>
                  <a className={`block p-5 rounded-xl shadow-md transition transform hover:-translate-y-1 text-white ${item.gradient}`}>
                    <div className="flex items-center">
                      <item.Icon className="text-4xl mr-4 flex-shrink-0" />
                      <div>
                        <h2 className="font-bold text-lg">{item.title}</h2>
                        {item.description && (
                          <p className="text-sm mt-1 opacity-90">{item.description}</p>
                        )}
                      </div>
                    </div>
                  </a>
                </Link>
              ))}
            </section>
            {/* ▲▲▲ ここまで ▲▲▲ */}

            <section className="bg-white p-6 rounded-xl shadow-md border-2 border-yellow-400">
              <h2 className="text-xl font-bold text-gray-800 text-center mb-2">
                限定機能で、年間<span className="text-red-600">9.3万円</span>以上がお得に！
              </h2>
              <p className="text-center text-gray-600 mb-4">
                プレミアムプランにアップグレードして、全ての節約機能を利用しましょう。
              </p>
              <button
                onClick={() => router.push('/subscribe')}
                className="w-full text-center p-4 rounded-xl shadow-md transition transform hover:-translate-y-1 bg-gradient-to-r from-red-500 to-orange-500 text-white"
              >
                <span className="font-bold text-lg">月額480円で全ての機能を見る</span>
              </button>
            </section>

            {/* ★ 削除 (便利ツールセクション) */}

            <footer className="text-center mt-8 pb-4 space-y-8">
              
              <section>
                <Link href="/contact" className="inline-block bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-3 px-8 rounded-lg shadow-sm transition-colors">
                  お問い合わせ
                </Link>
              </section>

              {/* ★ ログアウトボタンを「お問い合わせ」の下に移動 ★ */}
              <section>
                <button
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  className="w-full max-w-xs mx-auto flex items-center justify-center text-center text-red-700 font-bold py-3 px-6 rounded-lg shadow-md transition transform hover:scale-105 bg-red-50 hover:bg-red-100 disabled:opacity-50"
                >
                  <RiLogoutBoxRLine className="mr-2" />
                  {isLoggingOut ? 'ログアウト中...' : 'ログアウト'}
                </button>
              </section>

              <p className="text-xs text-gray-400 pt-4">© 2025 株式会社adtown</p>
            </footer>
          </main>
        </div>

        {/* モーダル表示ロジック (変更なし) */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
              <div className="p-4 border-b">
                <h2 className="text-xl font-bold text-center">緊急連絡先</h2>
              </div>
              <div className="p-4 space-y-4 max-h-[60vh] overflow-y-auto">
                {emergencyContacts.map((contact, index) => (
                  <div key={`${contact.name}-${index}`} className="block p-3 bg-gray-50 rounded-lg">
                    <p className="font-bold text-blue-600">{contact.name}</p>
                    {contact.number && (
                      <a href={`tel:${contact.number.replace('#', '')}`} className="text-2xl font-bold text-gray-800 hover:underline">
                        {contact.number}
                      </a>
                    )}
                    <p className="text-sm text-gray-500">{contact.description}</p>
                    <a href={contact.url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-500 hover:underline mt-1 inline-block">
                      公式サイトを見る
                    </a>
                  </div>
                ))}
              </div>
              <div className="p-4 border-t text-center">
                <button onClick={() => setIsModalOpen(false)} className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-6 rounded-lg">
                  閉じる
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

// getServerSideProps (変更なし)
export const getServerSideProps: GetServerSideProps = async (context) => {
  try {
    const cookies = nookies.get(context);
    const sessionCookie = cookies.session || '';

    if (!sessionCookie) {
      return { redirect: { destination: '/users/login', permanent: false } };
    }

    const token = await adminAuth.verifySessionCookie(sessionCookie, true);
    if (!token || !token.uid) {
      return { redirect: { destination: '/users/login', permanent: false } };
    }

    const userDoc = await adminDb.collection('users').doc(token.uid).get();
    if (!userDoc.exists) {
      return { redirect: { destination: '/users/login', permanent: false } };
    }

    const userData = userDoc.data() || {};
    const userPlan = userData.plan || 'free';

    if (userPlan === 'paid_480') {
      return { redirect: { destination: '/mypage', permanent: false } };
    }

    return {
      props: {
        user: {
          uid: token.uid,
          email: token.email || null,
        },
      },
    };
  } catch (err) {
    console.error('home getServerSideProps error:', err);
    return { redirect: { destination: '/users/login', permanent: false } };
  }
};

export default HomePage;