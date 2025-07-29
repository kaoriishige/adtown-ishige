// contexts/AuthContext.tsx
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

type AuthContextType = {
  user: User | null;
  userRole: 'admin' | 'user' | null;
  loading: boolean;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  userRole: null,
  loading: true,
  logout: async () => {},
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<'admin' | 'user' | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setLoading(true);
      if (currentUser) {
        setUser(currentUser);
        try {
          // ★重要：APIルート経由でサーバーから役割を取得する
          const token = await currentUser.getIdToken();
          const response = await axios.get('/api/user/get-role', {
            headers: { Authorization: `Bearer ${token}` },
          });
          setUserRole(response.data.role);
        } catch (error) {
          console.error('Failed to get user role:', error);
          setUserRole(null);
          // エラー時はログアウトさせてログインページに戻す
          await auth.signOut();
        }
      } else {
        setUser(null);
        setUserRole(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const logout = async () => {
    setLoading(true);
    try {
      // サーバーサイドのCookieをクリアするAPIを呼び出す（将来の拡張用）
      await axios.post('/api/logout'); 
      // クライアントの認証状態をクリア
      await auth.signOut(); 
      // ログインページにリダイレクト
      router.push('/login'); 
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      setUser(null);
      setUserRole(null);
      setLoading(false);
    }
  };

  const value = {
    user,
    userRole,
    loading,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};
