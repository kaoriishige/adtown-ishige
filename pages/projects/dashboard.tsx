import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';

// --- 型定義 ---
type ProjectCategory = 'VOLUNTEER' | 'EXCHANGE' | 'DISASTER' | 'REVITALIZATION';

interface Project {
  id: string;
  title: string;
  category: ProjectCategory;
  dateStr: string;
  location: string;
  status: 'active' | 'closed' | 'completed';
  members: number; // 現在の参加者数
  maxMembers?: number;
  unreadNotifications: number; // 新着応募やコメントの数（未読）
}

// --- ダミーデータ: 自分が主催したプロジェクト ---
const MOCK_MY_PROJECTS: Project[] = [
  {
    id: '1',
    title: '那須街道沿いのゴミ拾い活動',
    category: 'VOLUNTEER',
    dateStr: '2025/11/30 (土)',
    location: '那須町 湯本',
    status: 'active',
    members: 5,
    maxMembers: 15,
    unreadNotifications: 2, // 「2件の新しいコメント/応募」
  },
  {
    id: '10',
    title: '【募集終了】古民家リノベーション手伝い',
    category: 'REVITALIZATION',
    dateStr: '2025/10/15 (終了)',
    location: '大田原市',
    status: 'closed',
    members: 8,
    unreadNotifications: 0,
  }
];

// --- ダミーデータ: 自分が参加予定のプロジェクト ---
const MOCK_JOINED_PROJECTS: Project[] = [
  {
    id: '2',
    title: '防災備蓄品の仕分けボランティア',
    category: 'DISASTER',
    dateStr: '2025/12/01 (日)',
    location: '那須塩原市 体育館',
    status: 'active',
    members: 20,
    unreadNotifications: 0,
  }
];

export default function ProjectDashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'organized' | 'joined'>('organized');
  const [myProjects, setMyProjects] = useState<Project[]>([]);
  const [joinedProjects, setJoinedProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // TODO: ここでFirebaseから「自分が作成した投稿」と「参加中の投稿」を取得
    // const q = query(collection(db, 'projects'), where('organizerId', '==', user.uid));

    setTimeout(() => {
      setMyProjects(MOCK_MY_PROJECTS);
      setJoinedProjects(MOCK_JOINED_PROJECTS);
      setLoading(false);
    }, 500);
  }, []);

  // 募集締め切り/再開のトグル処理
  const toggleStatus = (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'closed' : 'active';
    const confirmMsg = newStatus === 'closed'
      ? '募集を締め切りますか？（検索結果に「募集終了」と表示されます）'
      : '募集を再開しますか？';

    if (confirm(confirmMsg)) {
      setMyProjects(prev => prev.map(p => p.id === id ? { ...p, status: newStatus } : p));
      // TODO: Firebase updateDoc(doc(db, 'projects', id), { status: newStatus });
    }
  };

  // 削除処理
  const handleDelete = (id: string) => {
    if (confirm('本当に削除しますか？この操作は取り消せません。')) {
      setMyProjects(prev => prev.filter(p => p.id !== id));
      // TODO: Firebase deleteDoc
    }
  };

  if (loading) return <div className="min-h-screen bg-gray-50 pt-20 text-center">読み込み中...</div>;

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <Head>
        <title>活動管理ダッシュボード | adtown-ishige</title>
      </Head>

      {/* ヘッダーエリア */}
      <div className="bg-white border-b border-gray-200 pt-6 pb-2 px-4 sticky top-0 z-10">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-xl font-bold text-gray-800">マイページ</h1>
          <Link href="/projects/create" className="text-sm bg-blue-600 text-white px-3 py-2 rounded-lg font-bold shadow hover:bg-blue-700 transition">
            ＋ 新規作成
          </Link>
        </div>

        {/* タブ切り替え */}
        <div className="flex gap-6">
          <button
            onClick={() => setActiveTab('organized')}
            className={`pb-3 text-sm font-bold transition-all relative ${activeTab === 'organized' ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600'
              }`}
          >
            主催した活動
            {activeTab === 'organized' && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600 rounded-full"></span>}
          </button>
          <button
            onClick={() => setActiveTab('joined')}
            className={`pb-3 text-sm font-bold transition-all relative ${activeTab === 'joined' ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600'
              }`}
          >
            参加予定
            {activeTab === 'joined' && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600 rounded-full"></span>}
          </button>
        </div>
      </div>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-4">

        {/* --- 主催タブの内容 --- */}
        {activeTab === 'organized' && (
          <>
            {myProjects.length === 0 ? (
              <div className="text-center py-10 bg-white rounded-xl border border-dashed border-gray-300">
                <p className="text-gray-400 mb-4">まだ活動を作成していません</p>
                <Link href="/projects/create" className="text-blue-600 font-bold underline">
                  最初の活動を作ってみる
                </Link>
              </div>
            ) : (
              myProjects.map((project) => (
                <div key={project.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">

                  {/* カードヘッダー: ステータスとタイトル */}
                  <div className="p-4 border-b border-gray-100">
                    <div className="flex justify-between items-start mb-2">
                      <span className={`text-xs px-2 py-1 rounded font-bold ${project.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-500'
                        }`}>
                        {project.status === 'active' ? '募集中' : '募集終了'}
                      </span>
                      <span className="text-xs text-gray-400">{project.dateStr}</span>
                    </div>
                    <Link href={`/projects/${project.id}`}>
                      <h3 className="font-bold text-gray-800 text-lg hover:text-blue-600 transition">
                        {project.title}
                      </h3>
                    </Link>
                  </div>

                  {/* カードボディ: 数値データ */}
                  <div className="px-4 py-3 flex gap-6 text-sm">
                    <div>
                      <span className="block text-xs text-gray-400">参加者</span>
                      <span className="font-bold text-gray-700 text-lg">{project.members}</span>
                      <span className="text-xs text-gray-400">
                        {project.maxMembers ? ` / ${project.maxMembers}` : '名'}
                      </span>
                    </div>
                    <div>
                      <span className="block text-xs text-gray-400">通知</span>
                      {project.unreadNotifications > 0 ? (
                        <span className="font-bold text-red-500 text-lg">● {project.unreadNotifications}</span>
                      ) : (
                        <span className="font-bold text-gray-300 text-lg">0</span>
                      )}
                    </div>
                  </div>

                  {/* カードフッター: アクションボタン */}
                  <div className="bg-gray-50 px-4 py-3 flex justify-between items-center">
                    <Link href={`/projects/${project.id}`} className="text-sm text-gray-600 font-bold hover:underline">
                      確認する
                    </Link>

                    <div className="flex gap-2">
                      <button
                        onClick={() => toggleStatus(project.id, project.status)}
                        className={`text-xs px-3 py-2 rounded border font-bold transition ${project.status === 'active'
                            ? 'bg-white border-orange-200 text-orange-600 hover:bg-orange-50'
                            : 'bg-white border-green-200 text-green-600 hover:bg-green-50'
                          }`}
                      >
                        {project.status === 'active' ? '締め切る' : '再開する'}
                      </button>

                      <button
                        onClick={() => handleDelete(project.id)}
                        className="text-xs px-3 py-2 rounded border border-gray-200 bg-white text-gray-400 hover:text-red-600 hover:border-red-200 transition"
                      >
                        削除
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </>
        )}

        {/* --- 参加予定タブの内容 --- */}
        {activeTab === 'joined' && (
          <>
            {joinedProjects.length === 0 ? (
              <div className="text-center py-10 text-gray-400">
                参加予定のプロジェクトはありません
              </div>
            ) : (
              joinedProjects.map((project) => (
                <Link href={`/projects/${project.id}`} key={project.id} className="block bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-3 hover:shadow-md transition">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded">参加予定</span>
                    <span className="text-xs text-gray-400">{project.dateStr}</span>
                  </div>
                  <h3 className="font-bold text-gray-800 mb-1">{project.title}</h3>
                  <p className="text-xs text-gray-500">📍 {project.location}</p>
                </Link>
              ))
            )}
          </>
        )}

      </main>

      {/* 共通フッターメニューがあればここに配置 */}
    </div>
  );
}