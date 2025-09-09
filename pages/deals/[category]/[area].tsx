import { NextPage, GetServerSideProps } from 'next';
import { useRouter } from 'next/router';
// ▼▼▼ 修正点: クライアントサイドの 'firebase/firestore' は不要なため削除 ▼▼▼
import { getAdminDb } from '../../../lib/firebase-admin';
import Link from 'next/link';

interface Store {
    id: string;
    storeName: string;
    address: string;
    // 必要に応じて他の店舗情報も追加
}

interface PageProps {
    stores: Store[];
}

const StoreListPage: NextPage<PageProps> = ({ stores }) => {
    const router = useRouter();
    const { category, area, sub } = router.query;

    return (
        <div className="min-h-screen bg-gray-50 font-sans p-4">
            <header className="max-w-4xl mx-auto text-center py-6">
                <h1 className="text-2xl font-bold text-gray-800">{area}のお店一覧</h1>
                <p className="text-gray-600 mt-2">
                    カテゴリ: {category} &gt; {sub}
                </p>
            </header>

            <main className="max-w-4xl mx-auto">
                <div className="my-4 text-center">
                     <Link href={`/deals/select-area?main=${encodeURIComponent(category as string)}&sub=${encodeURIComponent(sub as string)}`}>
                        <a className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-6 rounded-lg">
                            ← エリア選択に戻る
                        </a>
                    </Link>
                </div>

                {stores.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {stores.map(store => (
                            <Link key={store.id} href={`/store/${store.id}`}>
                                <a className="block bg-white p-6 rounded-lg shadow-md hover:shadow-xl transition-shadow">
                                    <h2 className="text-xl font-bold text-gray-800">{store.storeName}</h2>
                                    <p className="text-gray-600 mt-2">{store.address}</p>
                                    {/* 他の店舗情報を表示 */}
                                </a>
                            </Link>
                        ))}
                    </div>
                ) : (
                    <div className="text-center bg-white p-8 rounded-lg shadow-md">
                        <p className="text-gray-600">この条件に合う店舗はまだ登録されていません。</p>
                    </div>
                )}
            </main>
        </div>
    );
};

export const getServerSideProps: GetServerSideProps = async (context) => {
    const { category, area, sub } = context.query;

    if (!category || !area || !sub) {
        return { notFound: true };
    }

    try {
        const db = getAdminDb();
        // ▼▼▼ 修正点: Firebase Admin SDKの記法に修正 ▼▼▼
        const usersRef = db.collection('users');
        
        const q = usersRef
            .where('role', '==', 'partner')
            .where('status', '==', 'approved') // 承認済みの店舗のみ表示
            .where('category.main', '==', category)
            .where('category.sub', '==', sub)
            .where('area', '==', area);

        const querySnapshot = await q.get();
        // ▲▲▲ ここまで ▲▲▲

        const stores: Store[] = querySnapshot.docs.map(doc => ({
            id: doc.id,
            storeName: doc.data().storeName || '',
            address: doc.data().address || '',
            ...JSON.parse(JSON.stringify(doc.data())),
        }));

        return {
            props: { stores },
        };
    } catch (error) {
        console.error("Error fetching stores:", error);
        return {
            props: { stores: [] },
        };
    }
};

export default StoreListPage;