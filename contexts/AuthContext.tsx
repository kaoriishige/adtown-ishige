// contexts/AuthContext.tsx (修正後)

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

// ★ 1. userPlan の型を追加
type UserPlan = 'free' | 'paid_480' | null;

type AuthContextType = {
  user: User | null;
  userRole: 'admin' | 'user' | null;
  userPlan: UserPlan; // ★ 2. Contextの型に userPlan を追加
  loading: boolean;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  userRole: null,
  userPlan: null, // ★ 3. 初期値を追加
  loading: true,
  logout: async () => {},
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<'admin' | 'user' | null>(null);
  const [userPlan, setUserPlan] = useState<UserPlan>(null); // ★ 4. userPlan用のstateを定義
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setLoading(true);
      if (currentUser) {
        setUser(currentUser);
        try {
          const token = await currentUser.getIdToken();
          const response = await axios.get('/api/users/get-role', {
            headers: { Authorization: `Bearer ${token}` },
          });
          
          // ★ 5. レスポンスから role と plan を分割して取得
          const { role, plan } = response.data;
          setUserRole(role);
          setUserPlan(plan); // ★ 6. userPlan stateを更新

        } catch (error) {
          console.error('Failed to get user data:', error);
          setUserRole(null);
          setUserPlan(null); // エラー時はplanもリセット
          await auth.signOut();
        }
      } else {
        setUser(null);
        setUserRole(null);
        setUserPlan(null); // ログアウト時はplanもリセット
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
      setUserPlan(null); // ログアウト時はplanもリセット
      setLoading(false);
    }
  };

  const value = {
    user,
    userRole,
    userPlan, // ★ 7. valueにuserPlanを追加
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
