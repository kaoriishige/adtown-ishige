import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { 
  Plus, 
  MapPin, 
  User, 
  Loader2, 
  Layout, 
  AlertCircle,
  Calendar
} from 'lucide-react';

import { auth, db } from '../../lib/firebase'; 
import { onAuthStateChanged } from 'firebase/auth';
import { collection, onSnapshot, query, addDoc, serverTimestamp } from 'firebase/firestore';

// --- 静的な例題データ (削除されずに残ります) ---
const DEMO_PROJECTS = [
  {
    id: 'demo-1',
    name: '【例題】那須街道沿いのゴミ拾い活動に参加しませんか？',
    category: 'ボランティア・清掃',
    tags: ['清掃活動', 'ボランティア'],
    location: '那須町 湯本周辺',
    organizer: '那須クリーン隊',
    date: '2025/11/30 (土)',
    isDemo: true // デモ識別用
  },
  {
    id: 'demo-2',
    name: '【例題】古民家カフェで英会話＆交流会',
    category: '交流・文化・趣味',
    tags: ['地域交流', '学習会'],
    location: '那須塩原市 黒磯',
    organizer: 'Cafe Nasu Base',
    date: '2025/12/05 (木)',
    isDemo: true
  },
  {
    id: 'demo-3',
    name: '【例題】余っている毛布があれば提供をお願いします',
    category: '防災・緊急支援',
    tags: ['物資提供', '助け合い'],
    location: '那須町 高久',
    organizer: '防災ネットワーク',
    date: '2025/11/24 まで',
    isDemo: true
  }
];

export default function ProjectsIndex() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null); 
  
  // Firestoreのデータ + デモデータを管理
  const [realProjects, setRealProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [activeTab, setActiveTab] = useState('すべて');

  // 1. 認証状態の監視
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  // 2. Firestoreからプロジェクト一覧を取得
  useEffect(() => {
    // ログインに関わらず読み込みを試みる（ゲスト閲覧用）
    const q = query(collection(db, 'projects'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data(),
        // Firestoreデータ用の表示フォーマット調整
        category: '新規プロジェクト', 
        tags: ['募集中'],
        location: '場所未定',
        organizer: '匿名ユーザー',
        isDemo: false
      }));
      
      // 新しい順にソート
      data.sort((a: any, b: any) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
      
      setRealProjects(data);
      setLoading(false);
    }, (err) => {
      console.error("Error:", err);
      // エラーでもデモデータは見せるのでローディングは解除
      if (err.code === 'permission-denied') {
        setError('※現在、新規データの読み込み権限がありません（デモのみ表示中）');
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // 新規投稿作成
  const handleCreateNew = async () => {
    if (!user) {
      alert("投稿するにはログインが必要です");
      return;
    }
    setIsCreating(true);
    try {
      const docRef = await addDoc(collection(db, 'projects'), {
        name: '新しい活動の募集',
        createdAt: serverTimestamp(),
        createdBy: user.uid 
      });
      router.push(`/projects/${docRef.id}`);
    } catch (e) {
      console.error(e);
      alert('作成に失敗しました');
      setIsCreating(false);
    }
  };

  // 表示する全リスト（デモ + Firestoreデータ）
  const allProjects = [...realProjects, ...DEMO_PROJECTS];

  // カテゴリータブの定義
  const TABS = ['すべて', 'ボランティア・清掃', '交流・文化・趣味', '地域活性化・新企画', '防災・緊急支援'];

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-800">
      <Head><title>地域活動ボード | Task App</title></Head>

      {/* ヘッダー */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-xl text-gray-800">
            <Link href="/" className="text-gray-400 hover:text-gray-600">ホーム</Link>
            <span className="text-gray-300">/</span>
            <span>地域活動ボード</span>
          </div>
          <button 
            onClick={handleCreateNew}
            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-full flex items-center gap-2 text-sm font-bold transition-colors shadow-sm"
          >
            {isCreating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            投稿を作成
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6">
        
        {/* タブフィルター */}
        <div className="flex flex-wrap gap-2 mb-6 overflow-x-auto pb-2">
          {TABS.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                activeTab === tab 
                  ? 'bg-gray-800 text-white' 
                  : 'bg-white border border-gray-300 text-gray-600 hover:bg-gray-50'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* インフォメーション */}
        <div className="bg-white border border-orange-200 rounded-lg p-4 mb-8 flex items-start gap-3 shadow-sm">
          <div className="text-orange-500 mt-0.5">💡</div>
          <p className="text-sm text-gray-600 leading-relaxed">
            <span className="font-bold text-gray-800">掲示板のルール：</span>
            地域のための具体的な活動（ボランティア、イベント、互助）のみ投稿できます。単なる雑談や誹謗中傷は禁止されています。
          </p>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg flex items-center gap-3">
            <AlertCircle className="w-5 h-5" />
            <p className="text-sm">{error}</p>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 text-gray-300 animate-spin" />
          </div>
        ) : (
          <div className="space-y-4">
            {allProjects.map((project) => (
              <Link 
                key={project.id} 
                href={`/projects/${project.id}`}
                className="block bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md hover:border-blue-300 transition-all group"
              >
                <div className="flex justify-between items-start mb-3">
                  <span className={`
                    px-2 py-1 rounded text-xs font-bold 
                    ${project.category === 'ボランティア・清掃' ? 'bg-green-100 text-green-700' : 
                      project.category === '交流・文化・趣味' ? 'bg-orange-100 text-orange-700' :
                      project.category === '防災・緊急支援' ? 'bg-red-100 text-red-700' :
                      'bg-blue-100 text-blue-700'}
                  `}>
                    {project.category || '未分類'}
                  </span>
                  {project.date && (
                    <span className="text-xs text-gray-500 font-medium">{project.date}</span>
                  )}
                </div>

                <h3 className="text-lg font-bold text-gray-800 mb-3 group-hover:text-blue-600 transition-colors">
                  {project.name}
                </h3>

                <div className="flex flex-wrap gap-2 mb-4">
                  {project.tags?.map((tag: string, i: number) => (
                    <span key={i} className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                      #{tag}
                    </span>
                  ))}
                </div>

                <div className="flex items-center justify-between text-sm text-gray-500 border-t border-gray-100 pt-3 mt-2">
                  <div className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    {project.location || '場所未設定'}
                  </div>
                  <div className="flex items-center gap-1">
                    <User className="w-4 h-4" />
                    {project.organizer || '主催者'}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}