import { GetServerSideProps, NextPage } from 'next';
import Link from 'next/link';
import nookies from 'nookies';
import { adminAuth, getAdminDb } from '@/lib/firebase-admin'; // 絶対パスを使用

// --- ★★★ ここからが重要な変更点 ★★★ ---
// ページが受け取るpropsの型に、ユーザーの役割(role)を追加
interface ContactPageProps {
  user: {
    uid: string;
    email: string;
    role: 'partner' | 'user' | null; // 役割を追加
  };
}

const ContactPage: NextPage<ContactPageProps> = ({ user }) => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert('お問い合わせを送信しました（実際の処理は未実装です）');
  };

  // ユーザーの役割に応じて、戻るページのURLを決定
  const mypageUrl = user.role === 'partner' ? '/partner/dashboard' : '/mypage';

  return (
    <div className="p-5 max-w-3xl mx-auto my-10">
      {/* リンク先を動的に変更 */}
      <Link href={mypageUrl} className="text-blue-500 hover:underline">← マイページに戻る</Link>
      
      <h1 className="text-3xl font-bold my-6 text-center">お問い合わせ・アプリ希望</h1>
      <div className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4">
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">お名前</label>
            <input className="w-full p-2 border rounded" type="text" />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">メールアドレス</label>
            <input className="w-full p-2 border rounded" type="email" defaultValue={user.email} />
          </div>
          <div className="mb-6">
            <label className="block text-gray-700 text-sm font-bold mb-2">お問い合わせ内容</label>
            <textarea className="w-full p-2 border rounded" rows={5}></textarea>
          </div>
          <div className="text-center">
            <button type="submit" className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded">送信する</button>
          </div>
        </form>
      </div>
    </div>
  );
};

// --- ★★★ ここからが重要な変更点 ★★★ ---
// サーバーサイドで、ユーザーの役割(role)を取得する処理を追加
export const getServerSideProps: GetServerSideProps = async (context) => {
  try {
    const adminAuth = adminAuth();
    const adminDb = getAdminDb();
    const cookies = nookies.get(context);
    const token = await adminAuth.verifySessionCookie(cookies.token, true);
    const { uid, email } = token;

    // Firestoreからユーザーのドキュメントを取得
    const userDoc = await adminDb.collection('users').doc(uid).get();
    const role = userDoc.exists ? userDoc.data()?.role : null;

    return { 
      props: { 
        user: { 
          uid, 
          email: email || '', 
          role // ページに役割を渡す
        } 
      } 
    };
  } catch (error) {
    // ログインしていない場合は、一般ユーザー用のログインページへ
    return { redirect: { destination: '/login', permanent: false } };
  }
};

export default ContactPage;
