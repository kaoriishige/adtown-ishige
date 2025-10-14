import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import { app } from '../../../lib/firebase'; // ← いつも使ってるfirebase初期化ファイル
import ApplyButton from '../../../components/ApplyButton';

export default function JobDetail() {
  const router = useRouter();
  const { id } = router.query;
  const [job, setJob] = useState<any>(null);

  useEffect(() => {
    if (!id) return;
    const loadJob = async () => {
      const db = getFirestore(app);
      const snap = await getDoc(doc(db, 'jobs', id as string));
      if (snap.exists()) setJob({ id: snap.id, ...snap.data() });
    };
    loadJob();
  }, [id]);

  if (!job) return <div>読み込み中...</div>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-2">{job.title || '求人情報'}</h1>
      <p>職種: {job.jobCategory}</p>
      <p>勤務地: {job.location}</p>
      <p>給与: {job.salaryMax}円まで</p>

      <div className="mt-6">
        <ApplyButton jobId={job.id} />
      </div>
    </div>
  );
}
