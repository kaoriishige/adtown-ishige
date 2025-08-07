import { GetServerSideProps, NextPage } from 'next';
import Link from 'next/link';
import nookies from 'nookies';
import { getAdminAuth } from '../lib/firebase-admin';

// --- ページコンポーネント ---
const PayoutSettingsPage: NextPage = () => {
  // ここに口座情報を保存・更新するロジックを追加します
  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    alert('口座情報を保存しました（実際の処理は未実装です）');
  };

  return (
    <div className="flex flex-col items-center min-h-screen bg-gray-50 pt-10">
      <div className="w-full max-w-2xl">
        <div className="mb-6">
          <Link href="/mypage" className="text-blue-500 hover:underline">
            ← マイページに戻る
          </Link>
        </div>
        
        <div className="bg-white shadow-md rounded-lg p-8">
          <h1 className="text-2xl font-bold mb-6 text-center text-gray-800">報酬受取口座の登録・編集</h1>
          
          <form onSubmit={handleSave}>
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="bank-name">
                金融機関名
              </label>
              <input 
                id="bank-name"
                className="w-full p-2 border rounded shadow-sm" 
                type="text" 
                placeholder="例：楽天銀行" 
                required 
              />
            </div>
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="branch-name">
                支店名
              </label>
              <input 
                id="branch-name"
                className="w-full p-2 border rounded shadow-sm" 
                type="text" 
                placeholder="例：第一営業支店" 
                required 
              />
            </div>
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="account-type">
                預金種目
              </label>
              <select id="account-type" className="w-full p-2 border rounded bg-white shadow-sm">
                <option>普通</option>
                <option>当座</option>
              </select>
            </div>
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="account-number">
                口座番号
              </label>
              <input 
                id="account-number"
                className="w-full p-2 border rounded shadow-sm" 
                type="text" 
                placeholder="7桁の半角数字" 
                required 
              />
            </div>
            <div className="mb-6">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="account-name">
                口座名義（カナ）
              </label>
              <input 
                id="account-name"
                className="w-full p-2 border rounded shadow-sm" 
                type="text" 
                placeholder="例：スズキ タロウ" 
                required 
              />
            </div>
            <div className="text-center mt-8">
              <button 
                type="submit" 
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg text-lg"
              >
                保存する
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

// --- サーバーサイドでの認証チェック ---
// ログインしていないユーザーがこのページにアクセスしようとすると、
// サーバー側でブロックし、ログインページへ強制的に移動させます。
export const getServerSideProps: GetServerSideProps = async (context) => {
  try {
    const cookies = nookies.get(context);
    // クッキーにあるトークンを検証
    await getAdminAuth().verifySessionCookie(cookies.token, true);
    
    // 検証に成功した場合、ページを表示するためのpropsを返す
    return {
      props: {}, // このページは特にサーバーから渡すデータはない
    };
  } catch (error) {
    // 検証に失敗した場合はログインページにリダイレクト
    return {
      redirect: {
        destination: '/login',
        permanent: false,
      },
    };
  }
};

export default PayoutSettingsPage;