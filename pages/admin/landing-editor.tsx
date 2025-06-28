'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getAuth, onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export default function LandingEditorPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [loadingData, setLoadingData] = useState(true);
  const router = useRouter();

  const [form, setForm] = useState<{
    title: string;
    subtitle: string;
    campaign: string;
    cta: string;
    benefits: string;
    referralNote: string;
    companyName: string;
  }>({
    title: '',
    subtitle: '',
    campaign: '',
    cta: '',
    benefits: '',
    referralNote: '',
    companyName: '',
  });

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
      } else {
        router.push('/login');
      }
      setLoadingAuth(false);
    });

    return () => unsubscribe();
  }, [router]);

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      const docRef = doc(db, 'settings', 'landingV2');
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const data = snap.data();
        setForm({
          title: data.title || '',
          subtitle: data.subtitle || '',
          campaign: data.campaign || '',
          cta: data.cta || '',
          benefits: data.benefits || '',
          referralNote: data.referralNote || '',
          companyName: data.companyName || '',
        });
      }
      setLoadingData(false);
    };

    fetchData();
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSave = async () => {
    const docRef = doc(db, 'settings', 'landingV2');
    await setDoc(docRef, form, { merge: true });
    alert('保存しました');
  };

  if (loadingAuth || loadingData) return <p className="p-6 text-gray-600">読み込み中...</p>;

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">ランディングページ編集</h1>

      <label className="block mb-2 font-semibold">タイトル</label>
      <input
        name="title"
        value={form.title}
        onChange={handleChange}
        className="w-full border px-3 py-2 mb-4 rounded"
      />

      <label className="block mb-2 font-semibold">サブタイトル</label>
      <input
        name="subtitle"
        value={form.subtitle}
        onChange={handleChange}
        className="w-full border px-3 py-2 mb-4 rounded"
      />

      <label className="block mb-2 font-semibold">キャンペーン文</label>
      <input
        name="campaign"
        value={form.campaign}
        onChange={handleChange}
        className="w-full border px-3 py-2 mb-4 rounded"
      />

      <label className="block mb-2 font-semibold">CTAボタン文言</label>
      <input
        name="cta"
        value={form.cta}
        onChange={handleChange}
        className="w-full border px-3 py-2 mb-4 rounded"
      />

      <label className="block mb-2 font-semibold">特長・ベネフィット（カンマ区切り）</label>
      <textarea
        name="benefits"
        value={form.benefits}
        onChange={handleChange}
        className="w-full border px-3 py-2 mb-4 rounded"
      />

      <label className="block mb-2 font-semibold">紹介文</label>
      <input
        name="referralNote"
        value={form.referralNote}
        onChange={handleChange}
        className="w-full border px-3 py-2 mb-4 rounded"
      />

      <label className="block mb-2 font-semibold">運営会社名</label>
      <input
        name="companyName"
        value={form.companyName}
        onChange={handleChange}
        className="w-full border px-3 py-2 mb-6 rounded"
      />

      <button
        onClick={handleSave}
        className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
      >
        保存する
      </button>
    </div>
  );
}
