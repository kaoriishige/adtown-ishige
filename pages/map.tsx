import { NextPage } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { RiArrowLeftLine, RiCompass3Fill, RiMapPin2Fill, RiCloseLine } from 'react-icons/ri';

// --- データ用の型定義 ---
interface Location {
  id: string;
  name: string;
  lat: number;
  lng: number;
  hint: string;
}

const MapPage: NextPage = () => {
  const [locations, setLocations] = useState<Location[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);

  useEffect(() => {
    const fetchLocations = async () => {
      try {
        // 本番ではAPIからデータを取得します
        // const response = await fetch('/api/map/locations');
        // const data = await response.json();
        // setLocations(data);

        // --- 現在は仮のデータを表示します ---
        const mockLocations: Location[] = [
          { id: 'loc1', name: '〇〇公園のベンチ', lat: 37.0203, lng: 139.9985, hint: '大きな滑り台の近くにあるよ' },
          { id: 'loc2', name: 'なっぴーベーカリーの看板の前', lat: 37.0151, lng: 140.0012, hint: '美味しいパンの匂いが目印！' },
          { id: 'loc3', name: '図書館の入り口', lat: 37.0188, lng: 139.9951, hint: '静かな場所で本を読もう' },
        ];
        setLocations(mockLocations);

      } catch (error) {
        console.error("Failed to fetch locations", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchLocations();
  }, []);

  // 宝箱をクリックしたときの処理
  const handleTreasureClick = (location: Location) => {
    setSelectedLocation(location);
  };
  
  // チェックイン（宝箱を開ける）処理
  const handleCheckIn = () => {
    // 実際にはここでユーザーの位置情報と照合し、ポイントを付与するAPIを呼び出します
    // alert() は使えないため、モーダルを閉じるときにメッセージを表示するなどの代替が必要
    console.log(`${selectedLocation?.name}で宝箱を開けて10ポイントGET！`);
    
    // アラートの代わりにモーダルを閉じることでメッセージが表示されたと仮定
    const name = selectedLocation?.name;
    setSelectedLocation(null);
    // 代替のカスタムメッセージ表示ロジックをここに記述
    alert(`${name}で宝箱を開けて10ポイントGET！`); 
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <Head>
        <title>{"どこでもお宝さがしマップ"}</title>
      </Head>

      {/* --- ヘッダー --- */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-lg mx-auto p-4 flex items-center">
          <Link href="/mypage" className="text-gray-600 hover:text-gray-900">
            <RiArrowLeftLine size={24} />
          </Link>
          <h1 className="text-xl font-bold text-gray-800 mx-auto flex items-center">
            <RiCompass3Fill className="mr-2" />
            どこでもお宝さがしマップ
          </h1>
        </div>
      </header>

      {/* --- メインコンテンツ（マップエリア） --- */}
      <main className="flex-grow relative">
        {isLoading ? (
          <div className="w-full h-full flex items-center justify-center">
            <p className="animate-pulse">地図を読み込んでいます...</p>
          </div>
        ) : (
          <div className="w-full h-full bg-blue-200 relative overflow-hidden">
            {/* この部分は実際のマップライブラリ（Google Maps, Leafletなど）に置き換えます */}
            <img 
              src="https://placehold.co/800x1200/a5f3fc/334155?text=那須エリアの地図" 
              alt="那須エリアの地図" 
              className="w-full h-full object-cover"
            />
            {/* 宝箱のピンを配置 */}
            {locations.map(loc => (
              <button 
                key={loc.id} 
                onClick={() => handleTreasureClick(loc)}
                className="absolute text-yellow-400 transform -translate-x-1/2 -translate-y-1/2 animate-pulse"
                // 緯度経度から画面上の位置を計算する必要がある
                style={{ top: `${(1-(loc.lat - 37.015)) * 50}%`, left: `${(loc.lng - 139.995) * 100}%` }}
              >
                {/* 💡 修正箇所: 二重の波括弧に修正 */}
                <RiMapPin2Fill size={40} style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))' }}/>
              </button>
            ))}
          </div>
        )}

        {/* --- 選択された宝箱の詳細モーダル --- */}
        {selectedLocation && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center p-4 z-20">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-sm text-center">
              <button onClick={() => setSelectedLocation(null)} className="absolute top-2 right-2 text-gray-400 hover:text-gray-600">
                <RiCloseLine size={24} />
              </button>
              <h2 className="text-xl font-bold mb-2">{selectedLocation.name}</h2>
              <p className="text-gray-600 mb-4">ヒント：{selectedLocation.hint}</p>
              <button 
                onClick={handleCheckIn}
                className="w-full bg-yellow-500 text-white font-bold py-3 rounded-lg hover:bg-yellow-600 transition"
              >
                近くにいるので宝箱を開ける
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default MapPage;