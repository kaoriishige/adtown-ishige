import React, { useState, useEffect } from 'react';
import {
  collection,
  query,
  where,
  getDocs,
  Timestamp,
} from 'firebase/firestore';
import { db, auth } from "@/lib/firebase-client"; 
import { User } from 'firebase/auth';
import Head from 'next/head';
import Link from 'next/link'; // 👈 Linkコンポーネントをインポート
import { RiArrowLeftLine } from 'react-icons/ri'; // 👈 アイコンをインポート

// --- 型定義 ---

interface Candidate {
  id: string; // candidateUid
  name: string;
  matchScore: number; // AIによるマッチ度 (scoutsコレクションから)
  profileSummary: string; // userProfilesコレクションから
  lastLogin: string; // userProfilesコレクションから (表示用に文字列化)
  tags: string[]; // userProfilesコレクションから (skillsを想定)
}

// 候補者カード コンポーネント
const CandidateCard: React.FC<{ candidate: Candidate }> = ({ candidate }) => (
  <div className="bg-white border border-gray-200 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden">
    <div className="p-5">
      <div className="flex justify-between items-center mb-2">
        <h5 className="text-xl font-bold tracking-tight text-gray-900">{candidate.name}</h5>
        <span className="text-sm text-gray-500">最終ログイン: {candidate.lastLogin}</span>
      </div>

      <div className="mb-3">
        <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-orange-600 bg-orange-200">
          マッチ度: {candidate.matchScore}%
        </span>
      </div>
      
      <p className="mb-3 font-normal text-gray-700 h-20 overflow-y-auto">
        {candidate.profileSummary}
      </p>

      <div className="mb-4">
        {candidate.tags.map(tag => (
          <span key={tag} className="text-xs inline-block bg-gray-200 rounded-full px-3 py-1 font-semibold text-gray-700 mr-2 mb-2">
            #{tag}
          </span>
        ))}
      </div>

      <a href={`/profile/${candidate.id}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center px-4 py-2 text-sm font-medium text-center text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:ring-4 focus:outline-none focus:ring-blue-300">
        プロフィール詳細
        <svg className="w-3.5 h-3.5 ml-2" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 14 10">
          <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M1 5h12m0 0L9 1m4 4L9 9"/>
        </svg>
      </a>
    </div>
  </div>
);

// タブ切り替えコンポーネント
const AiScoutListPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'scout' | 'potential'>('scout');
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [recruiterUid, setRecruiterUid] = useState<string | null>(null); // 企業UIDを管理

  // 1. 認証状態の監視 (CSRなので必要)
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user: User | null) => {
      if (user) {
        setRecruiterUid(user.uid);
      } else {
        setRecruiterUid(null);
        setLoading(false);
        setError("認証が必要です。企業アカウントでログインしてください。");
        // 実際はログインページへのリダイレクト router.push('/recruit/login'); が必要
      }
    });
    return () => unsubscribe();
  }, []);

  // 2. データフェッチロジック
  useEffect(() => {
    // 認証待ちまたは認証失敗時はスキップ
    if (!recruiterUid) {
        if (auth.currentUser) setLoading(true); // 認証が完了していない可能性があればローディングを維持
        return;
    }

    const fetchCandidates = async () => {
      setLoading(true);
      setError(null);
      setCandidates([]);

      try {
        // --- ステップ1: scouts コレクションからマッチング情報を取得 ---
        const scoutsQuery = query(
          collection(db, 'scouts'),
          where('recruiterUid', '==', recruiterUid),
          where('type', '==', activeTab) 
          // 必要に応じて where('status', 'in', ['new', 'viewed']) などを追加
        );
        const scoutsSnapshot = await getDocs(scoutsQuery);

        if (scoutsSnapshot.empty) {
          setCandidates([]);
          setLoading(false);
          return;
        }

        const candidateUids = scoutsSnapshot.docs.map(doc => doc.data().candidateUid as string);
        
        // --- ステップ2: userProfiles コレクションから候補者の詳細プロフィールを取得 ---
        
        // Firestoreの IN クエリは最大10個の要素に制限されるため、ここでは最初の10件のみ取得
        // 実運用では、APIルートから一括取得するか、制限を回避するバッチ処理が必要です。
        const limitedUids = candidateUids.slice(0, 10);
        
        const profilesQuery = query(
          collection(db, 'userProfiles'),
          where('userId', 'in', limitedUids)
        );
        const profilesSnapshot = await getDocs(profilesQuery);

        const profilesMap = new Map<string, any>();
        profilesSnapshot.docs.forEach(doc => {
            const data = doc.data();
            profilesMap.set(doc.id, {
                name: data.name || '名前なし',
                profileSummary: data.profileSummary || '概要なし',
                // FirestoreのTimestamp型を文字列に変換 (toLocaleDateStringは簡易版)
                lastLogin: data.lastLogin instanceof Timestamp 
                           ? data.lastLogin.toDate().toLocaleDateString('ja-JP') 
                           : '不明',
                tags: Array.isArray(data.skills) ? data.skills : [], // Firestoreのフィールド名を 'skills' と仮定
            });
        });

        // --- ステップ3: データを結合して Candidates リストを作成 ---
        const mergedCandidates: Candidate[] = scoutsSnapshot.docs
            .filter(doc => profilesMap.has(doc.data().candidateUid)) // プロファイルが存在するもののみ
            .map(doc => {
                const scoutData = doc.data();
                const profileData = profilesMap.get(scoutData.candidateUid);

                return {
                    id: scoutData.candidateUid,
                    name: profileData.name,
                    matchScore: scoutData.matchScore || 0, // スカウト情報から取得
                    profileSummary: profileData.profileSummary,
                    lastLogin: profileData.lastLogin,
                    tags: profileData.tags,
                } as Candidate;
            });
        
        setCandidates(mergedCandidates);

      } catch (err) {
        console.error("候補者リストの取得に失敗:", err);
        setError("データの読み込み中にエラーが発生しました。詳細はコンソールを確認してください。");
      } finally {
        setLoading(false);
      }
    };

    fetchCandidates();

  }, [activeTab, recruiterUid]); // activeTab または認証済みUIDが変更されるたびにデータを再取得


  const renderContent = () => {
    if (error) {
        return <div className="text-center py-10 text-red-600 font-semibold">エラー: {error}</div>;
    }

    if (loading) {
      return <div className="text-center py-10 text-gray-600">候補者リストを読み込み中...</div>;
    }

    if (candidates.length === 0) {
      return <div className="text-center py-10 text-gray-600">現在、{activeTab === 'scout' ? 'スカウト済み' : '潜在'}候補者はいません。</div>;
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {candidates.map(candidate => (
          <CandidateCard key={candidate.id} candidate={candidate} />
        ))}
      </div>
    );
  };

  return (
    <div className="container mx-auto px-4 py-8 bg-gray-50 min-h-screen">
        <Head>
            <title>AIマッチング 候補者リスト</title>
        </Head>
        
        {/* ★★★ 追加された「ダッシュボードに戻る」リンク ★★★ */}
        <Link
          href="/recruit/dashboard"
          className="flex items-center text-sm text-gray-600 hover:text-gray-900 font-semibold mb-6"
        >
          <RiArrowLeftLine className="w-4 h-4 mr-2" /> ダッシュボードに戻る
        </Link>

        <h1 className="text-3xl font-extrabold text-gray-900 mb-6">AIマッチング 候補者リスト</h1>

      {/* タブ */}
      <div className="mb-6">
        <ul className="flex flex-wrap text-sm font-medium text-center text-gray-500 border-b border-gray-200">
          <li className="mr-2">
            <button
              onClick={() => setActiveTab('scout')}
              className={`inline-block p-4 rounded-t-lg ${
                activeTab === 'scout'
                  ? 'text-orange-600 border-b-2 border-orange-600 font-bold'
                  : 'hover:text-gray-600 hover:border-gray-300'
              }`}
            >
              AIスカウト候補者 ({candidates.length})
            </button>
          </li>
          <li>
            <button
              onClick={() => setActiveTab('potential')}
              className={`inline-block p-4 rounded-t-lg ${
                activeTab === 'potential'
                  ? 'text-orange-600 border-b-2 border-orange-600 font-bold'
                  : 'hover:text-gray-600 hover:border-gray-300'
              }`}
            >
              AI厳選の潜在候補者 ({candidates.length})
            </button>
          </li>
        </ul>
      </div>

      {/* タブコンテンツ */}
      <div>
        {renderContent()}
      </div>
    </div>
  );
};

export default AiScoutListPage;