import { useEffect, useState } from 'react';
import { getFirestore, collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { app } from '../../lib/firebase';
import Link from 'next/link';
import Head from 'next/head';
import { RiContactsLine } from 'react-icons/ri';

export default function UserDashboard() {
  const [matches, setMatches] = useState<any[]>([]);
  const [contacts, setContacts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const auth = getAuth();
    const db = getFirestore(app);

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) return;
      // --- AIスコア順求人 ---
      const matchQuery = query(
        collection(db, 'matches'),
        where('userId', '==', user.uid),
        orderBy('score', 'desc')
      );
      const matchSnap = await getDocs(matchQuery);
      const matchData = matchSnap.docs.map((d) => d.data());
      setMatches(matchData);

      // --- 双方承諾済み（連絡先交換） ---
      const contactQuery = query(
        collection(db, 'jobApplicants'),
        where('userId', '==', user.uid),
        where('matchStatus', '==', 'agreed')
      );
      const contactSnap = await getDocs(contactQuery);
      const contactData = contactSnap.docs.map((d) => d.data());
      setContacts(contactData);

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) return <div className="p-6">読み込み中...</div>;

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <Head>
        <title>マイダッシュボード｜AI求人マッチング</title>
      </Head>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">あなたへのおすすめ求人</h1>

        {/* --- AIスコア順求人 --- */}
        {matches.length === 0 ? (
          <p className="text-gray-600">まだおすすめ求人がありません。</p>
        ) : (
          <ul className="space-y-4">
            {matches.map((m) => (
              <li key={m.jobId} className="bg-white border p-4 rounded-xl shadow-sm hover:shadow-md transition">
                <p className="text-sm text-gray-500 mb-1">AIスコア: <span className="font-bold text-indigo-600">{m.score}</span></p>
                <p className="text-gray-800 font-semibold mb-1">{m.jobTitle || '求人タイトル未設定'}</p>
                <p className="text-sm text-gray-600">{(m.reasons || []).join('・')}</p>
                <Link href={`/users/job/${m.jobId}`} className="text-blue-600 text-sm underline mt-2 inline-block">
                  求人詳細を見る
                </Link>
              </li>
            ))}
          </ul>
        )}

        {/* --- 双方承諾済み（連絡先交換） --- */}
        <section className="mt-12">
          <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
            <RiContactsLine className="text-green-500 mr-2" size={24} />
            双方承諾済み（連絡先交換）
          </h2>
          <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
            {contacts.length === 0 ? (
              <p className="text-gray-600">まだマッチ成立中の企業はありません。</p>
            ) : (
              <ul className="divide-y divide-gray-200">
                {contacts.map((c) => (
                  <li key={c.id} className="py-4">
                    <p className="font-semibold text-gray-800">{c.companyName || '企業名非公開'}</p>
                    <p className="text-sm text-gray-600 mb-1">求人タイトル: {c.jobTitle || '未設定'}</p>
                    <p className="text-sm text-gray-800 font-medium">📞 連絡先: {c.contactInfo || '非公開'}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
