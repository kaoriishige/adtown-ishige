// recruit/dashboard.tsx
import { GetServerSideProps, NextPage } from 'next';
import Link from 'next/link';
import Head from 'next/head';
import { adminDb, adminAuth } from '@/lib/firebase-admin';
import nookies from 'nookies';
import {
    RiBuilding4Line, RiFileList3Line, RiUserSearchLine, RiLogoutBoxRLine,
    RiLayout2Line, RiContactsLine, RiSendPlaneFill, RiLoader2Line,
    RiAdvertisementLine
} from 'react-icons/ri';
import { useRouter } from 'next/router';
import { signOut, getAuth, onAuthStateChanged } from "firebase/auth";
import { app } from "@/lib/firebase";
import { useState, useEffect } from 'react';

// --- 型定義 ---
interface Candidate {
    id: string;
    name: string;
    age: string | number;
    desiredJob: string;
    skills: string;
    score?: number;
    reasons?: string[];
    contactInfo?: string;
}

interface DashboardProps {
    companyName: string;
    candidates: Candidate[];
    contacts: Candidate[];
    isUserAdPartner: boolean;
}

// --- SSR: Firestoreデータ取得 ---
export const getServerSideProps: GetServerSideProps = async (context) => {
    try {
        const cookies = nookies.get(context);
        const token = await adminAuth.verifySessionCookie(cookies.session || '', true);
        const { uid } = token;

        const userSnap = await adminDb.collection('users').doc(uid).get();
        if (!userSnap.exists) throw new Error("Company user not found.");

        const userData = userSnap.data()!;
        const companyName = userData.companyName || "未設定の会社名";
        const isUserAdPartner = userData.isAdPartner || false;

        // AI推薦候補者取得
        const candidates: Candidate[] = [];
        const appsSnap = await adminDb
            .collection('userApplications')
            .where('companyId', '==', uid)
            .where('status', '==', 'applied')
            .get();

        for (const doc of appsSnap.docs) {
            const app = doc.data();
            const userSnap = await adminDb.collection('users').doc(app.userId).get();
            if (userSnap.exists) {
                const u = userSnap.data()!;
                candidates.push({
                    id: app.userId,
                    name: u.name || '匿名ユーザー',
                    age: u.age || '不明',
                    desiredJob: u.desiredJobTypes?.[0] || '未設定',
                    skills: u.skills?.substring(0, 50) + '...' || 'スキル概要なし',
                    score: app.matchScore || 0,
                    reasons: app.matchReasons || [],
                });
            }
        }

        // 連絡先交換済み取得
        const contacts: Candidate[] = [];
        const contactsSnap = await adminDb
            .collection('matches')
            .where('companyUid', '==', uid)
            .where('status', '==', 'exchanged')
            .get();

        for (const doc of contactsSnap.docs) {
            const m = doc.data();
            const userSnap = await adminDb.collection('users').doc(m.userUid).get();
            if (userSnap.exists) {
                const u = userSnap.data()!;
                contacts.push({
                    id: m.userUid,
                    name: u.name || '匿名',
                    age: u.age || '不明',
                    desiredJob: u.desiredJobTypes?.[0] || '未設定',
                    skills: u.skills || '',
                    contactInfo: u.email || u.phoneNumber || '連絡先情報なし',
                });
            }
        }

        return {
            props: { companyName, candidates, contacts, isUserAdPartner },
        };
    } catch (error) {
        console.error("Error in recruit/dashboard:", error);
        return { redirect: { destination: '/partner/login', permanent: false } };
    }
};

// --- UIコンポーネント ---
const DashboardCard = ({ href, icon, title, description, color }: any) => {
    const colorMap: any = {
        indigo: 'bg-indigo-100 text-indigo-600 group-hover:bg-indigo-200',
        green: 'bg-green-100 text-green-600 group-hover:bg-green-200',
        red: 'bg-red-100 text-red-600 group-hover:bg-red-200',
        yellow: 'bg-yellow-100 text-yellow-600 group-hover:bg-yellow-200',
        purple: 'bg-purple-100 text-purple-600 group-hover:bg-purple-200',
    };
    return (
        <Link
            href={href}
            className="group block bg-white p-6 rounded-xl shadow-lg border border-gray-100 hover:shadow-2xl hover:border-indigo-400 transition-all"
        >
            <div className="flex items-start space-x-4">
                <div className={`p-4 rounded-xl ${colorMap[color]}`}>{icon}</div>
                <div>
                    <h3 className="text-xl font-bold text-gray-800 group-hover:text-indigo-600">{title}</h3>
                    <p className="text-gray-500 mt-1 text-sm">{description}</p>
                </div>
            </div>
        </Link>
    );
};

// --- ページ本体 ---
const RecruitDashboard: NextPage<DashboardProps> = ({ companyName, candidates, contacts }) => {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const auth = getAuth(app);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (!user) router.push('/partner/login');
        });
        return () => unsubscribe();
    }, [auth, router]);

    const handleLogout = async () => {
        await signOut(auth);
        await fetch('/api/auth/sessionLogout', { method: 'POST' });
        router.push('/partner/login');
    };

    const handleRequestContactExchange = async (id: string) => {
        setLoading(true);
        try {
            const res = await fetch('/api/recruit/initiate-match', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userUid: id }),
            });
            const data = await res.json();
            if (res.ok && data.matchId) router.push(`/exchange/${data.matchId}`);
            else throw new Error(data.error || 'リクエスト失敗');
        } catch (err: any) {
            alert(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 font-sans">
            <Head><title>AI求人パートナー ダッシュボード</title></Head>

            <header className="bg-white shadow-md sticky top-0 z-10">
                <div className="max-w-6xl mx-auto px-6 py-6 flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-extrabold text-gray-900">AI求人パートナー ダッシュボード</h1>
                        <p className="text-gray-500 text-sm mt-1">ようこそ、{companyName} 様。</p>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="flex items-center space-x-2 text-sm text-red-600 hover:bg-red-600 hover:text-white p-3 rounded-xl bg-red-100 font-semibold shadow-sm"
                    >
                        <RiLogoutBoxRLine size={20} />
                        <span>ログアウト</span>
                    </button>
                </div>
            </header>

            <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">
                {/* 企業管理 */}
                <section>
                    <h2 className="text-2xl font-bold mb-6 border-b pb-2">1. 企業情報の管理</h2>
                    <DashboardCard
                        href="/recruit/profile"
                        icon={<RiBuilding4Line size={28} />}
                        title="企業プロフィールを登録・編集"
                        description="会社情報、担当者情報、ロゴなどを設定します"
                        color="indigo"
                    />
                </section>

                {/* 求人・応募者管理 */}
                <section>
                    <h2 className="text-2xl font-bold mb-6 border-b pb-2">2. 求人・応募者の管理</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <DashboardCard href="/recruit/jobs/create" icon={<RiFileList3Line size={28} />} title="新しい求人の作成" description="給与・勤務条件を設定" color="green" />
                        <DashboardCard href="/recruit/applicants" icon={<RiUserSearchLine size={28} />} title="応募者を確認・管理" description="進行中の選考状況を確認" color="yellow" />
                        <DashboardCard href="/recruit/jobs" icon={<RiLayout2Line size={28} />} title="求人一覧を管理" description="求人の編集・公開設定を変更" color="indigo" />
                    </div>
                </section>

                {/* 双方承諾済み */}
                <section>
                    <h2 className="text-2xl font-bold mb-6 border-b pb-2 flex items-center">
                        <RiContactsLine className="mr-2 text-green-500" size={24} />
                        双方承諾済み（連絡先交換リスト）
                    </h2>
                    <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
                        {contacts.length === 0 ? (
                            <p className="text-gray-600">まだマッチ成立中の求職者はいません。</p>
                        ) : (
                            <ul className="divide-y divide-gray-200">
                                {contacts.map((c) => (
                                    <li key={c.id} className="py-4">
                                        <p className="font-semibold text-gray-800">{c.name}</p>
                                        <p className="text-sm text-gray-600 mb-1">希望職種: {c.desiredJob}</p>
                                        <p className="text-sm text-gray-800 bg-green-50 p-2 rounded">
                                            📞 連絡先: {c.contactInfo}
                                        </p>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </section>

                {/* ✅ 広告パートナー誘導 */}
                <section className="bg-white p-8 rounded-xl shadow-lg border-2 border-dashed border-blue-300">
                    <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
                        <RiAdvertisementLine className="mr-2 text-blue-500" size={28} />
                        広告パートナー募集中
                    </h2>
                    <p className="text-gray-700 mb-6 leading-relaxed">
                        月額<strong>3,850円税込み</strong>でアプリ広告出し放題！<br />
                        さらに、アプリ紹介手数料で収入獲得のチャンス！<br />
                        集客＋収益化の新しい仕組みを、ぜひご覧ください。
                    </p>
                    <Link
                        href="/partner/ad-subscribe"
                        className="inline-block px-8 py-3 text-white bg-blue-600 hover:bg-blue-700 rounded-xl font-bold shadow-lg transition"
                    >
                        詳しく見る
                    </Link>
                </section>
            </main>
        </div>
    );
};

export default RecruitDashboard;














