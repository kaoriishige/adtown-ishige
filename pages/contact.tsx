import { useState } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import Link from 'next/link';

const ContactPage = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !message.trim()) {
      alert('すべての項目を入力してください。');
      return;
    }
    setIsLoading(true);

    try {
      await addDoc(collection(db, 'inquiries'), {
        name: name,
        email: email,
        message: message,
        status: '新規',
        createdAt: serverTimestamp(),
      });
      setIsSent(true);
    } catch (error) {
      console.error("Error sending inquiry: ", error);
      alert('送信中にエラーが発生しました。');
      setIsLoading(false);
    }
  };

  // 送信完了後のメッセージ
  if (isSent) {
    return (
      <div className="p-5 max-w-xl mx-auto my-10 text-center">
        <h1 className="text-3xl font-bold mb-6">送信完了</h1>
        <p>お問い合わせいただき、誠にありがとうございます。</p>
        
        {/* ▼▼ 「マイページに戻る」リンクを追加 ▼▼ */}
        <Link href="/mypage" className="text-blue-500 hover:underline mt-8 inline-block">
          マイページに戻る
        </Link>
      </div>
    );
  }

  // フォームの表示
  return (
    <div className="p-5 max-w-xl mx-auto my-10">
      <h1 className="text-3xl font-bold mb-6 text-center">お問い合わせ</h1>
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label htmlFor="name" className="block text-gray-700 font-bold mb-2">お名前</label>
          <input
            type="text"
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            required
          />
        </div>
        <div className="mb-4">
          <label htmlFor="email" className="block text-gray-700 font-bold mb-2">メールアドレス</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            required
          />
        </div>
        <div className="mb-6">
          <label htmlFor="message" className="block text-gray-700 font-bold mb-2">お問い合わせ内容</label>
          <textarea
            id="message"
            rows={6}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            required
          />
        </div>
        <div className="text-center">
          <button
            type="submit"
            disabled={isLoading}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline disabled:bg-gray-400"
          >
            {isLoading ? '送信中...' : '送信する'}
          </button>
        </div>
      </form>

      {/* ▼▼ フォームの下に「マイページに戻る」リンクを追加 ▼▼ */}
      <div className="text-center mt-8">
        <Link href="/mypage" className="text-gray-600 hover:text-blue-600 hover:underline">
          マイページに戻る
        </Link>
      </div>
    </div>
  );
};

export default ContactPage;
