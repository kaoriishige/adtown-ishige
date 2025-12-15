import { useState } from 'react';
import { NextPage, GetServerSideProps } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/router';
import nookies from 'nookies';
// Admin SDKのインポート（Firebase Admin SDKのパスを適切に設定してください）
import { adminAuth, adminDb } from '@/lib/firebase-admin'; 
import Head from 'next/head';

// React Iconsのインポート
import {
  RiLayoutGridFill,
  RiAlarmWarningLine,
  RiShoppingBagLine,
  RiBriefcase4Line, 
  RiHealthBookLine, 
  RiLogoutBoxRLine,
  RiMagicLine, 
  RiCloseCircleLine, // 解約モーダル用
} from 'react-icons/ri';
import { IoSparklesSharp } from 'react-icons/io5'; 

// Firebaseクライアント側のインポート（FirebaseクライアントSDKのパスを適切に設定してください）
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
  // モーダル管理のState
  const [isEmergencyModalOpen, setIsEmergencyModalOpen] = useState(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false); 

  // 変更点 1: 日付によるアクセス制限のロジックを再導入
  const FUTURE_ACCESS_DATE = new Date('2026-01-01T00:00:00'); // 2026年1月1日 00:00:00 JST
  const isStoreMatchingEnabled = new Date() >= FUTURE_ACCESS_DATE; // 現在日が開始日以降か

  // ⚠️ 元のコードの 'isFutureAccessEnabled' が削除されていたため、再導入はしませんが、
  // 必要な判定ロジックを `isStoreMatchingEnabled` として定義しました。

  const handleLogout = async () => {
    setIsLoggingOut(true);
    const auth = getAuth(app); 
    try {
      // セッションクッキーを削除するAPIを呼び出す
      await fetch('/api/auth/sessionLogout', { method: 'POST' });
      // Firebaseクライアント側でサインアウト
      await signOut(auth);
      // セッション削除後、ログインページへリダイレクト
      window.location.href = '/users/login';
    } catch (error) {
      console.error('ログアウトに失敗しました:', error);
      // エラー時も安全のためログインページへ
      window.location.href = '/users/login';
    }
  };

  const handleCancelSubscription = async () => {
    try {
      // ⚠️ 注意: 本番環境では、ここでサーバーサイドのユーザーアカウント削除APIを呼び出してください
      console.log('アカウント解約処理を開始します:', user.uid);

      // 実際のAPI呼び出しの例:
      // const response = await fetch('/api/user/cancel', { 
      // method: 'POST', 
      // headers: { 'Content-Type': 'application/json' },
      // body: JSON.stringify({ uid: user.uid }) 
      // });
      // if (!response.ok) throw new Error('API Error');

      alert('解約処理を実行しました。アカウントはまもなく削除されます。');
      setIsCancelModalOpen(false); // モーダルを閉じる
      
      // 解約処理が成功した後、強制的にログアウトさせる
      await handleLogout();
      
    } catch (error) {
      console.error('解約処理に失敗しました:', error);
      alert('解約処理中にエラーが発生しました。時間をおいて再度お試しください。');
      setIsCancelModalOpen(false);
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
      // 変更点 2: 説明文に開始日を含める
      description: `あなたの興味のあるお店を探します!! (${isStoreMatchingEnabled ? '公開中' : '2026.1月スタート'})`, 
      href: '/search-dashboard',
      Icon: IoSparklesSharp,
      gradient: 'bg-gradient-to-r from-blue-500 to-cyan-600',
      // 変更点 3: 判定ロジックに基づいて無効化フラグを設定
      status: isStoreMatchingEnabled ? 'free' : 'coming_soon',
      disabled: !isStoreMatchingEnabled, // 2026年1月1日まで無効化
    },
    {
      title: '求人マッチングAI',
      // 修正点 4: 説明文から開始日を削除 (元の指示に従い)
      description: 'あなたの働きたい会社を探します!!登録可能ですが、現在企業募集中になりますので、お急ぎの方はご遠慮ください。', 
      href: '/users/dashboard', // 仮のダッシュボードパス
      Icon: RiBriefcase4Line,
      gradient: 'bg-gradient-to-r from-green-500 to-teal-600',
      // 修正点 5: ステータスと無効化フラグを調整 (元のコードの意図に従い有効化)
      status: 'free',
      disabled: false,
    },
    {
      title: 'スーパー特売価格.com',
      description: '特売チラシの価格比較で節約!!',
      href: '/nasu/kondate',
      Icon: RiShoppingBagLine,
      gradient: 'bg-gradient-to-r from-yellow-400 to-orange-500',
      status: 'free',
      disabled: false,
    },
    {
      title: 'ドラッグストア特売価格.com',
      description: '特売チラシの価格比較で節約!!',
      href: '/nasu',
      Icon: RiHealthBookLine,
      gradient: 'bg-gradient-to-r from-purple-500 to-pink-600',
      status: 'free',
      disabled: false,
    },
    {
      title: 'アプリのカテゴリからチェック!!',
      description: 'すべてのアプリ・機能を見る', 
      href: '/apps/categories',
      Icon: RiLayoutGridFill,
      gradient: 'bg-gradient-to-r from-cyan-500 to-blue-500',
      status: 'free',
      disabled: false,
    },
    {
      title: '今日の運勢占い',
      description: 'あなたの毎日を占います', 
      href: '/apps/DailyFortune',
      Icon: RiMagicLine,
      gradient: 'bg-gradient-to-r from-indigo-500 to-purple-600',
      status: 'free',
      disabled: false,
    }
  ];
  // ▲▲▲ ここまで ▲▲▲

  const sponsors = [
    {
      name: '株式会社おまかせオート',
      image: '/images/partner-omakaseauto.png',
      url: 'https://www.omakase-auto.jp/',
    },
    {
      name: '株式会社大輪',
      image: '/images/partner-dairin.png',
      url: 'https://jp-dairin.jp/',
    },
    {
      name: '社会福祉法人 小春福祉会',
      image: '/images/partner-koharu.png',
      url: 'https://koharu-fukushikai.com/wp-content/themes/koharu/images/careplace/careplace_pamphlet.pdf',
    },
  ];


  return (
    <>
      <Head>
        <title>{"ホーム - みんなのNasuアプリ"}</title>
      </Head>
      <div className="bg-gray-100 min-h-screen">
        <div className="max-w-md mx-auto bg-white">
          <header className="text-center p-6 bg-white shadow-sm sticky top-0 z-10">
            <h1 className="text-3xl font-bold text-gray-800">みんなのNasuアプリ</h1>
            <p className="text-gray-600 mt-2">ようこそ、{user.email}さん</p>
          </header>

          <main className="p-4 space-y-6">
            <section className="bg-white p-6 rounded-xl shadow-md">
              <button onClick={() => setIsEmergencyModalOpen(true)} className="w-full flex items-center justify-center text-center text-red-800 font-bold py-3 px-6 rounded-lg shadow-md transition transform hover:scale-105 bg-red-100 hover:bg-red-200">
                <RiAlarmWarningLine className="mr-2 text-red-500" /> お困りのときは (緊急連絡先)
              </button>
              <p className="text-xs text-center text-gray-500 mt-2">商品やサービスのトラブル、休日・夜間の急病、水道のトラブルなどはこちら</p>
            </section>

            {/* ▼▼▼ メインナビゲーションボタンセクション ▼▼▼ */}
            <section className="space-y-4">
              {mainNavButtons.map((item) => (
                <div key={item.title}>
                  {/* 変更点 4: Linkコンポーネントのロジックを変更し、無効化時は'#'にリンクし、クリックを阻止 */}
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
                          <h2 className="font-bold text-lg">
                            {item.title}
                            {/* 無効化時のみ「COMING SOON」バッジを表示 */}
                            {item.disabled && (
                              <span className="ml-2 inline-block bg-white text-blue-600 text-xs font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider shadow-inner">
                                COMING SOON
                              </span>
                            )}
                          </h2>
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
                プレミアムプランにアップグレードして、全ての節約機能を利用しましょう。<br />
                また、紹介機能で収入をアップしましょう。
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
                                <Image
                                    src={sponsor.image} 
                                    alt={sponsor.name}
                                    width={200}
                                    height={50}
                                    className="object-contain p-2" 
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
                <p className="text-xs text-gray-600">変更等はLINEでお知らせします。</p> 
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

              {/* ログアウトと解約ボタンのセクション */}
              <section className="space-y-4"> 
                <button
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  className="w-full max-w-xs mx-auto flex items-center justify-center text-center text-red-700 font-bold py-3 px-6 rounded-lg shadow-md transition transform hover:scale-105 bg-red-50 hover:bg-red-100 disabled:opacity-50"
                >
                  <RiLogoutBoxRLine className="mr-2" />
                  {isLoggingOut ? 'ログアウト中...' : 'ログアウト'}
                </button>

                <button
                  onClick={() => setIsCancelModalOpen(true)}
                  className="w-full max-w-xs mx-auto flex items-center justify-center text-center text-gray-500 font-bold py-3 px-6 rounded-lg shadow-md transition transform hover:scale-105 bg-gray-100 hover:bg-gray-200"
                >
                  <RiCloseCircleLine className="mr-2" />
                  アカウント解約
                </button>
              </section>

              <p className="text-xs text-gray-400 pt-4">© 2025 株式会社adtown</p>
            </footer>
          </main>
        </div>

        {/* モーダル表示ロジック (緊急連絡先) */}
        {isEmergencyModalOpen && (
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
                <button onClick={() => setIsEmergencyModalOpen(false)} className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-6 rounded-lg">
                  閉じる
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 解約確認モーダル */}
        {isCancelModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm transform transition-all scale-100">
              <div className="p-6">
                <RiCloseCircleLine className="text-6xl text-red-500 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-center text-gray-800 mb-2">アカウントを解約しますか？</h2>
                <p className="text-md text-center text-gray-600 mb-6">
                  <strong>この操作を元に戻すことはできません。</strong><br />
                  解約すると、すべてのデータが削除され、ログインできなくなります。
                </p>
                <div className="flex justify-center space-x-3">
                  <button
                    onClick={() => setIsCancelModalOpen(false)}
                    className="w-1/2 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold rounded-lg transition"
                  >
                    戻る
                  </button>
                  <button
                    onClick={handleCancelSubscription}
                    className="w-1/2 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg shadow-md transition"
                  >
                    解約する
                  </button>
                </div>
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

    // セッションクッキーを検証し、トークンを取得
    const token = await adminAuth.verifySessionCookie(sessionCookie, true);
    if (!token || !token.uid) {
      return { redirect: { destination: '/users/login', permanent: false } };
    }

    // ユーザーのドキュメントを取得
    const userDoc = await adminDb.collection('users').doc(token.uid).get();
    if (!userDoc.exists) {
      // ユーザーデータが存在しない場合
      return { redirect: { destination: '/users/login', permanent: false } };
    }

    const userData = userDoc.data() || {};
    const userPlan = userData.plan || 'free';

    // プランが 'paid_480' の場合は /mypage にリダイレクト (元のロジックを保持)
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
    // エラー発生時もログインページへリダイレクト
    return { redirect: { destination: '/users/login', permanent: false } };
  }
};

export default HomePage;
