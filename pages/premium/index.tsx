import { GetServerSideProps, NextPage } from 'next';
import Head from 'next/head';
import { useRouter } from 'next/router';
import React, { useState } from 'react';
import { adminDb, adminAuth } from '@/lib/firebase-admin';
import nookies from 'nookies';
import {
    RiCheckboxCircleFill,
    RiArrowRightLine,
    RiHandCoinFill,
    RiShieldCheckFill,
    RiFileList3Fill,
    RiPlantFill,
    RiFlashlightFill,
    RiHandHeartFill,
    RiServiceFill,
    RiGasStationFill,
    RiExternalLinkLine,
    RiArrowLeftSLine
} from 'react-icons/ri';
import { app } from '@/lib/firebase';
import { getAuth } from 'firebase/auth';

interface LPProps {
    uid: string | null;
}

const PremiumLandingPage: NextPage<LPProps> = ({ uid }) => {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    const handleSubscribe = async () => {
        setLoading(true);
        try {
            const auth = getAuth(app);
            const user = auth.currentUser;
            if (!user) {
                router.push('/users/login?from=/premium');
                return;
            }
            const idToken = await user.getIdToken();
            const res = await fetch('/api/create-checkout-session', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${idToken}`
                }
            });
            const data = await res.json();
            if (data.url) {
                window.location.href = data.url;
            } else {
                alert('決済ページの読み込みに失敗しました');
            }
        } catch (err) {
            console.error(err);
            alert('エラーが発生しました');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-white font-sans text-[#4A3B3B]">
            <Head>
                <title>那須で暮らして、紹介して、還元。 | みんなのNasu</title>
                <meta name="description" content="みんなのNasuアプリは、使うだけじゃなく紹介でも得ができる地域アプリです。" />
            </Head>

            {/* --- Header --- */}
            <header className="bg-white/80 backdrop-blur-xl border-b border-[#E8E2D9] px-6 py-4 sticky top-0 z-50">
                <div className="max-w-xl mx-auto flex items-center gap-4">
                    <button onClick={() => router.push('/home')} className="w-10 h-10 flex items-center justify-center rounded-full bg-[#FDFCFD] border border-[#E8E2D9] text-[#A89F94] active:scale-90 transition-all">
                        <RiArrowLeftSLine size={24} />
                    </button>
                    <div>
                        <span className="text-[10px] tracking-[0.3em] uppercase text-[#A89F94] block font-bold">Premium Plan</span>
                        <h1 className="text-sm font-black italic">プレミアムプラン</h1>
                    </div>
                </div>
            </header>

            <main className="max-w-xl mx-auto pb-32">

                {/* --- Hero Section --- */}
                <section className="px-6 pt-16 pb-12 text-center bg-gradient-to-b from-[#FFF5F8] to-white">
                    <div className="inline-block bg-pink-500 text-white text-[11px] font-black px-4 py-1 rounded-full mb-6 tracking-widest shadow-lg shadow-pink-100">
                        月額課金 480円
                    </div>
                    <h2 className="text-2xl md:text-3xl font-black leading-tight mb-6">
                        那須で暮らして、使って、紹介して。<br />
                        <span className="text-pink-600 underline decoration-pink-200 decoration-8 underline-offset-4">ちゃんと“現金”が戻ってくる</span>アプリ。
                    </h2>
                    <p className="text-sm font-bold text-[#8C8479] leading-relaxed">
                        みんなのNasuアプリは<br />
                        使うだけじゃなく、紹介でも得ができる地域アプリです。
                    </p>
                </section>

                {/* --- Mechanism Block --- */}
                <section className="px-6 py-12 space-y-8">
                    <div className="text-center">
                        <h3 className="text-xl font-black italic flex items-center justify-center gap-2">
                            <RiHandCoinFill className="text-pink-500" /> 稼げる仕組み
                        </h3>
                    </div>

                    <div className="bg-[#4A4540] rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-2xl">
                        <div className="relative z-10 space-y-6">
                            <div className="text-center">
                                <span className="text-4xl font-black italic">紹介報酬 20%</span>
                            </div>

                            <ul className="space-y-4 text-sm font-bold text-gray-200">
                                <li className="flex items-center gap-3 bg-white/10 p-4 rounded-2xl">
                                    <RiCheckboxCircleFill className="text-emerald-400 shrink-0" size={20} />
                                    <span>アプリ有料会員の紹介</span>
                                </li>
                                <li className="flex items-center gap-3 bg-white/10 p-4 rounded-2xl">
                                    <RiCheckboxCircleFill className="text-emerald-400 shrink-0" size={20} />
                                    <span>店舗集客広告の紹介</span>
                                </li>
                                <li className="flex items-center gap-3 bg-white/10 p-4 rounded-2xl">
                                    <RiCheckboxCircleFill className="text-emerald-400 shrink-0" size={20} />
                                    <span>企業求人広告の紹介</span>
                                </li>
                            </ul>

                            <div className="pt-4 border-t border-white/20 text-center space-y-2">
                                <p className="text-sm font-black italic">すべて対象。すべて20%。すべて銀行振込。</p>
                                <p className="text-[11px] text-gray-400">
                                    月末締め → 翌月15日お支払い<br />
                                    3,000円以上から振込対応
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* --- Examples Section --- */}
                <section className="px-6 py-12 bg-[#FDFCFD]">
                    <h3 className="text-sm font-black text-[#A89F94] uppercase tracking-widest text-center mb-10">具体例（ここ超重要）</h3>

                    <div className="space-y-6">
                        <ExampleCard
                            title="ママ友にアプリを教える"
                            tag="登録"
                            description="利用料の20%があなたに"
                        />
                        <ExampleCard
                            title="知り合いのお店に教える"
                            tag="広告掲載"
                            description="広告費の20%があなたに"
                        />
                        <ExampleCard
                            title="近所の会社に求人広告を教える"
                            tag="掲載"
                            description="求人広告費の20%があなたに"
                        />
                    </div>

                    <div className="mt-10 text-center bg-pink-50 p-6 rounded-[2rem] border border-pink-100">
                        <p className="text-sm font-black">👉 やることは「これいいよ」と教えるだけ。</p>
                    </div>
                </section>

                {/* --- Reassurance Section --- */}
                <section className="px-6 py-16 space-y-12">
                    <div className="text-center space-y-2">
                        <h3 className="text-sm font-black text-[#A89F94] uppercase tracking-widest">Safe & Local</h3>
                        <h2 className="text-2xl font-black italic">無理なく続けられる安心の理由</h2>
                    </div>
                    <div className="grid grid-cols-1 gap-4">
                        <div className="bg-white border-2 border-[#E8E2D9] p-6 rounded-[2rem] flex items-center gap-4 shadow-sm">
                            <RiShieldCheckFill className="text-emerald-500" size={32} />
                            <div>
                                <h4 className="font-black">副業ではありません。</h4>
                                <p className="text-[11px] text-[#A89F94] font-bold">面倒な手続きや報告は不要です。</p>
                            </div>
                        </div>
                        <div className="bg-white border-2 border-[#E8E2D9] p-6 rounded-[2rem] flex items-center gap-4 shadow-sm">
                            <RiShieldCheckFill className="text-emerald-500" size={32} />
                            <div>
                                <h4 className="font-black">ノルマもありません。</h4>
                                <p className="text-[11px] text-[#A89F94] font-bold">自分のペースで紹介できます。</p>
                            </div>
                        </div>
                        <div className="bg-white border-2 border-[#E8E2D9] p-6 rounded-[2rem] flex items-center gap-4 shadow-sm">
                            <RiShieldCheckFill className="text-emerald-500" size={32} />
                            <div>
                                <h4 className="font-black">勧誘もありません。</h4>
                                <p className="text-[11px] text-[#A89F94] font-bold">強引な誘いは必要ありません。</p>
                            </div>
                        </div>
                    </div>

                    <div className="text-center space-y-4">
                        <p className="text-sm font-bold leading-relaxed">
                            那須の中で回る、地域限定の仕組みです。<br />
                            だから、無理がありません。
                        </p>
                        <p className="text-pink-500 font-black italic">ここ、かなり効く。</p>
                    </div>
                </section>

                {/* --- App Features Section (What kind of app?) --- */}
                <section className="px-6 py-20 bg-[#FDFCFD] space-y-16">
                    <div className="text-center space-y-4">
                        <span className="bg-[#4A4540] text-white text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest">App Features</span>
                        <h2 className="text-2xl font-black">どんなことができるの？</h2>
                        <p className="text-sm text-[#8C8479] font-bold">那須の暮らしがもっと便利に、もっと楽しくなる機能が満載。</p>
                    </div>

                    <div className="space-y-12">
                        {/* 1. 半額速報 */}
                        <FeatureBlock
                            icon={<RiFlashlightFill className="text-rose-500" />}
                            title="爆安セール速報"
                            badge="LIVE"
                            description="「ダイユー那須高原店で今、全品半額シール貼られました！」そんなリアルタイムな超得情報が届きます。"
                            color="bg-rose-50"
                        />

                        {/* 2. ペット掲示板 */}
                        <FeatureBlock
                            icon={<RiFileList3Fill className="text-teal-500" />}
                            title="ペット掲示板"
                            badge="ADOPTION"
                            description="那須エリアの里親募集や迷子情報。地域のみんなで大切な家族を守る、温かいコミュニティです。"
                            color="bg-teal-50"
                        />

                        {/* 3. フリマ */}
                        <FeatureBlock
                            icon={<RiServiceFill className="text-pink-400" />}
                            title="Nasuフリマ"
                            badge="MARKET"
                            description="「子供用自転車、3,000円で譲ります」など、顔が見えるご近所さん同士だからこその安心取引。"
                            color="bg-pink-50"
                        />

                        {/* 4. シェア */}
                        <FeatureBlock
                            icon={<RiServiceFill className="text-blue-500" />}
                            title="使ってない貸します"
                            badge="SHARE"
                            description="ケルヒャーやBBQセットなど、たまにしか使わないものを地域でシェア。賢く節約、賢く暮らし。"
                            color="bg-blue-50"
                        />

                        {/* 5. おすそわけ畑 */}
                        <FeatureBlock
                            icon={<RiPlantFill className="text-emerald-500" />}
                            title="おすそわけ畑"
                            badge="FREE"
                            description="「規格外トマト、箱ごと持っていって！」農家さんからの太っ腹なプレゼントが、あなたの日常を豊かにします。"
                            color="bg-emerald-50"
                        />

                        {/* 6. ちょい手伝い */}
                        <FeatureBlock
                            icon={<RiHandHeartFill className="text-indigo-500" />}
                            title="ちょい手伝い"
                            badge="HELP"
                            description="「電球交換してほしい」「重い荷物を運びたい」そんな小さな困りごとを、ご近所パワーで解決。"
                            color="bg-indigo-50"
                        />
                    </div>
                </section>


                {/* --- Benefit ChecklistSection --- */}
                <section className="px-6 py-12 bg-[#F3F0EC]/30 rounded-[3rem] mx-4 border border-[#E8E2D9]">
                    <h3 className="text-xl font-black italic text-center mb-8">
                        有料会員（月額480円）でできること
                    </h3>

                    <div className="space-y-4">
                        <CheckItem label="Nasuフリマ" icon={<RiServiceFill className="text-pink-400" />} />
                        <CheckItem label="おすそわけ畑" icon={<RiPlantFill className="text-emerald-500" />} />
                        <CheckItem label="爆安セール速報" icon={<RiFlashlightFill className="text-rose-500" />} />
                        <CheckItem label="近所で助け合い" icon={<RiHandHeartFill className="text-indigo-500" />} />
                        <CheckItem label="ペット掲示板" icon={<RiFileList3Fill className="text-teal-500" />} />
                        <CheckItem label="紹介報酬制度の利用" icon={<RiHandCoinFill className="text-pink-500" />} />
                        <CheckItem label="その他" icon={<RiHandCoinFill className="text-pink-500" />} />

                    </div>

                    <div className="mt-12 pt-8 border-t border-[#E8E2D9] space-y-4">
                        <h4 className="font-black text-sm italic flex items-center gap-2">
                            紹介報酬について
                        </h4>
                        <p className="text-[11px] font-bold text-[#8C8479] leading-relaxed">
                            マイページに表示される専用QRコード・専用URLからご紹介いただいた場合、有料課金が確認でき次第、20%を銀行振込でお支払いします。
                        </p>
                        <div className="bg-white/50 p-4 rounded-xl text-[10px] font-black text-[#A89F94]">
                            月末締め／翌月15日振込<br />
                            3,000円以上から振込対応
                        </div>
                    </div>
                </section>

                {/* --- Sticky CTA --- */}
                <div className="fixed bottom-0 left-0 right-0 p-6 bg-white/80 backdrop-blur-xl border-t border-[#E8E2D9] z-[60]">
                    <div className="max-w-xl mx-auto">
                        <button
                            onClick={handleSubscribe}
                            disabled={loading}
                            className="w-full py-5 bg-pink-500 text-white rounded-full font-black text-lg shadow-xl shadow-pink-100 flex items-center justify-center gap-3 active:scale-[0.98] transition-all disabled:opacity-50"
                        >
                            {loading ? '処理中...' : '今すぐ参加する'}
                            {!loading && <RiArrowRightLine size={24} />}
                        </button>
                    </div>
                </div>
            </main>
        </div>
    );
};

const ExampleCard = ({ title, tag, description }: { title: string, tag: string, description: string }) => (
    <div className="bg-white p-6 rounded-[2rem] border border-[#E8E2D9] shadow-sm flex items-start gap-4">
        <div className="flex-1 space-y-1">
            <h4 className="text-sm font-black text-gray-800 italic">例えば…</h4>
            <p className="text-sm font-black">{title} → <span className="text-pink-500 underline decoration-pink-100">{tag}</span></p>
            <p className="text-xs font-bold text-[#8C8479]">→ {description}</p>
        </div>
    </div>
);

const CheckItem = ({ label, icon }: { label: string, icon: React.ReactNode }) => (
    <div className="flex items-center gap-4 p-4 bg-white rounded-2xl shadow-sm border border-[#E8E2D9]">
        <div className="w-10 h-10 bg-[#FDFCFD] rounded-xl flex items-center justify-center">
            {icon}
        </div>
        <span className="text-sm font-black">{label}</span>
        <RiCheckboxCircleFill className="ml-auto text-emerald-500" size={20} />
    </div>
);

const FeatureBlock = ({ icon, title, badge, description, color }: { icon: React.ReactNode, title: string, badge: string, description: string, color: string }) => (
    <div className="flex gap-6 items-start">
        <div className={`w-14 h-14 ${color} rounded-2xl shrink-0 flex items-center justify-center shadow-inner`}>
            {React.cloneElement(icon as React.ReactElement, { size: 28 })}
        </div>
        <div className="space-y-2">
            <div className="flex items-center gap-3">
                <h3 className="text-lg font-black">{title}</h3>
                <span className="text-[9px] font-black px-2 py-0.5 rounded bg-gray-100 text-gray-400 tracking-widest">{badge}</span>
            </div>
            <p className="text-sm font-bold text-[#8C8479] leading-relaxed">
                {description}
            </p>
        </div>
    </div>
);


export const getServerSideProps: GetServerSideProps = async (context) => {
    try {
        const cookies = nookies.get(context);
        const session = cookies.session || '';

        // 未ログインの場合もLPは見せるため、uidをnullで渡す
        if (!session) return { props: { uid: null } };

        const token = await adminAuth.verifySessionCookie(session, true);
        const userDoc = await adminDb.collection('users').doc(token.uid).get();
        const userData = userDoc.data() || {};

        const isPaid = userData.isPaid === true || userData.subscriptionStatus === 'active';

        return {
            props: {
                uid: token.uid
            }
        };

    } catch (err) {
        return { props: { uid: null } };
    }
};

export default PremiumLandingPage;
