import { useState, useEffect } from 'react';
import { GetServerSideProps, NextPage } from 'next';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import Link from 'next/link';
import Image from 'next/image';

// お客様が作成したFirestoreのデータ構造に合わせた型
interface LandingData {
  title: string;
  catchCopy: string;
  campaignNote: string;
  troublesTitle: string;
  troubles: string[];
  pricingTitle: string;
  pricingBenefits: string[];
  referralTitle: string;
  referralNotes: string[];
  referralCaution: string;
  lineCampaignTitle: string;
  lineBenefitsTitle: string;
  lineButtonLabel: string;
  lineButtonNote: string;
  lineBenefits: string[];
}

interface EditorPageProps {
  initialContent: LandingData;
}

const LandingEditorPage: NextPage<EditorPageProps> = ({ initialContent }) => {
  const [data, setData] = useState<LandingData>(initialContent);
  const [isLoading, setIsLoading] = useState(false);

  // 通常のテキスト入力用
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setData(prev => ({ ...prev, [name]: value }));
  };

  // 箇条書き(textarea)用
  const handleArrayChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setData(prev => ({ ...prev, [name]: value.split('\n') }));
  };

  // 保存処理
  const handleSave = async () => {
    setIsLoading(true);
    const docRef = doc(db, 'settings', 'landingV2');
    try {
      await setDoc(docRef, data, { merge: true });
      alert('保存しました！');
    } catch (error) {
      alert('保存中にエラーが発生しました。');
      console.error(error);
    }
    setIsLoading(false);
  };

  return (
    <div className="flex bg-gray-100 min-h-screen">
      {/* --- 左側：編集フォーム --- */}
      <div className="w-1/3 p-6 bg-white border-r">
        <Link href="/admin" className="text-blue-500 hover:underline">← 管理メニューに戻る</Link>
        <h1 className="text-2xl font-bold my-4">ランディングページ編集</h1>
        <div className="space-y-4">
          {Object.keys(initialContent).map((key) => (
            <div key={key}>
              <label className="block text-sm font-bold mb-1 capitalize">{key}:</label>
              {Array.isArray((data as any)[key]) ? (
                <textarea name={key} value={(data as any)[key].join('\n')} onChange={handleArrayChange} rows={7} className="w-full p-2 border rounded"/>
              ) : (
                <input name={key} value={(data as any)[key]} onChange={handleInputChange} className="w-full p-2 border rounded"/>
              )}
            </div>
          ))}
          <div className="text-center pt-4">
            <button onClick={handleSave} disabled={isLoading} className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-6 rounded disabled:bg-gray-400">
              {isLoading ? '保存中...' : '変更を保存'}
            </button>
          </div>
        </div>
      </div>

      {/* --- 右側：ライブプレビュー --- */}
      <div className="w-2/3">
        <div className="bg-gray-50 p-4">
          <section className="bg-white text-center py-16 px-4">
            <h1 className="text-4xl md:text-5xl font-extrabold text-blue-800 mb-4">{data.title}</h1>
            <p className="text-xl md:text-2xl font-semibold text-gray-700 mb-6">{data.catchCopy}</p>
            <p className="text-lg text-red-600 font-bold mb-8">{data.campaignNote}</p>
            <a href="#" onClick={(e) => e.preventDefault()} className="bg-blue-600 text-white px-8 py-4 rounded-full text-xl shadow-lg">アプリ申込みはこちら</a>
          </section>
          <section className="bg-gray-50 py-12">
            <div className="max-w-3xl mx-auto bg-white p-8 rounded-xl shadow-md">
              <h2 className="text-xl font-bold mb-4">{data.troublesTitle}</h2>
              <ul className="list-disc list-inside text-gray-700 space-y-2">
                {data.troubles.map((item, i) => item && <li key={i}>{item}</li>)}
              </ul>
            </div>
          </section>
          <section className="bg-white py-12">
            <div className="max-w-3xl mx-auto bg-white p-8 rounded-xl shadow-md">
              <h2 className="text-xl font-bold mb-4">{data.pricingTitle}</h2>
              <ul className="list-disc list-inside text-gray-700 space-y-2">
                {data.pricingBenefits.map((item, i) => item && <li key={i}>{item}</li>)}
              </ul>
            </div>
          </section>
          <section className="bg-green-50 py-12">
            <div className="max-w-3xl mx-auto bg-white p-8 rounded-xl shadow-md">
              <h2 className="text-xl font-bold mb-4">{data.referralTitle}</h2>
              <ul className="list-disc list-inside text-gray-700 space-y-2">
                {data.referralNotes.map((item, i) => item && <li key={i}>{item}</li>)}
              </ul>
              <p className="text-xs text-gray-500 mt-4">{data.referralCaution}</p>
            </div>
          </section>
          <section className="bg-white py-12 text-center">
            <a href="#" onClick={(e) => e.preventDefault()} className="inline-block bg-blue-600 text-white px-6 py-3 rounded-full text-lg shadow-lg">アプリ申込みはこちら</a>
          </section>
          <section className="bg-blue-50 py-10 mt-20">
            <div className="max-w-2xl mx-auto px-4 text-center">
              <h2 className="text-lg font-bold mb-2 text-green-700">{data.lineCampaignTitle}</h2>
              <a href="#" onClick={(e) => e.preventDefault()} className="inline-block">
                <Image src="https://scdn.line-apps.com/n/line_add_friends/btn/ja.png" alt={data.lineButtonLabel} width={160} height={36}/>
              </a>
              <p className="text-xs text-gray-500 mt-2">{data.lineButtonNote}</p>
              <div className="bg-white p-4 mt-6 rounded-xl shadow">
                <p className="font-bold text-left">{data.lineBenefitsTitle}</p>
                <ul className="list-disc list-inside text-left text-sm mt-2">
                  {data.lineBenefits.map((item, i) => item && <li key={i}>{item}</li>)}
                </ul>
              </div>
            </div>
          </section>
          <footer className="text-center text-sm text-gray-500 mt-12 pb-8">
            <p>みんなの那須アプリ運営</p><p>株式会社adtown</p><p>〒329-2711 栃木県那須塩原市石林698-35</p><p>TEL:0287-39-7577</p>
          </footer>
        </div>
      </div>
    </div>
  );
};

export const getServerSideProps: GetServerSideProps = async () => {
  const docRef = doc(db, 'settings', 'landingV2');
  const docSnap = await getDoc(docRef);
  const fallbackData = { 
    title: '', catchCopy: '', campaignNote: '', troublesTitle: '', troubles: [],
    pricingTitle: '', pricingBenefits: [], referralTitle: '', referralNotes: [],
    referralCaution: '', lineCampaignTitle: '', lineBenefitsTitle: '', 
    lineButtonLabel: '', lineButtonNote: '', lineBenefits: []
  };
  const initialContent = docSnap.exists() ? { ...fallbackData, ...docSnap.data() } : fallbackData;
  return { props: { initialContent: JSON.parse(JSON.stringify(initialContent)) } };
};

export default LandingEditorPage;




