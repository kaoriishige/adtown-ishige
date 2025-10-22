// pages/users/profile.tsx
import Head from 'next/head';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { getAuth, onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import {
  RiSaveLine,
  RiUserLine,
  RiHeartPulseLine,
  RiFileList3Line,
  RiArrowRightLine,
  RiArrowLeftLine,
  RiMoneyDollarCircleLine,
  RiMapPinLine,
} from 'react-icons/ri';
import { Loader2 } from 'lucide-react';

// --- 企業プロフィールと連動するマッチング要素 ---
const desiredJobTypes = [
  '営業・企画・マーケティング',
  '事務・管理',
  '販売・接客・サービス',
  '飲食・フード',
  '旅館・ホテル',
  'AI・IT・エンジニア',
  '製造・軽作業・工場',
  '医療・福祉',
  'その他',
];
const growthOptions = [
  'OJT（実務を通じた教育制度）',
  'メンター制度（先輩社員によるサポート）',
  '定期的な社内研修あり',
  '社外研修・セミナー参加支援あり',
  '資格取得支援制度あり',
  '書籍・教材購入補助あり',
  'AI・DX関連の研修あり',
  '海外研修・グローバル教育あり',
  'キャリア面談制度あり',
  '評価・昇進が明確（スキルや成果で評価）',
  '社内表彰・インセンティブ制度あり',
  '他部署への異動・チャレンジを歓迎',
  '社員の挑戦を応援する文化',
  '失敗を許容する文化（トライ＆エラーを奨励）',
  '社内勉強会・ナレッジシェア会あり',
  '社外講師や専門家を招いた学習機会あり',
];
const wlbOptions = [
  'フルリモート勤務可',
  '一部リモート勤務可（ハイブリッドワーク）',
  'フレックスタイム制あり',
  '残業少なめ（月20時間以内）',
  '完全週休2日制',
  '年間休日120日以上',
  '有給休暇取得率が高い',
  '産休・育休取得実績あり',
  '時短勤務制度あり',
  '介護・看護休暇あり',
  '副業・兼業OK',
  '私服勤務OK',
  '勤務地選択可（地方・在宅勤務など）',
  '長期休暇制度あり（リフレッシュ・サバティカルなど）',
  '定時退社を推奨',
  '家庭・育児と両立しやすい環境',
];
const benefitsOptions = [
  '社会保険完備',
  '通勤手当・交通費支給',
  '在宅勤務手当あり',
  '家賃補助・住宅手当あり',
  '家族手当あり',
  '賞与・ボーナスあり',
  '成果連動インセンティブあり',
  'ストックオプション制度あり',
  '健康診断・人間ドック補助あり',
  '福利厚生サービス加入',
  '食事補助・社員食堂あり',
  '書籍・ツール購入補助あり',
  'PC・デバイス支給（業務用）',
  '勤続表彰・特別休暇あり',
  '社員旅行・懇親イベントあり',
  '社内カフェ・フリードリンクあり',
  '資格手当・成果手当あり',
  '退職金制度あり',
  '定年後再雇用制度あり',
  '制服貸与',
];
const atmosphereOptions = [
  'フラットな社風',
  'チームワーク重視',
  '個人主義',
  '成果主義',
  '挑戦を歓迎する',
  '落ち着いた雰囲気',
  'スピード感がある',
  'オープンなコミュニケーション',
  '若手が活躍',
  'ベテランが活躍',
  '男女問わず活躍',
  '多国籍チーム',
  'リモート中心',
  'オフィス出社中心',
  'カジュアルな雰囲気',
  'フォーマルな雰囲気',
];
const organizationOptions = [
  'サステナビリティ・社会貢献を重視',
  '地域密着型の事業を展開',
  'スタートアップ・ベンチャー志向',
  '安定成長志向',
  '社会課題解決をテーマにしている',
  'AI・デジタル技術を積極活用',
  '顧客満足より「顧客成功」を重視',
  '働く人の多様性・個性を尊重',
  '社長・経営層と距離が近い',
  'オープンで透明性のある経営',
];

// --- 型定義 ---
interface UserProfile {
  name: string;
  age: number | '';
  email: string;
  phoneNumber: string;
  currentJobTitle: string;
  skills: string;
  workHistorySummary: string;
  desiredJobTypes: string[];
  desiredSalaryMin: number | '';
  desiredSalaryMax: number | '';
  desiredLocation: string;
  matchingValues: {
    growth: string[];
    wlb: string[];
    benefits: string[];
    atmosphere: string[];
    organization: string[];
  };
}

const UserProfilePage = () => {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState(1);

  const [formData, setFormData] = useState<UserProfile>({
    name: '',
    age: '',
    email: '',
    phoneNumber: '',
    currentJobTitle: '',
    skills: '',
    workHistorySummary: '',
    desiredJobTypes: [],
    desiredSalaryMin: '',
    desiredSalaryMax: '',
    desiredLocation: '',
    matchingValues: {
      growth: [],
      wlb: [],
      benefits: [],
      atmosphere: [],
      organization: [],
    },
  });

  // --- Firebase認証監視 ---
  useEffect(() => {
    if (!router.isReady) return;
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        setFormData((prev) => ({
          ...prev,
          email: currentUser.email || '',
        }));
        loadUserProfile(currentUser.uid);
      } else {
        router.push('/users/login');
      }
    });
    return () => unsubscribe();
  }, [router.isReady]);

  // --- Firestore 読み込み ---
  const loadUserProfile = async (uid: string) => {
    setLoading(true);
    try {
      const userRef = doc(db, 'userProfiles', uid);
      const snap = await getDoc(userRef);
      if (snap.exists()) {
        setFormData((prev) => ({
          ...prev,
          ...snap.data(),
        }));
      }
    } catch (e) {
      console.error('Firestore読み込みエラー:', e);
      setError('データの読み込みに失敗しました。');
    }
    setLoading(false);
  };

  // --- 入力変更 ---
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    if (['age', 'desiredSalaryMin', 'desiredSalaryMax'].includes(name)) {
      setFormData((prev) => ({
        ...prev,
        [name]: value === '' ? '' : Number(value),
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  // --- チェックボックス ---
  const handleValueCheckboxChange = (
    category: keyof UserProfile['matchingValues'],
    value: string
  ) => {
    setFormData((prev) => {
      const currentValues = prev.matchingValues[category];
      const newValues = currentValues.includes(value)
        ? currentValues.filter((v) => v !== value)
        : [...currentValues, value];
      return {
        ...prev,
        matchingValues: { ...prev.matchingValues, [category]: newValues },
      };
    });
  };

  // --- 職種選択 ---
  const handleJobTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedOptions = Array.from(e.target.selectedOptions).map(
      (o) => o.value
    );
    setFormData((prev) => ({ ...prev, desiredJobTypes: selectedOptions }));
  };

  // --- 保存処理 ---
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    setError(null);
    try {
      const userRef = doc(db, 'userProfiles', user.uid);
      await setDoc(
        userRef,
        { ...formData, updatedAt: serverTimestamp() },
        { merge: true }
      );
      alert('✅ プロフィールを保存しました。');
      await router.push('/users/dashboard');
    } catch (err: any) {
      setError(`保存中にエラーが発生しました: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  // --- ローディング中 ---
  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen text-gray-600">
        <Loader2 className="animate-spin w-6 h-6 mr-2" /> 読み込み中...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Head>
        <title>求職者プロフィール編集</title>
      </Head>

      <header className="bg-white shadow-sm sticky top-0 z-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <button
            onClick={() => router.push('/users/dashboard')}
            className="flex items-center text-sm text-gray-600 hover:text-gray-900 font-semibold"
          >
            <RiArrowLeftLine className="w-4 h-4 mr-2" /> ダッシュボードに戻る
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">
          あなたのプロフィール編集
        </h1>
        <p className="text-sm text-gray-600 mb-8">
          以下の2ステップで情報を入力してください。
          <strong>特に「マッチング価値観」はAIの精度に直結します。</strong>
        </p>

        {error && (
          <div className="p-4 mb-4 bg-red-100 text-red-700 rounded-md">
            {error}
          </div>
        )}

        <form
          onSubmit={handleSave}
          className="bg-white p-8 rounded-lg shadow-xl space-y-6"
        >
          {step === 1 ? (
            <>
              {/* --- 基本情報 --- */}
              <section className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-900 border-b pb-3 flex items-center">
                  <RiUserLine className="w-6 h-6 mr-3 text-indigo-500" />
                  ステップ 1/2: 基本情報・スキル（履歴書相当）
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="text-sm font-medium">氏名 *</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      className="w-full border rounded-md px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">年齢 *</label>
                    <input
                      type="number"
                      name="age"
                      value={formData.age}
                      onChange={handleChange}
                      required
                      className="w-full border rounded-md px-3 py-2"
                    />
                  </div>
                </div>
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    disabled={!formData.name || !formData.age}
                    className="px-6 py-3 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:bg-gray-400 flex items-center"
                  >
                    次へ（マッチング価値観）
                    <RiArrowRightLine className="ml-2" />
                  </button>
                </div>
              </section>
            </>
          ) : (
            <>
              {/* --- マッチング価値観 --- */}
              <section className="space-y-8">
                <h2 className="text-2xl font-bold text-gray-900 border-b pb-3 flex items-center">
                  <RiHeartPulseLine className="w-6 h-6 mr-3 text-red-500" />
                  ステップ 2/2: マッチング価値観
                </h2>
                <div className="flex justify-between pt-4 border-t">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="px-4 py-2 text-gray-600 font-bold rounded-md hover:bg-gray-100 flex items-center"
                  >
                    <RiArrowLeftLine className="mr-2" /> 戻る
                  </button>
                  <button
                    type="submit"
                    disabled={saving || formData.desiredJobTypes.length === 0}
                    className="px-6 py-3 bg-green-600 text-white font-bold rounded-md hover:bg-green-700 disabled:bg-gray-400 flex items-center"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="animate-spin mr-2" />
                        保存中...
                      </>
                    ) : (
                      <>
                        <RiSaveLine className="w-4 h-4 mr-2" />
                        プロフィールを保存
                      </>
                    )}
                  </button>
                </div>
              </section>
            </>
          )}
        </form>
      </main>
    </div>
  );
};

export default UserProfilePage;

