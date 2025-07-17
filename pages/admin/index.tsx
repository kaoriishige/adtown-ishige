import Link from 'next/link';

const AdminPage = () => {
  // ★★★ エラー修正箇所 ★★★
  // 各リンクに適用する共通のスタイルをここで定義します。
  const linkStyle = "block w-full max-w-md mx-auto py-4 px-6 bg-gray-700 text-white text-lg font-semibold rounded-lg shadow-md hover:bg-gray-600 transition-transform transform hover:scale-105 text-center";

  return (
    <div className="p-5 my-10">
      <h1 className="text-4xl font-extrabold mb-10 text-center text-gray-800">管理メニュー</h1>
      <nav className="space-y-5">
        {/* 既存のメニュー項目 */}
        <Link href="/admin/app-management" className={linkStyle}>
          アプリ管理 (CRUD)
        </Link>
        <Link href="/admin/landing-editor" className={linkStyle}>
          ランディングページ編集
        </Link>
        <Link href="/admin/user-management" className={linkStyle}>
          ユーザー管理
        </Link>
        <Link href="/admin/inquiry-list" className={linkStyle}>
          問い合わせ管理
        </Link>
        
        {/* ▼▼▼ ここに新しいリンクを追加しました ▼▼▼ */}
        <Link href="/admin/genres" className={linkStyle}>
          ジャンル管理
        </Link>
        
        {/* 未実装のメニュー項目 */}
        <Link href="/admin/referral-rewards" className={linkStyle}>
          紹介報酬管理
        </Link>
        <Link href="/admin/csv-export" className={linkStyle}>
          CSV出力
        </Link>
        <Link href="/admin/manual-functions" className={linkStyle}>
          関数手動実行
        </Link>
        <Link href="/admin/operation-guide" className={linkStyle}>
          運用ガイド
        </Link>
      </nav>
    </div>
  );
};

export default AdminPage;

















