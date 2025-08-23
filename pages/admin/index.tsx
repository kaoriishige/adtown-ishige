import Link from 'next/link';

// 管理者ページのメニューです。
const AdminPage = () => {
  const linkStyle = "block w-full max-w-md mx-auto py-4 px-6 bg-gray-700 text-white text-lg font-semibold rounded-lg shadow-md hover:bg-gray-600 transition-transform transform hover:scale-105 text-center";
  const primaryLinkStyle = "block w-full max-w-md mx-auto py-4 px-6 bg-blue-600 text-white text-lg font-bold rounded-lg shadow-lg hover:bg-blue-500 transition-transform transform hover:scale-105 text-center";
  const settingsLinkStyle = "block w-full max-w-md mx-auto py-4 px-6 bg-purple-600 text-white text-lg font-semibold rounded-lg shadow-md hover:bg-purple-500 transition-transform transform hover:scale-105 text-center";

  return (
    <div className="p-5 my-10">
      <h1 className="text-4xl font-extrabold mb-10 text-center text-gray-800">管理メニュー</h1>
      <nav className="space-y-5">
        
        <Link href="/admin/dashboard" className={primaryLinkStyle}>
          📊 運営ダッシュボード
        </Link>
        
        {/* ▼▼▼ ここに設定ページへのリンクを追加 ▼▼▼ */}
        <Link href="/admin/settings" className={settingsLinkStyle}>
          ⚙️ 各種設定
        </Link>

        <Link href="/admin/manageApps" className={linkStyle}>
          アプリ管理 (CRUD)
        </Link>

        <Link href="/admin/manageStores" className={linkStyle}>
          店舗管理
        </Link>
        
        <Link href="/admin/user-management" className={linkStyle}>
          ユーザー管理
        </Link>
        <Link href="/admin/inquiry-list" className={linkStyle}>
          問い合わせ管理
        </Link>
        <Link href="/admin/referral-rewards" className={linkStyle}>
          紹介報酬管理
        </Link>
        <Link href="/admin/landing-editor" className={linkStyle}>
          ランディングページ編集
        </Link>
        <Link href="/admin/export" className={linkStyle}>
          CSV出力
        </Link>
        <Link href="/admin/manual-functions" className={linkStyle}>
          関数手動実行
        </Link>
        <Link href="/admin/guide" className={linkStyle}>
          運用ガイド
        </Link>
      </nav>
    </div>
  );
};

export default AdminPage;
















