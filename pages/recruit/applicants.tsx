import { useEffect, useState } from 'react';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, query, where, getDocs } from 'firebase/firestore';
import { app } from '../../lib/firebase';
import Link from 'next/link';
import Head from 'next/head';
import {
  RiUserSearchLine,
  RiCheckFill,
  RiCloseCircleLine,
  RiSendPlaneFill,
  RiContactsLine,
} from 'react-icons/ri';

export default function ApplicantsPage() {
  const [applicants, setApplicants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uid, setUid] = useState<string>('');

  useEffect(() => {
    const auth = getAuth(app);
    const db = getFirestore(app);

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) return;
      setUid(user.uid);

      // --- Firestoreから応募データを取得 ---
      const q = query(collection(db, 'jobApplicants'), where('partnerId', '==', user.uid));
      const snap = await getDocs(q);
      const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setApplicants(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) return <div className="p-6">読み込み中...</div>;

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <Head>
        <title>応募者一覧 | AI求人パートナー</title>
      </Head>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <h1 className="text-3xl font-bold text-gray-900 mb-8 flex items-center">
          <RiUserSearchLine className="text-indigo-500 mr-2" size={28} />
          応募者一覧（AIスコア付き）
        </h1>

        {applicants.length === 0 ? (
          <p className="text-gray-600">まだ応募者はいません。</p>
        ) : (
          <ul className="space-y-4">
            {applicants.map((a) => (
              <li
                key={a.id}
                className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition"
              >
                <div className="flex justify-between items-start flex-wrap">
                  <div>
                    <p className="font-semibold text-gray-800">{a.name || '匿名ユーザー'}</p>
                    <p className="text-sm text-gray-600">
                      希望職種: {a.desiredJob || '未設定'}
                    </p>
                    <p className="text-sm text-gray-600">
                      スキル: {a.skills || '未登録'}
                    </p>
                    {a.score && (
                      <p className="text-sm text-indigo-600 mt-1">
                        AIスコア: <span className="font-bold">{a.score}</span>
                      </p>
                    )}
                    {a.reasons && a.reasons.length > 0 && (
                      <p className="text-xs text-gray-500 mt-1">
                        {a.reasons.join('・')}
                      </p>
                    )}
                    <p className="text-xs text-gray-400 mt-1">
                      応募日: {a.appliedAt?.toDate?.()?.toLocaleString?.() || '---'}
                    </p>
                  </div>

                  <div className="flex flex-col gap-2 mt-4 md:mt-0">
                    <button
                      onClick={() => alert(`${a.name || 'この応募者'} さんを承諾しました`)}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg flex items-center justify-center gap-1 text-sm shadow hover:bg-green-700"
                    >
                      <RiCheckFill /> 承諾
                    </button>
                    <button
                      onClick={() => alert(`${a.name || 'この応募者'} さんにスカウト送信`)}
                      className="px-4 py-2 bg-purple-600 text-white rounded-lg flex items-center justify-center gap-1 text-sm shadow hover:bg-purple-700"
                    >
                      <RiSendPlaneFill /> スカウト
                    </button>
                    <button
                      onClick={() => alert(`${a.name || 'この応募者'} さんを見送りました`)}
                      className="px-4 py-2 bg-gray-500 text-white rounded-lg flex items-center justify-center gap-1 text-sm shadow hover:bg-gray-600"
                    >
                      <RiCloseCircleLine /> 見送り
                    </button>
                  </div>
                </div>

                {a.matchStatus === 'agreed' && (
                  <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
                    <RiContactsLine className="text-green-500" />
                    <span className="text-sm text-gray-700">
                      📞 双方承諾済み：連絡先 {a.contactInfo || '非公開'}
                    </span>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}

