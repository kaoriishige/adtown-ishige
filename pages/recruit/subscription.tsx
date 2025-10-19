import { GetServerSideProps, NextPage } from 'next';
import { adminAuth, adminDb } from '@/lib/firebase-admin'; // Firebase Admin SDK
import nookies from 'nookies';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { Loader2 } from 'lucide-react'; // アイコンはお好みで

// ページに渡されるデータの型定義
interface SubscriptionProps {
  user: {
    uid: string;
    email: string | null;
  };
  subscription: {
    id: string;
    status: string;
    current_period_end: string;
  } | null;
}

const SubscriptionPage: NextPage<SubscriptionProps> = ({ user, subscription }) => {
  const router = useRouter();

  if (!user) {
    // もしユーザー情報がなければローディング表示など
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="animate-spin mr-2" /> 読み込み中...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <Head>
        <title>{"ご契約情報"}</title>
      </Head>
      <div className="max-w-2xl mx-auto bg-white shadow-md rounded-lg p-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">ご契約情報</h1>
        <div className="space-y-4">
          <div>
            <h2 className="text-sm font-medium text-gray-500">メールアドレス</h2>
            <p className="text-lg text-gray-900">{user.email || '登録されていません'}</p>
          </div>
          {subscription ? (
            <>
              <div>
                <h2 className="text-sm font-medium text-gray-500">現在のステータス</h2>
                <p className={`text-lg font-semibold ${subscription.status === 'active' ? 'text-green-600' : 'text-yellow-600'}`}>
                  {subscription.status === 'active' ? '契約中' : '停止中'}
                </p>
              </div>
              <div>
                <h2 className="text-sm font-medium text-gray-500">次回の請求日</h2>
                <p className="text-lg text-gray-900">{subscription.current_period_end}</p>
              </div>
              <p className="text-xs text-gray-500 pt-4">
                ※ 契約の管理はStripeのカスタマーポータルから行えます。
              </p>
            </>
          ) : (
            <p className="text-lg text-red-600">
              ご契約情報が見つかりませんでした。
            </p>
          )}
          <button
            onClick={() => router.push('/recruit/dashboard')}
            className="mt-6 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
          >
            ダッシュボードに戻る
          </button>
        </div>
      </div>
    </div>
  );
};

// サーバーサイドで実行される処理
export const getServerSideProps: GetServerSideProps = async (ctx) => {
  try {
    const cookies = nookies.get(ctx);
    const token = await adminAuth.verifyIdToken(cookies.token); // Cookie名が'token'の場合
    const { uid, email } = token;

    // FirestoreからユーザーのStripe顧客IDなどを取得
    const userDoc = await adminDb.collection('users').doc(uid).get();
    const stripeSubscriptionId = userDoc.data()?.stripeSubscriptionId;

    if (!stripeSubscriptionId) {
      // サブスクリプションIDがない場合
      return { props: { user: { uid, email }, subscription: null } };
    }

    // Stripeからサブスクリプション情報を取得 (Stripe SDKが必要)
    // const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
    // const subData = await stripe.subscriptions.retrieve(stripeSubscriptionId);
    
    // Stripe SDKを使わないダミーデータ（実際のStripe連携部分は別途実装が必要です）
    const dummySubData = {
      id: stripeSubscriptionId,
      status: 'active', // 'active', 'paused'など
      current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('ja-JP'),
    };

    return {
      props: {
        user: { uid, email },
        subscription: dummySubData,
      },
    };
  } catch (err) {
    // 認証失敗時などはログインページにリダイレクト
    return {
      redirect: {
        destination: '/partner/login',
        permanent: false,
      },
    };
  }
};

export default SubscriptionPage;