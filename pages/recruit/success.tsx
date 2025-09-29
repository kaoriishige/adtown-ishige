import { useEffect } from 'react';
import { useRouter } from 'next/router';

const RecruitSuccessPage = () => {
  const router = useRouter();
  const { session_id } = router.query;

  useEffect(() => {
    if (session_id) {
      // 決済完了後にダッシュボードにリダイレクト
      router.replace(`/recruit/dashboard?payment_success=true`);
    }
  }, [session_id, router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-gray-700">決済処理中です...</p>
    </div>
  );
};

export default RecruitSuccessPage;
