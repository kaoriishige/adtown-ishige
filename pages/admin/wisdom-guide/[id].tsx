import { NextPage } from 'next';
import { useRouter } from 'next/router';
// ⭐ 相対パスに修正
import AdminLayout from '../../../components/admin/AdminLayout'; 
import WisdomGuideForm from '../../../components/admin/WisdomGuideForm'; 

// このインターフェースはFirestoreのドキュメント構造に合わせてください
interface GuideData {
  title: string;
  content: string;
  category: string;
  isPublished: boolean;
}

// ダミーデータ（実際はAPIから取得します）
const dummyGuideData: GuideData = {
    title: '節約術の基本',
    content: '今日はスーパー特売価格.comを使った買い物のコツについて解説します...',
    category: '節約',
    isPublished: true,
};

const WisdomGuideEdit: NextPage = () => {
  const router = useRouter();
  const { id } = router.query;
  const isNew = id === 'new';
  
  const initialData = isNew ? null : dummyGuideData;

  const handleSubmit = async (data: GuideData) => {
    console.log('Submitted data:', data);
    
    const endpoint = isNew ? '/api/admin/wisdom-guide' : `/api/admin/wisdom-guide?id=${id}`;
    const method = isNew ? 'POST' : 'PUT';
    
    try {
      const res = await fetch(endpoint, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (res.ok) {
        alert(`記事を${isNew ? '作成' : '更新'}しました。`);
        router.push('/admin/wisdom-guide');
      } else {
        throw new Error('API Error');
      }
    } catch (error) {
      console.error(error);
      alert('処理中にエラーが発生しました。');
    }
  };

  if (!isNew && !initialData) {
      return <AdminLayout><div>読み込み中...</div></AdminLayout>;
  }

  return (
    <AdminLayout>
      <h1 className="text-3xl font-bold mb-6">
        {isNew ? '新規ガイド記事作成' : 'ガイド記事編集'}
      </h1>
      
      <WisdomGuideForm 
        initialData={initialData} 
        onSubmit={handleSubmit} 
      />
    </AdminLayout>
  );
};

export default WisdomGuideEdit;