'use client';

import { useEffect, useState } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

type LandingData = {
  title: string;
  subtitle: string;
  campaign: string;
  cta: string;
  benefits: string;
  referralNote: string;
  companyName: string;
};

export default function LandingV2EditorPage() {
  const [form, setForm] = useState<LandingData>({
    title: '',
    subtitle: '',
    campaign: '',
    cta: '',
    benefits: '',
    referralNote: '',
    companyName: '',
  });
  const [message, setMessage] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      const ref = doc(db, 'settings', 'landingV2'); // ✅ 本番ドキュメントに注目
      const snap = await getDoc(ref);
      if (snap.exists()) {
        const data = snap.data() as LandingData;
        setForm(data);
      }
    };
    fetchData();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSave = async () => {
    const ref = doc(db, 'settings', 'landingV2'); // ✅ 予告ではなく本番
    await setDoc(ref, form);
    setMessage('✅ 保存しました');
    setTimeout(() => setMessage(''), 3000);
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">本番ランディングページ編集</h1>

      <label className="block mb-2 font-semibold">タイトル</label>
      <input name="title" value={form.title} onChange={handleChange} className="w-full border px-3 py-2 mb-4 rounded" />

      <label className="block mb-2 font-semibold">サブタイトル</label>
      <input name="subtitle" value={form.subtitle} onChange={handleChange} className="w-full border px-3 py-2 mb-4 rounded" />

      <label className="block mb-2 font-semibold">キャンペーン文</label>
      <input name="campaign" value={form.campaign} onChange={handleChange} className="w-full border px-3 py-2 mb-4 rounded" />

      <label className="block mb-2 font-semibold">CTAボタン文言</label>
      <input name="cta" value={form.cta} onChange={handleChange} className="w-full border px-3 py-2 mb-4 rounded" />

      <label className="block mb-2 font-semibold">特長・ベネフィット（カンマ区切り）</label>
      <textarea name="benefits" value={form.benefits} onChange={handleChange} className="w-full border px-3 py-2 mb-4 rounded" />

      <label className="block mb-2 font-semibold">紹介文</label>
      <input name="referralNote" value={form.referralNote} onChange={handleChange} className="w-full border px-3 py-2 mb-4 rounded" />

      <label className="block mb-2 font-semibold">運営会社名</label>
      <input name="companyName" value={form.companyName} onChange={handleChange} className="w-full border px-3 py-2 mb-6 rounded" />

      <button onClick={handleSave} className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700">
        保存する
      </button>

      {message && <p className="mt-4 text-green-600">{message}</p>}
    </div>
  );
}





