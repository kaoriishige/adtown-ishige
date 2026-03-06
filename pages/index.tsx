// index.tsx
// 変更点（要件対応）:
//   ✅ LP上のSNS拡散（シェアボタン/リンク）を完全撤去（アイコンも削除）
//   ✅ 拡散は「有料プラン加入後（アプリ内で紹介URL発行後）」のみ、という導線に統一
//   ✅ ?ref=ID 検知は維持し、開示バナー（景表法・ステマ規制）だけ表示（拡散UIは出さない）

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/router';
import Link from 'next/link';
import {
  ShoppingCart,
  Lightbulb,
  Users,
  Sparkles,
  Smile,
  Zap,
  Gift,
  Shield,
  TrendingUp,
  Target,
  Shirt,
  Mail,
  Sun,
  WashingMachine,
  LayoutGrid,
  Award,
  Filter,
  Fuel,
  Heart,
  Wallet,
  ShoppingBag,
  CheckCircle2,
  ChevronRight,
  Utensils,
  Store,
  Brain,
  Droplet,
  Gamepad,
  User,
} from 'lucide-react';
import {
  RiShieldCheckFill,
  RiShoppingBagFill,
  RiPlantFill,
  RiFlashlightFill,
  RiHandHeartFill,
  RiExchangeBoxFill,
  RiGiftFill,
  RiHeartFill,
  RiLightbulbFlashLine,
  RiHome4Line,
  RiLeafLine,
  RiExchangeFundsLine,
} from 'react-icons/ri';
import { useAffiliateTracker } from '@/lib/affiliate-tracker';

// ─────────────────────────────────────────────
// 型定義
// ─────────────────────────────────────────────
interface AppItem {
  title: string;
  category: string;
  description: string;
  href: string;
  Icon: any;
  disabled: boolean;
}

// ─────────────────────────────────────────────
// アプリリスト
// ─────────────────────────────────────────────
const FREE_APP_LIST: AppItem[] = [
  { title: "フードロス格安商品速報", category: '節約・特売', description: '賞味期限間近の商品を最大90%OFFでレスキュー！', href: '/premium', Icon: ShoppingBag, disabled: false },
  { title: "まとめ買いお得チェック", category: '節約・特売', description: '「どっちがお得？」を即座に計算。まとめ買いの適正量も判定', href: '/apps/BulkBuyCalc', Icon: ShoppingCart, disabled: false },
  { title: "かんたん家計簿", category: '節約・特売', description: '予算と支出をシンプル管理。残金がひと目でわかる', href: '/apps/SimpleKakeibo', Icon: Wallet, disabled: false },
  { title: "最安ガソリン＆価格投稿", category: '生活情報', description: '地域の最安ガソリン価格ランキングと価格投稿', href: '/apps/AIGasPriceTracker', Icon: Fuel, disabled: false },
  { title: "アレどこ (Aredoko)", category: '収納・片付け', description: 'たまにしか使わない大事なモノの「しまった場所」を記録・検索', href: '/apps/Aredoko', Icon: Filter, disabled: false },
  { title: "AIクローゼットスリム化診断", category: '収納・片付け', description: '衣類の断捨離をAIが質問でサポートし、意思決定を支援', href: '/apps/ClosetSlimmerAI', Icon: WashingMachine, disabled: false },
  { title: "知っ得！生活の裏技AI", category: '生活情報', description: '時短、掃除、収納などの役立つ裏技をAIが提案', href: '/apps/LifeHacksAI', Icon: Lightbulb, disabled: false },
  { title: "AIファッション診断", category: '生活情報', description: '用途と体型に基づき最適なコーディネートを提案', href: '/apps/FashionAI', Icon: Shirt, disabled: false },
  { title: "引越し手続きAIナビ", category: '生活情報', description: '転入/転出に必要な手続きリストをAIが生成', href: '/apps/MovingHelperAI', Icon: Mail, disabled: false },
  { title: "体重記録＆BMI計算", category: '健康支援', description: '日々の体重とBMIを記録・管理', href: '/apps/BodyMassTracker', Icon: Heart, disabled: false },
  { title: "育児記録ワンタッチログ", category: '子育て', description: '授乳・オムツ・睡眠の時刻を簡単記録', href: '/apps/BabyLog', Icon: Gift, disabled: false },
  { title: "子育て支援情報ナビ", category: '子育て', description: '各市町の子育て・教育情報リンク集', href: '/apps/ParentingInfo', Icon: User, disabled: false },
  { title: "賢人の子育て指針 Wisdom Guide", category: '子育て', description: 'AIと著名人の知恵の言葉から、子育ての羅針盤を見つける', href: '/apps/WisdomGuide', Icon: Award, disabled: false },
  { title: "スーパー特売チラシ＆AI献立ナビ", category: '節約・特売', description: '地域のチラシ確認とプロの節約レシピを提案', href: '/nasu/kondate', Icon: Utensils, disabled: false },
  { title: "ドラッグストア特売チラシ", category: '節約・特売', description: 'ドラッグストアの特売情報', href: '/nasu', Icon: Store, disabled: false },
  { title: "直感！脳力診断", category: 'エンタメ', description: '心理テストと脳トレ雑学で頭を活性化', href: '/apps/BrainTest', Icon: Brain, disabled: false },
  { title: "那須地区マスターズクイズ", category: 'エンタメ', description: '那須地域の歴史・観光クイズに挑戦', href: '/apps/QuizGame', Icon: Gamepad, disabled: false },
  { title: "地域防災情報ナビ", category: '防災・安全', description: '各市町の防災情報・ハザードマップリンク集', href: '/apps/DisasterInfo', Icon: Shield, disabled: false },
  { title: "今日の運勢占い", category: '診断・運勢', description: '生年月日による今日の運勢診断', href: '/apps/DailyFortune', Icon: Droplet, disabled: false },
  { title: "適職＆性格診断", category: '診断・運勢', description: 'あなたの強みと適職（在宅ワーク含む）を診断', href: '/apps/AptitudeTest', Icon: Target, disabled: false },
  { title: "朝の褒め言葉AI", category: '診断・運勢', description: 'AIが今日のモチベーションを高めるメッセージを提案', href: '/apps/MorningComplimentAI', Icon: Sun, disabled: false },
  { title: "AI手相鑑定", category: '診断・運勢', description: 'カメラで手相を撮影するだけで、AIが本格鑑定', href: '/apps/Palmistry', Icon: Sparkles, disabled: false },
  { title: "苦手な人攻略ヒント", category: '人間関係', description: '相手のタイプから接し方とストレス対策を診断', href: '/apps/RelationshipHint', Icon: Users, disabled: false },
  { title: "スキル学習時間トラッカー", category: 'スキルアップ・キャリア', description: '収益化スキル（ライティング等）の目標時間を管理', href: '/apps/SkillTimeTracker', Icon: TrendingUp, disabled: false },
  { title: "わたしの気分ログ", category: '趣味・文化', description: '毎日の気分と感情の傾向を記録・分析', href: '/apps/MoodTracker', Icon: Smile, disabled: false },
];

const FREE_CATEGORIES: string[] = [
  '収納・片付け', '生活情報', '健康支援', '子育て', '節約・特売',
  'エンタメ', '防災・安全', 'スキルアップ・キャリア', '診断・運勢', '人間関係', '趣味・文化'
];

// ─────────────────────────────────────────────
// MenuButton
// ─────────────────────────────────────────────
function MenuButton({ href, icon, title, label, color }: any) {
  return (
    <div className="group relative bg-white p-6 rounded-[2.2rem] shadow-sm border border-gray-100 flex items-center gap-5">
      <div className={`w-16 h-16 flex items-center justify-center bg-gradient-to-br ${color} rounded-2xl text-white shadow-lg shrink-0`}>
        {icon}
      </div>
      <div className="flex-1 text-left">
        <h3 className="font-black text-xl tracking-tighter text-gray-800">{title}</h3>
        <p className="text-[11px] font-medium text-gray-500 mt-1 leading-relaxed">{label}</p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// 紹介リンク開示バナー（?ref= が付いたときのみ）
// ─────────────────────────────────────────────
const ReferralDisclosureBanner: React.FC<{ hasReferral: boolean }> = ({ hasReferral }) => {
  if (!hasReferral) return null;

  return (
    <div className="bg-amber-50 border-b border-amber-200">
      <div className="container mx-auto px-6 py-3 text-center">
        <p className="text-xs font-bold text-amber-700 leading-relaxed">
          ※このページは紹介リンクを含む可能性があります。このリンクから有料プラン登録が発生した場合、紹介者に報酬が発生することがあります（景品表示法・ステマ規制対応の開示）。
        </p>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────
// 「拡散は有料加入後のみ」通知＋CTA（LP上の拡散UI代替）
// ─────────────────────────────────────────────
const PremiumShareCTA: React.FC<{ tone?: 'light' | 'dark' }> = ({ tone = 'light' }) => {
  const isDark = tone === 'dark';

  return (
    <div className={`mt-6 rounded-[2rem] border p-6 text-center shadow-sm ${isDark ? 'bg-green-950/30 border-green-700 text-green-50' : 'bg-gray-50 border-gray-200 text-gray-700'}`}>
      <p className={`text-sm font-black ${isDark ? 'text-green-50' : 'text-gray-800'}`}>
        SNSでの拡散（紹介URLの発行・シェア機能）は、有料プラン加入後に利用できます。
      </p>
      <p className={`mt-2 text-xs font-bold ${isDark ? 'text-green-200' : 'text-gray-500'}`}>
        LP上にはシェアボタンを設置せず、加入後にアプリ内で紹介URLを発行する運用に統一しています。
      </p>

      <div className="mt-5 flex flex-col sm:flex-row gap-3 justify-center">
        <Link
          href="/premium"
          className={`inline-flex justify-center items-center px-6 py-3 rounded-2xl font-black text-sm shadow-lg transition-all transform hover:scale-105 ${isDark
            ? 'bg-white text-green-900'
            : 'bg-gradient-to-r from-amber-500 to-orange-600 text-white hover:from-amber-600 hover:to-orange-700'
            }`}
        >
          有料プランに加入する（月額480円）
        </Link>
        <Link
          href="/premium/referral"
          className={`inline-flex justify-center items-center px-6 py-3 rounded-2xl font-black text-sm border transition-all ${isDark
            ? 'border-green-400/40 text-green-50 hover:bg-green-900/40'
            : 'border-gray-300 text-gray-700 hover:bg-white'
            }`}
        >
          紹介プログラムの詳細を見る
        </Link>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────
// Page component
// ─────────────────────────────────────────────
const IndexPage = () => {
  const BASE_LINE_URL = "https://lin.ee/N4x90pv";
  const [lineUrl, setLineUrl] = useState(BASE_LINE_URL);
  const router = useRouter();

  const [currentPageUrl, setCurrentPageUrl] = useState('https://minnanasu.com');

  // ?ref=ID 検知（紹介リンク開示用）
  const [hasReferral, setHasReferral] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    document.title = "みんなのNasuアプリ | 公式";
    setCurrentPageUrl(window.location.href);

    try {
      const searchParams = new URLSearchParams(window.location.search);
      const referralId = searchParams.get('ref');
      if (referralId) {
        setHasReferral(true);

        // LINEリンクは従来通り ref を引き継ぐ（運用仕様に合わせて）
        const newUrl = `${BASE_LINE_URL}?ref=${referralId}`;
        setLineUrl(newUrl);
        console.log("紹介ID検知: LINEリンクを書き換えました ->", newUrl);
      }
    } catch (e) {
      console.error("パラメータ取得エラー", e);
    }
  }, [router.isReady]);

  const [selectedCategory, setSelectedCategory] = useState('すべて');

  const getCategoryAppList = (category: string): AppItem[] => {
    const list = FREE_APP_LIST.filter(app => app.category === category);
    if (list.length === 0) {
      return [{
        title: "アプリ準備中",
        description: "現在、このカテゴリのアプリを開発中です。",
        Icon: Zap,
        disabled: true,
        href: '#',
        category: category,
      }];
    }
    return list.reduce((acc, current) => {
      const isDuplicate = acc.some(item => item.title === current.title && item.href === current.href);
      if (!isDuplicate) acc.push(current);
      return acc;
    }, [] as AppItem[]);
  };

  const allUniqueApps: AppItem[] = FREE_APP_LIST.reduce((acc, current) => {
    const isDuplicate = acc.some(item => item.title === current.title && item.href === current.href);
    if (!isDuplicate) acc.push(current);
    return acc;
  }, [] as AppItem[]);

  const filteredApps = selectedCategory === 'すべて' ? allUniqueApps : getCategoryAppList(selectedCategory);

  const partnerLogos = [
    '/images/partner-adtown.png',
    '/images/partner-aquas.png',
    '/images/partner-celsiall.png',
    '/images/partner-dairin.png',
    '/images/partner-kanon.png',
    '/images/partner-kokoro.png',
    '/images/partner-meithu.png',
    '/images/partner-midcityhotel.png',
    '/images/partner-omakaseauto.png',
    '/images/partner-poppo.png',
    '/images/partner-sekiguchi02.png',
    '/images/partner-training_farm.png',
    '/images/partner-transunet.png',
    '/images/partner-koharu.png',
    '/images/partner-yamakiya.png',
  ];

  useAffiliateTracker('user');

  return (
    <div className="bg-white text-gray-800 font-sans">
      {/* 紹介リンク開示（?ref= の場合のみ） */}
      <ReferralDisclosureBanner hasReferral={hasReferral} />

      {/* ════════════════════════════════════════
          Hero Section
      ════════════════════════════════════════ */}
      <header className="relative bg-white overflow-hidden shadow-lg">
        <div className="relative w-full aspect-[16/9] md:aspect-[16/7] lg:aspect-[16/6] mx-auto">
          <Image
            src="/images/minna_nasu.png"
            alt="みんなのNasuアプリ 公式ヘッダー画像"
            fill
            priority={true}
            sizes="(max-width: 768px) 100vw, 100vw"
            style={{ objectFit: 'contain' }}
          />
        </div>
        <div className="container mx-auto px-6 py-6 relative z-20 text-center bg-white">
          <div className="max-w-3xl mx-auto">
            <div className="flex flex-col items-center space-y-4">
              <p className="text-xl font-black text-pink-800 bg-yellow-100 px-6 py-2 rounded-full border border-yellow-300 shadow-md">
                最速30秒！LINE友だち追加で無料登録
              </p>
              <a href={lineUrl} target="_blank" rel="noopener noreferrer"
                className="inline-block transition-transform transform hover:scale-105">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="https://scdn.line-apps.com/n/line_add_friends/btn/ja.png"
                  alt="LINE 友だち追加" height="42" className="h-14 w-auto shadow-xl" />
              </a>
            </div>
          </div>
        </div>
      </header>

      <main>
        {/* ════════════════════════════════════════
            那須愛メッセージ
        ════════════════════════════════════════ */}
        <section className="py-16 bg-gradient-to-b from-green-50 to-white border-b">
          <div className="container mx-auto px-6 text-center max-w-2xl">
            <p className="text-4xl md:text-5xl font-black text-green-800 leading-tight tracking-tighter">
              那須が好きすぎて、<br />
              <span className="text-green-600">このアプリを作りました。</span>
            </p>
            <div className="mt-6 space-y-2 text-xl font-bold text-gray-500">
              <p>那須塩原市</p>
              <p>大田原市</p>
              <p>那須町</p>
            </div>
            <p className="mt-8 text-lg text-gray-600 leading-relaxed">
              この街に住む人たちの毎日が、<br />
              もう少し<strong className="text-green-700">楽に・楽しく・豊かに</strong>なるように。<br />
              それだけを考えて、作り続けています。
            </p>
          </div>
        </section>

        {/* ════════════════════════════════════════
            20周年 Intro
        ════════════════════════════════════════ */}
        <section className="text-center py-16 bg-white border-b">
          <div className="container mx-auto px-6">
            <h2 className="text-3xl font-bold text-gray-800">
              おかげさまで株式会社adtown20周年、感謝企画
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              みんなのNasuアプリを開発しましたので、下記をご覧の上ご利用ください。
            </p>
          </div>
        </section>

        {/* ════════════════════════════════════════
            YouTube
        ════════════════════════════════════════ */}
        <section className="py-16 bg-pink-50">
          <div className="container mx-auto px-6 text-center">
            <div
              className="relative max-w-4xl mx-auto shadow-lg rounded-lg overflow-hidden bg-gray-200"
              style={{ paddingTop: '56.25%' }}
            >
              <iframe
                className="absolute top-0 left-0 w-full h-full"
                src="https://www.youtube.com/embed/JRNx77WfEBU"
                title="YouTube video"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════
            SNS拡散フック：那須こんだてハイライト
            ※LP上の拡散UIは撤去し、加入後のみの導線へ
        ════════════════════════════════════════ */}
        <section className="py-16 bg-orange-50 border-y border-orange-100">
          <div className="container mx-auto px-6 max-w-3xl">
            <div className="text-center mb-8">
              <p className="inline-block bg-orange-100 text-orange-700 text-xs font-black tracking-widest px-4 py-1.5 rounded-full mb-4 uppercase">
                SNSで話題
              </p>
              <h2 className="text-3xl md:text-4xl font-black text-gray-800 leading-tight">
                今日の夕飯、<br />
                <span className="text-orange-600">AIが決めます。</span>
              </h2>
              <p className="mt-4 text-lg text-gray-600 font-bold leading-relaxed">
                那須地域のスーパー特売チラシを読み込んで、<br className="hidden md:block" />
                冷蔵庫の在庫と組み合わせ、<br className="hidden md:block" />
                「いちばんお得で美味しい献立」を自動で提案。
              </p>
            </div>

            <div className="grid grid-cols-3 gap-4 my-8">
              {[
                { step: '1', label: '特売チラシを\nチェック', emoji: '🛒' },
                { step: '2', label: '冷蔵庫の\n在庫を入力', emoji: '🧊' },
                { step: '3', label: 'AIが献立を\n自動提案', emoji: '🍳' },
              ].map((item) => (
                <div key={item.step}
                  className="bg-white rounded-2xl p-4 text-center shadow-sm border border-orange-100">
                  <div className="text-3xl mb-2">{item.emoji}</div>
                  <div className="text-[10px] font-black text-orange-400 tracking-widest mb-1">
                    STEP {item.step}
                  </div>
                  <p className="text-xs font-bold text-gray-700 leading-relaxed whitespace-pre-line">
                    {item.label}
                  </p>
                </div>
              ))}
            </div>

            <div className="text-center bg-white rounded-[2rem] p-6 border border-orange-100 shadow-sm">
              <p className="text-xl font-black italic text-gray-800">
                "考えるのはAI。あなたは、作るだけ。"
              </p>
              <p className="mt-2 text-sm text-gray-500">
                那須塩原・大田原・那須町のスーパー特売に完全対応
              </p>
            </div>

            {/* LP上の拡散UIは置かない */}
            <PremiumShareCTA />
          </div>
        </section>

        {/* ════════════════════════════════════════
            パートナーロゴ
        ════════════════════════════════════════ */}
        <section className="py-16 bg-white border-y">
          <div className="container mx-auto px-6 text-center">
            <h3 className="text-sm tracking-widest text-gray-500 mb-8 font-semibold uppercase">
              那須地域のパートナー企業・店舗様
            </h3>
            <div className="mt-8 flex flex-wrap justify-center items-center gap-x-8 gap-y-6 opacity-90">
              {partnerLogos.map((logoPath, index) => (
                <div key={index} className="p-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={logoPath}
                    alt={`パートナーロゴ ${index + 1}`}
                    width={150}
                    height={50}
                    className="object-contain max-h-12 w-auto"
                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                  />
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════
            Free Apps Section
        ════════════════════════════════════════ */}
        <section className="py-20 bg-white">
          <div className="container mx-auto px-4 max-w-4xl">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-5xl font-black text-gray-800 mb-4 tracking-tighter italic">
                <Sparkles className="inline-block w-8 h-8 text-green-500 mr-2 mb-2" />
                FREE APPS
              </h2>
              <p className="text-lg text-gray-600 font-bold">
                地域の暮らしを便利にする「完全無料」アプリ一覧
              </p>
            </div>

            {/* 代表例（Featured Apps） */}
            <div className="space-y-12 mb-20">
              <FeaturedAppCard
                title="那須こんだて｜AI献立＆特売ナビ"
                description={<>那須地域の特売チラシ × 冷蔵庫の在庫から、<br className="hidden md:block" />AIが"今いちばんお得で美味しい献立"を自動提案。</>}
                detail="那須塩原市・大田原市・那須町のスーパー特売をまとめて見れる、家族構成に合わせた分量・レシピ・買い物リストまで一気に作ります。"
                features={[
                  "那須地域のスーパー特売に完全対応",
                  "写真 or 入力だけで特売を読み取り",
                  "冷蔵庫の在庫をムダなく使い切り",
                  "家族人数に合わせた献立と分量を自動調整",
                  "買い物リストをそのまま使える"
                ]}
                recommend={[
                  "毎日の献立に悩みたくない",
                  "特売は見るけど、何を作るか決められない",
                  "食費は抑えたいけど、味は妥協したくない"
                ]}
                oneWord="考えるのはAI。あなたは、作るだけ。"
                color="bg-orange-50 border-orange-100"
                badge="AI × 特売"
                badgeColor="bg-orange-100 text-orange-600"
              />
              <FeaturedAppCard
                title="最安ガソリン｜ガソリン価格比較"
                description={<>那須地域のガソリン価格をまとめて比較。<br className="hidden md:block" />今いちばん安いスタンドが、ひと目でわかる。</>}
                detail="那須塩原市・大田原市・那須町の最新価格情報を地域別に表示。外部の公式価格データと、投稿情報をあわせてチェックできます。"
                features={[
                  "地域別にガソリン価格を比較",
                  "最新の価格ランキングを確認",
                  "価格を見たまま投稿して共有",
                  "外部価格サイトもアプリ内で表示"
                ]}
                recommend={[
                  "ガソリン代を少しでも節約したい",
                  "どのスタンドが安いか毎回迷う",
                  "車移動が多い那須・大田原エリアの方"
                ]}
                oneWord="知らないだけで、毎月損している。"
                color="bg-red-50 border-red-100"
                badge="地域最安"
                badgeColor="bg-red-100 text-red-600"
              />
              <FeaturedAppCard
                title="ドラッグストア特売ナビ"
                description={<>那須地域のドラッグストア特売をまとめてチェック。<br className="hidden md:block" />日用品・薬を、いちばん安い店で。</>}
                detail="那須塩原市・大田原市・那須町のドラッグストア特売チラシを一覧表示。店舗ごとに探さず、「今どこが安いか」だけを素早く確認できます。"
                features={[
                  "地域別に特売チラシをまとめて表示",
                  "主要ドラッグストアに対応",
                  "公式チラシをそのまま確認",
                  "比較に迷わないシンプル設計"
                ]}
                recommend={[
                  "日用品・薬を少しでも安く買いたい",
                  "チラシアプリを何個も使いたくない",
                  "那須地域の情報だけを見たい"
                ]}
                oneWord="見る店を迷う時間が、ゼロになる。"
                color="bg-blue-50 border-blue-100"
                badge="日用品・薬"
                badgeColor="bg-blue-100 text-blue-600"
              />
            </div>

            {/* ジャンル選択 */}
            <div className="mb-10 p-6 bg-green-50 rounded-[2rem] shadow-sm border border-green-100">
              <h3 className="text-lg font-bold text-green-800 mb-4 flex items-center gap-2">
                <LayoutGrid className="w-5 h-5" /> ジャンルで選ぶ
              </h3>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSelectedCategory('すべて')}
                  className={`px-4 py-2 rounded-xl text-sm font-bold transition-all border ${selectedCategory === 'すべて'
                    ? 'bg-gray-800 text-white border-gray-800 shadow-lg'
                    : 'bg-white text-green-700 border-green-200 hover:bg-green-100'}`}
                >
                  すべて
                </button>
                {FREE_CATEGORIES.map(category => (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`px-4 py-2 rounded-xl text-sm font-bold transition-all border ${selectedCategory === category
                      ? 'bg-green-600 text-white border-green-600 shadow-lg'
                      : 'bg-white text-green-700 border-green-200 hover:bg-green-100'}`}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>

            {/* アプリリスト */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {filteredApps.map(app => (
                <div
                  key={`${app.title}-${app.category}`}
                  className={`block p-5 rounded-[2rem] shadow-sm border ${app.disabled
                    ? 'bg-gray-100 text-gray-500 opacity-80 border-gray-300'
                    : 'bg-white border-gray-100'}`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-2xl ${app.disabled ? 'bg-gray-300' : 'bg-green-100 text-green-600'}`}>
                      <app.Icon className="w-6 h-6" />
                    </div>
                    <div className="text-left">
                      <h3 className={`font-black text-lg tracking-tight ${app.disabled ? 'text-gray-500' : 'text-gray-800'}`}>
                        {app.title}
                      </h3>
                      <p className="text-xs text-gray-500 mt-1 leading-relaxed">{app.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-12 p-8 bg-pink-50 rounded-[2.5rem] border border-pink-100 text-center">
              <p className="text-2xl font-black text-pink-700 italic tracking-tighter">
                これらすべて、一生無料。
              </p>
              <p className="mt-2 text-gray-600 font-bold">
                登録しない理由が、見つかりません。
              </p>
              <div className="mt-8 flex flex-col items-center space-y-2">
                <a href={lineUrl} target="_blank" rel="noopener noreferrer"
                  className="inline-block transition-transform transform hover:scale-105">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="https://scdn.line-apps.com/n/line_add_friends/btn/ja.png"
                    alt="LINE 友だち追加" height="42" className="h-12 w-auto shadow-md" />
                </a>
                <p className="text-xs font-bold text-gray-400">
                  ※完全無料登録・いつでも解約可能
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════
            一緒に作るセクション
            ※LP上の拡散UIは撤去
        ════════════════════════════════════════ */}
        <section className="py-20 bg-green-900 text-white">
          <div className="container mx-auto px-6 text-center max-w-2xl">
            <p className="inline-block bg-green-700 text-green-200 text-xs font-black tracking-widest px-4 py-1.5 rounded-full mb-6 uppercase">
              那須好きの方へ
            </p>
            <h2 className="text-3xl md:text-4xl font-black leading-snug">
              このアプリは、<br />
              <span className="text-green-300">那須に住む人たちで</span><br />
              育てていくアプリです。
            </h2>
            <div className="mt-8 space-y-3 text-lg font-bold text-green-100 leading-relaxed">
              <p>もし</p>
              <div className="space-y-1 text-green-300 text-xl">
                <p>・那須が好き</p>
                <p>・那須をもっと盛り上げたい</p>
                <p>・地域の人を応援したい</p>
              </div>
              <p className="pt-2">と思っていただけるなら、</p>
            </div>
            <p className="mt-8 text-2xl font-black text-white">
              ぜひ、一緒に参加してください。
            </p>
            <p className="mt-4 text-green-300 text-base leading-relaxed">
              使うだけで十分です。<br />
              知り合いに話すだけでも十分です。<br />
              <strong className="text-white">あなたの一言が、那須の誰かの毎日を変えます。</strong>
            </p>

            {/* LP上の拡散UIは置かない */}
            <PremiumShareCTA tone="dark" />

            <div className="mt-10 pt-10 border-t border-green-700 flex flex-col items-center space-y-3">
              <p className="text-base font-bold text-green-200">
                まずはLINE登録から（完全無料）
              </p>
              <a href={lineUrl} target="_blank" rel="noopener noreferrer"
                className="inline-block transition-transform transform hover:scale-105">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="https://scdn.line-apps.com/n/line_add_friends/btn/ja.png"
                  alt="LINE 友だち追加" height="42" className="h-14 w-auto shadow-xl" />
              </a>
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════
            有料プラン加入 × 紹介報酬セクション
            ※LP上の拡散UIは撤去（加入後にアプリ内で紹介URL発行）
        ════════════════════════════════════════ */}
        <section className="py-20 bg-gradient-to-b from-amber-50 to-white border-y border-amber-100">
          <div className="container mx-auto px-6 max-w-3xl">
            <div className="text-center mb-12">
              <p className="inline-block bg-amber-100 text-amber-700 text-xs font-black tracking-widest px-4 py-1.5 rounded-full mb-4 uppercase">
                有料プラン × 紹介報酬
              </p>
              <h2 className="text-3xl md:text-4xl font-black text-gray-800 leading-tight">
                シェアするだけで、<br />
                <span className="text-amber-600">那須の暮らしが収入になる。</span>
              </h2>
              <p className="mt-4 text-lg text-gray-600 leading-relaxed">
                有料プラン（月額480円）に加入すると、<br className="hidden md:block" />
                あなた専用の紹介URLがアプリ内で発行されます。<br className="hidden md:block" />
                そのURLから友人が有料加入すると<br className="hidden md:block" />
                <strong className="text-amber-700">20%の紹介報酬</strong>が入ります。
              </p>
            </div>

            {/* 仕組みフロー図 */}
            <div className="relative">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                {[
                  { step: '1', emoji: '📱', title: '無料登録', desc: 'LINEで友だち追加\n（完全無料）', color: 'border-green-200 bg-green-50', labelColor: 'text-green-500' },
                  { step: '2', emoji: '⭐', title: '有料プラン加入', desc: '月額480円で\n全機能が使える', color: 'border-amber-200 bg-amber-50', labelColor: 'text-amber-500' },
                  { step: '3', emoji: '🔗', title: '専用URL発行', desc: 'アプリ内で\n紹介URLを取得', color: 'border-blue-200 bg-blue-50', labelColor: 'text-blue-500' },
                  { step: '4', emoji: '💰', title: '紹介報酬20%', desc: '友人が加入するたびに\n報酬が発生', color: 'border-pink-200 bg-pink-50', labelColor: 'text-pink-500' },
                ].map((item, idx, arr) => (
                  <div key={item.step} className="flex md:flex-col items-center gap-3">
                    <div className={`flex-1 md:w-full rounded-2xl p-4 text-center border ${item.color} shadow-sm`}>
                      <div className="text-3xl mb-2">{item.emoji}</div>
                      <div className={`text-[10px] font-black tracking-widest mb-1 ${item.labelColor}`}>
                        STEP {item.step}
                      </div>
                      <p className="text-sm font-black text-gray-800">{item.title}</p>
                      <p className="text-xs text-gray-500 mt-1 leading-relaxed whitespace-pre-line">
                        {item.desc}
                      </p>
                    </div>
                    {idx < arr.length - 1 && (
                      <ChevronRight className="w-5 h-5 text-gray-300 shrink-0 hidden md:block" />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* 試算ボックス */}
            <div className="bg-white rounded-[2rem] border border-amber-200 shadow-md p-8 mb-8">
              <h3 className="text-center text-lg font-black text-gray-700 mb-6">
                紹介報酬シミュレーション
              </h3>
              <div className="space-y-4">
                {[
                  { friends: '5人', monthly: '480円 × 5人 × 20%', reward: '月額 480円', note: '→ 自分の有料プラン代が実質タダに', highlight: false },
                  { friends: '10人', monthly: '480円 × 10人 × 20%', reward: '月額 960円', note: '→ 毎月960円の収入に', highlight: false },
                  { friends: '50人', monthly: '480円 × 50人 × 20%', reward: '月額 4,800円', note: '→ 那須の暮らしにプラスの収入', highlight: true },
                ].map((row) => (
                  <div
                    key={row.friends}
                    className={`flex flex-col md:flex-row md:items-center justify-between gap-2 p-4 rounded-2xl ${row.highlight
                      ? 'bg-amber-50 border border-amber-200'
                      : 'bg-gray-50 border border-gray-100'}`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl font-black text-amber-600">{row.friends}紹介</span>
                      <span className="text-xs text-gray-400">{row.monthly}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-xl font-black text-gray-800">{row.reward}</span>
                      <p className="text-xs text-gray-500">{row.note}</p>
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-[10px] text-gray-400 mt-4 text-center">
                ※報酬の詳細・条件はアプリ内「紹介プログラム」ページをご確認ください
              </p>
            </div>

            {/* 有料プランの内容 */}
            <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm p-8 mb-8">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <p className="text-xs font-black text-amber-500 tracking-widest uppercase mb-1">
                    Premium Plan
                  </p>
                  <h3 className="text-2xl font-black text-gray-800">月額 480円</h3>
                  <p className="text-xs text-gray-400 mt-1">いつでも解約可能</p>
                </div>
                <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl flex items-center justify-center shadow-lg">
                  <RiGiftFill size={28} className="text-white" />
                </div>
              </div>

              <ul className="space-y-3 mb-6">
                {[
                  '紹介プログラム（20%報酬）が使える',
                  '那須スキル交換所へのアクセス',
                  '那須あき畑・あき家速報',
                  '那須たすけあい速報',
                  'おすそわけ畑・爆安セール速報',
                  'Nasuフリマ・ちょい手伝い',
                  'ペット掲示板・使ってない貸します',
                  '今後追加される全プレミアム機能',
                ].map((feature) => (
                  <li key={feature} className="flex items-start gap-3 text-sm font-bold text-gray-700">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                    {feature}
                  </li>
                ))}
              </ul>

              {/* 有料プラン加入CTA */}
              <Link
                href="/premium"
                className="block w-full text-center bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-black text-lg py-4 px-8 rounded-2xl shadow-lg transition-all transform hover:scale-105"
              >
                有料プランに加入する（月額480円）
              </Link>

              <p className="text-xs text-gray-400 mt-3 text-center">
                ※まずは無料登録（LINE友だち追加）が必要です
              </p>
            </div>

            {/* 一言まとめ（LP上の拡散UIは置かない） */}
            <div className="text-center bg-amber-900 text-white rounded-[2rem] p-8 shadow-xl">
              <p className="text-2xl font-black leading-relaxed">
                "那須が好き"という気持ちが、<br />
                <span className="text-amber-300">そのまま収入になる。</span>
              </p>
              <p className="mt-3 text-amber-200 text-sm font-bold">
                拡散は有料プラン加入後、アプリ内で紹介URLを発行してから。
              </p>
              <div className="mt-6">
                <Link
                  href="/premium"
                  className="inline-flex justify-center items-center px-8 py-4 rounded-2xl bg-white text-amber-700 font-black text-base shadow-lg transition-all transform hover:scale-105"
                >
                  有料プランに加入する
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════
            Paid Apps Section（PREMIUM SERVICES）
        ════════════════════════════════════════ */}
        <section className="py-20 bg-gray-50">
          <div className="container mx-auto px-4 max-w-4xl">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-5xl font-black text-gray-800 mb-4 tracking-tighter italic">
                <RiShieldCheckFill className="inline-block w-8 h-8 text-emerald-500 mr-2 mb-2" />
                PREMIUM SERVICES
              </h2>
              <p className="text-lg text-gray-600 font-bold">
                さらに豊かな那須ライフを。月額480円課金で全機能開放
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4">
              <MenuButton
                href="/premium/referral"
                icon={<RiGiftFill size={28} />}
                title="紹介プログラム"
                label="アプリや各サービスを友人・知人に紹介することで、20%の紹介手数料の報酬がもらえる仕組み。地域のお店・個人の紹介がそのまま収益につながります。"
                color="from-amber-400 to-orange-600"
              />
              <MenuButton
                href="/premium/skill"
                icon={<RiExchangeFundsLine size={28} />}
                title="那須スキル交換所"
                label="「できること」と「困っていること」を地域内でマッチング。専門資格がなくても、日常スキルや経験を価値に変えられます。"
                color="from-blue-700 to-indigo-950"
              />
              <MenuButton
                href="/premium/akihata"
                icon={<RiLeafLine size={28} />}
                title="那須あき畑速報"
                label="使われていない畑・農地の最新情報をまとめて確認。貸したい人と使いたい人をつなぐ、那須地域限定の畑マッチング速報です。"
                color="from-emerald-700 to-emerald-900"
              />
              <MenuButton
                href="/premium/akiya"
                icon={<RiHome4Line size={28} />}
                title="那須あき家速報"
                label="空き家・空き店舗の新着情報をいち早くチェック。移住・開業・利活用を考えている人向けの地域特化情報サービス。"
                color="from-slate-700 to-slate-900"
              />
              <MenuButton
                href="/premium/tasukeai"
                icon={<RiLightbulbFlashLine size={28} />}
                title="那須たすけあい速報"
                label="「ちょっと困った」「誰か手を貸してほしい」をすぐ共有。高齢者・子育て世帯・単身者の『ご近所助け合い』を支える速報機能です。"
                color="from-orange-400 to-yellow-500"
              />
              <MenuButton
                href="/premium/osuso"
                icon={<RiPlantFill size={28} />}
                title="おすそわけ畑"
                label="家庭菜園や畑で余った野菜・果物を地域でシェア。捨てない・無駄にしない・つながるを実現するご近所おすそわけ。"
                color="from-emerald-500 to-green-600"
              />
              <MenuButton
                href="/premium/half-price/create"
                icon={<RiFlashlightFill size={28} />}
                title="爆安セール速報"
                label="地元スーパー・小売店の「本当に安い」情報だけを厳選配信。見逃しがちなタイムセールや数量限定情報もまとめて確認できます。"
                color="from-orange-500 to-red-500"
              />
              <MenuButton
                href="/premium/flea-market"
                icon={<RiShoppingBagFill size={28} />}
                title="Nasuフリマ"
                label="那須地域限定のフリーマーケット掲示板。送料なし・近場取引で、安心・手軽に売買ができます。"
                color="from-pink-500 to-rose-500"
              />
              <MenuButton
                href="/premium/helper"
                icon={<RiHandHeartFill size={28} />}
                title="ちょい手伝い"
                label="草刈り・雪かき・荷物運びなど、短時間のお手伝い募集。「少しだけ助けてほしい」と「空いた時間に稼ぎたい」をつなぎます。"
                color="from-teal-500 to-cyan-500"
              />
              <MenuButton
                href="/premium/rental"
                icon={<RiExchangeBoxFill size={28} />}
                title="使ってない貸します"
                label="使っていない道具・機材・スペースを必要な人へ。買わずに借りる、地域内シェアで無駄を減らします。"
                color="from-blue-500 to-indigo-500"
              />
              <MenuButton
                href="/premium/pet-board/create"
                icon={<RiHeartFill size={28} />}
                title="ペット掲示板"
                label="里親募集・迷子情報・ペットに関する地域掲示板。那須エリア限定だからこそ、すぐに動けて安心です。"
                color="from-purple-500 to-indigo-500"
              />
            </div>

            {/* PREMIUMセクション内加入CTA */}
            <div className="mt-12 p-8 bg-gradient-to-br from-amber-500 to-orange-600 rounded-[2.5rem] shadow-xl text-white text-center">
              <p className="text-xs font-black tracking-widest mb-2 opacity-80 uppercase">
                Premium Plan
              </p>
              <p className="text-3xl font-black leading-tight">
                月額480円で<br />全機能が使える。
              </p>
              <p className="mt-2 text-sm font-bold opacity-80">
                紹介報酬（20%）を使えば、実質タダになる可能性も。
              </p>
              <Link
                href="/premium"
                className="inline-block mt-6 bg-white text-amber-600 font-black text-lg py-4 px-10 rounded-2xl shadow-lg transition-all transform hover:scale-105"
              >
                有料プランに加入する
              </Link>
              <p className="text-xs mt-3 opacity-60">※いつでも解約可能</p>
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════
            Reason Free
        ════════════════════════════════════════ */}
        <section className="py-20 bg-white">
          <div className="container mx-auto px-6 text-center max-w-3xl">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-800">
              「どうして無料なの？」<br />怪しくないですか？
            </h2>
            <div className="mt-6 text-gray-600 leading-relaxed text-lg">
              ご安心ください。これは地域の企業様が「那須に住むあなたを応援したい」という想いでスポンサーになってくれているからです。<br className="my-2" />
              <strong>だから、あなたは遠慮なく、堂々と無料で使い倒してください。</strong><br />
              あなたが便利に暮らすことが、地域の元気につながるのです。
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════
            CTA（最終）
            ※LP上の拡散UIは撤去
        ════════════════════════════════════════ */}
        <section id="cta" className="bg-pink-900 text-white">
          <div className="container mx-auto px-6 py-20 text-center">
            <div className="max-w-3xl mx-auto">
              <h2 className="text-3xl md:text-4xl font-bold">
                迷う必要はありません。<br />
                だって、<span>完全無料</span>なんですから。
              </h2>
              <p className="mt-4 text-pink-200">● 追加課金なし ● 解約も自由</p>

              <div className="mt-10 flex flex-col items-center justify-center space-y-6">
                <div className="flex flex-col items-center space-y-2">
                  <p className="text-lg font-bold text-pink-100">
                    最速！LINEで友だち追加
                  </p>
                  <a href={lineUrl} target="_blank" rel="noopener noreferrer"
                    className="inline-block transition-transform transform hover:scale-105">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="https://scdn.line-apps.com/n/line_add_friends/btn/ja.png"
                      alt="LINE 友だち追加" height="42" className="h-14 w-auto shadow-xl" />
                  </a>
                </div>
              </div>

              {/* 拡散は加入後のみ */}
              <div className="mt-10 pt-10 border-t border-pink-700">
                <p className="text-base font-bold text-pink-200 mb-2">
                  拡散（紹介URLの発行・シェア機能）は有料プラン加入後に利用できます
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Link
                    href="/premium"
                    className="inline-flex justify-center items-center px-8 py-4 rounded-2xl bg-white text-pink-800 font-black text-base shadow-lg transition-all transform hover:scale-105"
                  >
                    有料プランに加入する
                  </Link>
                  <Link
                    href="/premium/referral"
                    className="inline-flex justify-center items-center px-8 py-4 rounded-2xl border border-pink-300/50 text-white font-black text-base hover:bg-pink-800/40 transition-all"
                  >
                    紹介プログラムの詳細
                  </Link>
                </div>
              </div>

              <div className="mt-10 text-pink-300 text-sm md:text-base">
                <p>このボタンを押すだけで、</p>
                <p>あなたの毎日は、もっとやさしく、もっと楽になります。</p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* ════════════════════════════════════════
          Footer
      ════════════════════════════════════════ */}
      <footer className="bg-gray-900 text-gray-400 text-sm">
        <div className="container mx-auto py-10 px-6 text-center space-y-3">
          <Link href="/legal" className="hover:text-white">
            特定商取引法に基づく表記
          </Link>
          <p>みんなのNasuアプリ運営 | 株式会社adtown</p>
          <p>〒329-2711 栃木県那須塩原市石林698-35 | TEL:0287-39-7577</p>
        </div>
      </footer>
    </div>
  );
};

// ─────────────────────────────────────────────
// FeaturedAppCard（変更なし）
// ─────────────────────────────────────────────
const FeaturedAppCard = ({
  title, description, detail, features, recommend, oneWord, color, badge, badgeColor
}: {
  title: string;
  description: React.ReactNode;
  detail: string;
  features: string[];
  recommend: string[];
  oneWord: string;
  color: string;
  badge: string;
  badgeColor: string;
}) => (
  <div className={`p-8 rounded-[2.5rem] border ${color} relative overflow-hidden`}>
    <div className="relative z-10">
      <div className="flex flex-col md:flex-row gap-6 md:items-start">
        <div className="flex-1 space-y-4">
          <div className="space-y-2">
            <span className={`inline-block px-3 py-1 rounded-full text-[10px] font-black tracking-widest ${badgeColor}`}>
              {badge}
            </span>
            <h3 className="text-2xl font-black text-gray-800 leading-tight">{title}</h3>
          </div>
          <p className="text-lg font-bold text-gray-700 leading-relaxed">{description}</p>
          <p className="text-sm text-gray-500 leading-relaxed">{detail}</p>
        </div>
      </div>
      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white/60 rounded-2xl p-5">
          <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3">できること</h4>
          <ul className="space-y-2">
            {features.map((f, i) => (
              <li key={i} className="flex items-start gap-2 text-sm font-bold text-gray-600">
                <span className="text-green-500 mt-0.5">✔</span>{f}
              </li>
            ))}
          </ul>
        </div>
        <div className="bg-white/60 rounded-2xl p-5">
          <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3">こんな人に</h4>
          <ul className="space-y-2">
            {recommend.map((r, i) => (
              <li key={i} className="flex items-start gap-2 text-sm font-bold text-gray-600">
                <span className="text-pink-400 mt-0.5">●</span>{r}
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="mt-6 pt-6 border-t border-gray-200/50 text-center">
        <p className="text-xl font-black italic text-gray-800">"{oneWord}"</p>
      </div>
    </div>
  </div>
);

export default IndexPage;


