import React, { useMemo, useState } from 'react';
import {
  ArrowLeft,
  Utensils,
  Clock,
  Zap,
  Soup,
  Users,
  ThumbsUp,
  Flame,
  X,
  Search,
  CheckCircle,
} from 'lucide-react';
import { createPortal } from 'react-dom';

// =========================
// レシピ型
// =========================
type Recipe = {
  id: number;
  title: string;
  time: number;
  category: string;
  description: string;
  ingredients: string[]; // 材料
  steps: string[]; // 手順
};

// =========================
// レシピデータ (全6カテゴリー x 3レシピ = 18レシピに拡張)
// =========================
const QUICK_RECIPES_DATA: Recipe[] = [
  // --- 1. レンジ (3種) ---
  {
    id: 1,
    title: 'レンジで簡単！鶏むね肉のねぎ塩だれ',
    time: 8,
    category: 'レンジ',
    description: '疲れていてもすぐできる！鶏むね肉がしっとり柔らかい超速メイン。',
    ingredients: ['鶏むね肉', 'ねぎ', 'ごま油', '塩', 'レモン汁'],
    steps: [
      '鶏むね肉はフォークで数カ所刺し、耐熱皿に入れる。',
      '塩胡椒を振り、ラップをして電子レンジ（600W）で3分加熱する。裏返してさらに2分加熱する。',
      '加熱中に、ねぎをみじん切りにし、ごま油、塩、レモン汁と混ぜてねぎ塩だれを作る。',
      '鶏肉を薄切りにし、たれをかけて完成。',
    ],
  },
  {
    id: 2,
    title: '豚バラ大根のレンジ煮',
    time: 10,
    category: 'レンジ',
    description: 'レンジだけで味がしみしみ！ご飯が進む一品。',
    ingredients: ['豚バラ薄切り', '大根', '醤油', '砂糖', 'みりん', 'しょうが'],
    steps: [
      '大根は皮をむき、厚さ5mmのいちょう切りにする。豚バラ肉は食べやすい長さに切る。',
      '耐熱ボウルに大根と豚肉を入れ、醤油、砂糖、みりん、おろししょうがを混ぜた調味料をかける。',
      'ふんわりラップをして電子レンジ（600W）で5分加熱し、一度混ぜる。',
      '再度3分加熱し、大根が柔らかくなったら完成。',
    ],
  },
  {
    id: 3,
    title: '卵とチーズのシンプルリゾット',
    time: 10,
    category: 'レンジ',
    description: '残りご飯と牛乳でOK。夜食にもぴったりの一品。',
    ingredients: ['ご飯', '卵', 'チーズ', '牛乳', 'コンソメ'],
    steps: [
      '耐熱ボウルにご飯、牛乳、コンソメ、塩胡椒を入れる。',
      '電子レンジ（600W）で4分加熱する。',
      '取り出してチーズを混ぜ込み、溶かす。',
      '溶き卵を回し入れ、軽く混ぜて再度1分加熱する。お好みでパセリを振る。',
    ],
  },

  // --- 2. ワンパン (3種) ---
  {
    id: 4,
    title: 'ワンパンで完成！ケチャップパスタ',
    time: 10,
    category: 'ワンパン',
    description: '鍋もフライパンも一つでOK。洗い物激減の定番パスタ。',
    ingredients: ['パスタ', 'ケチャップ', 'ソーセージ', '玉ねぎ', 'コンソメ'],
    steps: [
      '玉ねぎは薄切り、ソーセージは輪切りにする。',
      'フライパンにパスタ、水、コンソメ、玉ねぎを入れて蓋をして強火にかける。',
      '沸騰したら中火にし、パスタの袋表示時間加熱する。（途中水が少なくなったら足す）',
      '水分がほとんどなくなったら、ソーセージ、ケチャップを加えて混ぜ、塩胡椒で味を調える。',
    ],
  },
  {
    id: 5,
    title: '鶏肉とキャベツの味噌マヨホイル焼き風',
    time: 10,
    category: 'ワンパン',
    description: 'アルミホイルを敷けば洗い物ゼロ！コク深い味がご飯を呼ぶ。',
    ingredients: ['鶏もも肉', 'キャベツ', '玉ねぎ', '味噌', 'マヨネーズ'],
    steps: [
      '鶏もも肉と野菜を食べやすい大きさに切る。',
      'アルミホイルを広げ、キャベツ、玉ねぎ、鶏肉の順に重ねる。',
      '味噌とマヨネーズを混ぜたソースをかけ、ホイルをしっかりと閉じる。',
      'フライパンに乗せて蓋をし、中火で8〜10分蒸し焼きにする。',
    ],
  },
  {
    id: 6,
    title: '豚肉ともやしのスタミナうどん',
    time: 7,
    category: 'ワンパン',
    description: '冷凍うどんと焼き肉のタレで、ガッツリ食べたい時に最適。',
    ingredients: ['冷凍うどん', '豚バラ肉', 'もやし', '焼き肉のタレ', 'にんにく'],
    steps: [
      'フライパンにごま油を熱し、豚バラ肉とにんにくチューブを炒める。',
      'もやしを加えてさらに炒め、しんなりしてきたら冷凍うどんを投入。',
      '焼き肉のタレを回し入れ、ほぐしながら全体を炒め合わせて完成。',
    ],
  },

  // --- 3. 炒め物 (3種) ---
  {
    id: 7,
    title: '豚こま切れとピーマンのオイスター炒め',
    time: 5,
    category: '炒め物',
    description: '強火で一気に仕上げる、ご飯が進む味。',
    ingredients: ['豚こま切れ肉', 'ピーマン', 'オイスターソース', '酒', '醤油'],
    steps: [
      'ピーマンは細切りにする。豚こま切れ肉に酒（分量外）を揉み込む。',
      'フライパンにごま油（分量外）をひき、豚肉を炒める。色が変わったらピーマンを加える。',
      'オイスターソース、醤油、酒を混ぜた調味料を回し入れ、強火で一気に炒め合わせる。',
    ],
  },
  {
    id: 8,
    title: '鶏もも肉とキャベツのスタミナ炒め',
    time: 7,
    category: '炒め物',
    description: '鶏肉とキャベツをガツンと炒める、ボリューム満点レシピ。',
    ingredients: ['鶏もも肉', 'キャベツ', 'にんにく', '醤油', '酒'],
    steps: [
      '鶏もも肉は一口大に切り、酒と醤油少々（分量外）を揉み込む。キャベツはざく切りにする。',
      'フライパンにごま油（分量外）とにんにくチューブを熱し、鶏肉を炒める。',
      '色が変わったらキャベツを加え、強火でサッと炒める。',
      '醤油と酒で味付けをし、黒胡椒を振って完成。',
    ],
  },
  {
    id: 9,
    title: '大根とひき肉のきんぴら',
    time: 8,
    category: '炒め物',
    description: 'シャキシャキ大根とひき肉で、ご飯が進む和風常備菜。',
    ingredients: ['大根', '合いびき肉', '醤油', 'みりん', '砂糖'],
    steps: [
      '大根を細切りにする。',
      'フライパンにごま油を熱し、大根と合いびき肉を炒める。',
      '肉の色が変わったら、醤油、みりん、砂糖を加えて、汁気がなくなるまで炒め煮にする。',
    ],
  },

  // --- 4. 和え物 (3種) ---
  {
    id: 10,
    title: '5分でできる！キャベツとツナの無限和え',
    time: 5,
    category: '和え物',
    description: '火を使わずレンジ加熱のみ。あと一品に困らない最強副菜。',
    ingredients: ['キャベツ', 'ツナ缶', 'ポン酢', 'ごま油'],
    steps: [
      'キャベツはざく切りにし、耐熱ボウルに入れる。',
      'ラップをして電子レンジ（600W）で3分加熱する。',
      '水気をしっかり絞り、油を切ったツナ缶、ポン酢、ごま油、塩少々を加えてよく和える。',
      '味が馴染んだら完成。',
    ],
  },
  {
    id: 11,
    title: '無限もやしナムル',
    time: 3,
    category: '和え物',
    description: 'もやしと調味料を和えるだけ。定番の副菜。',
    ingredients: ['もやし', 'ごま油', '鶏ガラスープの素', '塩', 'ごま'],
    steps: [
      'もやしを耐熱皿に入れ、ラップをして電子レンジ（600W）で2分加熱する。',
      '水気をしっかり絞り、ボウルに移す。',
      'ごま油、鶏ガラスープの素、塩、ごまを加えてよく和える。',
      '冷蔵庫で冷やすとさらに美味しい。',
    ],
  },
  {
    id: 12,
    title: '豚肉ときゅうりのごまラー油和え',
    time: 8,
    category: '和え物',
    description: '茹でた豚肉ときゅうりをピリ辛のラー油だれで和える、冷めても美味しい一品。',
    ingredients: ['豚薄切り肉', 'きゅうり', 'ポン酢', 'ラー油', 'ごま'],
    steps: [
      'きゅうりを千切りにする。豚肉は熱湯で茹でて火を通し、水気を切る。',
      'ボウルにポン酢、ごま油、ラー油、砂糖少々を混ぜてたれを作る。',
      '豚肉ときゅうりをボウルに入れ、たれを絡ませて完成。',
    ],
  },

  // --- 5. 鍋・蒸し (3種) ---
  {
    id: 13,
    title: '豚バラともやしの無限鍋',
    time: 7,
    category: '鍋・蒸し',
    description: 'だしで煮込むだけ。ヘルシーで超節約レシピ。',
    ingredients: ['豚バラ薄切り', 'もやし', 'ニラ', 'ポン酢', 'だし'],
    steps: [
      '鍋にだし汁と醤油少々（分量外）を入れ、沸騰させる。',
      'もやしとニラをたっぷり敷き詰める。',
      'その上に豚バラ薄切り肉を広げてのせる。',
      '蓋をして豚肉に火が通るまで3〜4分蒸し煮にする。ポン酢をかけていただく。',
    ],
  },
  {
    id: 14,
    title: '鶏もも肉とキャベツの味噌バター蒸し',
    time: 10,
    category: '鍋・蒸し',
    description: '濃厚味噌バターで野菜が進む！蓋をして放置するだけ。',
    ingredients: ['鶏もも肉', 'キャベツ', '玉ねぎ', '味噌', 'バター'],
    steps: [
      '鶏もも肉は一口大に、玉ねぎとキャベツはざく切りにする。',
      'フライパンにキャベツと玉ねぎを敷き詰め、鶏肉をのせる。',
      '味噌、酒、みりん、水を混ぜた調味料を回しかけ、バターをのせる。',
      '蓋をして中火で約8分蒸し焼きにする。鶏肉に火が通ったら全体を軽く混ぜて完成。',
    ],
  },
  {
    id: 15,
    title: '大根とベーコンのミルクスープ',
    time: 10,
    category: '鍋・蒸し',
    description: '野菜の甘みたっぷりの温かいスープ。朝食にもぴったり。',
    ingredients: ['大根', 'ベーコン', '玉ねぎ', '牛乳', 'コンソメ'],
    steps: [
      '大根と玉ねぎを薄切り、ベーコンを短冊切りにする。',
      '鍋に大根、玉ねぎ、ベーコンと水、コンソメを入れて煮る。',
      '大根が柔らかくなったら牛乳を加え、沸騰直前で火を止め、塩胡椒で味を調える。',
    ],
  },

  // --- 6. ご飯 (3種) ---
  {
    id: 16,
    title: '鮭フレークで簡単混ぜご飯',
    time: 3,
    category: 'ご飯',
    description: '調理器具不要。おにぎりにも便利な超時短ご飯。',
    ingredients: ['ご飯', '鮭フレーク', 'ごま', '大葉'],
    steps: [
      '温かいご飯をボウルに入れ、鮭フレークとごまを混ぜ込む。',
      '大葉を千切りにして加え、軽く混ぜ合わせる。',
      '塩（分量外）で味を調えたら完成。おにぎりにしても良い。',
    ],
  },
  {
    id: 17,
    title: 'ツナマヨ丼',
    time: 5,
    category: 'ご飯',
    description: '定番の組み合わせ！ご飯に乗せるだけで満足感のある一品に。',
    ingredients: ['ご飯', 'ツナ缶', 'マヨネーズ', '醤油', '卵'],
    steps: [
      'ツナ缶の油をしっかり切る。',
      'ボウルでツナ、マヨネーズ、醤油を混ぜ合わせる。',
      '温かいご飯の上にツナマヨを乗せ、お好みで卵の黄身や半熟の目玉焼きを添える。',
    ],
  },
  {
    id: 18,
    title: '鶏肉とネギの簡単炊き込みご飯',
    time: 5,
    category: 'ご飯',
    description: 'めんつゆで味付け簡単。炊飯器に材料を入れるだけ。',
    ingredients: ['米', '鶏もも肉', 'ねぎ', 'めんつゆ'],
    steps: [
      '米を研ぎ、通常の水加減よりも少なめの水でセットする。',
      'めんつゆを加え、一口大に切った鶏肉とねぎの青い部分を乗せる。',
      '炊飯器のスイッチを入れて炊き上げる。炊き上がったら全体を混ぜて完成。',
    ],
  },
];

// =========================
// カテゴリ
// 初期値は「レンジ」に設定
// =========================
const CATEGORY_TABS = [
  { name: 'レンジ', icon: Zap },
  { name: 'ワンパン', icon: Flame },
  { name: '炒め物', icon: Flame },
  { name: '和え物', icon: Utensils },
  { name: '鍋・蒸し', icon: Soup },
  { name: 'ご飯', icon: Utensils },
];

// =========================
// 常備品・調味料リスト (これらは入力になくても許容する)
// =========================
const PANTRY_ITEMS = new Set([
  '塩', 'こしょう', '砂糖', '醤油', 'しょうゆ', '酒', 'みりん', '酢', 'ポン酢',
  '味噌', 'みそ', 'マヨネーズ', 'ケチャップ', 'ソース', 'オイスターソース',
  'カレールウ', 'コンソメ', 'だし', '鶏ガラスープの素', '麺つゆ', 'めんつゆ',
  '白だし', '焼肉のタレ', '油', 'サラダ油', 'オリーブオイル',
  'ごま油', 'バター', 'ごま', 'にんにく', 'しょうが', '水', '牛乳', 'チーズ',
  '小麦粉', '片栗粉', 'パン粉', 'レモン汁', '唐辛子', 'わさび', 'からし', 'パスタ', '冷凍うどん',
  'ベーコン', 'ソーセージ', '大葉',
]);

// =========================
// モーダル
// =========================
const CustomModal = ({
  isOpen,
  title,
  content,
  onClose,
}: {
  isOpen: boolean;
  title: string;
  content: React.ReactNode;
  onClose: () => void;
}) => {
  if (!isOpen) return null;
  return createPortal(
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white p-6 rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto transform transition-all scale-100">
        <div className="flex justify-between items-center mb-4 border-b pb-2">
          <h2 className="text-xl font-bold flex items-center gap-2 text-orange-600">
             <CheckCircle className="w-6 h-6" /> {title}
          </h2>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-100">
            <X className="w-6 h-6 text-gray-500" />
          </button>
        </div>
        <div className="text-gray-700 whitespace-pre-wrap">{content}</div>
        <button
          onClick={onClose}
          className="bg-blue-500 w-full py-2 text-white rounded-lg font-bold hover:bg-blue-600 transition-colors mt-6"
        >
          閉じる
        </button>
      </div>
    </div>,
    document.body
  );
};

// =========================
// 正規化 & カノニカル化
// =========================
const normalize = (s: string) => {
  if (!s) return '';
  const t = s
    .replace(/（.*?）/g, '')
    .replace(/[０-９]/g, ch => String.fromCharCode(ch.charCodeAt(0) - 0xFEE0))
    .replace(/\d+(\.\d+)?\s*(g|kg|個|袋|本|ml|cc|杯|枚|切|片|cm)?/gi, '')
    .replace(/,|、|。|\s|\/|\\/g, '')
    .trim()
    .toLowerCase();
  return t;
};

const canonicalize = (raw: string) => {
  const n = normalize(raw);

  // 肉類
  if (/豚|ぶた|pork/.test(n)) return '豚肉';
  if (/鶏|とり|chicken/.test(n)) return '鶏肉';
  if (/牛|ぎゅう|beef/.test(n)) return '牛肉';
  if (/合いびき|合挽|あいびき|ひきにく/.test(n)) return '合いびき肉';

  // 魚介
  if (/鮭|さけ|しゃけ/.test(n)) return '鮭';
  if (/ツナ|つな/.test(n)) return 'ツナ缶';

  // 野菜・その他
  if (/キャベツ/.test(n)) return 'キャベツ';
  if (/もやし/.test(n)) return 'もやし';
  if (/ねぎ|ネギ/.test(n) && !/玉ねぎ|たまねぎ/.test(n)) return 'ねぎ';
  if (/玉ねぎ|たまねぎ/.test(n)) return '玉ねぎ';
  if (/大根|だいこん/.test(n)) return '大根';
  if (/にら|ニラ/.test(n)) return 'ニラ';
  if (/ピーマン/.test(n)) return 'ピーマン';
  if (/きゅうり/.test(n)) return 'きゅうり';
  if (/卵|たまご/.test(n)) return '卵';
  if (/ご飯|ごはん/.test(n) || /米|こめ/.test(n)) return 'ご飯';
  if (/ソーセージ|ウインナー/.test(n)) return 'ソーセージ';
  if (/ベーコン/.test(n)) return 'ベーコン';
  if (/うどん/.test(n)) return '冷凍うどん';
  if (/パスタ|すぱげてい/.test(n)) return 'パスタ';
  if (/チーズ/.test(n)) return 'チーズ';
  if (/大葉/.test(n)) return '大葉';
  if (/マヨネーズ/.test(n)) return 'マヨネーズ'; // マヨネーズは調味料だが、レシピで主材料のように扱われることがあるため
  if (/味噌/.test(n)) return '味噌'; // 味噌は調味料だが、レシピで主材料のように扱われることがあるため

  return n || raw;
};

// =========================
// メインコンポーネント
// =========================
export default function QuickRecipesPage() {
  // 初期値を「レンジ」に設定
  const [selectedCategory, setSelectedCategory] = useState('レンジ'); 
  const [searchTerm, setSearchTerm] = useState('豚小間300g、鶏もも300g、キャベツ1個、もやし1袋、だいこん1本'); 
  const [servings, setServings] = useState(2);

  const [suggestionStarted, setSuggestionStarted] = useState(false);
  const [suggestedRecipes, setSuggestedRecipes] = useState<Recipe[]>([]);
  // 提案済みレシピのIDを記録する配列
  const [recipesTried, setRecipesTried] = useState<number[]>([]);

  const [modalData, setModalData] = useState<{ title: string; content: React.ReactNode } | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // モーダルを開く関数（メッセージ用とレシピ詳細用で共通化）
  const openModal = (title: string, content: React.ReactNode) => {
    setModalData({ title, content });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setModalData(null);
  };

  // ---- 検索語を配列化 ----
  const inputTerms = useMemo(() => {
    if (!searchTerm) return [] as string[];
    return searchTerm
      .split(/[,、\n]+|\/|\s+/)
      .map(s => s.trim())
      .filter(Boolean);
  }, [searchTerm]);

  // ==== 利用可能レシピ判定ロジック (常備品考慮済みAND検索) ====
  const matchedRecipes = useMemo(() => {
    let list = QUICK_RECIPES_DATA;

    // 1. カテゴリでフィルタリング (選択されたカテゴリーでフィルタリング)
    list = list.filter(r => r.category === selectedCategory);
    

    // 検索語が空の場合はカテゴリでフィルタリングされた全件を返す
    if (inputTerms.length === 0) return list;

    // 入力された材料を正規化
    const inputCanonicals = new Set(inputTerms.map(t => canonicalize(t)));

    const matches = list.filter(recipe => {
      // レシピの各材料についてチェック
      return recipe.ingredients.every(rawIng => {
        const canIng = canonicalize(rawIng);
        
        // 1. 入力に含まれているか？
        if (inputCanonicals.has(canIng)) return true;
        
        // 2. 常備品リストに含まれているか？ (常備品は正規化前の文字列またはカノニカル化された文字列でチェック)
        if (PANTRY_ITEMS.has(rawIng) || PANTRY_ITEMS.has(canIng)) return true;

        // 3. どちらでもなければ不足している材料とみなす
        return false;
      });
    });

    return matches;
  }, [selectedCategory, inputTerms]);

  // ==== レシピ提案ロジック (3件の確実な選出ロジックを強化) ====
  const suggestRecipes = (retry = false) => {
    const list = matchedRecipes;
    
    // retryがfalse（初回提案または条件リセット後の提案）の場合は履歴をリセット
    const currentRecipesTried = retry ? recipesTried : [];

    if (list.length === 0) {
      openModal(
        'お知らせ',
        '条件に一致するレシピがありません。\n（足りない主な材料があるようです。調味料は入力しなくて大丈夫です。）'
      );
      setSuggestionStarted(false);
      setSuggestedRecipes([]);
      setRecipesTried([]); // 念のためリセット
      return;
    }

    // 提案済みIDを除いたプール
    const pool = list.filter(r => !currentRecipesTried.includes(r.id));

    if (pool.length === 0) {
      openModal(
        'お知らせ',
        `条件に合う${list.length}件のレシピをすべて提案しました！\n条件を変えて再検索をお試しください。`
      );
      setSuggestionStarted(true); // 提案完了状態は維持
      return;
    }

    const picks: Recipe[] = [];
    // プールをシャッフルするためにコピー
    const copiedPool = [...pool];
    const newTriedIds = [...currentRecipesTried];

    // 選出する最大件数は3件。ただしプール数を超えない。
    const numToPick = Math.min(3, copiedPool.length);

    // 確実にnumToPick件ランダムに選出
    for (let i = 0; i < numToPick; i++) {
      // ランダムなインデックスを計算
      const j = Math.floor(Math.random() * copiedPool.length);
      // そのインデックスのレシピを選出し、プールから削除
      const r = copiedPool.splice(j, 1)[0];
      
      picks.push(r);
      // 提案リストに追加
      if (!newTriedIds.includes(r.id)) {
        newTriedIds.push(r.id);
      }
    }

    // Stateを更新
    setSuggestionStarted(true);
    setSuggestedRecipes(picks);
    setRecipesTried(newTriedIds);
  };

  const resetAll = () => {
    setSelectedCategory('レンジ'); // 初期値に戻す
    setSearchTerm('');
    setServings(2);
    setSuggestedRecipes([]);
    setRecipesTried([]);
    setSuggestionStarted(false);
  };

  const handleInputChange = (val: string) => {
    setSearchTerm(val);
    // 検索語が変わったら、提案モードをリセット
    setSuggestionStarted(false);
    setSuggestedRecipes([]);
    setRecipesTried([]); // 過去の提案履歴もリセット
  };

  const handleCategoryChange = (cat: string) => {
    setSelectedCategory(cat);
    // カテゴリが変わったら、提案モードをリセット
    setSuggestionStarted(false);
    setSuggestedRecipes([]);
    setRecipesTried([]); // 過去の提案履歴もリセット
    suggestRecipes(false); // カテゴリ変更後に即座に提案を実行
  };

  // レシピ詳細モーダルのコンテンツ
  const RecipeDetailContent = ({ recipe }: { recipe: Recipe }) => {
    // 現在の人数に基づいて材料の目安量を計算（表示はしないがコメントとして残す）
    // const multiplier = servings / 2;
    
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-4 p-3 bg-orange-50 rounded-lg border border-orange-200">
            <Clock className="w-6 h-6 text-orange-600" />
            <span className="font-semibold text-lg text-orange-700">調理時間: {recipe.time}分</span>
        </div>
        
        <h3 className="text-lg font-bold border-b pb-1 text-gray-700">必要な材料（{servings}人分）</h3>
        <ul className="list-disc list-inside space-y-1 ml-2 text-gray-700">
          {recipe.ingredients.map((ing, index) => (
            <li key={index} className="text-sm">
              {ing}
            </li>
          ))}
        </ul>
        <p className="text-sm text-red-600 bg-red-50 p-2 rounded-lg mt-2 font-bold">
            ※ 上記は2人分の材料例です。{servings}人分の目安量は、主材料をご自身の判断で調整してください。
        </p>
        

        <h3 className="text-lg font-bold border-b pb-1 text-gray-700 pt-3">作り方（手順）</h3>
        <ol className="list-decimal list-inside space-y-2 ml-2 text-gray-700">
          {recipe.steps.map((step, index) => (
            <li key={index} className="text-sm">
              {step}
            </li>
          ))}
        </ol>
      </div>
    );
  };

  const RecipeCard = ({ recipe }: { recipe: Recipe }) => (
    <div className="bg-white p-4 rounded-xl shadow-md border border-gray-100 animate-in slide-in-from-bottom-2 duration-300">
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-bold text-lg flex items-center gap-2">
          <ThumbsUp className="w-4 h-4 text-green-500" />
          {recipe.title}
        </h3>
        <span className="flex items-center text-sm font-semibold text-orange-600 bg-orange-50 px-2 py-1 rounded-full">
          <Clock className="w-4 h-4 mr-1" />
          {recipe.time}分
        </span>
      </div>
      <p className="text-sm text-gray-600 mb-2">{recipe.description}</p>
      <div className="flex flex-wrap gap-1 mb-3">
        {recipe.ingredients.map(i => (
            <span key={i} className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">
              {i}
            </span>
          )
        )}
      </div>

      <button
        onClick={() => openModal(recipe.title, <RecipeDetailContent recipe={recipe} />)}
        className="bg-orange-500 hover:bg-orange-600 w-full py-2 text-white rounded-lg font-bold mt-2 transition-colors shadow-md active:scale-[0.98]"
      >
        この料理に決定！
      </button>
    </div>
  );

  // 残り提案件数
  const remainingRecipesCount = matchedRecipes.length - recipesTried.length;

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-800">
      <header className="bg-white p-4 shadow sticky top-0 z-20">
        <div className="flex items-center gap-3 max-w-xl mx-auto">
          <button
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            aria-label="戻る"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <h1 className="text-xl font-bold flex items-center gap-2 text-gray-800">
            <Zap className="w-6 h-6 text-orange-500" />
            10分で完成！時短レシピAI
          </h1>
        </div>
      </header>

      <main className="max-w-xl mx-auto p-4 pb-20">
        <section className="bg-white p-5 rounded-xl shadow-lg mb-6 transition-all duration-300">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2 border-b pb-2 text-gray-700">
            <Search className="w-5 h-5 text-orange-500" /> 献立の条件を入力
          </h2>

          <label className="text-sm font-medium flex items-center gap-1 mb-1 text-gray-600">
            <Utensils className="w-4 h-4 text-green-600" /> 冷蔵庫にある主な材料
          </label>
          <input
            value={searchTerm}
            onChange={e => handleInputChange(e.target.value)}
            placeholder="例：豚小間、鶏もも、キャベツ、もやし、大根"
            className="w-full p-3 border border-gray-300 rounded-lg mb-4 focus:ring-2 focus:ring-orange-200 focus:border-orange-500 outline-none transition-all"
          />

          <label className="text-sm font-medium flex items-center gap-1 mb-1 text-gray-600">
            <Users className="w-4 h-4 text-green-600" /> 人数
          </label>
          <input
            type="number"
            value={servings}
            min={1}
            max={10}
            onChange={e => setServings(Number(e.target.value))}
            className="w-full p-3 border border-gray-300 rounded-lg mb-4 focus:ring-2 focus:ring-orange-200 focus:border-orange-500 outline-none transition-all"
          />

          <div className="flex flex-wrap gap-2 mb-3">
            {CATEGORY_TABS.map(t => (
              <button
                key={t.name}
                onClick={() => handleCategoryChange(t.name)}
                className={`px-4 py-2 rounded-full border text-sm flex items-center gap-1 transition-all active:scale-95 ${
                  selectedCategory === t.name
                    ? 'bg-orange-500 text-white border-orange-600 font-bold'
                    : 'bg-white text-gray-600 border-gray-200 hover:bg-orange-50'
                }`}
              >
                <t.icon className="w-4 h-4" />
                {t.name}
              </button>
            ))}
          </div>

          <div className="text-right text-xs text-gray-500 font-bold">
            現在の条件でヒット: {matchedRecipes.length}件
          </div>
        </section>

        {!suggestionStarted && (
          <button
            onClick={() => suggestRecipes(false)}
            // ヒット数が0件の場合はボタンを無効化
            disabled={matchedRecipes.length === 0} 
            className={`font-bold py-4 w-full rounded-xl text-lg shadow-lg transform transition-all active:scale-[0.98] ${
                matchedRecipes.length === 0 
                ? 'bg-gray-400 text-gray-200 cursor-not-allowed' 
                : 'bg-gradient-to-r from-orange-500 to-orange-600 text-white hover:shadow-orange-200'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <Zap className="w-6 h-6 fill-current" /> 時短料理を3つ提案する
            </div>
          </button>
        )}

        {suggestionStarted && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 mt-6">
            <div className="flex items-center justify-between border-b pb-2">
              <h2 className="text-xl font-bold flex items-center gap-2 text-gray-800">
                <Clock className="w-6 h-6 text-orange-500" />
                おすすめレシピ ({suggestedRecipes.length}件)
              </h2>
            </div>

            <div className="space-y-4">
              {suggestedRecipes.map(r => (
                <RecipeCard key={r.id} recipe={r} />
              ))}
            </div>

            <div className="pt-4 space-y-3">
              <button
                onClick={() => suggestRecipes(true)}
                className={`bg-blue-500 hover:bg-blue-600 text-white w-full py-3 rounded-lg font-bold shadow-md transition-colors ${
                    remainingRecipesCount > 0 ? '' : 'bg-gray-400 hover:bg-gray-400 cursor-not-allowed'
                }`}
                disabled={remainingRecipesCount === 0}
              >
                別のレシピを見る ({remainingRecipesCount}件残り)
              </button>

              <button
                onClick={resetAll}
                className="bg-white border border-gray-300 w-full py-3 rounded-lg font-bold text-gray-600 hover:bg-gray-50 transition-colors"
              >
                条件を変えて再検索
              </button>
            </div>
          </div>
        )}
      </main>

      {/* modalDataが存在する場合のみCustomModalを表示 */}
      {isModalOpen && modalData && (
        <CustomModal
          isOpen={isModalOpen}
          title={modalData.title}
          content={modalData.content}
          onClose={closeModal}
        />
      )}
    </div>
  );
}



