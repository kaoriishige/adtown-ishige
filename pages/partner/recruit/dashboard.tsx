import type { NextPage } from 'next';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { getAuth, signOut, onAuthStateChanged, User } from 'firebase/auth';
import { app } from '@/lib/firebase'; // Firebaseの初期化設定に合わせてパスを調整

// --- アイコン用のSVGコンポーネント ---
const BriefcaseIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}> <path strokeLinecap="round" strokeLinejoin="round" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /> </svg> );
const DocumentTextIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}> <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /> </svg> );
const UserGroupIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}> <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /> </svg> );
const CogIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}> <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /> <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /> </svg> );

type ActionButtonProps = { href: string; icon: React.ReactNode; title: string; description: string; bgColorClass: string; };

const ActionButton: React.FC<ActionButtonProps> = ({ href, icon, title, description, bgColorClass }) => (
  <Link href={href} className="group flex items-center p-4 bg-white rounded-lg shadow-sm hover:shadow-lg transition-shadow duration-300">
      <div className={`flex-shrink-0 w-16 h-16 rounded-lg flex items-center justify-center ${bgColorClass}`}> {icon} </div>
      <div className="ml-4">
        <h3 className="text-lg font-bold text-gray-800 group-hover:text-blue-600 transition-colors"> {title} </h3>
        <p className="text-sm text-gray-500 mt-1">{description}</p>
      </div>
  </Link>
);

const RecruitDashboardPage: NextPage = () => {
  const router = useRouter();
  const { payment_success } = router.query;
  const [partnerName, setPartnerName] = useState<string | null>(null);
  const auth = getAuth(app);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user: User | null) => {
      if (user) {
        setPartnerName(user.displayName);
      } else {
        router.push('/recruit/login'); // ログインしてなければ求人ログインページへ
      }
    });
    return () => unsubscribe();
  }, [auth, router]);
  
  const handleLogout = async () => {
    try {
      await fetch('/api/auth/sessionLogout', { method: 'POST' });
      await signOut(auth);
      router.push('/recruit/login'); // ログアウト後は求人ログインページへ
    } catch (error) {
      console.error('ログアウトに失敗しました:', error);
      alert('ログアウト処理中にエラーが発生しました。');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">求人パートナー ダッシュボード</h1>
            {partnerName && (
              <p className="text-sm text-gray-600 mt-1">
                ようこそ、<span className="font-bold">{partnerName}</span> 様
              </p>
            )}
          </div>
        </div>
      </header>
      
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {payment_success === 'true' && (
            <div className="bg-green-100 border-l-4 border-green-500 text-green-800 p-4 rounded-md mb-8" role="alert">
                <p className="font-bold">お申し込みありがとうございます！</p>
                <p>求人パートナー登録が完了しました。</p>
            </div>
        )}

        <div className="space-y-8">
          <section>
            <h2 className="text-xl font-bold text-gray-700 mb-3">１．求人情報を管理する</h2>
            <div className="space-y-4">
              <ActionButton href="/recruit/jobs/manage" icon={<BriefcaseIcon />} title="求人情報の登録・編集" description="新しい求人の作成や、掲載中の求人内容を編集します" bgColorClass="bg-blue-500" />
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-700 mb-3">２．応募者を管理する</h2>
              <div className="space-y-4">
                  <ActionButton href="/recruit/applicants" icon={<UserGroupIcon />} title="応募者の確認・選考" description="求人への応募者一覧を確認し、メッセージのやり取りをします" bgColorClass="bg-green-500" />
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-700 mb-3">３．企業情報を設定する</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <ActionButton href="/recruit/company-profile" icon={<DocumentTextIcon />} title="企業プロフィールを編集" description="求職者に表示される企業情報や写真を設定します" bgColorClass="bg-purple-500" />
               <ActionButton href="/recruit/account-settings" icon={<CogIcon />} title="アカウント・決済設定" description="登録情報やクレジットカードの変更を行います" bgColorClass="bg-yellow-500" />
            </div>
          </section>

          <section>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-12">
              <Link href="/contact" className="w-full text-center py-3 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-100">
                  お問い合わせ
              </Link>
              <button onClick={handleLogout} className="w-full text-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gray-600 hover:bg-gray-700">
                ログアウト
              </button>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
};

export default RecruitDashboardPage;