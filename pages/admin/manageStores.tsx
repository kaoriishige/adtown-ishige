import { GetServerSideProps, NextPage } from 'next';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useState } from 'react';
import { getAdminDb } from '@/lib/firebase-admin';
import { doc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase'; // 削除処理のためにクライアント用も必要

// 店舗データの型定義に登録日を追加
interface Store {
  id: string;
  name: string;
  category: string;
  area: string;
  ownerUid: string;
  createdAt: string; // 登録日を追加
}

interface ManageStoresProps {
  stores: Store[];
}

// URLのslugから日本語の名前に変換するための対応表
const categoryNames: { [key: string]: string } = {
  'restaurant': '飲食店',
  'hair-salon': '美容室',
  'beauty': 'Beauty',
  'health': 'Health',
  'living': '暮らし',
  'leisure': 'レジャー',
};
const areaNames: { [key: string]: string } = {
  'nasushiobara': '那須塩原市',
  'ohtawara': '大田原市',
  'nasu': '那須町',
};

const ManageStoresPage: NextPage<ManageStoresProps> = ({ stores }) => {
  const router = useRouter();
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleDelete = async (storeId: string, storeName: string) => {
    // confirmはブラウザの標準機能ですが、より良いUIのためにはカスタムモーダルの実装を推奨します
    if (confirm(`本当に店舗「${storeName}」を削除しますか？この操作は元に戻せません。`)) {
      try {
        await deleteDoc(doc(db, 'stores', storeId));
        alert('店舗を削除しました');
        router.reload();
      } catch (error) {
        console.error("店舗の削除中にエラーが発生しました: ", error);
        alert('削除中にエラーが発生しました');
      }
    }
  };

  const handleCopyUrl = (id: string, type: 'store' | 'referral') => {
    const baseUrl = `https://minna-no-nasu-app.netlify.app`;
    const url = type === 'store' 
      ? `${baseUrl}/store/${id}` 
      : `${baseUrl}/signup?ref=${id}`;

    const textArea = document.createElement("textarea");
    textArea.value = url;
    document.body.appendChild(textArea);
    textArea.select();
    try {
      document.execCommand('copy');
      setCopiedId(`${id}-${type}`);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error('URLのコピーに失敗しました', err);
    }
    document.body.removeChild(textArea);
  };

  return (
    <div className="p-5">
      <Link href="/admin" className="text-blue-500 hover:underline">
        ← 管理メニューに戻る
      </Link>
      <h1 className="text-3xl font-bold my-6 text-center">店舗管理</h1>
      <div className="text-center mb-6">
        <Link href="/admin/addStore">
          <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
            新規店舗追加
          </button>
        </Link>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-6 py-3 border-b-2 border-gray-200 text-left text-xs font-semibold text-gray-600 uppercase">店舗名</th>
              <th className="px-6 py-3 border-b-2 border-gray-200 text-left text-xs font-semibold text-gray-600 uppercase">カテゴリ</th>
              <th className="px-6 py-3 border-b-2 border-gray-200 text-left text-xs font-semibold text-gray-600 uppercase">エリア</th>
              {/* ▼▼▼ 変更点 1: 登録日の列ヘッダーを追加 ▼▼▼ */}
              <th className="px-6 py-3 border-b-2 border-gray-200 text-left text-xs font-semibold text-gray-600 uppercase">登録日</th>
              <th className="px-6 py-3 border-b-2 border-gray-200 text-left text-xs font-semibold text-gray-600 uppercase">紹介URL</th>
              <th className="px-6 py-3 border-b-2 border-gray-200 text-left text-xs font-semibold text-gray-600 uppercase">操作</th>
            </tr>
          </thead>
          <tbody>
            {stores.map((store) => (
              <tr key={store.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 border-b border-gray-200">{store.name}</td>
                <td className="px-6 py-4 border-b border-gray-200">{store.category}</td>
                <td className="px-6 py-4 border-b border-gray-200">{store.area}</td>
                {/* ▼▼▼ 変更点 2: 登録日を表示するセルを追加 ▼▼▼ */}
                <td className="px-6 py-4 border-b border-gray-200">{store.createdAt}</td>
                <td className="px-6 py-4 border-b border-gray-200 whitespace-nowrap">
                  <button 
                    onClick={() => handleCopyUrl(store.ownerUid, 'referral')} 
                    className="text-purple-600 hover:text-purple-900"
                    disabled={!store.ownerUid} 
                    title={!store.ownerUid ? "この店舗には紹介者が紐付いていません" : ""}
                  >
                    {copiedId === `${store.ownerUid}-referral` ? 'コピーしました！' : '紹介URLをコピー'}
                  </button>
                </td>
                <td className="px-6 py-4 border-b border-gray-200 whitespace-nowrap">
                  <Link href={`/admin/editStore/${store.id}`}>
                    <button className="text-indigo-600 hover:text-indigo-900 mr-4">編集</button>
                  </Link>
                  <button onClick={() => handleCopyUrl(store.id, 'store')} className="text-green-600 hover:text-green-900 mr-4">
                    {copiedId === `${store.id}-store` ? 'コピー！' : '店舗URL'}
                  </button>
                  <button onClick={() => handleDelete(store.id, store.name)} className="text-red-600 hover:text-red-900">削除</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export const getServerSideProps: GetServerSideProps = async () => {
  try {
    const adminDb = getAdminDb();
    const storesCollectionRef = adminDb.collection('stores');
    // ▼▼▼ 変更点 3: 登録日の降順で並び替え ▼▼▼
    const querySnapshot = await storesCollectionRef.orderBy('createdAt', 'desc').get();

    const stores = querySnapshot.docs.map(doc => {
      const data = doc.data();
      
      // ▼▼▼ 変更点 4: 登録日(createdAt)を取得し、日付形式にフォーマット ▼▼▼
      const createdAtTimestamp = data.createdAt;
      const formattedDate = createdAtTimestamp 
        ? new Date(createdAtTimestamp.seconds * 1000).toLocaleDateString('ja-JP') 
        : 'N/A';

      return {
        id: doc.id,
        name: data.name || '',
        category: categoryNames[data.category] || data.category,
        area: areaNames[data.area] || data.area,
        ownerUid: data.ownerUid || '',
        createdAt: formattedDate, // フォーマットした日付を渡す
      };
    });

    return {
      props: {
        stores: JSON.parse(JSON.stringify(stores)),
      },
    };
  } catch (error) {
    console.error("Error fetching stores:", error);
    return {
      props: {
        stores: [],
      },
    };
  }
};

export default ManageStoresPage;