// pages/recruit/cancel.tsx
import { useRouter } from 'next/router';

export default function RecruitCancelPage() {
  const router = useRouter();

  return (
    <main style={{ padding: '2rem', textAlign: 'center' }}>
      <h1>Subscription Canceled</h1>
      <p>Your subscription was not completed.</p>
      <button onClick={() => router.push('/recruit')}>Try again</button>
    </main>
  );
}
