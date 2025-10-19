import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import Head from 'next/head';

const WelcomePage = () => {
    const router = useRouter();
    const [status, setStatus] = useState('登録処理が完了しました。自動的にログインしています...');
    const [retries, setRetries] = useState(0);

    useEffect(() => {
        // router.isReady を待ってからクエリパラメータを取得
        if (!router.isReady) {
            return;
        }

        const { email, password, serviceType, error } = router.query;

        if (error) {
            setStatus(`エラーが発生しました: ${error}`);
            return;
        }

        if (!email || !password || !serviceType) {
            setStatus('ログイン情報が不足しています。トップページに戻ります...');
            setTimeout(() => router.push('/'), 3000);
            return;
        }

        const attemptLogin = async () => {
            try {
                const response = await fetch('/api/auth/sessionLogin', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password }),
                });

                if (response.ok) {
                    setStatus('ログインに成功しました。ダッシュボードに移動します...');
                    const dashboardUrl = serviceType === 'recruit'
                        ? '/recruit/dashboard'
                        : '/partner/dashboard';
                    
                    // window.location.href を使ってハードリフレッシュさせることで、サーバーサイドの認証情報を確実に反映
                    setTimeout(() => {
                        window.location.href = dashboardUrl;
                    }, 1000);

                } else {
                    if (retries < 5) { // 最大5回までリトライ
                        setStatus(`ログイン試行中... (試行 ${retries + 1}/5)`);
                        setRetries(prev => prev + 1);
                        setTimeout(attemptLogin, 2000); // 2秒後に再試行
                    } else {
                        setStatus('自動ログインに失敗しました。お手数ですが、ログインページから手動でログインしてください。');
                        setTimeout(() => router.push('/partner/login'), 3000);
                    }
                }
            } catch (err) {
                setStatus('ログイン処理中にエラーが発生しました。');
            }
        };
        
        // 最初のログイン試行
        const timer = setTimeout(attemptLogin, 2000); // 2秒待ってから開始（Webhook処理のマージン）

        return () => clearTimeout(timer); // コンポーネントがアンマウントされたらタイマーをクリア

    // router.queryの値を依存配列に含めることで、クエリが利用可能になったら再実行
    }, [router.isReady, router.query, retries, router]);


    return (
        <>
            <Head>
                <title>{"ご登録ありがとうございます"}</title>
            </Head>
            <div className="flex items-center justify-center min-h-screen bg-gray-50">
                <div className="p-8 bg-white shadow-lg rounded-lg text-center">
                    <svg className="animate-spin h-12 w-12 text-orange-500 mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <h1 className="text-2xl font-bold text-gray-800">ご登録ありがとうございます！</h1>
                    <p className="mt-2 text-gray-600">{status}</p>
                </div>
            </div>
        </>
    );
};

export default WelcomePage;