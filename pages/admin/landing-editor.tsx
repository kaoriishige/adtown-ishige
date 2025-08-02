import { useState } from 'react';
import { GetServerSideProps, NextPage } from 'next';
import Link from 'next/link';
import nookies from 'nookies';
import { getAdminAuth, getAdminDb } from '../../lib/firebase-admin';

// --- 型定義 ---
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

// --- ページコンポーネント ---
const LandingEditorPage: NextPage<EditorPageProps> = ({ initialContent }) => {
  const [data, setData] = useState<LandingData>(initialContent);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setData((prev) => ({ ...prev, [name]: value }));
  };

  const handleArrayChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setData((prev) => ({ ...prev, [name]: value.split('\n') }));
  };

  const handleSave = async () => {
    setIsLoading(true);
    setMessage('');
    try {
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
        <div className="flex justify-between items-center mb-4 sticky top-0 bg-white py-2 z-10">
            <Link href="/admin" className="text-blue-600 hover:underline">← 管理メニューに戻る</Link>
            <button 
              onClick={handleSave} 
              disabled={isLoading} 
              className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-6 rounded disabled:bg-gray-400"
            >
              {isLoading ? '保存中...' : '変更を保存'}
            </button>
        </div>
        {message && <p className="mb-4 text-center text-sm">{message}</p>}

        <h1 className="text-2xl font-bold mb-4">ランディングページ編集</h1>
        
        <div className="space-y-4">
          {Object.keys(data).map((key) => (
            <div key={key}>
              <label className="block text-sm font-bold mb-1 capitalize">{key.replace(/_/g, ' ')}:</label>
              {Array.isArray((data as any)[key]) ? (
                <textarea 
                  name={key} 
                  value={((data as any)[key] || []).join('\n')} 
                  onChange={handleArrayChange} 
                  rows={5} 
                  className="w-full p-2 border rounded"
                  placeholder="各項目を改行で区切って入力"
                />
              ) : (
                <textarea 
                  name={key} 
                  value={(data as any)[key] || ''} 
                  onChange={handleInputChange} 
                  rows={key.includes('Desc') || key.includes('Intro') ? 5 : 2}
                  className="w-full p-2 border rounded"
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* --- 右側：簡易プレビュー --- */}
      <div className="w-1/2 overflow-y-auto p-8">
        <h2 className="text-xl font-bold mb-4 sticky top-0 bg-gray-50 py-2 z-10">簡易プレビュー</h2>
        {/* ▼▼▼ ここからプレビュー全体を修正しました ▼▼▼ */}
        <div className="bg-white p-6 rounded-lg shadow-md space-y-8 text-gray-800">
            {/* ファーストビュー */}
            <section>
                <h3 className="font-bold text-xl border-b pb-2 mb-3">ファーストビュー</h3>
                <p className="whitespace-pre-wrap text-2xl font-bold">{data.heroHeadline}</p>
                <p className="whitespace-pre-wrap mt-2 text-lg">{data.heroSubheadline}</p>
                <p className="whitespace-pre-wrap mt-3 text-blue-600 font-semibold">{data.heroCta}</p>
            </section>

            {/* 問題提起 */}
            <section>
                <h3 className="font-bold text-xl border-b pb-2 mb-3">問題提起</h3>
                <p className="whitespace-pre-wrap text-xl font-semibold">{data.problemTitle}</p>
                <p className="whitespace-pre-wrap mt-2">{data.problemIntro}</p>
                <div className="mt-4 space-y-3">
                    <p><strong>{data.problemItem1_Title}</strong>: {data.problemItem1_Amount}</p>
                    <p className="text-sm pl-4 whitespace-pre-wrap">{data.problemItem1_Desc}</p>
                    <p><strong>{data.problemItem2_Title}</strong>: {data.problemItem2_Amount}</p>
                    <p className="text-sm pl-4 whitespace-pre-wrap">{data.problemItem2_Desc}</p>
                    <p><strong>{data.problemItem3_Title}</strong>: {data.problemItem3_Amount}</p>
                    <p className="text-sm pl-4 whitespace-pre-wrap">{data.problemItem3_Desc}</p>
                    <p><strong>{data.problemItem4_Title}</strong>: {data.problemItem4_Amount}</p>
                    <p className="text-sm pl-4 whitespace-pre-wrap">{data.problemItem4_Desc}</p>
                    <p><strong>{data.problemItem5_Title}</strong>: {data.problemItem5_Amount}</p>
                    <p className="text-sm pl-4 whitespace-pre-wrap">{data.problemItem5_Desc}</p>
                </div>
            </section>

            {/* 価値提案 */}
            <section>
                <h3 className="font-bold text-xl border-b pb-2 mb-3">価値提案</h3>
                <p className="whitespace-pre-wrap text-xl font-semibold">{data.valueTitle}</p>
                <p className="whitespace-pre-wrap mt-2 font-semibold">{data.valueSubTitle}</p>
                <p className="whitespace-pre-wrap mt-2">{data.valueIntro}</p>
                <ul className="list-disc list-inside mt-2 space-y-1">
                    {(data.valuePoints || []).map((point, i) => <li key={i}>{point}</li>)}
                </ul>
                <p className="whitespace-pre-wrap mt-2">{data.valueConclusion}</p>
            </section>

            {/* 価格提示 */}
            <section>
                <h3 className="font-bold text-xl border-b pb-2 mb-3">価格提示</h3>
                <p className="whitespace-pre-wrap text-xl font-semibold">{data.pricingTitle}</p>
                <p className="whitespace-pre-wrap mt-2">{data.pricingSubTitle}</p>
                <p className="whitespace-pre-wrap mt-2">{data.pricingConclusion}</p>
            </section>

            {/* 紹介制度 */}
            <section>
                <h3 className="font-bold text-xl border-b pb-2 mb-3">紹介制度</h3>
                <p className="whitespace-pre-wrap text-xl font-semibold">{data.referralTitle}</p>
                <p className="whitespace-pre-wrap mt-2">{data.referralIntro}</p>
                <p className="mt-2"><strong>{data.referralBonus1_Title}</strong></p>
                <p className="text-sm pl-4 whitespace-pre-wrap">{data.referralBonus1_Desc}</p>
                <p className="mt-2"><strong>{data.referralBonus2_Title}</strong></p>
                <p className="text-sm pl-4 whitespace-pre-wrap">{data.referralBonus2_Desc}</p>
                <ul className="list-disc list-inside mt-2 space-y-1">
                    {(data.referralPoints || []).map((point, i) => <li key={i}>{point}</li>)}
                </ul>
                <p className="whitespace-pre-wrap mt-2 text-xs">{data.referralCaution}</p>
            </section>

            {/* 最後のひと押し */}
            <section>
                <h3 className="font-bold text-xl border-b pb-2 mb-3">最後のひと押し</h3>
                <p className="whitespace-pre-wrap text-xl font-semibold">{data.finalCtaTitle}</p>
                <p className="whitespace-pre-wrap mt-2">{data.finalCtaText}</p>
                <p className="whitespace-pre-wrap mt-3 text-center font-bold text-white bg-green-500 p-3 rounded-md">{data.finalCtaButton}</p>
                <p className="whitespace-pre-wrap mt-2 text-xs">{data.finalCtaNote}</p>
            </section>

            {/* フッター */}
            <section>
                <h3 className="font-bold text-xl border-b pb-2 mb-3">フッター</h3>
                <p className="whitespace-pre-wrap text-xs">{data.footerNote}</p>
            </section>
        </div>
        {/* ▲▲▲ ここまで ▲▲▲ */}
      </div>
    </div>
  );
};


// --- サーバーサイドでのデータ取得 ---
export const getServerSideProps: GetServerSideProps = async (context) => {
  const adminDb = getAdminDb();
  if (!adminDb) {
    return { props: { initialContent: {} as LandingData } };
  }

  try {
    const docRef = adminDb.collection('settings').doc('landingV2');
    const docSnap = await docRef.get();
    
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
    
    const dbData = docSnap.exists ? docSnap.data() : {};
    
    const initialContent = {} as LandingData;
    for (const key of Object.keys(fallbackData)) {
      (initialContent as any)[key] = (dbData as any)[key] ?? (fallbackData as any)[key];
    }

    return { 
      props: { 
        initialContent: JSON.parse(JSON.stringify(initialContent)) 
      } 
    };
  } catch (error) {
    console.error("Landing editor page data fetch error:", error);
    return {
      props: { initialContent: {} as LandingData }
    };
  }
};

export default LandingEditorPage;

