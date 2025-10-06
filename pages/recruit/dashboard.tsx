import { GetServerSideProps, NextPage } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import { RiBuilding4Line, RiFileList3Line, RiUserSearchLine } from 'react-icons/ri';
import { adminDb, getPartnerUidFromCookie } from '../../lib/firebase-admin'; // firebase-adminのパスは適宜調整してください

// --- 型定義 ---
interface DashboardProps {
  companyName: string;
}

interface DashboardCardProps {
  href: string;
  icon: React.ReactElement;
  title: string;
  description: string;
}

// --- サーバーサイドでのデータ取得 ---
export const getServerSideProps: GetServerSideProps = async (context) => {
  try {
    const uid = await getPartnerUidFromCookie(context);
    if (!uid) {
      // ログインしていない場合はログインページへ
      return { redirect: { destination: '/partner/login', permanent: false } };
    }

    const userDoc = await adminDb.collection('users').doc(uid).get();
    if (!userDoc.exists) {
      // ユーザー情報がない場合もログインページへ
      return { redirect: { destination: '/partner/login?error=user_not_found', permanent: false } };
    }
    
    // 会社名を取得してページに渡す
    const companyName = userDoc.data()?.companyName || 'パートナー';

    return {
      props: {
        companyName,
      },
    };
  } catch (error) {
    console.error('Dashboard getServerSideProps error:', error);
    return { redirect: { destination: '/partner/login', permanent: false } };
  }
};


// --- ダッシュボードのボタンコンポーネント ---
const DashboardCard: React.FC<DashboardCardProps> = ({ href, icon, title, description }) => {
  return (
    <Link href={href} className="block hover:opacity-80 transition-opacity">
      <div className="bg-white p-6 rounded-lg shadow-md flex items-center space-x-6">
        <div className="bg-indigo-100 text-indigo-600 p-4 rounded-full">
          {icon}
        </div>
        <div>
          <h3 className="text-lg font-bold text-gray-800">{title}</h3>
          <p className="text-gray-500 mt-1">{description}</p>
        </div>
      </div>
    </Link>
  );
};


// --- メインのページコンポーネント ---
const RecruitDashboardPage: NextPage<DashboardProps> = ({ companyName }) => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Head>
        <title>AI求人パートナー ダッシュボード</title>
      </Head>

      <header className="bg-white shadow-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <h1 className="text-2xl font-bold text-gray-900">AI求人パートナー ダッシュボード</h1>
          <p className="text-gray-600 mt-1">ようこそ、{companyName} 様</p>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-10">
          
          {/* 求人管理セクション */}
          <section>
            <h2 className="text-xl font-semibold text-gray-700 mb-4">求人管理</h2>
            <div className="space-y-4">
              <DashboardCard
                href="/recruit/jobs/create" // 求人作成ページへのリンク
                icon={<RiFileList3Line size={28} />}
                title="求人情報を登録・管理"
                description="募集中の求人情報を設定・更新します"
              />
              <DashboardCard
                href="/recruit/applicants" // 応募者管理ページへのリンク
                icon={<RiUserSearchLine size={28} />}
                title="応募者を確認・管理"
                description="あなたの求人に応募したユーザーを確認します"
              />
            </div>
          </section>

          {/* アカウント設定セクション */}
          <section>
            <h2 className="text-xl font-semibold text-gray-700 mb-4">アカウント設定</h2>
            <div className="space-y-4">
              <DashboardCard
                href="/recruit/profile" // ★★★ ここが修正点です ★★★
                icon={<RiBuilding4Line size={28} />}
                title="企業プロフィールを編集"
                description="会社情報やアカウント情報を変更します"
              />
            </div>
          </section>

        </div>
      </main>
    </div>
  );
};

export default RecruitDashboardPage;
