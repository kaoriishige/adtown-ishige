import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { 
  Plus, 
  Trash2, 
  CheckCircle, 
  Circle, 
  LogOut, 
  Layout, 
  ListTodo, 
  Folder, 
  Menu, 
  X,
  Loader2,
  AlertCircle,
  FolderPlus,
  MapPin,
  User,
  Calendar,
  Info
} from 'lucide-react';

import { auth, db } from '../../lib/firebase'; 
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { 
  doc, 
  getDoc, 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot, 
  query, 
  serverTimestamp 
} from 'firebase/firestore';

// --- 静的な例題データ (index.tsxと共通) ---
const DEMO_PROJECTS = [
  {
    id: 'demo-1',
    name: '【例題】那須街道沿いのゴミ拾い活動に参加しませんか？',
    category: 'ボランティア・清掃',
    location: '那須町 湯本周辺',
    organizer: '那須クリーン隊',
    date: '2025/11/30 (土)',
    description: '観光シーズン後のゴミ拾いを行います。軍手とゴミ袋はこちらで用意します。',
    // デモ用の初期タスク
    demoTasks: [
      { id: 'dt-1', text: '集合場所（那須観光センター前）を確認する', completed: false },
      { id: 'dt-2', text: '動きやすい服装を準備する', completed: true },
      { id: 'dt-3', text: '参加登録フォームを送信する', completed: false },
    ]
  },
  {
    id: 'demo-2',
    name: '【例題】古民家カフェで英会話＆交流会',
    category: '交流・文化・趣味',
    location: '那須塩原市 黒磯',
    organizer: 'Cafe Nasu Base',
    date: '2025/12/05 (木)',
    description: '初心者歓迎！コーヒーを飲みながら楽しく英語を話しましょう。',
    demoTasks: [
      { id: 'dt-1', text: '自己紹介のフレーズを考えておく', completed: false },
      { id: 'dt-2', text: '参加費（500円）を用意する', completed: false },
    ]
  },
  {
    id: 'demo-3',
    name: '【例題】余っている毛布があれば提供をお願いします',
    category: '防災・緊急支援',
    location: '那須町 高久',
    organizer: '防災ネットワーク',
    date: '2025/11/24 まで',
    description: '避難所訓練で使用する毛布が不足しています。新品または洗濯済みのものをお願いします。',
    demoTasks: [
      { id: 'dt-1', text: '自宅の押し入れを確認する', completed: true },
      { id: 'dt-2', text: '集荷場所に持っていく', completed: false },
    ]
  }
];

export default function ProjectApp() {
  const router = useRouter();
  const { id } = router.query; 

  // --- State ---
  const [user, setUser] = useState<any>(null);
  const [projects, setProjects] = useState<any[]>([]); // サイドバー用（リアルデータ）
  
  // 表示中のデータ
  const [currentProject, setCurrentProject] = useState<any>(null); 
  const [tasks, setTasks] = useState<any[]>([]); 
  
  const [newTask, setNewTask] = useState('');
  const [newProjectName, setNewProjectName] = useState('');
  
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [error, setError] = useState('');

  // デモかどうか判定
  const isDemo = typeof id === 'string' && id.startsWith('demo-');

  // 1. ユーザー認証
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (!currentUser) setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // 2. プロジェクト一覧の取得（サイドバー用）
  useEffect(() => {
    // ログインしていなくてもデモは見れるようにするが、リアルデータ取得はユーザーがいるか、ルールが許可されている場合のみ
    const q = query(collection(db, 'projects'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      // 新しい順
      data.sort((a: any, b: any) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
      setProjects(data);
    }, (err) => {
      console.error("Sidebar load error:", err);
      // エラーでもサイドバーのデモ表示は止めない
    });

    return () => unsubscribe();
  }, []);

  // 3. 詳細データの取得 (Firestore または デモデータ)
  useEffect(() => {
    if (!id) return;

    setLoading(true);
    setError('');

    // === パターンA: デモデータ ===
    if (isDemo) {
      const demoData = DEMO_PROJECTS.find(p => p.id === id);
      if (demoData) {
        setCurrentProject(demoData);
        // デモタスクをセット（ローカルのみ）
        setTasks(demoData.demoTasks || []);
      } else {
        setCurrentProject(null);
        setError('指定された例題が見つかりません');
      }
      setLoading(false);
      return;
    }

    // === パターンB: Firestoreリアルデータ ===
    // 1. プロジェクト情報
    const fetchProject = async () => {
      try {
        const docRef = doc(db, 'projects', id as string);
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          setCurrentProject({ id: snap.id, ...snap.data() });
        } else {
           setCurrentProject(null);
        }
      } catch (e: any) { 
        console.error(e);
        setError('プロジェクトの読み込みに失敗しました');
      }
    };
    fetchProject();

    // 2. タスク一覧 (リアルタイム)
    const tasksQ = query(collection(db, 'projects', id as string, 'tasks'));
    const unsubscribe = onSnapshot(tasksQ, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      // 作成順ソート
      data.sort((a: any, b: any) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
      setTasks(data);
      setLoading(false);
    }, (err) => {
      console.error("Task load error:", err);
      if (err.code === 'permission-denied') {
        setError('権限エラー: ログインが必要です。');
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [id, isDemo]);

  // --- Actions ---

  const handleSelectProject = (projectId: string) => {
    router.push(`/projects/${projectId}`);
    setMobileMenuOpen(false);
  };

  const handleAddProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;
    if (!user) {
      alert("プロジェクトを作成するにはログインが必要です");
      return;
    }
    try {
      const docRef = await addDoc(collection(db, 'projects'), {
        name: newProjectName.trim(),
        createdAt: serverTimestamp(),
        createdBy: user.uid
      });
      setNewProjectName('');
      router.push(`/projects/${docRef.id}`); 
    } catch (e) { console.error(e); }
  };

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTask.trim()) return;
    
    if (isDemo) {
      // デモの場合はアラートを出すだけ（またはローカルstateに追加する擬似動作も可）
      alert('これは例題ページのため、データは保存されません。');
      return;
    }

    if (!user) {
      alert('タスクを追加するにはログインが必要です');
      return;
    }

    try {
      await addDoc(collection(db, 'projects', id as string, 'tasks'), {
        text: newTask.trim(),
        completed: false,
        createdAt: serverTimestamp()
      });
      setNewTask('');
    } catch (e) { console.error(e); }
  };

  const toggleTask = async (taskId: string, current: boolean) => {
    if (isDemo) {
      // デモならローカルstateだけ更新して「動いた感」を出す
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, completed: !current } : t));
      return;
    }
    if (!user) return; // ログインチェック
    await updateDoc(doc(db, 'projects', id as string, 'tasks', taskId), { completed: !current });
  };

  const deleteTask = async (taskId: string) => {
    if (isDemo) {
      alert('例題のタスクは削除できません');
      return;
    }
    if (!user) return;
    await deleteDoc(doc(db, 'projects', id as string, 'tasks', taskId));
  };

  const deleteProject = async (projectId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (isDemo) return; // デモは削除不可
    if (!user || !confirm('本当に削除しますか？')) return;
    
    try {
      await deleteDoc(doc(db, 'projects', projectId));
      if (id === projectId) router.push('/projects'); 
    } catch(e) { console.error(e); }
  };

  // --- Render ---

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50">
        <Loader2 className="animate-spin text-blue-500 w-8 h-8" />
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-100 font-sans text-gray-800 overflow-hidden">
      <Head><title>{currentProject?.name || '詳細'} | Task App</title></Head>

      {/* --- サイドバー --- */}
      <aside className={`
        fixed md:static inset-y-0 left-0 z-30
        w-64 bg-white border-r border-gray-200 transform transition-transform duration-200 ease-in-out
        ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
        md:translate-x-0 flex flex-col shadow-xl md:shadow-none
      `}>
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <div 
            className="flex items-center gap-2 text-blue-600 font-bold text-lg cursor-pointer hover:opacity-80"
            onClick={() => router.push('/projects')}
          >
            <Layout className="w-6 h-6" />
            <span>Task App</span>
          </div>
          <button onClick={() => setMobileMenuOpen(false)} className="md:hidden text-gray-500">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          
          {/* リアルプロジェクト一覧 */}
          <div className="text-xs font-bold text-gray-400 px-3 py-2 uppercase tracking-wider">
            プロジェクト
          </div>
          {projects.length > 0 ? (
            projects.map(p => (
              <div
                key={p.id}
                onClick={() => handleSelectProject(p.id)}
                className={`
                  group flex items-center justify-between p-2.5 rounded-lg cursor-pointer transition-colors
                  ${id === p.id ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-600 hover:bg-gray-50'}
                `}
              >
                <div className="flex items-center gap-2 overflow-hidden">
                  <Folder className={`w-4 h-4 flex-shrink-0 ${id === p.id ? 'text-blue-500' : 'text-gray-400'}`} />
                  <span className="truncate text-sm">{p.name}</span>
                </div>
                {id === p.id && (
                  <button 
                    onClick={(e) => deleteProject(p.id, e)}
                    className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-50 hover:text-red-500 rounded"
                    title="削除"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))
          ) : (
            <div className="px-3 py-2 text-xs text-gray-400">まだありません</div>
          )}

          <div className="my-4 border-t border-gray-100"></div>

          {/* 例題一覧 */}
          <div className="text-xs font-bold text-gray-400 px-3 py-2 uppercase tracking-wider">
            例題（デモ）
          </div>
          {DEMO_PROJECTS.map(demo => (
            <div
              key={demo.id}
              onClick={() => handleSelectProject(demo.id)}
              className={`
                flex items-center gap-2 p-2.5 rounded-lg cursor-pointer transition-colors
                ${id === demo.id ? 'bg-green-50 text-green-700 font-medium' : 'text-gray-600 hover:bg-gray-50'}
              `}
            >
              <Info className={`w-4 h-4 flex-shrink-0 ${id === demo.id ? 'text-green-600' : 'text-gray-400'}`} />
              <span className="truncate text-sm">{demo.name}</span>
            </div>
          ))}
        </div>

        {/* サイドバー下部 (作成 & ログアウト) */}
        <div className="p-4 border-t border-gray-100 bg-gray-50">
          <form onSubmit={handleAddProject} className="flex gap-2 mb-3">
            <input
              className="flex-1 min-w-0 px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:border-blue-500 bg-white"
              placeholder="新規作成..."
              value={newProjectName}
              onChange={e => setNewProjectName(e.target.value)}
            />
            <button type="submit" disabled={!newProjectName} className="p-2 bg-blue-600 text-white rounded-md disabled:opacity-50 hover:bg-blue-700">
              <Plus className="w-4 h-4" />
            </button>
          </form>
          
          {user ? (
            <button onClick={() => signOut(auth)} className="flex items-center gap-2 text-xs text-gray-500 hover:text-gray-800 w-full px-1">
              <LogOut className="w-3 h-3" /> ログアウト
            </button>
          ) : (
            <div className="text-xs text-gray-400 text-center">ログインしていません</div>
          )}
        </div>
      </aside>

      {/* モバイル用オーバーレイ */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 bg-black/50 z-20 md:hidden" onClick={() => setMobileMenuOpen(false)} />
      )}

      {/* --- メインコンテンツ --- */}
      <main className="flex-1 flex flex-col min-w-0 bg-white md:bg-gray-50 relative">
        {/* モバイルヘッダー */}
        <header className="md:hidden bg-white border-b border-gray-200 p-4 flex items-center gap-3 sticky top-0 z-10">
          <button onClick={() => setMobileMenuOpen(true)} className="text-gray-600">
            <Menu className="w-6 h-6" />
          </button>
          <h1 className="font-bold text-gray-800 truncate text-sm">
            {currentProject?.name || '詳細'}
          </h1>
        </header>

        {/* メインエリア */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-3xl mx-auto h-full">
            
            {currentProject ? (
              <>
                {/* デスクトップ用ヘッダー情報 */}
                <div className="mb-8">
                  <div className="flex flex-wrap items-center gap-2 text-sm text-gray-500 mb-3">
                    <span className={`px-2 py-0.5 rounded text-xs font-bold ${isDemo ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                      {currentProject.category || (isDemo ? '例題' : 'プロジェクト')}
                    </span>
                    {currentProject.date && (
                      <span className="flex items-center gap-1 bg-white px-2 py-0.5 rounded border border-gray-100">
                        <Calendar className="w-3 h-3" />
                        {currentProject.date}
                      </span>
                    )}
                  </div>
                  
                  <h2 className="text-2xl font-bold text-gray-800 mb-4 leading-tight">
                    {currentProject.name}
                  </h2>
                  
                  {/* 詳細情報（場所・主催者） */}
                  {(currentProject.location || currentProject.organizer) && (
                    <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-4">
                      {currentProject.location && (
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-4 h-4 text-gray-400" />
                          {currentProject.location}
                        </div>
                      )}
                      {currentProject.organizer && (
                        <div className="flex items-center gap-1.5">
                          <User className="w-4 h-4 text-gray-400" />
                          {currentProject.organizer}
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* 説明文 */}
                  {currentProject.description && (
                    <div className="bg-white p-5 rounded-xl border border-gray-200 text-sm text-gray-600 leading-relaxed shadow-sm">
                      {currentProject.description}
                    </div>
                  )}
                </div>

                {error && (
                  <div className="mb-6 bg-red-50 text-red-700 p-4 rounded-lg flex gap-2 items-center text-sm border border-red-100">
                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                    {error}
                  </div>
                )}

                {/* タスクエリア */}
                <div>
                  <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <ListTodo className="w-5 h-5 text-blue-500" />
                    {isDemo ? '活動の手順・タスク' : 'タスクリスト'}
                  </h3>

                  {/* タスク追加フォーム */}
                  <form onSubmit={handleAddTask} className="mb-4 relative">
                    <input
                      type="text"
                      value={newTask}
                      onChange={(e) => setNewTask(e.target.value)}
                      placeholder={isDemo ? "例題のため追加できません" : "新しいタスクを追加..."}
                      disabled={isDemo}
                      className="w-full pl-4 pr-12 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all disabled:bg-gray-50 disabled:text-gray-400 shadow-sm"
                    />
                    {!isDemo && (
                      <button
                        type="submit"
                        disabled={!newTask.trim()}
                        className="absolute right-2 top-2 bottom-2 aspect-square bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg flex items-center justify-center transition-all"
                      >
                        <Plus className="w-5 h-5" />
                      </button>
                    )}
                  </form>

                  {/* タスクリスト表示 */}
                  <div className="space-y-2.5">
                    {tasks.length === 0 ? (
                      <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50/50">
                        <p className="text-gray-400 text-sm">タスクがまだありません</p>
                      </div>
                    ) : (
                      tasks.map(task => (
                        <div
                          key={task.id}
                          className={`
                            group flex items-start gap-3 p-4 bg-white rounded-xl border transition-all duration-200
                            ${task.completed 
                              ? 'border-gray-100 bg-gray-50/50' 
                              : 'border-gray-200 hover:border-blue-300 hover:shadow-sm'
                            }
                          `}
                        >
                          <button
                            onClick={() => toggleTask(task.id, task.completed)}
                            className={`mt-0.5 flex-shrink-0 transition-colors ${
                              task.completed ? 'text-green-500' : 'text-gray-300 hover:text-blue-500'
                            }`}
                          >
                            {task.completed ? <CheckCircle className="w-5 h-5" /> : <Circle className="w-5 h-5" />}
                          </button>
                          
                          <span className={`flex-1 text-sm leading-relaxed pt-0.5 ${task.completed ? 'text-gray-400 line-through' : 'text-gray-800'}`}>
                            {task.text}
                          </span>

                          {!isDemo && (
                            <button
                              onClick={() => deleteTask(task.id)}
                              className="opacity-0 group-hover:opacity-100 p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                              title="削除"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </>
            ) : (
              // プロジェクト未選択時
              <div className="flex flex-col items-center justify-center h-full pb-20 text-gray-400">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-6">
                  <FolderPlus className="w-8 h-8 text-gray-300" />
                </div>
                <h2 className="text-lg font-bold text-gray-600 mb-2">プロジェクトが見つかりません</h2>
                <p className="text-center max-w-xs text-sm leading-relaxed">
                  サイドバーからプロジェクトを選択するか、<br/>
                  新しいプロジェクトを作成してください。
                </p>
              </div>
            )}

          </div>
        </div>
      </main>
    </div>
  );
}