import React from 'react';

// =================================================================
// 0. データ取得関数 (NasuData.ts の内容を統合)
//    ロジックは排し、地理情報に基づく基本情報のみを提供
// =================================================================

/** 現在時刻を返す */
const getCurrentNasuTime = (): string => {
    // JST (日本の標準時間) で時刻をフォーマット
    const date = new Date();
    return date.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit', hour12: false });
};

/** 日の出・日の入り時刻（地理情報に基づく基本情報）を返す */
const getSunTimes = () => {
    // 実際にはAPIや天文計算で算出
    return {
        sunrise: '6:35',
        sunset: '17:28',
    };
};

/** 季節ごとの情景情報を返す */
const getSeasonalInfo = (season: string) => {
    switch (season) {
        case 'Winter':
            return {
                spot1: '雪見露天・鹿の湯',
                spot2: '那須どうぶつ王国方面',
            };
        case 'Autumn':
            return {
                spot1: '八幡のツツジ群落',
                spot2: 'マウントジーンズ',
            };
        default:
            return { spot1: '情報なし', spot2: '情報なし' };
    }
};

// =================================================================
// 1. スタイルとデータ定義
// =================================================================

type PanelStyles = Record<string, React.CSSProperties>;

// 投稿画像のプレースホルダー（横長・人物なしが必須）
const MAIN_IMAGE_URL = 'https://picsum.photos/800/220?random=1'; // ダミー画像URL

// 現在の季節を固定 (デモ用)
const currentSeason = 'Winter'; 

// 実行時にデータを取得
const currentSorairoInfo = getSunTimes(); 
const currentShikiiroInfo = getSeasonalInfo(currentSeason); 

const styles: PanelStyles = {
    // 画面全体
    container: {
        width: '100%',
        minHeight: '100vh',
        backgroundColor: '#f8f8f8',
        fontFamily: 'sans-serif',
        paddingBottom: '80px', // ナビゲーションスペース
        boxSizing: 'border-box',
    },
    // A. トップビジュアル
    topVisual: {
        width: '100%',
        height: '220px',
        backgroundImage: `url(${MAIN_IMAGE_URL})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end',
        color: 'white',
        textShadow: '0 0 5px rgba(0,0,0,0.6)',
    },
    currentTime: {
        fontSize: '24px',
        fontWeight: 'bold',
        padding: '10px 15px',
        backgroundColor: 'rgba(0,0,0,0.2)',
    },
    // B. 情報パネルエリア
    panelArea: {
        padding: '15px',
        display: 'flex',
        flexDirection: 'column',
        gap: '15px',
    },
    // C. ナビゲーションエリア
    navBar: {
        position: 'fixed',
        bottom: 0,
        width: '100%',
        height: '60px',
        backgroundColor: '#ffffff',
        borderTop: '1px solid #ddd',
        display: 'flex',
        justifyContent: 'space-around',
        alignItems: 'center',
        boxShadow: '0 -2px 10px rgba(0,0,0,0.05)',
    },
    navItem: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        fontSize: '12px',
        color: '#555',
        cursor: 'pointer',
    },
    navButton: {
        backgroundColor: '#4682b4', // そらいろブルー
        color: 'white',
        borderRadius: '25px',
        padding: '10px 20px',
        fontWeight: 'bold',
        cursor: 'pointer',
    },
    // パネル共通スタイル
    panel: {
        borderRadius: '12px',
        padding: '16px',
        boxShadow: '0 4px 10px rgba(0, 0, 0, 0.15)',
        color: '#333',
    },
    panelHeader: {
        display: 'flex',
        alignItems: 'center',
        marginBottom: '10px',
    },
    panelTitle: {
        margin: '0',
        fontSize: '18px',
        fontWeight: 'bold',
    },
    infoCard: {
        backgroundColor: 'rgba(255, 255, 255, 0.85)',
        padding: '10px',
        borderRadius: '8px',
        marginBottom: '10px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        fontWeight: '600',
    },
};

// =================================================================
// 2. 那須のそらいろ パネルコンポーネント
// =================================================================
const SorairoPanel: React.FC = () => (
    <div style={{ ...styles.panel, background: 'linear-gradient(135deg, #f0f8ff, #add8e6)' }}>
        <div style={styles.panelHeader}>
            <span style={{ fontSize: '24px', marginRight: '8px' }}>☀️</span>
            <h3 style={styles.panelTitle}>今日の那須のそらいろ</h3>
        </div>
        <div style={{ fontSize: '14px', color: '#555', marginBottom: '15px' }}>
            <p>那須の空が最も輝く瞬間をお知らせします。</p>
        </div>
        
        <div style={{ ...styles.infoCard, borderLeft: '4px solid #4682b4' }}>
            <span>🌄 日の出時刻</span>
            <span style={{ color: '#4682b4' }}>{currentSorairoInfo.sunrise}</span>
        </div>
        
        <div style={{ ...styles.infoCard, borderLeft: '4px solid #4682b4' }}>
            <span>🌅 夕焼け鑑賞時刻</span>
            <span style={{ color: '#4682b4' }}>{currentSorairoInfo.sunset} 頃</span>
        </div>
    </div>
);

// =================================================================
// 3. 那須のしきいろ パネルコンポーネント
// =================================================================
const ShikiiroPanel: React.FC = () => (
    <div style={{ ...styles.panel, background: 'linear-gradient(135deg, #e6ffe6, #c8e6c9)' }}>
        <div style={styles.panelHeader}>
            <span style={{ fontSize: '24px', marginRight: '8px' }}>❄️</span>
            <h3 style={styles.panelTitle}>那須のしきいろ情報 ({currentSeason})</h3>
        </div>
        <div style={{ fontSize: '14px', color: '#555', marginBottom: '15px' }}>
            <p>冬の情景と特別な景色をご提案します。</p>
        </div>
        
        <div style={{ ...styles.infoCard, borderLeft: '4px solid #8fbc8f' }}>
            <span>♨️ 雪見露天の情景</span>
            <span style={{ color: '#d2691e' }}>{currentShikiiroInfo.spot1} (今が旬)</span>
        </div>
        
        <div style={{ ...styles.infoCard, borderLeft: '4px solid #8fbc8f' }}>
            <span>🦌 牧場の動物情景</span>
            <span style={{ color: '#8fbc8f' }}>{currentShikiiroInfo.spot2} 近く</span>
        </div>
    </div>
);


// =================================================================
// 4. メイン画面コンポーネント (ユーザーがみるページ全体)
// =================================================================
const NasuAppMainScreenComplete: React.FC = () => {
    const currentTime = getCurrentNasuTime();

    return (
        <div style={styles.container}>
            
            {/* A. トップビジュアル (最新の美しい情景写真が表示される) */}
            <div style={styles.topVisual}>
                <div style={styles.currentTime}>
                    {currentTime}
                </div>
            </div>
            
            {/* B. 情報パネルエリア */}
            <div style={styles.panelArea}>
                <SorairoPanel />
                <ShikiiroPanel />
            </div>

            {/* C. ナビゲーション (投稿・グランプリ導線) */}
            <div style={styles.navBar}>
                <div style={styles.navItem}>🏠<br/>ホーム</div>
                <div style={styles.navItem}>🖼️<br/>ギャラリー</div>
                
                {/* 投稿ボタン: 横長・人物なし・短文コメント1つのルールで投稿 */}
                <div style={styles.navButton}>
                    📸 わたしのそらいろ
                </div>
                
                <div style={styles.navItem}>🏆<br/>グランプリ</div>
                <div style={styles.navItem}>⚙️<br/>設定</div>
            </div>
        </div>
    );
};

export default NasuAppMainScreenComplete;