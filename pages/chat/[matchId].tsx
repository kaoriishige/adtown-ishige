// pages/chat/[matchId].tsx
import { GetServerSideProps, NextPage } from 'next';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { adminDb, adminAuth } from '@/lib/firebase-admin';
import nookies from 'nookies';
import { useState, useEffect, useRef } from 'react';
import { db, auth } from '@/lib/firebase';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, doc, getDoc } from 'firebase/firestore';
import { onAuthStateChanged, User } from 'firebase/auth';
import { ArrowLeft, Send, Paperclip } from 'lucide-react';

// --- 型定義 ---
interface Message {
  id: string;
  text: string;
  senderUid: string;
  createdAt: Date | null;
}

interface MatchDetails {
  jobTitle: string;
  companyName: string;
  userName: string;
  companyUid: string;
  userUid: string;
}

interface ChatPageProps {
  matchId: string;
  initialMatchDetails: MatchDetails;
  currentUserRole: 'company' | 'user';
}

// --- サーバーサイド処理 ---
export const getServerSideProps: GetServerSideProps = async (context) => {
  try {
    const { matchId } = context.params || {};
    if (!matchId) {
      return { notFound: true };
    }
    const matchIdStr = Array.isArray(matchId) ? matchId[0] : matchId;

    const cookies = nookies.get(context);
    const token = await adminAuth.verifySessionCookie(cookies.session || '', true);
    const { uid } = token;

    // マッチング情報を取得
    const matchDoc = await adminDb.collection('matches').doc(matchIdStr).get();
    if (!matchDoc.exists) return { notFound: true };
    const matchData = matchDoc.data()!;

    // **セキュリティチェック**: 認証済みユーザーがこのチャットの当事者であるかを確認
    if (uid !== matchData.companyUid && uid !== matchData.userUid) {
      return { redirect: { destination: '/', permanent: false } }; // 権限がない場合はホームへ
    }

    // 企業とユーザーの情報を取得
    const companyDoc = await adminDb.collection('users').doc(matchData.companyUid).get();
    const userDoc = await adminDb.collection('users').doc(matchData.userUid).get();
    if (!companyDoc.exists || !userDoc.exists) return { notFound: true };

    const initialMatchDetails: MatchDetails = {
      jobTitle: matchData.jobTitle || 'N/A',
      companyName: companyDoc.data()?.companyName || '企業',
      userName: userDoc.data()?.name || '候補者',
      companyUid: matchData.companyUid,
      userUid: matchData.userUid,
    };
    
    const currentUserRole = uid === matchData.companyUid ? 'company' : 'user';

    return { props: { matchId: matchIdStr, initialMatchDetails, currentUserRole } };
  } catch (error) {
    console.error("Chat page SSR Error:", error);
    return { redirect: { destination: '/', permanent: false } };
  }
};


const ChatPage: NextPage<ChatPageProps> = ({ matchId, initialMatchDetails, currentUserRole }) => {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // 認証状態の監視
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      if (!currentUser) {
        router.push('/');
      } else {
        setUser(currentUser);
      }
    });
    return () => unsubscribeAuth();
  }, [router]);

  useEffect(() => {
    if (!user) return;
    // メッセージのリアルタイム監視
    const messagesQuery = query(collection(db, 'matches', matchId, 'messages'), orderBy('createdAt'));
    const unsubscribeMessages = onSnapshot(messagesQuery, (querySnapshot) => {
      const msgs: Message[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        msgs.push({
          id: doc.id,
          text: data.text,
          senderUid: data.senderUid,
          createdAt: data.createdAt?.toDate() || null,
        });
      });
      setMessages(msgs);
    });
    return () => unsubscribeMessages();
  }, [user, matchId]);
  
  // 新しいメッセージが来たら一番下までスクロール
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim() === '' || !user) return;
    
    await addDoc(collection(db, 'matches', matchId, 'messages'), {
      text: newMessage,
      senderUid: user.uid,
      createdAt: serverTimestamp(),
    });
    setNewMessage('');
  };

  const otherPartyName = currentUserRole === 'company' ? initialMatchDetails.userName : initialMatchDetails.companyName;

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      <Head>
        <title>チャット: {otherPartyName}様</title>
      </Head>

      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center">
          <button onClick={() => router.back()} className="mr-4 p-2 rounded-full hover:bg-gray-100">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-lg font-bold text-gray-900">{otherPartyName}</h1>
            <p className="text-xs text-gray-500">求人: {initialMatchDetails.jobTitle}</p>
          </div>
        </div>
      </header>
      
      <main className="flex-1 overflow-y-auto p-4 sm:p-6">
        <div className="max-w-4xl mx-auto space-y-4">
          {messages.map(msg => (
            <div key={msg.id} className={`flex items-end gap-2 ${msg.senderUid === user?.uid ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-md p-3 rounded-2xl ${msg.senderUid === user?.uid ? 'bg-indigo-600 text-white rounded-br-none' : 'bg-white text-gray-800 rounded-bl-none shadow-sm'}`}>
                <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </main>

      <footer className="bg-white border-t sticky bottom-0">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <form onSubmit={handleSendMessage} className="flex items-center gap-2">
            <button type="button" className="p-2 text-gray-500 hover:text-indigo-600 rounded-full hover:bg-gray-100">
              <Paperclip size={20}/>
            </button>
            <textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="メッセージを入力..."
              className="flex-1 p-2 border-none focus:ring-0 bg-gray-100 rounded-xl resize-none"
              rows={1}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage(e);
                }
              }}
            />
            <button type="submit" className="p-3 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 disabled:opacity-50" disabled={newMessage.trim() === ''}>
              <Send size={20}/>
            </button>
          </form>
        </div>
      </footer>
    </div>
  );
};

export default ChatPage;