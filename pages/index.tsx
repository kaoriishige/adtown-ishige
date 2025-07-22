import { useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { GetServerSideProps, NextPage } from 'next';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

// 新しいデータ構造に合わせた型
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
  // ▼▼▼ フードロスの項目を追加 ▼▼▼
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

interface IndexPageProps {
  data: LandingData;
}

// 共通のCTAボタンコンポーネント
const CtaButton = ({ text, href }: { text: string, href: string }) => (
  <Link href={href} className="inline-block bg-gradient-to-r from-yellow-400 to-orange-500 text-white font-bold text-lg py-4 px-8 rounded-full shadow-lg hover:scale-105 transform transition-all duration-300">
    {text}
  </Link>
);

const IndexPage: NextPage<IndexPageProps> = ({ data }) => {
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
    <div className="bg-gray-50 text-gray-800">
      {/* --- ファーストビュー --- */}
      <header 
        className="relative text-white text-center py-24 px-4"
        style={{ 
          backgroundImage: `linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5)), url('https://placehold.co/1200x800/6366f1/FFFFFF?text=那須の美しい風景')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      >
        <h1 className="text-4xl md:text-6xl font-black leading-tight mb-4" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.7)' }}>
          {data.heroHeadline.split('\n').map((line, i) => <span key={i} className="block">{line}</span>)}
        </h1>
        <p className="text-lg md:text-2xl mb-8" style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.7)' }}>
          {data.heroSubheadline.split('\n').map((line, i) => <span key={i} className="block">{line}</span>)}
        </p>
        <CtaButton text={data.heroCta} href="/signup" />
      </header>

      <main>
        {/* --- 問題提起セクション --- */}
        <section className="py-16 bg-white">
          <div className="max-w-5xl mx-auto px-6 text-center">
            <h2 className="text-3xl font-bold mb-4">{data.problemTitle}</h2>
            <p className="text-gray-600 mb-12">{data.problemIntro}</p>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 text-left">
              <div className="bg-gray-100 p-6 rounded-lg">
                <h3 className="font-bold text-lg text-red-600">{data.problemItem1_Title}</h3>
                <p className="font-bold text-xl mb-2">{data.problemItem1_Amount}</p>
                <p className="text-sm whitespace-pre-wrap">{data.problemItem1_Desc}</p>
              </div>
              <div className="bg-gray-100 p-6 rounded-lg">
                <h3 className="font-bold text-lg text-red-600">{data.problemItem2_Title}</h3>
                <p className="font-bold text-xl mb-2">{data.problemItem2_Amount}</p>
                <p className="text-sm whitespace-pre-wrap">{data.problemItem2_Desc}</p>
              </div>
              <div className="bg-gray-100 p-6 rounded-lg">
                <h3 className="font-bold text-lg text-red-600">{data.problemItem3_Title}</h3>
                <p className="font-bold text-xl mb-2">{data.problemItem3_Amount}</p>
                <p className="text-sm whitespace-pre-wrap">{data.problemItem3_Desc}</p>
              </div>
              <div className="bg-gray-100 p-6 rounded-lg">
                <h3 className="font-bold text-lg text-red-600">{data.problemItem4_Title}</h3>
                <p className="font-bold text-xl mb-2">{data.problemItem4_Amount}</p>
                <p className="text-sm whitespace-pre-wrap">{data.problemItem4_Desc}</p>
              </div>
              {/* ▼▼▼ フードロスの項目を追加 ▼▼▼ */}
              <div className="bg-green-100 p-6 rounded-lg md:col-span-2 lg:col-span-1 border-l-4 border-green-500">
                <h3 className="font-bold text-lg text-green-700">{data.problemItem5_Title}</h3>
                <p className="font-bold text-xl mb-2">{data.problemItem5_Amount}</p>
                <p className="text-sm whitespace-pre-wrap">{data.problemItem5_Desc}</p>
              </div>
            </div>
          </div>
        </section>

        {/* --- 価値提案セクション --- */}
        <section className="py-16 bg-blue-700 text-white">
          <div className="max-w-4xl mx-auto px-6 text-center">
            <h2 className="text-3xl font-bold">{data.valueTitle}</h2>
            <p className="text-4xl font-black mb-4">{data.valueSubTitle}</p>
            <p className="mb-6">{data.valueIntro}</p>
            <div className="text-2xl font-semibold space-y-2 mb-8">
              {data.valuePoints.map((point, i) => <p key={i}>{point}</p>)}
            </div>
            <p className="font-bold text-lg whitespace-pre-wrap">{data.valueConclusion}</p>
          </div>
        </section>

        {/* --- 価格提示セクション --- */}
        <section className="py-16 bg-white">
          <div className="max-w-3xl mx-auto px-6 text-center">
            <h2 className="text-3xl font-bold">{data.pricingTitle}</h2>
            <p className="text-5xl font-black text-blue-600 my-2">{data.pricingSubTitle}</p>
            <p className="text-gray-600 whitespace-pre-wrap">{data.pricingConclusion}</p>
          </div>
        </section>

        {/* --- 紹介制度セクション --- */}
        <section className="py-16 bg-green-50">
          <div className="max-w-4xl mx-auto px-6 text-center">
            <h2 className="text-3xl font-bold mb-4">{data.referralTitle}</h2>
            <p className="text-gray-600 mb-8">{data.referralIntro}</p>
            <div className="grid md:grid-cols-2 gap-8 text-left">
                <div className="bg-yellow-100 border-l-4 border-yellow-400 p-6 rounded">
                    <h3 className="font-bold text-lg">{data.referralBonus1_Title}</h3>
                    <p>{data.referralBonus1_Desc}</p>
                </div>
                <div className="bg-gray-100 border-l-4 border-gray-400 p-6 rounded">
                    <h3 className="font-bold text-lg">{data.referralBonus2_Title}</h3>
                    <p>{data.referralBonus2_Desc}</p>
                </div>
            </div>
            <div className="mt-8 text-left max-w-2xl mx-auto">
                <ul className="list-disc list-inside space-y-2">
                    {data.referralPoints.map((point, i) => <li key={i}>{point}</li>)}
                </ul>
                <p className="text-xs text-gray-500 mt-4">{data.referralCaution}</p>
            </div>
          </div>
        </section>

        {/* --- 最後のひと押し・CTAセクション --- */}
        <section className="py-20 bg-gray-800 text-white">
          <div className="max-w-4xl mx-auto px-6 text-center">
            <h2 className="text-3xl font-bold mb-4">{data.finalCtaTitle}</h2>
            <p className="mb-8 whitespace-pre-wrap">{data.finalCtaText}</p>
            <CtaButton text={data.finalCtaButton} href="/signup" />
            <p className="text-xs text-gray-400 mt-4">{data.finalCtaNote}</p>
          </div>
        </section>
      </main>

      {/* --- フッター --- */}
      <footer className="bg-gray-200 text-center text-sm text-gray-600 py-8 px-4">
        <p className="max-w-4xl mx-auto mb-6 text-xs">{data.footerNote}</p>
        <div className="space-y-2">
            <div className="flex justify-center space-x-6 mb-4">
              <Link href="/legal" className="hover:underline">特定商取引法に基づく表記</Link>
            </div>
            <div>
              <p>みんなの那須アプリ運営</p><p>株式会社adtown</p><p>〒329-2711 栃木県那須塩原市石林698-35</p><p>TEL:0287-39-7577</p>
            </div>
        </div>
      </footer>
    </div>
  );
};

export const getServerSideProps: GetServerSideProps = async () => {
  const docRef = doc(db, 'settings', 'landingV2');
  const docSnap = await getDoc(docRef);
  const dbData = docSnap.exists() ? docSnap.data() : {};
  
  const fallbackData: LandingData = { 
    heroHeadline: '那須で暮らすあなた、\nもしかして、年間91,400円「損」していませんか？',
    heroSubheadline: 'その「損」、この地域で賢く暮らす人たちは、\nみんなの那須アプリで「得」に変えています。',
    heroCta: '▶︎ 私が「損」している理由を確かめる（7日間無料）',
    problemTitle: 'あなたの家族が失っている、年間91,400円の「見えない損」。',
    problemIntro: 'その正体は、日常に隠れたこんな「当たり前」の行動に潜んでいます。',
    problemItem1_Title: '食費の損',
    problemItem1_Amount: '年間 24,000円',
    problemItem1_Desc: '「今日の買い物、どこのスーパーが一番安いんだろう…？」\n毎週、無意識に同じスーパーへ向かっていませんか？ このアプリのAIは、今日のあなたの買い物リストを、エリア全域のチラシ情報から瞬時に計算し、「合計金額が最も安くなる店」を教えてくれます。「なんとなく」で店を選ぶ習慣を、「賢く」選ぶ習慣に変えるだけで、この金額が浮くのです。',
    problemItem2_Title: 'レジャー・外食費の損',
    problemItem2_Amount: '年間 24,000円',
    problemItem2_Desc: '「あ、あそこのテーブル、クーポン使ってる…うちは定価だ…」\nお会計の時、隣の席の人がスマホ画面を見せてスマートに会計している。あなたは何も知らずに、定価で支払う…。その「知らなかった」というだけで、あなたは他の会員より毎月2,000円、年間で24,000円も「多く」支払っているのです。このアプリは、あなたが訪れるほぼ全ての場所で「会員だけの特別待遇」を用意しています。',
    problemItem3_Title: '情報収集の時間の損',
    problemItem3_Amount: '年間 18,000円',
    problemItem3_Desc: '「土曜の午後、急な子供の熱… 今から診てくれる病院はどこ！？」\n休日の夕方、突然のトラブル。『エアコンが壊れた！』『鍵をなくした！』。スマホを片手に焦って検索するも、出てくるのは古い情報や広告ばかり。このアプリは、那須エリアのあらゆる生活サービスの正確な情報を網羅した、あなたの家族だけの「お守り電話帳」です。',
    problemItem4_Title: 'ガソリン代・補助金の損',
    problemItem4_Amount: '年間 12,000円＋α',
    problemItem4_Desc: '「とりあえず、いつものスタンドで満タンに」「市役所のお知らせ、よく読んでないな…」\nその「とりあえず」の給油が、実は一番高い選択肢かもしれません。アプリが教える「1円でも安いスタンド」を選び、「レシートを登録するだけ」で、年間12,000円は確実に節約できます。さらに、あなたが読み飛ばしている市役所からのお知らせの中に、数万円単位の補助金情報が眠っているのです。このアプリは、その「知らなくても仕方ない損」を、根こそぎ「得」に変えます。',
    problemItem5_Title: 'フードロス（廃棄食料）の損',
    problemItem5_Amount: '年間 15,000円＋α',
    problemItem5_Desc: 'まだ美味しく食べられるのに、形が悪いだけで捨てられてしまう野菜や、閉店間際のパンやお惣菜。この「もったいない」を見過ごすことで、あなたは食費をさらに圧縮できるチャンスを逃しています。このアプリは、地域の飲食店や小売店がGoogleスプレッドシートに書き込むだけで、リアルタイムのフードロス情報をあなたに届けます。環境に優しく、お財布にもっと優しい選択が、毎日可能になります。',
    valueTitle: 'これは、アプリではありません。',
    valueSubTitle: '那須での暮らしを最高にする「特別な会員権」です。',
    valueIntro: '私たちが提供したいのは、55個の便利な機能ではありません。',
    valuePoints: ['それは、家族の思い出が増える週末。', 'それは、賢く節約して、ちょっとした贅沢ができる毎日。', 'それは、地域の人と繋がり、もっとこの町が好きになる体験。'],
    valueConclusion: 'みんなの那須アプリは、あなたの家族が「損する毎日」から「得する毎日」へと変わるための、たった一つの鍵です。',
    pricingTitle: '家族みんなで使えて、月額980円。',
    pricingSubTitle: '1日あたり、たったの33円。',
    pricingConclusion: '缶コーヒー1本より安い投資で、\nあなたの家族の毎日は、もっと安全に、もっと豊かに、もっと楽しくなります。',
    referralTitle: '月額980円が“実質無料”どころか、副収入に！',
    referralIntro: 'このアプリの価値を実感したら、ぜひお友達やご家族に紹介してください。あなたの暮らしが、もっと豊かになります。',
    referralBonus1_Title: '【超先行者ボーナス】8月末までにご紹介した方には…',
    referralBonus1_Desc: '紹介報酬【30%】が、この先ずっと継続します！',
    referralBonus2_Title: '【通常特典】9月1日以降に初めてご紹介された方には…',
    referralBonus2_Desc: '紹介報酬【20%】が適用されます。',
    referralPoints: ['紹介は簡単。あなた専用のリンク経由で登録されるだけでOK。報酬は即時にあなたのアカウントに反映され、月々の支払いに充当したり、現金として受け取ったりできます。', '月5人の紹介で、月額アプリ料金が実質無料以上に！', '100人の紹介なら、毎月約30,000円の報酬を継続的にGET！', '追加の設定は一切不要。会員になったその日から、すぐに紹介活動を始められます。'],
    referralCaution: '※紹介報酬は、紹介された方が980円で継続課金した場合からの計算です。',
    finalCtaTitle: 'さあ、あなたはどちらを選びますか？',
    finalCtaText: 'これまで通り、気づかぬうちに年間91,400円を「損」し続ける日常か。\nそれとも、このアプリを手に入れて**「得」をし、さらに「収入」さえも生み出す**新しい毎日か。',
    finalCtaButton: '今すぐ7日間、新しい那須の暮らしを無料で体験する',
    finalCtaNote: '※無料体験期間中にいつでも解約可能です。料金は一切かかりません。',
    footerNote: '※年間損失額91,400円の算出根拠について：食費の節約(月2,000円)、レジャー・外食費の割引(月2,000円)、情報収集にかかる時間の価値(月1,500円)、ガソリン代の節約(月1,000円)、フードロス削減による節約(月1,250円)等の合計を元にした参考金額です。効果を保証するものではありません。',
  };
  
  const data = { ...fallbackData, ...dbData };

  return { props: { data: JSON.parse(JSON.stringify(data)) } };
};

export default IndexPage;
