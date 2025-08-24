import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { getFunctions, httpsCallable } from 'firebase/functions';

// ▼▼▼ Firebase Functions の初期化は適切に行ってください ▼▼▼
// import { app } from '../../lib/firebase';
// const functions = getFunctions(app);

// このモック関数は、firebase/functions の onCall 関数を呼び出す実際のコードに置き換えてください
const sendPushNotification = httpsCallable(getFunctions(), 'sendPushNotification');

export default function PushNotificationPage() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [targetUser, setTargetUser] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSending(true);
    setMessage(null);

    const data = {
      title,
      body,
      uid: targetUser || null,
      allUsers: !targetUser,
    };

    try {
      const result = await sendPushNotification(data);
      console.log('Function call result:', result.data);
      setMessage({ type: 'success', text: 'プッシュ通知が正常に送信されました。' });
    } catch (error) {
      console.error('Error sending push notification:', error);
      setMessage({ type: 'error', text: 'プッシュ通知の送信に失敗しました。' });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="p-5 bg-gray-100 min-h-screen">
      <div className="max-w-3xl mx-auto bg-white p-8 rounded-lg shadow-md">
        <div className="mb-6">
          <Link href="/admin" className="text-blue-500 hover:underline">
            ← 管理メニューに戻る
          </Link>
        </div>
        <h1 className="text-3xl font-bold mb-6 text-center">プッシュ通知一斉配信</h1>
        <p className="text-gray-600 mb-8 text-center">
          全ユーザー、または特定のユーザーにプッシュ通知を送信します。
        </p>

        {message && (
          <div className={`p-3 rounded text-center my-4 ${message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700">タイトル</label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
            />
          </div>
          <div>
            <label htmlFor="body" className="block text-sm font-medium text-gray-700">本文</label>
            <textarea
              id="body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={4}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
            ></textarea>
          </div>
          <div>
            <label htmlFor="targetUser" className="block text-sm font-medium text-gray-700">
              送信先ユーザーUID (空欄にすると全ユーザーに送信)
            </label>
            <input
              type="text"
              id="targetUser"
              value={targetUser}
              onChange={(e) => setTargetUser(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
              placeholder="例: zxcd1234..."
            />
          </div>
          <div className="text-center">
            <button
              type="submit"
              disabled={isSending}
              className="w-full py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-300"
            >
              {isSending ? '送信中...' : '通知を送信'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}