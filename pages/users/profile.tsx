import { GetServerSideProps, NextPage } from 'next';
import Head from 'next/head';
import { useState, useEffect } from 'react';
import { adminDb, adminAuth } from '@/lib/firebase-admin';
import nookies from 'nookies';
import { db, auth } from '@/lib/firebase';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { useRouter } from 'next/router';
import { onAuthStateChanged, User } from 'firebase/auth';
import { RiAddLine, RiDeleteBinLine, RiSearchEyeLine, RiChat3Line } from 'react-icons/ri';
import { v4 as uuidv4 } from 'uuid';

// --- 型定義 ---
interface WorkExperience {
  id: string;
  companyName: string;
  role: string;
  startDate: string;
  endDate: string;
  description: string;
}

// AIマッチングとランキングに対応したProfile構造
interface Profile {
  name: string;
  age: string;
  gender: string;
  address: string;
  finalEducation: string;
  workHistory: WorkExperience[];
  skills: string;
  selfPR: string;
  
  desiredJobTypes: string[]; 
  desiredEmploymentTypes: string[]; 
  
  // 1位: 給与・待遇
  desiredAnnualSalary: string; 
  desiredBenefits: string[]; 
  
  // 2位: 勤務地・通勤
  desiredLocation: string; 
  desiredRemoteLevel: 'full' | 'hybrid' | 'no'; 
  
  // 4位: 成長機会・キャリア
  desiredGrowthOpportunities: string[]; 
  
  // 6位: ワークライフバランス
  desiredWorkingHours: string; 
  desiredWLBFeatures: string[]; 
  
  // 9位: 職場環境・人間関係
  preferredAtmosphere: string[]; 
}

interface ProfilePageProps {
  profile: Profile | null;
  uid: string;
}

// --- サーバーサイド処理 (省略) ---
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
      address: profileData.address || '',
      finalEducation: profileData.finalEducation || '',
      workHistory: profileData.workHistory || [],
      skills: profileData.skills || '',
      selfPR: profileData.selfPR || '',
      desiredJobTypes: profileData.desiredJobTypes || [],
      desiredEmploymentTypes: profileData.desiredEmploymentTypes || [],
      
      desiredAnnualSalary: profileData.desiredAnnualSalary || '', 
      desiredBenefits: profileData.desiredBenefits || [],
      desiredLocation: profileData.desiredLocation || '',
      desiredRemoteLevel: profileData.desiredRemoteLevel || 'no',
      desiredGrowthOpportunities: profileData.desiredGrowthOpportunities || [],
      desiredWorkingHours: profileData.desiredWorkingHours || '',
      desiredWLBFeatures: profileData.desiredWLBFeatures || [],
      preferredAtmosphere: profileData.preferredAtmosphere || [],
    } : null;

    return { props: { profile, uid } };
  } catch (error) {
    console.error("Profile page getServerSideProps error:", error);
    return {
      redirect: {
        destination: '/users/login',
        permanent: false,
      },
    };
  }
};

// --- 選択肢データ ---
const atmosphereOptions = ["協調性重視", "個人主義", "落ち着いている", "活気がある", "アットホーム", "成果主義", "フラットな組織"];
const growthOptions = ["資格取得支援", "社外研修制度あり", "キャリア相談制度", "スキルアップに積極的"];
const wlbOptions = ["完全週休2日制", "年間休日120日以上", "残業ほぼなし", "フレックスタイム制", "時短勤務相談可"];
const benefitsOptions = ["住宅手当・家賃補助", "社員食堂・食事補助", "退職金制度", "健康診断・人間ドック補助", "育児・介護支援制度", "ストックオプション"];
const jobTypeOptions = ["営業・企画・マーケティング", "事務・管理", "販売・接客・サービス", "飲食・フード", "IT・エンジニア", "クリエイティブ（デザイン・Webなど）", "製造・軽作業・工場", "建築・土木・設備", "配送・ドライバー", "医療・福祉・保育", "教育・講師", "専門職（士業・金融など）", "その他"];
const employmentTypeOptions = ["正社員", "契約社員", "アルバイト・パート", "業務委託"];


// --- ページコンポーネント ---
const UserProfilePage: NextPage<ProfilePageProps> = ({ profile, uid }) => {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [formData, setFormData] = useState<Profile>(profile || {
    name: '', age: '', gender: '', address: '', finalEducation: '', workHistory: [], skills: '', selfPR: '',
    desiredJobTypes: [], desiredEmploymentTypes: [], 
    desiredAnnualSalary: '', desiredBenefits: [], 
    desiredLocation: '', desiredRemoteLevel: 'no', desiredGrowthOpportunities: [],
    desiredWorkingHours: '', desiredWLBFeatures: [], preferredAtmosphere: [],
  });
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
        if(!currentUser || currentUser.uid !== uid) {
          router.push('/users/login');
        } else {
          setUser(currentUser);
        }
    });
    return () => unsubscribe();
  }, [router, uid]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (field: keyof Profile, value: string) => {
    setFormData(prev => {
        const currentValues = prev[field] as string[];
        const newValues = currentValues.includes(value)
            ? currentValues.filter(item => item !== value)
            : [...currentValues, value];
        return { ...prev, [field]: newValues };
    });
  };
  
  // 職務経歴関連
  const addWorkHistory = () => {
    setFormData(prev => ({ ...prev, workHistory: [...prev.workHistory, { id: uuidv4(), companyName: '', role: '', startDate: '', endDate: '', description: '' }] }));
  };
  const handleWorkHistoryChange = (id: string, field: keyof WorkExperience, value: string) => {
    setFormData(prev => ({
      ...prev,
      workHistory: prev.workHistory.map(wh => wh.id === id ? { ...wh, [field]: value } : wh),
    }));
  };
  const removeWorkHistory = (id: string) => {
    setFormData(prev => ({ ...prev, workHistory: prev.workHistory.filter(wh => wh.id !== id) }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsLoading(true);
    setMessage(null);
    try {
      const userRef = doc(db, 'users', user.uid);
      await setDoc(userRef, { 
        ...formData, 
        desiredIndustry: undefined, 
        desiredWorkFeatures: undefined, 
        desiredSalary: undefined, 
        updatedAt: serverTimestamp() 
    }, { merge: true });
      setMessage({ type: 'success', text: 'プロフィールを保存しました。' });
      window.scrollTo(0, 0);
    } catch (err) {
      setMessage({ type: 'error', text: 'プロフィールの保存に失敗しました。' });
      window.scrollTo(0, 0);
    } finally {
      setIsLoading(false);
    }
  };
  
  if (!user) {
      return <div className="flex h-screen items-center justify-center">読み込み中...</div>
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Head>
        <title>AIマッチング用 プロフィール登録</title>
      </Head>
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">AIマッチング用 プロフィール</h1>
            <button onClick={() => router.push('/home')} className="text-sm text-blue-600 hover:underline">
                ホームに戻る
            </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleSave} className="bg-white p-8 rounded-lg shadow-md space-y-10">
          {message && <div className={`p-4 rounded-md ${message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{message.text}</div>}
          
          {/* AIマッチングの説明セクション */}
          <div className="bg-blue-100 p-4 rounded-lg border border-blue-300 space-y-2">
              <h3 className="font-bold text-lg text-blue-800 flex items-center"><RiSearchEyeLine className="mr-2"/>AIマッチングの仕組みと流れ</h3>
              <p className="text-sm text-gray-700">このプロフィールに登録された全10項目の希望（特に給与、勤務地、職種）と、企業が入力した求人情報をAIが比較し、**マッチングスコア**を計算します。</p>
              <ul className="text-xs text-gray-600 list-disc ml-5 space-y-1">
                  <li>**【使い方】**: このフォームを埋めるだけで、AIがあなたに最適な求人（上位5社）を自動提案します。</li>
                  <li>**【マッチングの仕組み】**: 企業もあなたに高スコアをつけた場合、**両思い（ダブル・オプトイン）**となり、面接が確約されます。</li>
                  <li>**【登録〜面接】**: プロフィール登録 → AIが求人を自動提案 → あなたが「応募」/企業が「スカウト」→ **マッチング成立** → アプリ内チャットで日程調整・面接へ。</li>
              </ul>
          </div>
          {/* AIマッチングの説明セクション 終わり */}

          <section className="space-y-6">
            <h2 className="text-xl font-semibold border-b pb-2 text-gray-800">基本情報</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div><label htmlFor="name" className="block text-sm font-medium text-gray-700">氏名 *</label><input type="text" id="name" name="name" value={formData.name} onChange={handleChange} required className="mt-1 block w-full input"/></div>
                <div><label htmlFor="age" className="block text-sm font-medium text-gray-700">年齢</label><input type="number" id="age" name="age" value={formData.age} onChange={handleChange} className="mt-1 block w-full input"/></div>
                <div><label htmlFor="gender" className="block text-sm font-medium text-gray-700">性別</label><select id="gender" name="gender" value={formData.gender} onChange={handleChange} className="mt-1 block w-full input"><option value="">選択しない</option><option>男性</option><option>女性</option><option>その他</option></select></div>
                <div><label htmlFor="address" className="block text-sm font-medium text-gray-700">お住まいの地域（市区町村まで）</label><input type="text" id="address" name="address" value={formData.address} onChange={handleChange} placeholder="例：那須塩原市" className="mt-1 block w-full input"/></div>
                <div><label htmlFor="finalEducation" className="block text-sm font-medium text-gray-700">最終学歴</label><input type="text" id="finalEducation" name="finalEducation" value={formData.finalEducation} onChange={handleChange} className="mt-1 block w-full input"/></div>
            </div>
          </section>

          <section className="space-y-6">
            <h2 className="text-xl font-semibold border-b pb-2 text-gray-800">希望条件（ランキング順）</h2>
            
            {/* 1位: 給与・待遇（年収・福利厚生） */}
            <div className="p-4 border rounded-md bg-yellow-50 border-yellow-300">
                <h3 className="text-lg font-bold text-yellow-800">🥇 1位: 給与・待遇の希望 (重み: 15点)</h3>
                <p className="text-xs text-gray-600 mb-2">年収希望額は企業とのマッチングの最重要項目です。</p>
                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div><label htmlFor="desiredAnnualSalary" className="block text-sm font-medium text-gray-700">希望年収（万円/以上）*</label><input type="text" id="desiredAnnualSalary" name="desiredAnnualSalary" value={formData.desiredAnnualSalary} onChange={handleChange} required placeholder="例：400万円以上" className="mt-1 block w-full input"/></div>
                </div>
                <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700">10位: 希望する福利厚生・手当（複数選択可）</label>
                    <div className="mt-2 grid grid-cols-2 md:grid-cols-3 gap-3">{benefitsOptions.map(opt => (<label key={opt} className="flex items-center space-x-2"><input type="checkbox" value={opt} checked={formData.desiredBenefits.includes(opt)} onChange={() => handleCheckboxChange('desiredBenefits', opt)} className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500" /><span>{opt}</span></label>))}</div>
                </div>
            </div>

            {/* 2位: 勤務地・通勤条件 */}
            <div className="p-4 border rounded-md bg-indigo-50 border-indigo-300">
                <h3 className="text-lg font-bold text-indigo-800">🥈 2位: 勤務地・働き方の柔軟性 (重み: 12点)</h3>
                <p className="text-xs text-gray-600 mb-2">リモート希望のレベルもAIが詳細に比較します。</p>
                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div><label htmlFor="desiredLocation" className="block text-sm font-medium text-gray-700">希望勤務地（市区町村まで）*</label><input type="text" id="desiredLocation" name="desiredLocation" value={formData.desiredLocation} onChange={handleChange} required placeholder="例：那須塩原市" className="mt-1 block w-full input"/></div>
                    <div>
                        <label htmlFor="desiredRemoteLevel" className="block text-sm font-medium text-gray-700">リモートワーク希望レベル</label>
                        <select id="desiredRemoteLevel" name="desiredRemoteLevel" value={formData.desiredRemoteLevel} onChange={handleChange} className="mt-1 block w-full input">
                            <option value="no">出社必須</option>
                            <option value="hybrid">ハイブリッド希望（一部リモート）</option>
                            <option value="full">フルリモート希望</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* 3位 & 8位: 職種・雇用形態 */}
            <div><label className="block text-sm font-medium text-gray-700">3位: 希望職種（複数選択可）</label><div className="mt-2 grid grid-cols-2 md:grid-cols-3 gap-4">{jobTypeOptions.map(opt => (<label key={opt} className="flex items-center space-x-2"><input type="checkbox" value={opt} checked={formData.desiredJobTypes.includes(opt)} onChange={() => handleCheckboxChange('desiredJobTypes', opt)} className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500" /><span>{opt}</span></label>))}</div></div>
            <div><label className="block text-sm font-medium text-gray-700">8位: 希望雇用形態（複数選択可）</label><div className="mt-2 grid grid-cols-2 md:grid-cols-3 gap-4">{employmentTypeOptions.map(opt => (<label key={opt} className="flex items-center space-x-2"><input type="checkbox" value={opt} checked={formData.desiredEmploymentTypes.includes(opt)} onChange={() => handleCheckboxChange('desiredEmploymentTypes', opt)} className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500" /><span>{opt}</span></label>))}</div></div>
            
            {/* 4位: 成長機会・キャリアパス */}
            <div><label className="block text-sm font-medium text-gray-700">4位: 成長機会の希望（複数選択可）</label><div className="mt-2 grid grid-cols-2 md:grid-cols-3 gap-4">{growthOptions.map(opt => (<label key={opt} className="flex items-center space-x-2"><input type="checkbox" value={opt} checked={formData.desiredGrowthOpportunities.includes(opt)} onChange={() => handleCheckboxChange('desiredGrowthOpportunities', opt)} className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500" /><span>{opt}</span></label>))}</div></div>

            {/* 6位 & 9位: WLBと雰囲気 */}
            <div>
                <label htmlFor="desiredWorkingHours" className="block text-sm font-medium text-gray-700">希望の勤務時間・曜日（6位: WLB）</label>
                <textarea id="desiredWorkingHours" name="desiredWorkingHours" value={formData.desiredWorkingHours} onChange={handleChange} rows={3} className="mt-1 block w-full input" placeholder="例：・平日の9時〜15時まで\n・土日祝休み希望"></textarea>
            </div>
            <div><label className="block text-sm font-medium text-gray-700">6位: WLBの重視点（休暇、残業など）</label><div className="mt-2 grid grid-cols-2 md:grid-cols-3 gap-4">{wlbOptions.map(opt => (<label key={opt} className="flex items-center space-x-2"><input type="checkbox" value={opt} checked={formData.desiredWLBFeatures.includes(opt)} onChange={() => handleCheckboxChange('desiredWLBFeatures', opt)} className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500" /><span>{opt}</span></label>))}</div></div>
            
            <div><label className="block text-sm font-medium text-gray-700">9位: 希望する職場の雰囲気（複数選択可）</label><div className="mt-2 grid grid-cols-2 md:grid-cols-3 gap-4">{atmosphereOptions.map(opt => (<label key={opt} className="flex items-center space-x-2"><input type="checkbox" value={opt} checked={formData.preferredAtmosphere.includes(opt)} onChange={() => handleCheckboxChange('preferredAtmosphere', opt)} className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500" /><span>{opt}</span></label>))}</div></div>


          </section>


          <section className="space-y-4">
            <h2 className="text-xl font-semibold border-b pb-2 text-gray-800">職務経歴・スキル</h2>
            {formData.workHistory.map((wh) => (
              <div key={wh.id} className="p-4 border rounded-md space-y-4 relative">
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

            <div><label htmlFor="skills" className="block text-sm font-medium text-gray-700">スキル・資格（フリー入力）</label><textarea id="skills" name="skills" value={formData.skills} onChange={handleChange} rows={4} className="mt-1 block w-full input" placeholder="例：・普通自動車第一種運転免許\n・TOEIC 800点\n・Word, Excel, PowerPoint"></textarea></div>
            <div><label htmlFor="selfPR" className="block text-sm font-medium text-gray-700">自己PR</label><textarea id="selfPR" name="selfPR" value={formData.selfPR} onChange={handleChange} rows={6} className="mt-1 block w-full input"></textarea></div>
          </section>
          

          <div className="flex justify-end pt-4 border-t">
            <button type="submit" disabled={isLoading} className="px-6 py-2 bg-indigo-600 text-white font-bold rounded-md hover:bg-indigo-700 disabled:bg-gray-400">
              {isLoading ? '保存中...' : 'プロフィールを保存する'}
            </button>
          </div>
        </form>
      </main>
      <style jsx>{`
        .input {
            @apply block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500;
        }
      `}</style>
    </div>
  );
};

export default UserProfilePage;
