import React, { useState, useEffect, useMemo } from 'react';
import Head from 'next/head';
import Link from 'next/link'; // 👈 リンク機能のために追加

// --- 型定義 ---
type Item = {
  id: string;
  name: string;
  location: string; // 場所 (グループキー)
  tags: string[];
  note: string;
  createdAt: number;
};

// --- グループ化ヘルパー関数 ---
type GroupedItems = {
  [location: string]: Item[];
};

/**
 * アイテムを場所(location)ごとにグループ化する
 */
const groupItemsByLocation = (items: Item[]): GroupedItems => {
  return items.reduce((acc, item) => {
    // locationがない場合は「場所未定」として分類
    const location = item.location.trim() || '場所未定'; 
    if (!acc[location]) {
      acc[location] = [];
    }
    // 最新登録順に表示するため、ここでは単に追加
    acc[location].push(item); 
    return acc;
  }, {} as GroupedItems);
};

// --- アイコンコンポーネント ---
// 📜 カテゴリ/リストアイコン
const CategoryIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2m-9 0V3h4m-4 2h4m2 10h4m-4-4h4m-6-4h.01"></path>
    </svg>
);

// ⬅️ 戻る矢印アイコン
const BackArrowIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
    </svg>
);

// --- メインコンポーネント ---
export default function Aredoko() {
  // ステート
  const [items, setItems] = useState<Item[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  // activeTabの型を 'list' | 'add' | '' に変更
  const [activeTab, setActiveTab] = useState<'list' | 'add' | ''>('list'); 
  
  // フォーム用ステート
  const [newName, setNewName] = useState('');
  const [newLocation, setNewLocation] = useState('');
  const [newTags, setNewTags] = useState('');
  const [newNote, setNewNote] = useState('');

  // 削除確認モーダル用ステート 
  const [itemToDelete, setItemToDelete] = useState<Item | null>(null);

  // 使い方モーダルの開閉
  const [isInstructionModalOpen, setIsInstructionModalOpen] = useState(false);

  // LocalStorageキー
  const STORAGE_KEY = 'aredoko-items';

  // 初回ロード
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const loadedItems = JSON.parse(saved);
        // Date.now()で作成されたものをソートしてリストに設定
        loadedItems.sort((a: Item, b: Item) => b.createdAt - a.createdAt);
        setItems(loadedItems);
      } catch (e) {
        console.error('Failed to load items', e);
      }
    }
  }, []);

  // データ保存
  useEffect(() => {
    if (items.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } else {
      localStorage.removeItem(STORAGE_KEY); 
    }
  }, [items]);

  // アプリ内でのリスト復帰アクション（検索クリアなど）
  const handleGoToList = () => {
      setSearchQuery(''); 

      const messageBox = document.getElementById('message-box');
      if (messageBox) {
          messageBox.classList.remove('opacity-100', 'scale-100');
          messageBox.classList.add('opacity-0', 'scale-90', 'hidden');
      }

      if (activeTab === 'list' && searchQuery === '') {
        return;
      }
      
      setActiveTab('');
      setTimeout(() => {
          setActiveTab('list'); 
      }, 0);
  };
    
  // 追加処理
  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newLocation) {
        console.error("Name and Location are required.");
        return;
    }

    const newItem: Item = {
      id: Date.now().toString(),
      name: newName,
      location: newLocation,
      tags: newTags.split(/[\s,]+/).filter(Boolean),
      note: newNote,
      createdAt: Date.now(),
    };

    setItems((prev) => [newItem, ...prev]);
    
    setNewName('');
    setNewLocation('');
    setNewTags('');
    setNewNote('');
    
    handleGoToList(); 
    
    const messageBox = document.getElementById('message-box');
    if (messageBox) {
        messageBox.textContent = '「' + newItem.name + '」を記録しました！';
        messageBox.classList.remove('opacity-0', 'scale-90', 'hidden', 'bg-red-500');
        messageBox.classList.add('opacity-100', 'scale-100', 'bg-indigo-600'); 
        setTimeout(() => {
            messageBox.classList.remove('opacity-100', 'scale-100');
            messageBox.classList.add('opacity-0', 'scale-90');
            setTimeout(() => {
                messageBox.classList.add('hidden');
            }, 300);
        }, 2000);
    }
  };


  // 削除確認モーダルを表示
  const handleDelete = (item: Item) => {
    setItemToDelete(item);
  };

  // 削除実行
  const confirmDelete = () => {
    if (itemToDelete) {
        const deletedItemName = itemToDelete.name;
        const newItems = items.filter((item) => item.id !== itemToDelete.id);
        setItems(newItems);
        
        const messageBox = document.getElementById('message-box');
        if (messageBox) {
            messageBox.textContent = '「' + deletedItemName + '」の記録を削除しました。';
            messageBox.classList.remove('opacity-0', 'scale-90', 'hidden', 'bg-indigo-600');
            messageBox.classList.add('opacity-100', 'scale-100', 'bg-red-500');
            setTimeout(() => {
                messageBox.classList.remove('opacity-100', 'scale-100');
                messageBox.classList.add('opacity-0', 'scale-90');
                setTimeout(() => {
                    messageBox.classList.add('hidden');
                }, 300);
            }, 2000);
        }
    }
    setItemToDelete(null);
  };

  // 検索処理
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
        const query = searchQuery.toLowerCase();
        if (!query) return true;
        
        return (
            item.name.toLowerCase().includes(query) ||
            item.location.toLowerCase().includes(query) ||
            item.tags.some(tag => tag.toLowerCase().includes(query)) ||
            item.note.toLowerCase().includes(query)
        );
    }).sort((a, b) => b.createdAt - a.createdAt);
  }, [items, searchQuery]);

  // グループ化
  const groupedItems = useMemo(() => {
    return groupItemsByLocation(filteredItems);
  }, [filteredItems]);


  const locationKeys = Object.keys(groupedItems).sort((a, b) => {
      const itemA = groupedItems[a][0];
      const itemB = groupedItems[b][0];
      return itemB.createdAt - itemA.createdAt;
  });


  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans pb-24">
      <Head>
        <title>アレどこ - モノ探しストレス解消</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
      </Head>

      {/* ヘッダー */}
      <header className="bg-white shadow-sm p-4 sticky top-0 z-10 border-b border-slate-200">
        <div className="flex justify-between items-center max-w-md mx-auto">
            <div className="flex items-center gap-2">
                
                {/* 🚨 修正箇所: Linkコンポーネントを使って常に「apps/categories」への戻る矢印を表示 */}
                <Link 
                    href="/apps/categories"
                    className="p-1 -ml-2 mr-1 rounded-full text-slate-500 hover:bg-slate-100 hover:text-indigo-600 transition-colors flex items-center justify-center"
                    title="カテゴリ一覧に戻る"
                >
                    <BackArrowIcon className="w-6 h-6" />
                </Link>
                
                <h1 className="text-xl font-bold text-indigo-600 flex items-center gap-2">
                    アレどこ <span className="text-xs text-slate-400 font-normal">Aredoko</span>
                </h1>
            </div>

            {/* 使い方ボタン */}
            <button
                onClick={() => setIsInstructionModalOpen(true)}
                className="p-2 text-sm font-bold bg-indigo-50 text-indigo-600 rounded-full hover:bg-indigo-100 transition-colors flex items-center gap-1 shadow-sm"
                title="アプリの使い方"
            >
                <span className="text-base font-bold">?</span>使い方
            </button>
        </div>
      </header>

      <main className="max-w-md mx-auto p-4">
        
        {/* --- activeTab が 'list' か、または activeTab が空でない場合にのみ描画 --- */}
        {(activeTab === 'list' || activeTab === '') && (
          <div className="space-y-4 pt-2">
            
            {/* 画面タイトル */}
            <div className="flex items-center justify-between mb-4">
                {searchQuery ? (
                    <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                        <span className="text-indigo-500">🔍</span> 検索結果
                    </h2>
                ) : (
                    <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                        <span className="text-indigo-500">📦</span> 場所別カテゴリ一覧
                    </h2>
                )}
            </div>

            {/* 検索入力フィールド */}
            <div className="relative">
              <input
                type="text"
                placeholder="「契約書」「喪服」などを検索..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full p-4 pl-12 rounded-xl border-0 shadow-sm ring-1 ring-slate-200 focus:ring-2 focus:ring-indigo-500 transition-all bg-white ${searchQuery ? 'pr-12' : 'pr-4'}`}
              />
              <span className="absolute left-4 top-4 text-slate-400 text-lg">🔍</span>
              
              {/* 検索クリアボタン */}
              {searchQuery && (
                <button
                  onClick={handleGoToList}
                  className="absolute right-3 top-3 p-1 rounded-full text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 transition-colors"
                  title="検索をクリア" 
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                </button>
              )}
            </div>

            {/* アイテム一覧表示ロジック */}
            {items.length === 0 ? (
              // 登録アイテムがない場合
              <div className="text-center py-10 text-slate-400">
                <div className="bg-white p-6 rounded-xl shadow-md border border-slate-100 text-left">
                  <h2 className="text-base font-bold text-slate-700 mb-3">👋 まだ何も記録されていません</h2>
                  <p className="text-sm text-slate-500 mb-5">
                      探し物の場所を忘れるストレスから解放されるために、さっそくモノの場所を記録しましょう。
                  </p>
                  <button
                    onClick={() => setActiveTab('add')}
                    className="mt-2 w-full py-2 bg-indigo-500 text-white rounded-lg font-bold hover:bg-indigo-600 transition-colors shadow-lg shadow-indigo-200"
                  >
                    さっそく場所を記録する（➕ 追加）
                  </button>
                  <button
                    onClick={() => setIsInstructionModalOpen(true)}
                    className="mt-3 w-full py-2 bg-slate-100 text-slate-600 rounded-lg font-bold hover:bg-slate-200 transition-colors"
                  >
                    使い方を確認する
                  </button>
                </div>
              </div>
            ) : (
              // 登録アイテムがある場合
              <div className="space-y-6 pt-2">
                
                {searchQuery && filteredItems.length > 0 && (
                    <p className="text-left text-sm text-slate-500 font-medium">
                        「{searchQuery}」の検索結果: <span className="text-indigo-600 font-bold">{filteredItems.length}</span>件
                    </p>
                )}
                
                {filteredItems.length === 0 && searchQuery && (
                    <p className="text-center text-slate-500 py-8">
                        「{searchQuery}」は見つかりませんでした...
                    </p>
                )}
                
                {/* 場所ごとにグループ化して表示 */}
                {locationKeys.length > 0 && (
                  locationKeys.map((location) => (
                    <div key={location} className="space-y-3">
                      <h2 className="text-base font-bold text-slate-700 flex items-center gap-2 border-l-4 border-indigo-400 pl-3 py-1 bg-white rounded-r-md shadow-sm">
                        📍 {location}
                        {!searchQuery && <span className="text-xs font-normal text-slate-400">({groupedItems[location].length}件)</span>}
                      </h2>

                      <div className="space-y-3">
                        {groupedItems[location].map((item) => (
                          <div key={item.id} className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 relative transition-all active:scale-[0.99] hover:shadow-md">
                            <button 
                              onClick={() => handleDelete(item)}
                              className="absolute top-2 right-2 text-slate-300 hover:text-red-500 p-2 z-10"
                              title="削除"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                            </button>
                            <h3 className="font-bold text-lg text-slate-800 pr-10">{item.name}</h3>
                            
                            {item.tags.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-2">
                                {item.tags.filter(Boolean).map((tag, i) => (
                                  <span key={i} className="text-xs bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full border border-indigo-200">
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            )}
                            
                            {item.note && (
                              <div className="mt-3 text-sm text-slate-500 border-t border-slate-100 pt-3 flex gap-2">
                                <span>📝</span>
                                <span>{item.note}</span>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        )}

        {/* --- 追加モード --- */}
        {activeTab === 'add' && (
          <div className="space-y-6 pt-2">
            <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-100">
              <h2 className="text-lg font-bold mb-6 text-center text-slate-700">新しい場所を覚える</h2>
              <form onSubmit={handleAddItem} className="space-y-5">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">モノの名前 <span className="text-red-500">*</span></label>
                  <input
                    required
                    className="w-full p-3 bg-slate-50 border-0 rounded-lg focus:ring-2 focus:ring-indigo-500 transition-all font-bold text-lg"
                    placeholder="例: 実印"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">しまった場所 <span className="text-red-500">*</span></label>
                  <input
                    required
                    className="w-full p-3 bg-slate-50 border-0 rounded-lg focus:ring-2 focus:ring-indigo-500 transition-all"
                    placeholder="例: 書斎の引き出し（一番上）"
                    value={newLocation}
                    onChange={(e) => setNewLocation(e.target.value)}
                  />
                  <p className="text-xs text-slate-400 mt-1">
                      📍 **重要:** この場所ごとにアイテムが分類されて表示されます。
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">タグ (スペース区切り)</label>
                  <input
                    className="w-full p-3 bg-slate-50 border-0 rounded-lg focus:ring-2 focus:ring-indigo-500 transition-all"
                    placeholder="例: 重要 銀行"
                    value={newTags}
                    onChange={(e) => setNewTags(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">メモ</label>
                  <textarea
                    className="w-full p-3 bg-slate-50 border-0 rounded-lg focus:ring-2 focus:ring-indigo-500 transition-all h-24 resize-none"
                    placeholder="何か補足があれば..."
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                  />
                </div>

                <div className="pt-4 flex gap-3">
                  <button
                    type="button"
                    onClick={handleGoToList}
                    className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-colors"
                  >
                    カテゴリ一覧へ
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all transform active:scale-95"
                  >
                    保存する
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
        
        {/* ローディング表示 */}
        {activeTab !== 'list' && activeTab !== 'add' && (
            <div className="py-20 text-center text-slate-400">
                読み込み中...
            </div>
        )}

      </main>

      {/* フッターナビ */}
      <nav className="fixed bottom-0 w-full bg-white/90 backdrop-blur-md border-t border-slate-200 flex justify-around p-2 pb-6 safe-area-pb z-20">
        <button
          onClick={handleGoToList}
          className={`flex flex-col items-center w-full py-2 rounded-lg transition-colors ${activeTab === 'list' ? 'text-indigo-600' : 'text-slate-400 hover:bg-slate-50'}`}
        >
          <CategoryIcon className="w-6 h-6 mb-1 text-2xl" />
          <span className="text-[10px] font-bold tracking-wide">カテゴリ</span>
        </button>
        <button
          onClick={() => setActiveTab('add')}
          className={`flex flex-col items-center w-full py-2 rounded-lg transition-colors ${activeTab === 'add' ? 'text-indigo-600' : 'text-slate-400 hover:bg-slate-50'}`}
        >
          <div className="text-2xl mb-1">➕</div>
          <span className="text-[10px] font-bold tracking-wide">追加</span>
        </button>
      </nav>

      {/* メッセージボックス */}
      <div 
        id="message-box"
        className="fixed bottom-24 left-1/2 transform -translate-x-1/2 p-3 bg-indigo-600 text-white rounded-xl shadow-xl transition-all duration-300 opacity-0 scale-90 hidden z-50 font-bold"
      >
      </div>
      
      {/* 削除確認モーダル */}
      {itemToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-40 z-50 flex items-center justify-center p-4">
          <div className="bg-white p-6 rounded-xl shadow-2xl max-w-sm w-full space-y-4">
            <h3 className="text-xl font-bold text-slate-800">🗑️ 削除の確認</h3>
            <p className="text-slate-600">
              **「{itemToDelete.name}」**の記録を本当に削除してもよろしいですか？
              この操作は元に戻せません。
            </p>
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setItemToDelete(null)}
                className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-colors"
              >
                キャンセル
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 py-3 bg-red-500 text-white rounded-xl font-bold shadow-lg shadow-red-200 hover:bg-red-600 transition-colors"
              >
                削除する
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 使い方モーダル */}
      {isInstructionModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-40 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white p-6 rounded-xl shadow-2xl max-w-sm w-full space-y-4 my-8">
            <div className="flex justify-between items-center border-b pb-3 mb-3">
                <h3 className="text-xl font-bold text-indigo-700">📦 アプリの使い方</h3>
                <button 
                    onClick={() => setIsInstructionModalOpen(false)}
                    className="text-slate-400 hover:text-slate-600 p-1"
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                </button>
            </div>
            
            <h4 className="text-base font-bold text-slate-700 mt-4">1. 記録（追加）</h4>
            <ol className="list-decimal pl-5 space-y-3 text-slate-600 text-sm">
                <li>
                    **「➕ 追加」**タブを開き、モノの名前（例: `実印`）と**しまった場所**（例: `書斎の引き出し`）を入力します。
                </li>
                <li>
                    タグ（例: `重要` `銀行`）やメモ（例: `夫の通帳とセット`）を記録すると、検索精度が上がります。
                </li>
            </ol>
            
            <h4 className="text-base font-bold text-slate-700 mt-4 pt-3 border-t">2. 整理・分類</h4>
            <ul className="list-disc pl-5 space-y-3 text-slate-600 text-sm">
                <li>
                    同じ「**しまった場所**」の名前で複数のモノを登録すると、「**📜 カテゴリ**」タブで**その場所ごとにモノが分類されて表示**されます。
                </li>
                <li>
                    場所名を統一することで、どこに何があるか一目でわかります。
                </li>
            </ul>

            <h4 className="text-base font-bold text-slate-700 mt-4 pt-3 border-t">3. 確認・検索</h4>
            <ul className="list-disc pl-5 space-y-3 text-slate-600 text-sm">
                <li>
                    **「📜 カテゴリ」**タブは、登録した全アイテムを**場所ごとに一覧表示**する画面です。
                </li>
                <li>
                    リスト上部の検索ボックスは、一覧（カテゴリ）からさらに絞り込むためのものです。
                </li>
            </ul>

            <div className="pt-4">
              <button
                onClick={() => setIsInstructionModalOpen(false)}
                className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-colors"
              >
                閉じる
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}