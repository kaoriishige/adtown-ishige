/* eslint-disable @next/next/no-img-element */
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { db, storage } from '@/lib/firebase';
import { addDoc, collection, serverTimestamp, getDoc, doc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { v4 as uuidv4 } from 'uuid';
import Head from 'next/head';
import { getUidFromCookie } from '@/lib/firebase-admin';
import { GetServerSideProps } from 'next';

// ===============================
// 型定義
// ===============================
type MediaItem = {
  id: string;
  file: File;
  caption: string;
  type: 'image' | 'video';
  preview: string;
};

interface CreateJobProps {
  uid: string;
  companyName: string;
}

// ===============================
// メインページコンポーネント
// ===============================
const CreateJobPage = ({ uid, companyName }: CreateJobProps) => {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [salary, setSalary] = useState('');
  const [location, setLocation] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // ===============================
  // メディア追加
  // ===============================
  const handleAddMedia = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newMedia = Array.from(files).map((file) => ({
      id: uuidv4(),
      file,
      caption: '',
      type: file.type.startsWith('image') ? ('image' as const) : ('video' as const),
      preview: URL.createObjectURL(file),
    }));

    setMediaItems((prev) => [...prev, ...newMedia]);
  };

  // ===============================
  // メディア削除
  // ===============================
  const handleRemoveMedia = (id: string) => {
    setMediaItems((prev) => prev.filter((item) => item.id !== id));
  };

  // ===============================
  // キャプション変更
  // ===============================
  const handleCaptionChange = (id: string, caption: string) => {
    setMediaItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, caption } : item))
    );
  };

  // ===============================
  // 求人登録処理
  // ===============================
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);

    try {
      // 1️⃣ メディアを Firebase Storage にアップロード
      const uploadedMediaUrls: { type: 'image' | 'video'; caption: string; url: string }[] = [];

      for (const item of mediaItems) {
        const storageRef = ref(storage, `jobs/${uid}/${uuidv4()}-${item.file.name}`);
        await uploadBytes(storageRef, item.file);
        const downloadUrl = await getDownloadURL(storageRef);
        uploadedMediaUrls.push({
          type: item.type,
          caption: item.caption,
          url: downloadUrl,
        });
      }

      // 2️⃣ Firestore に求人情報を登録
      await addDoc(collection(db, 'jobs'), {
        title,
        description,
        salary,
        location,
        isActive,
        media: uploadedMediaUrls,
        partnerId: uid,
        companyName,
        createdAt: serverTimestamp(),
      });

      setMessage({ type: 'success', text: '求人を登録しました。' });
      setTimeout(() => router.push('/recruit/dashboard'), 1200);
    } catch (error) {
      console.error('求人登録エラー:', error);
      setMessage({ type: 'error', text: '求人の登録に失敗しました。' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Head>
        <title>新規求人を作成 | みんなの那須</title>
      </Head>

      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-800">新規求人を作成</h1>
          <button
            onClick={() => router.push('/recruit/dashboard')}
            className="text-blue-600 text-sm hover:underline"
          >
            ダッシュボードに戻る
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto bg-white mt-6 p-8 rounded-lg shadow-md">
        {message && (
          <div
            className={`p-4 mb-6 rounded-md ${
              message.type === 'success'
                ? 'bg-green-100 text-green-800'
                : 'bg-red-100 text-red-800'
            }`}
          >
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* 企業名 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">企業名</label>
            <input
              type="text"
              value={companyName}
              disabled
              className="w-full border border-gray-300 rounded-md px-3 py-2 bg-gray-100 text-gray-600"
            />
          </div>

          {/* 求人タイトル */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">求人タイトル *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full border border-gray-300 rounded-md px-3 py-2"
              placeholder="例：フロントスタッフ／調理補助／清掃員など"
            />
          </div>

          {/* 勤務地 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">勤務地 *</label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              required
              className="w-full border border-gray-300 rounded-md px-3 py-2"
              placeholder="例：那須町湯本、黒磯駅周辺など"
            />
          </div>

          {/* 給与 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">給与・時給 *</label>
            <input
              type="text"
              value={salary}
              onChange={(e) => setSalary(e.target.value)}
              required
              className="w-full border border-gray-300 rounded-md px-3 py-2"
              placeholder="例：時給1,200円〜／月給20万円〜"
            />
          </div>

          {/* 求人内容 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">仕事内容・アピール *</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={6}
              required
              className="w-full border border-gray-300 rounded-md px-3 py-2"
              placeholder="仕事内容、勤務条件、求める人物像などを詳しく記載してください。"
            />
          </div>

          {/* メディアアップロード */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              画像・動画を追加（任意）
            </label>
            <input
              type="file"
              multiple
              accept="image/*,video/*"
              onChange={handleAddMedia}
              className="block"
            />

            {/* プレビュー */}
            <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-4">
              {mediaItems.map((item) => (
                <div key={item.id} className="relative border rounded-lg overflow-hidden">
                  {item.type === 'image' ? (
                    <img
                      src={item.preview}
                      alt="preview"
                      className="w-full h-40 object-cover"
                    />
                  ) : (
                    <video
                      src={item.preview}
                      controls
                      className="w-full h-40 object-cover"
                    />
                  )}
                  <input
                    type="text"
                    placeholder="キャプション（任意）"
                    value={item.caption}
                    onChange={(e) => handleCaptionChange(item.id, e.target.value)}
                    className="w-full border-t border-gray-300 px-2 py-1 text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveMedia(item.id)}
                    className="absolute top-2 right-2 bg-white/70 hover:bg-white text-red-600 rounded-full px-2 py-1 text-xs"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* AIマッチングの有効化 */}
          <div className="flex items-center space-x-3 border-t pt-6">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              id="active"
              className="h-4 w-4 text-indigo-600 border-gray-300 rounded"
            />
            <label htmlFor="active" className="text-gray-700">
              AIマッチングを有効にする（チェックを外すと非公開）
            </label>
          </div>

          <div className="pt-6 flex justify-end">
            <button
              type="submit"
              disabled={isLoading}
              className="px-6 py-2 bg-indigo-600 text-white font-semibold rounded-md hover:bg-indigo-700 disabled:bg-gray-400"
            >
              {isLoading ? '保存中...' : '求人を登録する'}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
};

// ===============================
// サーバーサイド処理
// ===============================
export const getServerSideProps: GetServerSideProps = async (context) => {
  const uid = await getUidFromCookie(context);
  if (!uid) {
    return { redirect: { destination: '/partner/login', permanent: false } };
  }

  const userDoc = await getDoc(doc(db, 'users', uid));
  const companyName = userDoc.exists() ? userDoc.data()?.companyName || '未登録企業' : '未登録企業';

  return { props: { uid, companyName } };
};

export default CreateJobPage;


