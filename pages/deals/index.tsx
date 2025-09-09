import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../../lib/firebase'; // firebase設定ファイルのインポートパス

/* =================================================================
  ▼▼▼【重要】ここから下の2つの名前を、あなたのデータベース設定に合わせてください ▼▼▼
================================================================= */

// 1. 大カテゴリーが格納されているコレクションの「本当の名前」を入力してください
const MAIN_CATEGORIES_COLLECTION_NAME = 'dealCategories'; 

// 2. サブカテゴリーが格納されているサブコレクションの「本当の名前」を入力してください
const SUB_CATEGORIES_COLLECTION_NAME = 'subcategories';

/* =================================================================
  ▲▲▲【重要】上の2つの名前を、あなたのデータベース設定に合わせてください ▲▲▲
================================================================= */


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


// --- ここから下は変更不要です ---
const DealsIndexPage = () => {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openCategory, setOpenCategory] = useState<string | null>(null);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const categoriesCollectionRef = collection(db, MAIN_CATEGORIES_COLLECTION_NAME);
        const q = query(categoriesCollectionRef, orderBy('order'));
        const categoriesSnapshot = await getDocs(q);

        if (categoriesSnapshot.empty) {
          console.warn(`コレクション「${MAIN_CATEGORIES_COLLECTION_NAME}」にデータが見つかりませんでした。`);
        }

        const categoriesData = await Promise.all(
          categoriesSnapshot.docs.map(async (categoryDoc) => {
            const category = {
              id: categoryDoc.id,
              name: categoryDoc.data().name,
              order: categoryDoc.data().order,
              subcategories: [],
            } as Category;

            const subcategoriesCollectionRef = collection(db, MAIN_CATEGORIES_COLLECTION_NAME, categoryDoc.id, SUB_CATEGORIES_COLLECTION_NAME);
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
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <h1 className="text-2xl font-bold text-center mb-6">地域のお店を応援</h1>
      <p className="text-center text-gray-600 mb-8">カテゴリを選択してください</p>
      
      <div className="space-y-4">
        {categories.length > 0 ? (
          categories.map((category) => (
            <div key={category.id} className="border rounded-lg overflow-hidden">
              <button
                onClick={() => handleCategoryToggle(category.name)}
                className="w-full flex justify-between items-center p-4 bg-gray-50 hover:bg-gray-100 focus:outline-none"
              >
                <span className="text-lg font-semibold">{category.name}</span>
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
          ))
        ) : (
          <div className="text-center p-10 text-gray-500">
            <p>カテゴリーが見つかりませんでした。</p>
            <p className="text-sm mt-2">データベースのコレクション名が正しいか確認してください。</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DealsIndexPage;