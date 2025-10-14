import React from 'react';
import { getAuth } from 'firebase/auth';

export default function ApplyButton({ jobId }: { jobId: string }) {
  const handleApply = async () => {
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) {
      alert('ログインしてください');
      return;
    }
    const res = await fetch('/api/applicants', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jobId, userId: user.uid }),
    });
    const json = await res.json();
    if (res.ok) alert(`応募完了（AIスコア: ${json.score}）`);
    else alert('エラー: ' + json.error);
  };

  return (
    <button
      onClick={handleApply}
      className="px-4 py-2 bg-blue-600 text-white rounded"
    >
      応募する
    </button>
  );
}
