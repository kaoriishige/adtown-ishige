import { useState } from 'react';
import { GetServerSideProps, NextPage } from 'next'; // ★ NextPage, GetServerSideProps をインポート
import nookies from 'nookies'; // ★ nookies をインポート
import { adminAuth, getAdminDb } from '../lib/firebase-admin'; // ★ firebase-admin をインポート
import Head from 'next/head'; // ★ Head をインポート
import Link from 'next/link'; // ★ Link をインポート
import { RiArrowLeftLine } from 'react-icons/ri'; // ★ アイコンをインポート

// Firebaseのクライアントサイド初期化は不要になります。
// サーバーサイドで認証が完了し、propsでユーザー情報が渡されるためです。

// --- 型定義 ---
interface Flyer {
  id: string;
  shopName: string;
  imageUrl: string;
  region?: string;
}

interface FlyersPageProps {
  user: { // ★ getServerSidePropsから渡されるユーザー情報
    email: string;
  };
}

const FlyersPage: NextPage<FlyersPageProps> = ({ user }) => {
  const [flyers, setFlyers] = useState<Flyer[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('上のボタンからエリアを選択してください。');
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);

  const getFlyers = async (region: string) => {
    setLoading(true);
    setFlyers([]);
    setSelectedRegion(region);
    setMessage('読み込み中...');

    try {
      const response = await fetch(`/api/getFlyers?region=${encodeURIComponent(region)}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `API request failed with status ${response.status}`);
      }

      const data: Flyer[] = await response.json();
      
      if (data.length > 0) {
        setFlyers(data);
      } else {
        setMessage(`<b>${region}</b>の一致する情報が見つかりませんでした。`);
        setFlyers([]);
      }
    } catch (error) {
      console.error("Error getting flyers from API route: ", error);
      setMessage("データの取得中にエラーが発生しました。");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-100">
        <Head>
            <title>スーパーのチラシ - みんなの那須アプリ</title>
        </Head>

        <header className="bg-white shadow-sm sticky top-0 z-10">
            <div className="max-w-4xl mx-auto p-4 flex items-center">
                <Link href="/mypage" className="text-gray-600 hover:text-blue-500 mr-4">
                    <RiArrowLeftLine size={24} />
                </Link>
                <h1 className="text-xl font-bold text-gray-800">スーパーのチラシ</h1>
            </div>
        </header>

        <main className="max-w-4xl mx-auto p-4 sm:p-6">
            <div className="bg-white p-6 rounded-xl shadow-md mb-6">
                <p className="text-center text-gray-700 mb-4">閲覧したいエリアを選択してください。</p>
                <div className="flex justify-center space-x-2 sm:space-x-4">
                    {['那須塩原市', '大田原市', '那須町'].map((region) => (
                        <button 
                            key={region}
                            onClick={() => getFlyers(region)} 
                            className={`px-4 py-2 text-sm sm:text-base font-bold rounded-lg transition-all shadow-sm hover:shadow-md transform hover:-translate-y-0.5
                                ${selectedRegion === region 
                                    ? 'bg-blue-600 text-white' 
                                    : 'bg-blue-100 text-blue-800 hover:bg-blue-200'}`
                                }
                        >
                            {region}
                        </button>
                    ))}
                </div>
            </div>

            <div className="mt-6">
                {loading && <p className="text-center text-gray-600">読み込み中...</p>}
                
                {!loading && flyers.length === 0 && (
                    <p className="text-center text-gray-600" dangerouslySetInnerHTML={{ __html: message }}></p>
                )}
                
                {!loading && flyers.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                        {flyers.map(flyer => (
                            <div key={flyer.id} className="bg-white rounded-lg shadow-md overflow-hidden transition transform hover:scale-105">
                                <img src={flyer.imageUrl} alt={`${flyer.shopName}のチラシ`} className="w-full h-auto object-cover" />
                                <div className="p-4">
                                    <h3 className="font-bold text-lg text-gray-800">{flyer.shopName}</h3>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </main>
    </div>
  );
};

// ★★★ ここから新規追加 ★★★
export const getServerSideProps: GetServerSideProps = async (context) => {
    try {
        const cookies = nookies.get(context);
        if (!cookies.token) {
            return { redirect: { destination: '/login', permanent: false } };
        }

        const token = await adminAuth().verifySessionCookie(cookies.token, true);
        const userDoc = await getAdminDb().collection('users').doc(token.uid).get();

        if (!userDoc.exists) {
            return { redirect: { destination: '/login', permanent: false } };
        }

        const userData = userDoc.data() || {};
        const userPlan = userData.plan || 'free';

        // 無料会員 (free) がこのページにアクセスしたら、無料トップページにリダイレクト
        if (userPlan === 'free') {
            return { redirect: { destination: '/home', permanent: false } };
        }

        // 有料会員はページを表示
        return {
            props: {
                user: {
                    email: token.email || '',
                },
            },
        };

    } catch (error) {
        console.error("flyers.tsx getServerSideProps エラー:", error);
        // エラーが発生した場合はログインページにリダイレクト
        return {
            redirect: {
                destination: '/login',
                permanent: false,
            },
        };
    }
};
// ★★★ ここまで新規追加 ★★★

export default FlyersPage;