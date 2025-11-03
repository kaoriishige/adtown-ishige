import { NextPage, GetServerSideProps } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import React, { useState } from 'react';
import { RiBrainLine, RiArrowLeftLine, RiErrorWarningLine, RiUserSearchLine, RiArrowRightLine, RiLoader4Line, RiCheckLine } from 'react-icons/ri';
import nookies from 'nookies';
import { adminAuth, adminDb } from '@/lib/firebase-admin';

// --- 型定義 ---
interface Candidate {
    id: string;
    name: string;
    age: number;
    desiredJob: string;
    skillsSummary: string; // スカウトリスト用サマリー
    aiScore: number; // AIマッチ度
    lastActive: string; // 最終活動日 (ダミー)
}

interface ScoutPageProps {
    isPaid: boolean;
    companyName: string;
    candidates: Candidate[];
    error?: string;
}

// --- サーバーサイド認証とデータ取得 ---
export const getServerSideProps: GetServerSideProps = async (context) => {
    try {
        const cookies = nookies.get(context);
        const token = await adminAuth.verifySessionCookie(cookies.session || '', true);
        const { uid } = token;

        const userSnap = await adminDb.collection('users').doc(uid).get();
        const userData = userSnap.data();

        // 🚨 有料プランのチェック (必須)
        const isPaid = userData?.isPaid === true;

        if (!isPaid) {
            // ★ 有料プラン未加入の場合はリダイレクト
            return { redirect: { destination: '/recruit/subscribe_plan', permanent: false } };
        }
        
        // --- 修正: 仮データ(mockCandidates)を削除し、空の配列を返す ---
        
        // const mockCandidates: Candidate[] = [ ... ]; // 削除された仮データ

        // 本来はFirestoreからAI推薦候補者リストを取得するロジックが入ります。
        const candidates: Candidate[] = []; 

        return {
            props: {
                isPaid,
                companyName: userData?.companyName || '企業様',
                candidates: candidates, // ★ 修正: 取得したデータ (現在は空) を返す
            }
        };

    } catch (error) {
        console.error("Error in getServerSideProps (scout):", error);
        // 認証エラーやその他のエラーの場合も購読ページに誘導
        return { redirect: { destination: '/recruit/subscribe_plan', permanent: false } };
    }
};

// --- 候補者カードコンポーネント (★修正) ---
interface CandidateCardProps {
    candidate: Candidate;
    onScout: (candidateId: string, candidateName: string) => void;
    isSending: boolean;
    hasSent: boolean;
}

const CandidateCard: React.FC<CandidateCardProps> = ({ candidate, onScout, isSending, hasSent }) => {
    
    // ロード中、または送信済みの場合はボタンを無効化
    const isDisabled = isSending || hasSent;

    return (
        <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100 transition-shadow hover:shadow-lg">
            <div className="flex justify-between items-start">
                <div>
                    <h3 className="text-xl font-bold text-gray-800">{candidate.name} ({candidate.age}歳)</h3>
                    <p className="text-sm text-indigo-600 font-semibold mt-1">希望職種: {candidate.desiredJob}</p>
                </div>
                <div className="text-right">
                    <span className="text-sm font-bold px-3 py-1 rounded-full bg-red-100 text-red-700">
                        AIスコア: {candidate.aiScore}点
                    </span>
                </div>
            </div>
            
            <p className="text-gray-600 mt-3 text-sm">{candidate.skillsSummary}</p>
            <div className="mt-4 flex justify-between items-center border-t pt-3">
                <p className="text-xs text-gray-500">最終活動: {candidate.lastActive}</p>
                <button
                    onClick={() => onScout(candidate.id, candidate.name)} 
                    disabled={isDisabled} // ★ 無効化
                    className={`text-sm font-bold flex items-center p-1 -m-1 rounded transition-colors ${
                        isDisabled 
                            ? 'text-gray-500 bg-gray-100 cursor-not-allowed'
                            : 'text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50'
                    }`}
                >
                    {isSending ? (
                        <><RiLoader4Line className="animate-spin mr-1" />送信中...</>
                    ) : hasSent ? (
                        <><RiCheckLine className="mr-1 text-green-600" />送信済み</>
                    ) : (
                        <span className="flex items-center">スカウトを送る <RiArrowRightLine className="ml-1" /></span>
                    )}
                </button>
            </div>
        </div>
    );
};


// --- ページコンポーネント (★修正: ロジックを追加) ---
const ScoutCandidatesPage: NextPage<ScoutPageProps> = ({ companyName, candidates, error }) => {
    
    // スカウト送信状態を管理
    const [sendingScout, setSendingScout] = useState<string | null>(null); // 候補者IDがここに入る
    const [sentStatus, setSentStatus] = useState<Record<string, 'sent' | 'failed'>>({});
    const [scoutStatusMessage, setScoutStatusMessage] = useState<string | null>(null);

    const handleSendScout = async (candidateId: string, candidateName: string) => {
        setSendingScout(candidateId);
        setScoutStatusMessage(null);

        // [ステップ 1] 実際のAPI呼び出し
        try {
            const response = await fetch('/api/recruit/send-scout', { 
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ candidateId }),
            });

            if (!response.ok) {
                const errorBody = await response.json().catch(() => ({ error: `APIエラー (${response.status})` }));
                throw new Error(errorBody.error || `APIエラー (${response.status})`);
            }
            
            // 成功ステータスを記録
            setSentStatus(prev => ({ ...prev, [candidateId]: 'sent' }));
            setScoutStatusMessage(`✅ ${candidateName} さんへのスカウト送信が完了しました！`);

        } catch (e: any) {
            console.error("Scout failed:", e);
            setSentStatus(prev => ({ ...prev, [candidateId]: 'failed' }));
            setScoutStatusMessage(`❌ ${candidateName} さんへのスカウト送信に失敗しました。時間をおいて再試行してください。（原因：${e.message}）`);
        } finally {
            setSendingScout(null);
            // 成功メッセージは一定時間後に消去
            setTimeout(() => setScoutStatusMessage(null), 8000);
        }
    };


    if (error) {
        return (
             <div className="flex justify-center items-center h-screen bg-gray-50 p-4">
                <div className="text-center p-8 bg-white rounded-lg shadow-xl max-w-md">
                    <RiErrorWarningLine size={48} className="text-red-500 mx-auto mb-4" />
                    <h1 className="text-xl font-bold text-gray-900 mb-2">データ取得エラー</h1>
                    <p className="text-gray-600">{error}</p>
                    <Link href="/recruit/dashboard" className="mt-4 inline-flex items-center text-indigo-600 hover:underline">
                        <RiArrowLeftLine className="mr-1" /> ダッシュボードに戻る
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 font-sans">
            <Head><title>AIスカウト候補者リスト ({companyName})</title></Head>
            <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
                <Link href="/recruit/dashboard" className="flex items-center text-sm text-gray-600 hover:text-gray-900 font-semibold mb-6">
                    <RiArrowLeftLine className="w-4 h-4 mr-2" /> ダッシュボードに戻る
                </Link>

                <div className="flex items-center space-x-4 border-b pb-4">
                    <RiBrainLine size={36} className="text-red-600" />
                    <h1 className="text-3xl font-bold text-gray-900">AIスカウト候補者リスト</h1>
                    <span className="px-3 py-1 bg-red-600 text-white font-bold rounded-full text-sm shadow-md">有料AIプラン</span>
                </div>

                <div className="p-6 bg-red-50 border border-red-200 rounded-xl shadow-lg">
                    <h2 className="text-xl font-bold text-red-800 mb-4 flex items-center">
                        <RiUserSearchLine className="w-6 h-6 mr-3" />
                        無料では出会えない潜在的な優秀候補者たち
                    </h2>
                    <p className="text-sm text-gray-700">
                        AIが貴社の求人情報と企業文化にマッチする求職者を自動で厳選しました。
                        彼らは貴社にまだ応募していませんが、高い確率で興味を持つ潜在的な候補者です。
                        積極的にスカウトを送り、採用を成功させましょう。
                    </p>
                </div>

                {/* ★ フィードバックメッセージ表示 */}
                {scoutStatusMessage && (
                    <div className={`p-4 rounded-md font-bold transition-opacity ${scoutStatusMessage.startsWith('✅') ? 'bg-green-100 text-green-800 border-l-4 border-green-600' : 'bg-red-100 text-red-800 border-l-4 border-red-600'}`}>
                        {scoutStatusMessage}
                    </div>
                )}
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {candidates.map(candidate => (
                        <CandidateCard 
                            key={candidate.id} 
                            candidate={candidate} 
                            onScout={handleSendScout} // ★ 新しいスカウトハンドラを渡す
                            isSending={sendingScout === candidate.id} // ★ 現在送信中か
                            hasSent={sentStatus[candidate.id] === 'sent'} // ★ 送信済みか
                        />
                    ))}
                </div>
                
                {candidates.length === 0 && (
                    <div className="text-center p-12 bg-white rounded-xl shadow-md text-gray-600">
                        <RiUserSearchLine className="w-10 h-10 mx-auto mb-3" />
                        <p>現在、AIが推薦するスカウト候補者が見つかりませんでした。</p>
                        <p className="text-sm mt-1">企業プロフィールや求人情報を更新すると、AIの推薦が変わる可能性があります。</p>
                    </div>
                )}

            </main>
        </div>
    );
};

export default ScoutCandidatesPage;