// pages/nasu/index.js

import Head from 'next/head';

// 提供された店舗情報とURLのリスト
const storeData = [
  // 那須塩原市、那須町
  { city: '那須塩原市・那須町', name: 'カワチ薬品 黒磯店', url: 'https://tokubai.co.jp/%E3%82%AB%E3%83%AF%E3%83%81%E8%96%AC%E5%93%81/76062' },
  { city: '那須塩原市・那須町', name: 'ウエルシア 那須塩原黒磯店', url: 'https://tokubai.co.jp/%E3%82%A6%E3%82%A8%E3%83%AB%E3%82%B7%E3%82%A2/297164' },
  { city: '那須塩原市・那須町', name: 'ドラッグストアコスモス 黒磯店', url: 'https://tokubai.co.jp/%E3%83%89%E3%83%A9%E3%83%83%E3%82%B0%E3%82%B9%E3%83%88%E3%82%A2%E3%82%B3%E3%82%B9%E3%83%A2%E3%82%B9/226216' },
  { city: '那須塩原市・那須町', name: 'ウエルシア 那須塩原黒磯幸町店', url: 'https://tokubai.co.jp/%E3%82%A6%E3%82%A8%E3%83%AB%E3%82%B7%E3%82%A2/297200' },
  { city: '那須塩原市・那須町', name: 'クスリのアオキ 上厚崎店', url: 'https://tokubai.co.jp/%E3%82%AF%E3%82%B9%E3%83%AA%E3%81%AE%E3%82%A2%E3%82%AA%E3%82%AD/170876' },
  { city: '那須塩原市・那須町', name: 'クスリのアオキ 豊住町店', url: 'https://tokubai.co.jp/%E3%82%AF%E3%82%B9%E3%83%AA%E3%81%AE%E3%82%A2%E3%82%AA%E3%82%AD/157018' },
  { city: '那須塩原市・那須町', name: 'カワチ薬品 那須塩原店', url: 'https://tokubai.co.jp/%E3%82%AB%E3%83%AF%E3%83%81%E8%96%AC%E5%93%81/264431' },
  { city: '那須塩原市・那須町', name: 'カワチ薬品 黒田原店', url: 'https://tokubai.co.jp/%E3%82%AB%E3%83%AF%E3%83%81%E8%96%AC%E5%93%81/264442' },
  { city: '那須塩原市・那須町', name: 'カワチ薬品 那須高原店', url: 'https://tokubai.co.jp/%E3%82%AB%E3%83%AF%E3%83%81%E8%96%AC%E5%93%81/76069' },
  { city: '那須塩原市・那須町', name: 'カワチ薬品 塩原関谷店', url: 'https://tokubai.co.jp/%E3%82%AB%E3%83%AF%E3%83%81%E8%96%AC%E5%93%81/264400' },
  { city: '那須塩原市・那須町', name: 'クスリのアオキ 一区町店', url: 'https://tokubai.co.jp/%E3%82%AF%E3%82%B9%E3%83%AA%E3%81%AE%E3%82%A2%E3%82%AA%E3%82%AD/286073' },
  { city: '那須塩原市・那須町', name: 'カワチ薬品 西那須野店', url: 'https://tokubai.co.jp/%E3%82%AB%E3%83%AF%E3%83%81%E8%96%AC%E5%93%81/76063' },
  { city: '那須塩原市・那須町', name: 'カワチ薬品 下永田店', url: 'https://tokubai.co.jp/%E3%82%AB%E3%83%AF%E3%83%81%E8%96%AC%E5%93%81/76065' },
  { city: '那須塩原市・那須町', name: 'ドラッグストアコスモス 下永田店', url: 'https://tokubai.co.jp/%E3%83%89%E3%83%A9%E3%83%83%E3%82%B0%E3%82%B9%E3%83%88%E3%82%A2%E3%82%B3%E3%82%B9%E3%83%A2%E3%82%B9/227745' },
  { city: '那須塩原市・那須町', name: 'ドラッグストアコスモス 西三島店', url: 'https://tokubai.co.jp/%E3%83%89%E3%83%A9%E3%83%83%E3%82%B0%E3%82%B9%E3%83%88%E3%82%A2%E3%82%B3%E3%82%B9%E3%83%A2%E3%82%B9/226601' },
  { city: '那須塩原市・那須町', name: 'クスリのアオキ 西那須野南町店', url: 'https://tokubai.co.jp/%E3%82%AF%E3%82%B9%E3%83%AA%E3%81%AE%E3%82%A2%E3%82%AA%E3%82%AD/127379' },
  { city: '那須塩原市・那須町', name: 'クスリのアオキ 太夫塚店', url: 'https://tokubai.co.jp/%E3%82%AF%E3%82%B9%E3%83%AA%E3%81%AE%E3%82%A2%E3%82%AA%E3%82%AD/174112' },
  { city: '那須塩原市・那須町', name: 'クスリのアオキ 三島店', url: 'https://tokubai.co.jp/%E3%82%AF%E3%82%B9%E3%83%AA%E3%81%AE%E3%82%A2%E3%82%AA%E3%82%AD/127133' },
  { city: '那須塩原市・那須町', name: 'ウエルシア 西那須野南郷屋店', url: 'https://tokubai.co.jp/%E3%82%A6%E3%82%A8%E3%83%AB%E3%82%B7%E3%82%A2/38515' },
  { city: '那須塩原市・那須町', name: 'サンドラッグ 西那須野店', url: 'https://tokubai.co.jp/%E3%82%B5%E3%83%B3%E3%83%89%E3%83%A9%E3%83%83%E3%82%B0/20881' },
  { city: '那須塩原市・那須町', name: 'カワチ薬品 大田原西店', url: 'https://tokubai.co.jp/%E3%82%AB%E3%83%AF%E3%83%81%E8%96%AC%E5%93%81/76064' },
  
  // 大田原市
  { city: '大田原市', name: 'サンドラッグ 大田原住吉店', url: 'https://tokubai.co.jp/%E3%82%B5%E3%83%B3%E3%83%89%E3%83%A9%E3%83%83%E3%82%B0/114992' },
  { city: '大田原市', name: 'クスリのアオキ 末広店', url: 'https://tokubai.co.jp/%E3%82%AF%E3%82%B9%E3%83%AA%E3%81%AE%E3%82%A2%E3%82%AA%E3%82%AD/174278' },
  { city: '大田原市', name: 'カワチ薬品 大田原南店', url: 'https://tokubai.co.jp/%E3%82%AB%E3%83%AF%E3%83%81%E8%96%AC%E5%93%81/76066' },
  { city: '大田原市', name: 'ウエルシア 大田原本町店', url: 'https://tokubai.co.jp/%E3%82%A6%E3%82%A8%E3%83%AB%E3%82%B7%E3%82%A2/38514' },
  { city: '大田原市', name: 'ドラッグストアコスモス 大田原住吉店', url: 'https://tokubai.co.jp/%E3%83%89%E3%83%A9%E3%83%83%E3%82%B0%E3%82%B9%E3%83%88%E3%82%A2%E3%82%B3%E3%82%B9%E3%83%A2%E3%82%B9/258702' },
  { city: '大田原市', name: 'クスリのアオキ 山の手店', url: 'https://tokubai.co.jp/%E3%82%AF%E3%82%B9%E3%83%AA%E3%81%AE%E3%82%A2%E3%82%AA%E3%82%AD/173728' },
  { city: '大田原市', name: 'ウエルシア アクロスプラザ大田原店', url: 'https://tokubai.co.jp/%E3%82%A6%E3%82%A8%E3%83%AB%E3%82%B7%E3%82%A2/297116' },
  { city: '大田原市', name: 'カワチ薬品 黒羽店', url: 'https://tokubai.co.jp/%E3%82%AB%E3%83%AF%E3%83%81%E8%96%AC%E5%93%81/76067' },
];

// 地域でグループ化
const groupedStores = storeData.reduce((acc, store) => {
  if (!acc[store.city]) {
    acc[store.city] = [];
  }
  acc[store.city].push(store);
  return acc;
}, {});

// Reactコンポーネント
const NasuFlyerApp = () => {
  return (
    <div style={styles.container}>
      <Head>
        <title>那須・大田原 ドラッグストア特売情報</title>
        <meta name="description" content="那須塩原市・那須町・大田原市のドラッグストア特売情報（チラシ）リンク集" />
      </Head>

      <header style={styles.header}>
        <h1 style={styles.h1}>📰 那須・大田原エリア ドラッグストア特売情報（チラシ）</h1>
        <p style={styles.p}>各店舗名をクリックすると、外部サイト「トクバイ」の特売情報ページに移動します。</p>
      </header>
      
      <main style={styles.main}>
        {Object.entries(groupedStores).map(([city, stores]) => (
          <section key={city} style={styles.section}>
            <h2 style={styles.h2}>📍 {city}</h2>
            <ul style={styles.ul}>
              {stores.map((store, index) => (
                <li key={index} style={styles.li}>
                  <a 
                    href={store.url} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    style={styles.link}
                  >
                    **{store.name}**
                  </a>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </main>

      <footer style={styles.footer}>
        <p>情報元: トクバイ</p>
      </footer>
    </div>
  );
};

// スタイル定義 (基本的なデザイン)
const styles = {
  container: {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif',
    padding: '20px',
    maxWidth: '800px',
    margin: '0 auto',
  },
  header: {
    textAlign: 'center',
    marginBottom: '30px',
    borderBottom: '2px solid #eee',
    paddingBottom: '15px',
  },
  h1: {
    fontSize: '24px',
    color: '#0070f3',
  },
  p: {
    fontSize: '14px',
    color: '#666',
  },
  main: {
    marginBottom: '40px',
  },
  section: {
    marginBottom: '30px',
    border: '1px solid #ddd',
    borderRadius: '8px',
    padding: '15px',
  },
  h2: {
    fontSize: '20px',
    color: '#333',
    marginBottom: '15px',
    borderBottom: '1px solid #eee',
    paddingBottom: '5px',
  },
  ul: {
    listStyle: 'none',
    padding: '0',
    margin: '0',
  },
  li: {
    padding: '8px 0',
    borderBottom: '1px dotted #eee',
  },
  link: {
    textDecoration: 'none',
    color: '#0070f3',
    fontSize: '16px',
    display: 'block',
    padding: '5px 0',
  },
  footer: {
    textAlign: 'center',
    marginTop: '20px',
    paddingTop: '10px',
    borderTop: '1px solid #eee',
    fontSize: '12px',
    color: '#999',
  },
};

export default NasuFlyerApp;