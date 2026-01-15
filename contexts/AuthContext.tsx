// contexts/AuthContext.tsx (完全修正版)

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { auth } from '../lib/firebase'; 
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
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
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
          // 401エラーなどでループしないようサインアウトを慎重に扱う
        }
      } else {
        setUser(null);
        setUserRole(null);
        setUserPlan(null);
      }
      setLoading(false); 
    });

    return () => unsubscribe();
  }, []);

  const logout = async () => {
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

  /**
   * ここが修正の核心です
   */
  const isPublicLP = router.pathname === '/partner/signup';

  // 1. パートナー募集LPの場合は、認証のロード状態を無視して即座に子供要素を表示する
  if (isPublicLP) {
    return (
      <AuthContext.Provider value={value}>
        {children} 
      </AuthContext.Provider>
    );
  }

  // 2. それ以外の管理画面などは、認証ロード中は待機画面を出す
  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh', 
        backgroundColor: '#fff' 
      }}>
        認証情報を読み込み中...
      </div>
    );
  }

  // 3. 通常レンダリング
  return (
    <AuthContext.Provider value={value}>
      {children} 
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};