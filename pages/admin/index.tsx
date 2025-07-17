import Link from 'next/link';

const AdminMenu = () => {
  // ボタンに適用する共通のスタイル
  const buttonStyle = "w-full p-5 text-lg font-bold text-white bg-blue-500 rounded-lg hover:bg-blue-600 transition-colors";

  return (
    <div className="p-5 max-w-3xl mx-auto my-10 text-center">
      <h1 className="text-3xl font-bold mb-6">管理メニュー</h1>
      <div className="grid grid-cols-2 gap-4">
        
        <Link href="/admin/landing-editor">
          <button className={buttonStyle}>ランディング編集</button>
        </Link>
        
        <Link href="/admin/manageApps">
          <button className={buttonStyle}>アプリ管理</button>
        </Link>

        <Link href="/admin/users">
          <button className={buttonStyle}>ユーザー管理</button>
        </Link>

        <Link href="/admin/inquiries">
          <button className={buttonStyle}>お問い合わせ管理</button>
        </Link>

        {/* 以下は未実装のページへのリンク */}
        <Link href="/admin/rewards">
          <button className={buttonStyle}>紹介報酬管理</button>
        </Link>

        <Link href="/admin/csv-export">
          <button className={buttonStyle}>CSV出力</button>
        </Link>

        <Link href="/admin/manual-functions">
          <button className={buttonStyle}>関数手動実行</button>
        </Link>

        <Link href="/admin/operation-guide">
          <button className={buttonStyle}>運用ガイド</button>
        </Link>

      </div>
    </div>
  );
};

export default AdminMenu;

















