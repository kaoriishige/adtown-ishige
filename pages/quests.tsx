import { NextPage } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { RiArrowLeftLine, RiTreasureMapLine, RiCopperCoinLine } from 'react-icons/ri';

// --- データ用の型定義 ---
interface Quest {
  id: string;
  title: string;
  description: string;
  rewardPoints: number;
  category: '清掃活動' | '高齢者サポート' | 'スキル' | 'その他';
}

const QuestsPage: NextPage = () => {
  const [quests, setQuests] = useState<Quest[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchQuests = async () => {
      try {
        // 本番ではAPIからデータを取得します
        // const response = await fetch('/api/quests/list');
        // const data = await response.json();
        // setQuests(data);

        // --- 現在は仮のデータを表示します ---
        const mockQuests: Quest[] = [
          { id: 'q1', title: '【急募】公園のごみモンスターを清掃せよ！', description: '〇〇公園のゴミ拾いをお願いします。30分程度の簡単な作業です。', rewardPoints: 150, category: '清掃活動' },
          { id: 'q2', title: 'おばあちゃんの笑顔を取り戻せ！おつかいミッション', description: '駅前のスーパーで、指定された商品を買ってきてくれる方を探しています。', rewardPoints: 300, category: '高齢者サポート' },
          { id: 'q3', title: 'イベント告知チラシのデザイン作成', description: '秋祭りのポスターデザインを募集。あなたのスキルを地域のために活かしませんか？', rewardPoints: 5000, category: 'スキル' },
          { id: 'q4', title: '地域のお店のSNS投稿お手伝い', description: '〇〇商店のInstagram投稿を3回分作成してくれる方を募集します。', rewardPoints: 1000, category: 'スキル' },
        ];
        setQuests(mockQuests);

      } catch (error) {
        console.error("Failed to fetch quests", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchQuests();
  }, []);

  return (
    <div className="min-h-screen bg-gray-100">
      <Head>
        <title>{"那須クエスト・ボード"}</title>
      </Head>

      {/* --- ヘッダー --- */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-lg mx-auto p-4 flex items-center">
          <Link href="/mypage" className="text-gray-600 hover:text-gray-900">
            <RiArrowLeftLine size={24} />
          </Link>
          <h1 className="text-xl font-bold text-gray-800 mx-auto flex items-center">
            <RiTreasureMapLine className="mr-2" />
            那須クエスト・ボード
          </h1>
        </div>
      </header>

      {/* --- メインコンテンツ --- */}
      <main className="max-w-lg mx-auto p-4">
        {isLoading ? (
          <p className="text-center mt-8 animate-pulse">クエストを探しています...</p>
        ) : quests.length === 0 ? (
          <p className="text-center text-gray-500 mt-8">現在、挑戦できるクエストはありません。</p>
        ) : (
          <div className="space-y-4">
            {quests.map((quest) => (
              <div key={quest.id} className="bg-white p-5 rounded-lg shadow-md border-l-4 border-yellow-500">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-xs font-semibold text-yellow-700">{quest.category}</p>
                    <h2 className="text-lg font-bold mt-1">{quest.title}</h2>
                  </div>
                  <div className="text-right ml-4 flex-shrink-0">
                    <p className="text-xl font-black text-yellow-600 flex items-center">
                      <RiCopperCoinLine className="mr-1" />
                      {quest.rewardPoints.toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-500">pt</p>
                  </div>
                </div>
                <p className="text-sm text-gray-600 mt-3">{quest.description}</p>
                <div className="text-right mt-4">
                  <button className="bg-yellow-500 text-white font-bold py-2 px-5 rounded-full hover:bg-yellow-600 transition">
                    挑戦する
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default QuestsPage;