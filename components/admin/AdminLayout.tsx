import React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { RiDashboardLine, RiFileTextLine, RiLogoutBoxLine } from 'react-icons/ri';

interface AdminLayoutProps {
  children: React.ReactNode;
  title?: string;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children, title = '管理者ダッシュボード' }) => {
  const router = useRouter();

  // ログアウト処理（必要に応じて実装）
  const handleLogout = () => {
    // 実際にはAPIを叩いてセッションを削除する処理を実装
    console.log('ログアウト処理を実行（要実装）');
    // router.push('/admin/login'); // 管理者ログインページへリダイレクト
  };

  const navItems = [
    { name: 'ダッシュボード', href: '/admin', Icon: RiDashboardLine },
    { name: '知恵袋ガイド', href: '/admin/wisdom-guide', Icon: RiFileTextLine },
    // 他の管理項目を追加
  ];

  return (
    <>
      <Head>
        <title>{title} | みんなの那須アプリ Admin</title>
      </Head>
      <div className="min-h-screen bg-gray-100 flex">
        
        {/* サイドバー */}
        <div className="w-64 bg-gray-800 text-white flex flex-col p-4 shadow-xl">
          <h2 className="text-2xl font-bold mb-8 border-b border-gray-700 pb-3">Admin Panel</h2>
          <nav className="flex-grow space-y-2">
            {navItems.map((item) => (
              <Link key={item.name} href={item.href} legacyBehavior>
                <a
                  className={`flex items-center p-3 rounded-lg transition duration-150 ${
                    router.pathname === item.href || (item.href !== '/admin' && router.pathname.startsWith(item.href))
                      ? 'bg-blue-600 font-bold'
                      : 'hover:bg-gray-700'
                  }`}
                >
                  <item.Icon className="w-5 h-5 mr-3" />
                  {item.name}
                </a>
              </Link>
            ))}
          </nav>
          <button
            onClick={handleLogout}
            className="flex items-center p-3 rounded-lg text-red-400 hover:bg-gray-700 transition duration-150 mt-auto"
          >
            <RiLogoutBoxLine className="w-5 h-5 mr-3" />
            ログアウト
          </button>
        </div>

        {/* メインコンテンツ */}
        <main className="flex-1 p-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </>
  );
};

export default AdminLayout;