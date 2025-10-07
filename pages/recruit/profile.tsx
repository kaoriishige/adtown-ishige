import { GetServerSideProps, NextPage } from 'next';
import Head from 'next/head';
import { useState } from 'react';
import { adminDb, getPartnerUidFromCookie } from '../../lib/firebase-admin'; // firebase-adminのパスを調整
import { db } from '@/lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { useRouter } from 'next/router';

// --- 型定義 ---
interface Profile {
  companyName: string;
  industry: string[]; // 文字列から文字列の配列に変更
  website: string;
  address: string;
  phoneNumber: string;
  description: string;
  atmosphere: string[];
  workFeatures: string[];
  benefits: string[];
  numberOfEmployees: string;
  yearFounded: string;
  averageAge: string;
}

interface ProfilePageProps {
  profile: Profile;
  uid: string;
}

// --- サーバーサイド処理 ---
export const getServerSideProps: GetServerSideProps = async (context) => {
  const uid = await getPartnerUidFromCookie(context);
  if (!uid) {
    return { redirect: { destination: '/partner/login', permanent: false } };
  }
  const userDoc = await adminDb.collection('users').doc(uid).get();
  if (!userDoc.exists) {
    return { notFound: true };
  }
  const userData = userDoc.data()!;

  const profile: Profile = {
    companyName: userData.companyName || '',
    industry: userData.industry || [], // 文字列から配列の読み込みに変更
    website: userData.website || '',
    address: userData.address || '',
    phoneNumber: userData.phoneNumber || '',
    description: userData.description || '',
    atmosphere: userData.atmosphere || [],
    workFeatures: userData.workFeatures || [],
    benefits: userData.benefits || [],
    numberOfEmployees: userData.numberOfEmployees || '',
    yearFounded: userData.yearFounded || '',
    averageAge: userData.averageAge || '',
  };

  return { props: { profile, uid } };
};

// --- 選択肢データ ---
const atmosphereOptions = ["協調性重視", "個人主義", "落ち着いている", "活気がある", "アットホーム", "成果主義"];
const workFeaturesOptions = ["フレックスタイム制", "リモートワーク可", "副業OK", "時短勤務可", "服装自由", "資格取得支援", "書籍購入補助"];
const benefitsOptions = ["住宅手当", "社員食堂・食事補助", "ストックオプション", "交通費全額支給", "健康診断", "退職金制度"];
const employeeCountOptions = ["1-10人", "11-50人", "51-100人", "101-500人", "501人以上"];
const averageAgeOptions = ["20代", "30代", "40代", "50代以上"];

// --- ▼▼▼ 求職者プロフィールと完全に一致させた業種選択肢 ▼▼▼ ---
const industryOptions = [
    "飲食・宿泊", 
    "小売・卸売", 
    "美容・健康・福祉", 
    "製造・工場", 
    "建設・不動産", 
    "運輸・物流", 
    "IT・通信", 
    "金融・保険", 
    "教育・学習支援", 
    "農林水産", 
    "専門サービス（士業・コンサルなど）", 
    "その他"
];
// --- ▲▲▲ ここまで ▲▲▲ ---


// --- ページコンポーネント ---
const RecruitProfilePage: NextPage<ProfilePageProps> = ({ profile, uid }) => {
  const router = useRouter();
  const [formData, setFormData] = useState<Profile>(profile);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

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

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);
    try {
      const userRef = doc(db, 'users', uid);
      await updateDoc(userRef, { ...formData });
      setMessage({ type: 'success', text: 'プロフィールを更新しました。' });
      window.scrollTo(0, 0);
    } catch (err) {
      setMessage({ type: 'error', text: 'プロフィールの更新に失敗しました。' });
      window.scrollTo(0, 0);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Head>
        <title>AIマッチング用 企業プロフィールの編集</title>
      </Head>
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">企業プロフィールの編集</h1>
            <button onClick={() => router.push('/recruit/dashboard')} className="text-sm text-blue-600 hover:underline">
              求人ダッシュボードに戻る
            </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleSave} className="bg-white p-8 rounded-lg shadow-md space-y-8">
          {message && (
            <div className={`p-4 rounded-md mb-6 ${message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
              {message.text}
            </div>
          )}

          {/* AIマッチング用情報セクション */}
          <section className="space-y-8">
            <h2 className="text-xl font-semibold border-b pb-2 text-gray-800">AIマッチングのための企業情報</h2>
            <p className="text-sm text-gray-600">
              ここに登録されたすべての情報が、AIによる求職者とのマッチング精度向上のために利用されます。<br/>
              できるだけ多くの項目を正確にご入力ください。
            </p>

            {/* 基本情報 */}
            <div className="space-y-6 pt-4">
              <div>
                <label htmlFor="companyName" className="block text-sm font-medium text-gray-700">企業名・店舗名 *</label>
                <input type="text" id="companyName" name="companyName" value={formData.companyName} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"/>
              </div>
              <div>
                <label htmlFor="address" className="block text-sm font-medium text-gray-700">所在地 *</label>
                <input type="text" id="address" name="address" value={formData.address} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"/>
              </div>
              <div>
                <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700">電話番号 *</label>
                <input type="tel" id="phoneNumber" name="phoneNumber" value={formData.phoneNumber} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"/>
              </div>
              <div>
                <label htmlFor="website" className="block text-sm font-medium text-gray-700">ウェブサイトURL</label>
                <input type="url" id="website" name="website" value={formData.website} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"/>
              </div>
            </div>
            
            {/* --- ▼▼▼ 業種をチェックボックスに変更 ▼▼▼ --- */}
            <div className="pt-6 border-t">
                <label className="block text-sm font-medium text-gray-700">業種（複数選択可）*</label>
                <div className="mt-2 grid grid-cols-2 md:grid-cols-3 gap-4">
                    {industryOptions.map(opt => (
                        <label key={opt} className="flex items-center space-x-2">
                            <input type="checkbox" name="industry" value={opt} checked={formData.industry.includes(opt)} onChange={() => handleCheckboxChange('industry', opt)} className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500" />
                            <span>{opt}</span>
                        </label>
                    ))}
                </div>
            </div>
            {/* --- ▲▲▲ ここまで ▲▲▲ --- */}

            {/* 企業規模 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 border-t">
              <div>
                <label htmlFor="numberOfEmployees" className="block text-sm font-medium text-gray-700">従業員数</label>
                <select id="numberOfEmployees" name="numberOfEmployees" value={formData.numberOfEmployees} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500">
                  <option value="">選択してください</option>
                  {employeeCountOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              </div>
              <div>
                <label htmlFor="yearFounded" className="block text-sm font-medium text-gray-700">設立年</label>
                <input type="number" id="yearFounded" name="yearFounded" value={formData.yearFounded} onChange={handleChange} placeholder="例: 2010" className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"/>
              </div>
              <div>
                <label htmlFor="averageAge" className="block text-sm font-medium text-gray-700">平均年齢</label>
                 <select id="averageAge" name="averageAge" value={formData.averageAge} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500">
                  <option value="">選択してください</option>
                  {averageAgeOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              </div>
            </div>
            
            {/* 職場の雰囲気 */}
            <div className="pt-6 border-t">
                <label className="block text-sm font-medium text-gray-700">職場の雰囲気（複数選択可）</label>
                <div className="mt-2 grid grid-cols-2 md:grid-cols-3 gap-4">
                    {atmosphereOptions.map(opt => (
                        <label key={opt} className="flex items-center space-x-2">
                            <input type="checkbox" name="atmosphere" value={opt} checked={formData.atmosphere.includes(opt)} onChange={() => handleCheckboxChange('atmosphere', opt)} className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500" />
                            <span>{opt}</span>
                        </label>
                    ))}
                </div>
            </div>

            {/* 働き方の特徴 */}
            <div className="pt-6 border-t">
                <label className="block text-sm font-medium text-gray-700">働き方の特徴（複数選択可）</label>
                <div className="mt-2 grid grid-cols-2 md:grid-cols-3 gap-4">
                    {workFeaturesOptions.map(opt => (
                        <label key={opt} className="flex items-center space-x-2">
                            <input type="checkbox" name="workFeatures" value={opt} checked={formData.workFeatures.includes(opt)} onChange={() => handleCheckboxChange('workFeatures', opt)} className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500" />
                            <span>{opt}</span>
                        </label>
                    ))}
                </div>
            </div>
            
            {/* 福利厚生 */}
            <div className="pt-6 border-t">
                <label className="block text-sm font-medium text-gray-700">福利厚生（複数選択可）</label>
                <div className="mt-2 grid grid-cols-2 md:grid-cols-3 gap-4">
                    {benefitsOptions.map(opt => (
                        <label key={opt} className="flex items-center space-x-2">
                            <input type="checkbox" name="benefits" value={opt} checked={formData.benefits.includes(opt)} onChange={() => handleCheckboxChange('benefits', opt)} className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500" />
                            <span>{opt}</span>
                        </label>
                    ))}
                </div>
            </div>

            {/* 企業紹介文 */}
            <div className="pt-6 border-t">
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">企業紹介文</label>
              <textarea id="description" name="description" value={formData.description} onChange={handleChange} rows={8} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" />
            </div>
          </section>

          <div className="flex justify-end pt-4">
            <button type="submit" disabled={isLoading} className="px-6 py-2 bg-indigo-600 text-white font-bold rounded-md hover:bg-indigo-700 disabled:bg-gray-400">
              {isLoading ? '保存中...' : '保存する'}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
};

export default RecruitProfilePage;