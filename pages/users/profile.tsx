// pages/users/profile.tsx
import { GetServerSideProps, NextPage } from 'next';
import Head from 'next/head';
import { useState, useEffect } from 'react';
import { adminDb, adminAuth } from '@/lib/firebase-admin';
import nookies from 'nookies';
import { db, auth } from '@/lib/firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { useRouter } from 'next/router';
import { onAuthStateChanged, User } from 'firebase/auth';
import { RiAddLine, RiDeleteBinLine, RiSearchEyeLine, RiUserStarLine, RiLightbulbFlashLine, RiBuildingLine, RiArrowLeftLine, RiAwardLine } from 'react-icons/ri';
import { v4 as uuidv4 } from 'uuid';
import { Loader2 } from 'lucide-react';

// --- 型定義 ---
interface WorkExperience {
  id: string;
  companyName: string;
  role: string;
  startDate: string;
  endDate: string;
  description: string;
}

interface Profile {
  name: string;
  age: string;
  gender: string;
  finalEducation: string;
  workHistory: WorkExperience[];
  skills: string;
  selfPR: string;
  topPriorities: string[];
  desiredJobTypes: string[]; 
  desiredEmploymentTypes: string[]; 
  // ★★★ 給与・勤務時間項目を再設計 ★★★
  desiredSalaryType: 'annual' | 'monthly' | 'hourly';
  desiredSalaryAmount: string;
  desiredWorkingHours: string;
  // ★★★ ここまで ★★★
  desiredRemoteLevel: 'full' | 'hybrid' | 'no'; 
  desiredLocation: string;
  desiredAtmosphere: string[];
  desiredGrowthOpportunities: string[]; 
  desiredWLBFeatures: string[]; 
  desiredBenefits: string[]; 
  desiredOrganization: string[];
}

interface ProfilePageProps {
  profile: Profile | null;
  uid: string;
}

// --- サーバーサイド処理 ---
export const getServerSideProps: GetServerSideProps = async (context) => {
  try {
    const cookies = nookies.get(context);
    const token = await adminAuth.verifySessionCookie(cookies.session || '', true);
    const { uid } = token;
    const userDoc = await adminDb.collection('users').doc(uid).get();
    const profileData = userDoc.exists ? userDoc.data() : null;
    const profile: Profile | null = profileData ? {
      name: profileData.name || '',
      age: profileData.age || '',
      gender: profileData.gender || '',
      finalEducation: profileData.finalEducation || '',
      workHistory: profileData.workHistory || [],
      skills: profileData.skills || '',
      selfPR: profileData.selfPR || '',
      topPriorities: profileData.topPriorities || [],
      desiredJobTypes: profileData.desiredJobTypes || [],
      desiredEmploymentTypes: profileData.desiredEmploymentTypes || [],
      desiredSalaryType: profileData.desiredSalaryType || 'annual',
      desiredSalaryAmount: profileData.desiredSalaryAmount || '',
      desiredWorkingHours: profileData.desiredWorkingHours || '',
      desiredRemoteLevel: profileData.desiredRemoteLevel || 'no',
      desiredLocation: profileData.desiredLocation || '',
      desiredAtmosphere: profileData.desiredAtmosphere || [],
      desiredGrowthOpportunities: profileData.desiredGrowthOpportunities || [],
      desiredWLBFeatures: profileData.desiredWLBFeatures || [],
      desiredBenefits: profileData.desiredBenefits || [],
      desiredOrganization: profileData.desiredOrganization || [],
    } : null;
    return { props: { profile, uid } };
  } catch (error) {
    return { redirect: { destination: '/users/login', permanent: false } };
  }
};

// --- 選択肢データ (企業側と完全に一致) ---
const priorityOptions = [ { id: 'salary', label: '給与・待遇' }, { id: 'location', label: '勤務地・働き方' }, { id: 'jobType', label: '仕事内容' }, { id: 'growth', label: 'キャリア・成長' }, { id: 'wlb', label: 'ワークライフバランス' }, { id: 'atmosphere', label: '職場の雰囲気' }, { id: 'organization', label: '組織文化' } ];
const atmosphereOptions = ["フラットな社風", "チームワーク重視", "個人主義", "成果主義", "挑戦を歓迎する", "落ち着いた雰囲気", "スピード感がある", "オープンなコミュニケーション", "若手が活躍", "ベテランが活躍", "男女問わず活躍", "多国籍チーム", "リモート中心", "オフィス出社中心", "カジュアルな雰囲気", "フォーマルな雰囲気"];
const growthOptions = ["OJT（実務を通じた教育制度）", "メンター制度（先輩社員によるサポート）", "定期的な社内研修あり", "社外研修・セミナー参加支援あり", "資格取得支援制度あり", "書籍・教材購入補助あり", "AI・DX関連の研修あり", "海外研修・グローバル教育あり", "キャリア面談制度あり", "評価・昇進が明確（スキルや成果で評価）", "社内表彰・インセンティブ制度あり", "他部署への異動・チャレンジを歓迎", "社員の挑戦を応援する文化", "失敗を許容する文化（トライ＆エラーを奨励）", "社内勉強会・ナレッジシェア会あり", "社外講師や専門家を招いた学習機会あり"];
const wlbOptions = ["フルリモート勤務可", "一部リモート勤務可（ハイブリッドワーク）", "フレックスタイム制あり", "残業少なめ（月20時間以内）", "完全週休2日制", "年間休日120日以上", "有給休暇取得率が高い", "産休・育休取得実績あり", "時短勤務制度あり", "介護・看護休暇あり", "副業・兼業OK", "私服勤務OK", "勤務地選択可（地方・在宅勤務など）", "長期休暇制度あり（リフレッシュ・サバティカルなど）", "定時退社を推奨", "家庭・育児と両立しやすい環境"];
const benefitsOptions = ["社会保険完備", "通勤手当・交通費支給", "在宅勤務手当あり", "家賃補助・住宅手当あり", "家族手当あり", "賞与・ボーナスあり", "成果連動インセンティブあり", "ストックオプション制度あり", "健康診断・人間ドック補助あり", "福利厚生サービス（例：リロクラブ、ベネフィットステーション等）加入", "食事補助・社員食堂あり", "書籍・ツール購入補助あり", "PC・デバイス支給（業務用）", "勤続表彰・特別休暇あり", "社員旅行・懇親イベントあり", "社内カフェ・フリードリンクあり", "資格手当・成果手当あり", "退職金制度あり", "定年後再雇用制度あり"];
const organizationOptions = ["サステナビリティ・社会貢献を重視", "地域密着型の事業を展開", "スタートアップ・ベンチャー志向", "安定成長志向", "社会課題解決をテーマにしている", "AI・デジタル技術を積極活用", "顧客満足より「顧客成功」を重視", "働く人の多様性・個性を尊重", "社長・経営層と距離が近い", "オープンで透明性のある経営"];
const jobTypeOptions = ["営業・企画・マーケティング", "事務・管理", "販売・接客・サービス", "飲食・フード", "IT・エンジニア", "クリエイティブ（デザイン・Webなど）", "製造・軽作業・工場", "建築・土木・設備", "配送・ドライバー", "医療・福祉・保育", "教育・講師", "専門職（士業・金融など）", "その他"];
const employmentTypeOptions = ["正社員", "契約社員", "アルバイト・パート", "業務委託"];

const UserProfilePage: NextPage<ProfilePageProps> = ({ profile, uid }) => {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [formData, setFormData] = useState<Profile>(profile || {
    name: '', age: '', gender: '', finalEducation: '', workHistory: [], skills: '', selfPR: '',
    topPriorities: [],
    desiredJobTypes: [], desiredEmploymentTypes: [], 
    desiredSalaryType: 'annual', desiredSalaryAmount: '', desiredWorkingHours: '',
    desiredRemoteLevel: 'no', desiredLocation: '',
    desiredAtmosphere: [], desiredGrowthOpportunities: [], desiredWLBFeatures: [], desiredBenefits: [], desiredOrganization: [],
  });
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  
  useEffect(() => {
    onAuthStateChanged(auth, (currentUser) => {
      if(!currentUser || currentUser.uid !== uid) router.push('/users/login');
      else setUser(currentUser);
    });
  }, [router, uid]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleCheckboxChange = (field: keyof Profile, value: string) => {
    setFormData(prev => {
      const currentValues = prev[field] as string[];
      if (!Array.isArray(currentValues)) return prev;
      const newValues = currentValues.includes(value) ? currentValues.filter(item => item !== value) : [...currentValues, value];
      return { ...prev, [field]: newValues };
    });
  };
  
  const handlePriorityChange = (value: string) => {
    setFormData(prev => {
        const currentPriorities = prev.topPriorities;
        const newPriorities = currentPriorities.includes(value) ? currentPriorities.filter(item => item !== value) : [...currentPriorities, value];
        if (newPriorities.length > 3) newPriorities.shift();
        return { ...prev, topPriorities: newPriorities };
    });
  };
  
  const addWorkHistory = () => setFormData(prev => ({ ...prev, workHistory: [...prev.workHistory, { id: uuidv4(), companyName: '', role: '', startDate: '', endDate: '', description: '' }] }));
  const handleWorkHistoryChange = (id: string, field: keyof WorkExperience, value: string) => setFormData(prev => ({ ...prev, workHistory: prev.workHistory.map(wh => wh.id === id ? { ...wh, [field]: value } : wh) }));
  const removeWorkHistory = (id: string) => setFormData(prev => ({ ...prev, workHistory: prev.workHistory.filter(wh => wh.id !== id) }));

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsLoading(true);
    setMessage(null);
    try {
      await setDoc(doc(db, 'users', user.uid), { ...formData, updatedAt: serverTimestamp() }, { merge: true });
      setMessage({ type: 'success', text: 'プロフィールを保存しました。AIがあなたに最適な求人を探します。' });
      window.scrollTo(0, 0);
    } catch (err) {
      setMessage({ type: 'error', text: 'プロフィールの保存に失敗しました。' });
    } finally {
      setIsLoading(false);
    }
  };
  
  if (!user) return <div className="flex h-screen items-center justify-center">読み込み中...</div>;

  return (
    <div className="min-h-screen bg-gray-100">
      <Head><title>AIマッチング用 プロフィール登録</title></Head>
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">AIマッチング用 プロフィール</h1>
            <button onClick={() => router.push('/users/dashboard')} className="flex items-center text-sm text-blue-600 hover:underline"><RiArrowLeftLine className="mr-1"/>マイページに戻る</button>
        </div>
      </header>
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleSave} className="bg-white p-8 rounded-lg shadow-md space-y-12">
          {message && <div className={`p-4 rounded-md mb-8 ${message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{message.text}</div>}
          
          <div className="bg-blue-50 p-5 rounded-lg border border-blue-200 space-y-2">
              <h3 className="font-bold text-lg text-blue-800 flex items-center"><RiLightbulbFlashLine className="mr-2"/>AIがあなたの「魂」を理解します</h3>
              <p className="text-sm text-gray-700">あなたが仕事に求める「譲れない想い」をAIに教えてください。入力が詳細であるほど、AIはあなたの右腕となり、心から働きたいと思える企業との運命的な出会いを引き寄せます。</p>
          </div>

          <section className="space-y-6">
            <h2 className="text-xl font-semibold border-b pb-2 text-gray-800 flex items-center"><RiUserStarLine className="mr-2 text-gray-500"/>基本情報</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div><label htmlFor="name" className="block text-sm font-medium text-gray-700">氏名 *</label><input type="text" id="name" name="name" value={formData.name} onChange={handleChange} required className="mt-1 block w-full input"/></div>
                <div><label htmlFor="age" className="block text-sm font-medium text-gray-700">年齢</label><input type="number" id="age" name="age" value={formData.age} onChange={handleChange} className="mt-1 block w-full input"/></div>
                <div><label htmlFor="gender" className="block text-sm font-medium text-gray-700">性別</label><select id="gender" name="gender" value={formData.gender} onChange={handleChange} className="mt-1 block w-full input"><option value="">選択しない</option><option>男性</option><option>女性</option><option>その他</option></select></div>
                <div><label htmlFor="finalEducation" className="block text-sm font-medium text-gray-700">最終学歴</label><input type="text" id="finalEducation" name="finalEducation" value={formData.finalEducation} onChange={handleChange} className="mt-1 block w-full input"/></div>
            </div>
          </section>

          {/* ★★★ 新設：希望給与・勤務時間の専用セクション ★★★ */}
          <section className="space-y-6">
            <h2 className="text-xl font-semibold border-b pb-2 text-gray-800">希望給与・勤務スタイル</h2>
            <div className="p-5 border rounded-lg bg-yellow-50 border-yellow-300 grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
                <div>
                    <label htmlFor="desiredSalaryType" className="block text-sm font-medium text-gray-700">希望給与 *</label>
                    <select id="desiredSalaryType" name="desiredSalaryType" value={formData.desiredSalaryType} onChange={handleChange} className="mt-1 block w-full input">
                        <option value="annual">年収</option>
                        <option value="monthly">月給</option>
                        <option value="hourly">時給</option>
                    </select>
                </div>
                <div className="flex items-center">
                    <input type="number" id="desiredSalaryAmount" name="desiredSalaryAmount" value={formData.desiredSalaryAmount} onChange={handleChange} required className="mt-1 block w-full input" placeholder="例: 300"/>
                    <span className="ml-2 font-semibold text-gray-700">{formData.desiredSalaryType === 'hourly' ? '円' : '万円'}</span>
                </div>
            </div>
            <div>
                <label htmlFor="desiredWorkingHours" className="block text-sm font-medium text-gray-700">希望の勤務時間・曜日など</label>
                <textarea id="desiredWorkingHours" name="desiredWorkingHours" value={formData.desiredWorkingHours} onChange={handleChange} rows={3} className="mt-1 block w-full input" placeholder="例：・平日の9時〜15時まで&#10;・週3日勤務希望&#10;・土日祝休み希望"></textarea>
            </div>
          </section>

          <section className="space-y-8">
            <h2 className="text-xl font-semibold border-b pb-2 text-gray-800 flex items-center"><RiSearchEyeLine className="mr-2 text-gray-500"/>あなたの「働く」の希望を教えてください</h2>
            
            <div className="p-5 border-2 rounded-lg bg-white border-amber-400">
                <h3 className="text-lg font-bold text-gray-800 flex items-center"><RiAwardLine className="mr-2 text-amber-500"/>あなたのTOP3のこだわりは？ (3つまで選択)</h3>
                <p className="text-xs text-gray-600 mb-4">AIが特に重視して、あなたに合う企業を探します。</p>
                <div className="mt-2 grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">{priorityOptions.map(opt => (<label key={opt.id} className={`flex items-center space-x-2 p-3 rounded-lg border-2 transition-all ${formData.topPriorities.includes(opt.id) ? 'bg-amber-100 border-amber-400 font-bold' : 'bg-gray-50 border-gray-200'}`}><input type="checkbox" value={opt.id} checked={formData.topPriorities.includes(opt.id)} onChange={() => handlePriorityChange(opt.id)} className="checkbox" /><span>{opt.label}</span></label>))}</div>
            </div>
            
            <div className="p-5 border rounded-lg">
                <h3 className="text-lg font-bold text-gray-800">仕事内容・働き方</h3>
                <div className="mt-4 space-y-6">
                    <div><label className="block text-sm font-medium text-gray-700">希望職種（複数選択可）</label><div className="mt-2 grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">{jobTypeOptions.map(opt => (<label key={opt} className="flex items-center space-x-2"><input type="checkbox" value={opt} checked={formData.desiredJobTypes.includes(opt)} onChange={() => handleCheckboxChange('desiredJobTypes', opt)} className="checkbox" /><span>{opt}</span></label>))}</div></div>
                    <div><label className="block text-sm font-medium text-gray-700">希望雇用形態（複数選択可）</label><div className="mt-2 grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">{employmentTypeOptions.map(opt => (<label key={opt} className="flex items-center space-x-2"><input type="checkbox" value={opt} checked={formData.desiredEmploymentTypes.includes(opt)} onChange={() => handleCheckboxChange('desiredEmploymentTypes', opt)} className="checkbox" /><span>{opt}</span></label>))}</div></div>
                    <div><label htmlFor="desiredRemoteLevel" className="block text-sm font-medium text-gray-700">リモートワーク希望レベル</label><select id="desiredRemoteLevel" name="desiredRemoteLevel" value={formData.desiredRemoteLevel} onChange={handleChange} className="mt-1 block w-full input"><option value="no">出社希望</option><option value="hybrid">ハイブリッド希望</option><option value="full">フルリモート希望</option></select></div>
                </div>
            </div>
            
            <div className="p-5 border rounded-lg space-y-6">
                 <h3 className="text-lg font-bold text-gray-800">その他のこだわり</h3>
                 <p className="text-sm text-gray-500 -mt-6">（複数選択可）</p>
                 <div><label className="block text-sm font-medium text-gray-700">🏢 ① 職場の雰囲気</label><div className="mt-2 grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">{atmosphereOptions.map(opt => (<label key={opt} className="flex items-center space-x-2"><input type="checkbox" value={opt} checked={formData.desiredAtmosphere.includes(opt)} onChange={() => handleCheckboxChange('desiredAtmosphere', opt)} className="checkbox" /><span>{opt}</span></label>))}</div></div>
                 <div><label className="block text-sm font-medium text-gray-700">🚀 ② 成長機会</label><div className="mt-2 grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">{growthOptions.map(opt => (<label key={opt} className="flex items-center space-x-2"><input type="checkbox" value={opt} checked={formData.desiredGrowthOpportunities.includes(opt)} onChange={() => handleCheckboxChange('desiredGrowthOpportunities', opt)} className="checkbox" /><span>{opt}</span></label>))}</div></div>
                 <div><label className="block text-sm font-medium text-gray-700">🕰️ ③ ワークライフバランス</label><div className="mt-2 grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">{wlbOptions.map(opt => (<label key={opt} className="flex items-center space-x-2"><input type="checkbox" value={opt} checked={formData.desiredWLBFeatures.includes(opt)} onChange={() => handleCheckboxChange('desiredWLBFeatures', opt)} className="checkbox" /><span>{opt}</span></label>))}</div></div>
                 <div><label className="block text-sm font-medium text-gray-700">💰 ④ 福利厚生・手当</label><div className="mt-2 grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">{benefitsOptions.map(opt => (<label key={opt} className="flex items-center space-x-2"><input type="checkbox" value={opt} checked={formData.desiredBenefits.includes(opt)} onChange={() => handleCheckboxChange('desiredBenefits', opt)} className="checkbox" /><span>{opt}</span></label>))}</div></div>
                 <div><label className="block text-sm font-medium text-gray-700">🌍 ⑤ 組織文化・価値観</label><div className="mt-2 grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">{organizationOptions.map(opt => (<label key={opt} className="flex items-center space-x-2"><input type="checkbox" value={opt} checked={formData.desiredOrganization.includes(opt)} onChange={() => handleCheckboxChange('desiredOrganization', opt)} className="checkbox" /><span>{opt}</span></label>))}</div></div>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold border-b pb-2 text-gray-800 flex items-center"><RiBuildingLine className="mr-2 text-gray-500"/>職務経歴・スキル</h2>
            {formData.workHistory.map((wh) => (
              <div key={wh.id} className="p-4 border rounded-md space-y-4 relative bg-gray-50">
                <button type="button" onClick={() => removeWorkHistory(wh.id)} className="absolute top-2 right-2 text-red-500 hover:text-red-700"><RiDeleteBinLine size={20}/></button>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div><label className="block text-xs font-medium text-gray-600">会社名</label><input type="text" value={wh.companyName} onChange={e => handleWorkHistoryChange(wh.id, 'companyName', e.target.value)} className="w-full input"/></div>
                  <div><label className="block text-xs font-medium text-gray-600">役職・職種</label><input type="text" value={wh.role} onChange={e => handleWorkHistoryChange(wh.id, 'role', e.target.value)} className="w-full input"/></div>
                  <div><label className="block text-xs font-medium text-gray-600">開始年月</label><input type="month" value={wh.startDate} onChange={e => handleWorkHistoryChange(wh.id, 'startDate', e.target.value)} className="w-full input"/></div>
                  <div><label className="block text-xs font-medium text-gray-600">終了年月</label><input type="month" value={wh.endDate} onChange={e => handleWorkHistoryChange(wh.id, 'endDate', e.target.value)} className="w-full input"/></div>
                </div>
                <div><label className="block text-xs font-medium text-gray-600">業務内容</label><textarea value={wh.description} onChange={e => handleWorkHistoryChange(wh.id, 'description', e.target.value)} rows={3} className="w-full input"></textarea></div>
              </div>
            ))}
            <button type="button" onClick={addWorkHistory} className="flex items-center text-sm text-blue-600 hover:underline"><RiAddLine className="mr-1"/>職務経歴を追加</button>
            <div className="pt-4">
                <label htmlFor="skills" className="block text-sm font-medium text-gray-700">スキル・資格</label>
                <textarea id="skills" name="skills" value={formData.skills} onChange={handleChange} rows={4} className="mt-1 block w-full input" placeholder="例：・普通自動車第一種運転免許&#10;・TOEIC 800点&#10;・Word, Excel, PowerPoint"></textarea>
            </div>
            <div>
                <label htmlFor="selfPR" className="block text-sm font-medium text-gray-700">自己PR</label>
                <textarea id="selfPR" name="selfPR" value={formData.selfPR} onChange={handleChange} rows={6} className="mt-1 block w-full input"></textarea>
            </div>
          </section>
          
          <div className="flex justify-end pt-6 border-t">
            <button type="submit" disabled={isLoading} className="w-full md:w-auto px-8 py-3 bg-indigo-600 text-white font-bold rounded-md hover:bg-indigo-700 disabled:bg-gray-400 flex items-center justify-center">
              {isLoading ? <><Loader2 className="animate-spin mr-2"/>保存中...</> : 'AIに希望を伝えて保存する'}
            </button>
          </div>
        </form>
      </main>
      <style jsx>{`
        .input { @apply block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500; }
        .checkbox { @apply h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500; }
      `}</style>
    </div>
  );
};

export default UserProfilePage;