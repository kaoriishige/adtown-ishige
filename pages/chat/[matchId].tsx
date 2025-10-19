import { NextPage } from 'next';
import { useRouter } from 'next/router';
import { useState, useEffect, useRef, useCallback } from 'react';
import { doc, getDoc, collection, query, orderBy, limit, onSnapshot, addDoc, serverTimestamp, updateDoc } from 'firebase/firestore'; // 💡 修正: updateDoc をインポート
import { getAuth, onAuthStateChanged, User } from 'firebase/auth';
import { RiArrowLeftLine, RiSendPlaneFill, RiUser3Fill } from 'react-icons/ri';
import Head from 'next/head';
import Link from 'next/link';

// [NOTE: db, auth, etc. from '@/lib/firebase' are assumed to be imported here]
import { db } from '../../lib/firebase'; // 仮のインポートパス

// --- 型定義 ---
interface Message {
    id: string;
    text: string;
    senderId: string;
    createdAt: string;
}

interface MatchDetails {
    partnerId: string;
    userId: string;
    partnerName: string;
    userName: string;
    jobTitle: string; // 企業側が応募した求人のタイトル
    lastMessageText: string;
    lastMessageTime: string;
    isPartner: boolean;
}

const ChatPage: NextPage = () => {
    const router = useRouter();
    const { matchId } = router.query;
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [matchDetails, setMatchDetails] = useState<MatchDetails | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // --- 1. 認証と初期データロード ---
    useEffect(() => {
        const auth = getAuth();
        const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
            if (currentUser) {
                setUser(currentUser);
            } else {
                router.push('/login'); // ログインページへリダイレクト
            }
        });
        return () => unsubscribeAuth();
    }, [router]);

    // --- 2. マッチング詳細情報とメッセージの読み込み ---
    useEffect(() => {
        if (!user || !matchId) {
            setLoading(false);
            return;
        }

        const loadMatchDetails = async () => {
            try {
                // 仮のパス: 'matches' コレクションから詳細を取得
                const matchRef = doc(db, 'matches', matchId as string);
                const matchSnap = await getDoc(matchRef);

                if (matchSnap.exists()) {
                    const data = matchSnap.data();
                    const isPartner = user.uid === data.partnerId;

                    setMatchDetails({
                        partnerId: data.partnerId,
                        userId: data.userId,
                        partnerName: data.partnerName || '企業担当者',
                        userName: data.userName || '求職者',
                        jobTitle: data.jobTitle || '応募済み求人',
                        lastMessageText: data.lastMessageText || '',
                        lastMessageTime: data.lastMessageTime ? data.lastMessageTime.toDate().toISOString() : '',
                        isPartner: isPartner,
                    });
                } else {
                    console.error("Match document not found.");
                    router.push(matchDetails?.isPartner ? '/recruit/dashboard' : '/mypage');
                }
            } catch (error) {
                console.error("Error loading match details:", error);
            }
            setLoading(false);
        };

        // メッセージのリアルタイムリスナー
        const messagesRef = collection(db, 'matches', matchId as string, 'messages');
        const q = query(messagesRef, orderBy('createdAt', 'asc'));

        const unsubscribeMessages = onSnapshot(q, (snapshot) => {
            const msgs: Message[] = [];
            snapshot.forEach((doc) => {
                const data = doc.data();
                msgs.push({
                    id: doc.id,
                    text: data.text,
                    senderId: data.senderId,
                    createdAt: data.createdAt ? data.createdAt.toDate().toISOString() : new Date().toISOString(),
                });
            });
            setMessages(msgs);
        });

        loadMatchDetails();
        return () => unsubscribeMessages();
    }, [user, matchId, router]);

    // --- 3. メッセージ送信処理 ---
    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !matchId || newMessage.trim() === '') return;

        try {
            const messagesRef = collection(db, 'matches', matchId as string, 'messages');
            await addDoc(messagesRef, {
                text: newMessage,
                senderId: user.uid,
                createdAt: serverTimestamp(),
            });

            // 最後に match ドキュメント自体を更新して lastMessage を記録
            const matchRef = doc(db, 'matches', matchId as string);
            await updateDoc(matchRef, {
                lastMessageText: newMessage,
                lastMessageTime: serverTimestamp(),
            });

            setNewMessage('');
        } catch (error) {
            console.error("Error sending message:", error);
        }
    };

    // --- 4. スクロール処理 ---
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);


    if (loading || !matchDetails) {
        return <div className="p-4 text-center">読み込み中...</div>;
    }

    // --- 5. レンダリング ---
    const recipientName = matchDetails.isPartner ? matchDetails.userName : matchDetails.partnerName;
    const backPath = matchDetails.isPartner ? '/recruit/dashboard' : '/mypage';


    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <Head>
                {/* 142行目付近のエラーの原因を修正: {チャット} -> チャット */}
                <title>チャット: {recipientName}とのチャット</title> 
            </Head>

            {/* --- ヘッダー --- */}
            <header className="bg-indigo-600 text-white shadow-lg sticky top-0 z-10">
                <div className="max-w-xl mx-auto p-4 flex items-center">
                    <Link href={backPath} className="text-white hover:text-indigo-200">
                        <RiArrowLeftLine size={24} />
                    </Link>
                    
                    {/* 💡 修正行: 142行目付近のエラーを解消 */}
                    <h1 className="text-xl font-bold mx-auto">
                        {matchDetails.jobTitle} - {recipientName}とのチャット
                    </h1>
                </div>
            </header>

            {/* --- メッセージエリア --- */}
            <main className="flex-grow overflow-y-auto p-4 space-y-4 max-w-xl mx-auto w-full">
                {messages.map((msg) => {
                    const isMine = msg.senderId === user?.uid;
                    const senderName = msg.senderId === matchDetails.partnerId ? matchDetails.partnerName : matchDetails.userName;
                    
                    return (
                        <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                            <div className={`flex items-end max-w-xs md:max-w-md ${isMine ? 'flex-row-reverse' : 'flex-row'}`}>
                                
                                {/* アバター/イニシャル */}
                                <div className={`flex-shrink-0 w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-sm font-semibold ${isMine ? 'ml-2' : 'mr-2'}`}>
                                    <RiUser3Fill className="text-gray-600" />
                                </div>
                                
                                {/* メッセージバブル */}
                                <div className={`p-3 rounded-xl shadow ${isMine ? 'bg-indigo-500 text-white rounded-br-none' : 'bg-white text-gray-800 rounded-tl-none'}`}>
                                    <p className={`text-xs font-bold ${isMine ? 'text-indigo-200' : 'text-gray-500'} mb-1`}>{senderName}</p>
                                    <p className="whitespace-pre-wrap">{msg.text}</p>
                                    <span className={`text-xs block mt-1 ${isMine ? 'text-indigo-300' : 'text-gray-500'}`}>
                                        {new Date(msg.createdAt).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                            </div>
                        </div>
                    );
                })}
                <div ref={messagesEndRef} />
            </main>

            {/* --- 入力フォーム --- */}
            <footer className="bg-white border-t p-4 sticky bottom-0 z-10">
                <form onSubmit={handleSend} className="max-w-xl mx-auto flex gap-2">
                    <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="メッセージを入力..."
                        className="flex-grow p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        disabled={!user}
                    />
                    <button
                        type="submit"
                        disabled={!user || newMessage.trim() === ''}
                        className="bg-indigo-600 text-white p-3 rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition"
                    >
                        <RiSendPlaneFill size={24} />
                    </button>
                </form>
            </footer>
        </div>
    );
};

export default ChatPage;