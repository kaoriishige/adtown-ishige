// contexts/AuthContext.tsx (完全版 - set/resetLoading の位置調整)

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { auth } from '../lib/firebase'; // クライアントサイドのFirebaseインスタンス
import axios from 'axios';
import { useRouter } from 'next/router';

type UserPlan = 'free' | 'paid_480' | null;

type AuthContextType = {
  user: User | null;
  userRole: 'admin' | 'user' | null;
  userPlan: UserPlan; 
  loading: boolean;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  userRole: null,
  userPlan: null, 
  loading: true,
  logout: async () => {},
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<'admin' | 'user' | null>(null);
  const [userPlan, setUserPlan] = useState<UserPlan>(null); 
  const [loading, setLoading] = useState(true); // 初期値はtrue
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      // ★ 変更点1: ここにあった setLoading(true) を削除
      
      if (currentUser) {
        setUser(currentUser);
        try {
          const token = await currentUser.getIdToken();
          const response = await axios.get('/api/users/get-role', {
            headers: { Authorization: `Bearer ${token}` },
          });
          
          const { role, plan } = response.data;
          setUserRole(role);
          setUserPlan(plan);

        } catch (error) {
          console.error('Failed to get user data:', error);
          setUserRole(null);
          setUserPlan(null);
          await auth.signOut();
        }
      } else {
        setUser(null);
        setUserRole(null);
        setUserPlan(null);
      }
      // ★ 変更点2: 認証プロセスが完了した時に一度だけ false にする
      setLoading(false); 
    });

    return () => unsubscribe();
  }, []);

  const logout = async () => {
    // ログアウト処理中は loading にする必要がある
    setLoading(true); 
    try {
      await axios.post('/api/logout'); 
      await auth.signOut(); 
      router.push('/login'); 
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      setUser(null);
      setUserRole(null);
      setUserPlan(null); 
      setLoading(false);
    }
  };

  const value = {
    user,
    userRole,
    userPlan, 
    loading,
    logout,
  };

  // --- ★★★ loadingがtrueの間はローディング画面を表示するロジック ★★★
  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column',
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh', 
        fontSize: '20px',
        color: '#333',
        backgroundColor: '#fff' 
      }}>
        認証情報を読み込み中...
      </div>
    );
  }

  // loadingがfalseになったら、Contextを提供してchildren（アプリ本体）をレンダリングする
  return (
    <AuthContext.Provider value={value}>
      {children} 
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};