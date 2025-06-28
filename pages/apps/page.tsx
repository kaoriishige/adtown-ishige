'use client';

import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
} from 'firebase/firestore';

type AppData = {
  id: string;
  name: string;
  description: string;
  url: string;
  categories: string[];
};

export default function AdminAppsPage() {
  const [apps, setApps] = useState<AppData[]>([]);
  const [editingApp, setEditingApp] = useState<AppData | null>(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const fetchApps = async () => {
      const snapshot = await getDocs(collection(db, 'apps'));
      const list = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as AppData[];
      setApps(list);
    };
    fetchApps();
  }, []);

  const handleEdit = (app: AppData) => setEditingApp(app);

  const handleChange = (field: keyof AppData, value: any) => {
    if (editingApp) {
      setEditingApp({ ...editingApp, [field]: value });
    }
  };

  const saveApp = async () => {
    if (!editingApp) return;
    await updateDoc(doc(db, 'apps', editingApp.id), {
      name: editingApp.name,
      description: editingApp.description,
      url: editingApp.url,
      categories: editingApp.categories,
    });
    setMessage('✅ 保存しました');
    setEditingApp(null);
    setTimeout(() => setMessage(''), 2000);
  };

  const deleteApp = async (id: string) => {
    await deleteDoc(doc(db, 'apps', id));
    setApps(prev => prev.filter(app => app.id !== id));
    setMessage('🗑️ 削除しました');
    setTimeout(() => setMessage(''), 2000);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-xl font-bold mb-4">アプリ一覧（管理）</h1>

      {message && <p className="mb-4 text-green-600">{message}</p>}

      {editingApp ? (
        <div className="bg-gray-100 p-4 rounded mb-6">
          <h2 className="font-semibold mb-2">編集中: {editingApp.name}</h2>
          <input
            className="w-full p-2 border mb-2"
            value={editingApp.name}
            onChange={e => handleChange('name', e.target.value)}
            placeholder="アプリ名"
          />
          <input
            className="w-full p-2 border mb-2"
            value={editingApp.description}
            onChange={e => handleChange('description', e.target.value)}
            placeholder="説明"
          />
          <input
            className="w-full p-2 border mb-2"
            value={editingApp.url}
            onChange={e => handleChange('url', e.target.value)}
            placeholder="リンクURL"
          />
          <input
            className="w-full p-2 border mb-4"
            value={editingApp.categories.join(',')}
            onChange={e =>
              handleChange(
                'categories',
                e.target.value.split(',').map(c => c.trim())
              )
            }
            placeholder="カテゴリ（カンマ区切り）"
          />
          <button
            className="bg-blue-600 text-white px-4 py-2 rounded mr-2"
            onClick={saveApp}
          >
            保存
          </button>
          <button
            className="text-gray-600 underline"
            onClick={() => setEditingApp(null)}
          >
            キャンセル
          </button>
        </div>
      ) : null}

      <ul className="space-y-4">
        {apps.map(app => (
          <li key={app.id} className="border p-4 rounded">
            <h2 className="text-lg font-bold">{app.name}</h2>
            <p className="text-sm mb-2">{app.description}</p>
            <p className="text-sm text-blue-600">{app.url}</p>
            <p className="text-sm text-gray-500">
              カテゴリ: {app.categories.join(', ')}
            </p>
            <div className="mt-2 flex gap-3">
              <button
                className="text-blue-600 underline"
                onClick={() => handleEdit(app)}
              >
                編集
              </button>
              <button
                className="text-red-600 underline"
                onClick={() => deleteApp(app.id)}
              >
                削除
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
