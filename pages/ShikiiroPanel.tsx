import React from 'react';

// === 型定義の修正 ===
// スタイルオブジェクト全体の型を定義します。
type PanelStyles = Record<string, React.CSSProperties>;


// 仮のデータ型定義
interface ShikiiroData {
  seasonTheme: string;
  koyoLocation: string;
  koyoStatus: string;
  onsenSpot: string;
  onsenTime: string;
}

// ダミーデータ
const dummyShikiiroData: ShikiiroData = {
  seasonTheme: 'Autumn',
  koyoLocation: '八幡のツツジ群落',
  koyoStatus: '今週末まで',
  onsenSpot: '大丸温泉',
  onsenTime: '湯けむりが美しい時間',
};

// === スタイル定義 ===
// 型を PanelStyles に変更することでネストされた定義を許可します
const styles: PanelStyles = {
  panel: {
    /* 那須グリーンと木目調を意識 */
    background: 'linear-gradient(135deg, #e6ffe6, #c8e6c9)',
    borderRadius: '12px',
    padding: '16px',
    boxShadow: '0 4px 10px rgba(0, 0, 0, 0.15)',
    color: '#333',
    maxWidth: '350px',
    fontFamily: 'sans-serif',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    marginBottom: '10px',
  },
  icon: {
    fontSize: '24px',
    marginRight: '8px',
  },
  title: {
    margin: '0',
    fontSize: '18px',
    fontWeight: 'bold',
  },
  description: {
    fontSize: '14px',
    color: '#555',
    marginBottom: '15px',
  },
  infoCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    padding: '10px',
    borderRadius: '8px',
    marginBottom: '10px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderLeft: '4px solid #8fbc8f', // 深緑
  },
  infoLabel: {
    fontSize: '14px',
    fontWeight: '600',
  },
  infoTime: {
    fontSize: '14px',
    fontWeight: 'bold',
    color: '#8fbc8f',
  },
  highlight: {
    color: '#d2691e', // チョコレート色 (紅葉の強調色として使用)
  },
  note: {
    fontSize: '12px',
    color: '#777',
    marginTop: '5px',
    textAlign: 'right',
    borderTop: '1px dashed #ccc',
    paddingTop: '5px',
  },
};

const ShikiiroPanel: React.FC = () => {
  const data = dummyShikiiroData; // 実際はAPIからデータを取得

  return (
    // style={styles.panel} にすることでエラーが解消されます
    <div style={styles.panel}> 
      <div style={styles.header}>
        <span style={styles.icon}>🍁</span>
        <h3 style={styles.title}>那須のしきいろ情報 ({data.seasonTheme})</h3>
      </div>
      <div style={styles.description}>
        <p>秋の情景と見頃を提案します。</p>
      </div>

      <div style={styles.infoCard}>
        <span style={styles.infoLabel}>🍂 紅葉の見頃</span>
        {/* スタイルを個別に適用する際は、オブジェクトを展開してマージします */}
        <span style={{ ...styles.infoTime, ...styles.highlight }}>{data.koyoLocation} ({data.koyoStatus})</span>
      </div>

      <div style={styles.infoCard}>
        <span style={styles.infoLabel}>♨️ おすすめ温泉情緒</span>
        <span style={styles.infoTime}>{data.onsenSpot} ({data.onsenTime})</span>
      </div>

      <div style={styles.note}>
        ※情報提供：那須町の地理情報・過去データに基づく
      </div>
    </div>
  );
};

export default ShikiiroPanel;