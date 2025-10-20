// pages/deals/store/[storeId].tsx
import { GetServerSideProps, NextPage } from 'next';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Image from 'next/image';
import { RiArrowLeftSLine, RiGlobalLine, RiInstagramLine, RiTwitterLine, RiFacebookBoxLine } from 'react-icons/ri';
import { Timestamp } from 'firebase/firestore';
import { adminDb } from '../../../lib/firebase-admin';

declare const __app_id: string;
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

// ========================= 型定義 =========================
interface StoreData {
  id: string;
  storeName: string;
  address: string;
  phoneNumber: string;
  mainCategory: string;
  subCategory: string;
  description: string;
  websiteUrl?: string;
  snsUrls?: string[];
  mainImageUrl?: string;
  galleryImageUrls?: string[];
  ownerId: string;
  status: string;
  storeId?: string;
}

interface DealData {
  id: string;
  type: 'お得情報' | 'クーポン' | 'フードロス';
  title: string;
  description: string;
  imageUrl?: string;
  createdAt: string;
}

interface Props {
  store: StoreData | null;
  deals: DealData[];
  error?: string;
}

// ========================= SSR 部分 =========================
export const getServerSideProps: GetServerSideProps<Props> = async (context) => {
  const { storeId } = context.params as { storeId: string };

  if (!storeId) {
    return { props: { store: null, deals: [], error: '店舗IDが指定されていません。' } };
  }

  try {
    console.log('🟢 Firestore query start — storeId:', storeId);

    // -------- 店舗検索 --------
    const storesCollectionGroupRef = adminDb.collectionGroup('stores').where('storeId', '==', storeId);
    const querySnapshot = await storesCollectionGroupRef.limit(1).get();

    if (querySnapshot.empty) {
      return { props: { store: null, deals: [], error: '指定された店舗が見つかりません。' } };
    }

    const storeDoc = querySnapshot.docs[0];
    const rawStoreData = storeDoc.data();
    const storeStatus = rawStoreData.status;

    if (storeStatus !== 'approved' && storeStatus !== 'active') {
      console.warn(`⚠️ 店舗ID: ${storeId} は非公開 (status=${storeStatus})`);
      return { props: { store: null, deals: [], error: '指定された店舗は公開されていません。' } };
    }

    // -------- ownerId 抽出 --------
    const pathSegments = storeDoc.ref.path.split('/');
    const ownerId = pathSegments[3];
    if (!ownerId) {
      return { props: { store: null, deals: [], error: '店舗オーナー情報が不正です。' } };
    }

    const storeData: StoreData = {
      id: storeDoc.id,
      ...rawStoreData,
      ownerId,
      status: storeStatus,
    } as StoreData;

    // -------- ディール取得 --------
    const dealsRef = adminDb
      .collection('artifacts')
      .doc(appId)
      .collection('users')
      .doc(ownerId)
      .collection('stores')
      .doc(storeId)
      .collection('deals');

    const dealsQuery = dealsRef.where('isActive', '==', true).orderBy('createdAt', 'desc').limit(10);

    const dealsSnapshot = await dealsQuery.get();

    const dealsData: DealData[] = dealsSnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        type: data.type || 'お得情報',
        title: data.title || 'タイトルなし',
        description: data.description || '説明なし',
        imageUrl: data.imageUrl,
        createdAt:
          (data.createdAt as Timestamp)?.toDate().toLocaleDateString('ja-JP', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
          }) || '',
      };
    });

    return { props: { store: storeData, deals: dealsData } };
  } catch (error: any) {
    // 🔥 Firestoreのインデックス不足エラーを明確化
    console.error('🔥 Firestore query error:', error);

    // Firestoreエラー詳細のURLが含まれている場合は強調して出す
    if (error.message && error.message.includes('https://console.firebase.google.com')) {
      console.error('\n🔗 Firestore Index URL:\n', error.message.match(/https:\/\/console\.firebase\.google\.com[^\s]+/g)?.[0]);
    } else {
      console.error('\nℹ️ Firestoreエラー詳細 (URLは含まれていません)');
    }

    return {
      props: {
        store: null,
        deals: [],
        error: `データの読み込み中に予期せぬエラーが発生しました。詳細: ${error.message}`,
      },
    };
  }
};

// ========================= UI =========================
const StoreDetailPage: NextPage<Props> = ({ store, deals, error }) => {
  const router = useRouter();

  if (error) {
    return (
      <div className="min-h-screen p-4 bg-gray-50">
        <p className="text-red-500 my-4 bg-red-100 p-3 rounded">{error}</p>
        <button onClick={() => router.back()} className="mt-4 text-blue-600 hover:underline flex items-center">
          <RiArrowLeftSLine size={24} className="mr-1" /> 戻る
        </button>
      </div>
    );
  }

  if (!store) {
    return <div className="min-h-screen p-4 flex justify-center items-center">店舗情報が見つかりませんでした。</div>;
  }

  const getSnsIcon = (url: string) => {
    if (url.includes('twitter.com') || url.includes('x.com')) return <RiTwitterLine size={24} className="text-gray-600 group-hover:text-blue-500" />;
    if (url.includes('instagram.com')) return <RiInstagramLine size={24} className="text-gray-600 group-hover:text-pink-600" />;
    if (url.includes('facebook.com')) return <RiFacebookBoxLine size={24} className="text-gray-600 group-hover:text-blue-800" />;
    return <RiGlobalLine size={24} className="text-gray-600 group-hover:text-gray-800" />;
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <Head>
        <title>{`${store.storeName} - 店舗情報`}</title>
      </Head>

      <header className="bg-white p-4 text-center sticky top-0 z-10 shadow-sm flex items-center">
        <button onClick={() => router.back()} className="p-2 rounded-full hover:bg-gray-200 absolute left-2">
          <RiArrowLeftSLine size={28} />
        </button>
        <h1 className="text-xl font-bold mx-auto text-gray-800 truncate">{store.storeName}</h1>
      </header>

      <main className="max-w-4xl mx-auto pb-8">
        {/* 以下UI部分はあなたの元コードのまま */}
      </main>
    </div>
  );
};

export default StoreDetailPage;
