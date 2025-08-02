import { useState } from 'react';
import { GetServerSideProps, NextPage } from 'next';
import Link from 'next/link';
import nookies from 'nookies';
import { getAdminAuth, getAdminDb } from '../../lib/firebase-admin';

// 新しいランディングページのデータ構造に合わせた型
interface LandingData {
  heroHeadline: string;
  heroSubheadline: string;
  heroCta: string;
  problemTitle: string;
  problemIntro: string;
  problemItem1_Title: string;
  problemItem1_Amount: string;
  problemItem1_Desc: string;
  problemItem2_Title: string;
  problemItem2_Amount: string;
  problemItem2_Desc: string;
  problemItem3_Title: string;
  problemItem3_Amount: string;
  problemItem3_Desc: string;
  problemItem4_Title: string;
  problemItem4_Amount: string;
  problemItem4_Desc: string;
  problemItem5_Title: string;
  problemItem5_Amount: string;
  problemItem5_Desc: string;
  valueTitle: string;
  valueSubTitle: string;
  valueIntro: string;
  valuePoints: string[];
  valueConclusion: string;
  pricingTitle: string;
  pricingSubTitle: string;
  pricingConclusion: string;
  referralTitle: string;
  referralIntro: string;
  referralBonus1_Title: string;
  referralBonus1_Desc: string;
  referralBonus2_Title: string;
  referralBonus2_Desc: string;
  referralPoints: string[];
  referralCaution: string;
  finalCtaTitle: string;
  finalCtaText: string;
  finalCtaButton: string;
  finalCtaNote: string;
  footerNote: string;
}

interface EditorPageProps {
  initialContent: LandingData;
}

const LandingEditorPage: NextPage<EditorPageProps> = ({ initialContent }) => {
  const [data, setData] = useState<LandingData>(initialContent);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setData((prev: LandingData) => ({ ...prev, [name]: value }));
  };

  const handleArrayChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setData((prev: LandingData) => ({ ...prev, [name]: value.split('\n') }));
  };

  const handleSave = async () => {
    setIsLoading(true);
    setMessage('');
    try {
      // APIルート経由で保存処理を呼び出す
      const response = await fetch('/api/admin/update-landing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || '保存に失敗しました。');
      }
      setMessage('保存しました！');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '保存中にエラーが発生しました。');
    } finally {
      setIsLoading(false);
      setTimeout(() => setMessage(''), 3000);
    }
  };

  return (
    <div className="flex bg-gray-100 min-h-screen">
      {/* --- 左側：編集フォーム --- */}
      <div className="w-1/2 p-6 bg-white border-r overflow-y-auto">
        <Link href="/admin" className="text-blue-500 hover:underline">← 管理メニューに戻る</Link>
        <h1 className="text-2xl font-bold my-4">ランディングページ編集</h1>
        <div className="space-y-4">
          {Object.keys(data).map((key) => (
            <div key={key}>
              <label className="block text-sm font-bold mb-1 capitalize">{key.replace(/_/g, ' ')}:</label>
              {Array.isArray((data as any)[key]) ? (
                <textarea 
                  name={key} 
                  value={(data as any)[key].join('\n')} 
                  onChange={handleArrayChange} 
                  rows={5} 
                  className="w-full p-2 border rounded"
                  placeholder="各項目を改行で区切って入力"
                />
              ) : (
                <textarea 
                  name={key} 
                  value={(data as any)[key]} 
                  onChange={handleInputChange} 
                  rows={key.includes('Desc') || key.includes('Intro') ? 5 : 2}
                  className="w-full p-2 border rounded"
                />
              )}
            </div>
          ))}
          <div className="text-center pt-4">
            <button onClick={handleSave} disabled={isLoading} className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-6 rounded disabled:bg-gray-400">
              {isLoading ? '保存中...' : '変更を保存'}
            </button>
            {message && <p className="mt-2 text-sm">{message}</p>}
          </div>
        </div>
      </div>

      {/* --- 右側：簡易プレビュー --- */}
      <div className="w-1/2 overflow-y-auto p-8">
        <h2 className="text-xl font-bold mb-4">簡易プレビュー</h2>
        <div className="bg-white p-6 rounded-lg shadow-md space-y-6">
            <section>
                <h3 className="font-bold text-lg border-b pb-2 mb-2">ファーストビュー</h3>
                <p className="whitespace-pre-wrap text-2xl font-bold">{data.heroHeadline}</p>
                <p className="whitespace-pre-wrap mt-2">{data.heroSubheadline}</p>
                <p className="whitespace-pre-wrap mt-2 text-blue-600 font-semibold">{data.heroCta}</p>
            </section>
            <section>
                <h3 className="font-bold text-lg border-b pb-2 mb-2">問題提起</h3>
                <p className="whitespace-pre-wrap font-semibold">{data.problemTitle}</p>
                <p className="whitespace-pre-wrap mt-2">{data.problemIntro}</p>
            </section>
             <section>
                <h3 className="font-bold text-lg border-b pb-2 mb-2">価値提案</h3>
                <p className="whitespace-pre-wrap font-semibold">{data.valueTitle}</p>
                 <p className="whitespace-pre-wrap mt-2">{data.valueSubTitle}</p>
            </section>
        </div>
      </div>
    </div>
  );
};

export const getServerSideProps: GetServerSideProps = async (context) => {
  const adminAuth = getAdminAuth();
  const adminDb = getAdminDb();

  if (!adminAuth || !adminDb) {
    return { redirect: { destination: '/login', permanent: false } };
  }

  try {
    const cookies = nookies.get(context);
    await adminAuth.verifyIdToken(cookies.token);

    const docRef = adminDb.collection('settings').doc('landingV2');
    const docSnap = await docRef.get();
    
    // データが存在しない場合のデフォルト値
    const fallbackData: LandingData = { 
      heroHeadline: '', heroSubheadline: '', heroCta: '',
      problemTitle: '', problemIntro: '',
      problemItem1_Title: '', problemItem1_Amount: '', problemItem1_Desc: '',
      problemItem2_Title: '', problemItem2_Amount: '', problemItem2_Desc: '',
      problemItem3_Title: '', problemItem3_Amount: '', problemItem3_Desc: '',
      problemItem4_Title: '', problemItem4_Amount: '', problemItem4_Desc: '',
      problemItem5_Title: '', problemItem5_Amount: '', problemItem5_Desc: '',
      valueTitle: '', valueSubTitle: '', valueIntro: '', valuePoints: [], valueConclusion: '',
      pricingTitle: '', pricingSubTitle: '', pricingConclusion: '',
      referralTitle: '', referralIntro: '',
      referralBonus1_Title: '', referralBonus1_Desc: '',
      referralBonus2_Title: '', referralBonus2_Desc: '',
      referralPoints: [], referralCaution: '',
      finalCtaTitle: '', finalCtaText: '', finalCtaButton: '', finalCtaNote: '',
      footerNote: '',
    };
    
    // ▼▼▼ ここを修正しました ▼▼▼
    const dbData = docSnap.exists ? docSnap.data() : {};
    // ▲▲▲ ここまで ▲▲▲

    // DBのデータとデフォルト値をマージして、すべてのキーが揃うようにする
    const initialContent = { ...fallbackData, ...dbData };

    return { 
      props: { 
        initialContent: JSON.parse(JSON.stringify(initialContent)) 
      } 
    };
  } catch (error) {
    console.error("Landing editor page auth error:", error);
    return {
      redirect: {
        destination: '/login',
        permanent: false,
      },
    };
  }
};

export default LandingEditorPage;

