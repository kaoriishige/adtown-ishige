import React from 'react';
import Head from 'next/head';

export default function NasuFlyerApp() {
  // すべての店舗データ
  const storeData = [
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
    { city: '大田原市', name: 'サンドラッグ 大田原住吉店', url: 'https://tokubai.co.jp/%E3%82%B5%E3%83%B3%E3%83%89%E3%83%A9%E3%83%83%E3%82%B0/114992' },
    { city: '大田原市', name: 'クスリのアオキ 末広店', url: 'https://tokubai.co.jp/%E3%82%AF%E3%82%B9%E3%83%AA%E3%81%AE%E3%82%A2%E3%82%AA%E3%82%AD/174278' },
    { city: '大田原市', name: 'カワチ薬品 大田原南店', url: 'https://tokubai.co.jp/%E3%82%AB%E3%83%AF%E3%83%81%E8%96%AC%E5%93%81/76066' },
    { city: '大田原市', name: 'ウエルシア 大田原本町店', url: 'https://tokubai.co.jp/%E3%82%A6%E3%82%A8%E3%83%AB%E3%82%B7%E3%82%A2/38514' },
    { city: '大田原市', name: 'ドラッグストアコスモス 大田原住吉店', url: 'https://tokubai.co.jp/%E3%83%89%E3%83%A9%E3%83%83%E3%82%B0%E3%82%B9%E3%83%88%E3%82%A2%E3%82%B3%E3%82%B9%E3%83%A2%E3%82%B9/258702' },
    { city: '大田原市', name: 'クスリのアオキ 山の手店', url: 'https://tokubai.co.jp/%E3%82%AF%E3%82%B9%E3%83%AA%E3%81%AE%E3%82%A2%E3%82%AA%E3%82%AD/173728' },
    { city: '大田原市', name: 'ウエルシア アクロスプラザ大田原店', url: 'https://tokubai.co.jp/%E3%82%A6%E3%82%A8%E3%83%AB%E3%82%B7%E3%82%A2/297116' },
    { city: '大田原市', name: 'カワチ薬品 黒羽店', url: 'https://tokubai.co.jp/%E3%82%AB%E3%83%AF%E3%83%81%E8%96%AC%E5%93%81/76067' },
  ];

  const grouped = storeData.reduce((acc: any, s) => {
    if (!acc[s.city]) acc[s.city] = [];
    acc[s.city].push(s);
    return acc;
  }, {});

  return (
    <div style={{ backgroundColor: '#fff', minHeight: '100vh', fontFamily: 'sans-serif', color: '#333' }}>
      <Head>
        <title>那須・大田原 特売チラシ</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0" />
      </Head>

      {/* ヘッダー：onClickを使わず、aタグの基本機能で/premium/dashboardへ強制移動させる */}
      <div style={{ position: 'sticky', top: 0, backgroundColor: '#fff', borderBottom: '1px solid #eee', padding: '15px', display: 'flex', alignItems: 'center', zIndex: 10 }}>
        <a
          href="/premium/dashboard"
          style={{ textDecoration: 'none', color: '#007aff', fontSize: '18px', fontWeight: 'bold', display: 'flex', alignItems: 'center' }}
        >
          ＜ 戻る
        </a>
        <h1 style={{ margin: '0 0 0 15px', fontSize: '18px', fontWeight: 'bold' }}>チラシを見る</h1>
      </div>

      <div style={{ padding: '15px', maxWidth: '600px', margin: '0 auto' }}>
        {Object.entries(grouped).map(([city, stores]: any) => (
          <div key={city} style={{ marginBottom: '30px' }}>
            <h2 style={{ fontSize: '14px', color: '#999', marginBottom: '10px', paddingLeft: '5px' }}>📍 {city}</h2>
            <div style={{ display: 'grid', gap: '8px' }}>
              {stores.map((s: any, i: number) => (
                <a
                  key={i}
                  href={s.url}
                  style={{
                    textDecoration: 'none', color: 'inherit', width: '100%', padding: '20px',
                    backgroundColor: '#fff', border: '2px solid #007aff', borderRadius: '15px',
                    fontSize: '17px', fontWeight: 'bold', display: 'flex', justifyContent: 'space-between',
                    boxShadow: '0 4px 0 #007aff', marginBottom: '4px', boxSizing: 'border-box'
                  }}
                >
                  <span style={{ flex: 1 }}>{s.name}</span>
                  <span style={{ color: '#007aff', marginLeft: '10px' }}>＞</span>
                </a>
              ))}
            </div>
          </div>
        ))}

        {/* --- PREMIUM UPSELL (Immediately below the store list) --- */}
        <div style={{
          marginTop: '40px', padding: '25px', backgroundColor: '#fff5f8',
          border: '1px solid #ffdde6', borderRadius: '25px', textAlign: 'center'
        }}>
          <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#ff4d88', margin: '0 0 10px 0' }}>
            プレミアムプラン月額480円
          </h3>
          <p style={{ fontSize: '12px', color: '#ff85ad', lineHeight: '1.6', margin: '0 0 20px 0', fontWeight: 'bold' }}>
            合わなければ、いつでも解約できます。<br />
            まずは1ヶ月だけ試してみてください。
          </p>
          <a
            href="/premium"
            style={{
              display: 'block', padding: '15px', backgroundColor: '#ff4d88', color: '#fff',
              textDecoration: 'none', borderRadius: '15px', fontWeight: 'bold', fontSize: '16px',
              boxShadow: '0 4px 15px rgba(255, 77, 136, 0.3)'
            }}
          >
            プレミアムを使ってみる
          </a>
        </div>
      </div>
    </div>
  );
}
