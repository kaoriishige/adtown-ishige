import React, { useState, useEffect, useRef, useMemo } from 'react';
import Head from 'next/head';
import Image from 'next/image';
import Link from 'next/link';
import { getAuth, createUserWithEmailAndPassword, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { app, db } from '@/lib/firebase';


/**
 * ==============================================================================
 * 【みんなのNasuアプリ】有料パートナーLP 400行超・完全版
 * 導線：登録(本ページ) → 決済(subscribe_plan) → ログイン → ダッシュボード
 * 構成：悩み → 解決策 → 本質的ベネフィット → 収益未来 → 登録
 * ==============================================================================
 */

// --- コンポーネント: 悩みカード ---
const TroubleCard = ({ title, desc, cause }: { title: string, desc: string[], cause: string }) => (
    <div className="bg-white/5 rounded-[2.5rem] p-10 border border-white/10 hover:border-orange-500/50 transition-all group shadow-2xl">
        <div className="flex items-center space-x-4 mb-6">
            <div className="w-14 h-14 bg-red-500/20 rounded-full flex items-center justify-center text-red-500 font-bold text-3xl group-hover:scale-110 transition-transform">!</div>
            <h4 className="text-2xl font-black text-white">{title}</h4>
        </div>
        <ul className="space-y-4 mb-8">
            {desc.map((d, i) => (
                <li key={i} className="text-slate-400 flex items-start text-lg">
                    <span className="mr-2 text-red-500">•</span>{d}
                </li>
            ))}
        </ul>
        <div className="bg-red-500/10 p-6 rounded-2xl border-l-4 border-red-500">
            <p className="text-sm font-bold text-red-400 uppercase tracking-widest mb-2 font-sans">👉 根本原因</p>
            <p className="text-xl font-bold text-white leading-relaxed">{cause}</p>
        </div>
    </div>
);

// --- コンポーネント: 収益カード ---
const RevenueCard = ({ label, target, price, colorClass }: { label: string, target: string, price: string, colorClass: string }) => (
    <div className={`bg-white rounded-[3.5rem] p-12 shadow-2xl border border-slate-100 relative overflow-hidden group`}>
        <div className={`absolute top-0 right-0 p-6 ${colorClass} text-white font-black rounded-bl-3xl italic text-xl`}>{label}</div>
        <h3 className="text-3xl font-black mb-8 text-slate-900 font-sans">毎月の広告費を実質無料に</h3>
        <p className="text-slate-500 text-lg mb-10 leading-relaxed font-bold">
            テーブルにアプリのQRコードを置くだけ。来店客が登録し有料課金することで継続的な報酬が発生。店舗の広告費を「利益」で相殺する新しいモデルです。
        </p>
        <div className="space-y-6">
            <div className="flex justify-between border-b border-slate-100 pb-4">
                <span className="text-slate-400 font-bold text-xl">有料紹介登録者数</span>
                <span className="text-2xl font-black text-slate-900">{target}</span>
            </div>
            <div className="flex flex-col pt-4">
                <p className="text-orange-600 font-black text-sm uppercase mb-2 tracking-widest">毎月の継続予想収入</p>
                <div className="flex flex-wrap items-baseline gap-2">
                    <span className="text-5xl font-black text-slate-900 tracking-tighter">{price}</span>
                    <span className="text-slate-500 font-bold text-lg">（広告費3,850円実質無料）</span>
                </div>
            </div>
        </div>
    </div>
);

export default function PartnerSignupLP() {
    const auth = getAuth(app);
    const formRef = useRef<HTMLDivElement>(null);
    const [formData, setFormData] = useState({
        storeName: '', contactPerson: '', address: '', phoneNumber: '', email: '', confirmEmail: '', password: '', agree: false
    });
    const [loading, setLoading] = useState(false);
    const [showTerms, setShowTerms] = useState(false);
    const [isLoggedIn, setIsLoggedIn] = useState(false); // ログイン状態管理

    // 認証ガードをバイパスするための処理
    useEffect(() => {
        if (typeof window !== 'undefined') {
            (window as any).__IS_PUBLIC_PAGE__ = true;
        }
    }, []);

    // 既存ユーザー情報の自動入力
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                setIsLoggedIn(true);
                try {
                    const userDocRef = doc(db, 'users', user.uid);
                    const userDoc = await getDoc(userDocRef);
                    if (userDoc.exists()) {
                        const data = userDoc.data();
                        setFormData(prev => ({
                            ...prev,
                            email: user.email || '',
                            confirmEmail: user.email || '',
                            storeName: data.companyName || data.storeName || '',
                            contactPerson: data.contactPerson || '', // 求人側にはないかもしれないが念のため
                            address: data.address || '',
                            phoneNumber: data.phoneNumber || '',
                            // パスワードは入力不要にするため空のまま
                        }));
                    }
                } catch (error) {
                    console.error("ユーザー情報の取得に失敗しました:", error);
                }
            } else {
                setIsLoggedIn(false);
            }
        });
        return () => unsubscribe();
    }, [auth]);

    const partners = [
        { name: 'adtown', path: '/images/partner-adtown.png' }, { name: 'aquas', path: '/images/partner-aquas.png' },
        { name: 'celsiall', path: '/images/partner-celsiall.png' }, { name: 'dairin', path: '/images/partner-dairin.png' },
        { name: 'kanon', path: '/images/partner-kanon.png' }, { name: 'kokoro', path: '/images/partner-kokoro.png' },
        { name: 'meithu', path: '/images/partner-meithu.png' }, { name: 'midcityhotel', path: '/images/partner-midcityhotel.png' },
        { name: 'omakaseauto', path: '/images/partner-omakaseauto.png' }, { name: 'poppo', path: '/images/partner-poppo.png' },
        { name: 'sekiguchi02', path: '/images/partner-sekiguchi02.png' }, { name: 'training_farm', path: '/images/partner-training_farm.png' },
        { name: 'transunet', path: '/images/partner-transunet.png' }, { name: 'koharu', path: '/images/partner-koharu.png' },
        { name: 'yamakiya', path: '/images/partner-yamakiya.png' }
    ];

    // 修正箇所：Firebase Auth作成 → プロフィール保存 → プラン選択画面へリダイレクト
    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.agree) return alert("利用規約に同意してください");
        if (formData.email !== formData.confirmEmail) return alert("メールアドレスが一致しません。確認のため、もう一度入力してください。");
        // ログインしていない場合のみパスワードチェック
        if (!isLoggedIn && !formData.password) return alert("パスワードを入力してください");

        setLoading(true);

        try {
            let uid = '';

            if (isLoggedIn && auth.currentUser) {
                // 既存ユーザーを使用
                uid = auth.currentUser.uid;
            } else {
                // 1. Firebase Auth ユーザー作成
                const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
                uid = userCredential.user.uid;
            }

            // 2. Firestoreへ詳細情報を保存 (merge: true で既存データを保持しつつ更新)
            const regResponse = await fetch('/api/auth/register-partner', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    uid: uid,
                    storeName: formData.storeName,
                    contactPerson: formData.contactPerson,
                    address: formData.address,
                    phoneNumber: formData.phoneNumber,
                    email: formData.email,
                    serviceType: 'adver'
                }),
            });
            if (!regResponse.ok) throw new Error('プロフィールの保存に失敗しました');

            // 3. 【はっきり修正】決済ページ（subscribe_plan）へリダイレクト
            // 直接Stripe APIを叩くのではなく、ユーザーにプランを選ばせる画面へ飛ばします
            window.location.href = '/partner/subscribe_plan';

        } catch (err: any) {
            console.error('Error:', err);
            // エラーメッセージの改善
            if (err.code === 'auth/email-already-in-use') {
                alert("このメールアドレスは既に登録されています。ログインしてから申し込んでください。");
            } else {
                alert(err.message || "エラーが発生しました");
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white text-slate-900 font-sans selection:bg-orange-100 overflow-x-hidden">
            <Head>
                <title>有料パートナー募集 | みんなのNasuアプリ - 株式会社adtown 20周年事業</title>
            </Head>

            {/* 固定ヘッダー */}
            <div className="bg-slate-900 text-white py-4 text-center text-sm font-bold tracking-[0.3em] uppercase sticky top-0 z-[100] shadow-2xl">
                株式会社adtown 20周年記念アプリ事業
            </div>

            {/* ① ファーストビュー */}
            <section className="relative min-h-[80vh] flex items-center bg-white overflow-hidden border-b border-slate-100">
                <div className="max-w-7xl mx-auto px-6 py-20 text-center relative z-10">
                    <div className="inline-flex items-center space-x-2 bg-orange-50 px-8 py-3 rounded-full mb-12 border border-orange-200">
                        <span className="text-orange-700 font-black text-sm tracking-widest uppercase italic">那須エリア・地域密着型パートナー募集</span>
                    </div>
                    <h1 className="text-6xl lg:text-[10rem] font-black leading-[0.9] mb-12 tracking-tighter italic">
                        もう集客で<br />
                        <span className="text-orange-600 font-sans">悩まない。</span>
                    </h1>
                    <p className="text-2xl lg:text-5xl text-slate-600 mb-20 font-black max-w-5xl mx-auto leading-tight tracking-tight">
                        AI×自動化で、毎月安定して<br className="md:hidden" />
                        新規のお客様が来店する仕組みをあなたに。
                    </p>
                    <div className="flex flex-col items-center gap-8">
                        <button
                            onClick={() => formRef.current?.scrollIntoView({ behavior: 'smooth' })}
                            className="bg-orange-600 text-white text-3xl font-black px-24 py-12 rounded-[4rem] shadow-[0_20px_50px_rgba(234,88,12,0.3)] hover:scale-105 transition transform active:scale-95"
                        >
                            今すぐ詳細・申し込み
                        </button>
                    </div>
                </div>
            </section>

            {/* ② 共感パート */}
            <section className="py-32 bg-slate-900 text-white px-6 relative overflow-hidden">
                <div className="max-w-6xl mx-auto relative z-10">
                    <div className="text-center mb-24">
                        <h2 className="text-4xl lg:text-7xl font-black mb-8 italic tracking-tighter">集客での店舗オーナーの悩み【5選】</h2>
                    </div>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-10">
                        <TroubleCard title="① 新規客が安定しない" desc={["繁忙期と閑散期の差が激しい", "天気・曜日・イベントに左右される", "「今月どうなるか分からない」不安が常にある"]} cause="偶発的な集客（紹介・通りがかり・SNSバズ）に依存している" />
                        <TroubleCard title="② 広告を出しても利益が残らない" desc={["広告費をかけても単価が低い", "クーポン客ばかりでリピートしない", "売上は増えても手元にお金が残らない"]} cause="「集める」だけで「育てる・定着させる」設計がない" />
                        <TroubleCard title="③ SNS・口コミを頑張っても反応がない" desc={["毎日投稿しているのに来店につながらない", "何を投稿すればいいか分からない", "フォロワーは増えても売上は増えない"]} cause="SNSが「集客の入口」になっていない" />
                        <TroubleCard title="④ リピート客が増えない" desc={["新規ばかり追いかけて疲弊", "一度来たきりで終わる", "常連客が育たない"]} cause="来店後のフォロー（LINE・接点・体験設計）が弱い" />
                        <TroubleCard title="⑤ 集客がオーナー依存になっている" desc={["自分が動かないと止まる", "休めない・任せられない", "店舗展開や人材育成に進めない"]} cause="「仕組み」ではなく「人（自分）」が回している" />

                        <div className="bg-gradient-to-br from-orange-600 to-orange-500 rounded-[2.5rem] p-12 flex flex-col justify-center text-center shadow-3xl">
                            <h4 className="text-3xl font-black mb-8 uppercase italic leading-none text-white">店舗オーナーの<br />“本音”</h4>
                            <div className="space-y-6 text-2xl font-bold">
                                <p>「集客は苦手だけど本業はプロ」</p>
                                <p>「マーケティングを学ぶ時間がない」</p>
                                <p className="text-yellow-300 underline decoration-4 underline-offset-8">「正直、考えずに回る仕組みがほしい」</p>
                            </div>
                        </div>
                    </div>
                    <div className="mt-24 text-center max-w-4xl mx-auto">
                        <p className="text-3xl font-black text-orange-400 mb-12 animate-pulse italic">「YES」が一つでもあれば、この先を読んでください。</p>
                        <div className="bg-white/10 p-12 rounded-[4rem] border-2 border-orange-500">
                            <p className="text-3xl font-black text-white leading-relaxed">集客が不安定なのは、あなたの努力不足ではありません。<br />仕組みがないだけです。</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* ③ AIソリューション（解決策） */}
            <section className="py-32 px-6 bg-white overflow-hidden border-b border-slate-100">
                <div className="max-w-6xl mx-auto text-center">
                    <h2 className="text-5xl lg:text-7xl font-black mb-20 text-orange-600 italic tracking-tighter">AIが「来店誘導」と「LINE登録誘導」を自動化</h2>
                    <div className="grid md:grid-cols-3 gap-12 text-left">
                        <div className="bg-slate-50 p-12 rounded-[3.5rem] border-b-8 border-orange-500 shadow-xl">
                            <div className="text-5xl mb-6">🎯</div>
                            <h4 className="text-2xl font-black mb-6">AIが那須地域のユーザーを精密選別</h4>
                            <p className="text-slate-600 leading-relaxed font-bold text-xl italic">那須地域のユーザーから、貴店に興味を持つ可能性が高い層を自動で選別します。</p>
                        </div>
                        <div className="bg-slate-50 p-12 rounded-[3.5rem] border-b-8 border-orange-500 shadow-xl">
                            <div className="text-5xl mb-6">🤖</div>
                            <h4 className="text-2xl font-black mb-6">クーポン告知と誘導の自動化</h4>
                            <p className="text-slate-600 leading-relaxed font-bold text-xl italic">「クーポン告知」「来店誘導」「LINE登録誘導」をAIが最適なタイミングで自動実行します。</p>
                        </div>
                        <div className="bg-slate-50 p-12 rounded-[3.5rem] border-b-8 border-orange-500 shadow-xl">
                            <div className="text-5xl mb-6">🔄</div>
                            <h4 className="text-2xl font-black mb-6">AIが自動で蓄積・リピート</h4>
                            <p className="text-slate-600 leading-relaxed font-bold text-xl italic">一度接点を持ったお客様を忘れさせません。再来店のきっかけをAIが自動で作り続けます。</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* ④ 大家族コミュニティ・背景 */}
            <section className="py-32 px-6 bg-slate-900 text-white relative">
                <div className="max-w-5xl mx-auto text-center">
                    <p className="text-3xl lg:text-5xl font-black leading-tight mb-20 tracking-tighter">
                        那須地域限定の『みんなのNasuアプリ』は、住民にとって<span className="text-orange-500">「ないと損」</span>な存在です。
                    </p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-12 mb-20 font-black">
                        <div><div className="text-5xl text-orange-500 mb-2">1,000人</div><p className="text-sm opacity-60">先行登録者数</p></div>
                        <div><div className="text-5xl text-orange-500 mb-2">100,000人</div><p className="text-sm opacity-60">地域インフルエンサーが拡散</p></div>
                        <div><div className="text-5xl text-orange-500 mb-2">30,000人</div><p className="text-sm opacity-60">成長するコミュニティ</p></div>
                        <div><div className="text-5xl text-orange-500 mb-2">出し放題</div><p className="text-sm opacity-60">アプリ内広告</p></div>
                    </div>
                    <div className="bg-white/5 p-16 rounded-[4rem] border border-white/10 shadow-3xl">
                        <p className="text-2xl lg:text-3xl font-bold leading-relaxed italic">貴店の広告やクーポンを、アプリ広告出し放題で、爆発的に増え続ける「貴店へのお客様候補」に直接届けることができます。</p>
                    </div>
                </div>
            </section>

            {/* ⑤ 「みんなのNasuアプリ」とは */}
            <section className="py-32 px-6 bg-white border-t border-slate-100">
                <div className="max-w-5xl mx-auto">
                    <h2 className="text-5xl font-black mb-16 text-center italic tracking-tighter">「みんなのNasuアプリ」とは</h2>
                    <div className="bg-slate-50 p-16 rounded-[4rem] border border-slate-200 mb-16 shadow-inner">
                        <p className="text-2xl leading-relaxed mb-12 font-black text-slate-800 italic">那須塩原市、大田原市、那須町の住民に向けた、地域限定の生活インフラアプリです。</p>
                        <div className="grid md:grid-cols-2 gap-8 text-xl font-bold">
                            {["スーパー特売チラシ＋AIレシピ", "ドラッグストア価格比較", "ガソリン価格最安値情報", "知っ得！生活の裏技AI", "地域防災情報ナビ", "休日当番医情報", "地域イベント速報", "限定クーポン掲示板"].map((item, i) => (
                                <div key={i} className="flex items-center space-x-4 bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100">
                                    <span className="text-orange-500 text-3xl">✓</span><span>{item}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="text-center font-bold">
                        <a href="https://minna-no-nasu-app.netlify.app/" target="_blank" rel="noopener noreferrer" className="inline-block bg-orange-600 text-white text-2xl py-8 px-16 rounded-[2.5rem] shadow-2xl hover:bg-orange-700 transition-all transform hover:-translate-y-1">
                            アプリを実際に無料登録してみる
                        </a>
                    </div>
                </div>
            </section>

            {/* ⑥ 【重要】導入後の本質的ベネフィット */}
            <section className="py-40 px-6 bg-slate-50 relative overflow-hidden">
                <div className="max-w-6xl mx-auto relative z-10">
                    <div className="text-center mb-24">
                        <h2 className="text-6xl lg:text-8xl font-black mb-8 italic tracking-tighter">導入後の新しい未来</h2>
                        <p className="text-2xl text-slate-500 font-bold uppercase tracking-[0.3em]">Fundamental Benefit</p>
                    </div>

                    <div className="grid lg:grid-cols-3 gap-12">
                        <div className="bg-white p-16 rounded-[4rem] shadow-xl border border-slate-100 relative group overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/5 rounded-bl-[100%] transition-all group-hover:scale-150"></div>
                            <h4 className="text-3xl font-black mb-8 text-orange-600 italic">1. 思考からの解放</h4>
                            <p className="text-slate-600 text-xl font-bold leading-relaxed italic mb-8">
                                「今日は何を投稿しよう」「どうやって新規を呼ぼう」と悩む時間はもう終わりです。
                            </p>
                            <div className="bg-slate-900 text-white p-6 rounded-2xl font-black text-lg">
                                👉 AIが24時間、自動で集客戦略を回し続けます。
                            </div>
                        </div>

                        <div className="bg-white p-16 rounded-[4rem] shadow-xl border border-slate-100 relative group overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/5 rounded-bl-[100%] transition-all group-hover:scale-150"></div>
                            <h4 className="text-3xl font-black mb-8 text-orange-600 italic">2. 広告費の「投資」化</h4>
                            <p className="text-slate-600 text-xl font-bold leading-relaxed italic mb-8">
                                消えていく掲載費ではなく、紹介報酬によって「利益」を生み出す仕組みへ転換します。
                            </p>
                            <div className="bg-slate-900 text-white p-6 rounded-2xl font-black text-lg">
                                👉 広告を出すほど、お店の手残りが増える新常識。
                            </div>
                        </div>

                        <div className="bg-white p-16 rounded-[4rem] shadow-xl border border-slate-100 relative group overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/5 rounded-bl-[100%] transition-all group-hover:scale-150"></div>
                            <h4 className="text-3xl font-black mb-8 text-orange-600 italic">3. 接客と経営への専念</h4>
                            <p className="text-slate-600 text-xl font-bold leading-relaxed italic mb-8">
                                集客をAIに任せることで、あなたは本来の仕事である「お客様への最高のもてなし」に集中できます。
                            </p>
                            <div className="bg-slate-900 text-white p-6 rounded-2xl font-black text-lg">
                                👉 現場の熱量が上がり、さらなるリピートを生む。
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ⑦ 収益シミュレーション */}
            <section className="py-32 px-6 bg-white">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-24">
                        <h2 className="text-5xl font-black mb-6 tracking-tight italic">収益イメージ</h2>
                        <p className="text-2xl text-slate-500 font-bold">集客をしながら、広告費を「紹介利益」で相殺する。</p>
                    </div>
                    <div className="grid lg:grid-cols-2 gap-12 mb-20">
                        <RevenueCard label="飲食店モデル" target="100名有料登録" price="¥14,400" colorClass="bg-orange-600" />
                        <RevenueCard label="美容室モデル" target="50名有料登録" price="¥7,200" colorClass="bg-teal-600" />
                    </div>
                    <div className="bg-slate-900 text-white p-16 rounded-[5rem] text-center shadow-3xl border-8 border-orange-600">
                        <p className="text-4xl lg:text-6xl font-black mb-8 italic tracking-tighter">還元率：アプリ有料ユーザーの <span className="text-orange-500 text-7xl lg:text-9xl">30%</span> を還元</p>
                        <p className="text-2xl text-slate-400 font-bold italic tracking-widest">※あなたが紹介したお客様が使い続ける限り、毎月発生します。</p>
                    </div>
                </div>
            </section>


            {/* ⑧ パートナーロゴ */}
            <section className="py-32 px-6 bg-white text-center">
                <div className="max-w-7xl mx-auto">
                    <p className="text-2xl font-black mb-20 text-slate-400 italic tracking-[0.5em] uppercase">下記は、広告パートナー＆求人パートナーの企業様の一部です。</p>
                    <div className="grid grid-cols-3 md:grid-cols-5 gap-16 items-center mb-24 opacity-60">
                        {partners.map((p, i) => (
                            <div key={i} className="relative h-20 w-full flex items-center justify-center hover:scale-110 transition-transform">
                                <Image src={p.path} alt={p.name} fill style={{ objectFit: 'contain' }} />
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ⑨ Q&A */}
            <section className="py-32 px-6 bg-slate-50">
                <div className="max-w-4xl mx-auto">
                    <h2 className="text-5xl font-black mb-20 text-center italic tracking-tighter">よくあるご質問 (Q&A)</h2>
                    <div className="space-y-8">
                        {[
                            { q: "本当に月額3,850円だけで良いのですか？", a: "はい。追加の広告掲載料やAI運用費は一切かかりません。先行100社様限定の特別価格です。通常価格は4,400円になります。" },
                            { q: "紹介報酬はどのように受け取れますか？", a: "貴店専用のみんなのNasuアプリQRから登録したユーザーが有料課金した場合の月額の30%を、月末締で翌月15日に登録した口座にお振り込みします。" },
                            { q: "デジタルに詳しくなくても大丈夫ですか？", a: "はい。店舗情報や写真、特典などを用意するだけで、AIが自動で告知・集客を開始します。" },
                            { q: "解約の縛りはありますか？", a: "ありません。1ヶ月単位での契約となりますので、いつでも管理画面から解約が可能です。" }
                        ].map((item, i) => (
                            <div key={i} className="bg-white p-12 rounded-[3rem] shadow-xl border border-slate-100">
                                <p className="text-orange-600 font-black mb-6 text-2xl italic tracking-tight">Q. {item.q}</p>
                                <div className="flex items-start">
                                    <span className="text-slate-300 text-3xl font-black mr-4 mt-1">A.</span>
                                    <p className="text-slate-700 font-bold leading-relaxed text-xl italic">{item.a}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ⑩ 申し込みフォーム */}
            <section ref={formRef} id="signup" className="py-40 px-6 bg-slate-900 text-white relative">
                <div className="max-w-4xl mx-auto">
                    <div className="bg-white text-slate-900 rounded-[5rem] shadow-[0_50px_100px_rgba(0,0,0,0.5)] overflow-hidden border-[15px] border-orange-600">
                        <div className="bg-orange-600 p-16 text-center text-white relative">
                            <h3 className="text-5xl font-black mb-6 italic tracking-tighter uppercase">有料パートナー申込フォーム</h3>
                            <div className="space-y-4 font-black">
                                <p className="text-2xl line-through opacity-60 italic">定価月額 4,400円</p>
                                <div className="bg-white text-orange-600 inline-block px-12 py-3 rounded-full text-3xl animate-pulse italic">先行100社限定：残38社</div>
                                <p className="text-4xl pt-6 uppercase tracking-[0.2em]">月額 ¥3,850 (税込)</p>
                            </div>
                        </div>

                        <div className="p-10 md:p-24 font-bold">
                            <form onSubmit={handleSignup} className="space-y-10">
                                <div className="space-y-2">
                                    <label className="text-sm font-black text-slate-400 uppercase tracking-widest ml-4">店舗・企業名 *</label>
                                    <input type="text" name="org" autoComplete="organization" placeholder="株式会社〇〇 / カフェ〇〇" required className="w-full p-6 md:p-8 bg-slate-50 border-2 border-slate-100 rounded-[2rem] outline-none focus:border-orange-500 text-lg md:text-xl font-bold transition-all" value={formData.storeName} onChange={e => setFormData({ ...formData, storeName: e.target.value })} />
                                </div>
                                <div className="grid md:grid-cols-2 gap-6 md:gap-10">
                                    <div className="space-y-2">
                                        <label className="text-sm font-black text-slate-400 uppercase tracking-widest ml-4">ご担当者名 *</label>
                                        <input type="text" name="name" autoComplete="name" placeholder="山田 太郎" required className="w-full p-6 md:p-8 bg-slate-50 border-2 border-slate-100 rounded-[2rem] outline-none focus:border-orange-500 text-lg md:text-xl font-bold transition-all" value={formData.contactPerson} onChange={e => setFormData({ ...formData, contactPerson: e.target.value })} />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-black text-slate-400 uppercase tracking-widest ml-4">所在地 *</label>
                                        <input type="text" name="address" autoComplete="street-address" placeholder="那須塩原市〇〇町 1-2" required className="w-full p-6 md:p-8 bg-slate-50 border-2 border-slate-100 rounded-[2rem] outline-none focus:border-orange-500 text-lg md:text-xl font-bold transition-all" value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} />
                                    </div>
                                </div>
                                <div className="grid md:grid-cols-2 gap-6 md:gap-10">
                                    <div className="space-y-2">
                                        <label className="text-sm font-black text-slate-400 uppercase tracking-widest ml-4">メールアドレス *</label>
                                        <input type="email" name="email" autoComplete="email" placeholder="mail@example.com" required className="w-full p-6 md:p-8 bg-slate-50 border-2 border-slate-100 rounded-[2rem] outline-none focus:border-orange-500 text-lg md:text-xl font-bold transition-all" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-black text-slate-400 uppercase tracking-widest ml-4">メールアドレス (確認) *</label>
                                        <input type="email" name="email_confirm" autoComplete="off" placeholder="確認のため再入力" required className="w-full p-6 md:p-8 bg-slate-50 border-2 border-slate-100 rounded-[2rem] outline-none focus:border-orange-500 text-lg md:text-xl font-bold transition-all" value={formData.confirmEmail} onChange={e => setFormData({ ...formData, confirmEmail: e.target.value })} />
                                    </div>
                                </div>
                                <div className="grid md:grid-cols-2 gap-6 md:gap-10">
                                    <div className="space-y-2">
                                        <label className="text-sm font-black text-slate-400 uppercase tracking-widest ml-4">電話番号 *</label>
                                        <input type="tel" name="tel" autoComplete="tel" placeholder="0287-XX-XXXX" required className="w-full p-6 md:p-8 bg-slate-50 border-2 border-slate-100 rounded-[2rem] outline-none focus:border-orange-500 text-lg md:text-xl font-bold transition-all" value={formData.phoneNumber} onChange={e => setFormData({ ...formData, phoneNumber: e.target.value })} />
                                    </div>
                                    {!isLoggedIn && (
                                        <div className="space-y-2">
                                            <label className="text-sm font-black text-slate-400 uppercase tracking-widest ml-4">パスワード（管理画面用） *</label>
                                            <input type="password" name="password" autoComplete="new-password" placeholder="8文字以上" required={!isLoggedIn} minLength={8} className="w-full p-6 md:p-8 bg-slate-50 border-2 border-slate-100 rounded-[2rem] outline-none focus:border-orange-500 text-lg md:text-xl font-bold transition-all" value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} />
                                        </div>
                                    )}
                                </div>

                                <div className="p-12 bg-orange-50 rounded-[4rem] border-2 border-orange-100">
                                    <p className="text-slate-700 mb-8 italic leading-relaxed text-xl">
                                        登録完了後、プラン選択ページへ遷移します。クレジットカードまたは請求書払いをご選択いただけます。
                                    </p>
                                    <label className="flex items-center space-x-6 cursor-pointer group">
                                        <input type="checkbox" className="w-10 h-10 text-orange-600 rounded-xl border-orange-200 focus:ring-orange-500 cursor-pointer" checked={formData.agree} onChange={e => setFormData({ ...formData, agree: e.target.checked })} />
                                        <span className="text-2xl font-black text-slate-800 underline underline-offset-8 decoration-4 group-hover:text-orange-600" onClick={(e) => { e.preventDefault(); setShowTerms(true); }}>利用規約および紹介報酬制度に同意する</span>
                                    </label>
                                </div>

                                <button type="submit" disabled={loading} className="w-full py-16 bg-orange-600 hover:bg-orange-700 text-white text-5xl font-black rounded-[5rem] shadow-3xl transition transform active:scale-95 italic tracking-tighter">
                                    {loading ? '処理中...' : '有料パートナーに申し込む'}
                                </button>
                            </form>

                            <div className="mt-20 text-center font-black">
                                <p className="text-2xl mb-10 text-slate-400">操作方法や機能についてのご相談は公式LINEまで</p>
                                <a href="https://lin.ee/fVdSFh1" target="_blank" rel="noopener noreferrer" className="inline-block hover:scale-110 transition-transform">
                                    <img src="https://scdn.line-apps.com/n/line_add_friends/btn/ja.png" alt="LINE友だち追加" height="60" className="h-16" />
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ⑪ 利用規約モーダル */}
            {showTerms && (
                <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6 bg-slate-950/95 backdrop-blur-xl">
                    <div className="bg-white rounded-[5rem] max-w-3xl w-full max-h-[85vh] flex flex-col shadow-3xl border-8 border-slate-100 overflow-hidden">
                        <div className="p-12 border-b bg-slate-50 flex justify-between items-center">
                            <h3 className="text-4xl font-black italic tracking-tighter">パートナーシップ利用規約</h3>
                            <button onClick={() => setShowTerms(false)} className="text-6xl text-slate-300 hover:text-slate-900 transition-colors">&times;</button>
                        </div>
                        <div className="p-16 overflow-y-auto space-y-12 text-slate-600 font-bold leading-relaxed text-xl">
                            <section className="space-y-4">
                                <h4 className="text-slate-900 font-black text-2xl border-l-8 border-orange-500 pl-4 uppercase">第1条（目的）</h4>
                                <p>AIを活用した集客および地域経済活性化を目的とし、当社はパートナーに対しプラットフォームを提供します。</p>
                            </section>
                            <section className="space-y-4">
                                <h4 className="text-slate-900 font-black text-2xl border-l-8 border-orange-500 pl-4 uppercase">第2条（利用料金）</h4>
                                <p>月額3,850円(税込)。初回決済日を基準とし、1ヶ月毎に自動更新されます。解約は次回更新の24時間前まで可能です。</p>
                            </section>
                            <section className="space-y-4 bg-orange-50 p-8 rounded-3xl">
                                <h4 className="text-slate-900 font-black text-2xl border-l-8 border-orange-600 pl-4 uppercase italic">第3条（紹介報酬）</h4>
                                <p>パートナー経由の有料ユーザー売上（税抜）の30%を報酬として支払います。毎月末締め翌月15日銀行振込。振込手数料はパートナー負担。</p>
                            </section>
                            <section className="space-y-4">
                                <h4 className="text-slate-900 font-black text-2xl border-l-8 border-orange-500 pl-4 uppercase">第4条（禁止事項）</h4>
                                <p>公序良俗に反する宣伝、過度な勧誘行為、虚偽情報の登録を禁止します。</p>
                            </section>
                            <section className="space-y-4">
                                <h4 className="text-slate-900 font-black text-2xl border-l-8 border-orange-500 pl-4 uppercase">第5条（データの利用）</h4>
                                <p>AI集客の精度向上のため、店舗情報および閲覧ログを統計的に利用することに同意するものとします。</p>
                            </section>
                        </div>
                        <div className="p-12 border-t bg-slate-50 text-center">
                            <button onClick={() => setShowTerms(false)} className="bg-slate-900 text-white px-24 py-6 rounded-[3rem] font-black text-3xl hover:bg-orange-600 transition-all shadow-xl italic tracking-tighter">全ての内容に同意しました</button>
                        </div>
                    </div>
                </div>
            )}

            {/* ⑫ フッター */}
            <footer className="bg-slate-950 py-32 px-6 text-center text-slate-500 font-bold border-t border-white/5">
                <div className="max-w-4xl mx-auto space-y-12">
                    <div className="flex flex-col md:flex-row justify-center items-center gap-12 text-slate-400 text-lg italic">
                        <Link href="/company" className="hover:text-white transition-colors">運営会社</Link>
                        <Link href="/privacy" className="hover:text-white transition-colors">プライバシーポリシー</Link>
                        <Link href="/terms" className="hover:text-white transition-colors">特定商取引法に基づく表記</Link>
                    </div>
                    <div className="space-y-4">
                        <p className="text-sm tracking-[0.6em] uppercase opacity-40 italic font-black">Next Generation Local AI System by adtown</p>
                        <p className="text-2xl font-black text-white italic tracking-tighter uppercase">みんなのNasuアプリ <span className="text-orange-600">Partner Program</span></p>
                    </div>
                    <p className="text-xs opacity-30 leading-loose max-w-3xl mx-auto italic font-medium">
                        本アプリは株式会社adtownの20周年記念事業として開発・提供されています。那須エリアの持続可能な発展を目指し、AIと地域住民が共生する新しいマーケティングモデルを提案します。
                    </p>
                    <p className="text-sm tracking-[0.2em] pt-12">© 2026 株式会社adtown. All Rights Reserved.</p>
                </div>
            </footer>
        </div>
    );
}



