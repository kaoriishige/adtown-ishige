import React, { useState } from 'react';

// lucide-reactから必要なアイコンをインポート
import { 
  Clock, Gift, Heart, Store, Brain, Zap, Utensils, Droplet, Gamepad, User, Users, Shield, TrendingUp, ArrowLeft, Target, Smile, Lightbulb, Shirt, Mail, Sun, Sparkles, WashingMachine, Home, LayoutGrid, Award, Filter 
} from 'lucide-react'; 

// アイコンの型定義
type IconType = React.FC<React.SVGProps<SVGSVGElement>>;

// アプリのデータ型定義
interface AppItem {
    title: string;
    category: string;
    description: string;
    href: string;
    Icon: IconType;
    disabled: boolean;
}

// 2025年12月1日を基準日として設定 (利用制限ロジック維持)
// このロジックはデモ環境では機能しない可能性がありますが、元のコードを尊重し維持します。
const FUTURE_ACCESS_DATE = new Date('2025-12-01T00:00:00');
const isFutureAccessEnabled = new Date() >= FUTURE_ACCESS_DATE;

// --- アプリ定義リスト ---
const APP_LIST: AppItem[] = [
// ----------------------------------------------------
// 収納・片付け ★新カテゴリ
// ----------------------------------------------------
// ★追加: アレどこ (Aredoko)
{ 
title: "アレどこ (Aredoko)", 
category: '収納・片付け', 
description: 'たまにしか使わない大事なモノの「しまった場所」を記録・検索', 
href: '/apps/Aredoko', 
Icon: Filter, // モノを整理・特定するイメージ
disabled: false 
},
{ 
title: "AIクローゼットスリム化診断", 
category: '収納・片付け', 
description: '衣類の断捨離をAIが質問でサポートし、意思決定を支援', 
href: '/apps/ClosetSlimmerAI', 
Icon: WashingMachine, 
disabled: false 
},

// ----------------------------------------------------
// 生活情報
// ----------------------------------------------------
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
// ★追加: 賢人の子育て指針 Wisdom Guide
{ 
title: "賢人の子育て指針 Wisdom Guide", 
category: '子育て', 
description: 'AIと著名人の知恵の言葉から、子育ての羅針盤を見つける', 
href: '/apps/WisdomGuide', 
Icon: Award, 
disabled: false 
},

// ----------------------------------------------------
// 節約・特売 
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

// カテゴリ名の定義
const CATEGORIES: string[] = [
'収納・片付け', // ★新カテゴリ
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
const getCategoryAppList = (category: string): AppItem[] => {
    const list = APP_LIST.filter(app => app.category === category);

    // アプリがなくても、プレースホルダー表示をするロジック
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

    // next/router の代わりに、動作しないためダミーの関数を定義
    const router = {
        push: (path: string) => {
            console.log(`[Router Simulation] Navigate to: ${path}`);
            // Canvas環境での実際のリンク遷移をシミュレート
            // Next.jsの警告を減らすため、<a>タグのhrefではなく、router.pushに一本化する
            window.location.href = path;
        }
    }; 

    const filteredApps = selectedCategory === 'すべて'
        ? APP_LIST
        : getCategoryAppList(selectedCategory); 

    // カテゴリボタンをクリックしたときのハンドラ
    const handleCategoryClick = (category: string) => {
        setSelectedCategory(category);
    };

    return (
        <div className="min-h-screen bg-gray-50 font-sans text-gray-800">
            {/* next/headの代わりに<title>タグを直接設定 */}
            <title>アプリカテゴリ一覧</title>

            <header className="bg-white shadow-md sticky top-0 z-10 p-4 border-b border-gray-200">
                <div className="max-w-xl mx-auto flex items-center gap-3">
                    <button 
                        // ルーティングの代わりに、シミュレーションとして'/home'に戻る処理
                        onClick={() => router.push('/home')} 
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                        aria-label="ホームに戻る"
                    >
                        <ArrowLeft className="w-5 h-5 text-gray-600" />
                    </button>
                    <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                        <LayoutGrid className="w-6 h-6 text-green-600" /> 
                        アプリカテゴリ
                    </h1>
                </div>
            </header>

            <main className="max-w-xl mx-auto p-4 sm:p-6">

                {/* ジャンル選択エリア */}
                <section className="mb-8 p-4 bg-white rounded-xl shadow-lg">
                    <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2 border-l-4 border-green-600 pl-3">
                        <Sparkles className="w-5 h-5 text-green-500" /> 
                        ジャンルで選ぶ
                    </h2>

                    <div className="flex flex-wrap gap-2 max-h-56 overflow-y-auto pr-2"> {/* スクロール可能に */}
                        {/* 「すべて」ボタン */}
                        <button
                            onClick={() => setSelectedCategory('すべて')}
                            className={`p-3 rounded-xl text-sm font-semibold transition-all border shadow-sm ${
                                selectedCategory === 'すべて' 
                                ? 'bg-gray-800 text-white border-gray-800 shadow-xl ring-2 ring-gray-600'
                                : 'bg-green-50 text-green-700 border-green-300 hover:bg-green-100'
                            }`}
                        >
                            <Home className="w-4 h-4 inline-block mr-1" /> すべてのジャンル
                        </button>

                        {/* その他のカテゴリ */}
                        {CATEGORIES.map(category => {
                            return (
                                <button
                                    key={category}
                                    onClick={() => handleCategoryClick(category)}
                                    className={`p-3 rounded-xl text-sm font-semibold transition-all border shadow-sm ${
                                        selectedCategory === category 
                                        ? 'bg-green-600 text-white border-green-600 shadow-xl ring-2 ring-green-400' 
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
                        <LayoutGrid className="w-5 h-5 text-blue-600" /> 
                        {selectedCategory === 'すべて' ? '全公開アプリ一覧' : `${selectedCategory} のアプリ`}
                        <span className="text-sm font-normal text-gray-500 ml-auto">
                            ({filteredApps.length} 件)
                        </span>
                    </h2>

                    <div className="space-y-4">
                        {filteredApps.length > 0 ? (
                            filteredApps.map(app => (
                                // next/linkの代わりに通常の<a>タグを使用
                                <a 
                                    key={app.title} 
                                    // 警告を減らすため、hrefをダミーの'#'に変更し、遷移はonClickで制御する
                                    href='#' 
                                    className={`block p-4 rounded-xl shadow-md border transition-all transform hover:scale-[1.01] ${
                                        app.disabled 
                                        ? 'bg-gray-100 text-gray-500 cursor-not-allowed opacity-80 border-gray-300' 
                                        : 'bg-white border-gray-200 hover:shadow-xl'
                                    }`}
                                    onClick={(e) => { 
                                        // デフォルトのリンク動作を無効化
                                        e.preventDefault(); 
                                        
                                        if (app.disabled) {
                                            // 何もしない
                                            return;
                                        } else {
                                            // 有効なリンクの場合、シミュレーションを行う
                                            router.push(app.href); 
                                        }
                                    }}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-start gap-3">
                                            {/* 動的にアイコンをレンダリング */}
                                            <div className={`p-2 rounded-full ${app.disabled ? 'bg-gray-300' : 'bg-blue-100'}`}>
                                                <app.Icon className={`w-6 h-6 flex-shrink-0 ${app.disabled ? 'text-gray-500' : 'text-blue-600'}`} />
                                            </div>
                                            <div>
                                                <h3 className={`font-bold text-lg leading-tight ${app.disabled ? 'text-gray-500' : 'text-gray-800'}`}>{app.title}</h3>
                                                <p className="text-sm text-gray-500 mt-1">{app.description}</p>
                                            </div>
                                        </div>
                                        {app.disabled && (
                                            <span className="text-xs font-bold text-red-600 bg-red-100 px-3 py-1 rounded-full flex-shrink-0 ml-4">
                                                使用不可
                                            </span>
                                        )}
                                    </div>
                                </a>
                            ))
                        ) : (
                            <div className="text-center py-10 bg-white rounded-xl shadow-sm border border-dashed border-gray-300">
                                <p className="text-gray-500">このジャンルに公開されているアプリはありません。</p>
                            </div>
                        )}
                    </div>
                </section>

                {/* 注意書きエリア */}
                <div className="mt-8 p-4 bg-yellow-50 border-l-4 border-yellow-500 text-yellow-800 rounded-lg shadow-sm">
                    <p className="font-bold mb-1 flex items-center gap-2">
                        <Lightbulb className="w-4 h-4" />
                        注意
                    </p>
                    <p className="text-sm">
                        AIアプリは不正確な情報を表示することもあるため、回答によっては再確認することをお勧めします。
                    </p>
                </div>
            </main>
        </div>
    );
}