import React, { useState, useEffect, useRef } from 'react';
import { 
  Firestore, 
  collection, 
  doc, 
  addDoc, 
  serverTimestamp, 
  query, 
  orderBy, 
  limit, 
  onSnapshot,
  setDoc
} from 'firebase/firestore';
import { ArrowLeft, Send, Loader2 } from 'lucide-react';

// --- CHAT LOGIC (Integrated from utils/chatLogic.ts) ---

// Collection path for real-time chat rooms
const CHATS_COLLECTION_PATH = (appId: string) => `artifacts/${appId}/public/data/nasutomo_chats`;

// Type Definitions
export interface Message {
  id: string;
  senderId: string;
  text: string;
  timestamp: any; // Firebase Timestamp or null
}

export interface ChatRoom {
  id: string;
  users: string[]; // [userId1, userId2]
  createdAt: any;
}

/**
 * 2ユーザー間のチャットルームIDを生成する
 */
export const getChatRoomId = (userId1: string, userId2: string): string => {
  const sortedUserIds = [userId1, userId2].sort();
  return sortedUserIds.join('_');
};

/**
 * 新しいチャットルームを作成（または既存のルームIDを返す）
 */
export const createOrGetChatRoom = async (db: Firestore, appId: string, initiatorId: string, targetId: string): Promise<string> => {
  const chatId = getChatRoomId(initiatorId, targetId);
  const chatRoomRef = doc(db, CHATS_COLLECTION_PATH(appId), chatId);
  
  const newChatRoom: ChatRoom = {
    id: chatId,
    users: [initiatorId, targetId],
    createdAt: serverTimestamp(),
  };

  await setDoc(chatRoomRef, newChatRoom, { merge: true });

  return chatId;
};

/**
 * メッセージを送信する
 */
export const sendMessage = async (db: Firestore, appId: string, chatId: string, senderId: string, text: string) => {
  if (!text.trim()) return;

  const messagesCollectionRef = collection(db, CHATS_COLLECTION_PATH(appId), chatId, 'messages');
  
  await addDoc(messagesCollectionRef, {
    senderId,
    text,
    timestamp: serverTimestamp(),
  });
};

/**
 * リアルタイムでメッセージを購読する
 */
export const subscribeToMessages = (db: Firestore, appId: string, chatId: string, callback: (messages: Message[]) => void) => {
  const messagesCollectionRef = collection(db, CHATS_COLLECTION_PATH(appId), chatId, 'messages');
  const q = query(messagesCollectionRef, orderBy('timestamp', 'asc'), limit(50));

  const unsubscribe = onSnapshot(q, (snapshot) => {
    const messages = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Message));
    callback(messages);
  });

  return unsubscribe;
};

// --- CHAT ROOM COMPONENT ---

// Props for the ChatRoom component
interface ChatRoomProps {
  db: Firestore;
  appId: string;
  currentUserId: string;
  targetUserId: string;
  onClose: () => void;
}

const ChatRoom: React.FC<ChatRoomProps> = ({ db, appId, currentUserId, targetUserId, onClose }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState<string>('');
  const [chatId, setChatId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isSending, setIsSending] = useState(false);

  // 1. Determine Chat ID and Subscribe to Messages
  useEffect(() => {
    if (!db || !currentUserId || !targetUserId) return;

    const roomId = getChatRoomId(currentUserId, targetUserId);
    setChatId(roomId);
    
    // 接続時にチャットルームが存在しない場合は作成を試みる
    createOrGetChatRoom(db, appId, currentUserId, targetUserId).catch(e => {
        console.error("Failed to create or get chat room:", e);
    });

    const unsubscribe = subscribeToMessages(db, appId, roomId, (newMessages) => {
      setMessages(newMessages);
    });

    return () => unsubscribe();
  }, [db, appId, currentUserId, targetUserId]);

  // 2. Auto-scroll to the latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // 3. Send Message Handler
  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatId || !inputText.trim() || isSending) return;

    setIsSending(true);
    try {
        await sendMessage(db, appId, chatId, currentUserId, inputText);
        setInputText('');
    } catch (error) {
        console.error("Error sending message:", error);
    } finally {
        setIsSending(false);
    }
  };
  
  const getSenderName = (senderId: string) => {
      if (senderId === currentUserId) return 'あなた';
      // In a real app, you would fetch the target user's anonymous name here
      return `相方(${targetUserId.substring(0, 4)})`; 
  }

  return (
    <div className="p-6 bg-white rounded-xl shadow-lg w-full max-w-3xl mx-auto flex flex-col h-[70vh]">
      <header className="flex items-center justify-between mb-4 border-b pb-4">
        <button onClick={onClose} className="text-indigo-600 hover:text-indigo-800 transition">
          <ArrowLeft className="w-5 h-5 mr-1 inline" /> 戻る
        </button>
        <h2 className="text-xl font-bold text-gray-800">
          匿名チャット ({getSenderName(targetUserId)} との境遇コネクト)
        </h2>
        <div></div> {/* Spacer */}
      </header>

      {/* Messages Display Area */}
      <div className="flex-grow overflow-y-auto p-4 bg-gray-50 rounded-lg mb-4 space-y-3">
        {messages.length === 0 ? (
            <div className="text-center text-gray-500 mt-10">メッセージはまだありません。最初に話しかけてみましょう！</div>
        ) : (
            messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.senderId === currentUserId ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-xs sm:max-w-md p-3 rounded-xl shadow text-sm ${
                    msg.senderId === currentUserId 
                      ? 'bg-indigo-500 text-white rounded-br-none' 
                      : 'bg-white text-gray-800 rounded-tl-none border border-gray-200'
                }`}>
                    <div className="text-xs font-semibold mb-1 opacity-70">
                        {getSenderName(msg.senderId)}
                    </div>
                    {msg.text}
                    <div className="text-right text-xs mt-1 opacity-50">
                        {/* Timestamp is Firebase Timestamp; check if it has toDate() method */}
                        {msg.timestamp?.toDate ? new Date(msg.timestamp.toDate()).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' }) : '送信中...'}
                    </div>
                </div>
              </div>
            ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <form onSubmit={handleSend} className="flex">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="メッセージを匿名で送信..."
          className="flex-grow p-3 border border-gray-300 rounded-l-lg focus:ring-indigo-500 focus:border-indigo-500"
          disabled={!chatId || isSending}
        />
        <button
          type="submit"
          className="bg-indigo-600 text-white p-3 rounded-r-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center"
          disabled={!chatId || isSending || !inputText.trim()}
        >
          {isSending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
        </button>
      </form>
    </div>
  );
};

export default ChatRoom;