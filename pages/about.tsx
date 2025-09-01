import { useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { GetServerSideProps, NextPage } from 'next';
// Note: You will need to set up your own 'firebase.ts' file in a 'lib' folder
// For now, this will cause an error until you configure your Firebase project.
// import { doc, getDoc } from 'firebase/firestore';
// import { db } from '@/lib/firebase';

// Data structure for the page content, combining both concepts
interface LandingData {
  heroHeadline: string;
  heroSubheadline: string;
  heroCampaignText: string;
  problemTitle: string;
  problemIntro: string;
  // ▼▼▼ 変更点：「ひみつ道具」の形式に戻します ▼▼▼
  featureItem1_Title: string;
  featureItem1_Amount: string;
  featureItem1_Desc: string;
  featureItem2_Title: string;
  featureItem2_Amount: string;
  featureItem2_Desc: string;
  featureItem3_Title: string;
  featureItem3_Amount: string;
  featureItem3_Desc: string;
  featureItem4_Title: string;
  featureItem4_Amount: string;
  featureItem4_Desc: string;
  featureItem5_Title: string;
  featureItem5_Amount: string;
  featureItem5_Desc: string;
  appsTitle: string;
  appsIntro: string;
  appsList: string[];
  communityTitle: string;
  communityText: string;
  campaignTitle: string;
  campaignPriceOriginal: string;
  campaignPriceNew: string;
  campaignBonus: string;
  campaignNote: string;
  referralTitle: string;
  referralIntro: string;
  referralBonus1_Title: string;
  referralBonus1_Desc: string;
  referralBonus2_Title: string;
  referralBonus2_Desc: string;
  referralPoints: string[];
  referralCaution: string;
  finalCtaTitle: string;
  finalCtaButton: string;
  footerNote: string;
}

interface AboutPageProps {
  data: LandingData;
}

const AboutPage: NextPage<AboutPageProps> = ({ data }) => {
  const router = useRouter();

  useEffect(() => {
    if (router.isReady) {
      const { ref } = router.query;
      if (ref && typeof ref === 'string') {
        sessionStorage.setItem('referrerId', ref);
      }
    }
  }, [router.isReady, router.query]);

  return (
    <div className="bg-gray-50 text-gray-800 font-sans">
      {/* --- Hero Section --- */}
      <header
        className="relative text-white text-center py-24 px-4"
        style={{
          backgroundImage: `linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.6)), url('https://placehold.co/1200x800/34d399/FFFFFF?text=那須の美しい風景')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      >
        <h1 className="text-4xl md:text-6xl font-black leading-tight mb-4" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.7)' }}>
          {data.heroHeadline.split('\n').map((line, i) => <span key={i} className="block">{line}</span>)}
        </h1>
        <p className="text-lg md:text-2xl mb-4" style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.7)' }}>
          {data.heroSubheadline.split('\n').map((line, i) => <span key={i} className="block">{line}</span>)}
        </p>
        <p className="text-xl md:text-2xl mt-4 font-bold text-yellow-300" style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }}>
          {data.heroCampaignText.split('\n').map((line, i) => <span key={i} className="block">{line}</span>)}
        </p>

        <div className="mt-8 space-y-6">
          <Link href="/signup" legacyBehavior>
            <a className="bg-pink-500 hover:bg-pink-600 text-white font-bold text-lg py-4 px-8 rounded-full shadow-lg transition-transform transform hover:scale-105 inline-block">
              {data.finalCtaButton}
            </a>
          </Link>
        </div>
      </header>

      <main>
        {/* --- Problem & Solution (Features) Section --- */}
        <section className="py-20 bg-white">
          <div className="max-w-5xl mx-auto px-6 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">{data.problemTitle}</h2>
            <p className="text-gray-600 mb-12">{data.problemIntro}</p>
            {/* ▼▼▼ 変更点：「ひみつ道具」のレイアウトと内容に戻します ▼▼▼ */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 text-left">
              <div className="bg-blue-50 p-6 rounded-lg shadow-lg border-t-4 border-blue-500">
                <p className="font-bold text-2xl text-red-600 mb-2">{data.featureItem1_Amount}</p>
                <h3 className="font-bold text-xl text-blue-800 mb-2">{data.featureItem1_Title}</h3>
                <p className="text-sm mt-2 whitespace-pre-wrap">{data.featureItem1_Desc}</p>
              </div>
              <div className="bg-green-50 p-6 rounded-lg shadow-lg border-t-4 border-green-500">
                <p className="font-bold text-2xl text-red-600 mb-2">{data.featureItem2_Amount}</p>
                <h3 className="font-bold text-xl text-green-800 mb-2">{data.featureItem2_Title}</h3>
                <p className="text-sm mt-2 whitespace-pre-wrap">{data.featureItem2_Desc}</p>
              </div>
              <div className="bg-yellow-50 p-6 rounded-lg shadow-lg border-t-4 border-yellow-500">
                <p className="font-bold text-2xl text-red-600 mb-2">{data.featureItem3_Amount}</p>
                <h3 className="font-bold text-xl text-yellow-800 mb-2">{data.featureItem3_Title}</h3>
                <p className="text-sm mt-2 whitespace-pre-wrap">{data.featureItem3_Desc}</p>
              </div>
              <div className="bg-purple-50 p-6 rounded-lg shadow-lg border-t-4 border-purple-500">
                 <p className="font-bold text-2xl text-green-600 mb-2">{data.featureItem4_Amount}</p>
                <h3 className="font-bold text-xl text-purple-800 mb-2">{data.featureItem4_Title}</h3>
                <p className="text-sm mt-2 whitespace-pre-wrap">{data.featureItem4_Desc}</p>
              </div>
              <div className="bg-red-50 p-6 rounded-lg shadow-lg border-t-4 border-red-500">
                 <p className="font-bold text-2xl text-green-600 mb-2">{data.featureItem5_Amount}</p>
                <h3 className="font-bold text-xl text-red-800 mb-2">{data.featureItem5_Title}</h3>
                <p className="text-sm mt-2 whitespace-pre-wrap">{data.featureItem5_Desc}</p>
              </div>
            </div>
          </div>
        </section>

        {/* --- Apps List Section --- */}
        <section className="py-20 bg-gray-100">
          <div className="max-w-4xl mx-auto px-6 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">{data.appsTitle}</h2>
            <p className="text-gray-600 mb-12">{data.appsIntro}</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-left">
              {data.appsList.map((app, i) => (
                <div key={i} className="bg-white p-4 rounded-lg shadow-md flex items-center">
                  <svg className="w-6 h-6 text-green-500 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                  <span className="text-sm font-medium">{app}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* --- Community Section --- */}
        <section className="py-16 bg-indigo-800 text-white">
          <div className="max-w-4xl mx-auto px-6 text-center">
            <h2 className="text-3xl font-bold mb-4">{data.communityTitle}</h2>
            <p className="text-lg whitespace-pre-wrap leading-relaxed">{data.communityText}</p>
          </div>
        </section>

        {/* --- Campaign Section --- */}
        <section className="py-20 bg-white">
          <div className="max-w-3xl mx-auto px-6 text-center">
            <h2 className="text-3xl font-bold text-pink-600 animate-pulse">{data.campaignTitle}</h2>
            <div className="my-6 flex items-center justify-center">
              <span className="text-2xl text-gray-500 line-through">{data.campaignPriceOriginal}</span>
              <span className="text-6xl font-black text-gray-800 mx-4">{data.campaignPriceNew}</span>
            </div>
            <div className="bg-yellow-100 border-l-8 border-yellow-400 p-6 rounded-lg shadow-md">
              <p className="text-2xl font-bold text-yellow-800">{data.campaignBonus}</p>
              <p className="text-sm mt-2 text-gray-700 whitespace-pre-wrap">{data.campaignNote}</p>
            </div>
          </div>
        </section>

        <section className="py-20 bg-green-50">
          <div className="max-w-4xl mx-auto px-6 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">{data.referralTitle}</h2>
            <p className="text-gray-600 mb-8">{data.referralIntro}</p>
            <div className="grid md:grid-cols-2 gap-8 text-left">
              <div className="bg-yellow-100 border-l-4 border-yellow-400 p-6 rounded-lg">
                <h3 className="font-bold text-lg text-yellow-800">{data.referralBonus1_Title}</h3>
                <p>{data.referralBonus1_Desc}</p>
              </div>
              <div className="bg-gray-200 border-l-4 border-gray-400 p-6 rounded-lg">
                <h3 className="font-bold text-lg">{data.referralBonus2_Title}</h3>
                <p>{data.referralBonus2_Desc}</p>
              </div>
            </div>
            <div className="mt-8 text-left max-w-2xl mx-auto bg-white p-6 rounded-lg shadow">
              <ul className="list-disc list-inside space-y-3 text-gray-700">
                {data.referralPoints.map((point, i) => <li key={i}><span className="font-bold">{point.split('！')[0]}！</span>{point.split('！')[1]}</li>)}
              </ul>
              <p className="text-xs text-gray-500 mt-4">{data.referralCaution}</p>
            </div>
          </div>
        </section>
      </main>

      {/* --- Footer CTA --- */}
      <footer className="bg-gray-900 text-center text-white py-20 px-4">
        <h2 className="text-4xl font-bold mb-6">{data.finalCtaTitle}</h2>
        <Link href="/signup" legacyBehavior>
          <a className="bg-pink-500 hover:bg-pink-600 text-white font-bold text-xl py-5 px-12 rounded-full shadow-lg transition-transform transform hover:scale-105 inline-block">
            {data.finalCtaButton}
          </a>
        </Link>
        <div className="mt-12">
          <div className="space-y-2 text-sm text-gray-400">
            <p className="max-w-4xl mx-auto mb-6 text-xs">{data.footerNote}</p>
            <div className="flex justify-center space-x-6 mb-4">
              <Link href="/legal" className="hover:underline">特定商取引法に基づく表記</Link>
            </div>
            <div>
              <p>みんなの那須アプリ運営</p><p>株式会社adtown</p><p>〒329-2711 栃木県那須塩原市石林698-35</p><p>TEL:0287-39-7577</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

// This function provides the static text data for the page.
export const getServerSideProps: GetServerSideProps = async () => {
  // In a real app, you would fetch data from Firebase here.
  // const docRef = doc(db, 'settings', 'landingV2');
  // const docSnap = await getDoc(docRef);
  // const dbData = docSnap.exists() ? docSnap.data() : {};

  const fallbackData: LandingData = {
    heroHeadline: 'もしも、那須の毎日が「冒険」になったなら？',
    heroSubheadline: '50個以上のアプリ搭載で年間93,000円以上「得」をする\nみんなの那須アプリ「なっぴー」はじまります！',
    // ▼▼▼ 変更点：ご指定の文言に修正 ▼▼▼
    heroCampaignText: '７日間無料でアプリ使い放題!!\n月額980円の料金が10月末まで月額480円!!',
    problemTitle: 'あなたの家族が失っている、年間93,000円の「見えない損」。',
    problemIntro: 'その正体は、この「５つのひみつ道具」を知らないという、ほんの少しの差に隠されています。',
    featureItem1_Amount: '年間 24,000円の損',
    featureItem1_Title: 'ひみつ道具①：なっぴーのなる木',
    featureItem1_Desc: 'アプリでお買い物するたびに木が育ち、ポイントやクーポンが実ります。「なんとなく」で店を選ぶ習慣を「楽しみながら」お得に選ぶ習慣に変えるだけで、この金額が浮くのです。',
    featureItem2_Amount: '年間 36,000円の損',
    featureItem2_Title: 'ひみつ道具②：タイムカプセル・チケット',
    featureItem2_Desc: '「来週値上がりしそうなガソリン」や「いつものランチ」を“今日の価格”でロック！未来を先読みする賢いお買い物体験が、レジャー費や外食費の「知らなかった損」を防ぎます。',
    featureItem3_Amount: '年間 15,000円の損',
    featureItem3_Title: 'ひみつ道具③：どこでもお宝スキャナー',
    featureItem3_Desc: 'まだ美味しく食べられるフードロス品や、お店の隠れクーポンをカメラで発見！環境に優しく、お財布にもっと優しい選択が、あなたの食費をさらに圧縮します。',
    featureItem4_Amount: '毎月タダになるチャンスを損',
    featureItem4_Title: 'ひみつ道具④：ともだちの輪メーカー',
    featureItem4_Desc: 'たった5人紹介するだけで、あなたのアプリ利用料は毎月ずーっとタダに！この仕組みを知らないだけで、あなたは「払わなくてもいいお金」を払い続けているのです。',
    featureItem5_Amount: '収入を得るチャンスを損',
    featureItem5_Title: 'ひみつ道具⑤：那須クエスト・ボード',
    featureItem5_Desc: 'あなたの「得意」が、誰かの助けになり報酬ポイントに変わります。「公園清掃」から「チラシのデザイン」まで。空いた時間がお金に変わるチャンスを逃していませんか？',
    appsTitle: '約50個以上のアプリが使い放題！',
    appsIntro: '節約や暮らしの悩みから、ちょっとした息抜きまで。あなたの生活を徹底的にサポートします。',
    appsList: [
      '地域スーパーチラシ比較アプリ',
      '地域の割引クーポン大集合アプリ',
      '地域フードロスアプリ',
      '地域を知ってるアプリ',
      'ごはん、何にしよう…献立お悩み相談AI',
      '誰にも言えない恋の悩み、AIにだけそっと相談',
      '職場の人間関係ストレス診断AI',
      '生年月日でわかる！個性診断AI',
      '那須地域ペット情報',
      '愚痴聞き地蔵AI「うんうん、それで？」',
      '言いにくいこと、どう伝える？「アサーティブ会話術AI」',
      '次の旅行、どこ行く？旅のプランニング相談AI',
      'その他、全50個以上',
    ],
    communityTitle: 'この「わくわく」が、大好きな那須の力になる！',
    communityText: 'あなたが「なっぴー」で楽しめば楽しむほど、そのお金は、大手企業じゃなく、あなたの街の、あのパン屋さん、あのラーメン屋さん、あの小さなお店に直接届きます。\nあなたの「楽しい！」が、この街の未来をつくるエネルギーになる。そんな最高のスパイラルを、ここ那須から始めませんか？',
    campaignTitle: '【9月・10月限定！】未来の冒険者たちへ、超先行者キャンペーン！',
    campaignPriceOriginal: '定価 月額980円',
    campaignPriceNew: '今だけ 月額480円',
    // ▼▼▼ 変更点：ご指定の文言に修正 ▼▼▼
    campaignBonus: 'さらに！冒険の始まりを応援する1,000円分の那須地域通貨のなっぴーポイントをプレゼント！',
    campaignNote: '※那須地域通貨は11月1日よりスタート予定です。\n※11月のアプリ課金の確認が取れ次第、ポイントはご利用いただけます。',
    referralTitle: '月額980円が“実質無料”どころか、副収入に！',
    referralIntro: 'このアプリの価値を実感したら、ぜひお友達やご家族に紹介してください。あなたの暮らしが、もっと豊かになります。',
    referralBonus1_Title: '【超先行者ボーナス】10月末までにご紹介した方には…',
    referralBonus1_Desc: '紹介報酬【30%】が、この先ずっと継続します！',
    referralBonus2_Title: '【通常特典】11月1日以降に初めてご紹介された方には…',
    referralBonus2_Desc: '紹介報酬【20%】が適用されます。',
    referralPoints: [
      '紹介は簡単！あなた専用のリンク経由で登録されるだけでOK。報酬は即時にあなたのアカウントに反映され、月々の支払いに充当したり、現金として受け取ったりできます。', 
      '月5人の紹介で！月額アプリ料金が実質無料以上に！',
      '100人の紹介なら！毎月約30,000円の報酬を継続的にGET！',
      '追加の設定は一切不要！会員になったその日から、すぐに紹介活動を始められます。'
    ],
    referralCaution: '※紹介報酬は、紹介された方が月額課金した場合からの計算です。',
    finalCtaTitle: 'さあ、ポケットから那須の未来を取り出しましょう！',
    finalCtaButton: '今すぐ冒険をはじめる！',
    footerNote: '※年間損失額93,000円の算出根拠について：食費の節約(月2,000円)、レジャー・外食費・ガソリン代の割引(月3,000円)、フードロス削減による節約(月1,250円)、情報収集にかかる時間の価値(月1,500円)等の合計を元にした参考金額です。効果を保証するものではありません。',
  };

  const data = { ...fallbackData, /*...dbData*/ };

  return { props: { data: JSON.parse(JSON.stringify(data)) } };
};

export default AboutPage;