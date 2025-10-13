// pages/recruit/dashboard.tsx
import { useEffect, useState } from "react";
import axios from "axios";
import Link from 'next/link';
import Head from 'next/head';
import { db, auth } from "@/lib/firebase";
import {
    RiBuilding4Line, RiFileList3Line, RiUserSearchLine, RiLogoutBoxRLine,
    RiPlayLine, RiPauseLine, RiErrorWarningLine, RiEdit2Line, RiAdvertisementLine,
    RiSettings3Line, RiCheckFill, RiSendPlaneFill, RiDeleteBin6Line, RiQuestionLine,
    RiCheckboxCircleLine, RiCloseCircleLine,
    RiAddLine,
    RiLayout2Line,
    RiMoneyDollarCircleLine
} from 'react-icons/ri';
import { useRouter } from 'next/router';
import { signOut, onAuthStateChanged } from "firebase/auth";

// --- 型定義 ---
interface Candidate {
    id: string;
    name: string;
    age: number;
    desiredJob: string;
    skills: string;
    score?: number;
    reasons?: string[];
}

interface DashboardCardProps {
    href: string;
    icon: React.ReactElement;
    title: string;
    description: string;
    color: 'indigo' | 'green' | 'red' | 'yellow' | 'purple';
}

// --- UIコンポーネント ---
const DashboardCard: React.FC<DashboardCardProps> = ({ href, icon, title, description, color }) => {
    const iconStyle = {
        'indigo': 'bg-indigo-100 text-indigo-600 group-hover:bg-indigo-200',
        'green': 'bg-green-100 text-green-600 group-hover:bg-green-200',
        'red': 'bg-red-100 text-red-600 group-hover:bg-red-200',
        'yellow': 'bg-yellow-100 text-yellow-600 group-hover:bg-yellow-200',
        'purple': 'bg-purple-100 text-purple-600 group-hover:bg-purple-200',
    }[color];

    return (
        <Link
            href={href}
            className="group block transition-all duration-300 bg-white p-6 rounded-xl shadow-lg border border-gray-100 hover:shadow-2xl hover:border-indigo-400"
        >
            <div className="flex items-start space-x-4">
                <div className={`p-4 rounded-xl ${iconStyle} transition-colors duration-300`}>
                    {icon}
                </div>
                <div>
                    <h3 className="text-xl font-bold text-gray-800 group-hover:text-indigo-600 transition-colors">{title}</h3>
                    <p className="text-gray-500 mt-1 text-sm">{description}</p>
                </div>
            </div>
        </Link>
    );
};

export default function RecruitDashboard() {
    const router = useRouter();
    const [candidates, setCandidates] = useState<Candidate[]>([]);
    const [aiActive, setAiActive] = useState(false);
    const [loading, setLoading] = useState(false);
    const [uid, setUid] = useState<string>("");
    const [companyName, setCompanyName] = useState<string>("あなたの会社");
    const [isAdPartner, setIsAdPartner] = useState<boolean>(true);

    // --- 初期データ読み込み（仮） ---
    useEffect(() => {
        onAuthStateChanged(auth, async (currentUser) => {
            if (currentUser) {
                setUid(currentUser.uid);
                setCompanyName("サンプル株式会社");
                setAiActive(true); 
            } else {
                setUid("");
                setCompanyName("ゲスト");
            }
        });
        // 応募者リストはApplicantsPageに移動したため、ここでは削除
        setCandidates([]); 
    }, []);

    // --- 各種ハンドラー（元のコードから流用） ---
    const handleLogout = async () => {
        try {
            await signOut(auth);
            router.push('/partner/login');
        } catch (error) {
            console.error('ログアウト失敗:', error);
            router.push('/partner/login');
        }
    };

    const handleStripeStart = async () => { /* ロジック省略 */ alert("Stripe開始をシミュレート"); };
    const handleStripeStop = async () => { /* ロジック省略 */ alert("Stripe停止をシミュレート"); };
    const handleAIStart = async () => { /* ロジック省略 */ alert("AI開始をシミュレート"); setAiActive(true); };
    const handleAIStop = async () => { /* ロジック省略 */ alert("AI停止をシミュレート"); setAiActive(false); };
    const handleGetMatchScore = async (candidate: Candidate) => { /* ロジック省略 */ alert(`${candidate.name} さんのAIスコアを確認（シミュレート）`); };
    const handleAction = (action: string, candidate: Candidate) => { /* ロジック省略 */ alert(`${candidate.name} さんを「${action}」しました。（シミュレート）`); };


    return (
        <div className="min-h-screen bg-gray-50 font-sans">
            <Head>
                <title>AI求人パートナー ダッシュボード</title>
            </Head>

            <header className="bg-white shadow-md sticky top-0 z-10">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-extrabold text-gray-900">AI求人パートナー ダッシュボード</h1>
                        <p className="text-gray-500 mt-1 text-sm">ようこそ、{companyName} 様。貴社の採用活動をサポートします。</p>
                    </div>
                    <button onClick={handleLogout} className="flex items-center space-x-2 text-sm text-red-600 hover:text-white hover:bg-red-600 transition-colors bg-red-100 p-3 rounded-xl font-semibold shadow-sm" aria-label="ログアウト">
                        <RiLogoutBoxRLine size={20} />
                        <span>ログアウト</span>
                    </button>
                </div>
            </header>

            <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                <div className="space-y-12">

                    {/* 1. 企業情報の管理 */}
                    <section>
                        <h2 className="text-2xl font-bold text-gray-800 mb-6 border-b pb-2">1. 企業情報の管理</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <DashboardCard
                                href="/recruit/profile"
                                icon={<RiBuilding4Line size={28} />}
                                title="企業プロフィールを登録・編集"
                                description="会社情報、担当者情報、ロゴなどを設定します"
                                color="indigo"
                            />
                        </div>
                    </section>

                    {/* 2. 求人・応募者の管理 */}
                    <section>
                        <h2 className="text-2xl font-bold text-gray-800 mb-6 border-b pb-2">2. 求人・応募者の管理</h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <DashboardCard
                                href="/recruit/jobs/create"
                                icon={<RiFileList3Line size={28} />}
                                title="新しい求人の作成"
                                description="給与・時給・勤務時間・制服貸与などを設定します"
                                color="green"
                            />
                            <DashboardCard
                                href="/recruit/applicants"
                                icon={<RiUserSearchLine size={28} />}
                                title="応募者を確認・管理"
                                description="進行中の選考状況と候補者の詳細を確認"
                                color="yellow"
                            />
                            <DashboardCard
                                href="/recruit/jobs"
                                icon={<RiLayout2Line size={28} />}
                                title="求人一覧を管理"
                                description="既存求人の編集・公開/停止を操作します"
                                color="indigo"
                            />
                        </div>
                    </section>

                    {/* ★追加: 求人マッチングAIの使い方セクション (デモ) */}
                    <section>
                        <h2 className="text-2xl font-bold text-gray-800 border-b pb-3 mb-6 flex items-center">
                            <RiQuestionLine className="mr-3 text-indigo-500" size={24}/>
                            求人マッチングAIの使い方
                        </h2>
                        <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-100">
                            <h3 className="text-lg font-bold text-gray-800 mb-4">求職者へのアクションとAI学習</h3>
                            
                            {/* デモアクションパネル (ボタンは押せない) */}
                            <div className="p-4 border rounded-lg bg-gray-50 pointer-events-none opacity-80">
                                <h3 className="font-semibold text-lg text-gray-800 mb-3">佐藤 太郎 (29歳) さんのアクション例</h3>
                                <div className="flex flex-wrap gap-2">
                                    <button className="text-sm py-2 px-3 bg-blue-600 text-white rounded-lg min-w-[120px] shadow-md">プロフィールを見る</button>
                                    <button className="text-sm py-2 px-3 bg-green-600 text-white rounded-lg flex items-center justify-center gap-1 min-w-[120px] shadow-md"><RiCheckFill /> 承諾</button>
                                    <button className="text-sm py-2 px-3 bg-purple-600 text-white rounded-lg flex items-center justify-center gap-1 min-w-[120px] shadow-md"><RiSendPlaneFill /> スカウト</button>
                                    <button className="text-sm py-2 px-3 bg-yellow-600 text-white rounded-lg min-w-[120px] shadow-md">見送り</button>
                                    <button className="text-sm py-2 px-3 bg-gray-500 text-white rounded-lg flex items-center justify-center gap-1 min-w-[120px] shadow-md"><RiDeleteBin6Line /> 興味なし</button>
                                </div>
                                <div className="mt-4 pt-4 border-t border-gray-200">
                                    <p className="text-xs text-gray-700">
                                        🔍 **AIスコア**は「プロフィールを見る」ボタンから確認できます。
                                        <br />
                                        💡 **承諾**＝候補として保持、**スカウト**＝個別メッセージ送信、**見送り**＝AIが先方に丁寧な文章で回答する、**興味なし**＝求職者の一覧から除外されます。
                                    </p>
                                </div>
                            </div>
                        </div>
                    </section>
                    
                    {/* --- クレカ決済利用者 --- */}
                    <div className="mb-8 p-4 border rounded-lg bg-gray-50">
                        <h2 className="text-lg font-semibold mb-2">
                            1. クレジットカード決済でお申し込みの方がこちらをご利用ください。
                        </h2>
                        <p className="text-sm text-gray-600 mb-3">
                            Stripeによる自動課金でAIマッチングを利用できます。
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={handleStripeStart}
                                disabled={loading}
                                className="px-4 py-2 bg-blue-600 text-white rounded-xl shadow hover:bg-blue-700 disabled:bg-gray-400"
                            >
                                求人マッチングAIを開始
                            </button>
                            <button
                                onClick={handleStripeStop}
                                disabled={loading}
                                className="px-4 py-2 bg-red-600 text-white rounded-xl shadow hover:bg-red-700 disabled:bg-gray-400"
                            >
                                求人マッチングAIを停止
                            </button>
                        </div>
                    </div>

                    {/* --- 請求書払い利用者 --- */}
                    <div className="mb-8 p-4 border rounded-lg bg-gray-50">
                        <h2 className="text-lg font-semibold mb-2">
                            2. 請求書でお申込みの方がこちらをご利用ください。
                        </h2>
                        <p className="text-sm text-gray-600 mb-3">
                            AIマッチングの利用を手動で開始・停止できます。
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={handleAIStart}
                                disabled={loading}
                                className="px-4 py-2 bg-green-600 text-white rounded-xl shadow hover:bg-green-700 disabled:bg-gray-400"
                            >
                                求人マッチングAIを開始
                            </button>
                            <button
                                onClick={handleAIStop}
                                disabled={loading}
                                className="px-4 py-2 bg-red-600 text-white rounded-xl shadow hover:bg-red-700 disabled:bg-gray-400"
                            >
                                求人マッチングAIを停止
                            </button>
                        </div>
                    </div>

                    {/* --- 追加の収益化サービス (広告パートナー) --- */}
                    {isAdPartner && (
                        <section className="mt-12">
                            <h2 className="text-2xl font-bold text-gray-800 mb-6 border-b pb-2">追加の収益化サービス</h2>
                            <div className="bg-white p-6 rounded-xl shadow-lg border-2 border-dashed border-blue-200">
                                <div className="flex flex-col md:flex-row items-start md:items-center justify-between space-y-4 md:space-y-0">
                                    <div>
                                        <h3 className="text-xl font-bold text-gray-800 flex items-center"><RiAdvertisementLine className="mr-2 text-blue-500" />広告パートナーサービス</h3>
                                        <p className="text-sm text-gray-600 mt-2 max-w-lg">
                                            **月額3,300円**で、アプリ内での広告掲載や、紹介料プログラムで新たな収益源を確保しませんか？
                                        </p>
                                    </div>
                                    <Link href="/partner/ad-subscribe" className="px-6 py-3 font-bold rounded-xl text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-lg">
                                        詳しく見る
                                    </Link>
                                </div>
                            </div>
                        </section>
                    )}
                </div>
            </main>
        </div>
    );
}













