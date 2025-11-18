import React, { useState, useEffect } from 'react';
// import { getFirestore, collection, query, where, getDocs } from 'firebase/firestore';
// import { getAuth } from 'firebase/auth';

// 実際のFirebaseインスタンスをインポート/取得する必要があります
// import { db, auth } from '../../lib/firebase';

// 候補者のデータ型（サンプル）
interface Candidate {
  id: string;
  name: string;
  matchScore: number; // AIによるマッチ度
  profileSummary: string;
  lastLogin: string;
  tags: string[];
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

// モックデータ（実際はFirestoreなどから取得）
const MOCK_SCOUT_CANDIDATES: Candidate[] = [
  { id: 'c001', name: '候補者A (スカウト)', matchScore: 92, profileSummary: 'React, TypeScriptでのフロントエンド開発経験5年。UI/UXデザインにも関心があります。貴社の〇〇プロジェクトに即戦力として貢献できると確信しております。', lastLogin: '3日前', tags: ['React', 'TypeScript', '即戦力'] },
  { id: 'c002', name: '候補者B (スカウト)', matchScore: 88, profileSummary: 'Ruby on Railsを用いたバックエンド開発が専門。インフラ構築 (AWS) も一任ください。', lastLogin: '1日前', tags: ['Rails', 'AWS', 'Go'] },
];

const MOCK_POTENTIAL_CANDIDATES: Candidate[] = [
  { id: 'c003', name: '候補者C (潜在)', matchScore: 85, profileSummary: '未経験からWebデザイナーに転職希望。ポートフォリオを意欲的に作成中。ポテンシャル採用を希望します。', lastLogin: '5時間前', tags: ['Webデザイン', 'Figma', 'ポテンシャル'] },
  { id: 'c004', name: '候補者D (潜在)', matchScore: 81, profileSummary: '現職は営業ですが、独学でPython (Django) を学習中。データ分析業務に関心があります。', lastLogin: '1週間前', tags: ['Python', 'Django', 'データ分析'] },
  { id: 'c005', name: '候補者E (潜在)', matchScore: 79, profileSummary: 'Java (Spring) でのSIer経験3年。自社サービス開発企業への転職を検討しています。', lastLogin: '2日前', tags: ['Java', 'Spring', 'SaaS'] },
];

// タブ切り替えコンポーネント
const AiScoutListPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'scout' | 'potential'>('scout');
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);

  // 実際はここで Firestore からデータをフェッチします
  useEffect(() => {
    setLoading(true);
    // 
    // const fetchCandidates = async () => {
    //   try {
    //     // ここで 'scout' か 'potential' に応じて
    //     // Firestoreへのクエリ (getDocs) を実行します
    //     // const q = query(collection(db, 'candidates'), where('type', '==', activeTab));
    //     // const snapshot = await getDocs(q);
    //     // const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Candidate));
    //
    //     // ↓↓↓ モックデータの使用 (2秒待機をシミュレート) ↓↓↓
    //     await new Promise(resolve => setTimeout(resolve, 500));
    //     if (activeTab === 'scout') {
    //       setCandidates(MOCK_SCOUT_CANDIDATES);
    //     } else {
    //       setCandidates(MOCK_POTENTIAL_CANDIDATES);
    //     }
    //
    //   } catch (err) {
    //     console.error("候補者リストの取得に失敗:", err);
    //   } finally {
    //     setLoading(false);
    //   }
    // };
    // fetchCandidates();

    // モックデータ用の簡易版
    if (activeTab === 'scout') {
      setCandidates(MOCK_SCOUT_CANDIDATES);
    } else {
      setCandidates(MOCK_POTENTIAL_CANDIDATES);
    }
    setLoading(false);

  }, [activeTab]); // activeTab が切り替わるたびにデータを再取得

  const renderContent = () => {
    if (loading) {
      return <div className="text-center py-10 text-gray-600">候補者リストを読み込み中...</div>;
    }

    if (candidates.length === 0) {
      return <div className="text-center py-10 text-gray-600">該当する候補者が見つかりません。</div>;
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
              AIスカウト候補者 ( {MOCK_SCOUT_CANDIDATES.length} )
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
              AI厳選の潜在候補者 ( {MOCK_POTENTIAL_CANDIDATES.length} )
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