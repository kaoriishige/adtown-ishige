import React, { useState, useEffect } from 'react'; 
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged, Auth } from 'firebase/auth';
import { getFirestore, doc, setDoc, onSnapshot, collection, query, updateDoc, arrayUnion, Firestore } from 'firebase/firestore';
import { User, MessageSquare, CornerUpRight, Heart, Loader2, Users } from 'lucide-react';

// New Component Import for Real-Time Chat
import ChatRoom from './chat/[id]';

// --- Global Variable Declarations for Canvas/Local Compatibility ---
declare global {
  interface Window {
    __app_id: string | undefined;
    __firebase_config: string | undefined;
    __initial_auth_token: string | undefined | null;
  }
}

// --- Type Definitions ---
type ConnectionRequest = {
  targetId: string;
  status: 'pending' | 'accepted' | 'rejected';
  timestamp: string;
  initiatorId: string;
};

type UserProfile = {
  city: string;
  status: string;
  childAge: string;
  name: string;
  lastUpdated: string;
  connections: ConnectionRequest[];
};

type PotentialMatch = UserProfile & {
  id: string;
  matchScore: number;
  isConnected: boolean;
};

type ProfileFormState = {
  city: string;
  status: string;
  childAge: string;
  name: string;
};

// --- Firebase Initialization and Utility Constants ---

// ローカル/Next.js環境用にFirebase設定を環境変数からロードするヘルパー関数
const getFirebaseConfig = (): object => {
    if (typeof window !== 'undefined' && typeof window.__firebase_config !== 'undefined') {
        return JSON.parse(window.__firebase_config);
    }
    
    const envConfig = {
        apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
        authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
        messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
        appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    };

    if (envConfig.apiKey && envConfig.projectId) {
        return envConfig;
    }

    return {};
};

// グローバル変数がない場合は、フォールバック値を使用
const appId: string = typeof window !== 'undefined' && typeof window.__app_id !== 'undefined' ? window.__app_id : 'default-app-id';
const firebaseConfig: object = getFirebaseConfig();
const initialAuthToken: string | null = typeof window !== 'undefined' && typeof window.__initial_auth_token !== 'undefined' ? (window.__initial_auth_token as string | null) : null;


// The collection path is public because the matching algorithm needs to access all user profiles.
const PROFILES_COLLECTION: string = `artifacts/${appId}/public/data/nasutomo_profiles`;

// Utility function for exponential backoff retry logic
const withRetry = async <T,>(fn: () => Promise<T>, retries: number = 3): Promise<T> => {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (error: any) {
      if (i === retries - 1) throw error;
      const delay = Math.pow(2, i) * 1000;
      console.warn(`Attempt ${i + 1} failed. Retrying in ${delay}ms...`, error.message);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  throw new Error("Retry function failed to execute successfully."); 
};

const profileOptions = {
  city: ['大田原市', '那須塩原市', '那須町', 'その他'],
  status: ['転勤族', '移住者', '地元出身', '学生', 'リモートワーカー'],
  childAge: ['子供なし', '0-2歳児ママ/パパ', '3-5歳児ママ/パパ', '小学生ママ/パパ', '中高生ママ/パパ'],
};

const App: React.FC = () => {
  const [db, setDb] = useState<Firestore | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [isAuthReady, setIsAuthReady] = useState<boolean>(false);
  const [view, setView] = useState<'profile' | 'dashboard' | 'chat'>('profile');
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [potentialMatches, setPotentialMatches] = useState<PotentialMatch[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [currentChatTargetId, setCurrentChatTargetId] = useState<string | null>(null); 

  // Profile Form State
  const [form, setForm] = useState<ProfileFormState>({
    city: profileOptions.city[0],
    status: profileOptions.status[0],
    childAge: profileOptions.childAge[0],
    name: '',
  });

  // 1. Firebase Initialization and Authentication
  useEffect(() => {
    try {
      if (Object.keys(firebaseConfig).length === 0) {
        console.error("Firebase configuration is missing. Running in mock mode.");
        setErrorMessage("Firebase設定が不足しています。ローカル開発を行うには、.env.localファイルに設定を追加してください。");
        setIsAuthReady(true);
        setIsLoading(false);
        return;
      }

      const app = initializeApp(firebaseConfig);
      const newAuth = getAuth(app);
      const newDb = getFirestore(app);

      setDb(newDb);

      const unsubscribe = onAuthStateChanged(newAuth, async (user) => {
        if (user) {
          setUserId(user.uid);
        }
        setIsAuthReady(true);
      });

      // Sign in with custom token or anonymously
      const authenticate = async () => {
        try {
            if (initialAuthToken) {
              await withRetry(() => signInWithCustomToken(newAuth, initialAuthToken));
            } else {
              await withRetry(() => signInAnonymously(newAuth));
            }
        } catch(e: any) {
            console.error("Authentication Attempt Failed:", e);
            
            // --- 認証エラーの詳細ハンドリング ---
            let detailMessage = `認証に失敗しました。原因: ${e.message}`;

            if (e.code === 'auth/admin-restricted-operation' || e.code === 'auth/operation-not-allowed') {
                detailMessage = "認証エラー: 匿名認証が制限されています。Firebaseコンソールで**Authentication** -> **Sign-in method**に進み、**Anonymous**プロバイダを**有効**にしてください。";
            } else if (e.code === 'auth/invalid-api-key') {
                 detailMessage = "認証エラー: APIキーが無効です。`.env.local`の`NEXT_PUBLIC_FIREBASE_API_KEY`を確認してください。";
            } else if (e.code === 'auth/network-request-failed') {
                 detailMessage = "認証エラー: ネットワーク接続の問題、またはFirebaseサービスへのアクセスがブロックされています。";
            }

            setErrorMessage(detailMessage);
        }
      };
      
      authenticate();

      return () => unsubscribe();
    } catch (e: any) {
      console.error("Firebase Setup Error:", e.message);
      setErrorMessage("Firebaseの初期化中にエラーが発生しました。");
    }
  }, []);

  // 2. Load Profile and set initial view
  useEffect(() => {
    if (!db || !userId || !isAuthReady) return;

    const profileRef = doc(db, PROFILES_COLLECTION, userId);

    const unsubscribe = onSnapshot(profileRef, (docSnap) => {
      setIsLoading(false);
      if (docSnap.exists()) {
        const data = docSnap.data() as UserProfile;
        setProfile(data);
        if (data.city && data.status) {
          setView(prevView => prevView === 'profile' ? 'dashboard' : prevView);
        } else {
          setView('profile');
        }
      } else {
        setProfile(null);
        setView('profile');
      }
    }, (error) => {
      console.error("Error fetching profile:", error);
      setErrorMessage("プロフィールデータの取得に失敗しました。");
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [db, userId, isAuthReady]);


  // 3. AI Matching (Mocked) - Fetching all public profiles
  useEffect(() => {
    if (!db || !profile || view !== 'dashboard') return;
    
    const q = query(collection(db, PROFILES_COLLECTION));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const allProfiles = snapshot.docs
        .map(d => ({ id: d.id, ...d.data() } as PotentialMatch))
        .filter(p => p.id !== userId && p.city && p.status && p.childAge);

      const matches: PotentialMatch[] = allProfiles.map(p => {
        let matchScore = 0;
        if (profile) {
            if (p.city === profile.city) matchScore++;
            if (p.status === profile.status) matchScore++;
            if (p.childAge === profile.childAge) matchScore++;
        }
        
        const isConnected = (profile?.connections || []).some(c => c.targetId === p.id);
        
        return { 
          ...p, 
          matchScore, 
          isConnected 
        };
      })
      .filter(p => p.matchScore >= 2 && !p.isConnected)
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, 5);

      setPotentialMatches(matches);
    }, (error) => {
      console.error("Error fetching all profiles for matching:", error);
      setErrorMessage("マッチングデータの取得に失敗しました。");
    });

    return () => unsubscribe();
  }, [db, profile, userId, view]);


  // 4. Handlers
  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db || !userId) return;

    setIsLoading(true);
    setErrorMessage(null);
    
    const newProfileData: UserProfile = {
      city: form.city,
      status: form.status,
      childAge: form.childAge,
      name: `匿名ユーザー${userId ? userId.substring(0, 4) : 'xxxx'}`, 
      lastUpdated: new Date().toISOString(),
      connections: [], 
    };
    
    try {
      const profileRef = doc(db, PROFILES_COLLECTION, userId);
      await withRetry(() => setDoc(profileRef, newProfileData));
      console.log("Profile saved successfully.");
    } catch (e) {
      console.error("Error saving profile:", e);
      setErrorMessage("プロフィールの保存に失敗しました。");
    } finally {
      setIsLoading(false);
    }
  };

  const sendConnectionRequest = async (targetUserId: string) => {
    if (!db || !userId || !profile) return;
    
    setIsLoading(true);
    setErrorMessage(null);
    
    const currentUserRef = doc(db, PROFILES_COLLECTION, userId);
    
    const requestData: ConnectionRequest = {
      targetId: targetUserId,
      status: 'pending',
      timestamp: new Date().toISOString(),
      initiatorId: userId,
    };

    try {
      await withRetry(() => updateDoc(currentUserRef, {
        connections: arrayUnion(requestData)
      }));
      console.log(`Connection request sent to ${targetUserId}`);

      setPotentialMatches(prev => 
        prev.map(match => 
          match.id === targetUserId ? { ...match, isConnected: true } : match
        )
      );
      
      handleChatStart(targetUserId);

    } catch (e) {
      console.error("Error sending request:", e);
      setErrorMessage("接続リクエストの送信に失敗しました。");
    } finally {
      setIsLoading(false);
    }
  };

  const handleChatStart = (targetUserId: string) => {
    setCurrentChatTargetId(targetUserId);
    setView('chat');
  };

  const handleChatClose = () => {
    setCurrentChatTargetId(null);
    setView('dashboard');
  };

  // --- Components ---

  const LoadingSpinner: React.FC = () => (
    <div className="flex justify-center items-center h-full">
      <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      <span className="ml-2 text-gray-600">読み込み中...</span>
    </div>
  );

  const ProfileSetup: React.FC = () => (
    <div className="p-6 bg-white rounded-xl shadow-lg w-full max-w-lg mx-auto">
      <div className="flex items-center space-x-3 mb-6 border-b pb-4">
        <User className="w-7 h-7 text-indigo-500" />
        <h2 className="text-2xl font-bold text-gray-800">プロフィール登録</h2>
      </div>
      <p className="text-sm text-gray-600 mb-6">
        あなたの「境遇」を教えてください。この情報は匿名でAIマッチングにのみ利用されます。
      </p>

      <form onSubmit={handleProfileSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">お住まいの地域</label>
          <select
            value={form.city}
            onChange={(e) => setForm({ ...form, city: e.target.value })}
            className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 transition duration-150 ease-in-out p-2"
            required
          >
            {profileOptions.city.map(opt => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">あなたの現在の境遇</label>
          <select
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value })}
            className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 transition duration-150 ease-in-out p-2"
            required
          >
            {profileOptions.status.map(opt => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700">子育ての状況</label>
          <select
            value={form.childAge}
            onChange={(e) => setForm({ ...form, childAge: e.target.value })}
            className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 transition duration-150 ease-in-out p-2"
            required
          >
            {profileOptions.childAge.map(opt => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-lg shadow-sm text-lg font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition duration-150 ease-in-out disabled:opacity-50"
        >
          {isLoading ? <LoadingSpinner /> : 'AIマッチングを開始する'}
        </button>
      </form>
      <div className="mt-4 text-xs text-gray-400 text-center">
        ユーザーID: {userId || '認証中...'}
      </div>
    </div>
  );

  const MatchCard: React.FC<{ match: PotentialMatch }> = ({ match }) => (
    <div className="bg-gray-50 p-4 border border-gray-200 rounded-xl shadow-md flex flex-col space-y-3">
      <div className="flex items-center space-x-3">
        <Users className="w-5 h-5 text-gray-500" />
        <p className="font-semibold text-lg text-gray-700">
          <span className="bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded-full text-sm">
            AIサジェスト
          </span>
        </p>
      </div>
      
      <div className="space-y-1">
        <div className="text-sm flex items-center">
          <CornerUpRight className="w-4 h-4 mr-2 text-indigo-400 transform rotate-45" />
          <span className="font-medium text-gray-700">共有する境遇: </span>
          <span className="ml-2 text-indigo-600 font-bold">{match.matchScore}つ</span>
        </div>
        <div className="flex flex-wrap gap-2 mt-2">
          {/* Tag rendering with type check */}
          <span className={`text-xs px-2 py-1 rounded-full ${match.city === profile?.city ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-700'}`}>{match.city}</span>
          <span className={`text-xs px-2 py-1 rounded-full ${match.status === profile?.status ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-700'}`}>{match.status}</span>
          <span className={`text-xs px-2 py-1 rounded-full ${match.childAge === profile?.childAge ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-700'}`}>{match.childAge}</span>
        </div>
      </div>
      
      <button
        onClick={() => sendConnectionRequest(match.id)}
        disabled={isLoading || match.isConnected}
        className="mt-3 w-full py-2 flex items-center justify-center text-sm font-semibold rounded-lg transition duration-150 ease-in-out 
          bg-indigo-500 hover:bg-indigo-600 text-white shadow-md disabled:opacity-50"
      >
        <Heart className="w-4 h-4 mr-2" />
        {match.isConnected ? 'リクエスト送信済み' : '匿名で話してみる'}
      </button>
    </div>
  );


  const Dashboard: React.FC = () => (
    <div className="p-6 bg-white rounded-xl shadow-lg w-full max-w-3xl mx-auto">
      <div className="flex items-center space-x-3 mb-6 border-b pb-4">
        <MessageSquare className="w-7 h-7 text-indigo-500" />
        <h2 className="text-2xl font-bold text-gray-800">境遇コネクト・ダッシュボード</h2>
      </div>
      <p className="text-sm text-gray-600 mb-4">
        AIがあなたのプロフィール**「{profile?.city}, {profile?.status}, {profile?.childAge}」**と共通点が多い方を匿名でサジェストしました。
        <span className="block mt-1 font-medium text-indigo-600">本音の雑談から、孤独感を癒やしましょう。</span>
      </p>

      {potentialMatches.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {potentialMatches.map(match => (
            <MatchCard key={match.id} match={match} />
          ))}
        </div>
      ) : (
        <div className="p-8 text-center bg-gray-100 rounded-lg">
          <p className="text-gray-600 font-medium">現在、あなたの境遇と共通点の多いサジェストがありません。</p>
          <p className="text-sm text-gray-500 mt-2">新しいユーザーが登録されるまでしばらくお待ちください。</p>
        </div>
      )}
      
      <button
          onClick={() => setView('profile')}
          className="mt-6 w-full py-2 text-sm font-medium text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition duration-150 ease-in-out"
        >
          プロフィールを編集する
        </button>
    </div>
  );

  // --- Main Render ---

  if (isLoading && !profile && !errorMessage && !isAuthReady) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  const renderContent = () => {
    if (errorMessage) {
      return (
        <div className="p-8 bg-red-100 border border-red-400 text-red-700 rounded-xl max-w-lg mx-auto">
          <p className="font-bold">エラーが発生しました</p>
          <p className="text-sm">{errorMessage}</p>
          
          {/* Firebase設定の確認を促す具体的なメッセージ */}
          {errorMessage.includes("認証エラー") && (
              <div className='mt-4 p-3 bg-red-50 rounded-md text-xs border border-red-300'>
                <p className='font-bold mb-1'>【対応策の確認】</p>
                <ul className='list-disc list-inside space-y-1'>
                    <li>認証が制限されている場合 (`auth/admin-restricted-operation`): Firebaseコンソールで **Authentication** → **Sign-in method** に進み、**Anonymous**（匿名）プロバイダを**有効**にしてください。</li>
                    <li>APIキーに関するエラーが出た場合: `.env.local`ファイルの `NEXT_PUBLIC_FIREBASE_API_KEY` が正しいか確認してください。</li>
                </ul>
              </div>
          )}
        </div>
      );
    }

    switch (view) {
      case 'profile':
        return <ProfileSetup />;
      case 'dashboard':
        return <Dashboard />;
      case 'chat':
        if (db && userId && currentChatTargetId) {
            return (
                <ChatRoom
                    db={db}
                    appId={appId}
                    currentUserId={userId}
                    targetUserId={currentChatTargetId}
                    onClose={handleChatClose}
                />
            );
        }
        return <Dashboard />; 
      default:
        return <ProfileSetup />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-8 flex flex-col items-center font-['Inter']">
      <style>
        {`
        /* Minimal Tailwind-like base styles for guaranteed display */
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&display=swap');
        .font-['Inter'] { font-family: 'Inter', sans-serif; }
        .min-h-screen { min-height: 100vh; }
        .bg-gray-50 { background-color: #f9fafb; }
        .bg-white { background-color: #ffffff; }
        .rounded-xl { border-radius: 0.75rem; }
        .shadow-lg { box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05); }
        .text-indigo-500 { color: #6366f1; }
        .text-indigo-700 { color: #4338ca; }
        .text-2xl { font-size: 1.5rem; line-height: 2rem; }
        .font-bold { font-weight: 700; }
        .text-gray-800 { color: #1f2937; }
        .w-full { width: 100%; }
        .max-w-lg { max-width: 32rem; }
        .mx-auto { margin-left: auto; margin-right: auto; }
        .p-6 { padding: 1.5rem; }
        .mb-6 { margin-bottom: 1.5rem; }
        .space-y-4 > * + * { margin-top: 1rem; }
        .block { display: block; }
        .mt-1 { margin-top: 0.25rem; }
        .p-2 { padding: 0.5rem; }
        /* Add more essential Tailwind utilities as needed for component stability */
        `}
      </style>
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <header className="mb-8 text-center max-w-4xl w-full">
        <h1 className="text-4xl font-extrabold text-indigo-700 tracking-tight">那須とも (Nasu Tomo)</h1>
        <p className="text-lg text-gray-500 mt-2">孤独を癒やす、境遇コネクト</p>
      </header>
      
      {renderContent()}
    </div>
  );
};

export default App;