import { useState } from 'react';
import { GetServerSideProps, NextPage } from 'next';
import Link from 'next/link';
import nookies from 'nookies';
import { getAdminAuth, getAdminDb } from '../../lib/firebase-admin';
import Head from 'next/head';

// --- 型定義：新しいランディングページに合わせて簡略化 ---
interface LandingData {
  // ファーストビュー
  mainTitle: string;
  areaDescription: string;
  heroHeadline: string;
  heroSubheadline: string;
  // 共感セクション
  empathyTitle: string;
  empathyIntro: string;
  // 解決策セクション
  solutionBenefit1_Title: string;
  solutionBenefit1_Desc: string;
  solutionBenefit2_Title: string;
  solutionBenefit2_Desc: string;
  solutionBenefit3_Title: string;
  solutionBenefit3_Desc: string;
  // 無料の理由セクション
  freeReasonTitle: string;
  freeReasonDesc: string;
  // プレミアムプラン予告セクション
  premiumTeaserTitle: string;
  premiumTeaserText: string;
  premiumTeaserNote: string;
  // 最終CTAセクション
  finalCtaTitle: string;
  finalCtaSubtext: string;
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

  const handleSave = async () => {
    setIsLoading(true);
    setMessage('');
    try {
      // データの保存先を landingV3 など新しいドキュメント名に変更することを推奨
      const response = await fetch('/api/admin/update-landing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentId: 'landingV3', data }), // 保存先IDを指定
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

  // フォームの項目と表示名を定義
  const formFields = [
    { name: 'mainTitle', label: 'ファーストビュー：メインタイトル', rows: 1 },
    { name: 'areaDescription', label: 'ファーストビュー：エリア説明', rows: 1 },
    { name: 'heroHeadline', label: 'ファーストビュー：キャッチコピー', rows: 3 },
    { name: 'heroSubheadline', label: 'ファーストビュー：サブコピー', rows: 3 },
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
    <div className="bg-gray-100 min-h-screen">
      <Head>
        <title>ランディングページ編集</title>
      </Head>
      <div className="w-full max-w-4xl mx-auto p-6">
        <div className="flex justify-between items-center mb-4">
          <Link href="/admin" className="text-blue-600 hover:underline">← 管理メニューに戻る</Link>
          <button 
            onClick={handleSave} 
            disabled={isLoading} 
            className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-6 rounded disabled:bg-gray-400"
          >
            {isLoading ? '保存中...' : '変更を保存'}
          </button>
        </div>
        {message && <p className="mb-4 text-center text-sm font-bold text-green-600">{message}</p>}

        <h1 className="text-2xl font-bold mb-6 text-center">ランディングページ編集</h1>
        
        <div className="space-y-6 bg-white p-8 rounded-lg shadow-md">
          {formFields.map(({ name, label, rows }) => (
            <div key={name}>
              <label className="block text-sm font-bold mb-1 text-gray-700">{label}</label>
              <textarea 
                name={name}
                value={(data as any)[name] || ''} 
                onChange={handleInputChange} 
                rows={rows}
                className="w-full p-2 border rounded shadow-sm focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// --- サーバーサイドでのデータ取得 ---
export const getServerSideProps: GetServerSideProps = async (context) => {
  // 認証チェック
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

  // データ取得
  const adminDb = getAdminDb();
  try {
    const docRef = adminDb.collection('settings').doc('landingV3'); // 新しいデータソース
    const docSnap = await docRef.get();
    
    // データがない場合のデフォルト値
    const fallbackData: LandingData = {
      mainTitle: "みんなの那須アプリ",
      areaDescription: "那須塩原市、大田原市、那須町の地域専用アプリ",
      heroHeadline: "那須の暮らしが、もっと便利に、もっとお得に。\n約50個のアプリが永久無料で使い放題！",
      heroSubheadline: "休日当番医からAIお悩み相談まで。\nあなたのスマホが、那須地域最強の「お守り」に変わります。",
      empathyTitle: "病院探し、子育ての悩み…\nその都度、別のアプリやサイトを開いていませんか？",
      empathyIntro: "那須での生活に必要な「あれこれ」を、たった一つに。50個以上の便利が、あなたの毎日を徹底的にサポートします。",
      solutionBenefit1_Title: "もしもの時の、家族の安心に",
      solutionBenefit1_Desc: "休日夜間診療所を瞬時に検索。災害時の避難行動をAIがシミュレーション。暮らしの緊急事態に、もう焦りません。",
      solutionBenefit2_Title: "忙しい毎日の、時間とお金を節約",
      solutionBenefit2_Desc: "AIが献立を提案し、買い忘れも防止。ペットの迷子や里親募集情報も充実しています。",
      solutionBenefit3_Title: "ちょっと疲れた、あなたの心に",
      solutionBenefit3_Desc: "愚痴聞き地蔵AIや共感チャットAIが、24時間あなたの心に寄り添います。毎朝届く「褒め言葉シャワー」で一日を元気に。",
      freeReasonTitle: "なぜ、これだけの機能がずっと無料なのですか？",
      freeReasonDesc: "このアプリは、地域の企業様からの広告協賛によって運営されています。私たちは、那須地域に住むすべての方に、安全と便利を提供することが地域貢献だと考えています。だから、あなたに利用料を請求することは一切ありません。安心して、ずっと使い続けてください。",
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

