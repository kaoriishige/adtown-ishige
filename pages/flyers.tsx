import { GetStaticProps, NextPage } from 'next';
import Head from 'next/head';
import Image from 'next/image';
import Link from 'next/link';
import { adminDb } from '@/lib/firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';

// --- 型定義 ---
// チラシデータの型
interface Flyer {
  id: string;
  imageUrl: string;
  storeName: string;
  validUntil: string; // 日付は文字列としてページに渡す
}

// ページが受け取るpropsの型
interface FlyersPageProps {
  flyers: Flyer[];
}


// --- ページコンポーネント ---
const FlyersPage: NextPage<FlyersPageProps> = ({ flyers }) => {
  return (
    <>
      <Head>
        <title>本日のチラシ - みんなの那須アプリ</title>
      </Head>
      <div className="bg-gray-100 min-h-screen">
        <div className="max-w-5xl mx-auto p-4 md:p-6">
          <header className="text-center py-6 md:py-8">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-800">本日のチラシ</h1>
            <p className="text-gray-600 mt-2">気になるお店のお得情報をチェック！</p>
          </header>

          {flyers.length > 0 ? (
            <main className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {flyers.map((flyer) => (
                <Link key={flyer.id} href={`/flyers/${flyer.id}`} className="group block bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300 overflow-hidden">
                  <div className="relative w-full aspect-[3/4]">
                    <Image
                      src={flyer.imageUrl}
                      alt={`${flyer.storeName}のチラシ`}
                      layout="fill"
                      objectFit="cover"
                      className="group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <div className="p-3">
                    <h2 className="text-md font-bold text-gray-900 truncate">{flyer.storeName}</h2>
                    <p className="text-sm text-gray-500 mt-1">
                      有効期限: {new Date(flyer.validUntil).toLocaleDateString('ja-JP')}
                    </p>
                  </div>
                </Link>
              ))}
            </main>
          ) : (
            <div className="text-center py-20">
              <p className="text-lg text-gray-500">現在、閲覧できるチラシはありません。</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
};


// --- データ取得 (ビルド時にサーバーサイドで実行) ---
export const getStaticProps: GetStaticProps<FlyersPageProps> = async () => {
  try {
    const flyersSnapshot = await adminDb
      .collection('flyers')
      .where('validUntil', '>=', new Date()) // 有効期限が切れていないものだけを取得
      .orderBy('validUntil', 'asc') // 期限が近い順に並べる
      .get();

    const flyers = flyersSnapshot.docs.map((doc) => {
      const data = doc.data();
      // FirestoreのTimestamp型を、ページに渡せる文字列(ISO形式)に変換
      const validUntil = (data.validUntil as Timestamp).toDate().toISOString();
      
      return {
        id: doc.id,
        imageUrl: data.imageUrl || '',
        storeName: data.storeName || '店舗名未設定',
        validUntil: validUntil,
      };
    });

    return {
      props: {
        flyers,
      },
      // 3600秒 (1時間) ごとにページを再生成して、新しいチラシを反映
      revalidate: 3600,
    };
  } catch (error) {
    console.error("チラシの取得に失敗しました:", error);
    // エラーが発生した場合は、空のチラシリストを渡してページを表示
    return {
      props: {
        flyers: [],
      },
    };
  }
};

export default FlyersPage;