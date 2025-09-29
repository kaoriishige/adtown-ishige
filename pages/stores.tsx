import { GetServerSideProps, NextPage } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import { adminDb } from '../lib/firebase-admin';
import AppCard from '../components/AppCard';

// アプリデータの型
interface AppData {
  id: string;
  name: string;
  description: string;
  iconUrl: string;
  shopName?: string;
}

// 店舗名でグループ化されたアプリの型
interface GroupedApps {
  [shopName: string]: AppData[];
}

// ページが受け取るpropsの型
interface StoresPageProps {
  appsByStore: GroupedApps;
}

const StoresPage: NextPage<StoresPageProps> = ({ appsByStore }) => {
  const stores = Object.keys(appsByStore);

  return (
    <div className="bg-blue-50 min-h-screen">
      <Head>
        <title>店舗別 お得情報アプリ一覧 | みんなの那須アプリ</title>
      </Head>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="mb-8">
            <Link href="/home" className="text-blue-600 hover:underline">
                ← アプリのジャンル選択に戻る
            </Link>
        </div>

        <h1 className="text-3xl sm:text-4xl font-extrabold text-blue-900 text-center mb-12">
          店舗別 お得情報アプリ
        </h1>

        {stores.length > 0 ? (
          <div className="space-y-12">
            {stores.map((shopName) => (
              <section key={shopName}>
                <h2 className="text-2xl font-bold text-gray-800 mb-6 border-b-2 border-blue-200 pb-2">{shopName}</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                  {appsByStore[shopName].map((app) => (
                    <AppCard
                      key={app.id}
                      id={app.id}
                      name={app.name}
                      description={app.description}
                      iconUrl={app.iconUrl}
                    />
                  ))}
                </div>
              </section>
            ))}
          </div>
        ) : (
          <p className="text-center text-gray-500">店舗に紐づくお得情報アプリはまだありません。</p>
        )}
      </main>
    </div>
  );
};

export const getServerSideProps: GetServerSideProps = async () => {
  const adminDb = adminDb();

  if (!adminDb) {
    console.error("Firebase Admin for StoresPage failed to initialize.");
    return { props: { appsByStore: {} } };
  }

  try {
    // 'shopName'フィールドが存在するアプリのみを取得
    const appsSnapshot = await adminDb.collection('apps').where('shopName', '!=', null).get();

    const appsByStore: GroupedApps = {};

    appsSnapshot.docs.forEach(doc => {
      const data = doc.data();
      const shopName = data.shopName;

      // shopNameが文字列で、空でないことを確認
      if (typeof shopName === 'string' && shopName.trim() !== '') {
        const appData: AppData = {
          id: doc.id,
          name: data.name || '名称未設定',
          description: data.description || '説明未設定',
          iconUrl: data.iconUrl || '',
          shopName: shopName,
        };
        
        if (!appsByStore[shopName]) {
          appsByStore[shopName] = [];
        }
        appsByStore[shopName].push(appData);
      }
    });

    return {
      props: {
        appsByStore: JSON.parse(JSON.stringify(appsByStore)),
      },
    };
  } catch (error) {
    console.error("Error fetching apps by store:", error);
    return {
      props: {
        appsByStore: {},
      },
    };
  }
};

export default StoresPage;