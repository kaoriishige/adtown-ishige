import { GetServerSideProps, NextPage } from 'next';
import Link from 'next/link';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

// データ構造の型定義を最新のテキストに合わせて更新
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
  // 5番目の項目は削除
  appListTitle: string;
  appListIntro: string;
  appList: string[];
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

// 登録ボタンを無効化し、クリックできないようにしたコンポーネント
const DisabledCtaButton = ({ text }: { text: string }) => (
  <div className="inline-block bg-gradient-to-r from-yellow-400 to-orange-500 text-white font-bold text-lg py-4 px-8 rounded-full shadow-lg cursor-not-allowed opacity-75">
    {text}
  </div>
);

const LandingPreviewPage: NextPage<IndexPageProps> = ({ data }) => {
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
        <p className="text-lg md:text-2xl mb-8 whitespace-pre-wrap" style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.7)' }}>
          {data.heroSubheadline}
        </p>
        <DisabledCtaButton text={data.heroCta} />
      </header>

      <main>
        {/* --- 問題提起セクション --- */}
        <section className="py-16 bg-white">
          <div className="max-w-5xl mx-auto px-6 text-center">
            <h2 className="text-3xl font-bold mb-4">{data.problemTitle}</h2>
            <p className="text-gray-600 mb-12">{data.problemIntro}</p>
            <div className="grid md:grid-cols-2 gap-8 text-left">
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
              <div className="bg-green-100 p-6 rounded-lg border-l-4 border-green-500">
                <h3 className="font-bold text-lg text-green-700">{data.problemItem4_Title}</h3>
                <p className="font-bold text-xl mb-2">{data.problemItem4_Amount}</p>
                <p className="text-sm whitespace-pre-wrap">{data.problemItem4_Desc}</p>
              </div>
            </div>
          </div>
        </section>

        {/* --- アプリ一覧セクション (新規追加) --- */}
        <section className="py-16 bg-gray-50">
          <div className="max-w-4xl mx-auto px-6 text-center">
            <h2 className="text-3xl font-bold mb-2">{data.appListTitle}</h2>
            <p className="text-gray-600 mb-10">{data.appListIntro}</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 text-sm">
              {data.appList.map((app, i) => (
                <div key={i} className="bg-white p-4 rounded-lg shadow-md border border-gray-200 text-center">
                  {app}
                </div>
              ))}
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
            <DisabledCtaButton text={data.finalCtaButton} />
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
    heroHeadline: '那須地域で暮らすあなた、もしかして、年間93,000円＋α「損」していませんか？',
    heroSubheadline: 'その「損」、この地域で賢く暮らす人たちは、\nみんなの那須アプリで「得」に変えています。\n生活の問題を50個以上のアプリで解決!!\n7日間、登録無料でアプリ使い放題!!解約は自由!!',
    heroCta: '今すぐ7日間、無料でアプリ体験をする',
    problemTitle: 'あなたの家族が失っている、年間93,000円＋αの「見えない損」。',
    problemIntro: 'その正体は、日常に隠れたこんな「当たり前」の行動に潜んでいます。',
    problemItem1_Title: '地域スーパーチラシ比較アプリ/食費の損!!',
    problemItem1_Amount: '年間 約36,000円＋α',
    problemItem1_Desc: '「今日、どこのスーパーが一番安いのか分からない…」\nそんな悩み、ありませんか？\n以前は新聞に入っていたチラシで、スーパーごとの特売を比較できました。\nでも今は、新聞を取っていない家庭も多く、チラシを見る手段がなくなりつつあります。\nその結果、なんとなく毎週同じスーパーへ行って、実は損をしているかもしれません。\nこのアプリは、地域すべてのスーパーのチラシ情報をまとめてチェックできるから、\n「今日はこの店が一番安い」がすぐに分かります。\nもう「知らずに高い店で買ってしまった」を防ぎましょう。\nチラシを見る手段を持っているかどうか、それだけで家計に差がつく時代です。',
    problemItem2_Title: '地域の割引クーポン大集合アプリ/外食費などの支払いの損!!',
    problemItem2_Amount: '年間 約24,000円＋α',
    problemItem2_Desc: '「あ、あそこのテーブル、クーポン使ってる…うちは定価だ…」\nお会計の時、隣の席の人がスマホ画面を見せてスマートに会計している。あなたは何も知らずに、定価で支払う…。その「知らなかった」というだけで、あなたは他の会員より毎月2,000円、年間で24,000円も「多く」支払っているのです。このアプリは、あなたが訪れるほぼ全ての場所で「会員だけの特別待遇」を用意しています。同じものを食べ、同じ体験をしても、知っているか知らないかで、支払う金額にこれだけの差が生まれます。',
    problemItem3_Title: '地域を知ってるアプリ/情報収集の時間の損!!',
    problemItem3_Amount: '年間 約18,000円＋α',
    problemItem3_Desc: '「土曜の午後、急な子供の熱… 今から診てくれる病院はどこ！？」\n休日の夕方、突然のトラブル。『エアコンが壊れた！』『鍵をなくした！』。スマホを片手に焦って検索するも、出てくるのは古い情報や広告ばかり。本当に信頼できて、今すぐ対応してくれる地域の業者が見つからず、時間だけが過ぎていく…。その『いざという時に、必死で探す時間』こそ、あなたが失っている時間です。\nこのアプリは、那須エリアのあらゆる生活サービス（休日当番医、水道修理、習い事など）の正確な情報を網羅した、あなたの家族だけの「お守り電話帳」です。あの絶望的な30分を、私たちは「確実な安心」に変えます。その積み重ねが、年間18,000円分もの価値になるのです。',
    problemItem4_Title: '地域フードロスアプリ/フードロス（廃棄食料）の損!!',
    problemItem4_Amount: '年間 約15,000円＋α',
    problemItem4_Desc: 'まだ美味しく食べられるのに、形が悪いだけで捨てられてしまう野菜や、閉店間際のパンやお惣菜。この「もったいない」を見過ごすことで、あなたは食費をさらに圧縮できるチャンスを逃しています。このアプリは、地域の飲食店や小売店のリアルタイムのフードロス情報をあなたに届けます。環境に優しく、お財布にもっと優しい選択が、毎日可能になります。',
    appListTitle: '約50個以上のアプリ!!',
    appListIntro: '使い放題であなたの生活を徹底的にサポートします。',
    appList: [
      'ごはん、何にしよう…献立お悩み相談AI',
      '誰にも言えない恋の悩み、AIにだけそっと相談',
      '職場の人間関係ストレス診断AI',
      '生年月日でわかる！個性診断AI',
      '那須地域ペット情報',
      '愚痴聞き地蔵AI「うんうん、それで？」',
      '言いにくいこと、どう伝える？「アサーティブ会話術AI」',
      '次の旅行、どこ行く？旅のプランニング相談AI',
      '美容室＆美容師マッチングAI（予定）',
      '空き家マッチングAI（予定）',
      '求人マッチングAI（予定）',
      '採れたて野菜農家さんマッチング（予定）',
      'こんなことできるスキルマッチング（予定）',
    ],
    valueTitle: 'これは、アプリではありません。',
    valueSubTitle: '那須地域での暮らしを最高にする「特別な会員権」です。',
    valueIntro: '私たちが提供したいのは、アプリの便利な機能だけではありません。',
    valuePoints: ['それは、家族の思い出が増える週末。', 'それは、賢く節約して、ちょっとした贅沢ができる毎日。', 'それは、地域の人と繋がり、もっとこの町が好きになる体験。'],
    valueConclusion: 'みんなの那須アプリは、あなたの家族が「損する毎日」から「得する毎日」へと変わるための、たった一つの鍵です。',
    pricingTitle: 'これだけの価値が家族全員で使って、月額980円。',
    pricingSubTitle: '1日あたり、たったの33円。',
    pricingConclusion: '缶コーヒー1本より安い投資で、\nあなたの家族の毎日は、もっと安全に、もっと豊かに、もっと楽しくなります。',
    referralTitle: '紹介制度で“実質無料”どころか、副収入に！',
    referralIntro: 'このアプリの価値を実感したら、ぜひお友達やご家族に紹介してください。あなたの暮らしが、もっと豊かになります。',
    referralBonus1_Title: '【超先行者ボーナス】9月末までにご紹介した方には…',
    referralBonus1_Desc: '紹介報酬【30%】が、この先ずっと継続します！',
    referralBonus2_Title: '【通常特典】10月1日以降に初めてご紹介された方には…',
    referralBonus2_Desc: '紹介報酬【20%】が適用されます。',
    referralPoints: ['紹介は簡単。相手の方が、あなた専用の紹介リンク＆QRコード経由で登録されるだけでOK。報酬は即時にあなたのアカウントに反映され、紹介料が3,000円以上になると登録した銀行口座に月末締で翌月15日に振り込みされます。', '月5人の紹介で、月額アプリ料金が実質無料以上に！', '100人の紹介なら、毎月約30,000円の報酬を継続的にGET！', '追加の設定は一切不要。会員になったその日から、すぐに紹介活動を始められます。'],
    referralCaution: '※紹介報酬は、紹介された方が980円で継続課金した場合の計算です。',
    finalCtaTitle: 'さあ、あなたはどちらを選びますか？',
    finalCtaText: 'これまで通り、気づかぬうちに年間93,000円＋αを「損」し続ける日常か。\nそれとも、このアプリを手に入れて「得」をし、さらに「収入」さえも生み出す新しい毎日か。',
    finalCtaButton: '今すぐ7日間、無料でアプリ体験をする',
    finalCtaNote: '※無料体験期間中にいつでも解約可能です。料金は一切かかりません。',
    footerNote: '※年間損失額93,000円＋αの算出根拠について：食費の節約(月3,000円×12ヶ月=36,000円)、外食費などの割引(月2,000円×12ヶ月=24,000円)、情報収集にかかる時間の価値(時給1,000円×月1.5h×12ヶ月=18,000円)、フードロス（廃棄食料）の損 年間 15,000円の合計93,000円を元に、利用状況を考慮して少し低めにまとめた参考金額です。効果を保証するものではありません。',
  };
  
  const data = { ...fallbackData, ...dbData };

  return { props: { data: JSON.parse(JSON.stringify(data)) } };
};

export default LandingPreviewPage;