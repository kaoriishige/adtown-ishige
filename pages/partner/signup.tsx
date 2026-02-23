import React, { useEffect, useRef, useState } from 'react';
import Head from 'next/head';
import Image from 'next/image';
import Link from 'next/link';
import { getAuth, createUserWithEmailAndPassword, onAuthStateChanged } from 'firebase/auth';
import { useRouter } from 'next/router';
import { app } from '@/lib/firebase';
import { useAffiliateTracker } from '@/lib/affiliate-tracker';

/**
 * ==============================================================================
 * 【みんなのNasuアプリ】広告パートナーLP 完全改善版
 * 
 * 改善ポイント:
 * 1. adtown社の20年実績を前面に押し出し
 * 2. 「無料なし」を「本気度の証」に転換
 * 3. CEO メッセージで人間味と信頼性を追加
 * 4. 紹介報酬30%でリスクヘッジを強調
 * 5. AIマッチングの具体性を向上
 * ==============================================================================
 */

// --- UI部品 ---
const Pill = ({ children }: { children: React.ReactNode }) => (
  <span className="inline-flex items-center px-6 py-2.5 rounded-full bg-white/8 border border-white/20 text-white/90 font-semibold text-xs tracking-[0.18em] uppercase backdrop-blur-sm">
    {children}
  </span>
);

const FeatureCard = ({ icon, title, desc }: { icon: string; title: string; desc: string }) => (
  <div className="relative bg-white rounded-3xl p-8 md:p-10 shadow-lg border border-slate-100/80 hover:-translate-y-2 hover:shadow-2xl transition-all duration-500 group overflow-hidden">
    <div className="absolute inset-0 bg-gradient-to-br from-orange-50/0 to-orange-50/60 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-3xl" />
    <div className="relative z-10">
      <div className="w-16 h-16 flex items-center justify-center bg-orange-50 rounded-2xl text-3xl mb-6 group-hover:scale-110 group-hover:bg-orange-100 transition-all duration-300">{icon}</div>
      <h3 className="text-xl font-bold text-slate-900 tracking-tight mb-3">{title}</h3>
      <p className="text-slate-500 leading-relaxed text-sm">{desc}</p>
    </div>
  </div>
);

const TroubleCard = ({ title, points, cause }: { title: string; points: string[]; cause: string }) => (
  <div className="bg-white/[0.04] rounded-3xl p-8 border border-white/10 hover:border-red-500/30 hover:bg-white/[0.07] transition-all duration-300 group">
    <div className="flex items-center gap-3 mb-5">
      <div className="w-8 h-8 bg-red-500 rounded-lg flex items-center justify-center text-white font-bold text-sm flex-shrink-0">!</div>
      <h4 className="text-lg font-bold text-white">{title}</h4>
    </div>
    <ul className="space-y-2.5 mb-6">
      {points.map((d, i) => (
        <li key={i} className="text-slate-400 flex items-start text-sm leading-relaxed">
          <span className="mr-2 text-red-500 mt-0.5 flex-shrink-0">▸</span>
          {d}
        </li>
      ))}
    </ul>
    <div className="bg-red-500/10 p-5 rounded-2xl border-l-2 border-red-500/60">
      <p className="text-xs font-semibold text-red-400 uppercase tracking-widest mb-1.5">根本原因</p>
      <p className="text-sm font-medium text-white/80 leading-relaxed">{cause}</p>
    </div>
  </div>
);

const Faq = ({ q, a }: { q: string; a: string }) => (
  <div className="group bg-white rounded-2xl border border-slate-100 p-7 hover:border-orange-200 hover:shadow-md transition-all duration-300">
    <div className="flex gap-3 items-start">
      <span className="flex-shrink-0 w-7 h-7 bg-orange-500 text-white rounded-lg flex items-center justify-center text-xs font-bold mt-0.5">Q</span>
      <p className="font-bold text-slate-900">{q}</p>
    </div>
    <div className="flex gap-3 items-start mt-4">
      <span className="flex-shrink-0 w-7 h-7 bg-slate-100 text-slate-500 rounded-lg flex items-center justify-center text-xs font-bold mt-0.5">A</span>
      <p className="text-slate-500 leading-relaxed text-sm">{a}</p>
    </div>
  </div>
);

const StatCard = ({ number, label }: { number: string; label: string }) => (
  <div className="text-center group py-2">
    <p className="text-4xl md:text-6xl font-black bg-gradient-to-br from-orange-300 to-amber-500 bg-clip-text text-transparent group-hover:scale-105 transition-transform inline-block">{number}</p>
    <p className="mt-2 text-white/60 text-sm font-medium tracking-wide">{label}</p>
  </div>
);

export default function PartnerSignupLP() {
  const auth = getAuth(app);
  const router = useRouter();
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

  // 認証状態管理
  const [authUser, setAuthUser] = useState<any>(null);
  const [authChecked, setAuthChecked] = useState(false);

  // アフィリエイトトラッキング
  useAffiliateTracker('adver');

  // 認証状態の確認
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setAuthUser(user);
      setAuthChecked(true);
    });
    return () => unsubscribe();
  }, [auth]);

  // 公開ページ設定
  useEffect(() => {
    if (typeof window !== 'undefined') (window as any).__IS_PUBLIC_PAGE__ = true;
  }, []);

  // 価格・限定
  const PRICE = {
    regular: 8800,
    campaign: 5500,
    taxLabel: '税込',
    limitCompanies: 100,
    remaining: 38,
  };

  // 実績ロゴ
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

    // 既にログイン済みの場合はメール確認をスキップ
    if (!authUser && formData.email !== formData.confirmEmail) {
      return alert('メールアドレスが一致しません。');
    }

    setLoading(true);
    try {
      let user = authUser;

      // ログインしていない場合のみ新規アカウント作成
      if (!authUser) {
        const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
        user = userCredential.user;
      }

      // パートナー情報を登録
      const regResponse = await fetch('/api/auth/register-partner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uid: user.uid,
          storeName: formData.storeName,
          contactPerson: formData.contactPerson,
          address: formData.address,
          phoneNumber: formData.phoneNumber,
          email: user.email || formData.email,
          serviceType: 'adver',
        }),
      });

      if (!regResponse.ok) throw new Error('プロフィールの保存に失敗しました');

      window.location.href = '/partner/subscribe_plan';
    } catch (err: any) {
      console.error('Signup Error:', err);
      alert(err.message || 'エラーが発生しました。');
    } finally {
      setLoading(false);
    }
  };

  // 認証状態がまだ確認中
  if (!authChecked) {
    return <div className="text-center py-40">Loading...</div>;
  }

  // ログイン済みでもランディングページを表示
  // （フォーム送信時に適切にリダイレクトされる）

  return (
    <div className="bg-white text-slate-900 font-sans selection:bg-orange-100 overflow-x-hidden antialiased">
      <Head>
        <title>
          広告パートナー募集｜みんなのNasuアプリ（株式会社adtown 20周年記念事業）｜先行100社 5,500円
        </title>
        <meta
          name="description"
          content="株式会社adtown 20周年記念事業。20年間で1000社+の集客を支援してきた実績を、アプリ×AIに集約。那須地域限定で地元ユーザーと店舗をマッチング。通常8,800円→先行100社 5,500円（税込）。紹介報酬30%還元。"
        />
      </Head>

      {/* Sticky Bar */}
      <div className="bg-black/95 backdrop-blur-xl text-white py-3 text-center text-xs font-medium tracking-[0.18em] uppercase sticky top-0 z-[100] border-b border-white/10">
        <span className="text-white/50">那須地域限定</span>
        <span className="mx-3 text-white/20">|</span>
        <span className="text-amber-400 font-semibold">みんなのNasuアプリ</span>
        <span className="mx-3 text-white/20">|</span>
        <span className="text-white/70">先行{PRICE.limitCompanies}社限定 ¥{PRICE.campaign.toLocaleString()}/{PRICE.taxLabel}</span>
        <span className="ml-3 inline-flex items-center gap-1 bg-red-500 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full animate-pulse">残{PRICE.remaining}枠</span>
      </div>

      {/* ============================================
          HERO：20周年実績 + 信頼性を最初に
          ============================================ */}
      <section className="relative min-h-screen flex items-center bg-[#0a0a0a] overflow-hidden border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 py-24 text-center relative z-10">

          {/* 20周年記念バッジ */}
          <div className="mb-12">
            <div className="inline-flex flex-col items-center gap-3 px-10 py-6 rounded-2xl border border-amber-500/30 bg-amber-500/5 backdrop-blur-sm">
              <div className="flex items-center gap-4">
                <div className="text-left">
                  <p className="text-sm font-medium tracking-[0.25em] text-amber-400/80 uppercase mb-1">株式会社adtown</p>
                  <p className="text-2xl md:text-3xl font-bold tracking-tight text-white leading-none">創業<span className="bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">20周年</span>記念事業</p>
                </div>
              </div>
              <p className="text-xs text-white/30 tracking-[0.3em] uppercase">2006–2026 · 20 Years of Innovation</p>
            </div>
          </div>

          {/* adtown社の実績数字 */}
          <div className="mt-8 max-w-4xl mx-auto rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-sm divide-x divide-white/10 flex flex-col md:flex-row">
            <div className="flex-1 px-8 py-8">
              <StatCard number="20年" label="地域広告の実績" />
            </div>
            <div className="flex-1 px-8 py-8 border-t md:border-t-0 border-white/10">
              <StatCard number="1000社+" label="累計クライアント" />
            </div>
            <div className="flex-1 px-8 py-8 border-t md:border-t-0 border-white/10">
              <StatCard number="1億部" label="情報誌発行部数" />
            </div>
          </div>

          <div className="mt-6 max-w-2xl mx-auto">
            <p className="text-white/40 text-sm leading-relaxed">
              紙媒体・WEB・YouTubeで那須地域の集客を20年支援してきた株式会社adtownが、その知見を集約した「アプリ × AI」の新サービスです。
            </p>
          </div>


          {/* バッジ・キャッチコピー */}
          <div className="mt-12 flex flex-wrap items-center justify-center gap-3">
            <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 px-5 py-2 rounded-full text-xs font-medium tracking-[0.18em] uppercase">
              先行{PRICE.limitCompanies}社（申込順）
            </span>
            <span className="bg-white/5 text-white/50 border border-white/10 px-5 py-2 rounded-full text-xs font-medium tracking-[0.18em] uppercase">
              ワンプランのみ
            </span>
            <span className="bg-white/5 text-white/50 border border-white/10 px-5 py-2 rounded-full text-xs font-medium tracking-[0.18em] uppercase">
              初期費用 0円
            </span>
          </div>

          {/* キャッチコピー */}
          <h1 className="text-5xl md:text-7xl lg:text-[8rem] font-black leading-[1] tracking-tighter mt-10 text-white">
            集客を、<br />
            <span className="bg-gradient-to-r from-amber-400 via-orange-500 to-orange-600 bg-clip-text text-transparent">&quot;自動で増える状態&quot;</span>へ。
          </h1>

          <p className="mt-6 text-base md:text-lg text-white/40 max-w-xl mx-auto leading-relaxed font-medium">
            紙・WEB・動画で培った「地域集客のノウハウ」を、AIアプリに集約しました。
          </p>

          {/* アプリ登録状況 */}
          <div className="mt-12 max-w-2xl mx-auto rounded-2xl border border-white/10 bg-white/[0.03] p-7 text-left">
            <p className="text-xs font-semibold text-amber-400 tracking-[0.2em] uppercase mb-4">📱 登録者急増中</p>
            <ul className="space-y-3">
              <li className="flex items-start gap-3 text-sm text-white/60">
                <span className="text-amber-400 mt-0.5 flex-shrink-0">✓</span>
                <span><span className="text-white font-semibold">先行1,000人登録済み</span></span>
              </li>
              <li className="flex items-start gap-3 text-sm text-white/60">
                <span className="text-amber-400 mt-0.5 flex-shrink-0">✓</span>
                <span>那須地域へ発信する<span className="text-white font-semibold">総フォロワー約10万人のインフルエンサー</span>が登録を情報発信中</span>
              </li>
              <li className="flex items-start gap-3 text-sm text-white/60">
                <span className="text-amber-400 mt-0.5 flex-shrink-0">✓</span>
                <span>今後<span className="text-white font-semibold">5,000人・10,000人への急増の見込みあり</span></span>
              </li>
            </ul>
            <a
              href="https://minna-no-nasu-app.netlify.app/"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-amber-400 hover:text-amber-300 transition-colors"
            >
              アプリを見る →
            </a>
          </div>

          {/* 紹介報酬制度 */}
          <div className="mt-6 max-w-2xl mx-auto rounded-2xl border border-indigo-500/20 bg-indigo-500/5 p-7 text-left">
            <p className="text-xs font-semibold text-indigo-400 tracking-[0.2em] uppercase mb-4">💰 紹介報酬制度</p>
            <ul className="space-y-3">
              <li className="flex items-start gap-3 text-sm text-white/60">
                <span className="text-indigo-400 mt-0.5 flex-shrink-0">✓</span>
                <span>お客様が有料プランに登録すると<span className="text-white font-semibold">継続売上の30%を毎月還元</span></span>
              </li>
              <li className="flex items-start gap-3 text-sm text-white/60">
                <span className="text-indigo-400 mt-0.5 flex-shrink-0">✓</span>
                <span>QRコードを置くだけで<span className="text-white font-semibold">来店客が登録するたびに継続収益が発生</span></span>
              </li>
              <li className="flex items-start gap-3 text-sm text-white/60">
                <span className="text-indigo-400 mt-0.5 flex-shrink-0">✓</span>
                <span>100名紹介で月額<span className="text-white font-semibold">約14,400円の収入</span>。広告費を実質無料にできます。</span>
              </li>
            </ul>
          </div>

          {/* 価格ブロック */}
          <div className="mt-10 max-w-2xl mx-auto rounded-2xl border border-white/10 bg-white/[0.04] p-8">
            <p className="text-xs font-semibold text-amber-400/70 tracking-[0.2em] uppercase mb-5">limited offer</p>
            <div className="flex flex-col md:flex-row items-center justify-center gap-4">
              <p className="text-base font-medium text-white/30 line-through">月額 ¥{PRICE.regular.toLocaleString()}({PRICE.taxLabel})</p>
              <div className="flex items-baseline gap-2">
                <p className="text-5xl md:text-6xl font-black tracking-tight text-white">¥{PRICE.campaign.toLocaleString()}</p>
                <span className="text-sm text-white/40">{PRICE.taxLabel} / 月</span>
              </div>
            </div>
            <p className="mt-3 text-sm text-white/30 text-center">先行{PRICE.limitCompanies}社 ・ 申込順（残 {PRICE.remaining} 枠）</p>

            <div className="mt-6 grid grid-cols-2 gap-3">
              {[
                { icon: '✔', text: 'いつでも解約OK' },
                { icon: '✔', text: '初月から報酬発生' },
                { icon: '✔', text: 'LINEサポート完備' },
                { icon: '✔', text: '先行100社は値上げ後も据置き' },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-2 text-sm text-white/50">
                  <span className="text-amber-400">{item.icon}</span>
                  {item.text}
                </div>
              ))}
            </div>

            <button
              onClick={() => formRef.current?.scrollIntoView({ behavior: 'smooth' })}
              className="mt-8 w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white text-lg font-bold py-5 rounded-xl shadow-[0_8px_32px_rgba(234,88,12,0.4)] transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0"
            >
              限定価格で申し込む
            </button>
            <p className="mt-3 text-center text-white/20 text-xs">運営：株式会社adtown（20周年記念事業）</p>
          </div>
        </div>

        {/* 背景装飾 */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80vw] h-[80vw] bg-amber-600/5 rounded-full blur-[160px] -z-10 pointer-events-none"></div>
      </section>

      {/* ============================================
          TRUST: adtown社の20年実績（NEW）
          ============================================ */}
      <section className="py-28 md:py-36 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white px-6 relative overflow-hidden">
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-16">
            <p className="text-orange-400 font-black tracking-[0.3em] uppercase text-sm mb-4">
              why trust us?
            </p>
            <h2 className="text-5xl md:text-7xl font-black italic tracking-tighter">
              20年間、那須で<br />
              <span className="text-orange-400">地域集客を支援</span>してきました
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-12">
            {/* 左：これまでの実績 */}
            <div className="bg-white/5 rounded-[3rem] p-10 border border-white/10 backdrop-blur-sm">
              <h3 className="text-3xl font-black mb-8 text-orange-400">📚 これまでの実績</h3>
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <span className="text-4xl">📰</span>
                  <div>
                    <p className="font-black text-xl">紙媒体制作</p>
                    <p className="text-white/70 font-bold mt-2 leading-relaxed">
                      地域情報誌・チラシ・フリーペーパーなど、
                      <span className="text-white font-black">累計1000社+</span>の制作実績。
                      店舗オーナー様の「伝えたいこと」を形にしてきました。
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <span className="text-4xl">🌐</span>
                  <div>
                    <p className="font-black text-xl">WEB制作・運用</p>
                    <p className="text-white/70 font-bold mt-2 leading-relaxed">
                      ホームページ制作、SEO対策、SNS運用代行など、
                      デジタル集客の<span className="text-white font-black">トータルサポート</span>。
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <span className="text-4xl">🎥</span>
                  <div>
                    <p className="font-black text-xl">YouTubeチャンネル運営</p>
                    <p className="text-white/70 font-bold mt-2 leading-relaxed">
                      那須地域の魅力を発信するYouTubeチャンネルを運営。
                      <span className="text-white font-black">総フォロワー約10万人</span>のネットワークを構築。
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* 右：なぜ今「アプリ」なのか */}
            <div className="bg-gradient-to-br from-orange-600 to-orange-500 rounded-[3rem] p-10 border-4 border-orange-400 shadow-2xl">
              <h3 className="text-3xl font-black mb-8">💡 なぜ今「アプリ × AI」なのか？</h3>
              <div className="space-y-6 text-white/95 font-bold leading-relaxed">
                <p>
                  <span className="font-black text-2xl">20年間の結論：</span><br />
                  紙・WEB・動画は<span className="font-black underline decoration-white/70 underline-offset-4">「認知」には強い</span>。
                  しかし、<span className="font-black">「来店〜リピート」までの導線が弱い</span>。
                </p>

                <div className="bg-white/20 rounded-2xl p-6 border-l-4 border-white">
                  <p className="font-black text-xl mb-3">❌ 従来の課題</p>
                  <ul className="space-y-2">
                    <li>• チラシ：配布後の追跡ができない</li>
                    <li>• WEB：見てもらえても行動に繋がらない</li>
                    <li>• SNS：アルゴリズム次第で届かない</li>
                  </ul>
                </div>

                <div className="bg-white text-orange-600 rounded-2xl p-6 border-4 border-white shadow-xl">
                  <p className="font-black text-xl mb-3">✅ アプリ × AIの強み</p>
                  <ul className="space-y-2 font-black">
                    <li>• ユーザーの興味・行動データを分析</li>
                    <li>• 「今日行きたい店」をAIが自動マッチング</li>
                    <li>• クーポン・特典で来店動機を設計</li>
                    <li>• プッシュ通知で確実にリーチ</li>
                  </ul>
                </div>

                <p className="text-xl font-black italic border-t-2 border-white/30 pt-6">
                  20年の知見を、最新技術で実装する。<br />
                  それが「みんなのNasuアプリ」です。
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 背景装飾 */}
        <div className="absolute top-0 left-0 w-full h-full opacity-5 pointer-events-none">
          <div className="text-[20rem] font-black italic text-white/10 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 whitespace-nowrap">
            20 YEARS
          </div>
        </div>
      </section>

      {/* ============================================
          CEO MESSAGE（NEW）
          ============================================ */}
      <section className="py-28 md:py-36 px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-[4rem] overflow-hidden shadow-3xl border border-slate-700">
            <div className="p-12 md:p-16">
              <p className="text-orange-400 font-black tracking-[0.3em] uppercase text-sm mb-4">
                message from ceo
              </p>
              <h2 className="text-4xl md:text-5xl font-black text-white mb-8 italic tracking-tight">
                20周年、次の20年へ。
              </h2>

              <div className="flex flex-col md:flex-row gap-10 items-start">
                {/* 左：CEO写真（アイコン） */}
                <div className="flex-shrink-0">
                  <div className="w-32 h-32 md:w-40 md:h-40 rounded-full bg-gradient-to-br from-orange-600 to-orange-500 border-4 border-orange-400 flex items-center justify-center shadow-2xl">
                    <span className="text-6xl">👔</span>
                  </div>
                  <p className="mt-4 text-center text-white/60 font-bold text-sm">
                    株式会社adtown<br />
                    代表取締役
                  </p>
                </div>

                {/* 右：メッセージ */}
                <div className="flex-1 space-y-6 text-white/90 font-bold leading-relaxed text-lg">
                  <p>
                    創業から20年、私たちは那須地域の店舗様と共に歩んできました。
                  </p>

                  <p>
                    紙媒体からスタートし、WEB、YouTube、そして今回の
                    <span className="text-orange-400 font-black">「アプリ × AI」</span>へ。
                    <br />
                    形は変わっても、<span className="text-white font-black">「地元の店舗を輝かせたい」</span>
                    という想いは変わりません。
                  </p>

                  <div className="bg-orange-600/10 border-l-4 border-orange-500 p-6 rounded-r-2xl">
                    <p className="font-black text-white text-xl mb-3">なぜ今、アプリなのか？</p>
                    <p>
                      それは、これまでの広告手法では
                      <span className="text-white font-black">「認知で止まっていた」</span>からです。
                    </p>
                    <p className="mt-2">
                      アプリなら、来店〜リピートまでの導線を設計できる。
                      AIなら、"合う人"に確実に届けられる。
                    </p>
                  </div>

                  <p>
                    <span className="text-orange-400 font-black text-2xl">無料期間は設けません。</span>
                    <br />
                    本気で集客を変えたいオーナー様と、共に成長したいからです。
                  </p>

                  <p className="italic text-white/70 border-t border-white/20 pt-6">
                    20年の実績を、次の20年へ。<br />
                    みんなのNasuアプリで、那須の未来を一緒に作りましょう。
                  </p>

                  <div className="pt-4">
                    <p className="text-white font-black text-xl">株式会社adtown 代表取締役</p>
                    <p className="text-orange-400 font-black text-3xl mt-2 italic">石下かをり</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================
          PROBLEM
          ============================================ */}
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

      {/* ============================================
          SOLUTION: AIマッチング（強化版）
          ============================================ */}
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

          {/* 🆕 AIマッチングの仕組み（具体化） */}
          <div className="mt-14 max-w-4xl mx-auto bg-gradient-to-br from-slate-900 to-slate-800 rounded-[3rem] p-10 md:p-12 text-white border border-slate-700 shadow-2xl">
            <h3 className="text-3xl font-black mb-8 text-orange-400">🧠 AIマッチングの仕組み</h3>
            <div className="space-y-6 text-left">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-orange-600 rounded-full flex items-center justify-center font-black text-xl">1</div>
                <div>
                  <p className="font-black text-xl">ユーザーデータの分析</p>
                  <p className="text-white/70 font-bold mt-2">
                    興味・閲覧履歴・位置情報・過去の行動パターンをAIが自動分析
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-orange-600 rounded-full flex items-center justify-center font-black text-xl">2</div>
                <div>
                  <p className="font-black text-xl">店舗特性とマッチング</p>
                  <p className="text-white/70 font-bold mt-2">
                    料理ジャンル・価格帯・雰囲気・特典内容と、ユーザーの好みを照合
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-orange-600 rounded-full flex items-center justify-center font-black text-xl">3</div>
                <div>
                  <p className="font-black text-xl">最適なタイミングで配信</p>
                  <p className="text-white/70 font-bold mt-2">
                    「今日のおすすめ店舗」としてプッシュ通知 + クーポンを自動配信
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-8 bg-orange-600/10 border-2 border-orange-500/30 rounded-2xl p-6">
              <p className="font-black text-lg text-orange-300 mb-2">📍 具体例</p>
              <p className="text-white/80 font-bold">
                「イタリアン好き × 那須塩原在住 × 夜19時」のユーザーに、
                貴店のディナークーポンを<span className="text-white font-black">自動配信</span>
              </p>
            </div>
          </div>

          <div className="mt-14 grid md:grid-cols-2 lg:grid-cols-4 gap-10 text-left">
            <FeatureCard
              icon="🧠"
              title="AIマッチング"
              desc="ユーザーの興味・行動傾向に合わせて、店舗のLINEや特典をユーザーに自動誘導します。"
            />
            <FeatureCard
              icon="🎯"
              title="那須地域に限定"
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

      {/* ============================================
          TRUST: 提携企業ロゴ
          ============================================ */}
      <section className="py-20 md:py-28 px-6 bg-slate-50 overflow-hidden border-t border-slate-100">
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

      {/* ============================================
          OFFER: 価格・限定性
          ============================================ */}
      <section className="py-24 md:py-32 px-6 bg-white border-y border-slate-100">
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
                  <li>・クーポン/特典登録・管理</li>
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

          {/* ============================================
              FAQ（強化版）
              ============================================ */}
          <div className="mt-14">
            <h3 className="text-3xl md:text-4xl font-black tracking-tighter italic text-slate-900">よくある質問</h3>
            <div className="mt-8 grid md:grid-cols-2 gap-6">
              <Faq
                q="これは那須以外でも使えますか？"
                a="本LPのサービスは那須地域限定です（地域密着のため、配信効率を最大化できます）。"
              />
              <Faq
                q="プランは複数ありますか？"
                a="ワンプランのみです。登録後に決済（Stripe/請求書）へ進みます。"
              />
              <Faq
                q="AIマッチングとは何ですか？"
                a="地元ユーザーの興味・行動傾向に合う形で、店舗のLINEや特典をユーザーに自動誘導することです。"
              />
              <Faq
                q="紹介報酬はどのように支払われますか？"
                a="月末締め翌月15日に、指定口座へ振込されます。有料ユーザー継続売上（税抜）の30%が報酬です。"
              />
              <Faq
                q="解約はできますか？"
                a="はい。管理画面よりいつでも解約手続きが可能です（規約に基づき日割り返金はありません）。"
              />
              <Faq
                q="新しいサービスなのに、なぜ実績を信じられるのですか？"
                a="みんなのNasuアプリは「新規事業」ですが、運営する株式会社adtownは創業20年、那須地域で1000社+の集客支援実績があります。紙・WEB・YouTubeで培った知見を、アプリ×AIに集約したサービスです。"
              />
              <Faq
                q="他社のアプリサービスとの違いは？"
                a="①那須地域限定で配信効率を最大化 ②20年の地域ネットワーク ③紹介報酬30%還元（広告費を収益化できる） ④AIマッチングで「来店確度の高い人」に絞って届ける、という4点が最大の差別化です。"
              />
              <Faq
                q="本当に効果が出るか不安です..."
                a="その不安は当然です。だからこそ、①いつでも解約OK ②紹介報酬で実質コスト削減 ③LINEサポート完備、という3つの安心設計にしました。また、先行100社は¥5,500で固定（値上げ後も据え置き）なので、早期参加のメリットは大きいです。"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ============================================
          SIGNUP FORM
          ============================================ */}
      <section ref={formRef} id="signup" className="py-20 md:py-28 px-6 bg-[#0a0a0a] text-white relative border-t border-white/5">
        <div className="max-w-2xl mx-auto relative z-10">
          {/* ヘッダー */}
          <div className="text-center mb-10">
            <p className="text-xs font-semibold text-amber-400 tracking-[0.25em] uppercase mb-3">join the program</p>
            <h3 className="text-3xl md:text-4xl font-bold text-white tracking-tight">パートナー登録</h3>
            <div className="mt-4 inline-flex items-baseline gap-3 bg-white/[0.04] border border-white/10 px-8 py-4 rounded-xl">
              <span className="text-white/30 text-sm line-through">月額 ¥{PRICE.regular.toLocaleString()}</span>
              <span className="text-3xl font-black text-white">¥{PRICE.campaign.toLocaleString()}</span>
              <span className="text-white/40 text-sm">{PRICE.taxLabel} / 月</span>
              <span className="bg-red-500/80 text-white text-xs font-bold px-2 py-0.5 rounded-md animate-pulse">残{PRICE.remaining}枠</span>
            </div>
            <p className="mt-3 text-white/30 text-xs">ワンプランのみ。登録後に決済（Stripe/請求書）へ進みます。</p>
          </div>

          {/* フォーム */}
          <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-8 md:p-10">
            <form onSubmit={handleSignup} className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-white/40 uppercase tracking-widest">店舗・企業名 *</label>
                <input
                  type="text"
                  autoComplete="organization"
                  placeholder="株式会社〇〇 / カフェ〇〇"
                  required
                  className="w-full p-4 bg-white/5 border border-white/10 rounded-xl text-white outline-none focus:border-amber-500/50 focus:bg-white/[0.07] transition-all placeholder:text-white/20 text-sm"
                  value={formData.storeName}
                  onChange={(e) => setFormData({ ...formData, storeName: e.target.value })}
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-white/40 uppercase tracking-widest">ご担当者名 *</label>
                  <input
                    type="text"
                    autoComplete="name"
                    placeholder="山田 太郎"
                    required
                    className="w-full p-4 bg-white/5 border border-white/10 rounded-xl text-white outline-none focus:border-amber-500/50 focus:bg-white/[0.07] transition-all placeholder:text-white/20 text-sm"
                    value={formData.contactPerson}
                    onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-white/40 uppercase tracking-widest">所在地（那須エリア） *</label>
                  <input
                    type="text"
                    autoComplete="street-address"
                    placeholder="那須塩原市〇〇町 1-2"
                    required
                    className="w-full p-4 bg-white/5 border border-white/10 rounded-xl text-white outline-none focus:border-amber-500/50 focus:bg-white/[0.07] transition-all placeholder:text-white/20 text-sm"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-white/40 uppercase tracking-widest">メールアドレス *</label>
                  <input
                    type="email"
                    autoComplete="email"
                    placeholder="mail@example.com"
                    required
                    disabled={!!authUser}
                    className="w-full p-4 bg-white/5 border border-white/10 rounded-xl text-white outline-none focus:border-amber-500/50 focus:bg-white/[0.07] transition-all placeholder:text-white/20 text-sm disabled:opacity-40 disabled:cursor-not-allowed"
                    value={authUser ? authUser.email || '' : formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                  {authUser && (
                    <p className="text-xs text-white/30">※ログイン済みのアカウントを使用します</p>
                  )}
                </div>

                {!authUser && (
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-white/40 uppercase tracking-widest">メールアドレス（確認） *</label>
                    <input
                      type="email"
                      autoComplete="off"
                      placeholder="再入力してください"
                      required
                      className="w-full p-4 bg-white/5 border border-white/10 rounded-xl text-white outline-none focus:border-amber-500/50 focus:bg-white/[0.07] transition-all placeholder:text-white/20 text-sm"
                      value={formData.confirmEmail}
                      onChange={(e) => setFormData({ ...formData, confirmEmail: e.target.value })}
                    />
                  </div>
                )}
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-white/40 uppercase tracking-widest">電話番号 *</label>
                  <input
                    type="tel"
                    autoComplete="tel"
                    placeholder="0287-XX-XXXX"
                    required
                    className="w-full p-4 bg-white/5 border border-white/10 rounded-xl text-white outline-none focus:border-amber-500/50 focus:bg-white/[0.07] transition-all placeholder:text-white/20 text-sm"
                    value={formData.phoneNumber}
                    onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                  />
                </div>

                {!authUser && (
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-white/40 uppercase tracking-widest">パスワード *</label>
                    <input
                      type="password"
                      autoComplete="new-password"
                      placeholder="8文字以上推奨"
                      required
                      minLength={8}
                      className="w-full p-4 bg-white/5 border border-white/10 rounded-xl text-white outline-none focus:border-amber-500/50 focus:bg-white/[0.07] transition-all placeholder:text-white/20 text-sm"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    />
                  </div>
                )}
              </div>

              <div className="p-5 bg-amber-500/5 rounded-xl border border-amber-500/15">
                <p className="text-white/30 mb-4 leading-relaxed text-xs">
                  ※登録完了後、決済ページへ遷移します。クレジットカード（Stripe）または請求書払いでご利用いただけます。
                </p>

                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    className="mt-0.5 w-5 h-5 rounded accent-amber-500 cursor-pointer flex-shrink-0"
                    checked={formData.agree}
                    onChange={(e) => setFormData({ ...formData, agree: e.target.checked })}
                  />
                  <span
                    className="text-sm text-white/60 hover:text-amber-400 transition-colors cursor-pointer underline underline-offset-4 decoration-white/20"
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
                className="w-full py-5 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white text-lg font-bold rounded-xl shadow-[0_8px_32px_rgba(234,88,12,0.4)] transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {loading ? '通信中...' : '登録して決済へ進む'}
              </button>

              <p className="text-center text-white/20 text-xs">
                登録は1分程度。完了後に決済（ワンプラン）へ進みます。
              </p>
            </form>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 w-full overflow-hidden whitespace-nowrap opacity-[0.04] select-none pointer-events-none">
          <p className="text-[18rem] md:text-[22rem] font-black italic tracking-tighter leading-none">NASU × AI × LOCAL</p>
        </div>
      </section>

      {/* ============================================
          利用規約モーダル
          ============================================ */}
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

      {/* ============================================
          FOOTER
          ============================================ */}
      <footer className="bg-slate-950 py-24 px-6 text-center text-slate-500 font-bold border-t border-white/5">
        <div className="max-w-7xl mx-auto space-y-14">
          <div className="flex flex-col md:flex-row justify-center items-center gap-10 text-slate-400 text-sm md:text-base italic uppercase tracking-widest">
            <Link href="/company" className="hover:text-white transition-colors">
              Company
            </Link>
            <Link href="/privacy" className="hover:text-white transition-colors">
              Privacy Policy
            </Link>
            <Link href="/sctl" className="hover:text-white transition-colors">
              SCTL（特商法）
            </Link>
            <Link href="/support" className="hover:text-white transition-colors">
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
              本プロジェクトは株式会社adtownの<span className="font-black">20周年記念事業</span>として運営されています。那須地域の持続可能な発展を目指し、AIと地域住民が共生する新しいマーケティングエコシステムを構築します。
            </p>
            <p className="text-xs tracking-[0.3em] opacity-40 pt-6">© 2026 adtown CO., LTD. ALL RIGHTS RESERVED.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
