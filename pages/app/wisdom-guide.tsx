import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import { 
    collection, 
    onSnapshot, 
    query, 
    orderBy, 
    getFirestore, // Firestoreを直接利用
    doc, 
    setDoc 
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth'; // Authを直接利用

// --- (1) 環境依存の定数と初期データ -----------------------------------------

/**
 * あなたのFirebase AuthenticationのユーザーID (UID) に置き換えてください。
 * これが設定されていないと、管理者機能（動画の新規登録）が動作しません。
 */
const ADMIN_USER_ID = "YOUR_ACTUAL_ADMIN_USER_ID_HERE"; 

const YOUTUBE_VIDEO_BASE_URL = "https://www.youtube.com/embed/";
const FIRESTORE_COLLECTION_PATH = "artifacts/wisdom-guide/public/data/videos"; 

interface VideoItem {
    id: string; // YouTubeの動画ID
    title: string;
    description: string;
    speaker: string;
    category: string;
    createdAt: number;
}

// ⚠️ 初期データ (ジェンスン・フアン氏の動画を含む)
const INITIAL_HARDCODED_VIDEOS: VideoItem[] = [
    {
        id: 'KKB4ZgU15F0',
        title: 'ジェンスン・フアンの「プログラミングは学ぶな」AI革命サバイバルガイド',
        description: 'NVIDIA CEOによるAI時代の教育とキャリアに関する重要なメッセージ。',
        speaker: 'ジェンスン・フアン',
        category: 'AI / 教育',
        createdAt: Date.now() + 2, 
    },
    {
        id: '1sJc1K7_W_E',
        title: 'マイクロソフトCEO サティア・ナデラが語る「共感力」とビジネスの未来',
        description: '共感をコアとしたリーダーシップと、Microsoftの企業文化変革について。',
        speaker: 'サティア・ナデラ',
        category: 'ビジネス / リーダーシップ',
        createdAt: Date.now() + 1,
    },
    {
        id: 'h6Z9z7D5GkE',
        title: 'アインシュタインが残した「創造性と知性」についての教訓',
        description: '相対性理論を築いた科学者の、思考プロセスと学びへのアプローチ。',
        speaker: 'アルベルト・アインシュタイン',
        category: '科学 / 哲学',
        createdAt: Date.now(),
    },
];

// --- (2) ヘルパーコンポーネント (変更なし) -------------------------------------

const LoadingSpinner: React.FC = () => (
    <div className="flex justify-center items-center h-40">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
    </div>
);

interface VideoPlayerProps {
    videoId: string;
    title: string;
    description: string;
}

const VideoPlayer: React.FC<VideoPlayerProps> = React.memo(({ videoId, title, description }) => (
    <div className="w-full">
        <div className="aspect-video bg-gray-200 rounded-lg overflow-hidden shadow-lg mb-4">
            <iframe
                className="w-full h-full"
                src={`${YOUTUBE_VIDEO_BASE_URL}${videoId}`}
                title={title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
            ></iframe>
        </div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">{title}</h2>
        <p className="text-gray-600 border-l-4 border-indigo-500 pl-3 py-1 mb-4">{description}</p>
    </div>
));
VideoPlayer.displayName = 'VideoPlayer';


interface VideoListProps {
    videos: VideoItem[];
    activeVideoId: string;
    onSelectVideo: (video: VideoItem) => void;
}

const VideoList: React.FC<VideoListProps> = React.memo(({ videos, activeVideoId, onSelectVideo }) => (
    <div className="space-y-3">
        <h3 className="text-xl font-semibold text-gray-800 border-b pb-2">知恵のアーカイブ</h3>
        {videos.map((video) => (
            <div
                key={video.id}
                onClick={() => onSelectVideo(video)}
                className={`p-4 rounded-lg shadow-md cursor-pointer transition duration-200 ${
                    video.id === activeVideoId 
                        ? 'bg-indigo-500 text-white shadow-lg' 
                        : 'bg-white hover:bg-gray-50'
                }`}
            >
                <p className={`font-semibold ${video.id === activeVideoId ? '' : 'text-gray-800'}`}>{video.title}</p>
                <p className={`text-sm ${video.id === activeVideoId ? 'text-indigo-200' : 'text-gray-500'}`}>
                    {video.speaker} ({video.category})
                </p>
            </div>
        ))}
    </div>
));
VideoList.displayName = 'VideoList';


// --- (3) 管理者用フォームコンポーネント (変更なし) --------------------------------------

interface AdminFormProps {
    appId: string;
    onVideoAdded: () => void;
}

const AdminForm: React.FC<AdminFormProps> = ({ appId, onVideoAdded }) => {
    const [youtubeId, setYoutubeId] = useState('');
    const [title, setTitle] = useState('');
    const [speaker, setSpeaker] = useState('');
    const [category, setCategory] = useState('');
    const [description, setDescription] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const db = getFirestore(); // 直接取得

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess(false);
        setLoading(true);

        if (!youtubeId || !title || !speaker) {
            setError('YouTube ID, タイトル、話者は必須です。');
            setLoading(false);
            return;
        }

        try {
            const newVideoId = youtubeId.trim();
            const videoDocRef = doc(db, FIRESTORE_COLLECTION_PATH, newVideoId);
            
            const newVideo: VideoItem = {
                id: newVideoId,
                title: title.trim(),
                description: description.trim() || '説明がありません',
                speaker: speaker.trim(),
                category: category.trim() || '未分類',
                createdAt: Date.now(),
            };

            await setDoc(videoDocRef, newVideo);
            
            setSuccess(true);
            setYoutubeId('');
            setTitle('');
            setSpeaker('');
            setCategory('');
            setDescription('');

            onVideoAdded(); 
            
        } catch (err) {
            console.error("動画の新規登録エラー:", err);
            setError('動画の登録に失敗しました。管理者権限やFirestoreの書き込み設定を確認してください。');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="mt-8 p-6 bg-yellow-50 border border-yellow-200 rounded-lg shadow-inner">
            <h3 className="text-xl font-bold text-yellow-800 mb-4">管理者: 新規動画登録フォーム</h3>
            <form onSubmit={handleSubmit} className="space-y-3">
                <input
                    type="text"
                    placeholder="YouTube ID (例: KKB4ZgU15F0)"
                    value={youtubeId}
                    onChange={(e) => setYoutubeId(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded"
                    required
                />
                <input
                    type="text"
                    placeholder="タイトル"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded"
                    required
                />
                <input
                    type="text"
                    placeholder="話者 (例: ジェンスン・フアン)"
                    value={speaker}
                    onChange={(e) => setSpeaker(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded"
                    required
                />
                <input
                    type="text"
                    placeholder="カテゴリー (例: AI / 教育)"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded"
                />
                <textarea
                    placeholder="説明文"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded h-20"
                />
                
                <button
                    type="submit"
                    className={`w-full py-2 rounded font-bold transition duration-200 ${
                        loading ? 'bg-gray-400' : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                    }`}
                    disabled={loading}
                >
                    {loading ? '登録中...' : '動画を登録'}
                </button>
                
                {error && <p className="text-red-600 font-medium">{error}</p>}
                {success && <p className="text-green-600 font-medium">✅ 動画が正常に登録されました！</p>}
            </form>
        </div>
    );
};
AdminForm.displayName = 'AdminForm';


// --- (4) メインコンポーネント (修正箇所) --------------------------------------

const VideoGuide: React.FC = () => {
    const router = useRouter();
    const { appId } = router.query;
    
    // Authはクライアント側で利用可能かチェック
    const [isAdmin, setIsAdmin] = useState(false);
    
    // App State
    const [videos, setVideos] = useState<VideoItem[]>(INITIAL_HARDCODED_VIDEOS); 
    const [activeVideo, setActiveVideo] = useState<VideoItem>(INITIAL_HARDCODED_VIDEOS[0]);
    const [isLoading, setIsLoading] = useState(true);

    // 管理者チェック
    useEffect(() => {
        try {
            const user = getAuth().currentUser;
            const isUserAdmin = user?.uid === ADMIN_USER_ID;
            setIsAdmin(isUserAdmin);
            console.log(`DEBUG: Admin status check complete. Is Admin: ${isUserAdmin}`);
        } catch (e) {
            // Firebase Authが初期化されていない可能性
            console.warn("Firebase Auth is not ready or accessible.");
        }
    }, []);


    // Firestoreリスナーのセットアップ
    useEffect(() => {
        // Firebaseがまだ利用可能でない場合は処理をスキップ (ここではコンポーネントがマウントされたら実行)
        if (typeof appId !== 'string') return;
        
        console.log("DEBUG: useEffect hook started. Setting up Firestore listener.");

        try {
            const db = getFirestore(); // Firestoreインスタンスを直接取得
            const videosRef = collection(db, FIRESTORE_COLLECTION_PATH);
            const q = query(videosRef, orderBy("createdAt", "desc"));

            const unsubscribe = onSnapshot(q, (snapshot) => {
                const loadedVideos: VideoItem[] = [];
                snapshot.forEach((doc) => {
                    loadedVideos.push(doc.data() as VideoItem);
                });
                
                console.log(`DEBUG: Firestore load complete. Loaded ${loadedVideos.length} videos.`);
                
                // データが空の場合、初期データを使用
                if (loadedVideos.length === 0) {
                    console.log("DEBUG: Firestore is empty. Displaying INITIAL_HARDCODED_VIDEOS.");
                    const sortedInitialVideos = INITIAL_HARDCODED_VIDEOS.sort((a, b) => b.createdAt - a.createdAt);
                    setVideos(sortedInitialVideos);
                    setActiveVideo(sortedInitialVideos[0]);
                } else {
                    console.log("DEBUG: Firestore has data. Displaying loadedVideos.");
                    setVideos(loadedVideos);
                    // アクティブな動画が既に設定されていればそれを維持、そうでなければ最新の動画をセット
                    if (!activeVideo || !loadedVideos.find(v => v.id === activeVideo.id)) {
                        setActiveVideo(loadedVideos[0]);
                    }
                }
                setIsLoading(false);
            }, (error) => {
                // Firestoreのエラーハンドリング
                console.error("Firestoreリスナーエラー:", error);
                // エラー時もハードコードされた初期データを表示
                console.log("DEBUG: Firestore Error. Displaying INITIAL_HARDCODED_VIDEOS as fallback.");
                const sortedInitialVideos = INITIAL_HARDCODED_VIDEOS.sort((a, b) => b.createdAt - a.createdAt);
                setVideos(sortedInitialVideos);
                setActiveVideo(sortedInitialVideos[0]);
                setIsLoading(false);
            });

            return () => unsubscribe();
        } catch (e) {
            // Firestoreの初期化自体に失敗した場合の処理
            console.error("Failed to initialize Firestore or listener:", e);
            setIsLoading(false);
            // 初期データのみで続行
            setVideos(INITIAL_HARDCODED_VIDEOS);
            setActiveVideo(INITIAL_HARDCODED_VIDEOS[0]);
            return () => {};
        }

    // activeVideoを依存配列から削除し、ESLintの警告を無視することで
    // リスナーが何度も再起動するのを防ぎます
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [appId]);


    const handleVideoSelect = useCallback((video: VideoItem) => {
        setActiveVideo(video);
    }, []);

    const handleVideoAdded = useCallback(() => {
        console.log("DEBUG: Admin form submitted. Waiting for Firestore listener update.");
    }, []);
    
    // 描画直前のデータを確認
    console.log(`DEBUG: Rendering component. Current videos state length: ${videos.length}`);


    if (isLoading) {
        return (
            <div className="container mx-auto p-4 max-w-7xl">
                <LoadingSpinner />
            </div>
        );
    }
    
    if (videos.length === 0) {
        return (
            <div className="container mx-auto p-4 max-w-7xl text-center">
                <h1 className="text-3xl font-bold mb-4">知恵のガイド</h1>
                <p className="text-gray-600">現在、表示できる動画がありません。</p>
                {isAdmin && <AdminForm appId={appId as string} onVideoAdded={handleVideoAdded} />}
            </div>
        );
    }

    return (
        <div className="container mx-auto p-4 max-w-7xl">
            <h1 className="text-4xl font-extrabold text-gray-900 mb-8 border-b-4 border-indigo-500 pb-2">
                知恵のガイド
            </h1>

            {isAdmin && (
                <div className="mb-8">
                    <AdminForm appId={appId as string} onVideoAdded={handleVideoAdded} />
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* 左側: 動画プレーヤーと詳細 */}
                <div className="lg:col-span-2">
                    {activeVideo ? (
                        <VideoPlayer
                            videoId={activeVideo.id}
                            title={activeVideo.title}
                            description={activeVideo.description}
                        />
                    ) : (
                        <p className="text-center p-10 bg-gray-100 rounded-lg">動画を選択してください。</p>
                    )}
                </div>
                
                {/* 右側: 動画リスト */}
                <div className="lg:col-span-1">
                    <VideoList
                        videos={videos}
                        activeVideoId={activeVideo?.id || ''}
                        onSelectVideo={handleVideoSelect}
                    />
                </div>
            </div>

            <footer className="mt-12 pt-4 border-t text-center text-sm text-gray-500">
                &copy; 2024 Wisdom Guide powered by AI Vision.
            </footer>
        </div>
    );
};

export default VideoGuide;