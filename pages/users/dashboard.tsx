// pages/users/dashboard.tsx
import { GetServerSideProps, NextPage } from 'next';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { adminDb, adminAuth } from '@/lib/firebase-admin';
import nookies from 'nookies';
import { getAuth, signOut } from 'firebase/auth';
import { app, db } from '../../lib/firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { LogOut, User, Mail, Zap, Star, Edit, ThumbsUp, ThumbsDown, Check, X, HelpCircle } from 'lucide-react'; // ★ QuestionLine を HelpCircle に修正
import Link from 'next/link';
import { useState } from 'react';

// --- 型定義 ---
interface UserProfile {
  name: string;
}

interface RecommendedJob {
  id: string;
  jobTitle: string;
  companyName: string;
  location: string;
  salaryMin: number;
  salaryMax: number;
  matchScore: number;
  matchReasons: string[];
}

interface Scout {
  id: string;
  companyName: string;
  jobTitle: string;
  message: string;
  matchId: string; // チャットルームへのID
}

interface DashboardProps {
  profile: UserProfile;
  recommendedJobs: RecommendedJob[];
  scouts: Scout[];
  uid: string;
}

// --- サーバーサイド処理 ---
export const getServerSideProps: GetServerSideProps = async (context) => {
  try {
    const cookies = nookies.get(context);
    const token = await adminAuth.verifySessionCookie(cookies.session || '', true);
    const { uid } = token;

    const userDoc = await adminDb.collection('users').doc(uid).get();
    if (!userDoc.exists) throw new Error("User not found");
    const userData = userDoc.data()!;

    // ... (AIマッチングロジックはシミュレーション)
    const recommendedJobs: RecommendedJob[] = [
        { id: 'job1', companyName: '株式会社未来創造', jobTitle: 'AIエンジニア', location: '那須塩原市', salaryMin: 400, salaryMax: 700, matchScore: 95, matchReasons: ['希望給与', '価値観'] }
    ];
    const scouts: Scout[] = [
      { id: 'scout1', companyName: 'サクセス研究社', jobTitle: 'AIリサーチャー', message: 'あなたのスキルに大変興味を持ちました。ぜひ一度お話...', matchId: 'match_12345' },
    ];

    return { props: { profile: { name: userData.name || 'ゲスト' }, recommendedJobs, scouts, uid } };
  } catch (error) {
    return { redirect: { destination: '/users/login', permanent: false } };
  }
};


const UserDashboardPage: NextPage<DashboardProps> = ({ profile, recommendedJobs, scouts, uid }) => {
  const router = useRouter();
  const [expandedJobId, setExpandedJobId] = useState<string | null>(null);
  const [expandedScoutId, setExpandedScoutId] = useState<string | null>(null);

  const handleLogout = async () => {
    await signOut(getAuth(app));
    router.push('/users/login');
  };

  // 意思表示のアクション（本来はDBを更新）
  const handleInterestAction = async (jobId: string, interested: boolean) => {
    console.log(`Job ID: ${jobId}, Interested: ${interested}`);
    alert(`求人に対して「${interested ? '興味あり' : '興味なし'}」を送信しました。`);
    setExpandedJobId(null);
  };

  const handleScoutResponse = async (matchId: string, accepted: boolean) => {
     console.log(`Match ID: ${matchId}, Accepted: ${accepted}`);
    if (accepted) {
        alert('スカウトを承諾しました。チャットを開始します。');
        router.push(`/chat/${matchId}`);
    } else {
        alert('スカウトを辞退しました。');
    }
    setExpandedScoutId(null);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Head>
        <title>マイページ - AI求人</title>
      </Head>
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">マイページ</h1>
          <button onClick={handleLogout} className="flex items-center text-sm text-gray-500 hover:text-red-600">
              <LogOut size={16} className="mr-1"/>ログアウト
          </button>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-800">ようこそ、{profile.name} 様</h2>
          <p className="mt-1 text-gray-600">あなたの魂に共鳴する企業が、きっと見つかります。</p>
        </div>

        <section className="mb-8 bg-white p-6 rounded-xl shadow-md">
            <h2 className="text-xl font-bold text-gray-800 border-b pb-3 mb-6 flex items-center"><HelpCircle className="mr-3 text-indigo-500"/>求人マッチングAIの使い方</h2>
            <div className="grid md:grid-cols-2 gap-8">
                <div>
                    <h3 className="text-lg font-bold text-gray-800 flex items-center"><Zap className="mr-2 text-indigo-500"/>「AI推薦企業」への対応</h3>
                    <p className="text-sm text-gray-600 mt-1">あなたの魂に響く可能性があるとAIが判断した企業です。</p>
                    <div className="mt-4 p-3 border rounded-lg bg-gray-50">
                        <p className="font-semibold text-gray-900">株式会社サンプル</p>
                        <div className="mt-3 pt-3 border-t flex justify-end gap-3">
                            <button className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg"><ThumbsDown size={16}/> 興味なし</button>
                            <button className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-blue-500 rounded-lg"><ThumbsUp size={16}/> 興味あり</button>
                        </div>
                        <ul className="text-xs text-gray-600 space-y-1 mt-2 w-full">
                            <li><strong className="font-semibold">・興味なし：</strong><span className="text-red-700">静かなる意思表示</span>です。企業に通知は送られず、AIが静かに学習し、推薦精度を向上させます。</li>
                            <li><strong className="font-semibold">・興味あり：</strong>魂の叫びです。企業に応募通知が送られ、承諾されるとチャットルームが開設されます。</li>
                        </ul>
                    </div>
                </div>
                 <div>
                    <h3 className="text-lg font-bold text-gray-800 flex items-center"><Mail className="mr-2 text-indigo-500"/>「企業からのスカウト」への対応</h3>
                    <p className="text-sm text-gray-600 mt-1">あなたの魂に惹かれた企業からの招待状です。</p>
                     <div className="mt-4 p-3 border rounded-lg bg-gray-50">
                        <p className="font-semibold text-gray-900">サクセス研究社</p>
                        <div className="mt-3 pt-3 border-t flex gap-2">
                           <button className="flex-1 text-center px-3 py-2 bg-white text-gray-700 text-xs font-semibold rounded-md border">辞退する</button>
                           <button className="flex-1 text-center px-3 py-2 bg-blue-500 text-white text-xs font-semibold rounded-md flex items-center justify-center gap-1"><Check size={14}/> 承諾してチャットへ進む</button>
                        </div>
                         <ul className="text-xs text-gray-600 space-y-1 mt-2 w-full">
                            <li><strong className="font-semibold">・辞退する：</strong>魂の決断です。企業に辞退の旨が丁寧に通知されます。</li>
                            <li><strong className="font-semibold">・承諾してチャットへ進む：</strong>魂の合致です。チャットルームが即座に開設され、企業との対話が始まります。</li>
                        </ul>
                    </div>
                </div>
            </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          <div className="lg:col-span-2 space-y-8">
            <section className="bg-white p-6 rounded-xl shadow-md">
              <h3 className="text-xl font-bold text-gray-800 flex items-center"><Zap className="mr-3 text-indigo-500"/>AIがあなたの魂に推薦する企業</h3>
              <div className="mt-6 space-y-4">
                {recommendedJobs.length > 0 ? recommendedJobs.map(job => (
                  <div key={job.id} className="border border-gray-200 rounded-lg transition-all duration-300 ease-in-out">
                    <div className="p-5 cursor-pointer hover:bg-gray-50" onClick={() => setExpandedJobId(job.id === expandedJobId ? null : job.id)}>
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-xs font-bold text-indigo-600">{job.companyName}</p>
                          <span className="text-lg font-bold text-gray-900 hover:underline">{job.jobTitle}</span>
                          <p className="text-sm text-gray-500 mt-1">{job.location} / 年収 {job.salaryMin}万〜{job.salaryMax}万円</p>
                        </div>
                        <div className="text-center flex-shrink-0 ml-4">
                          <p className="text-xs text-green-600 font-bold">マッチ度</p>
                          <p className="text-3xl font-extrabold text-green-600">{job.matchScore}<span className="text-lg">%</span></p>
                        </div>
                      </div>
                      <div className="mt-3 pt-3 border-t border-dashed">
                          <p className="text-xs text-gray-500 flex items-center"><Star size={14} className="text-amber-500 mr-2"/>AIの注目ポイント： <span className="font-semibold text-gray-700 ml-1">{job.matchReasons.join('・')}</span></p>
                      </div>
                    </div>
                    {expandedJobId === job.id && (
                        <div className="p-4 bg-gray-100 border-t flex justify-end gap-3">
                            <button onClick={() => handleInterestAction(job.id, false)} className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-200"><ThumbsDown size={16}/> 興味なし</button>
                            <button onClick={() => handleInterestAction(job.id, true)} className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-blue-500 rounded-lg hover:bg-blue-600"><ThumbsUp size={16}/> 興味あり</button>
                        </div>
                    )}
                  </div>
                )) : ( <p className="text-center py-8 text-gray-500">現在、推薦できる求人はありません。プロフィールを充実させると見つかりやすくなります。</p> )}
              </div>
            </section>
          </div>
          <div className="lg:col-span-1 space-y-8">
            <section className="bg-white p-6 rounded-xl shadow-md">
                <h3 className="text-xl font-bold text-gray-800 flex items-center"><User className="mr-3 text-indigo-500"/>あなたの魂のプロフィール</h3>
                <p className="text-sm text-gray-600 mt-2">AIのマッチング精度は、あなたの魂の情報がどれだけ詳細かによって決まります。</p>
                <button onClick={() => router.push('/users/profile')} className="mt-4 w-full flex items-center justify-center px-4 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors">
                    <Edit size={16} className="mr-2"/>プロフィールを編集・更新する
                </button>
            </section>
            <section className="bg-white p-6 rounded-xl shadow-md">
              <h3 className="text-xl font-bold text-gray-800 flex items-center"><Mail className="mr-3 text-indigo-500"/>企業からのスカウト</h3>
              <div className="mt-6 space-y-4">
                {scouts.map(scout => (
                  <div key={scout.id} className="p-4 border rounded-lg bg-blue-50 cursor-pointer hover:shadow-lg" onClick={() => setExpandedScoutId(scout.id === expandedScoutId ? null : scout.id)}>
                    <p className="text-sm font-bold text-gray-800">{scout.companyName}</p>
                    <p className="text-xs text-gray-600 mt-1">{scout.jobTitle}</p>
                    <p className="text-xs text-gray-700 mt-2 p-2 bg-white rounded">「{scout.message}」</p>
                    {expandedScoutId === scout.id && (
                        <div className="mt-4 pt-3 border-t border-blue-200 flex gap-2">
                           <button onClick={() => handleScoutResponse(scout.matchId, false)} className="flex-1 text-center px-3 py-2 bg-white text-gray-700 text-xs font-semibold rounded-md hover:bg-gray-200 border">辞退する</button>
                           <button onClick={() => handleScoutResponse(scout.matchId, true)} className="flex-1 text-center px-3 py-2 bg-blue-500 text-white text-xs font-semibold rounded-md hover:bg-blue-600 flex items-center justify-center gap-1"><Check size={14}/> 承諾してチャットへ進む</button>
                        </div>
                    )}
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
};

export default UserDashboardPage;