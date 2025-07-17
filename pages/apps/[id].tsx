// ✅ ジャンル別アプリ一覧ページ（感情 or 機能）
// 使用例：/apps/emotion/relief や /apps/function/health

'use client';

import { useParams } from 'next/navigation';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useEffect, useState } from 'react';
import Link from 'next/link';

type AppData = {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  emotionCategories: string[];
  functionCategories: string[];
};

const emotionLabels: Record<string, string> = {
  relief: '悩みが解決してホッとできる',
  spare_time: 'スキマ時間が充実する',
  saving: 'お金が節約できる・得する',
  connected: '誰かとつながって安心できる',
  self_discovery: '自分のことがわかる・発見できる',
  info_quick: '役立つ情報がサクッと手に入る',
  skillup: '今より成長・スキルアップできる',
  clear_mind: 'モヤモヤを整理して気持ちが晴れる',
  fun_life: '毎日がちょっと楽しくなる',
  healing: '心が落ち着く・癒やされる',
  helpful: '人のために行動できる・感謝される',
};

const functionLabels: Record<string, string> = {
  health: '健康支援',
  parenting: '子育て支援',
  savings: '節約・特売情報',
  diagnosis: '性格診断・占い',
  area_info: '地域情報',
  anonymous: '匿名相談',
  life_tips: '暮らしの便利帳',
  pets: 'ペット関連',
  seniors: '高齢者支援',
  disaster: '防災・防犯',
  transport: '交通・移動',
  jobs: '求人・副業',
};

export default function GenrePage() {
  const params = useParams();
  const genreType = params?.type as 'emotion' | 'function'; // /apps/[type]/[id]
  const genreId = params?.id as string;
  const [apps, setApps] = useState<AppData[]>([]);

  useEffect(() => {
    const fetchApps = async () => {
      const snapshot = await getDocs(collection(db, 'apps'));
      const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as AppData[];
      const filtered = data.filter((app) =>
        genreType === 'emotion'
          ? app.emotionCategories?.includes(genreId)
          : app.functionCategories?.includes(genreId)
      );
      setApps(filtered);
    };

    if (genreId && genreType) fetchApps();
  }, [genreType, genreId]);

  const genreLabel =
    genreType === 'emotion'
      ? emotionLabels[genreId] || genreId
      : functionLabels[genreId] || genreId;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-xl font-bold mb-4">ジャンル：{genreLabel}</h1>

      {apps.length === 0 ? (
        <p>該当アプリが見つかりません。</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {apps.map((app) => (
            <div key={app.id} className="border rounded p-4 shadow bg-white">
              <img src={app.imageUrl} alt={app.name} className="w-full h-40 object-cover rounded mb-2" />
              <h2 className="text-lg font-semibold">{app.name}</h2>
              <p className="text-sm text-gray-600 mb-2">{app.description}</p>
              <Link href={`/apps/${app.id}`} className="text-blue-600 underline text-sm">
                詳しく見る
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}


