import { useState } from 'react';
import { NextPage, GetServerSideProps } from 'next';
import Link from 'next/link';
// ★ 変更: next/image をインポート
import Image from 'next/image';
import { useRouter } from 'next/router';
import nookies from 'nookies';
import { adminAuth, adminDb } from '@/lib/firebase-admin'; 
import Head from 'next/head';

import {
  RiLayoutGridFill,
  RiAlarmWarningLine,
  RiShoppingBagLine,
  RiBriefcase4Line, 
  RiHealthBookLine, 
  RiLogoutBoxRLine,
  RiMagicLine, 
} from 'react-icons/ri';
import { IoSparklesSharp } from 'react-icons/io5'; 

// Firebaseクライアント側のインポート
import { getAuth, signOut } from 'firebase/auth';
import { app } from '@/lib/firebase-client'; 

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
  const [isLoggingOut, setIsLoggingOut] = useState(false); 

  // 2026年1月1日を基準日として設定
  const FUTURE_ACCESS_DATE = new Date('2026-01-01T00:00:00');
  const isFutureAccessEnabled = new Date() >= FUTURE_ACCESS_DATE;

  const handleLogout = async () => {
    setIsLoggingOut(true);
    const auth = getAuth(app); 
    try {
      await fetch('/api/auth/sessionLogout', { method: 'POST' });
      await signOut(auth);
      window.location.href = '/users/login';
    } catch (error) {
      console.error('ログアウトに失敗しました:', error);
      window.location.href = '/users/login';
    }
  };

  const emergencyContacts: EmergencyContact[] = [
    { name: '消費者ホットライン', number: '188', description: '商品やサービスのトラブル', url: 'https://www.caa.go.jp/policies/policy/local_cooperation/local_consumer_administration/hotline/', },
    { name: '救急安心センター', number: '#7119', description: '急な病気やケガで救急車を呼ぶか迷った時', url: 'https://www.fdma.go.jp/publication/portal/post2.html', },
    { name: '那須塩原市の休日当番医', description: '那須塩原市の休日・夜間の急病', url: 'https://www.city.nasushiobara.tochigi.jp/soshikikarasagasu/kenkozoshinka/kyukyu_kyumei/1/3340.html', },
    { name: '大田原市の休日当番医', description: '大田原市の休日・夜間の急病', url: 'https://www.city.ohtawara.tochigi.jp/docs/2013082771612/', },
    { name: '那須町の休日当番医', description: '那須町の休日・夜間の急病', url: 'https://www.town.nasu.lg.jp/0130/info-0000003505-1.html', },
    { name: '水道のトラブル 緊急対応 (有)クリプトン', number: '090-2463-6638', description: '地元で40年 有限会社クリプトン', url: 'https://xn--bbkyao7065bpyck41as89d.com/emergency/', },
  ];

  // ▼▼▼ メインナビゲーションボタンリスト ▼▼▼
  const mainNavButtons = [
    {
      title: '店舗マッチングAI',
      description: 'あなたの興味のあるお店を探します!! (2026.1～ 利用開始)', 
      href: '/search-dashboard',
      Icon: IoSparklesSharp,
      gradient: 'bg-gradient-to-r from-blue-500 to-cyan-600',
      status: isFutureAccessEnabled ? 'free' : 'coming_soon',
      disabled: !isFutureAccessEnabled,
    },
    {
      title: '求人マッチングAI',
      description: 'あなたの働きたい会社を探します!! (2026.1～ 利用開始)', 
      href: '/users/dashboard',
      Icon: RiBriefcase4Line,
      gradient: 'bg-gradient-to-r from-green-500 to-teal-600',
      status: isFutureAccessEnabled ? 'free' : 'coming_soon',
      disabled: !isFutureAccessEnabled,
    },
    {
      title: 'スーパー特売価格.com',
      description: '特売チラシの価格比較で節約!!',
      href: '/nasu/kondate',
      Icon: RiShoppingBagLine,
      gradient: 'bg-gradient-to-r from-yellow-400 to-orange-500',
      status: 'free',
    },
    {
      title: 'ドラッグストア特売価格.com',
      description: '特売チラシの価格比較で節約!!',
      href: '/nasu',
      Icon: RiHealthBookLine,
      gradient: 'bg-gradient-to-r from-purple-500 to-pink-600',
      status: 'free',
    },
    {
      title: 'アプリのカテゴリからチェック!!',
      description: 'すべてのアプリ・機能を見る', 
      href: '/apps/categories',
      Icon: RiLayoutGridFill,
      gradient: 'bg-gradient-to-r from-cyan-500 to-blue-500',
      status: 'free',
    },
    {
      title: '今日の運勢占い',
      description: 'あなたの毎日を占います', 
      href: '/apps/DailyFortune',
      Icon: RiMagicLine,
      gradient: 'bg-gradient-to-r from-indigo-500 to-purple-600',
      status: 'free',
    }
  ];
  // ▲▲▲ ここまで ▲▲▲

  // ★ 修正: 協賛企業リストの画像パスを `/images/` から始める形に修正
  const sponsors = [
    {
      name: '株式会社おまかせオート',
      image: '/images/partner-omakaseauto.png', // signup.tsxの形式に合わせる
      url: 'https://www.omakase-auto.jp/',
    },
    {
      name: '株式会社大輪',
      image: '/images/partner-dairin.png', // signup.tsxの形式に合わせる
      url: 'https://jp-dairin.jp/',
    },
    {
      name: '社会福祉法人 小春福祉会',
      image: '/images/partner-koharu.png', // signup.tsxの形式に合わせる
      url: 'https://koharu-fukushikai.com/wp-content/themes/koharu/images/careplace/careplace_pamphlet.pdf',
    },
  ];


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

            {/* ▼▼▼ メインナビゲーションボタンセクション ▼▼▼ */}
            <section className="space-y-4">
              {mainNavButtons.map((item) => (
                <div key={item.title}>
                  <Link 
                    href={item.disabled ? '#' : item.href} 
                    legacyBehavior
                  >
                    <a className={`block p-5 rounded-xl shadow-md transition transform text-white ${item.gradient} 
                      ${item.disabled ? 'opacity-50 cursor-not-allowed' : 'hover:-translate-y-1'}`}
                      onClick={(e) => { if (item.disabled) e.preventDefault(); }}
                    >
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
                </div>
              ))}
            </section>
            
            {/* ▼▼▼ プレミアムプラン案内 ▼▼▼ */}
            <section className="bg-white p-6 rounded-xl shadow-md border-2 border-yellow-400">
              <h2 className="text-xl font-bold text-gray-800 text-center mb-2">
                限定機能で、年間<span className="text-red-600">9.3万円</span>以上がお得に！
              </h2>
              <p className="text-center text-gray-600 mb-4">
                プレミアムプランにアップグレードして、全ての節約機能を利用しましょう。
              </p>
              <button
                disabled={true} 
                className="w-full text-center p-4 rounded-xl shadow-md transition transform bg-gray-300 text-gray-600 cursor-not-allowed"
              >
                <span className="font-bold text-lg">月額480円プラン (準備中)</span>
              </button>
            </section>

            {/* ▼▼▼ 協賛企業一覧セクション (Next/image 使用) ▼▼▼ */}
            <section className="bg-white pt-4 pb-2 px-4 rounded-xl shadow-sm">
                <h3 className="text-sm font-bold text-gray-500 text-center mb-4 border-b pb-2">地域の協賛企業</h3>
                <div className="space-y-4">
                    {sponsors.map((sponsor) => (
                        <a 
                            key={sponsor.name}
                            href={sponsor.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block group transition-opacity hover:opacity-80"
                        >
                            <div className="bg-gray-50 rounded-lg border border-gray-100 overflow-hidden shadow-sm flex items-center justify-center min-h-[60px] relative"> 
                                {/* Imageコンポーネントを使用し、画像の表示を確実にします */}
                                <Image
                                    src={sponsor.image} 
                                    alt={sponsor.name}
                                    width={200} // ロゴの最大幅を想定して指定
                                    height={50}  // ロゴの最大高さを想定して指定
                                    className="object-contain p-2" 
                                    // ロゴ画像は最適化の恩恵が少ないためunoptimizedを付与（不要なら削除可）
                                    unoptimized={true} 
                                />
                            </div>
                        </a>
                    ))}
                </div>
            </section>
            {/* ▲▲▲ 協賛企業一覧セクションここまで ▲▲▲ */}

            <footer className="text-center mt-8 pb-4 space-y-8">
              
              <section className="flex flex-col items-center gap-2">
                <p className="text-sm font-bold text-gray-700">お問い合わせはLINEでお願いします。</p>
                <a href="https://lin.ee/Aac3C0d">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img 
                    src="https://scdn.line-apps.com/n/line_add_friends/btn/ja.png" 
                    alt="友だち追加" 
                    height="36" 
                    style={{ border: '0' }} 
                  />
                </a>
              </section>

              {/* ログアウトボタン */}
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

        {/* モーダル表示ロジック (緊急連絡先) */}
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