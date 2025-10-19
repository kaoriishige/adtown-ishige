import React from 'react';
import Head from 'next/head';

// FeatureBox コンポーネントの定義
const FeatureBox: React.FC<{ title: string; description: string }> = ({ title, description }) => (
    <div style={{
        backgroundColor: '#1f2937', 
        padding: '20px', 
        borderRadius: '8px', 
        border: '1px solid #4b5563',
        color: '#fff',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
    }}>
        <h3 style={{ fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '10px', color: '#a5b4fc' }}>{title}</h3>
        <p style={{ fontSize: '0.9rem', color: '#d1d5db' }}>{description}</p>
    </div>
);


const LandingPage = () => {
    return (
        <>
            <Head>
                <title>みんなの那須アプリ - まもなくスタート</title>
                <meta name="viewport" content="width=device-width, initial-scale=1" />
            </Head>

            <div style={{ backgroundColor: '#1f2937', minHeight: '100vh', padding: '20px' }}>
                <div 
                    style={{
                        backgroundColor: '#0c4a6e',
                        textAlign: 'center',
                        color: '#fff',
                        padding: '3rem 2rem',
                        borderRadius: '10px',
                        maxWidth: '800px',
                        margin: '0 auto',
                        boxShadow: '0 10px 15px rgba(0, 0, 0, 0.5)'
                    }}
                >
                    <p style={{ fontSize: '1.5rem', color: '#fca5a5', fontWeight: 'bold' }}>緊急予告!!</p>
                    <h1 style={{ fontSize: '3rem', fontWeight: 'bold', margin: '1rem 0' }}>みんなの那須アプリ</h1>
                    <p style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem' }}>まもなくスタート予定</p>
                    <p style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#fff' }}>🎉 まずは7日間無料でお試し使い放題！</p>
                </div>

                <div style={{ textAlign: 'center', margin: '2rem auto', maxWidth: '800px' }}>
                    <h2 style={{ color: '#fff', fontSize: '2rem', fontWeight: 'bold', marginBottom: '1rem' }}>アプリの主な機能</h2>
                    <div 
                        style={{ 
                            display: 'grid', 
                            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
                            gap: '20px',
                            marginTop: '1rem' 
                        }}
                    >
                        <FeatureBox title="特売情報" description="お店のリアルタイムな特売情報をプッシュ通知でお届け！" />
                        <FeatureBox title="今日の運勢" description="毎日の運勢を占いでチェック！那須でのラッキーアクションも提案。" />
                        <FeatureBox title="相性診断" description="那須の観光スポットや飲食店との相性を診断！新しい発見をサポート。" />
                        <FeatureBox title="地域情報アプリ" description="那須の最新イベント、お店のレビュー、観光情報を網羅。" />
                    </div>
                </div>

                <div style={{ textAlign: 'center', marginTop: '3rem' }}>
                    <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#fff', marginBottom: '1rem' }}>
                        すべての機能が
                        <span style={{ color: '#fca5a5', textDecoration: 'underline' }}>ぜんぶ入り使い放題</span>
                    </p>

                    <button
                        style={{
                            backgroundColor: '#10b981',
                            color: '#fff',
                            fontSize: '1.5rem',
                            fontWeight: 'bold',
                            padding: '1rem 3rem',
                            borderRadius: '50px',
                            border: 'none',
                            cursor: 'pointer',
                            marginTop: '2rem',
                            maxWidth: '350px',
                            margin: '2rem auto'
                        }}
                        onClick={() => { /* 予約・登録ロジック */ }}
                    >
                        7日間無料でお試しスタート！
                    </button>
                </div>
            </div>
        </>
    );
};

export default LandingPage;