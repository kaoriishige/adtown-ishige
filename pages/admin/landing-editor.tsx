import { useState } from 'react'; // 読み込み元を'next'から'react'に修正
import { GetServerSideProps, NextPage } from 'next';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Link from 'next/link';

// 新しいランディングページのデータ構造に合わせた型
interface LandingData {
  // ファーストビュー
  heroHeadline: string;
  heroSubheadline: string;
  heroCta: string;
  // 問題提起
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
  // 価格提示
  pricingTitle: string;
  pricingSubTitle: string;
  pricingConclusion: string;
  // 紹介制度
  referralTitle: string;
  referralIntro: string;
  referralBonus1_Title: string;
  referralBonus1_Desc: string;
  referralBonus2_Title: string;
  referralBonus2_Desc: string;
  referralPoints: string[];
  referralCaution: string;
  // 最後のひと押し
  finalCtaTitle: string;
  finalCtaText: string;
  finalCtaButton: string;
  finalCtaNote: string;
  // フッター
  footerNote: string;
}

interface EditorPageProps {
  initialContent: LandingData;
}

const LandingEditorPage: NextPage<EditorPageProps> = ({ initialContent }) => {
  const [data, setData] = useState<LandingData>(initialContent);
  const [isLoading, setIsLoading] = useState(false);

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
      <div className="w-1/3 p-6 bg-white border-r overflow-y-auto">
        <Link href="/admin" className="text-blue-500 hover:underline">← 管理メニューに戻る</Link>
        <h1 className="text-2xl font-bold my-4">ランディングページ編集</h1>
        <div className="space-y-4">
          {Object.keys(data).map((key) => (
            <div key={key}>
              <label className="block text-sm font-bold mb-1 capitalize">{key.replace(/_/g, ' ')}:</label>
              {key.includes('Desc') || key.includes('Intro') || key.includes('Conclusion') || key.includes('Text') || Array.isArray((data as any)[key]) ? (
                <textarea 
                  name={key} 
                  value={Array.isArray((data as any)[key]) ? (data as any)[key].join('\n') : (data as any)[key]} 
                  onChange={Array.isArray((data as any)[key]) ? handleArrayChange : handleInputChange} 
                  rows={5} 
                  className="w-full p-2 border rounded"
                />
              ) : (
                <input 
                  name={key} 
                  value={(data as any)[key]} 
                  onChange={handleInputChange} 
                  className="w-full p-2 border rounded"
                />
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

      {/* --- 右側：ライブプレビュー (簡易版) --- */}
      <div className="w-2/3 overflow-y-auto p-8">
        <h2 className="text-xl font-bold mb-4">簡易プレビュー</h2>
        <div className="bg-white p-6 rounded-lg shadow-md space-y-4">
            <h3 className="font-bold text-lg">ファーストビュー</h3>
            <p className="whitespace-pre-wrap">{data.heroHeadline}</p>
            <hr/>
            <h3 className="font-bold text-lg">問題提起</h3>
            <p className="whitespace-pre-wrap">{data.problemTitle}</p>
             <hr/>
            <h3 className="font-bold text-lg">価値提案</h3>
            <p className="whitespace-pre-wrap">{data.valueTitle}</p>
        </div>
      </div>
    </div>
  );
};

export const getServerSideProps: GetServerSideProps = async () => {
  const docRef = doc(db, 'settings', 'landingV2');
  const docSnap = await getDoc(docRef);
  
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
  
  const dbData = docSnap.exists() ? docSnap.data() : {};
  const initialContent = Object.keys(fallbackData).reduce((acc, key) => {
    (acc as any)[key] = (dbData as any)[key] ?? (fallbackData as any)[key];
    return acc;
  }, {} as LandingData);

  return { props: { initialContent: JSON.parse(JSON.stringify(initialContent)) } };
};

export default LandingEditorPage;

