import { NextPage } from 'next';
import { useRouter } from 'next/router';
import { RiArrowLeftLine } from 'react-icons/ri';
import React from 'react';

// --- 型定義 ---
interface AppDetail {
    appName: string;
    appUrl: string;
    // ... その他のアプリ詳細 ...
}

const mockAppData: AppDetail = {
    appName: "みんなの那須ナビ",
    appUrl: "https://example.com/app",
};

const AppViewPage: NextPage = () => {
    const router = useRouter();
    const { appId } = router.query;
    
    // 実際のアプリデータはAPIから取得しますが、ここではモックを使用
    const app = mockAppData; 

    return (
        // 💡 修正箇所: 21行目付近の style={{...}} を style={{...}} に修正
        <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', margin: 0 }}>
            
            {/* ▼▼▼ これが「額縁」部分です ▼▼▼ */}
            <header style={{
                padding: '12px 20px',
                backgroundColor: '#fff',
                borderBottom: '1px solid #ccc',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexShrink: 0
            }}>
                <button 
                    onClick={() => router.back()}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#333' }}
                >
                    <RiArrowLeftLine size={24} />
                </button>
                <h1 style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{app.appName || 'アプリビュー'}</h1>
                <div style={{ width: '24px' }}>{/* スペーサー */}</div>
            </header>

            {/* ▼▼▼ アプリの埋め込み部分 ▼▼▼ */}
            <main style={{ flexGrow: 1, overflow: 'hidden' }}>
                <iframe
                    src={app.appUrl} 
                    title={app.appName}
                    style={{ border: 'none', width: '100%', height: '100%' }}
                    allow="camera; microphone; geolocation"
                ></iframe>
            </main>
        </div>
    );
};

export default AppViewPage;