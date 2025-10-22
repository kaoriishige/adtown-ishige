// pages/users/dashboard.tsx (最終強化版 - マッチング結果取得修正)

import { useEffect, useState } from 'react';
import { getFirestore, collection, query, where, orderBy, getDocs, doc, getDoc, Query } from 'firebase/firestore';
import { getAuth, onAuthStateChanged, User } from 'firebase/auth';
import { app } from '../../lib/firebase'; 
import Link from 'next/link';
import Head from 'next/head';
import { RiContactsLine, RiAlertLine, RiSparkling2Line, RiMapPinLine, RiMoneyDollarCircleLine, RiSuitcaseLine, RiHeartPulseLine, RiEditCircleLine, RiFileList3Line, RiSearchLine, RiUserLine, RiHourglassLine, RiCheckLine, RiDownloadLine, RiArrowRightLine } from 'react-icons/ri';
import { Loader2 } from 'lucide-react';

// --- 型定義 ---

// 企業プロフィール、求人詳細、マッチ情報を統合したインターフェース
interface DetailedMatchJob {
    matchId: string; // matchResultsドキュメントID
    recruitmentId: string;
    score: number;
    reasons: string[];
    jobTitle: string;
    employmentType: string;
    salary: string; 
    location: string;
    companyName: string;
}

interface ContactData {
    id: string; // jobApplicants ID
    companyName?: string;
    jobTitle?: string;
    contactInfo?: string;
}

interface ApplicationHistory {
    id: string; // jobApplicants ID
    recruitmentId: string;
    jobTitle: string;
    companyName: string;
    matchStatus: 'applied' | 'accepted' | 'rejected' | 'agreed'; 
    companyFeedback?: string;
}

// ----------------------------------------------------------------------
// メインコンポーネント
// ----------------------------------------------------------------------
export default function UserDashboard() {
    const [user, setUser] = useState<User | null | undefined>(undefined); 
    const [matches, setMatches] = useState<DetailedMatchJob[]>([]);
    const [contacts, setContacts] = useState<ContactData[]>([]);
    const [history, setHistory] = useState<ApplicationHistory[]>([]); 
    const [statusSummary, setStatusSummary] = useState({ applied: 0, accepted: 0, rejected: 0, agreed: 0 }); 
    const [isProfileComplete, setIsProfileComplete] = useState(false); // プロフィール完了状態
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const auth = getAuth(app);
        const db = getFirestore(app);

        const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
            setUser(currentUser);
            if (!currentUser) {
                setLoading(false);
                return;
            }

            try {
                // --- 0. プロフィール完了状態のチェック ---
                const profileSnap = await getDoc(doc(db, 'userProfiles', currentUser.uid));
                const profileExists = profileSnap.exists();
                const profileData = profileSnap.data();

                // 必須フィールドのチェックを厳格化
                const isComplete = profileExists && profileData?.desiredJobTypes?.length > 0 && profileData?.skills && profileData?.desiredSalaryMin;
                setIsProfileComplete(!!isComplete);
                
                if (!isComplete) {
                     setLoading(false);
                     return;
                }

                // --- 1. AIマッチング結果 (matchResults) の取得 ---
                // AIがマッチング結果を保存するコレクションから取得
                const rawMatchQuery: Query<any> = query(
                    collection(db, 'matchResults'), // 🚨 コレクション名を修正
                    where('userUid', '==', currentUser.uid), // 🚨 フィールド名を修正
                    orderBy('score', 'desc')
                );
                const matchSnap = await getDocs(rawMatchQuery);
                const rawMatches = matchSnap.docs.map((d) => ({
                    ...d.data(),
                    matchId: d.id,
                    recruitmentId: d.data().jobId, 
                    score: d.data().score,
                    reasons: d.data().reasons,
                }));

                const uniqueRecruitmentIds = new Set(rawMatches.map(m => m.recruitmentId));
                const recruitmentIds = Array.from(uniqueRecruitmentIds).filter(id => id);

                // --- 2. 関連する求人情報と企業情報を結合して取得 ---
                const recruitmentMap = new Map();
                const companyUids = new Set<string>();
                for (const id of recruitmentIds) {
                    const snap = await getDoc(doc(db, 'recruitments', id));
                    if (snap.exists() && snap.data().uid) {
                        recruitmentMap.set(snap.id, snap.data());
                        companyUids.add(snap.data().uid);
                    }
                }
                const companyMap = new Map();
                for (const uid of Array.from(companyUids)) { 
                    const snap = await getDoc(doc(db, 'recruiters', uid));
                    if (snap.exists()) companyMap.set(snap.id, snap.data());
                }
                
                // --- 3. 統合データの構築 ---
                const detailedMatches: DetailedMatchJob[] = rawMatches.map(raw => {
                    const job = recruitmentMap.get(raw.recruitmentId);
                    if (!job) return null; 
                    const company = companyMap.get(job.uid) || {};
                    
                    // 給与の整形
                    const salaryText = `${job.salaryType} ${job.salaryMin || '???'}${job.salaryType === '年収' ? '万円' : '円'}〜${job.salaryMax || '???'}${job.salaryType === '年収' ? '万円' : '円'}`;
                    
                    return {
                        matchId: raw.matchId, recruitmentId: raw.recruitmentId, score: raw.score || 0,
                        reasons: raw.reasons?.slice(0, 3) || [], jobTitle: job.jobTitle || 'タイトル未設定',
                        employmentType: job.employmentType || '未設定', salary: salaryText, location: job.location || '不明',
                        companyName: company.companyName || '企業名非公開',
                    } as DetailedMatchJob;
                }).filter(m => m !== null) as DetailedMatchJob[];

                setMatches(detailedMatches);

                // --- 4. 応募履歴の取得とサマリー計算 (jobApplicants コレクションを使用) ---
                const historyQuery: Query<ApplicationHistory> = query(
                    collection(db, 'jobApplicants'), 
                    where('userId', '==', currentUser.uid),
                    orderBy('createdAt', 'desc')
                ) as Query<ApplicationHistory>;
                const historySnap = await getDocs(historyQuery);
                
                const historyList: ApplicationHistory[] = [];
                const summary = { applied: 0, accepted: 0, rejected: 0, agreed: 0 };
                
                for (const doc of historySnap.docs) {
                    const data = doc.data();
                    const status = data.matchStatus as ApplicationHistory['matchStatus'];
                    
                    if (status) {
                        if (status === 'applied') summary.applied++;
                        if (status === 'accepted') summary.accepted++;
                        if (status === 'rejected') summary.rejected++;
                        if (status === 'agreed') summary.agreed++;
                    }
                    
                    const job = recruitmentMap.get(data.recruitmentId);
                    
                    historyList.push({
                        id: doc.id,
                        recruitmentId: data.recruitmentId,
                        jobTitle: job?.jobTitle || data.jobTitle || 'タイトル不明',
                        companyName: companyMap.get(job?.uid)?.companyName || data.companyName || '企業名不明',
                        matchStatus: status,
                        companyFeedback: data.companyFeedback,
                    } as ApplicationHistory);
                }

                setStatusSummary(summary);
                setHistory(historyList);

                // --- 5. 双方承諾済み (contacts) の抽出 ---
                const contactsList = historyList.filter(h => h.matchStatus === 'agreed').map(h => ({
                    id: h.id, 
                    companyName: h.companyName, 
                    jobTitle: h.jobTitle, 
                    contactInfo: profileData?.phoneNumber || profileData?.email || '連絡先情報なし' 
                }));
                setContacts(contactsList as ContactData[]);
                
                setError(null);
            } catch (err) {
                console.error("Firestore data fetch error:", err);
                const errMessage = err instanceof Error ? err.message : "不明なエラー";
                setError(`データ取得中にエラーが発生しました: ${errMessage}。インデックスまたはセキュリティルールを確認してください。`);
            } finally {
                setLoading(false);
            }
        });

        return () => unsubscribeAuth();
    }, []);
    
    // --- UIヘルパー: マッチング要素の表示 (変更なし) ---
    const MatchFactor = ({ icon, text }: { icon: JSX.Element, text: string }) => (
        <div className="flex items-center text-sm text-gray-700 bg-gray-100 px-3 py-1 rounded-full">
            {icon}
            <span className="ml-1.5">{text.substring(0, 15)}</span>
        </div>
    );
    
    // --- UIヘルパー: ステータスカードのスタイル ---
    const StatusCard = ({ icon, title, count, color }: { icon: JSX.Element, title: string, count: number, color: string }) => (
        <div className={`p-4 rounded-xl shadow-md border ${color}`}>
            <div className="flex items-center space-x-3">
                {icon}
                <p className="text-2xl font-bold">{count}件</p>
            </div>
            <h4 className="text-lg font-semibold mt-1">{title}</h4>
        </div>
    );

    // --- UIヘルパー: 応募履歴のステータス表示 ---
    const getHistoryStatusDisplay = (status: ApplicationHistory['matchStatus']) => {
        switch (status) {
            case 'applied': return { text: '企業審査中', color: 'bg-yellow-100 text-yellow-800 border-yellow-300', icon: <RiHourglassLine size={16} /> };
            case 'accepted': return { text: '書類選考通過', color: 'bg-blue-100 text-blue-800 border-blue-300', icon: <RiCheckLine size={16} /> };
            case 'rejected': return { text: '見送り', color: 'bg-red-100 text-red-800 border-red-300', icon: <RiAlertLine size={16} /> };
            case 'agreed': return { text: 'マッチ成立', color: 'bg-green-100 text-green-800 border-green-300', icon: <RiContactsLine size={16} /> };
            default: return { text: '不明', color: 'bg-gray-100 text-gray-500 border-gray-300', icon: <RiAlertLine size={16} /> };
        }
    };


    // --- ローディング/エラー/未認証時の表示 ---
    if (loading) {
        return <div className="p-10 text-center text-indigo-600 text-lg flex justify-center items-center"><Loader2 className="animate-spin mr-3" /> AIマッチングデータを読み込み中...</div>;
    }

    if (user === null) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center p-6">
              <p className="text-xl font-bold text-red-600 mb-4">アクセスが拒否されました</p>
              <Link href="/users/login" className="mt-4 inline-block bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 transition">ログインページへ</Link>
            </div>
        );
    }

    // ----------------------------------------------------------------------
    // ⚠️ プロフィール不完全時の UI (最重要)
    // ----------------------------------------------------------------------
    if (!isProfileComplete) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center p-6 text-center">
                <RiUserLine size={60} className="text-red-500 mb-4" />
                <h1 className="text-3xl font-bold text-gray-900 mb-3">プロフィールを完成させてください！</h1>
                <p className="text-lg text-gray-600 mb-6">
                    AIマッチングを開始するには、あなたの**希望職種、給与、スキル、そして価値観**の登録が必要です。
                </p>
                <Link href="/users/profile" className="px-8 py-3 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 flex items-center">
                    <RiEditCircleLine className="mr-2" /> プロフィールを編集する
                </Link>
                <p className="text-sm text-gray-500 mt-4">（企業マッチングはこの入力情報に基づいて行われます）</p>
            </div>
        );
    }
    // ----------------------------------------------------------------------

    if (error) {
        return (
            <div className="min-h-screen bg-gray-50 font-sans p-6">
              <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4" role="alert">
                <p className="font-bold">重大なエラー</p>
                <p className="mt-2 text-sm">{error}</p>
              </div>
            </div>
        );
    }

    // ----------------------------------------------------------------------
    // メインダッシュボードUI
    // ----------------------------------------------------------------------
    return (
        <div className="min-h-screen bg-gray-50 font-sans">
            <Head>
                <title>{"マイダッシュボード｜AI求人マッチング"}</title>
            </Head>

            <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">
                
                {/* 1. アクションとプロフィールサマリー */}
                <section>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center">
                        <RiSparkling2Line className="text-indigo-500 mr-2" size={32} />
                        マイ AI マッチングセンター
                    </h1>
                    <p className="text-gray-600 text-sm">AIマッチングを最適化するために、プロフィールを最新に保ちましょう。</p>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
                         {/* アクションカード: プロフィール (最重要アクション) */}
                        <Link href="/users/profile" className="group block bg-white p-6 rounded-xl shadow-lg border-2 border-indigo-500 hover:shadow-2xl hover:border-indigo-700 transition-all">
                            <RiEditCircleLine size={28} className="text-indigo-600" />
                            <h3 className="text-xl font-bold text-gray-800 mt-2 group-hover:text-indigo-600">プロフィール編集</h3>
                            <p className="text-gray-500 mt-1 text-sm">**マッチングの精度**はあなたの入力情報で決まります。</p>
                        </Link>
                        {/* アクションカード: 求人検索 */}
                        <Link href="/jobs" className="group block bg-white p-6 rounded-xl shadow-lg border border-gray-100 hover:shadow-2xl hover:border-indigo-400 transition-all">
                            <RiSearchLine size={28} className="text-green-600" />
                            <h3 className="text-xl font-bold text-gray-800 mt-2 group-hover:text-green-600">全求人検索・閲覧</h3>
                            <p className="text-gray-500 mt-1 text-sm">AIマッチング以外の求人も含めて検索します。</p>
                        </Link>
                         {/* アクションカード: 応募履歴 */}
                        <Link href="#history" className="group block bg-white p-6 rounded-xl shadow-lg border border-gray-100 hover:shadow-2xl hover:border-indigo-400 transition-all">
                            <RiFileList3Line size={28} className="text-yellow-600" />
                            <h3 className="text-xl font-bold text-gray-800 mt-2 group-hover:text-yellow-600">応募履歴を確認</h3>
                            <p className="text-gray-500 mt-1 text-sm">企業からの最新の対応状況（審査中、見送りなど）をチェック。</p>
                        </Link>
                    </div>
                </section>
                
                <hr className="my-8" />
                
                {/* 2. 応募状況サマリー */}
                <section>
                    <h2 className="text-2xl font-bold text-gray-800 mb-6 border-b pb-2">2. 応募状況サマリー</h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        <StatusCard 
                            icon={<RiFileList3Line size={30} className="text-gray-600" />}
                            title="応募済み（合計）"
                            count={history.length}
                            color="border-gray-300 bg-white"
                        />
                         <StatusCard 
                            icon={<RiHourglassLine size={30} className="text-yellow-600" />}
                            title="企業審査中"
                            count={statusSummary.applied}
                            color="border-yellow-300 bg-yellow-50"
                        />
                        <StatusCard 
                            icon={<RiContactsLine size={30} className="text-green-600" />}
                            title="マッチ成立"
                            count={statusSummary.agreed}
                            color="border-green-300 bg-green-50"
                        />
                        <StatusCard 
                            icon={<RiAlertLine size={30} className="text-red-600" />}
                            title="企業より見送り"
                            count={statusSummary.rejected}
                            color="border-red-300 bg-red-50"
                        />
                    </div>
                </section>

                <hr className="my-8" />

                {/* 3. AIによるマッチング求人（高スコア順） */}
                <section>
                    <h2 className="text-2xl font-bold text-gray-800 mb-6 border-b pb-2">3. AIによるマッチング求人 ({matches.length}件)</h2>
                    {matches.length === 0 ? (
                        <p className="text-gray-600 p-6 bg-white rounded-xl shadow-sm border border-gray-100">
                            現在、あなたにマッチする求人は見つかっていません。
                        </p>
                    ) : (
                        <div className="space-y-6">
                            {matches.map((m) => (
                                <div key={m.matchId} className="bg-white border p-5 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300">
                                    <div className="flex justify-between items-start border-b pb-3 mb-3">
                                        <div>
                                            <h3 className="text-xl font-bold text-indigo-700 hover:underline">{m.jobTitle}</h3>
                                            <p className="text-sm text-gray-500 mt-0.5">{m.companyName} | {m.employmentType}</p>
                                        </div>
                                        <div className={`p-2 rounded-lg text-white font-extrabold text-2xl shadow-md ${m.score >= 80 ? 'bg-green-500' : m.score >= 60 ? 'bg-yellow-500' : 'bg-gray-400'}`}>
                                            {m.score}点
                                        </div>
                                    </div>

                                    <div className="space-y-3 mb-4">
                                        <p className="font-semibold text-gray-700 flex items-center text-sm">
                                            <RiSparkling2Line className="mr-1.5 text-indigo-500" /> AIマッチング理由:
                                        </p>
                                        <ul className="list-disc list-inside space-y-1 text-sm text-gray-600 ml-4">
                                            {m.reasons.length > 0 ? (
                                                m.reasons.map((reason, i) => <li key={i}>{reason}</li>)
                                            ) : (
                                                <li>AIが求人の特徴とあなたのプロフィールを比較しました。</li>
                                            )}
                                        </ul>
                                    </div>

                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                                        <MatchFactor icon={<RiMoneyDollarCircleLine />} text={m.salary} />
                                        <MatchFactor icon={<RiMapPinLine />} text={m.location} />
                                        <MatchFactor icon={<RiSuitcaseLine />} text={'勤務条件'} />
                                        <MatchFactor icon={<RiHeartPulseLine />} text={'福利厚生'} />
                                    </div>
                                    
                                    <Link href={`/users/job/${m.recruitmentId}`} className="mt-3 block text-center bg-indigo-500 text-white font-bold py-2 rounded-lg hover:bg-indigo-600 transition-colors">
                                        求人詳細と応募へ進む
                                    </Link>
                                </div>
                            ))}
                        </div>
                    )}
                </section>
                
                <hr id="history" className="my-8" />

                {/* 4. 応募履歴リスト */}
                <section>
                    <h2 className="text-2xl font-bold text-gray-800 mb-6 border-b pb-2">4. 応募した求人の対応状況 ({history.length}件)</h2>
                    <div className="space-y-4">
                        {history.length === 0 ? (
                            <p className="text-gray-600 p-6 bg-white rounded-xl shadow-sm border border-gray-100">まだ応募した求人はありません。上の「AIによるマッチング求人」から応募してみましょう！</p>
                        ) : (
                            history.map((h) => {
                                const status = getHistoryStatusDisplay(h.matchStatus);
                                return (
                                    <div key={h.id} className="bg-white p-4 rounded-xl shadow-md border border-gray-100 flex justify-between items-center hover:shadow-lg transition-shadow">
                                        <div>
                                            <p className="text-lg font-bold text-gray-800">{h.jobTitle}</p>
                                            <p className="text-sm text-gray-600">{h.companyName}</p>
                                            {h.matchStatus === 'rejected' && h.companyFeedback && (
                                                <p className="text-xs text-red-500 mt-1">企業フィードバック: {h.companyFeedback}</p>
                                            )}
                                        </div>
                                        
                                        <div className="flex flex-col items-end space-y-2">
                                            <div className={`inline-flex items-center px-3 py-1 text-sm font-semibold rounded-full border ${status.color}`}>
                                                {status.icon} <span className="ml-1">{status.text}</span>
                                            </div>
                                            <Link 
                                                href={`/users/job/${h.recruitmentId}`} 
                                                className="text-sm font-bold text-indigo-600 hover:text-indigo-800 flex items-center"
                                            >
                                                詳細 <RiArrowRightLine className="ml-1" />
                                            </Link>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </section>

                <hr id="contacts" className="my-8" />

                {/* 5. 連絡先交換済み（マッチ成立） */}
                <section>
                    <h2 className="text-2xl font-bold text-gray-800 mb-6 border-b pb-2 flex items-center">
                        <RiContactsLine className="text-green-500 mr-2" size={24} />
                        5. 連絡先交換済み（マッチ成立）
                    </h2>
                    <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
                        {contacts.length === 0 ? (
                            <p className="text-gray-600">まだ企業とのマッチングは成立していません。</p>
                        ) : (
                             <ul className="divide-y divide-gray-200">
                                {contacts.map((c) => (
                                    <li key={c.id} className="py-4">
                                        <p className="font-semibold text-gray-800">{c.companyName || '企業名非公開'}</p>
                                        <p className="text-sm text-gray-600 mb-1">求人タイトル: {c.jobTitle || '未設定'}</p>
                                        {c.contactInfo ? (
                                            <p className="text-sm text-gray-800 font-medium bg-green-50 p-2 rounded">
                                                📞 連絡先: <span className="text-green-700 font-bold">{c.contactInfo}</span>
                                            </p>
                                        ) : (
                                            <p className="text-sm text-red-500">企業側でまだ連絡先が設定されていません。しばらくお待ちください。</p>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </section>
            </main>
        </div>
    );
}