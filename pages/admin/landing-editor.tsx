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
  mainTitle: string;
  areaDescription: string;
  heroHeadline: string;
  heroSubheadline: string;
  youtubeVideoId: string;
  empathyTitle: string;
  empathyIntro: string;
  solutionBenefit1_Title: string;
  solutionBenefit1_Desc: string;
  solutionBenefit2_Title: string;
  solutionBenefit2_Desc: string;
  solutionBenefit3_Title: string;
  solutionBenefit3_Desc: string;
  freeReasonTitle: string;
  freeReasonDesc: string;
  premiumTeaserTitle: string;
  premiumTeaserText: string;
  premiumTeaserNote: string;
  finalCtaTitle: string;
  finalCtaSubtext: string;
}

interface EditorPageProps {
  initialContent: LandingData;
}

// --- プレビュー用コンポーネント (最終修正版) ---
const LandingPreview: React.FC<{ data: LandingData }> = ({ data }) => {
    // テキストの改行を正しく表示するためのヘルパー関数
    const formatText = (text: string = '') => {
        return text.split('\n').map((line, i) => <span key={i} className="block">{line}</span>);
    };

    return (
        <div className="bg-white text-gray-800 scale-75 origin-top-left" style={{ minWidth: '133.33%' }}>
            {/* --- ファーストビュー --- */}
            <header
              className="relative text-white text-center py-20 px-4 flex flex-col items-center justify-center min-h-[60vh]"
              style={{
                backgroundImage: `linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.6)), url('/images/nasu-landscape.jpg')`,
                backgroundSize: 'cover',
                backgroundPosition: 'center'
              }}
            >
              <div className="max-w-3xl">
                <h1 className="text-3xl md:text-4xl font-bold mb-3" style={{ textShadow: '1px 1px 4px rgba(0,0,0,0.8)' }}>
                  {data.mainTitle}
                </h1>
                <p className="text-lg md:text-xl mb-4 font-semibold" style={{ textShadow: '1px 1px 4px rgba(0,0,0,0.8)' }}>
                  {data.areaDescription}
                </p>
                <h2 className="text-4xl md:text-5xl font-black leading-tight mb-8" style={{ textShadow: '2px 2px 6px rgba(0,0,0,0.8)' }}>
                  {formatText(data.heroHeadline)}
                </h2>
                <div className="space-y-4 bg-black bg-opacity-40 p-6 rounded-lg inline-block">
                  <button className="bg-gray-400 text-white font-bold text-lg py-4 px-8 rounded-full shadow-lg cursor-not-allowed" disabled>
                    まもなくオープン
                  </button>
                  <div className="mt-4 flex flex-col items-center">
                    <p className="mb-2 text-lg font-semibold text-white">
                      オープン告知はLINE公式アカウントでお知らせします！
                    </p>
                    <a href="#!" onClick={(e) => e.preventDefault()}><Image src="https://scdn.line-apps.com/n/line_add_friends/btn/ja.png" alt="友だち追加" width={116} height={36} /></a>
                  </div>
                </div>
              </div>
            </header>

            <main>
                {/* --- 動画セクション --- */}
                {data.youtubeVideoId ? (
                  <section className="py-16 bg-gray-100 text-center">
                    <div className="max-w-4xl mx-auto px-6">
                        <div className="aspect-w-16 aspect-h-9 shadow-2xl rounded-lg overflow-hidden">
                            <iframe
                                src={`https://www.youtube.com/embed/${data.youtubeVideoId}`}
                                title="YouTube video player"
                                frameBorder="0"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                                className="w-full h-full"
                            ></iframe>
                        </div>
                    </div>
                  </section>
                ) : null}

                {/* --- 共感セクション --- */}
                <section className="py-16 bg-gray-50">
                  <div className="max-w-4xl mx-auto px-6 text-center">
                    <h2 className="text-3xl font-bold mb-4">{formatText(data.empathyTitle)}</h2>
                    <p className="text-gray-600 mb-10">{data.empathyIntro}</p>
                    <div className="grid md:grid-cols-3 gap-8 text-left">
                      <div className="bg-white p-6 rounded-lg shadow-md">
                        <RiHeartPulseFill className="text-4xl text-red-500 mb-3" />
                        <h3 className="font-bold text-lg mb-2">{data.solutionBenefit1_Title}</h3>
                        <p className="text-sm text-gray-600">{data.solutionBenefit1_Desc}</p>
                      </div>
                      <div className="bg-white p-6 rounded-lg shadow-md">
                        <RiShieldCheckFill className="text-4xl text-blue-500 mb-3" />
                      	<h3 className="font-bold text-lg mb-2">{data.solutionBenefit2_Title}</h3>
                      	<p className="text-sm text-gray-600">{data.solutionBenefit2_Desc}</p>
                      </div>
                      <div className="bg-white p-6 rounded-lg shadow-md">
                        <RiChatHeartFill className="text-4xl text-green-500 mb-3" />
                      	<h3 className="font-bold text-lg mb-2">{data.solutionBenefit3_Title}</h3>
                      	<p className="text-sm text-gray-600">{data.solutionBenefit3_Desc}</p>
                      </div>
                    </div>
                  </div>
                </section>

                {/* --- なぜ無料なのか --- */}
                <section className="py-16 bg-white">
                  <div className="max-w-3xl mx-auto px-6 text-center">
                      <h2 className="text-3xl font-bold mb-4">{data.freeReasonTitle}</h2>
                      <p className="text-gray-600">{data.freeReasonDesc}</p>
                  </div>
                </section>

                {/* --- プレミアムプラン予告セクション --- */}
                <section className="py-16 bg-blue-50">
                  <div className="max-w-3xl mx-auto px-6 text-center">
                      <div className="bg-white p-8 rounded-xl shadow-lg border-t-4 border-blue-500">
                          <RiRocketFill className="text-5xl text-blue-500 mb-4 mx-auto" />
                          <h2 className="text-2xl font-bold mb-2 text-blue-800">{data.premiumTeaserTitle}</h2>
                      	<p className="text-gray-700 text-lg font-semibold">
                      	  {formatText(data.premiumTeaserText)}
                      	</p>
                      	<p className="text-sm text-gray-500 mt-4">{data.premiumTeaserNote}</p>
                      </div>
                  </div>
                </section>

                {/* --- 最後のCTA --- */}
                <section className="py-20 bg-gray-800 text-white">
                  <div className="max-w-4xl mx-auto px-6 text-center">
                    <h2 className="text-3xl font-bold mb-4">{data.finalCtaTitle}</h2>
                    <p className="text-lg mb-8">{data.finalCtaSubtext}</p>
                    <div className="space-y-4 bg-black bg-opacity-40 p-6 rounded-lg inline-block">
                      <button className="bg-gray-400 text-white font-bold text-lg py-4 px-8 rounded-full shadow-lg cursor-not-allowed" disabled >
                        まもなくオープン
                      </button>
                      <div className="mt-4 flex flex-col items-center">
                        <p className="mb-2 text-lg font-semibold text-white">
                          オープン告知はLINE公式アカウントでお知らせします！
                        </p>
                        <a href="#!" onClick={(e) => e.preventDefault()}><Image src="https://scdn.line-apps.com/n/line_add_friends/btn/ja.png" alt="友だち追加" width={116} height={36} /></a>
                      </div>
                    </div>
                  </div>
                </section>
            </main>

            {/* --- フッター --- */}
            <footer className="bg-gray-200 text-center text-sm text-gray-600 py-8 px-4">
              <div className="space-y-2">
                  <div className="flex justify-center space-x-6 mb-4">
                      <a href="#!" onClick={(e) => e.preventDefault()} className="hover:underline">特定商取引法に基づく表記</a>
                  </div>
                  <div>
                      <p>みんなの那須アプリ運営</p><p>株式会社adtown</p><p>〒329-2711 栃木県那須塩原市石林698-35</p><p>TEL:0287-39-7577</p>
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
    if (name === 'youtubeVideoId' && (value.includes('v=') || value.includes('youtu.be'))) {
        try {
            if (value.includes('youtu.be')) {
                const videoId = new URL(value.replace('.be/', '.com/watch?v=')).pathname.split('/').pop();
                setData((prev) => ({ ...prev, [name]: videoId || value }));
            } else {
                const videoId = new URL(value).searchParams.get('v');
                setData((prev) => ({ ...prev, [name]: videoId || value }));
            }
        } catch {
            setData((prev) => ({ ...prev, [name]: value }));
        }
    } else {
        setData((prev) => ({ ...prev, [name]: value }));
    }
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
      const result = await response.json();
    	if (!response.ok) throw new Error(result.error || '保存に失敗しました。');
    	setMessage('✅ 保存しました！');
    } catch (error) {
    	setMessage(`❌ ${error instanceof Error ? error.message : '保存中にエラーが発生しました。'}`);
    } finally {
    	setIsLoading(false);
    	setTimeout(() => setMessage(''), 4000);
    }
  };

  const formFields = [
    { name: 'mainTitle', label: 'ファーストビュー：メインタイトル', rows: 1 },
    { name: 'areaDescription', label: 'ファーストビュー：エリア説明', rows: 1 },
    { name: 'heroHeadline', label: 'ファーストビュー：キャッチコピー', rows: 3 },
    { name: 'heroSubheadline', label: 'ファーストビュー：サブコピー', rows: 3 },
    { name: 'youtubeVideoId', label: '紹介動画 (YouTubeのURLまたはID)', rows: 1 },
    { name: 'empathyTitle', label: '共感セクション：タイトル', rows: 2 },
    { name: 'empathyIntro', label: '共感セクション：導入文', rows: 3 },
    { name: 'solutionBenefit1_Title', label: '解決策1：タイトル', rows: 1 },
    { name: 'solutionBenefit1_Desc', label: '解決策1：説明文', rows: 3 },
    { name: 'solutionBenefit2_Title', label: '解決策2：タイトル', rows: 1 },
    { name: 'solutionBenefit2_Desc', label: '解決策2：説明文', rows: 3 },
    { name: 'solutionBenefit3_Title', label: '解決策3：タイトル', rows: 1 },
    { name: 'solutionBenefit3_Desc', label: '解決策3：説明文', rows: 3 },
    { name: 'freeReasonTitle', label: '無料の理由：タイトル', rows: 1 },
    { name: 'freeReasonDesc', label: '無料の理由：説明文', rows: 4 },
    { name: 'premiumTeaserTitle', label: 'プレミアムプラン予告：タイトル', rows: 1 },
    { name: 'premiumTeaserText', label: 'プレミアムプラン予告：本文', rows: 2 },
    { name: 'premiumTeaserNote', label: 'プレミアムプラン予告：注意書き', rows: 2 },
    { name: 'finalCtaTitle', label: '最終CTA：タイトル', rows: 1 },
    { name: 'finalCtaSubtext', label: '最終CTA：サブテキスト', rows: 2 },
  ];

  return (
    <div className="flex h-screen bg-gray-100">
      <Head>
        <title>ランディングページ編集</title>
      </Head>

      <div className="w-1/2 p-6 bg-white border-r overflow-y-auto">
        <div className="flex justify-between items-center mb-4 sticky top-0 bg-white py-2 z-10">
          <Link href="/admin" className="text-blue-600 hover:underline">← 管理メニューに戻る</Link>
          <button onClick={handleSave} disabled={isLoading} className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-6 rounded disabled:bg-gray-400">
            {isLoading ? '保存中...' : '変更を保存'}
          </button>
        </div>
      	{message && <p className={`mb-4 text-center text-sm font-bold ${message.includes('❌') ? 'text-red-600' : 'text-green-600'}`}>{message}</p>}
      	<h1 className="text-2xl font-bold mb-6 text-center">ランディングページ編集</h1>
      	<div className="space-y-6">
          {formFields.map(({ name, label, rows }) => (
            <div key={name}>
              <label className="block text-sm font-bold mb-1 text-gray-700">{label}</label>
              <textarea
                name={name}
                value={(data as any)[name] || ''}
                onChange={handleInputChange}
                rows={rows}
                className="w-full p-2 border rounded shadow-sm focus:ring-blue-500 focus:border-blue-500"
                placeholder={name === 'youtubeVideoId' ? '例: https://youtu.be/xxxxxxxxxxx' : ''}
              />
            </div>
          ))}
      	</div>
      </div>

      <div className="w-1/2 overflow-y-auto">
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
    const token = await getAdminAuth().verifySessionCookie(cookies.token, true);
    const userDoc = await getAdminDb().collection('users').doc(token.uid).get();
    if (!userDoc.exists || userDoc.data()?.role !== 'admin') {
      return { redirect: { destination: '/admin/login', permanent: false } };
    }
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
  	  heroSubheadline: "休日当番医からAIお悩み相談まで。\nあなたのスマホが、那須地域最強の「お守り」に変わります。",
  	  youtubeVideoId: '',
  	  empathyTitle: "病院探し、子育ての悩み…\nその都度、スマホで別のアプリやサイトを開いていませんか？",
  	  empathyIntro: "那須での生活に必要な「あれこれ」を、たった一つに。50個以上の便利が、あなたの毎日を徹底的にサポートします。",
  	  solutionBenefit1_Title: "もしもの時の、家族の安心に",
  	  solutionBenefit1_Desc: "休日夜間診療所を瞬時に検索。災害時の避-行動をAIがシミュレーション。暮らしの緊急事態に、もう焦りません。",
  	  solutionBenefit2_Title: "忙しい毎日の、時間とお金を節約",
  	  solutionBenefit2_Desc: "AIが献立を提案し、買い忘れも防止。ペットの迷子や里親募集情報も充実しています。",
  	  solutionBenefit3_Title: "ちょっと疲れた、あなたの心に",
  	  solutionBenefit3_Desc: "愚痴聞き地蔵AIや共感チャッ-AIが、24時間あなたの心に寄り添います。毎朝届く「褒め言葉シャワー」で一日を元気に。",
  	  freeReasonTitle: "なぜ、これだけの機能がずっと無料なのですか？",
  	  freeReasonDesc: "このアプリは、地域の企業様からの広告協賛によって運営されています。私たちは、那須地域に住むすべての方に、安全と便利を提供することが地域貢献だと考えています。だから、あなたに「地域お守り無料プラン」の利用料を請求することは一切ありません。安心して、ずっと使い続けてください。",
  	  premiumTeaserTitle: "さらに、もっとお得に。",
  	  premiumTeaserText: "年間93,000円＋αの損を「得」に変える\nプレミアムプランも要確認!!",
  	  premiumTeaserNote: "※プレミアムプランの詳細はアプリ内でご案内します。まずは「地域お守り無料プラン」で、アプリの便利さをご体験ください。",
  	  finalCtaTitle: "那須の暮らしを、アップデートしよう。",
  	  finalCtaSubtext: "約50個の無料アプリが、あなたのスマホに。オープンをお楽しみに！",
  	};
  	
  	const dbData = docSnap.exists ? docSnap.data() : {};
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

