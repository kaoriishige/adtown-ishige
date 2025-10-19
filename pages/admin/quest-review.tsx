import { NextPage, GetServerSideProps } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import nookies from 'nookies';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  updateDoc,
  serverTimestamp,
  DocumentData,
  getFirestore,
} from 'firebase/firestore';
import { useState, useEffect } from 'react';
import { app } from '../../lib/firebase';
import { useRouter } from 'next/router';

// Questインターフェースから 'id' を削除
interface Quest extends DocumentData {
  title: string;
  description: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: any;
  createdBy: string;
}

const QuestReviewPage: NextPage = () => {
  const [quests, setQuests] = useState<Quest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const firestore = getFirestore(app);

  const fetchQuests = async () => {
    setLoading(true);
    setError(null);
    try {
      const q = query(
        collection(firestore, 'quests'),
        where('status', '==', 'pending')
      );
      const querySnapshot = await getDocs(q);
      const questList = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as Quest),
      }));
      setQuests(questList);
    } catch (e) {
      console.error('Error fetching quests: ', e);
      setError('クエストの取得中にエラーが発生しました。');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuests();
  }, []);

  const handleStatusUpdate = async (
    id: string,
    newStatus: 'approved' | 'rejected'
  ) => {
    if (
      window.confirm(
        `このクエストを「${newStatus === 'approved' ? '承認' : '却下'}」してもよろしいですか？`
      )
    ) {
      setLoading(true);
      try {
        const questDoc = doc(firestore, 'quests', id);
        await updateDoc(questDoc, {
          status: newStatus,
          reviewedAt: serverTimestamp(),
        });
        await fetchQuests(); // データを再取得してリストを更新
      } catch (e) {
        console.error('Error updating quest status: ', e);
        setError('ステータスの更新中にエラーが発生しました。');
      } finally {
        setLoading(false);
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        クエストを読み込み中...
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center text-red-500">
        {error}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <Head>
        <title>{"クエスト審査 - 管理画面"}</title>
      </Head>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">クエスト審査</h1>
        <Link href="/admin/dashboard" className="text-blue-500 hover:underline">
          ダッシュボードに戻る
        </Link>
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-2xl font-semibold mb-4">
          承認待ちクエスト ({quests.length}件)
        </h2>
        {quests.length === 0 ? (
          <p className="text-gray-500 text-center py-10">
            現在、承認待ちのクエストはありません。
          </p>
        ) : (
          <ul className="divide-y divide-gray-200">
            {quests.map((quest) => (
              <li key={quest.id} className="py-4">
                <h3 className="text-xl font-medium">{quest.title}</h3>
                <p className="text-gray-600 mt-1">{quest.description}</p>
                <div className="mt-4 flex space-x-2">
                  <button
                    onClick={() => handleStatusUpdate(quest.id, 'approved')}
                    className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600"
                  >
                    承認
                  </button>
                  <button
                    onClick={() => handleStatusUpdate(quest.id, 'rejected')}
                    className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
                  >
                    却下
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export const getServerSideProps: GetServerSideProps = async (context) => {
  try {
    const cookies = nookies.get(context);
    if (!cookies.token) {
      return { redirect: { destination: '/admin/login', permanent: false } };
    }

    const token = await adminAuth.verifyIdToken(cookies.token, true);
    const userDoc = await adminDb.collection('users').doc(token.uid).get();

    if (!userDoc.exists || !userDoc.data()?.roles?.includes('admin')) {
      return { redirect: { destination: '/admin/login', permanent: false } };
    }

    return {
      props: {},
    };
  } catch (error) {
    console.error('認証エラー:', error);
    return { redirect: { destination: '/admin/login', permanent: false } };
  }
};

export default QuestReviewPage;