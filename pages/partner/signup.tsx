import React, { useEffect, useRef, useState } from 'react';
import Head from 'next/head';
import Image from 'next/image';
import Link from 'next/link';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { app } from '@/lib/firebase';
import { useAffiliateTracker } from '@/lib/affiliate-tracker';


/**
 * ==============================================================================
 * 【みんなのNasuアプリ】広告パートナーLP 完全版（信用先出し / CVR強化 / ワンプラン）
 * 事業：株式会社adtown 創業20周年記念事業
 * 内容：那須地域限定アプリを開発。地元ユーザー×店舗をAIで集客マッチング
 * 価格：通常 8,800円 → 先行100社 5,500円（税込）※申込順 / ワンプラン
 * 紹介報酬：有料ユーザー紹介で継続売上の30%を毎月還元
 * 導線：LP閲覧 -> 信用 -> 共感 -> 仕組み(AIマッチング) -> 価格/限定 -> FAQ -> 登録(Auth) -> 決済
 * ==============================================================================
 */


// --- UI部品 ---
const Pill = ({ children }: { children: React.ReactNode }) => (
  <span className="inline-flex items-center px-6 py-3 rounded-full bg-white/10 border border-white/15 text-white font-black text-xs md:text-sm tracking-[0.22em] uppercase">
    {children}
  </span>
);


const FeatureCard = ({ icon, title, desc }: { icon: string; title: string; desc: string }) => (
  <div className="bg-white rounded-[2.5rem] p-10 md:p-12 shadow-2xl border border-slate-100 hover:-translate-y-2 transition-all duration-500">
    <div className="text-6xl mb-6">{icon}</div>
    <h3 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">{title}</h3>
    <p className="mt-5 text-slate-600 font-bold leading-relaxed text-lg italic">{desc}</p>
  </div>
);


const TroubleCard = ({ title, points, cause }: { title: string; points: string[]; cause: string }) => (
  <div className="bg-white/5 rounded-[2.5rem] p-10 border border-white/10 hover:border-orange-500/50 transition-all group shadow-2xl">
    <div className="flex items-center space-x-4 mb-6">
      <div className="w-14 h-14 bg-red-500/20 rounded-full flex items-center justify-center text-red-400 font-black text-3xl group-hover:scale-110 transition-transform italic">
        !
      </div>
      <h4 className="text-2xl font-black text-white">{title}</h4>
    </div>
    <ul className="space-y-4 mb-8">
      {points.map((d, i) => (
        <li key={i} className="text-slate-300 flex items-start text-lg font-bold leading-relaxed">
          <span className="mr-2 text-red-400 font-black">•</span>
          {d}
        </li>
      ))}
    </ul>
    <div className="bg-red-500/10 p-6 rounded-2xl border-l-4 border-red-500 transform group-hover:translate-x-2 transition-transform">
      <p className="text-sm font-black text-red-300 uppercase tracking-widest mb-2">👉 根本原因</p>
      <p className="text-xl font-black text-white leading-relaxed italic">{cause}</p>
    </div>
  </div>
);


const Faq = ({ q, a }: { q: string; a: string }) => (
  <div className="bg-white rounded-3xl border border-slate-100 p-8 shadow-lg">
    <p className="font-black text-slate-900 text-lg">Q. {q}</p>
    <p className="mt-3 text-slate-600 font-bold leading-relaxed">A. {a}</p>
  </div>
);


export default function PartnerSignupLP() {
  const auth = getAuth(app);
  const formRef = useRef<HTMLDivElement>(null);


  const [formData, setFormData] = useState({
    storeName: '',
    contactPerson: '',
    address: '',
    phoneNumber: '',
    email: '',
    confirmEmail: '',
    password: '',
    agree: false,
  });


  const [loading, setLoading] = useState(false);
  const [showTerms, setShowTerms] = useState(false);


  // アフィリエイトトラッキング（?ref=xxx を取得）
  useAffiliateTracker('adver');


  // 公開ページ設定
  useEffect(() => {
    if (typeof window !== 'undefined') (window as any).__IS_PUBLIC_PAGE__ = true;
  }, []);


  // 価格・限定（ワンプラン）
  const PRICE = {
    regular: 8800,
    campaign: 5500,
    taxLabel: '税込',
    limitCompanies: 100,
    remaining: 38, // 固定値（必要ならAPI連携）
  };


  // 実績ロゴ（既存のまま）
  const partners = [
    { name: 'adtown', path: '/images/partner-adtown.png' },
    { name: 'aquas', path: '/images/partner-aquas.png' },
    { name: 'celsiall', path: '/images/partner-celsiall.png' },
    { name: 'dairin', path: '/images/partner-dairin.png' },
    { name: 'kanon', path: '/images/partner-kanon.png' },
    { name: 'kokoro', path: '/images/partner-kokoro.png' },
    { name: 'meithu', path: '/images/partner-meithu.png' },
    { name: 'midcityhotel', path: '/images/partner-midcityhotel.png' },
    { name: 'omakaseauto', path: '/images/partner-omakaseauto.png' },
    { name: 'poppo', path: '/images/partner-poppo.png' },
    { name: 'sekiguchi02', path: '/images/partner-sekiguchi02.png' },
    { name: 'training_farm', path: '/images/partner-training_farm.png' },
    { name: 'transunet', path: '/images/partner-transunet.png' },
    { name: 'koharu', path: '/images/partner-koharu.png' },
    { name: 'yamakiya', path: '/images/partner-yamakiya.png' },
  ];


  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.agree) return alert('利用規約に同意してください');
    if (formData.email !== formData.confirmEmail) return alert('メールアドレスが一致しません。');


    setLoading(true);
    try {
      // 1. Firebase Auth ユーザー作成
      const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      const user = userCredential.user;


      // 2. Firestoreプロフィール保存
      const regResponse = await fetch('/api/auth/register-partner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uid: user.uid,
          storeName: formData.storeName,
          contactPerson: formData.contactPerson,
          address: formData.address,
          phoneNumber: formData.phoneNumber,
          email: formData.email,
          serviceType: 'adver',
        }),
      });


      if (!regResponse.ok) throw new Error('プロフィールの保存に失敗しました');


      // 3. 決済プラン選択ページへリダイレクト（ワンプラン運用でも、この画面で決済処理はOK）
      window.location.href = '/partner/subscribe_plan';
    } catch (err: any) {
      console.error('Signup Error:', err);
      alert(err.message || 'エラーが発生しました。');
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="bg-white text-slate-900 font-sans selection:bg-orange-100 overflow-x-hidden antialiased">
      <Head>
        <title>
          広告パートナー募集｜みんなのNasuアプリ（株式会社adtown 創業20周年記念事業）｜先行100社 5,500円
        </title>
        <meta
          name="description"
          content="株式会社adtown 創業20周年記念事業。那須地域限定のみんなのNasuアプリを開発。地元のアプリユーザーと店舗をAIで集客マッチング。通常8,800円→先行100社 5,500円（税込）。紹介報酬30%還元。"
        />
      </Head>


      {/* Sticky：信用を最初に */}
      <div className="bg-slate-950 text-white py-4 text-center text-xs md:text-sm font-black tracking-[0.22em] uppercase sticky top-0 z-[100] shadow-2xl backdrop-blur-md bg-opacity-90">
        那須地域限定「みんなのNasuアプリ」
        <span className="ml-3 text-orange-300">先行{PRICE.limitCompanies}社：月額¥{PRICE.campaign.toLocaleString()}（{PRICE.taxLabel}）</span>
      </div>


      {/* HERO：20周年記念を最初に大きく表示 + 信用→価値→価格→CTA */}
      <section className="relative min-h-screen flex items-center bg-white overflow-hidden border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-6 py-20 text-center relative z-10">


          {/* 🎉 20周年記念バッジ - トップページ最初に配置 */}
          <div className="mb-10 animate-fade-in">
            <div className="inline-flex flex-col items-center gap-4 bg-gradient-to-br from-orange-600 to-orange-500 text-white px-12 py-8 rounded-[3rem] border-4 border-orange-400 shadow-2xl transform hover:scale-105 transition-all">
              <div className="flex items-center gap-3">
                <span className="text-5xl">🎉</span>
                <div className="text-left">
                  <p className="text-2xl md:text-4xl font-black tracking-tight leading-none">株式会社adtown</p>
                  <p className="text-3xl md:text-5xl font-black tracking-tighter italic mt-1">創業20周年記念事業</p>
                </div>
                <span className="text-5xl">🎉</span>
              </div>
              <div className="bg-white/20 px-6 py-2 rounded-full">
                <p className="text-sm md:text-base font-black tracking-[0.2em] uppercase">
                  2006-2026 | 20 Years of Innovation
                </p>
              </div>
            </div>
          </div>


          {/* 信用バッジ */}
          <div className="flex flex-col items-center gap-4 mb-12">
            <div className="inline-flex items-center gap-3 bg-slate-900 text-white px-8 py-4 rounded-full border border-slate-800 shadow-xl">
              <span className="text-orange-400 font-black tracking-[0.25em] uppercase text-xs md:text-sm">
                nasu regional ai platform
              </span>
            </div>


            <p className="text-slate-700 font-black text-base md:text-lg italic max-w-4xl">
              「那須地域限定」のアプリを開発し、地元のアプリユーザーと店舗を
              <span className="text-slate-900 underline decoration-orange-300 underline-offset-8">AIで集客マッチング</span>します。
            </p>


            <div className="flex flex-wrap items-center justify-center gap-3">
              <span className="bg-orange-50 text-orange-700 px-6 py-3 rounded-full border border-orange-100 font-black tracking-[0.2em] uppercase text-xs md:text-sm">
                先行{PRICE.limitCompanies}社（申込順）
              </span>
              <span className="bg-slate-50 text-slate-700 px-6 py-3 rounded-full border border-slate-100 font-black tracking-[0.2em] uppercase text-xs md:text-sm">
                ワンプランのみ
              </span>
              <span className="bg-slate-50 text-slate-700 px-6 py-3 rounded-full border border-slate-100 font-black tracking-[0.2em] uppercase text-xs md:text-sm">
                初期費用 0円（※決済は月額）
              </span>
            </div>
          </div>


          <h1 className="text-5xl md:text-7xl lg:text-[9rem] font-black leading-[0.9] tracking-tighter italic">
            集客を、<br />
            <span className="text-orange-600">"自動で増える状態"</span>へ。
          </h1>


          <p className="mt-8 text-xl md:text-3xl text-slate-600 font-black max-w-5xl mx-auto leading-tight italic">
            広告を出して終わりではなく、<br className="md:hidden" />
            来店のきっかけを積み上げる仕組みを作ります。
          </p>


          {/* アプリ登録状況の追加 */}
          <div className="mt-12 max-w-5xl mx-auto bg-gradient-to-br from-orange-50 to-orange-100/50 rounded-[3rem] p-8 md:p-12 border-2 border-orange-200 shadow-xl">
            <h3 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight mb-6">
              📱 みんなのNasuアプリ 登録者急増中！
            </h3>
            <div className="space-y-4 text-left text-slate-700 font-bold leading-relaxed text-base md:text-lg">
              <p>
                ✅ <span className="font-black text-orange-600">すでに先行1,000人が登録済み</span>
              </p>
              <p>
                ✅ 現在、那須地域に発信している<span className="font-black text-orange-600">総フォロワー約10万人のインフルエンサー</span>が、みんなのNasuアプリへの登録を積極的に情報発信中！
              </p>
              <p>
                ✅ 今後、<span className="font-black text-orange-600">5,000人、10,000人と登録者の急増が見込まれています</span>。早期参加で先行者メリットを最大化できます。
              </p>
            </div>


            {/* アプリ登録用LPへのボタン */}
            <div className="mt-8">
              <a
                href="https://minna-no-nasu-app.netlify.app/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block bg-orange-600 hover:bg-orange-700 text-white text-lg md:text-xl font-black px-10 py-5 rounded-[2rem] shadow-[0_20px_50px_rgba(234,88,12,0.35)] transition transform hover:scale-105 active:scale-95"
              >
                みんなのNasuアプリに登録する →
              </a>
            </div>
          </div>


          {/* 💰 紹介報酬制度の追加セクション */}
          <div className="mt-12 max-w-5xl mx-auto bg-gradient-to-br from-indigo-50 to-indigo-100/50 rounded-[3rem] p-8 md:p-12 border-2 border-indigo-200 shadow-xl">
            <h3 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight mb-6">
              💰 紹介報酬制度で広告費を利益に変える
            </h3>
            <div className="space-y-4 text-left text-slate-700 font-bold leading-relaxed text-base md:text-lg">
              <p>
                ✅ <span className="font-black text-indigo-600">お客様がアプリ有料プランに登録すると、継続売上の30%を毎月還元</span>
              </p>
              <p>
                ✅ テーブルにQRコードを置くだけで、<span className="font-black text-indigo-600">来店客が登録するたびに継続収益が発生</span>
              </p>
              <p>
                ✅ 100名紹介で月額<span className="font-black text-indigo-600">約14,400円の収入</span>。広告費を実質無料にできます。
              </p>
            </div>
            <div className="mt-6 bg-white rounded-2xl p-6 border border-indigo-100">
              <p className="text-sm text-slate-600 font-bold italic">
                ※報酬は月末締め翌月15日払い。詳細は利用規約「第2条（紹介報酬の支払い）」をご確認ください。
              </p>
            </div>
          </div>


          {/* 価格ブロック（アンカリング強め） */}
          <div className="mt-10 max-w-4xl mx-auto bg-slate-900 text-white rounded-[3rem] p-10 md:p-12 shadow-2xl border border-slate-800">
            <p className="text-orange-300 font-black tracking-[0.3em] uppercase text-sm">limited offer</p>
            <div className="mt-4 flex flex-col md:flex-row items-center justify-center gap-6">
              <p className="text-xl md:text-2xl font-black text-white/70 line-through">
                通常 月額 ¥{PRICE.regular.toLocaleString()}（{PRICE.taxLabel}）
              </p>
              <p className="text-5xl md:text-7xl font-black tracking-tighter italic">
                ¥{PRICE.campaign.toLocaleString()}
                <span className="text-lg md:text-2xl text-white/70 font-black">（{PRICE.taxLabel}）</span>
              </p>
            </div>
            <p className="mt-4 text-white/80 font-bold">
              先行{PRICE.limitCompanies}社・申込順（残 {PRICE.remaining} 枠）
              <span className="block mt-1 text-white/70 text-sm">
                ※登録完了後、決済（Stripe/請求書）へ進みます。ワンプランのみです。
              </span>
            </p>


            <div className="mt-8 flex flex-col items-center gap-6">
              <button
                onClick={() => formRef.current?.scrollIntoView({ behavior: 'smooth' })}
                className="w-full md:w-auto bg-orange-600 hover:bg-orange-700 text-white text-xl md:text-2xl font-black px-12 py-6 rounded-[2.5rem] shadow-[0_25px_60px_rgba(234,88,12,0.35)] transition transform active:scale-95"
              >
                限定価格で申し込む
              </button>
              <p className="text-white/60 font-bold text-sm tracking-widest uppercase italic">
                運営：株式会社adtown（創業20周年記念事業)
              </p>
            </div>
          </div>
        </div>


        {/* 背景装飾 */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120vw] h-[120vw] bg-orange-50/40 rounded-full blur-[120px] -z-10"></div>
      </section>


      {/* PROBLEM */}
      <section className="py-28 md:py-36 bg-slate-900 text-white px-6 relative">
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-5xl md:text-7xl font-black italic tracking-tighter">THE PROBLEM</h2>
            <p className="text-orange-400 font-black text-lg md:text-2xl uppercase tracking-[0.25em]">
              多くのオーナーが直面する限界
            </p>
          </div>


          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-10">
            <TroubleCard
              title="集客が不安定"
              points={['天候や曜日に客足が左右される', 'SNSの頑張りが来店に直結しない', '「次の一手」が感覚になりがち']}
              cause="偶発的な集客に依存し、継続的な来店動機（仕組み）を設計できていない"
            />
            <TroubleCard
              title="広告費が回収できない"
              points={['掲載費が増えるほど利益が薄い', '一見客が多くリピートが弱い', '運用代行は高くて頼めない']}
              cause="認知だけにお金を使い、来店〜再来店までの導線が整っていない"
            />
            <TroubleCard
              title="運用が属人化する"
              points={['投稿・更新の負担がずっと続く', '担当が変わると止まる', 'AI/WEBツールが多すぎて選べない']}
              cause="運用が人に依存しているため、再現性と継続性が作れない"
            />


            <div className="lg:col-span-3 bg-gradient-to-br from-orange-600 to-orange-500 rounded-[4rem] p-14 md:p-16 text-center shadow-3xl">
              <h3 className="text-3xl md:text-5xl font-black italic tracking-tighter leading-tight text-white">
                解決策は「頑張る」ではなく、<br />
                <span className="underline decoration-white/70 underline-offset-[10px]">AIで"合う人"に届ける仕組み</span>です。
              </h3>
              <p className="mt-6 text-xl md:text-2xl font-bold text-orange-50 italic">
                みんなのNasuアプリが、那須地域でそれを実装します。
              </p>
            </div>
          </div>
        </div>
      </section>


      {/* SOLUTION：AIマッチングを明確に */}
      <section className="py-28 md:py-36 px-6 bg-white">
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="text-5xl md:text-7xl font-black italic tracking-tighter text-slate-900">AI MATCHING</h2>
          <p className="mt-6 text-2xl md:text-3xl font-black text-orange-600 tracking-tight">
            地元ユーザー × 店舗を、AIで集客マッチング
          </p>
          <p className="mt-6 text-slate-600 font-bold text-lg md:text-xl leading-relaxed italic max-w-5xl mx-auto">
            那須地域限定のアプリだからこそ、「近い・行ける・興味がある」ユーザーに絞って届けられます。
            広く浅くではなく、来店に繋がる確度を上げます。
          </p>


          <div className="mt-14 grid md:grid-cols-2 lg:grid-cols-4 gap-10 text-left">
            <FeatureCard
              icon="🧠"
              title="AIマッチング（中核）"
              desc="ユーザーの興味・行動傾向に合わせて、店舗のLINEや特典をユーザーに自動誘導します。"
            />
            <FeatureCard
              icon="🎯"
              title="那須地域に限定配信"
              desc="地域を絞ることで、無駄打ちを減らし、少ない費用でも、効果のある集客へ寄せていきます。"
            />
            <FeatureCard
              icon="🤖"
              title="自動来店シナリオ"
              desc="クーポン・特典・再来店のきっかけを設計。オーナーの手作業を増やさず運用できます。"
            />
            <FeatureCard
              icon="📈"
              title="効果の見える化"
              desc="反応・閲覧・導線の改善点を整理。何を直せば良いかが分かる状態を作ります。"
            />
          </div>
        </div>
      </section>


      {/* TRUST：ロゴ（事例がない代わりに"参加企業"で信用補強） */}
      <section className="py-20 md:py-28 px-6 bg-white overflow-hidden border-t border-slate-100">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-sm md:text-base font-black text-slate-400 tracking-[0.45em] uppercase italic">
            trusted by local partners
          </p>


          <div className="mt-12 grid grid-cols-2 md:grid-cols-5 gap-12 items-center opacity-60 grayscale hover:grayscale-0 transition-all duration-700">
            {partners.map((p, i) => (
              <div key={i} className="relative h-16 md:h-20 w-full flex items-center justify-center">
                <Image src={p.path} alt={p.name} fill style={{ objectFit: 'contain' }} />
              </div>
            ))}
          </div>
        </div>
      </section>


      {/* OFFER：ワンプラン・限定価格を再提示 */}
      <section className="py-24 md:py-32 px-6 bg-slate-50 border-y border-slate-100">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-[4rem] shadow-2xl border border-slate-100 overflow-hidden">
            <div className="bg-gradient-to-r from-orange-600 to-orange-500 p-12 md:p-16 text-white">
              <h2 className="text-4xl md:text-6xl font-black italic tracking-tighter">
                先行{PRICE.limitCompanies}社限定（申込順）
              </h2>
              <p className="mt-4 text-orange-50 font-bold text-lg md:text-xl">
                通常 ¥{PRICE.regular.toLocaleString()} → 今だけ ¥{PRICE.campaign.toLocaleString()}（{PRICE.taxLabel}）
              </p>
              <div className="mt-8 bg-white/15 border border-white/20 rounded-3xl p-8">
                <p className="text-xl md:text-2xl font-black italic">
                  残枠：{PRICE.remaining} / {PRICE.limitCompanies}
                </p>
                <p className="mt-2 text-white/90 font-bold">枠が埋まり次第、通常価格に戻ります。</p>
              </div>
            </div>


            <div className="p-10 md:p-16 grid md:grid-cols-3 gap-8">
              <div className="bg-slate-50 rounded-3xl p-8 border border-slate-100">
                <p className="font-black text-slate-900 text-xl">ワンプランに含まれるもの</p>
                <ul className="mt-4 space-y-2 text-slate-600 font-bold">
                  <li>・アプリ内掲載（基本）</li>
                  <li>・クーポン/特典/フードロス登録・管理</li>
                  <li>・AI集客マッチング導線（設計/最適化）</li>
                  <li>・効果の見える化（運用の改善ポイント）</li>
                  <li>・<span className="text-indigo-600 font-black">紹介報酬30%還元</span></li>
                  <li>・サポート（LINE問い合わせ）</li>
                </ul>
              </div>


              <div className="bg-slate-50 rounded-3xl p-8 border border-slate-100">
                <p className="font-black text-slate-900 text-xl">向いている店舗</p>
                <ul className="mt-4 space-y-2 text-slate-600 font-bold">
                  <li>・新規を増やしたい</li>
                  <li>・リピートを作りたい</li>
                  <li>・広告運用の手間を減らしたい</li>
                  <li>・地域の常連を増やしたい</li>
                  <li>・<span className="text-indigo-600 font-black">紹介報酬で収益化したい</span></li>
                </ul>
              </div>


              <div className="bg-slate-900 rounded-3xl p-8 border border-slate-800 text-white">
                <p className="font-black text-2xl italic">まずは"合うか"確認</p>
                <p className="mt-4 text-white/80 font-bold leading-relaxed">
                  解約は管理画面からいつでも可能。スタートはシンプルに、必要なら改善を積み上げていく設計です。
                </p>
                <button
                  onClick={() => formRef.current?.scrollIntoView({ behavior: 'smooth' })}
                  className="mt-6 w-full bg-orange-600 hover:bg-orange-700 font-black py-4 rounded-2xl transition"
                >
                  登録へ進む
                </button>
              </div>
            </div>
          </div>


          {/* FAQ（事例が無い分、安心を厚く） */}
          <div className="mt-14">
            <h3 className="text-3xl md:text-4xl font-black tracking-tighter italic text-slate-900">よくある質問</h3>
            <div className="mt-8 grid md:grid-cols-2 gap-6">
              <Faq q="これは那須以外でも使えますか？" a="本LPのサービスは那須地域限定です（地域密着のため、配信効率を最大化できます）。" />
              <Faq q="プランは複数ありますか？" a="ワンプランのみです。登録後に決済（Stripe/請求書）へ進みます。" />
              <Faq q="AIマッチングとは何ですか？" a="地元ユーザーの興味・行動傾向に合う形で、店舗のLINEや特典をユーザーに自動誘導することです。" />
              <Faq q="紹介報酬はどのように支払われますか？" a="月末締め翌月15日に、指定口座へ振込されます。有料ユーザー継続売上（税抜）の30%が報酬です。" />
              <Faq q="解約はできますか？" a="はい。管理画面よりいつでも解約手続きが可能です（規約に基づき日割り返金はありません）。" />
            </div>
          </div>
        </div>
      </section>


      {/* SIGNUP FORM */}
      <section ref={formRef} id="signup" className="py-28 md:py-36 px-6 bg-slate-900 text-white relative">
        <div className="max-w-5xl mx-auto relative z-10">
          <div className="bg-white text-slate-900 rounded-[5rem] shadow-[0_60px_120px_rgba(0,0,0,0.6)] overflow-hidden border-[15px] border-orange-600">
            <div className="bg-orange-600 p-12 md:p-16 text-center text-white relative">
              <h3 className="text-4xl md:text-6xl font-black mb-6 italic tracking-tighter uppercase">Join the Program</h3>


              <div className="space-y-4 font-black">
                <p className="text-2xl md:text-3xl line-through opacity-80 italic">
                  通常価格 月額 ¥{PRICE.regular.toLocaleString()}（{PRICE.taxLabel}）
                </p>
                <div className="bg-white text-orange-600 inline-block px-10 py-4 rounded-full text-2xl md:text-3xl animate-pulse italic shadow-2xl">
                  先行{PRICE.limitCompanies}社限定（申込順）：残 {PRICE.remaining} 社
                </div>
                <p className="text-5xl md:text-7xl pt-4 uppercase tracking-[0.06em] font-black italic">
                  月額 ¥{PRICE.campaign.toLocaleString()} <span className="text-xl md:text-2xl">（{PRICE.taxLabel}）</span>
                </p>
                <p className="text-white/90 font-bold text-sm md:text-base">
                  ※ワンプランのみ。登録後に決済（Stripe/請求書）へ進みます。
                </p>
              </div>
            </div>


            <div className="p-8 md:p-16">
              <form onSubmit={handleSignup} className="space-y-10">
                <div className="space-y-3">
                  <label className="text-sm font-black text-slate-500 uppercase tracking-widest ml-3">店舗・企業名 *</label>
                  <input
                    type="text"
                    autoComplete="organization"
                    placeholder="株式会社〇〇 / カフェ〇〇"
                    required
                    className="w-full p-6 md:p-7 bg-slate-50 border-2 border-slate-100 rounded-3xl outline-none focus:border-orange-500 text-lg md:text-xl font-bold transition-all placeholder:text-slate-300"
                    value={formData.storeName}
                    onChange={(e) => setFormData({ ...formData, storeName: e.target.value })}
                  />
                </div>


                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <label className="text-sm font-black text-slate-500 uppercase tracking-widest ml-3">ご担当者名 *</label>
                    <input
                      type="text"
                      autoComplete="name"
                      placeholder="山田 太郎"
                      required
                      className="w-full p-6 md:p-7 bg-slate-50 border-2 border-slate-100 rounded-3xl outline-none focus:border-orange-500 text-lg md:text-xl font-bold transition-all placeholder:text-slate-300"
                      value={formData.contactPerson}
                      onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                    />
                  </div>


                  <div className="space-y-3">
                    <label className="text-sm font-black text-slate-500 uppercase tracking-widest ml-3">所在地（那須エリア） *</label>
                    <input
                      type="text"
                      autoComplete="street-address"
                      placeholder="那須塩原市〇〇町 1-2"
                      required
                      className="w-full p-6 md:p-7 bg-slate-50 border-2 border-slate-100 rounded-3xl outline-none focus:border-orange-500 text-lg md:text-xl font-bold transition-all placeholder:text-slate-300"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    />
                  </div>
                </div>


                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <label className="text-sm font-black text-slate-500 uppercase tracking-widest ml-3">メールアドレス *</label>
                    <input
                      type="email"
                      autoComplete="email"
                      placeholder="mail@example.com"
                      required
                      className="w-full p-6 md:p-7 bg-slate-50 border-2 border-slate-100 rounded-3xl outline-none focus:border-orange-500 text-lg md:text-xl font-bold transition-all placeholder:text-slate-300"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>


                  <div className="space-y-3">
                    <label className="text-sm font-black text-slate-500 uppercase tracking-widest ml-3">メールアドレス（確認） *</label>
                    <input
                      type="email"
                      autoComplete="off"
                      placeholder="再入力してください"
                      required
                      className="w-full p-6 md:p-7 bg-slate-50 border-2 border-slate-100 rounded-3xl outline-none focus:border-orange-500 text-lg md:text-xl font-bold transition-all placeholder:text-slate-300"
                      value={formData.confirmEmail}
                      onChange={(e) => setFormData({ ...formData, confirmEmail: e.target.value })}
                    />
                  </div>
                </div>


                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <label className="text-sm font-black text-slate-500 uppercase tracking-widest ml-3">電話番号 *</label>
                    <input
                      type="tel"
                      autoComplete="tel"
                      placeholder="0287-XX-XXXX"
                      required
                      className="w-full p-6 md:p-7 bg-slate-50 border-2 border-slate-100 rounded-3xl outline-none focus:border-orange-500 text-lg md:text-xl font-bold transition-all placeholder:text-slate-300"
                      value={formData.phoneNumber}
                      onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                    />
                  </div>


                  <div className="space-y-3">
                    <label className="text-sm font-black text-slate-500 uppercase tracking-widest ml-3">管理画面用パスワード *</label>
                    <input
                      type="password"
                      autoComplete="new-password"
                      placeholder="8文字以上推奨"
                      required
                      minLength={8}
                      className="w-full p-6 md:p-7 bg-slate-50 border-2 border-slate-100 rounded-3xl outline-none focus:border-orange-500 text-lg md:text-xl font-bold transition-all placeholder:text-slate-300"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    />
                  </div>
                </div>


                <div className="p-8 md:p-10 bg-orange-50 rounded-[2.5rem] border-2 border-orange-100">
                  <p className="text-slate-700 mb-6 italic leading-relaxed text-lg font-bold">
                    ※登録完了後、決済ページへ遷移します。クレジットカード（Stripe）または請求書払いでご利用いただけます。
                  </p>


                  <label className="flex items-start gap-4 cursor-pointer">
                    <input
                      type="checkbox"
                      className="mt-1 w-7 h-7 text-orange-600 rounded-lg border-orange-200 focus:ring-orange-500 cursor-pointer"
                      checked={formData.agree}
                      onChange={(e) => setFormData({ ...formData, agree: e.target.checked })}
                    />
                    <span
                      className="font-black text-slate-800 underline underline-offset-8 decoration-4 hover:text-orange-600 transition-colors"
                      onClick={(e) => {
                        e.preventDefault();
                        setShowTerms(true);
                      }}
                    >
                      利用規約および紹介報酬制度に同意する
                    </span>
                  </label>
                </div>


                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-8 md:py-10 bg-orange-600 hover:bg-orange-700 text-white text-2xl md:text-4xl font-black rounded-[3rem] shadow-[0_30px_80px_rgba(234,88,12,0.45)] transition transform active:scale-95 disabled:opacity-50 italic tracking-tighter"
                >
                  {loading ? '通信中...' : '登録して決済へ進む'}
                </button>


                <p className="text-center text-slate-500 font-bold text-sm leading-relaxed">
                  登録は1分程度。完了後に決済（ワンプラン）へ進みます。
                </p>
              </form>
            </div>
          </div>
        </div>


        <div className="absolute bottom-0 left-0 w-full overflow-hidden whitespace-nowrap opacity-[0.04] select-none pointer-events-none">
          <p className="text-[18rem] md:text-[22rem] font-black italic tracking-tighter leading-none">NASU × AI × LOCAL</p>
        </div>
      </section>


      {/* 利用規約モーダル（紹介報酬制度を追加） */}
      {showTerms && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 md:p-10 bg-slate-950/95 backdrop-blur-2xl">
          <div className="bg-white rounded-[3rem] max-w-4xl w-full max-h-[90vh] flex flex-col shadow-3xl border border-slate-100 overflow-hidden">
            <div className="p-8 md:p-10 border-b bg-slate-50 flex justify-between items-center">
              <h3 className="text-2xl md:text-4xl font-black italic tracking-tighter">Agreement</h3>
              <button onClick={() => setShowTerms(false)} className="text-5xl text-slate-300 hover:text-slate-900 transition-colors">
                &times;
              </button>
            </div>


            <div className="p-8 md:p-12 overflow-y-auto space-y-10 text-slate-600 font-bold leading-relaxed">
              <section className="space-y-4">
                <h4 className="text-slate-900 font-black text-xl border-l-8 border-orange-600 pl-4 uppercase">第1条（目的）</h4>
                <p>
                  本契約は、株式会社adtown（以下「当社」）が提供する「みんなのNasuアプリ」を通じて、パートナーの広告掲載、集客支援、および相互の利益拡大を図ることを目的とします。
                </p>
              </section>


              <section className="space-y-4 bg-indigo-50 p-8 rounded-3xl border-2 border-indigo-100">
                <h4 className="text-indigo-600 font-black text-xl border-l-8 border-indigo-600 pl-4 uppercase">第2条（紹介報酬の支払い）</h4>
                <div className="space-y-3">
                  <p>
                    <strong>1. 報酬の発生条件</strong><br />
                    パートナーは、貴店に割り振られた専用コード/QRを用いてユーザーを本アプリの有料プランへ誘導した際、その継続売上（税抜金額）の<strong className="text-indigo-600">30%</strong>を報酬として受領する権利を得ます。
                  </p>
                  <p>
                    <strong>2. 支払い時期</strong><br />
                    報酬は<strong className="text-indigo-600">月末締め翌月15日</strong>に、パートナーが指定する銀行口座に振込されます。
                  </p>
                  <p>
                    <strong>3. 報酬の継続性</strong><br />
                    紹介したユーザーが有料プランを継続利用している限り、毎月報酬が発生します。ユーザーが解約した月以降は報酬の対象外となります。
                  </p>
                  <p>
                    <strong>4. 報酬の確認</strong><br />
                    パートナーは管理画面から、紹介人数・報酬額・支払い履歴をいつでも確認できます。
                  </p>
                </div>
              </section>


              <section className="space-y-4 bg-orange-50 p-8 rounded-3xl border border-orange-100">
                <h4 className="text-orange-600 font-black text-xl border-l-8 border-orange-600 pl-4 uppercase italic">第3条（契約の解除）</h4>
                <p>
                  本契約は1ヶ月単位の自動更新となります。パートナーは管理画面よりいつでも解約手続きを行うことができます。日割り計算による返金は行われません。解約後も、既に発生している紹介報酬は規約に基づき支払われます。
                </p>
              </section>


              <section className="space-y-4">
                <h4 className="text-slate-900 font-black text-xl border-l-8 border-orange-600 pl-4 uppercase">第4条（禁止事項）</h4>
                <p>
                  不適切なコンテンツの投稿、公序良俗に反する行為、虚偽の数値を用いた勧誘、およびシステムへの不正アクセスを固く禁じます。紹介報酬制度を悪用した不正行為が発覚した場合、報酬の没収および契約解除の措置を取ります。
                </p>
              </section>


              <section className="space-y-4">
                <h4 className="text-slate-900 font-black text-xl border-l-8 border-orange-600 pl-4 uppercase">第5条（免責事項）</h4>
                <p>
                  当社は、システムの不具合、通信障害、天災等やむを得ない事由により、サービスの提供が一時的に中断した場合でも、パートナーに対して損害賠償責任を負わないものとします。
                </p>
              </section>
            </div>


            <div className="p-8 md:p-10 border-t bg-slate-50 text-center">
              <button
                onClick={() => setShowTerms(false)}
                className="bg-slate-900 text-white px-10 py-4 rounded-full font-black text-xl hover:bg-orange-600 transition-all shadow-xl italic tracking-tighter"
              >
                規約に同意して戻る
              </button>
            </div>
          </div>
        </div>
      )}


      {/* フッター */}
      <footer className="bg-slate-950 py-24 px-6 text-center text-slate-500 font-bold border-t border-white/5">
        <div className="max-w-7xl mx-auto space-y-14">
          <div className="flex flex-col md:flex-row justify-center items-center gap-10 text-slate-400 text-sm md:text-base italic uppercase tracking-widest">
            <Link href="/company" className="hover:text-white transition-colors">
              Company
            </Link>
            <Link href="/privacy" className="hover:text-white transition-colors">
              Privacy Policy
            </Link>
            <Link href="/terms" className="hover:text-white transition-colors">
              SCTL（特商法）
            </Link>
            <Link href="/contact" className="hover:text-white transition-colors">
              Support
            </Link>
          </div>


          <div className="space-y-6">
            <p className="text-xs tracking-[0.65em] uppercase opacity-40 italic font-black">
              empowering local economy with ai agent technology
            </p>
            <h2 className="text-3xl md:text-5xl font-black text-white italic tracking-tighter">
              みんなの <span className="text-orange-600 underline decoration-white/40">NASU</span> アプリ
            </h2>
          </div>


          <div className="max-w-3xl mx-auto space-y-4">
            <p className="text-xs opacity-30 leading-loose italic font-medium">
              本プロジェクトは株式会社adtownの<span className="font-black">創業20周年記念事業</span>として運営されています。那須地域の持続可能な発展を目指し、AIと地域住民が共生する新しいマーケティングエコシステムを構築します。
            </p>
            <p className="text-xs tracking-[0.3em] opacity-40 pt-6">© 2026 adtown CO., LTD. ALL RIGHTS RESERVED.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
