// pages/recruit/jobs/create.tsx
/* eslint-disable @next/next/no-img-element */
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import {
  doc,
  getDoc,
  updateDoc,
  addDoc,
  collection,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase'; // ← firebase初期化ファイルのパス
import { Loader2 } from 'lucide-react';

const JobCreatePage = () => {
  const router = useRouter();
  const [uid, setUid] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    jobTitle: '',
    description: '',
    salary: '',
    location: '',
    companyName: '',
    address: '',
    phoneNumber: '',
    website: '',
  });

  // Firebase Auth監視
  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUid(user.uid);
        await loadCompanyProfile(user.uid);
      } else {
        router.push('/partner/login'); // 未ログインならログインへ
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // 企業プロフィールをロードして初期反映
  const loadCompanyProfile = async (uid: string) => {
    try {
      const userRef = doc(db, 'users', uid);
      const snap = await getDoc(userRef);
      if (snap.exists()) {
        const data = snap.data();
        setFormData((prev) => ({
          ...prev,
          companyName: data.companyName || '',
          address: data.address || '',
          phoneNumber: data.phoneNumber || '',
          website: data.website || '',
        }));
      }
    } catch (err) {
      console.error('企業プロフィール読み込みエラー:', err);
    }
  };

  // 入力変更ハンドラ
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  // 求人登録
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uid) return;
    setSaving(true);
    try {
      await addDoc(collection(db, 'jobs'), {
        ...formData,
        uid,
        createdAt: serverTimestamp(),
      });
      alert('求人を登録しました！');
      router.push('/recruit/dashboard');
    } catch (err) {
      console.error('求人登録エラー:', err);
      alert('求人登録に失敗しました');
    } finally {
      setSaving(false);
    }
  };

  // AIマッチング停止・開始切替
  const handleToggleMatching = async (status: 'pause' | 'start') => {
    if (!uid) return;
    try {
      const userRef = doc(db, 'users', uid);
      await updateDoc(userRef, {
        matchingStatus: status === 'start' ? 'active' : 'paused',
      });
      alert(
        status === 'start'
          ? 'AIマッチングを開始しました。'
          : 'AIマッチングを停止しました。'
      );
    } catch (err) {
      console.error('マッチング切替エラー:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen text-gray-500">
        <Loader2 className="animate-spin mr-2" /> 読み込み中...
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">新しい求人の作成</h1>

      {/* 企業プロフィール編集 */}
      <div className="mb-6 bg-gray-50 p-4 rounded-md border">
        <h2 className="text-lg font-semibold mb-2">企業情報</h2>
        <button
          onClick={() => router.push('/recruit/profile')}
          className="text-sm text-blue-600 hover:underline"
        >
          企業プロフィールを編集
        </button>
        <div className="mt-3 space-y-1 text-sm text-gray-700">
          <p>会社名：{formData.companyName || '未登録'}</p>
          <p>所在地：{formData.address || '未登録'}</p>
          <p>電話番号：{formData.phoneNumber || '未登録'}</p>
          <p>Webサイト：{formData.website || '未登録'}</p>
        </div>
      </div>

      {/* 求人作成フォーム */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">求人タイトル</label>
          <input
            type="text"
            name="jobTitle"
            value={formData.jobTitle}
            onChange={handleChange}
            className="w-full border rounded-md p-2"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">仕事内容</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            className="w-full border rounded-md p-2 h-28"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">給与</label>
          <input
            type="text"
            name="salary"
            value={formData.salary}
            onChange={handleChange}
            className="w-full border rounded-md p-2"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">勤務地</label>
          <input
            type="text"
            name="location"
            value={formData.location}
            onChange={handleChange}
            className="w-full border rounded-md p-2"
          />
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition"
        >
          {saving ? '保存中...' : '求人を登録する'}
        </button>
      </form>

      {/* 請求書払いの方への案内 */}
      <div className="mt-10 text-center text-gray-700 text-sm">
        請求書払いの方はこちらをご利用ください。
      </div>

      {/* 求人マッチングAI制御 */}
      <div className="flex justify-center space-x-4 mt-6">
        <button
          onClick={() => handleToggleMatching('pause')}
          className="px-4 py-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600"
        >
          求人マッチングAIを停止
        </button>
        <button
          onClick={() => handleToggleMatching('start')}
          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
        >
          求人マッチングAIを開始
        </button>
      </div>
    </div>
  );
};

export default JobCreatePage;
