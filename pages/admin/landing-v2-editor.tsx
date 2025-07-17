'use client';

import { useEffect, useState } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';


export default function LandingV2EditorPage() {
  const [data, setData] = useState({
    title: '',
    subtitle: '',
    campaign: '',
    cta: '',
    benefits: '',
    referralNote: '',
    companyName: '',
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      const docRef = doc(db, 'settings', 'landingV2'); // ← 正しい参照先！
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setData(docSnap.data() as typeof data);
      }
      setLoading(false);
    };
    fetchData();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setData({ ...data, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    setSaving(true);
    const docRef = doc(db, 'settings', 'landingV2'); // ← 保存先もここ！
    await setDoc(docRef, data);
    setSaving(false);
    alert('✅ 本番ランディング内容を保存しました');
  };

  if (loading) return <div className="p-6">読み込み中...</div>;

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-bold">本番ランディングページ 編集</h1>

      <input
        type="text"
        name="title"
        placeholder="タイトル"
        value={data.title}
        onChange={handleChange}
        className="w-full p-2 border rounded"
      />

      <input
        type="text"
        name="subtitle"
        placeholder="サブタイトル"
        value={data.subtitle}
        onChange={handleChange}
        className="w-full p-2 border rounded"
      />

      <input
        type="text"
        name="campaign"
        placeholder="キャンペーン文"
        value={data.campaign}
        onChange={handleChange}
        className="w-full p-2 border rounded"
      />

      <input
        type="text"
        name="cta"
        placeholder="ボタン文言"
        value={data.cta}
        onChange={handleChange}
        className="w-full p-2 border rounded"
      />

      <textarea
        name="benefits"
        placeholder="ベネフィット（1行ごとに）"
        value={data.benefits}
        onChange={handleChange}
        className="w-full p-2 border rounded"
        rows={4}
      />

      <textarea
        name="referralNote"
        placeholder="紹介文"
        value={data.referralNote}
        onChange={handleChange}
        className="w-full p-2 border rounded"
        rows={3}
      />

      <input
        type="text"
        name="companyName"
        placeholder="会社情報"
        value={data.companyName}
        onChange={handleChange}
        className="w-full p-2 border rounded"
      />

      <button
        onClick={handleSave}
        className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
        disabled={saving}
      >
        {saving ? '保存中...' : '保存する'}
      </button>
    </div>
  );
}



