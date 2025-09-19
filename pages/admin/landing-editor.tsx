import { useState } from 'react';
import { GetServerSideProps, NextPage } from 'next';
import Link from 'next/link';
import nookies from 'nookies';
import { getAdminAuth, getAdminDb } from '../../lib/firebase-admin';
import Head from 'next/head';
import Image from 'next/image';
import { RiShieldCheckFill, RiHeartPulseFill, RiChatHeartFill, RiRocketFill } from 'react-icons/ri';

// --- 型定義 ---
interface LandingData {
  mainTitle?: string;
  areaDescription?: string;
  heroHeadline?: string;
  heroSubheadline?: string;
  youtubeVideoId?: string;
  empathyTitle?: string;
  empathyIntro?: string;
  solutionBenefit1_Title?: string;
  solutionBenefit1_Desc?: string;
  solutionBenefit2_Title?: string;
  solutionBenefit2_Desc?: string;
  solutionBenefit3_Title?: string;
  solutionBenefit3_Desc?: string;
  freeReasonTitle?: string;
  freeReasonDesc?: string;
  premiumTeaserTitle?: string;
  premiumTeaserText?: string;
  premiumTeaserNote?: string;
  finalCtaTitle?: string;
  finalCtaSubtext?: string;
}

interface EditorPageProps {
  initialContent: LandingData;
}

// --- プレビュー用コンポーネント ---
const LandingPreview: React.FC<{ data: LandingData }> = ({ data }) => {
  return (
    <div className="bg-[#fefcfb] text-gray-700 scale-75 origin-top-left" style={{ minWidth: '133.33%' }}>
    	  <header className="bg-white border-b">
          <div className="container mx-auto px-6 pt-16 pb-12 md:pt-24 md:pb-20 text-center">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
              {data.mainTitle}
            </h1>
            <p className="mt-2 text-md text-gray-500">
              {data.areaDescription}
            </p>
            <h2 className="mt-4 text-4xl md:text-5xl font-black text-gray-900 leading-tight">
              {data.heroHeadline?.split('\n').map((line, i) => <span key={i} className="block">{line}</span>)}
            </h2>
            <p className="mt-4 text-lg md:text-xl text-gray-600 max-w-2xl mx-auto">
              {data.heroSubheadline}
            </p>
            <div className="mt-8">
              <a href="#!" onClick={(e) => e.preventDefault()} className="bg-orange-500 text-white font-bold text-lg py-4 px-10 rounded-full shadow-lg inline-block">
    	          まもなくオープン！LINEで先行情報を受け取る
    	        </a>
            </div>
          </div>
        </header>

    	  <main>
    	    <section className="bg-white">
            <div className="container mx-auto px-6 -mt-10 md:-mt-16">
              <Image 
                src="/images/illustration-hero.png"
                alt="みんなの那須アプリの便利さを表すイラスト" 
                width={1200} 
                height={600}
                objectFit="contain"
              />
            </div>
          </section>

          <section className="py-20 bg-[#f4f1ed]">
            <div className="container mx-auto px-6">
              <div className="text-center mb-12">
                <h2 className="text-3xl md:text-4xl font-bold text-gray-800">{data.empathyTitle}</h2>
                <p className="mt-4 text-gray-600 max-w-2xl mx-auto">{data.empathyIntro}</p>
              </div>
              <div className="grid md:grid-cols-3 gap-8 text-center">
                <div className="bg-white p-8 rounded-lg shadow-md"><RiHeartPulseFill className="text-4xl text-red-500 mb-4 mx-auto" /><h3 className="font-bold text-lg mb-2">{data.solutionBenefit1_Title}</h3><p className="text-sm text-gray-600">{data.solutionBenefit1_Desc}</p></div>
                <div className="bg-white p-8 rounded-lg shadow-md"><RiShieldCheckFill className="text-4xl text-blue-500 mb-4 mx-auto" /><h3 className="font-bold text-lg mb-2">{data.solutionBenefit2_Title}</h3><p className="text-sm text-gray-600">{data.solutionBenefit2_Desc}</p></div>
                <div className="bg-white p-8 rounded-lg shadow-md"><RiChatHeartFill className="text-4xl text-green-500 mb-4 mx-auto" /><h3 className="font-bold text-lg mb-2">{data.solutionBenefit3_Title}</h3><p className="text-sm text-gray-600">{data.solutionBenefit3_Desc}</p></div>
              </div>
            </div>
          </section>

    	    <section className="py-20 bg-white">
    	      <div className="container mx-auto px-6 text-center">
    	        <h2 className="text-3xl md:text-4xl font-bold text-gray-800">{data.freeReasonTitle}</h2>
    	        <p className="mt-4 text-gray-600 leading-relaxed max-w-3xl mx-auto">{data.freeReasonDesc}</p>
    	      </div>
    	    </section>

          <section className="py-20 bg-[#004445]">
            <div className="container mx-auto px-6 text-center text-white">
              <div className="max-w-3xl mx-auto">
                <RiRocketFill className="text-5xl text-yellow-400 mb-4 mx-auto" />
                <h2 className="text-3xl font-bold">{data.premiumTeaserTitle}</h2>
                <p className="mt-4 text-xl md:text-2xl text-white font-semibold">
                  {data.premiumTeaserText?.split('\n').map((line, i) => <span key={i} className="block">{line}</span>)}
                </p>
                <p className="mt-4 text-sm text-gray-300">{data.premiumTeaserNote}</p>
              </div>
            </div>
          </section>

    	    <section id="cta" className="bg-gray-800 text-white">
    	      <div className="container mx-auto px-6 py-20 text-center">
    	        <h2 className="text-3xl md:text-4xl font-bold">{data.finalCtaTitle}</h2>
    	        <p className="mt-4 text-gray-300 max-w-2xl mx-auto">{data.finalCtaSubtext}</p>
    	        <div className="mt-8 space-y-4">
                <a href="#!" onClick={(e) => e.preventDefault()} className="bg-orange-500 text-white font-bold text-lg py-4 px-10 rounded-full shadow-lg inline-block">
    	            LINEでオープン通知を受け取る
    	          </a>
                <div className="flex flex-col items-center mt-4">
                  <Image src="https://scdn.line-apps.com/n/line_add_friends/btn/ja.png" alt="友だち追加" width={116} height={36} />
                </div>
    	        </div>
    	      </div>
    	    </section>
    	  </main>

    	  <footer className="bg-gray-900 text-white">
    	    <div className="container mx-auto py-10 px-6 text-center text-sm">
    	      <div className="mb-4"><a href="#!" onClick={(e) => e.preventDefault()} className="text-gray-400 hover:text-white">特定商取引法に基づく表記</a></div>
    	      <div>
                <p className="text-gray-400">みんなの那須アプリ運営 | 株式会社adtown</p>
                <p className="text-gray-400">〒329-2711 栃木県那須塩原市石林698-35 | TEL:0287-39-7577</p>
              </div>
    	    </div>
    	  </footer>
    	</div>
  );
};

// --- 編集ページのメインコンポーネント ---
const LandingEditorPage: NextPage<EditorPageProps> = ({ initialContent }) => {
  const [data, setData] = useState<LandingData>(initialContent);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    setIsLoading(true);
    setMessage('');
    try {
      const response = await fetch('/api/admin/update-landing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentId: 'landingV3', data }),
      });
      if (!response.ok) throw new Error('保存に失敗しました。');
      setMessage('✅ 保存しました！');
    } catch (error) {
      setMessage(`❌ ${error instanceof Error ? error.message : '保存中にエラーが発生しました。'}`);
    } finally {
      setIsLoading(false);
      setTimeout(() => setMessage(''), 4000);
    }
  };

  const formFields: { name: keyof LandingData; label: string; rows: number; placeholder?: string }[] = [
    { name: 'mainTitle', label: 'ヒーロー：プラン名タイトル', rows: 1, placeholder: 'みんなの那須アプリ「地域お守り無料プラン」' },
    { name: 'areaDescription', label: 'ヒーロー：エリア説明', rows: 1, placeholder: '那須塩原市、大田原市、那須町の地域専用アプリ' },
    { name: 'heroHeadline', label: 'ヒーロー：メインキャッチコピー（改行で2行になります）', rows: 2, placeholder: '那須の暮らしが、もっと便利に、もっとお得に…' },
    { name: 'heroSubheadline', label: 'ヒーロー：サブキャッチコピー', rows: 3, placeholder: '休日当番医からAIお悩み相談まで…' },
    { name: 'empathyTitle', label: 'お悩みセクション：タイトル', rows: 2, placeholder: '病院探し、子育ての悩み…' },
    { name: 'empathyIntro', label: 'お悩みセクション：説明文', rows: 3 },
    { name: 'solutionBenefit1_Title', label: '機能紹介1：タイトル', rows: 1, placeholder: 'もしもの時の、家族の安心に' },
    { name: 'solutionBenefit1_Desc', label: '機能紹介1：説明文', rows: 3 },
    { name: 'solutionBenefit2_Title', label: '機能紹介2：タイトル', rows: 1, placeholder: '忙しい毎日の、時間とお金を節約' },
    { name: 'solutionBenefit2_Desc', label: '機能紹介2：説明文', rows: 3 },
    { name: 'solutionBenefit3_Title', label: '機能紹介3：タイトル', rows: 1, placeholder: 'ちょっと疲れた、あなたの心に' },
    { name: 'solutionBenefit3_Desc', label: '機能紹介3：説明文', rows: 3 },
    { name: 'freeReasonTitle', label: '無料の理由：タイトル', rows: 1 },
    { name: 'freeReasonDesc', label: '無料の理由：説明文', rows: 4 },
    { name: 'premiumTeaserTitle', label: 'プレミアムプラン予告：タイトル', rows: 1, placeholder: 'さらに、もっとお得に。' },
    { name: 'premiumTeaserText', label: 'プレミアムプラン予告：本文（改行で2行になります）', rows: 2 },
    { name: 'premiumTeaserNote', label: 'プレミアムプラン予告：注意書き', rows: 2 },
    { name: 'finalCtaTitle', label: '最終CTA：タイトル', rows: 1, placeholder: 'さあ、那須の暮らしをアップデートしよう。' },
    { name: 'finalCtaSubtext', label: '最終CTA：サブテキスト', rows: 3 },
  ];

  return (
    <div className="flex h-screen bg-gray-100">
      <Head><title>ランディングページ編集</title></Head>
      <div className="w-1/2 p-6 bg-white border-r overflow-y-auto">
        <div className="flex justify-between items-center mb-6 sticky top-0 bg-white py-4 border-b z-20">
          <h1 className="text-2xl font-bold text-gray-800">ランディングページ編集</h1>
          <div>
            <Link href="/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline mr-6">
              公開ページを開く
            </Link>
            <button onClick={handleSave} disabled={isLoading} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg disabled:bg-gray-400 shadow-sm">
              {isLoading ? '保存中...' : '変更を保存'}
            </button>
          </div>
        </div>
        {message && <p className={`my-4 text-center font-bold ${message.includes('❌') ? 'text-red-600' : 'text-green-600'}`}>{message}</p>}
        <div className="space-y-8">
          {formFields.map(({ name, label, rows, placeholder }) => (
            <div key={name}>
            	<label className="block text-sm font-bold mb-2 text-gray-700">{label}</label>
          	  <textarea 
                  name={name}
                  value={(data as any)[name] || ''}
                  onChange={handleInputChange} 
                  rows={rows} 
                  className="w-full p-3 border border-gray-300 rounded shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder={placeholder}
                />
        	  </div>
      	  ))}
    	  </div>
  	  </div>
  	  <div className="w-1/2 overflow-y-auto bg-gray-200">
  	    <div className="sticky top-0 bg-gray-800 text-white p-2 text-center text-sm z-10">
          リアルタイムプレビュー
        </div>
  	    <LandingPreview data={data} />
  	  </div>
  	</div>
  );
};

// --- サーバーサイドでのデータ取得 ---
export const getServerSideProps: GetServerSideProps = async (context) => {
  try {
    const cookies = nookies.get(context);
    await getAdminAuth().verifySessionCookie(cookies.token, true);
  } catch (err) {
    return { redirect: { destination: '/admin/login', permanent: false } };
  }

  const adminDb = getAdminDb();
  try {
    const docRef = adminDb.collection('settings').doc('landingV3');
    const docSnap = await docRef.get();
    
    const fallbackData: LandingData = {
      mainTitle: "みんなの那須アプリ「地域お守り無料プラン」",
      areaDescription: "那須塩原市、大田原市、那須町の地域専用アプリ",
      heroHeadline: "那須の暮らしが、もっと便利に、もっとお得に。\n約50個のアプリが永久無料で使い放題！",
      heroSubheadline: "休日当番医からAIお悩み相談まで。あなたのスマホが、那須地域最強の「お守り」に変わります。",
      youtubeVideoId: '',
      empathyTitle: "病院探し、子育ての悩み…\nその都度、スマホで別のアプリやサイトを開いていませんか？",
      empathyIntro: "那須での生活に必要な「あれこれ」を、たった一つに。50個以上の便利が、あなたの毎日を徹底的にサポートします。",
      solutionBenefit1_Title: "もしもの時の、家族の安心に",
      solutionBenefit1_Desc: "休日夜間診療所を瞬時に検索。災害時の避難行動をAIがシミュレーション。暮らしの緊急事態に、もう焦りません。",
      solutionBenefit2_Title: "忙しい毎日の、時間とお金を節約",
      solutionBenefit2_Desc: "AIが献立を提案し、買い忘れも防止。ペットの迷子や里親募集情報も充実しています。",
      solutionBenefit3_Title: "ちょっと疲れた、あなたの心に",
      solutionBenefit3_Desc: "愚痴聞き地蔵AIや共感チャットAIが、24時間あなたの心に寄り添います。毎朝届く「褒め言葉シャワー」で一日を元気に。",
      freeReasonTitle: "なぜ、これだけの機能がずっと無料なのですか？",
      freeReasonDesc: "このアプリは、地域の企業様からの広告協賛によって運営されています。私たちは、那須地域に住むすべての方に、安全と便利を提供することが地域貢献だと考えています。だから、あなたに「地域お守り無料プラン」の利用料を請求することは一切ありません。安心して、ずっと使い続けてください。",
      premiumTeaserTitle: "さらに、もっとお得に。",
      premiumTeaserText: "年間93,000円＋αの損を「得」に変える\nプレミアムプランも要確認!!",
      premiumTeaserNote: "※プレミアムプランの詳細はアプリ内でご案内します。まずは「地域お守り無料プラン」で、アプリの便利さをご体験ください。",
      finalCtaTitle: "さあ、那須の暮らしをアップデートしよう。",
      finalCtaSubtext: "オープン告知はLINE公式アカウントでお知らせします。今すぐ登録して、最新情報や限定特典を手に入れよう！",
    };
    
    const dbData = docSnap.exists ? docSnap.data() as LandingData : {};
  	const initialContent = { ...fallbackData, ...dbData };

  	return {
  	  props: {
  	    initialContent: JSON.parse(JSON.stringify(initialContent))
  	  }
  	};
  } catch (error) {
  	console.error("Landing editor page data fetch error:", error);
  	return { props: { initialContent: {} as LandingData } };
  }
};

export default LandingEditorPage;
