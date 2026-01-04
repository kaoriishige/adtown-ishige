import { useState, useMemo } from 'react';
import { NextPage, GetServerSideProps } from 'next';
import Image from 'next/image';
import nookies from 'nookies';
import Head from 'next/head';

// Firebase Admin SDK
import { adminAuth, adminDb } from '@/lib/firebase-admin';

// React Icons
import {
    RiLayoutGridFill,
    RiAlarmWarningLine,
    RiShoppingBagLine,
    RiBriefcase4Line,
    RiHealthBookLine,
    RiMagicLine,
    RiCloseCircleLine,
    RiGasStationLine,
    RiArrowGoBackLine,
} from 'react-icons/ri';
import { IoSparklesSharp } from 'react-icons/io5';

// Firebase Client
import { getAuth, signOut } from 'firebase/auth';
import { app } from '@/lib/firebase-client';

interface HomePageProps {
    user: { uid: string; email: string | null; };
}

interface EmergencyContact {
    name: string;
    number?: string;
    description: string;
    url: string;
}

interface NavButton {
    title: string;
    description: string;
    href: string;
    Icon: any;
    gradient: string;
    disabled: boolean;
}

const HomePage: NextPage<HomePageProps> = ({ user }) => {
    const [isEmergencyModalOpen, setIsEmergencyModalOpen] = useState(false);
    const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
    const [isLoggingOut, setIsLoggingOut] = useState(false);

    const handleLogout = async () => {
        setIsLoggingOut(true);
        const auth = getAuth(app);
        try {
            await fetch('/api/auth/sessionLogout', { method: 'POST' });
            await signOut(auth);
            window.location.href = '/users/login';
        } catch (error) {
            window.location.href = '/users/login';
        }
    };

    const handleCancelSubscription = async () => {
        try {
            alert('解約処理を実行しました。アカウントはまもなく削除されます。');
            setIsCancelModalOpen(false);
            await handleLogout();
        } catch (error) {
            setIsCancelModalOpen(false);
        }
    };

    const emergencyContacts: EmergencyContact[] = useMemo(() => [
        { name: '消費者ホットライン', number: '188', description: '商品やサービスのトラブル', url: 'https://www.caa.go.jp/policies/policy/local_cooperation/local_consumer_administration/hotline/', },
        { name: '救急安心センター', number: '#7119', description: '急な病気やケガで救急車を呼ぶか迷った時', url: 'https://www.fdma.go.jp/publication/portal/post2.html', },
        { name: '那須塩原市の休日当番医', description: '那須塩原市の休日・夜間の急病', url: 'https://www.city.nasushiobara.tochigi.jp/soshikikarasagasu/kenkozoshinka/kyukyu_kyumei/1/3340.html', },
        { name: '大田原市の休日当番医', description: '大田原市の休日・夜間の急病', url: 'https://www.city.ohtawara.tochigi.jp/docs/2013082771612/', },
        { name: '那須町の休日当番医', description: '那須町の休日・夜間の急病', url: 'https://www.town.nasu.lg.jp/0130/info-0000003505-1.html', },
        { name: '水道のトラブル 緊急対応 (有)クリプトン', number: '090-2463-6638', description: '地元で40年 有限会社クリプトン', url: 'https://xn--bbkyao7065bpyck41as89d.com/emergency/', },
    ], []);

    const mainNavButtons: NavButton[] = useMemo(() => [
        { title: '店舗マッチングAI', description: '現在、店舗様募集中です。準備が整い次第公開します。', href: '/search-dashboard', Icon: IoSparklesSharp, gradient: 'bg-gradient-to-r from-blue-500 to-cyan-600', disabled: true },
        { title: '求人マッチングAI', description: '現在、企業様を募集中です。準備が整い次第公開します。', href: '/users/dashboard', Icon: RiBriefcase4Line, gradient: 'bg-gradient-to-r from-green-500 to-teal-600', disabled: true },
        { title: 'ガソリン価格比較', description: '近隣（那須塩原・大田原・那須）のガソリン価格をAIでチェック!!', href: '/apps/AIGasPriceTracker', Icon: RiGasStationLine, gradient: 'bg-gradient-to-r from-red-500 to-orange-600', disabled: false },
        { title: 'スーパー特売価格.com', description: '近隣スーパーの特売チラシ価格を比較して節約!!', href: '/nasu/kondate', Icon: RiShoppingBagLine, gradient: 'bg-gradient-to-r from-yellow-400 to-orange-500', disabled: false },
        { title: 'ドラッグストア特売価格.com', description: '近隣ドラッグストアの特売チラシ価格を比較して節約!!', href: '/nasu', Icon: RiHealthBookLine, gradient: 'bg-gradient-to-r from-purple-500 to-pink-600', disabled: false },
        { title: 'アプリのカテゴリからチェック!!', description: 'すべてのアプリ・機能を見る', href: '/apps/categories', Icon: RiLayoutGridFill, gradient: 'bg-gradient-to-r from-cyan-500 to-blue-500', disabled: false },
        { title: '今日の運勢占い', description: 'あなたの毎日を占います', href: '/apps/DailyFortune', Icon: RiMagicLine, gradient: 'bg-gradient-to-r from-indigo-500 to-purple-600', disabled: false }
    ], []);

    const sponsors = useMemo(() => [
        { name: '株式会社おまかせオート', image: '/images/partner-omakaseauto.png', url: 'https://www.omakase-auto.jp/', },
        { name: '株式会社大輪', image: '/images/partner-dairin.png', url: 'https://jp-dairin.jp/', },
        { name: '社会福祉法人 小春福祉会', image: '/images/partner-koharu.png', url: 'https://koharu-fukushikai.com/wp-content/themes/koharu/images/careplace/careplace_pamphlet.pdf', },
    ], []);

    return (
        <>
            <Head>
                <title>ホーム - みんなのNasuアプリ</title>
            </Head>

            <div className="bg-gray-100 min-h-screen font-sans">
                <div className="max-w-md mx-auto bg-white shadow-lg min-h-screen relative pb-10">
                    <header className="text-center p-6 bg-white sticky top-0 z-10 border-b">
                        <h1 className="text-3xl font-bold text-gray-800 tracking-tight italic">
                            みんなのNasuアプリ
                        </h1>
                        <p className="text-gray-400 mt-2 text-xs font-bold uppercase tracking-widest text-center">
                            {user.email}
                        </p>
                    </header>

                    <main className="p-4 space-y-6">
                        <button
                            onClick={() => setIsEmergencyModalOpen(true)}
                            className="w-full flex items-center justify-center text-red-600 font-bold py-4 rounded-2xl bg-red-50 border border-red-100 shadow-sm active:scale-95 transition"
                        >
                            <RiAlarmWarningLine size={24} className="mr-2" />
                            緊急連絡先を確認
                        </button>

                        <section className="grid gap-4">
                            {mainNavButtons.map((item) => (
                                <button
                                    key={item.title}
                                    disabled={item.disabled}
                                    onClick={() => { window.location.href = item.href; }}
                                    className={`
                                        w-full text-left p-5 rounded-2xl shadow-md transition transform
                                        text-white ${item.gradient}
                                        ${item.disabled ? 'opacity-60 cursor-not-allowed' : 'active:scale-95'}
                                    `}
                                >
                                    <div className="flex items-center">
                                        <item.Icon className="text-4xl mr-4 flex-shrink-0" />
                                        <div className="flex-1">
                                            <h2 className="font-bold text-lg flex items-center justify-between">
                                                {item.title}
                                                {item.disabled && (
                                                    <span className="bg-white text-gray-600 text-[10px] px-2 py-0.5 rounded-full font-black uppercase">
                                                        COMING SOON
                                                    </span>
                                                )}
                                            </h2>
                                            <p className="text-xs mt-1 opacity-90 leading-tight">
                                                {item.description}
                                            </p>
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </section>

                        <section className="bg-gradient-to-br from-white to-yellow-50 p-6 rounded-2xl shadow-md border-2 border-yellow-400 text-center">
                            <h2 className="text-xl font-black text-gray-800 mb-2 leading-tight">
                                限定機能で、年間<span className="text-red-600 underline decoration-4 underline-offset-4">9.3万円</span>以上がお得に！
                            </h2>
                            <button disabled className="w-full p-4 rounded-xl bg-gray-200 text-gray-500 font-bold italic text-sm shadow-inner">
                                月額480円プラン (準備中)
                            </button>
                        </section>

                        <section className="pt-4 border-t border-gray-100">
                            <h3 className="text-[10px] font-bold text-gray-400 text-center mb-4 tracking-widest uppercase">
                                地域の協賛企業
                            </h3>
                            <div className="space-y-3">
                                {sponsors.map((sponsor) => (
                                    <a
                                        key={sponsor.name}
                                        href={sponsor.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="w-full block bg-gray-50 rounded-xl border border-gray-100 p-2 hover:shadow-sm transition active:scale-95"
                                    >
                                        <div className="relative w-full h-12">
                                            <Image src={sponsor.image} alt={sponsor.name} fill className="object-contain" unoptimized />
                                        </div>
                                    </a>
                                ))}
                            </div>
                        </section>

                        <footer className="text-center pt-8 space-y-6 pb-6">
                            <a href="https://lin.ee/Aac3C0d" target="_blank" rel="noopener noreferrer" className="inline-block active:scale-95 transition">
                                <img src="https://scdn.line-apps.com/n/line_add_friends/btn/ja.png" alt="LINE" height="36" className="h-9" />
                            </a>
                            <div className="px-4 space-y-3">
                                <button onClick={handleLogout} className="w-full py-4 text-red-600 font-bold bg-red-50 rounded-xl border border-red-100 active:scale-95 transition">ログアウト</button>
                                <button onClick={() => setIsCancelModalOpen(true)} className="w-full py-2 text-gray-400 text-xs font-bold">アカウントを解約する</button>
                            </div>
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">© 2026 株式会社adtown</p>
                        </footer>
                    </main>

                    {isEmergencyModalOpen && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                            <div className="bg-white rounded-3xl w-full max-w-md max-h-[85vh] overflow-hidden flex flex-col shadow-2xl">
                                <div className="p-4 border-b flex justify-between items-center bg-white sticky top-0 z-10">
                                    <h3 className="text-lg font-bold text-red-600 flex items-center"><RiAlarmWarningLine className="mr-2" /> 緊急連絡先</h3>
                                    <button onClick={() => setIsEmergencyModalOpen(false)} className="text-gray-300"><RiCloseCircleLine size={32} /></button>
                                </div>
                                <div className="p-4 space-y-4 overflow-y-auto bg-gray-50 flex-1">
                                    {emergencyContacts.map((contact, index) => (
                                        <div key={index} className="p-4 bg-white rounded-2xl border border-gray-100 shadow-sm text-left">
                                            <div className="flex justify-between items-start mb-1">
                                                <div className="font-black text-gray-800 leading-tight">{contact.name}</div>
                                                {contact.number && <a href={`tel:${contact.number}`} className="text-blue-600 font-black text-lg bg-blue-50 px-3 py-1 rounded-full">{contact.number}</a>}
                                            </div>
                                            <p className="text-xs text-gray-500 mb-2 leading-snug">{contact.description}</p>
                                            <a href={contact.url} target="_blank" rel="noopener noreferrer" className="text-[10px] text-blue-500 font-bold underline">公式サイトを確認する</a>
                                        </div>
                                    ))}
                                </div>
                                <div className="p-4 bg-white border-t">
                                    <button onClick={() => setIsEmergencyModalOpen(false)} className="w-full py-4 bg-gray-900 text-white font-bold rounded-xl shadow-lg active:scale-95 transition flex items-center justify-center">
                                        <RiArrowGoBackLine className="mr-2" /> ホームに戻る
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};

export const getServerSideProps: GetServerSideProps = async (context) => {
    try {
        const cookies = nookies.get(context);
        const sessionCookie = cookies.session || '';
        if (!sessionCookie) return { redirect: { destination: '/users/login', permanent: false } };
        const token = await adminAuth.verifySessionCookie(sessionCookie, true);
        const userDoc = await adminDb.collection('users').doc(token.uid).get();
        if (userDoc.data()?.plan === 'paid_480') return { redirect: { destination: '/mypage', permanent: false } };
        return { props: { user: { uid: token.uid, email: token.email || null } } };
    } catch (err) {
        return { redirect: { destination: '/users/login', permanent: false } };
    }
};

export default HomePage;
