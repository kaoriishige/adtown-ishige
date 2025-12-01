import React, { useState, useEffect, useCallback, useMemo } from 'react';
// Firebase Imports
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import { 
    getFirestore, doc, addDoc, deleteDoc, onSnapshot, collection, query, updateDoc, setDoc
} from 'firebase/firestore'; 

// --- グローバル変数型定義 (環境提供の変数のための宣言) ---
declare const __app_id: string | undefined;
declare const __firebase_config: string | undefined;
declare const __initial_auth_token: string | undefined;

/**
 * ★重要★
 * 管理者ID (開発者は自身のIDに置き換える必要があります)
 * Firebase Authでログインした際に得られる管理者アカウントのUIDを設定してください。
 */
const ADMIN_USER_ID = "YOUR_ACTUAL_ADMIN_USER_ID"; // 例: "u-abcdef123456" 

// ----------------------------------------------------------------
// --- 型定義 ---
// ----------------------------------------------------------------
interface VideoItem {
    id: string; // Firestore Document ID
    title: string;
    youtubeId: string; // YouTube埋め込み用ID
    url: string; // 元のURL
    createdAt: number;
}

interface MessageData {
    title: string;
    content: string; // HTMLタグを含む文字列として管理
}

interface AppState {
    db: any;
    auth: any;
    userId: string | null;
    isAuthReady: boolean;
    appId: string;
}

// ----------------------------------------------------------------
// 初期開発者メッセージ (初回ロード用)
// ----------------------------------------------------------------
const INITIAL_DEVELOPER_MESSAGE: MessageData = {
    title: "👨‍💻 開発者からのメッセージ",
    content: `
        <p class="text-sm font-semibold text-gray-700 mb-1">
            サクセス研究社 代表 田代 稔 (67歳)
        </p>
        <p class="text-sm mb-3">
            私は、この地域アプリ「みんなの那須アプリ」の開発者であり、サクセス研究社の代表を務めております、田代 稔と申します。
        </p>
        <p class="text-sm mb-3">
            正直に申し上げまして、数年前まで、私のような60代の人間が、このようなAIをテーマにしたアプリを自ら作り上げることなど、夢にも思っていませんでした。
        </p>
        <p class="text-sm mb-3">
            しかし、2022年12月にChatGPTという革新的なAIが登場し、世界は一変しました。私は、2023年4月からAIの使い方を本格的に学び始め、その計り知れない可能性と、圧倒的な進化のスピードを肌で感じることとなりました。
        </p>
        <p class="text-sm mb-3">
            そして、この「賢人の子育て指針 Wisdom Guide」アプリは、<strong>私自身がAIと対話を重ねながら</strong>、まさにその進化の波に乗って作り上げたものです。この「おじさん」でもアプリ開発ができるようになったという事実こそが、時代の変化の証だと確信しています。
        </p>
        
        <p class="text-base font-bold text-indigo-600 border-t pt-3 mt-4">--- 時代を見つめる知恵を、子育て中のあなたへ ---</p>

        <p class="text-sm mt-3 mb-3">
            いま、子育てに奮闘されているお母様方（親御さん）の胸には、「この子たちが大人になる頃、AIはどのような社会を作っているのだろう？」「その社会で生き抜くために、何を学ばせるべきだろうか？」という大きな不安があることと思います。
        </p>
        <p class="text-sm mb-3">
            このアプリは、その不安に向き合うための羅針盤です。
        </p>
        <p class="text-sm mb-3">
            スティーブ・ジョブズ、イーロン・マスク、ビル・ゲイツ、サム・アルトマン、ジョン・マルティニス、リード・ホフマンといった、世界の未来を形作ってきた著名人の「知恵の言葉」を動画としてご覧いただけます。
        </p>
        <p class="text-sm mb-3 font-medium text-red-600">
            私たちは、ここで語られるすべてを盲目的に信じてほしいとは全く思っていません。ただ、ぜひ、ご自身の目で、世の中の大きな潮流、世界がどこに向かっているのかをご覧になってください。
        </p>
        <p class="text-sm italic text-gray-500">
            このアプリが、お子様の未来を考える上で、一つの確かな視点を提供できることを心から願っております。
        </p>
    `,
};

// ----------------------------------------------------------------
// ヘルパー関数とコンポーネント
// ----------------------------------------------------------------
// YouTube URLから動画IDを抽出するヘルパー関数
const getYoutubeId = (url: string): string | null => {
    const shortUrlMatch = url.match(/(?:youtu\.be\/|v=)([\w-]{11})(?:[?&].*)?$/);
    if (shortUrlMatch && shortUrlMatch[1]) return shortUrlMatch[1];
    const longUrlMatch = url.match(/[?&]v=([\w-]{11})(?:[?&].*)?$/);
    if (longUrlMatch && longUrlMatch[1]) return longUrlMatch[1];
    return null;
};

// YouTube埋め込みコンポーネント
const YouTubeEmbed: React.FC<{ youtubeId: string }> = ({ youtubeId }) => {
    const embedUrl = `https://www.youtube.com/embed/${youtubeId}`;
    return (
        <div 
            className="w-full rounded-xl overflow-hidden shadow-lg border border-gray-100"
            style={{ position: 'relative', paddingTop: '56.25%', height: 0 }} 
        >
            <iframe
                title="YouTube video player"
                src={embedUrl}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    border: 'none',
                }}
            />
        </div>
    );
};

// ----------------------------------------------------------------
// --- メインコンポーネント ---
// ----------------------------------------------------------------
const App: React.FC = () => { 
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
    const [developerMessage, setDeveloperMessage] = useState<MessageData>(INITIAL_DEVELOPER_MESSAGE);
    const [error, setError] = useState<string | null>(null);
    const [isAdding, setIsAdding] = useState<boolean>(false);
    const [newUrl, setNewUrl] = useState<string>('');
    const [newTitle, setNewTitle] = useState<string>('');
    const [activeVideoId, setActiveVideoId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    // 💡 追加: タイトル編集中かどうかの状態
    const [isEditingId, setIsEditingId] = useState<string | null>(null);
    const [editingTitle, setEditingTitle] = useState<string>('');
    // 💡 追加: メッセージ編集中かどうかの状態
    const [isEditingMessage, setIsEditingMessage] = useState<boolean>(false);
    const [editingMessageContent, setEditingMessageContent] = useState<string>(INITIAL_DEVELOPER_MESSAGE.content);


    // 管理者判定
    const isAdmin = appState.userId === ADMIN_USER_ID;
    
    // 成功/エラーメッセージ表示ヘルパー
    const showMessage = useCallback((text: string, isError = false) => {
        const messageBox = document.getElementById('message-box');
        if (messageBox) {
            messageBox.textContent = text;
            messageBox.classList.remove('hidden', 'opacity-0', 'scale-90', 'bg-indigo-600', 'bg-red-500');
            messageBox.classList.add(isError ? 'bg-red-500' : 'bg-indigo-600', 'opacity-100', 'scale-100');
            setTimeout(() => {
                messageBox.classList.remove('opacity-100', 'scale-100');
                messageBox.classList.add('opacity-0', 'scale-90', 'hidden');
            }, 2000);
        }
    }, []);

    // 認証とFirebase初期化 (初回のみ実行)
    useEffect(() => {
        // ... (認証ロジックは省略 - 変更なし) ...
        try {
            const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
            const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config as string) : {};
            const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;

            if (Object.keys(firebaseConfig).length === 0) {
                setError("Firebase設定がありません。アプリを初期化できません。");
                setIsLoading(false);
                return;
            }

            const app = initializeApp(firebaseConfig);
            const db = getFirestore(app);
            const auth = getAuth(app);
            // setLogLevel('debug'); 

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
                
                if (!initialAuthToken && ADMIN_USER_ID === "YOUR_ACTUAL_ADMIN_USER_ID") {
                    console.warn("ADMIN_USER_IDが設定されていません。動画登録機能は利用できません。");
                }

                setAppState({
                    db,
                    auth,
                    userId,
                    isAuthReady: true,
                    appId,
                });
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

    // 💡 Firestoreデータリスナー (動画リストと開発者メッセージの両方)
    useEffect(() => {
        if (!appState.isAuthReady || !appState.db) return;

        // 1. 動画リストのリスナー
        const videosCollectionRef = collection(appState.db, 
            `artifacts/${appState.appId}/public/data/videos`
        );
        const videosQuery = query(videosCollectionRef); 
        const unsubscribeVideos = onSnapshot(videosQuery, (snapshot) => {
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
            loadedVideos.sort((a, b) => b.createdAt - a.createdAt);
            setVideos(loadedVideos);

            if (!activeVideoId && loadedVideos.length > 0) {
                setActiveVideoId(loadedVideos[0].id);
            }
        }, (e) => {
            console.error("Firestore Videos Listen Error:", e);
            setError("動画リストの取得に失敗しました。");
        });
        
        // 2. 開発者メッセージのリスナー
        const messageDocRef = doc(appState.db, 
            `artifacts/${appState.appId}/public/data/developerMessage`, 
            'current'
        );
        const unsubscribeMessage = onSnapshot(messageDocRef, (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                const loadedMessage: MessageData = {
                    title: (data.title as string) || INITIAL_DEVELOPER_MESSAGE.title,
                    content: (data.content as string) || INITIAL_DEVELOPER_MESSAGE.content,
                };
                setDeveloperMessage(loadedMessage);
                setEditingMessageContent(loadedMessage.content); // 編集用Stateも更新
            } else {
                 // ドキュメントがない場合は初期値を設定（管理者であれば作成できるようにする）
                 setDeveloperMessage(INITIAL_DEVELOPER_MESSAGE);
                 setEditingMessageContent(INITIAL_DEVELOPER_MESSAGE.content);
            }
        }, (e) => {
            console.error("Firestore Message Listen Error:", e);
        });

        return () => {
            unsubscribeVideos();
            unsubscribeMessage();
        };
    }, [appState.db, appState.appId, appState.isAuthReady, activeVideoId]); 

    /**
     * 動画の追加処理 (管理者専用)
     */
    const handleAddVideo = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!isAdmin) {
            showMessage("管理者のみが動画を追加できます。", true);
            return;
        }
        // ... (入力チェックロジックは省略) ...
        if (!appState.db || !newUrl.trim() || !newTitle.trim()) {
            showMessage("タイトルとURLを入力してください。", true);
            return;
        }

        const youtubeId = getYoutubeId(newUrl.trim());
        if (!youtubeId) {
            showMessage("無効なYouTube URLです。正しい形式で入力してください。", true);
            return;
        }
        
        setIsAdding(true);

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
            
            showMessage('動画を記録しました！');

            setNewUrl('');
            setNewTitle('');
            setActiveVideoId(docRef.id); 

        } catch (e) {
            console.error("Add Video Error:", e);
            showMessage("動画の追加中にエラーが発生しました。", true);
        } finally {
            setIsAdding(false);
        }
    }, [appState.db, appState.appId, newUrl, newTitle, isAdmin, showMessage]);

    /**
     * 動画の削除処理 (管理者専用)
     */
    const handleDeleteVideo = useCallback(async (id: string) => {
        
        if (!isAdmin) {
            console.warn("管理者以外は削除できません。");
            return; 
        }

        if (!appState.db || !window.confirm("この動画を本当に削除しますか？")) return;

        try {
            const docRef = doc(appState.db, 
                `artifacts/${appState.appId}/public/data/videos`, 
                id
            );
            await deleteDoc(docRef);
            
            // 削除後、アクティブ動画を変更
            if (activeVideoId === id) {
                const remainingVideos = videos.filter(v => v.id !== id);
                setActiveVideoId(remainingVideos.length > 0 ? remainingVideos[0].id : null);
            }

            showMessage('動画を削除しました。');

        } catch (e) {
            console.error("Delete Video Error:", e);
            showMessage("動画の削除中にエラーが発生しました。", true);
        }
    }, [appState.db, appState.appId, activeVideoId, videos, isAdmin, showMessage]);


    /**
     * 💡 追加: 動画タイトルの編集保存
     */
    const handleEditTitle = useCallback(async (id: string) => {
        if (!isAdmin || !appState.db || !editingTitle.trim()) return;

        try {
            const docRef = doc(appState.db, 
                `artifacts/${appState.appId}/public/data/videos`, 
                id
            );
            await updateDoc(docRef, { 
                title: editingTitle.trim() 
            });
            showMessage('タイトルを更新しました。');
            setIsEditingId(null);
        } catch (e) {
            console.error("Edit Title Error:", e);
            showMessage("タイトルの更新に失敗しました。", true);
        }
    }, [appState.db, appState.appId, editingTitle, isAdmin, showMessage]);


    /**
     * 💡 追加: 開発者メッセージの編集保存
     */
    const handleSaveMessage = useCallback(async () => {
        if (!isAdmin || !appState.db) return;

        try {
            const docRef = doc(appState.db, 
                `artifacts/${appState.appId}/public/data/developerMessage`, 
                'current' // 単一ドキュメントID
            );
            
            // タイトルは変更しない前提
            const newTitle = developerMessage.title;

            await setDoc(docRef, { 
                title: newTitle,
                content: editingMessageContent,
            });

            showMessage('開発者メッセージを更新しました。');
            setIsEditingMessage(false);
            setDeveloperMessage({ title: newTitle, content: editingMessageContent });
        } catch (e) {
            console.error("Save Message Error:", e);
            showMessage("メッセージの更新に失敗しました。", true);
        }
    }, [appState.db, appState.appId, developerMessage.title, editingMessageContent, isAdmin, showMessage]);


    // 現在アクティブな動画の取得
    const activeVideo = useMemo(() => {
        return videos.find(v => v.id === activeVideoId);
    }, [videos, activeVideoId]);
    

    // ----------------------------------------------------------------
    // --- レンダリング ---
    // ----------------------------------------------------------------
    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50">
                <div className="text-indigo-600 text-lg font-bold">アプリを初期化中...</div>
            </div>
        );
    }

    if (error && !appState.db) {
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
                        <button
                            onClick={() => window.history.back()} 
                            className="p-1 rounded-full text-gray-500 hover:bg-gray-100 hover:text-indigo-600 transition-colors flex items-center justify-center"
                            title="カテゴリ一覧に戻る"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
                        </button>
                        <h1 className="text-2xl font-bold text-indigo-700">
                            賢人の子育て指針 <span className="text-sm font-normal text-gray-400">Wisdom Guide</span>
                        </h1>
                    </div>
                    {/* 管理者であることをUIで視覚的に確認できるようにする */}
                    <div className="flex items-center gap-2">
                        {isAdmin && (
                            <span className="text-xs bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full font-bold shadow-inner border border-yellow-300">
                                ADMIN MODE
                            </span>
                        )}
                        <div className="text-xs bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full font-mono shadow-inner border border-indigo-200 hidden sm:block">
                            USER ID: {appState.userId}
                        </div>
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

                        {/* 💡 開発者プロフィール/メッセージ (編集機能付き) */}
                        <div className="bg-white p-4 sm:p-6 rounded-xl shadow-lg border border-gray-100">
                            <div className="flex justify-between items-start mb-4 border-b pb-2">
                                <h2 className="text-xl font-bold text-indigo-700">
                                    {developerMessage.title}
                                </h2>
                                {isAdmin && (
                                    <button
                                        onClick={() => {
                                            if (isEditingMessage) {
                                                // 編集中に閉じる場合はキャンセル扱い
                                                setEditingMessageContent(developerMessage.content);
                                            }
                                            setIsEditingMessage(!isEditingMessage);
                                        }}
                                        className="text-xs bg-gray-100 text-gray-700 hover:bg-gray-200 px-3 py-1 rounded-full transition-colors font-medium"
                                    >
                                        {isEditingMessage ? '編集モード終了' : 'メッセージを編集'}
                                    </button>
                                )}
                            </div>
                            
                            {isEditingMessage && isAdmin ? (
                                <div>
                                    <textarea
                                        value={editingMessageContent}
                                        onChange={(e) => setEditingMessageContent(e.target.value)}
                                        rows={15}
                                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 font-mono text-xs"
                                        placeholder="HTMLタグを含むメッセージ内容を入力してください..."
                                    />
                                    <button
                                        onClick={handleSaveMessage}
                                        className="mt-2 w-full py-2 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 transition-colors shadow-md"
                                    >
                                        メッセージを保存
                                    </button>
                                    {/* ⚠️ エラーの原因となっていた警告メッセージの<p>タグは削除しました */}
                                </div>
                            ) : (
                                <div 
                                    className="space-y-3 text-gray-600"
                                    // ⚠️ 危険なHTMLを挿入します。信頼できるデータソースでのみ使用してください。
                                    dangerouslySetInnerHTML={{ __html: developerMessage.content }}
                                />
                            )}
                        </div>
                    </div>
                    
                    {/* 右カラム: 動画リスト & 登録フォーム (Lg以上で1/3幅) */}
                    <div className="lg:col-span-1 space-y-6">
                        
                        {/* 動画登録フォーム (管理者のみに表示) */}
                        {isAdmin && (
                            <div className="bg-white p-4 rounded-xl shadow-lg border border-gray-100">
                                <h3 className="text-lg font-bold text-gray-800 mb-3 border-b pb-2">
                                    ➕ 新しい知恵を登録 (管理者専用)
                                </h3>
                                <form onSubmit={handleAddVideo} className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-medium text-gray-500 mb-1">動画タイトル</label>
                                        <input
                                            type="text"
                                            required
                                            value={newTitle}
                                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewTitle(e.target.value)} 
                                            placeholder="例: スティーブ・ジョブズ 卒業式スピーチ"
                                            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-500 mb-1">YouTube URL</label>
                                        <input
                                            type="url"
                                            required
                                            value={newUrl}
                                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewUrl(e.target.value)} 
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
                                </form>
                            </div>
                        )}
                        
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
                                            <div className="flex flex-col">
                                                <div 
                                                    className="flex justify-between items-center"
                                                    onClick={() => {
                                                        if (isEditingId !== video.id) {
                                                            setActiveVideoId(video.id);
                                                        }
                                                    }}
                                                >
                                                    {isEditingId === video.id ? (
                                                        // 💡 編集モード
                                                        <input
                                                            type="text"
                                                            value={editingTitle}
                                                            onChange={(e) => setEditingTitle(e.target.value)}
                                                            onKeyDown={(e) => {
                                                                if (e.key === 'Enter') handleEditTitle(video.id);
                                                            }}
                                                            className="flex-grow p-1 border border-indigo-400 rounded-md text-sm font-medium text-indigo-800 mr-2"
                                                            autoFocus
                                                        />
                                                    ) : (
                                                        // 通常表示
                                                        <span className={`text-sm font-medium flex-grow ${activeVideoId === video.id ? 'text-indigo-800' : 'text-gray-700'}`}>
                                                            {video.title}
                                                        </span>
                                                    )}
                                                    
                                                    {/* 💡 管理者向けアクションボタン */}
                                                    {isAdmin && (
                                                        <div className="flex items-center space-x-1">
                                                            {isEditingId === video.id ? (
                                                                <>
                                                                    <button
                                                                        onClick={(e) => {
                                                                            e.stopPropagation(); 
                                                                            handleEditTitle(video.id);
                                                                        }}
                                                                        className="text-white bg-indigo-500 hover:bg-indigo-600 p-1 rounded-full transition-colors"
                                                                        title="保存"
                                                                    >
                                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                                                                    </button>
                                                                    <button
                                                                        onClick={(e) => {
                                                                            e.stopPropagation(); 
                                                                            setIsEditingId(null);
                                                                            setEditingTitle('');
                                                                        }}
                                                                        className="text-gray-500 hover:text-gray-700 p-1 rounded-full transition-colors"
                                                                        title="キャンセル"
                                                                    >
                                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                                                                    </button>
                                                                </>
                                                            ) : (
                                                                <>
                                                                    {/* 編集ボタン */}
                                                                    <button
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            setIsEditingId(video.id);
                                                                            setEditingTitle(video.title);
                                                                        }}
                                                                        className="text-gray-300 hover:text-blue-500 p-1 rounded-full transition-colors"
                                                                        title="タイトル編集"
                                                                    >
                                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-7-9l3 3m-3-3l-3 3"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 8l-4 4M15 11l4-4"></path></svg>
                                                                    </button>
                                                                    
                                                                    {/* 削除ボタン */}
                                                                    <button
                                                                        onClick={(e: React.MouseEvent) => { 
                                                                            e.stopPropagation(); 
                                                                            handleDeleteVideo(video.id);
                                                                        }}
                                                                        className="text-gray-300 hover:text-red-500 p-1 rounded-full transition-colors"
                                                                        title="動画削除"
                                                                    >
                                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                                                                    </button>
                                                                </>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
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
                className="fixed bottom-4 left-1/2 transform -translate-x-1/2 p-3 text-white rounded-xl shadow-xl transition-all duration-300 opacity-0 scale-90 hidden z-50 font-bold whitespace-nowrap"
            >
            </div>
            
        </div>
    );
}

export default App;