import { useState, useEffect, useCallback, FC } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';

// Firebaseのインポート
// パスの修正が必要な場合は、環境に合わせて調整してください
import { db, auth } from "@/lib/firebase-client";
import { onAuthStateChanged, User } from 'firebase/auth';
import {
    collection, query, where, getDocs, DocumentData, Firestore
} from 'firebase/firestore';

// React Icons のインポート
// ★ FIX: FaSpinner をインポートに追加
import { FaArrowLeft, FaUsers, FaLine, FaTimesCircle, FaRegClock, FaSpinner } from 'react-icons/fa';

// グローバル変数の型を宣言
declare const __app_id: string;
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

// *******************************************************
// 型定義
// *******************************************************
interface LeadCounts {
    total: number;
    lineContacted: number;
    pending: number; // 未対応/未契約
}

interface LeadData extends DocumentData {
    id: string; // Document ID
    userId: string; // ユーザーID
    interests: string[]; // 興味関心
    status: 'pending' | 'lineContacted' | 'achieved';
    createdAt: { toDate: () => Date };
}

// *******************************************************
// メインのページコンポーネント
// *******************************************************
const LeadsManagementPage: FC = () => {
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [counts, setCounts] = useState<LeadCounts>({
        total: 0,
        lineContacted: 0,
        pending: 0,
    });
    const [leads, setLeads] = useState<LeadData[]>([]);
    const [error, setError] = useState<string | null>(null);

    // 認証チェックとリダイレクト
    useEffect(() => {
        if (!auth || !auth.onAuthStateChanged) {
            setLoading(false);
            return;
        }

        const unsubscribe = onAuthStateChanged(auth, (currentUser: User | null) => {
            if (currentUser) {
                setUser(currentUser);
            } else {
                router.push('/partner/login');
            }
        });
        return () => unsubscribe();
    }, [router]);

    // リードデータ取得ロジック
    const fetchLeads = useCallback(async (currentUser: User) => {
        if (!currentUser || !db) {
            setLoading(false);
            return;
        }

        try {
            const leadsRef = collection(db as Firestore, 'artifacts', appId, 'leads');
            const q = query(leadsRef, where('ownerId', '==', currentUser.uid));
            const querySnapshot = await getDocs(q);

            const allLeads: LeadData[] = [];
            let total = 0;
            let lineContacted = 0;
            let achieved = 0;

            querySnapshot.forEach(doc => {
                const data = doc.data() as LeadData;
                total++;

                // ★ FIX 2783: doc.data()を展開し、doc.idでidを上書き/追加することで、重複エラーを回避
                allLeads.push({ ...data, id: doc.id });

                const status = data.status || 'pending';

                if (status === 'lineContacted') {
                    lineContacted++;
                } else if (status === 'achieved') {
                    achieved++;
                }
            });

            // 未対応/未契約 = 総リード数 - LINE誘導済 - 来店/成約済
            const pending = total - lineContacted - achieved;

            setLeads(allLeads);
            setCounts({
                total,
                lineContacted,
                pending,
            });
            setLoading(false);
        } catch (err: any) {
            console.error("リードの取得に失敗:", err);
            setError("リードデータの読み込みに失敗しました。");
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (user) {
            fetchLeads(user);
        }
    }, [user, fetchLeads]);

    // ローディング中のUI（FaSpinnerが使用されます）
    if (loading) {
        return (
            <div className="p-8 text-center text-gray-600 flex items-center justify-center h-screen">
                {/* ★ FaSpinnerが使えるようになりました */}
                <FaSpinner className="animate-spin w-6 h-6 mr-3 text-indigo-500" />
                AIアプローチデータを読み込み中...
            </div>
        );
    }

    // *******************************************************
    // UIレンダリング
    // *******************************************************
    const Card: FC<{ title: string; count: number; icon: React.ReactElement; color: string }> = ({ title, count, icon, color }) => (
        <div className="flex-1 p-6 bg-white rounded-xl shadow-lg border-t-4" style={{ borderColor: color }}>
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold uppercase text-gray-500">{title}</h3>
                {icon}
            </div>
            <p className="text-4xl font-extrabold text-gray-900 mt-2" style={{ color }}>{count}</p>
        </div>
    );

    // リードのステータス表示ヘルパー
    const LeadStatusBadge: FC<{ status: LeadData['status'] }> = ({ status }) => {
        switch (status) {
            case 'lineContacted':
                return <span className="bg-green-100 text-green-700 px-3 py-1 text-xs font-semibold rounded-full">LINE誘導済</span>;
            case 'achieved':
                return <span className="bg-blue-100 text-blue-700 px-3 py-1 text-xs font-semibold rounded-full">成約済</span>;
            case 'pending':
            default:
                return <span className="bg-red-100 text-red-700 px-3 py-1 text-xs font-semibold rounded-full">未対応</span>;
        }
    };


    return (
        <div className="container mx-auto p-4 md:p-8 max-w-5xl">
            <Link href="/partner/dashboard" passHref legacyBehavior>
                <a className="text-indigo-600 hover:underline flex items-center mb-6">
                    <FaArrowLeft className="mr-2 w-4 h-4" />
                    ダッシュボードに戻る
                </a>
            </Link>

            <h1 className="text-3xl font-bold text-gray-800 mb-2">AIマッチング アプローチ管理</h1>
            <p className="text-gray-600 mb-8">AIが選定したユーザーの興味記録と、アプローチ状況を確認できます。</p>

            {error && (
                <div className="p-4 mb-6 text-sm text-red-700 bg-red-100 rounded-lg" role="alert">
                    {error}
                </div>
            )}

            {/* ステータスカードの表示 */}
            <div className="grid grid-cols-3 gap-6 mb-10">
                <Card
                    title="総リード数"
                    count={counts.total}
                    icon={<FaUsers className="w-6 h-6 text-indigo-400" />}
                    color="#6366f1"
                />
                <Card
                    title="LINE誘導済"
                    count={counts.lineContacted}
                    icon={<FaLine className="w-6 h-6 text-green-500" />}
                    color="#10b981"
                />
                <Card
                    title="未対応/未契約"
                    count={counts.pending}
                    icon={<FaTimesCircle className="w-6 h-6 text-red-500" />}
                    color="#ef4444"
                />
            </div>

            {/* リード一覧 / メッセージ */}
            {counts.total === 0 ? (
                <div className="p-10 text-center bg-white rounded-xl shadow-lg border-2 border-dashed border-gray-300">
                    <h2 className="text-xl font-semibold text-gray-800 mb-3">現在、アプローチ記録はありません。</h2>
                    <p className="text-gray-600 mb-6">AIクイックマッチからのユーザー流入をお待ちください。</p>
                    <Link href="/partner/profile" passHref legacyBehavior>
                        <a className="text-indigo-600 hover:underline font-medium">
                            → 店舗プロフィール（AI価値観）編集へ
                        </a>
                    </Link>
                </div>
            ) : (
                <div className="bg-white p-6 rounded-xl shadow-lg">
                    <h2 className="text-xl font-bold mb-4 border-b pb-2 text-gray-700">詳細リード一覧 ({leads.length}件)</h2>

                    <div className="space-y-3">
                        {leads.map((lead) => (
                            <div key={lead.id} className="p-4 border rounded-lg flex justify-between items-center bg-gray-50 hover:bg-gray-100 transition">
                                <div className="flex-1">
                                    <p className="font-semibold text-gray-800">
                                        ユーザーID: {lead.userId.substring(0, 8)}...
                                    </p>
                                    <p className="text-sm text-gray-600 mt-1">
                                        興味関心: {lead.interests?.join(', ') || 'N/A'}
                                    </p>
                                    <p className="text-xs text-gray-400 flex items-center mt-1">
                                        <FaRegClock className='w-3 h-3 mr-1' />
                                        登録日: {lead.createdAt?.toDate?.()?.toLocaleDateString('ja-JP')}
                                    </p>
                                </div>
                                <div>
                                    <LeadStatusBadge status={lead.status} />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default LeadsManagementPage;