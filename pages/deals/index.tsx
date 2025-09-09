import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../../lib/firebase'; // TODO: Firebaseのdbインスタンスをインポートするパスを確認してください

// --- データ型定義 ---
interface Subcategory {
  id: string;
  name: string;
  order: number;
}

interface Category {
  id: string;
  name: string;
  order: number;
  subcategories: Subcategory[];
}

const DealsIndexPage = () => {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openCategory, setOpenCategory] = useState<string | null>(null);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        // TODO: Firestoreのコレクション名を実際の名称に合わせてください (例: 'dealCategories')
        const categoriesCollectionRef = collection(db, 'dealCategories');
        const q = query(categoriesCollectionRef, orderBy('order'));
        const categoriesSnapshot = await getDocs(q);

        const categoriesData = await Promise.all(
          categoriesSnapshot.docs.map(async (categoryDoc) => {
            const category = {
              id: categoryDoc.id,
              name: categoryDoc.data().name,
              order: categoryDoc.data().order,
              subcategories: [],
            } as Category;

            // 各カテゴリーのサブコレクションからサブカテゴリーを取得
            const subcategoriesCollectionRef = collection(db, 'dealCategories', categoryDoc.id, 'subcategories');
            const subQ = query(subcategoriesCollectionRef, orderBy('order'));
            const subcategoriesSnapshot = await getDocs(subQ);
            
            category.subcategories = subcategoriesSnapshot.docs.map(subDoc => ({
              id: subDoc.id,
              name: subDoc.data().name,
              order: subDoc.data().order,
            }));

            return category;
          })
        );

        setCategories(categoriesData);
      } catch (err) {
        console.error("カテゴリーの取得に失敗しました:", err);
        setError("データの読み込みに失敗しました。時間をおいて再度お試しください。");
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  const handleCategoryToggle = (categoryName: string) => {
    setOpenCategory(prevOpenCategory => 
      prevOpenCategory === categoryName ? null : categoryName
    );
  };

  const handleSubcategoryClick = (categoryName: string, subcategoryName: string) => {
    // URLエンコードして、日本語のURLでも正しく遷移できるようにする
    const encodedCategory = encodeURIComponent(categoryName);
    const encodedSubcategory = encodeURIComponent(subcategoryName);
    router.push(`/deals/${encodedCategory}/${encodedSubcategory}`);
  };

  if (loading) {
    return <div className="text-center p-10">読み込み中...</div>;
  }

  if (error) {
    return <div className="text-center p-10 text-red-500">{error}</div>;
  }

  return (
    // TODO: 全体のレイアウトコンポーネントがあればそれで囲ってください
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <h1 className="text-2xl font-bold text-center mb-6">地域のお店を応援</h1>
      <p className="text-center text-gray-600 mb-8">カテゴリを選択してください</p>
      
      <div className="space-y-4">
        {categories.map((category) => (
          <div key={category.id} className="border rounded-lg overflow-hidden">
            {/* TODO: UIライブラリのアコーディオンコンポーネントがあれば置き換えてください */}
            <button
              onClick={() => handleCategoryToggle(category.name)}
              className="w-full flex justify-between items-center p-4 bg-gray-50 hover:bg-gray-100 focus:outline-none"
            >
              <span className="text-lg font-semibold">{category.name}</span>
              {/* アイコンの向きをStateで変更 */}
              <svg 
                className={`w-6 h-6 transition-transform transform ${openCategory === category.name ? 'rotate-180' : ''}`} 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24" 
                xmlns="http://www.w3.org/2000/svg"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
              </svg>
            </button>
            
            {/* 開かれているカテゴリーのサブカテゴリーのみ表示 */}
            {openCategory === category.name && (
              <div className="p-4 grid grid-cols-2 sm:grid-cols-3 gap-4 bg-white">
                {category.subcategories.map((subcategory) => (
                  <button
                    key={subcategory.id}
                    onClick={() => handleSubcategoryClick(category.name, subcategory.name)}
                    className="p-3 text-center bg-white border rounded-md shadow-sm hover:bg-blue-50 hover:border-blue-300 transition"
                  >
                    {subcategory.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default DealsIndexPage;