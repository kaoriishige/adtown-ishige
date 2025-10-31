import React, { useEffect, useState, useMemo } from 'react';
import { GetServerSideProps, NextPage } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import { 
    collection, 
    query, 
    onSnapshot, 
    Timestamp,
    DocumentData,
    limit 
} from 'firebase/firestore'; 
import nookies from 'nookies';
import { adminAuth } from '@/lib/firebase-admin';
import { db } from '../../../lib/firebase';
import { RiPlayCircleFill, RiRefreshLine, RiHistoryLine, RiRobotLine, RiArrowLeftLine } from 'react-icons/ri'; 

// AIマッチング APIパス
const AI_ENGINE_API_PATH = '/api/ai-matching/run-engine';

// グローバル変数定義 (Firestoreパス用)
declare const __app_id: string;
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

// ===============================
// 型定義
// ===================================
interface AiMatchLog extends DocumentData {
    id: string;
    timestamp: Timestamp;
    status: 'SUCCESS' | 'FAILED' | 'RUNNING';
    targetCount: number;
    segmentName: string;
    resultDetails: string;
}

interface MatchingMetrics {
    baseCustomerCount: number;
    targetCustomerCount: number;
    matchingAccuracy: number; // 0.0 to 1.0
}

interface AiMatchingProps {
    partnerData: {
        uid: string;
        companyName: string;
        isPaid: boolean; 
    };
}

// ===============================
// サーバーサイド認証チェック
// ===================================
export const getServerSideProps: GetServerSideProps = async (context) => {
    try {
        const cookies = nookies.get(context);
        const token = await adminAuth.verifySessionCookie(cookies.session || '', true);
        const { uid, isPaid } = token; 

        if (!uid) {
            return { redirect: { destination: '/partner/login', permanent: false } };
        }
        
        if (!isPaid) {
            return { redirect: { destination: '/partner/subscribe_plan?alert=pro_required', permanent: false } };
        }

        return {
            props: {
                partnerData: {
                    uid: uid,
                    companyName: token.companyName || token.storeName || 'パートナー',
                    isPaid: isPaid || false,
                },
            },
        };
    } catch (err) {
        console.error('AI Matching getServerSideProps error:', err);
        return { redirect: { destination: '/partner/login', permanent: false } };
    }
};


// ===============================
// メインコンポーネント
// ===================================
const AiMatchingDashboard: NextPage<AiMatchingProps> = ({ partnerData }) => {
    const [logs, setLogs] = useState<AiMatchLog[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isExecuting, setIsExecuting] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
    
    const [storeData, setStoreData] = useState<any>({
        mainCategory: '未設定',
        lineOfficialId: '',
        lineLiffUrl: '',
        selectedAiTargets: [], 
        normalizedIndustryKey: 'general',
    });

    const [accuracySetting, setAccuracySetting] = useState<number>(85); 
    const [matchingMetrics, setMatchingMetrics] = useState<MatchingMetrics>({
        baseCustomerCount: 0,
        targetCustomerCount: 0,
        matchingAccuracy: 0,
    });

    const userId = partnerData.uid;

    // ★★★ 修正点 ① ★★★
    // データ取得と購読設定に特化したuseEffect
    useEffect(() => {
        if (!userId) return;

        // 1. 店舗データ取得
        const storesRef = collection(db, 'artifacts', appId, 'users', userId, 'stores');
        const storeQuery = query(storesRef, limit(1));

        const storeUnsub = onSnapshot(storeQuery, (snapshot) => {
            if (!snapshot.empty) {
                const data = snapshot.docs[0].data();
                const normalizedKey = data.normalizedIndustryKey || 'general';
                setStoreData({
                    mainCategory: data.mainCategory || '未設定',
                    lineOfficialId: data.lineOfficialId || '',
                    lineLiffUrl: data.lineLiffUrl || '',
                    selectedAiTargets: data.selectedAiTargets || [],
                    normalizedIndustryKey: normalizedKey,
                });

                let baseCount = 500;
                if (normalizedKey.includes('cafe') || normalizedKey.includes('restaurant') || normalizedKey.includes('beauty')) {
                    baseCount = 800; 
                } else if (normalizedKey.includes('lodging') || normalizedKey.includes('pet_related')) {
                    baseCount = 400;
                } else {
                    baseCount = 200;
                }
                
                // ★★★ 修正点 ② ★★★
                // ここでは計算せず、baseCustomerCountの更新のみを行う
                setMatchingMetrics(prev => ({
                    ...prev,
                    baseCustomerCount: baseCount,
                }));

            } else {
                 setStoreData((prev: any) => ({...prev, mainCategory: '未設定', selectedAiTargets: []}));
            }
            setIsLoading(false);
        }, (error) => {
            console.error("Error fetching store data: ", error);
            setMessage({ type: 'error', text: '店舗データの取得に失敗しました。' });
            setIsLoading(false);
        });


        // 2. ログ取得
        const logsRef = collection(db, 'artifacts', appId, 'users', userId, 'ai_match_logs');
        const logsQuery = query(logsRef, limit(20));
        
        const logsUnsub = onSnapshot(logsQuery, (snapshot) => {
            const fetchedLogs: AiMatchLog[] = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AiMatchLog));
            fetchedLogs.sort((a, b) => (b.timestamp?.toMillis() || 0) - (a.timestamp?.toMillis() || 0));
            setLogs(fetchedLogs);
            
            const runningLog = fetchedLogs.find(log => log.status === 'RUNNING');
            if (runningLog) {
                setIsExecuting(true);
            } else if (isExecuting) {
                setIsExecuting(false);
                setMessage({ type: 'success', text: 'AIマッチングが完了しました。' });
            }
        }, (error) => {
            console.error("Error fetching AI logs: ", error.code, error.message);
            setMessage({ type: 'error', text: `ログの取得中にエラーが発生しました。 (${error.code})` });
        });

        return () => {
            storeUnsub();
            logsUnsub();
        };
    // isExecutingは副作用内で直接参照されないため、依存配列から削除しても良い場合が多いですが、
    // 完了メッセージの表示ロジックに関わっているため残します。
    }, [userId, isExecuting]);
    
    // ★★★ 修正点 ③ ★★★
    // 状態の計算に特化したuseEffect。これで警告が解消されます。
    useEffect(() => {
        const calculateTargetCount = (accuracy: number) => {
            if (matchingMetrics.baseCustomerCount === 0) return 0;
            
            const minAccuracy = 60;
            const maxAccuracy = 100;
            const range = maxAccuracy - minAccuracy;
            const progress = (accuracy - minAccuracy) / range;
            const reverseRatio = 1 - progress;
            const minTargetRatio = 0.3;
            const maxTargetRatio = 1.0;
            const finalTargetRatio = minTargetRatio + (maxTargetRatio - minTargetRatio) * reverseRatio;
            return Math.round(matchingMetrics.baseCustomerCount * finalTargetRatio);
        };
        const newTargetCount = calculateTargetCount(accuracySetting);
        setMatchingMetrics(prev => ({ 
            ...prev,
            targetCustomerCount: newTargetCount,
            matchingAccuracy: accuracySetting / 100 
        }));
    }, [accuracySetting, matchingMetrics.baseCustomerCount]);

    const handleRunEngine = async () => {
        if (isExecuting) {
            setMessage({ type: 'info', text: 'AIエンジンは現在実行中です。' });
            return;
        }
        if (storeData.selectedAiTargets.length === 0) {
            setMessage({ type: 'error', text: 'ターゲット層をプロフィール画面で設定してください。' });
            return;
        }
        if (!storeData.lineOfficialId || !storeData.lineLiffUrl) {
            setMessage({ type: 'error', text: 'LINE連携情報を登録してください。' });
            return;
        }

        setIsExecuting(true);
        setMessage({ type: 'info', text: 'AIマッチングエンジンを実行中です...' });

        try {
            const targetSegmentString = storeData.selectedAiTargets.join(', ');
            const response = await fetch(AI_ENGINE_API_PATH, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ uid: userId, accuracySetting: accuracySetting, targetSegment: targetSegmentString }),
            });
            const data = await response.json();
            if (!response.ok || !data.success) {
                throw new Error(data.message || 'AIエンジンの実行に失敗しました。');
            }
            setMessage({ type: 'success', text: 'AIエンジン実行リクエストを送信しました。' });
        } catch (error: any) {
            console.error('AIエンジン実行エラー:', error);
            setMessage({ type: 'error', text: `実行に失敗しました: ${error.message}` });
            setIsExecuting(false);
        }
    };
    
    const getMessageStyle = useMemo(() => {
        if (!message) return '';
        switch (message.type) {
            case 'success': return 'bg-green-100 border-l-4 border-green-500 text-green-700';
            case 'error': return 'bg-red-100 border-l-4 border-red-500 text-red-700';
            default: return 'bg-blue-100 border-l-4 border-blue-500 text-blue-700';
        }
    }, [message]);
    
    const formatDate = (timestamp: Timestamp | undefined) => {
        if (!timestamp) return 'N/A';
        return timestamp.toDate().toLocaleString('ja-JP');
    };

    const getStatusDisplay = (status: AiMatchLog['status']) => {
        switch (status) {
            case 'SUCCESS': return <span className="inline-flex items-center px-3 py-0.5 rounded-full text-sm font-medium bg-green-100 text-green-800">成功</span>;
            case 'FAILED': return <span className="inline-flex items-center px-3 py-0.5 rounded-full text-sm font-medium bg-red-100 text-red-800">失敗</span>;
            case 'RUNNING': return <span className="inline-flex items-center px-3 py-0.5 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800 animate-pulse">実行中...</span>;
            default: return <span className="inline-flex items-center px-3 py-0.5 rounded-full text-sm font-medium bg-gray-100 text-gray-800">不明</span>;
        }
    };

    const isTargetUnset = storeData.selectedAiTargets.length === 0;

    return (
        <div className="min-h-screen bg-gray-50">
            <Head>
                <title>集客マッチング AI 実行とログ管理</title>
            </Head>
            <header className="bg-white shadow-sm">
                <div className="max-w-6xl mx-auto px-4 py-4 flex items-center">
                    <RiRobotLine className="h-8 w-8 text-indigo-600 mr-3" />
                    <h1 className="text-2xl font-bold text-gray-900">集客マッチング AI 実行とログ管理</h1>
                </div>
            </header>
            <main className="max-w-6xl mx-auto px-4 py-8">
                <div className="mb-6">
                    <Link href="/partner/dashboard" legacyBehavior>
                        <a className="flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-800">
                            <RiArrowLeftLine className="mr-1 h-5 w-5" />
                            ダッシュボードに戻る
                        </a>
                    </Link>
                </div>
                <section className="bg-white p-6 rounded-xl shadow-lg mb-8 border-t-4 border-indigo-600">
                    <h2 className="text-xl font-extrabold text-gray-800 mb-4 flex items-center">
                        <RiPlayCircleFill className="h-6 w-6 mr-2 text-indigo-600" />
                        AI マッチング エンジン実行
                    </h2>
                    <div className="mb-4 space-y-1 text-sm text-gray-700">
                        <p>店舗業種: <span className="font-medium">{storeData.mainCategory}</span></p>
                        <p>LINE連携ID: <span className="font-medium">{storeData.lineOfficialId || '未設定 (要登録)'}</span></p>
                    </div>
                    <h3 className="text-lg font-bold mt-4 mb-2">選択されたターゲット層</h3>
                    {isTargetUnset ? (
                        <div className="p-3 bg-red-50 border border-red-200 rounded text-red-700 mb-4">
                            ターゲット層が未設定です。<Link href="/partner/profile" className="font-bold underline">店舗プロフィール</Link>で設定してください。
                        </div>
                    ) : (
                        <div className="flex flex-wrap gap-2 mb-4">
                            {storeData.selectedAiTargets.map((target: string, index: number) => (
                                <span key={index} className="bg-indigo-100 text-indigo-800 text-sm font-medium px-3 py-1 rounded-full shadow-sm">{target}</span>
                            ))}
                        </div>
                    )}
                    <hr className="my-6"/>
                    <div className="space-y-4">
                        <h3 className="text-lg font-bold">AIマッチング予測メトリクス</h3>
                        <div className="p-4 bg-gray-50 border rounded-lg">
                            <label className="block text-sm font-medium text-gray-700 mb-1">マッチング精度 ({accuracySetting}%) の調整</label>
                            <p className="text-xs text-gray-500 mb-2">精度を上げるほど、ターゲティングが厳密になり、顧客数は**少なく**なります。</p>
                            <input type="range" min="60" max="100" step="1" value={accuracySetting} onChange={(e) => setAccuracySetting(parseInt(e.target.value))} className="w-full h-2 bg-indigo-200 rounded-lg appearance-none cursor-pointer" disabled={isTargetUnset} />
                        </div>
                        <div className="p-4 bg-white border rounded-lg shadow-sm flex justify-between items-center">
                            <span className="font-semibold text-gray-700">予測ターゲット顧客数 (理論値)</span>
                            <span className="text-2xl font-extrabold text-indigo-600">{matchingMetrics.targetCustomerCount.toLocaleString()} <span className="text-base font-medium">人</span></span>
                        </div>
                    </div>
                    <p className="text-sm text-gray-600 mt-6 mb-2 p-2 rounded-md bg-indigo-50 border border-indigo-200">
                        ※ 実行後、AIが選定した最適な顧客に対し、**店舗のLINE友だち追加URLが自動で送信され、登録が促されます。**
                    </p>
                    {message && (<div className={`p-4 rounded-lg mb-4 mt-4 text-sm font-medium ${getMessageStyle}`}><p>{message.text}</p></div>)}
                    <button onClick={handleRunEngine} disabled={isExecuting || isTargetUnset} className={`mt-4 w-full flex justify-center items-center py-3 border border-transparent text-base font-medium rounded-lg shadow-sm text-white transition-colors ${isExecuting || isTargetUnset ? 'bg-gray-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'}`}>
                        {isExecuting ? (<><RiRefreshLine className="h-5 w-5 animate-spin mr-2" /><span>AI実行中...</span></>) : (<><RiPlayCircleFill className="h-6 w-6 mr-2" /><span>AIマッチングを実行する</span></>)}
                    </button>
                    <p className="mt-3 text-xs text-gray-500">※実行は1日に1回を目安にしてください。</p>
                </section>
                <section className="bg-white p-6 rounded-xl shadow-lg">
                    <h2 className="text-xl font-extrabold text-gray-800 mb-4 flex items-center"><RiHistoryLine className="h-6 w-6 mr-2 text-gray-600" />AI 実行ログ履歴</h2>
                    {isLoading ? (
                        <div className="text-center p-10 text-gray-500"><RiRefreshLine className="mx-auto h-8 w-8 animate-spin" /><p className="mt-2">履歴データを読み込み中です...</p></div>
                    ) : logs.length === 0 ? (
                        <div className="text-center p-10 bg-gray-50 border border-dashed rounded-lg text-gray-500">
                            <p className="font-medium">まだAIマッチングの実行履歴がありません。</p>
                            <p className="text-sm mt-1">「AIマッチングを実行する」ボタンを押して開始してください。</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">実行日時</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ステータス</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">セグメント名</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ターゲット数</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">詳細</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {logs.map((log) => (
                                        <tr key={log.id} className={log.status === 'RUNNING' ? 'bg-yellow-50' : ''}>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatDate(log.timestamp)}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm">{getStatusDisplay(log.status)}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{log.segmentName || '未設定'}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-bold">{log.targetCount !== undefined ? log.targetCount.toLocaleString() : '-'}</td>
                                            <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">{log.resultDetails || '詳細情報なし'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </section>
            </main>
        </div>
    );
};

export default AiMatchingDashboard;


