import React, { useState, useEffect, useCallback, useMemo } from 'react';
// Firebase Imports
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, addDoc, deleteDoc, onSnapshot, collection, query, setLogLevel } from 'firebase/firestore';

// --- グローバル変数型定義 (環境提供の変数のための宣言) ---
// これらの変数は実行環境から提供されるため、TypeScriptに存在を知らせる必要があります。
declare const __app_id: string | undefined;
declare const __firebase_config: string | undefined;
declare const __initial_auth_token: string | undefined;


// --- 型定義 ---
interface VideoItem {
  id: string; // Firestore Document ID
  title: string;
  youtubeId: string; // YouTube埋め込み用ID
  url: string; // 元のURL
  createdAt: number;
}

interface AppState {
    db: any;
    auth: any;
    userId: string | null;
    isAuthReady: boolean;
    appId: string;
}

// 開発者メッセージ（プロフィール）
const DEVELOPER_MESSAGE = {
    title: "👨‍💻 開発者からのメッセージ",
    content: (
        <>
            <p className="text-sm font-semibold text-gray-700 mb-1">
                サクセス研究社 代表 田代 稔 (67歳)
            </p>
            <p className="text-sm mb-3">
                私は、この地域アプリ「みんなの那須アプリ」の開発者であり、サクセス研究社の代表を務めております、田代 稔と申します。
            </p>
            <p className="text-sm mb-3">
                正直に申し上げまして、数年前まで、私のような60代の人間が、このようなAIをテーマにしたアプリを自ら作り上げることなど、夢にも思っていませんでした。
            </p>
            <p className="text-sm mb-3">
                しかし、2022年12月にChatGPTという革新的なAIが登場し、世界は一変しました。私は、2023年4月からAIの使い方を本格的に学び始め、その計り知れない可能性と、圧倒的な進化のスピードを肌で感じることとなりました。
            </p>
            <p className="text-sm mb-3">
                そして、この「賢人の子育て指針 Wisdom Guide」アプリは、**私自身がAIと対話を重ねながら**、まさにその進化の波に乗って作り上げたものです。この「おじさん」でもアプリ開発ができるようになったという事実こそが、時代の変化の証だと確信しています。
            </p>
            
            <p className="text-base font-bold text-indigo-600 border-t pt-3 mt-4">--- 時代を見つめる知恵を、子育て中のあなたへ ---</p>

            <p className="text-sm mt-3 mb-3">
                いま、子育てに奮闘されているお母様方（親御さん）の胸には、「この子たちが大人になる頃、AIはどのような社会を作っているのだろう？」「その社会で生き抜くために、何を学ばせるべきだろうか？」という大きな不安があることと思います。
            </p>
            <p className="text-sm mb-3">
                このアプリは、その不安に向き合うための羅針盤です。
            </p>
            <p className="text-sm mb-3">
                スティーブ・ジョブズ、イーロン・マスク、ビル・ゲイツ、サム・アルトマン、ジョン・マルティニス、リード・ホフマンといった、世界の未来を形作ってきた著名人の「知恵の言葉」を動画としてご覧いただけます。
            </p>
            <p className="text-sm mb-3 font-medium text-red-600">
                私たちは、ここで語られるすべてを盲目的に信じてほしいとは全く思っていません。ただ、ぜひ、ご自身の目で、世の中の大きな潮流、世界がどこに向かっているのかをご覧になってください。
            </p>
            <p className="text-sm italic text-gray-500">
                このアプリが、お子様の未来を考える上で、一つの確かな視点を提供できることを心から願っております。
            </p>
        </>
    )
};


// YouTube URLから動画IDを抽出するヘルパー関数
const getYoutubeId = (url: string): string | null => {
    // 短縮URL (youtu.be/ID)
    // エスケープ文字 \? を ? に修正 (no-useless-escape対応)
    const shortUrlMatch = url.match(/(?:youtu\.be\/|v=)([\w-]{11})(?:[?&].*)?$/);
    if (shortUrlMatch && shortUrlMatch[1]) return shortUrlMatch[1];
    
    // 通常URL (watch?v=ID)
    // エスケープ文字 \? を ? に修正 (no-useless-escape対応)
    const longUrlMatch = url.match(/[?&]v=([\w-]{11})(?:[?&].*)?$/);
    if (longUrlMatch && longUrlMatch[1]) return longUrlMatch[1];
    
    return null;
};

// --- YouTube埋め込みコンポーネント ---
const YouTubeEmbed: React.FC<{ youtubeId: string }> = ({ youtubeId }) => {
    const embedUrl = `https://www.youtube.com/embed/${youtubeId}`;

    return (
        <div className="aspect-video w-full rounded-xl overflow-hidden shadow-lg border border-gray-100">
            <iframe
                title="YouTube video player"
                src={embedUrl}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full border-0"
            />
        </div>
    );
};

// --- メインコンポーネント ---
const App: React.FC = () => { // コンポーネントにReact.FCを適用
    // Firebase State
    const [appState, setAppState] = useState<AppState>({
        db: null,
        auth: null,
        userId: null,
        isAuthReady: false,
        appId: 'default-app-id',
    });

    // App State
    const [videos, setVideos] = useState<VideoItem[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [isAdding, setIsAdding] = useState<boolean>(false);
    const [newUrl, setNewUrl] = useState<string>('');
    const [newTitle, setNewTitle] = useState<string>('');
    const [activeVideoId, setActiveVideoId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);

    // 認証とFirebase初期化 (初回のみ実行)
    useEffect(() => {
        try {
            // グローバル変数の安全な取得
            const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
            const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config as string) : {};
            const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;

            if (Object.keys(firebaseConfig).length === 0) {
                setError("Firebase設定がありません。アプリを初期化できません。");
                setIsLoading(false);
                return;
            }

            // Firebase初期化とログレベル設定
            const app = initializeApp(firebaseConfig);
            const db = getFirestore(app);
            const auth = getAuth(app);
            setLogLevel('debug'); // デバッグログを有効化

            // 認証処理
            const signIn = async () => {
                try {
                    if (initialAuthToken) {
                        await signInWithCustomToken(auth, initialAuthToken);
                    } else {
                        await signInAnonymously(auth);
                    }
                } catch (e) {
                    console.error("Firebase Auth Error:", e);
                    setError("認証に失敗しました。データをロードできません。");
                }
            };

            const unsubscribe = onAuthStateChanged(auth, (user) => {
                const userId = user?.uid || crypto.randomUUID();
                setAppState({
                    db,
                    auth,
                    userId,
                    isAuthReady: true,
                    appId,
                });
                // ローディングを解除
                setIsLoading(false); 
            });

            signIn();

            return () => unsubscribe();

        } catch (e) {
            console.error("Firebase Initialization Error:", e);
            setError("アプリの初期化中にエラーが発生しました。");
            setIsLoading(false);
        }
    }, []);

    // Firestoreデータリスナー
    useEffect(() => {
        if (!appState.isAuthReady || !appState.db) return;

        // 公開コレクションパス: /artifacts/{appId}/public/data/videos
        const videosCollectionRef = collection(appState.db, 
            `artifacts/${appState.appId}/public/data/videos`
        );
        
        // Firestoreはメモリ内でソートするようorderByは使用しない（ルール上）
        const q = query(videosCollectionRef); 

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const loadedVideos: VideoItem[] = [];
            snapshot.forEach((doc) => {
                const data = doc.data();
                loadedVideos.push({
                    id: doc.id,
                    title: (data.title as string) || 'タイトルなし',
                    youtubeId: (data.youtubeId as string) || '',
                    url: (data.url as string) || '',
                    createdAt: (data.createdAt as number) || 0,
                });
            });
            // 取得後にJavaScript側でソート（新しい順）
            loadedVideos.sort((a, b) => b.createdAt - a.createdAt);
            setVideos(loadedVideos);

            // 初回ロード時に最新の動画をアクティブにする
            if (!activeVideoId && loadedVideos.length > 0) {
                setActiveVideoId(loadedVideos[0].id);
            }
        }, (e) => {
            console.error("Firestore Listen Error:", e);
            setError("動画リストの取得に失敗しました。");
        });

        return () => unsubscribe();
    }, [appState.db, appState.appId, appState.isAuthReady, activeVideoId]); 

    // 動画の追加
    const handleAddVideo = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();
        if (!appState.db || !newUrl.trim() || !newTitle.trim()) {
            setError("タイトルとURLを入力してください。");
            return;
        }

        const youtubeId = getYoutubeId(newUrl.trim());
        if (!youtubeId) {
            setError("無効なYouTube URLです。正しい形式で入力してください。");
            return;
        }
        
        // 連続送信防止
        setIsAdding(true);
        setError(null);

        try {
            const videosCollectionRef = collection(appState.db, 
                `artifacts/${appState.appId}/public/data/videos`
            );

            const newVideo: Omit<VideoItem, 'id'> = {
                title: newTitle.trim(),
                youtubeId,
                url: newUrl.trim(),
                createdAt: Date.now(),
            };

            const docRef = await addDoc(videosCollectionRef, newVideo);
            
            // 成功メッセージ表示
            const messageBox = document.getElementById('message-box');
            if (messageBox) {
                messageBox.textContent = '動画を記録しました！';
                messageBox.classList.remove('hidden', 'bg-red-500');
                messageBox.classList.add('bg-indigo-600', 'opacity-100', 'scale-100');
                setTimeout(() => {
                    messageBox.classList.remove('opacity-100', 'scale-100');
                    messageBox.classList.add('opacity-0', 'scale-90');
                }, 2000);
            }


            setNewUrl('');
            setNewTitle('');
            setActiveVideoId(docRef.id); // 新規追加した動画をアクティブにする

        } catch (e) {
            console.error("Add Video Error:", e);
            setError("動画の追加中にエラーが発生しました。");
        } finally {
            setIsAdding(false);
        }
    }, [appState.db, appState.appId, newUrl, newTitle]);

    // 動画の削除
    const handleDeleteVideo = useCallback(async (id: string) => {
        // window.confirmの代わりにカスタムモーダルを使用することを推奨しますが、今回は既存の動作を踏襲します。
        // NOTE: Canvas環境ではwindow.confirmは非推奨ですが、ここでは動作確認のため残します。
        if (!appState.db || !window.confirm("この動画を本当に削除しますか？")) return;

        try {
            const docRef = doc(appState.db, 
                `artifacts/${appState.appId}/public/data/videos`, 
                id
            );
            await deleteDoc(docRef);
            
            // 削除後、リストの先頭をアクティブにする
            if (activeVideoId === id && videos.length > 1) {
                setActiveVideoId(videos.filter(v => v.id !== id)[0].id);
            } else if (videos.length === 1) {
                setActiveVideoId(null);
            }

            // 成功メッセージ表示
            const messageBox = document.getElementById('message-box');
            if (messageBox) {
                messageBox.textContent = '動画を削除しました。';
                messageBox.classList.remove('hidden', 'bg-indigo-600');
                messageBox.classList.add('bg-red-500', 'opacity-100', 'scale-100');
                setTimeout(() => {
                    messageBox.classList.remove('opacity-100', 'scale-100');
                    messageBox.classList.add('opacity-0', 'scale-90');
                }, 2000);
            }

        } catch (e) {
            console.error("Delete Video Error:", e);
            setError("動画の削除中にエラーが発生しました。");
        }
    }, [appState.db, appState.appId, activeVideoId, videos]);

    // 現在アクティブな動画の取得
    const activeVideo = useMemo(() => {
        return videos.find(v => v.id === activeVideoId);
    }, [videos, activeVideoId]);
    

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50">
                <div className="text-indigo-600 text-lg font-bold">アプリを初期化中...</div>
            </div>
        );
    }

    if (error && !appState.db) {
        // TypeScript Error TS7030 (Not all code paths return a value) の対応済み
        return (
            <div className="flex items-center justify-center min-h-screen bg-red-50 p-4">
                <div className="text-red-700 p-4 border border-red-300 bg-white rounded-lg shadow-md">
                    <h2 className="font-bold text-xl mb-2">エラー</h2>
                    <p>{error}</p>
                    <p className="text-sm mt-2">ブラウザをリロードするか、開発者に連絡してください。</p>
                </div>
            </div>
        );
    }
    
    return (
        <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
            {/* ヘッダー */}
            <header className="bg-white shadow-md p-4 sticky top-0 z-10 border-b border-indigo-100">
                <div className="max-w-7xl mx-auto flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        {/* 修正箇所: カテゴリ一覧に戻る機能を追加 */}
                        <button
                            onClick={() => window.history.back()} // console.log から window.history.back() に変更
                            className="p-1 rounded-full text-gray-500 hover:bg-gray-100 hover:text-indigo-600 transition-colors flex items-center justify-center"
                            title="カテゴリ一覧に戻る"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
                        </button>
                        <h1 className="text-2xl font-bold text-indigo-700">
                            賢人の子育て指針 <span className="text-sm font-normal text-gray-400">Wisdom Guide</span>
                        </h1>
                    </div>
                    <div className="text-xs bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full font-mono shadow-inner border border-indigo-200 hidden sm:block">
                        USER ID: {appState.userId}
                    </div>
                </div>
            </header>

            <main className="flex-grow p-4 max-w-7xl mx-auto w-full">
                {/* メインレイアウト */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    
                    {/* 左カラム: 動画プレイヤー & 開発者プロフィール (Lg以上で2/3幅) */}
                    <div className="lg:col-span-2 space-y-6">
                        
                        {/* 選択された動画プレイヤー */}
                        <div className="bg-white p-4 sm:p-6 rounded-xl shadow-lg border border-gray-100">
                            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                                <span className="text-indigo-500">▶️</span> {activeVideo ? activeVideo.title : '動画が選択されていません'}
                            </h2>
                            {activeVideo ? (
                                <YouTubeEmbed youtubeId={activeVideo.youtubeId} />
                            ) : (
                                <div className="aspect-video w-full flex items-center justify-center bg-gray-100 rounded-xl text-gray-400">
                                    <p>動画リストから再生したい動画を選択してください。</p>
                                </div>
                            )}
                            {activeVideo && (
                                <p className="text-xs text-gray-400 mt-2 text-right">
                                    登録URL: {activeVideo.url}
                                </p>
                            )}
                        </div>

                        {/* 開発者プロフィール/メッセージ */}
                        <div className="bg-white p-4 sm:p-6 rounded-xl shadow-lg border border-gray-100">
                            <h2 className="text-xl font-bold text-indigo-700 mb-4 border-b pb-2">
                                {DEVELOPER_MESSAGE.title}
                            </h2>
                            <div className="space-y-3 text-gray-600">
                                {DEVELOPER_MESSAGE.content}
                            </div>
                        </div>
                    </div>
                    
                    {/* 右カラム: 動画リスト & 登録フォーム (Lg以上で1/3幅) */}
                    <div className="lg:col-span-1 space-y-6">
                        
                        {/* 動画登録フォーム */}
                        <div className="bg-white p-4 rounded-xl shadow-lg border border-gray-100">
                            <h3 className="text-lg font-bold text-gray-800 mb-3 border-b pb-2">
                                ➕ 新しい知恵を登録
                            </h3>
                            <form onSubmit={handleAddVideo} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-1">
                                        動画タイトル
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={newTitle}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewTitle(e.target.value)} // 型追加
                                        placeholder="例: スティーブ・ジョブズ 卒業式スピーチ"
                                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-1">
                                        YouTube URL
                                    </label>
                                    <input
                                        type="url"
                                        required
                                        value={newUrl}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewUrl(e.target.value)} // 型追加
                                        placeholder="例: https://www.youtube.com/watch?v=..."
                                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={isAdding}
                                    className="w-full py-2 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 transition-colors shadow-md disabled:bg-indigo-400"
                                >
                                    {isAdding ? '登録中...' : '登録してリストに追加'}
                                </button>
                                {error && (
                                    <p className="text-sm text-red-600 mt-2 p-2 bg-red-50 rounded-lg border border-red-200">
                                        エラー: {error}
                                    </p>
                                )}
                            </form>
                        </div>
                        
                        {/* 動画リスト */}
                        <div className="bg-white p-4 rounded-xl shadow-lg border border-gray-100 max-h-[60vh] overflow-y-auto">
                            <h3 className="text-lg font-bold text-gray-800 mb-3 border-b pb-2">
                                📜 動画リスト ({videos.length}件)
                            </h3>
                            {videos.length === 0 ? (
                                <p className="text-gray-500 text-sm py-4 text-center">
                                    まだ動画が登録されていません。
                                </p>
                            ) : (
                                <ul className="space-y-2">
                                    {videos.map((video) => (
                                        <li 
                                            key={video.id} 
                                            className={`p-3 rounded-lg cursor-pointer transition-all border ${activeVideoId === video.id 
                                                ? 'bg-indigo-50 border-indigo-300 shadow-sm' 
                                                : 'bg-white hover:bg-gray-50 border-gray-200'
                                            }`}
                                        >
                                            <div 
                                                className="flex justify-between items-center"
                                                onClick={() => setActiveVideoId(video.id)}
                                            >
                                                <span className={`text-sm font-medium ${activeVideoId === video.id ? 'text-indigo-800' : 'text-gray-700'}`}>
                                                    {video.title}
                                                </span>
                                                <button
                                                    onClick={(e: React.MouseEvent) => { // 型追加
                                                        e.stopPropagation(); // 親要素のクリックイベントを停止
                                                        handleDeleteVideo(video.id);
                                                    }}
                                                    className="text-gray-300 hover:text-red-500 p-1 rounded-full transition-colors"
                                                    title="削除"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                                                </button>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </div>
                </div>
            </main>
            
            {/* メッセージボックス (カスタムアラート) */}
            <div 
                id="message-box"
                className="fixed bottom-4 left-1/2 transform -translate-x-1/2 p-3 bg-indigo-600 text-white rounded-xl shadow-xl transition-all duration-300 opacity-0 scale-90 hidden z-50 font-bold"
            >
            </div>
            
            {/* <footer>
                <div className="text-center text-xs text-gray-400 py-2 border-t mt-4">
                    データはFirestoreに公開保存されています。
                </div>
            </footer> */}
        </div>
    );
}

export default App;