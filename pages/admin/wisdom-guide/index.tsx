import { NextPage } from 'next';
import Link from 'next/link';
import { RiAddLine, RiPencilLine, RiDeleteBinLine } from 'react-icons/ri';
import AdminLayout from '@/components/admin/AdminLayout'; // 適切なパスに修正してください

// このインターフェースはFirestoreのドキュメント構造に合わせてください
interface GuideItem {
  id: string;
  title: string;
  updatedAt: string; 
}

// ダミーデータ（実際はAPIから取得します）
const dummyGuides: GuideItem[] = [
  { id: '1', title: '節約術の基本', updatedAt: '2025/11/01' },
  { id: '2', title: '那須の隠れた名店', updatedAt: '2025/11/15' },
];

const WisdomGuideList: NextPage = () => {
  // const [guides, setGuides] = useState<GuideItem[]>([]);
  // const [isLoading, setIsLoading] = useState(true);

  // useEffect(() => {
  //   // 実際には /api/admin/wisdom-guide からデータをフェッチ
  //   fetchGuides().then(data => { setGuides(data); setIsLoading(false); });
  // }, []);

  const handleDelete = (id: string) => {
    if (window.confirm(`ID: ${id} の記事を削除しますか？`)) {
      // 削除APIを呼び出すロジック
      console.log(`Deleting guide ${id}`);
    }
  };

  return (
    <AdminLayout>
      <header className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">知恵袋ガイド管理</h1>
        <Link href="/admin/wisdom-guide/new" legacyBehavior>
          <a className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg shadow-md flex items-center transition">
            <RiAddLine className="mr-2" />
            新規作成
          </a>
        </Link>
      </header>

      <div className="bg-white shadow-xl rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">タイトル</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">更新日</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-24">操作</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {dummyGuides.map((guide) => (
              <tr key={guide.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {guide.title}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {guide.updatedAt}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                  <Link href={`/admin/wisdom-guide/${guide.id}`} legacyBehavior>
                    <a className="text-indigo-600 hover:text-indigo-900 p-1 rounded hover:bg-indigo-50">
                      <RiPencilLine className="inline-block w-5 h-5" />
                    </a>
                  </Link>
                  <button 
                    onClick={() => handleDelete(guide.id)} 
                    className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50"
                  >
                    <RiDeleteBinLine className="inline-block w-5 h-5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminLayout>
  );
};

export default WisdomGuideList;