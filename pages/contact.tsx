import { GetServerSideProps, NextPage } from 'next';
import Link from 'next/link';
import nookies from 'nookies';
import { getAdminAuth } from '../lib/firebase-admin';

const ContactPage: NextPage = () => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert('お問い合わせを送信しました（実際の処理は未実装です）');
  };

  return (
    <div className="p-5 max-w-3xl mx-auto my-10">
      <Link href="/mypage" className="text-blue-500 hover:underline">← マイページに戻る</Link>
      <h1 className="text-3xl font-bold my-6 text-center">お問い合わせ・アプリ希望</h1>
      <div className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4">
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">お名前</label>
            <input className="w-full p-2 border rounded" type="text" />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">メールアドレス</label>
            <input className="w-full p-2 border rounded" type="email" />
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

export const getServerSideProps: GetServerSideProps = async (context) => {
  try {
    const cookies = nookies.get(context);
    const token = await getAdminAuth().verifySessionCookie(cookies.token, true);
    return { props: { user: { uid: token.uid, email: token.email || '' } } };
  } catch (error) {
    return { redirect: { destination: '/login', permanent: false } };
  }
};

export default ContactPage;
