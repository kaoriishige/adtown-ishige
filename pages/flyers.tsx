// pages/flyers.tsx のコード（すべてコピーして貼り付けてください）
import { useState } from 'react';
// クライアントサイドのFirebase初期化は、lib/firebase.ts があればそちらを使う
// ただし、このファイルでしか使わない場合は、このまま残しておくことも可能
import { initializeApp, getApp, getApps } from 'firebase/app';
import { getFirestore, collection, query, where, getDocs } from 'firebase/firestore'; // Firestore関連はAPIルートで使うので、クライアント側では不要になる可能性あり

// 環境変数からFirebaseの設定を読み込む (メインアプリ用)
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// Firebaseの初期化（エラーを防ぐためのおまじない） - メインアプリ用
// ※SuperSaver AIのデータはAPIルートから取得するため、このクライアント側初期化はメインアプリのFirestoreに接続
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app); // メインアプリのFirestoreインスタンス

// チラシのデータ型を定義
interface Flyer {
  id: string;
  shopName: string;
  imageUrl: string;
  // APIルートで返される可能性のある他のフィールドも追加
  // period?: string;
  // price?: number;
  // productName?: string;
  // quantity?: string;
  // status?: string;
  region?: string; // regionもAPIから返されるので追加
}

const FlyersPage = () => {
  const [flyers, setFlyers] = useState<Flyer[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('上のボタンからエリアを選択してください。');

  const getFlyers = async (region: string) => {
    console.log('getFlyers function called for region:', region); 

    setLoading(true);
    setFlyers([]);
    setMessage('読み込み中...');

    try {
      // APIルートを呼び出してデータを取得する
      // クライアントサイドからは/api/getFlyersにアクセス
      const response = await fetch(`/api/getFlyers?region=${encodeURIComponent(region)}`);
      
      if (!response.ok) { // レスポンスがOKでなかった場合 (例: 400, 500エラー)
        const errorData = await response.json();
        throw new Error(errorData.error || `API request failed with status ${response.status}`);
      }

      const data: Flyer[] = await response.json(); // 取得したJSONデータをFlyer型として受け取る
      
      if (data.length > 0) {
        setFlyers(data);
      } else {
        setMessage(`<b>${region}</b>の一致する情報が見つかりませんでした。`);
        setFlyers([]);
      }

    } catch (error) {
      console.error("Error getting flyers from API route: ", error); // APIルートからのエラーをキャッチ
      setMessage("データの取得中にエラーが発生しました。");
    }
    setLoading(false);
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <h2>スーパーのチラシ</h2>
      <div>
        <button onClick={() => getFlyers('那須塩原市')} style={{ marginRight: '10px' }}>那須塩原市</button>
        <button onClick={() => getFlyers('大田原市')} style={{ marginRight: '10px' }}>大田原市</button>
        <button onClick={() => getFlyers('那須町')}>那須町</button>
      </div>
      <hr />
      <div>
        {loading || flyers.length === 0 ? (
          <p dangerouslySetInnerHTML={{ __html: message }}></p>
        ) : (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px' }}>
            {flyers.map(flyer => (
              <div key={flyer.id} style={{ border: '1px solid #ccc', padding: '10px', borderRadius: '8px', width: '300px' }}>
                <h3>{flyer.shopName}</h3>
                {/* 画像が表示されることを期待 */}
                <img src={flyer.imageUrl} alt={`${flyer.shopName}のチラシ`} style={{ maxWidth: '100%' }} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default FlyersPage;