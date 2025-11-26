import React, { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { IoSparklesSharp } from 'react-icons/io5';
import { RiLayoutGridFill } from 'react-icons/ri';
// 必要なアイコンをlucide-reactからインポート
import { Clock, Gift, Heart, Store, Brain, Zap, Utensils, Droplet, Gamepad, User, Users, Trash2, Shield, TrendingUp, ArrowLeft, Target, BookOpen, Calendar, Smile, Lightbulb, Shirt, Mail, Sun, Sparkles } from 'lucide-react'; 

// 2025年12月1日を基準日として設定 (利用制限ロジック維持)
const FUTURE_ACCESS_DATE = new Date('2025-12-01T00:00:00');
const isFutureAccessEnabled = new Date() >= FUTURE_ACCESS_DATE;

// --- アプリ定義リスト ---
const APP_LIST = [
    // ----------------------------------------------------
    // 生活情報
    // ----------------------------------------------------
    { title: "冷蔵庫 在庫管理", category: '生活情報', description: '賞味期限を追跡し、食材の無駄を減らす', href: '/apps/FridgeManager', Icon: Clock, disabled: false },
    { title: "知っ得！生活の裏技AI", category: '生活情報', description: '時短、掃除、収納などの役立つ裏技をAIが提案', href: '/apps/LifeHacksAI', Icon: Lightbulb, disabled: false },
    { title: "AIファッション診断", category: '生活情報', description: '用途と体型に基づき最適なコーディネートを提案', href: '/apps/FashionAI', Icon: Shirt, disabled: false },
    { title: "引越し手続きAIナビ", category: '生活情報', description: '転入/転出に必要な手続きリストをAIが生成', href: '/apps/MovingHelperAI', Icon: Mail, disabled: false },

    // ----------------------------------------------------
    // 健康支援
    // ----------------------------------------------------
    { title: "体重記録＆BMI計算", category: '健康支援', description: '日々の体重とBMIを記録・管理', href: '/apps/BodyMassTracker', Icon: Heart, disabled: false },
    
    // ----------------------------------------------------
    // 子育て
    // ----------------------------------------------------
    { title: "育児記録ワンタッチログ", category: '子育て', description: '授乳・オムツ・睡眠の時刻を簡単記録', href: '/apps/BabyLog', Icon: Gift, disabled: false },
    { title: "子育て支援情報ナビ", category: '子育て', description: '各市町の子育て・教育情報リンク集', href: '/apps/ParentingInfo', Icon: User, disabled: false },
    
    // ----------------------------------------------------
    // 節約・特売 (統合された新しい名称)
    // ----------------------------------------------------
    { 
      title: "スーパー特売チラシ＆AI献立ナビ", 
      category: '節約・特売', 
      description: '地域のチラシ確認とプロの節約レシピを提案', 
      href: '/nasu/kondate', 
      Icon: Utensils,
      disabled: false 
    },
    { title: "ドラッグストアチラシ", category: '節約・特売', description: 'ドラッグストアの特売情報', href: '/nasu', Icon: Store, disabled: false },
    
    // ----------------------------------------------------
    // エンタメ
    // ----------------------------------------------------
    { title: "直感！脳力診断", category: 'エンタメ', description: '心理テストと脳トレ雑学で頭を活性化', href: '/apps/BrainTest', Icon: Brain, disabled: false },
    { title: "那須地区マスターズクイズ", category: 'エンタメ', description: '那須地域の歴史・観光クイズに挑戦', href: '/apps/QuizGame', Icon: Gamepad, disabled: false },

    // ----------------------------------------------------
    // 防災・安全
    // ----------------------------------------------------
    { title: "地域防災情報ナビ", category: '防災・安全', description: '各市町の防災情報・ハザードマップリンク集', href: '/apps/DisasterInfo', Icon: Shield, disabled: false },

    // ----------------------------------------------------
    // 診断・運勢
    // ----------------------------------------------------
    { title: "今日の運勢占い", category: '診断・運勢', description: '生年月日による今日の運勢診断', href: '/apps/DailyFortune', Icon: Droplet, disabled: false },
    { title: "適職＆性格診断", category: '診断・運勢', description: 'あなたの強みと適職（在宅ワーク含む）を診断', href: '/apps/AptitudeTest', Icon: Target, disabled: false },
    { title: "朝の褒め言葉AI", category: '診断・運勢', description: 'AIが今日のモチベーションを高めるメッセージを提案', href: '/apps/MorningComplimentAI', Icon: Sun, disabled: false },
    // ★追加: AI手相鑑定
    { title: "AI手相鑑定", category: '診断・運勢', description: 'カメラで手相を撮影するだけで、AIが本格鑑定', href: '/apps/Palmistry', Icon: Sparkles, disabled: false },
    
    // ----------------------------------------------------
    // 人間関係 
    // ----------------------------------------------------
    { title: "苦手な人攻略ヒント", category: '人間関係', description: '相手のタイプから接し方とストレス対策を診断', href: '/apps/RelationshipHint', Icon: Users, disabled: false },
    
    // ----------------------------------------------------
    // スキルアップ・キャリア
    // ----------------------------------------------------
    { title: "スキル学習時間トラッカー", category: 'スキルアップ・キャリア', description: '収益化スキル（ライティング等）の目標時間を管理', href: '/apps/SkillTimeTracker', Icon: TrendingUp, disabled: false },
    
    // ----------------------------------------------------
    // 趣味・文化
    // ----------------------------------------------------
    { title: "わたしの気分ログ", category: '趣味・文化', description: '毎日の気分と感情の傾向を記録・分析', href: '/apps/MoodTracker', Icon: Smile, disabled: false },
];

// カテゴリ名の維持
const CATEGORIES = [
  '生活情報',
  '健康支援',
  '子育て',
  '節約・特売',
  'エンタメ',
  '防災・安全', 
  'スキルアップ・キャリア', 
  '診断・運勢',
  '人間関係',
  '趣味・文化' 
];

// カテゴリにアプリが登録されているかチェックし、アプリがない場合はプレースホルダー表示をするヘルパー関数
const getCategoryAppList = (category: string) => {
    const list = APP_LIST.filter(app => app.category === category);
    
    // アプリがなくても、プレースホルダーを表示するロジック
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
    return list;
}


export default function CategoriesPage() {
    const [selectedCategory, setSelectedCategory] = useState('すべて');
    const router = useRouter();

    const filteredApps = selectedCategory === 'すべて'
        ? APP_LIST
        : getCategoryAppList(selectedCategory); 

    // カテゴリボタンをクリックしたときのハンドラ
    const handleCategoryClick = (category: string) => {
        setSelectedCategory(category);
    };

    return (
        <div className="min-h-screen bg-white font-sans text-gray-800">
            <Head>
                <title>アプリカテゴリ一覧</title>
            </Head>

            <header className="bg-white shadow-sm sticky top-0 z-10 p-4 border-b border-gray-200">
                <div className="max-w-xl mx-auto flex items-center gap-3">
                    <button 
                        onClick={() => router.push('/home')} 
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5 text-gray-600" />
                    </button>
                    <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                          <RiLayoutGridFill className="w-6 h-6 text-green-600" />
                          アプリカテゴリ
                    </h1>
                </div>
            </header>

            <main className="max-w-xl mx-auto p-4 sm:p-6">
                
                {/* ジャンル選択エリア */}
                <section className="mb-8">
                    <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2 border-l-4 border-green-600 pl-3">
                        <IoSparklesSharp className="w-5 h-5 text-green-500" />
                        ジャンルで選ぶ
                    </h2>
                    
                    <div className="flex flex-wrap gap-2">
                        {/* 「すべて」ボタン */}
                        <button
                            onClick={() => setSelectedCategory('すべて')}
                            className={`p-3 rounded-lg text-sm font-medium transition-colors border ${
                                selectedCategory === 'すべて' 
                                    ? 'bg-gray-800 text-white border-gray-800 shadow-lg'
                                    : 'bg-green-50 text-green-700 border-green-300 hover:bg-green-100'
                            }`}
                        >
                            すべてのジャンル
                        </button>

                        {/* その他のカテゴリ */}
                        {CATEGORIES.map(category => {
                            return (
                                <button
                                    key={category}
                                    onClick={() => handleCategoryClick(category)}
                                    className={`p-3 rounded-lg text-sm font-medium transition-colors border ${
                                        selectedCategory === category 
                                            ? 'bg-green-600 text-white border-green-600 shadow-lg' 
                                            : 'bg-green-50 text-green-700 border-green-300 hover:bg-green-100'
                                    }`}
                                >
                                    {category}
                                </button>
                            );
                        })}
                    </div>
                </section>

                {/* アプリ一覧エリア */}
                <section>
                    <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2 border-l-4 border-blue-600 pl-3">
                        <RiLayoutGridFill className="w-5 h-5 text-blue-600" />
                        {selectedCategory === 'すべて' ? '全公開アプリ一覧' : `${selectedCategory} のアプリ`}
                    </h2>
                    
                    <div className="space-y-3">
                        {filteredApps.length > 0 ? (
                            filteredApps.map(app => (
                                <Link 
                                    key={app.title} 
                                    href={app.disabled ? '#' : app.href} 
                                    legacyBehavior
                                >
                                    <a className={`block p-4 rounded-xl shadow-sm border transition-all ${
                                        app.disabled 
                                            ? 'bg-gray-200 text-gray-500 cursor-not-allowed opacity-70 border-gray-300' 
                                            : 'bg-white border-gray-200 hover:shadow-lg'
                                    }`}
                                        onClick={(e) => { if (app.disabled) e.preventDefault(); }}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                {/* 動的にアイコンをレンダリング */}
                                                <app.Icon className={`w-6 h-6 flex-shrink-0 ${app.disabled ? 'text-gray-400' : 'text-blue-500'}`} />
                                                <div>
                                                    <h3 className={`font-bold text-lg ${app.disabled ? 'text-gray-500' : 'text-gray-800'}`}>{app.title}</h3>
                                                    <p className="text-sm text-gray-500 mt-1">{app.description}</p>
                                                </div>
                                            </div>
                                            {app.disabled && (
                                                <span className="text-xs font-bold text-red-600 bg-red-100 px-3 py-1 rounded-full flex-shrink-0">
                                                    使用不可
                                                </span>
                                            )}
                                        </div>
                                    </a>
                                </Link>
                            ))
                        ) : (
                            <div className="text-center py-10 bg-white rounded-xl shadow-sm border border-dashed border-gray-300">
                                <p className="text-gray-500">このジャンルに公開されているアプリはありません。</p>
                            </div>
                        )}
                    </div>
                </section>

            </main>
        </div>
    );
}