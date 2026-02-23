/**
 * recruit/index.tsx - 完全改善版
 * 株式会社adtown 20周年記念事業 - AI求人マッチングサービス
 * 
 * 改善ポイント:
 * 1. adtown社の20年実績を前面に押し出し
 * 2. 無料掲載の「なぜ」を明確化（AI学習データ収集）
 * 3. 視覚的インパクトの強化（グラデーション、アニメーション）
 * 4. AIマッチングの仕組みを具体化
 * 5. 数字による信頼性訴求（登録者数、フォロワー数）
 * 6. CEO メッセージで人間味と信頼性を追加
 */

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Head from 'next/head';
import { NextPage } from 'next';

// --- 画像パス・定数定義 ---
const PARTNER_LOGOS = [
  '/images/partner-adtown.png', '/images/partner-aquas.png', '/images/partner-celsiall.png',
  '/images/partner-dairin.png', '/images/partner-kanon.png', '/images/partner-kokoro.png',
  '/images/partner-meithu.png', '/images/partner-midcityhotel.png', '/images/partner-omakaseauto.png',
  '/images/partner-poppo.png', '/images/partner-sekiguchi02.png', '/images/partner-training_farm.png',
  '/images/partner-transunet.png', '/images/partner-koharu.png', '/images/partner-yamakiya.png'
];

const NASU_APP_LP_URL = 'https://minna-no-nasu-app.netlify.app/';

// --- アイコンコンポーネント ---
const UsersIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
    <circle cx="9" cy="7" r="4"></circle>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
    <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
  </svg>
);

const CheckCircleIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
    <polyline points="22 4 12 14.01 9 11.01"></polyline>
  </svg>
);

const XCircleIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <circle cx="12" cy="12" r="10"></circle>
    <line x1="15" y1="9" x2="9" y2="15"></line>
    <line x1="9" y1="9" x2="15" y2="15"></line>
  </svg>
);

const ChevronDownIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <polyline points="6 9 12 15 18 9"></polyline>
  </svg>
);



// --- コンポーネント: FAQアイテム ---
const FAQItem = ({ question, children }: { question: string, children: React.ReactNode }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="border-b border-white/5 last:border-0">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full text-left py-6 flex justify-between items-center group focus:outline-none"
      >
        <div className="flex gap-4 items-center">
          <span className="flex-shrink-0 w-8 h-8 bg-blue-600/10 border border-blue-600/20 text-blue-400 rounded-lg flex items-center justify-center text-xs font-bold tracking-tighter">Q</span>
          <span className="text-lg font-bold text-white/90 group-hover:text-blue-400 transition-colors">{question}</span>
        </div>
        <div className={`w-8 h-8 rounded-full border border-white/10 flex items-center justify-center transition-all duration-300 ${isOpen ? 'bg-blue-600 border-blue-500 rotate-180' : 'bg-white/5'}`}>
          <ChevronDownIcon className={`w-4 h-4 ${isOpen ? 'text-white' : 'text-white/30'}`} />
        </div>
      </button>
      <div className={`overflow-hidden transition-all duration-500 ease-in-out ${isOpen ? 'max-h-[800px] opacity-100 pb-8' : 'max-h-0 opacity-0'}`}>
        <div className="flex gap-4 p-6 bg-blue-600/5 rounded-2xl border border-blue-500/10">
          <span className="flex-shrink-0 w-8 h-8 bg-white/5 border border-white/10 text-white/40 rounded-lg flex items-center justify-center text-xs font-bold tracking-tighter">A</span>
          <div className="text-white/70 leading-relaxed text-sm font-medium">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

// --- 統計カード ---
const StatCard = ({ number, label }: { number: string; label: string }) => (
  <div className="text-center group py-2">
    <p className="text-5xl md:text-7xl font-black bg-gradient-to-br from-blue-300 to-indigo-500 bg-clip-text text-transparent group-hover:scale-105 transition-transform inline-block">{number}</p>
    <p className="mt-2 text-white/60 text-sm font-medium tracking-wide">{label}</p>
  </div>
);

// --- 課題カード ---
const TroubleCard = ({ icon, title, desc }: { icon: string; title: string; desc: string }) => (
  <div className="bg-white/[0.04] rounded-3xl p-8 border border-white/10 hover:border-blue-500/30 hover:bg-white/[0.07] transition-all duration-500 group overflow-hidden relative">
    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/0 to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
    <div className="relative z-10">
      <div className="text-5xl mb-6 group-hover:scale-110 transition-transform inline-block">{icon}</div>
      <h4 className="text-xl font-bold text-white tracking-tight mb-4">{title}</h4>
      <p className="text-white/50 leading-relaxed text-sm font-medium">{desc}</p>
    </div>
  </div>
);

// --- カスタムフック: 永続化ステート ---
function usePersistentState<T>(key: string, defaultValue: T): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [state, setState] = useState<T>(defaultValue);

  useEffect(() => {
    const stored = window.sessionStorage.getItem(key);
    if (stored) {
      try {
        setState(JSON.parse(stored));
      } catch (e) {
        console.error("SessionStorage Parse Error", e);
      }
    }
  }, [key]);

  useEffect(() => {
    window.sessionStorage.setItem(key, JSON.stringify(state));
  }, [key, state]);

  return [state, setState];
}

// --- メインページコンポーネント ---
const RecruitSignupPage: NextPage = () => {
  // フォームステート
  const [companyName, setCompanyName] = usePersistentState('recruit_company', '');
  const [address, setAddress] = usePersistentState('recruit_address', '');
  const [area, setArea] = usePersistentState('recruit_area', '');
  const [contactPerson, setContactPerson] = usePersistentState('recruit_contact', '');
  const [phoneNumber, setPhoneNumber] = usePersistentState('recruit_phone', '');
  const [email, setEmail] = usePersistentState('recruit_email', '');
  const [confirmEmail, setConfirmEmail] = usePersistentState('recruit_confirmEmail', '');
  const [password, setPassword] = usePersistentState('recruit_password', '');
  const [agreed, setAgreed] = usePersistentState('recruit_agreed', false);

  // システムステート
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showTerms, setShowTerms] = useState(false);
  const registrationFormRef = useRef<HTMLDivElement>(null);

  // キャンペーン設定
  const registeredCount = 47;
  const totalSlots = 100;
  const remainingSlots = totalSlots - registeredCount;

  // 住所からエリアを自動判定
  useEffect(() => {
    const match = address.match(/(那須塩原市|那須郡那須町|那須町|大田原市)/);
    if (match) {
      setArea(match[0].replace('那須郡', ''));
    } else {
      setArea('');
    }
  }, [address, setArea]);

  const scrollToForm = () => {
    registrationFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const isFormValid = (
    companyName && contactPerson && address && phoneNumber &&
    email && (email === confirmEmail) && password.length >= 6 && area && agreed
  );

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!isFormValid) {
      setError('入力内容に不備があるか、規約に同意していません。');
      return;
    }

    setIsLoading(true);
    try {
      // ステップ1: パートナー登録
      const registerResponse = await fetch('/api/auth/register-partner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serviceType: 'recruit',
          companyName, address, area, contactPerson, phoneNumber, email, password
        }),
      });

      const registerData = await registerResponse.json();
      if (!registerResponse.ok) throw new Error(registerData.error || '登録に失敗しました。');

      // ステップ2: 決済セッション作成
      const paymentResponse = await fetch('/api/payment/create-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          partnerId: registerData.partnerId,
          plan: 'recruit-6600',
          amount: 6600,
          successUrl: `${window.location.origin}/partner/login?payment_success=true&partnerId=${registerData.partnerId}`,
          cancelUrl: `${window.location.origin}/recruit?payment_cancelled=true`
        }),
      });

      const paymentData = await paymentResponse.json();
      if (!paymentResponse.ok) throw new Error(paymentData.error || '決済セッション作成に失敗しました。');

      // ステップ3: 決済ページへリダイレクト
      if (paymentData.url) {
        window.location.href = paymentData.url;
      } else {
        throw new Error('決済ページのURLが返されませんでした。');
      }
    } catch (err: any) {
      setError(err.message);
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-[#0a0a0a] text-white font-sans selection:bg-blue-900/40 overflow-x-hidden antialiased">
      <Head>
        <title>【公式】AI求人パートナー登録｜月額6,600円でAI採用マッチング｜みんなの那須アプリ（株式会社adtown 20周年記念事業）</title>
        <meta name="description" content="株式会社adtown 20周年記念事業。20年間で1000社+の採用を支援してきた実績を、アプリ×AIに集約。那須地域密着のAIマッチングで理想の人材を月額6,600円でご利用。" />
      </Head>

      {/* --- Sticky Bar --- */}
      <div className="bg-black/95 backdrop-blur-xl text-white py-3 text-center text-xs font-medium tracking-[0.18em] uppercase sticky top-0 z-[100] border-b border-white/10">
        <span className="text-white/50">那須地域限定</span>
        <span className="mx-3 text-white/20">|</span>
        <span className="text-blue-400 font-semibold text-[10px] md:text-xs">AI求人マッチング</span>
        <span className="mx-3 text-white/20">|</span>
        <span className="text-white/70">先着{totalSlots}社限定割引</span>
        <span className="ml-3 inline-flex items-center gap-1 bg-blue-600 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full animate-pulse">残{remainingSlots}枠</span>
      </div>

      {/* --- ヘッダー --- */}
      <header className="bg-black/80 backdrop-blur-lg sticky top-10 md:top-11 z-50 border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 h-16 md:h-20 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="bg-gradient-to-br from-blue-600 to-indigo-600 text-white px-2.5 py-1 rounded-lg font-bold text-[10px] md:text-xs tracking-tighter shadow-lg shadow-blue-500/20">那須</div>
            <span className="font-extrabold text-lg md:text-xl tracking-tighter text-white">AIマッチング求人</span>
          </div>
          <button
            onClick={scrollToForm}
            className="bg-white/5 hover:bg-white/10 text-white border border-white/10 px-6 py-2 rounded-full font-bold text-xs transition-all active:scale-95 backdrop-blur-sm"
          >
            掲載を申し込む
          </button>
        </div>
      </header>

      <main>
        {/* ============================================
            HERO：20周年実績 + 信頼性を最初に
            ============================================ */}
        <section className="relative min-h-screen flex items-center bg-[#0a0a0a] overflow-hidden border-b border-white/5">
          <div className="max-w-7xl mx-auto px-6 py-24 text-center relative z-10">

            {/* 20周年記念バッジ */}
            <div className="mb-12 animate-fade-in">
              <div className="inline-flex flex-col items-center gap-3 px-10 py-6 rounded-2xl border border-amber-500/30 bg-amber-500/5 backdrop-blur-sm">
                <div className="flex items-center gap-4">
                  <div className="text-left">
                    <p className="text-sm font-medium tracking-[0.25em] text-amber-400/80 uppercase mb-1">株式会社adtown</p>
                    <p className="text-2xl md:text-3xl font-bold tracking-tight text-white leading-none"><span className="bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">20周年</span>記念事業</p>
                  </div>
                </div>
                <p className="text-xs text-white/30 tracking-[0.3em] uppercase">2006–2026 · 20 Years of Innovation</p>
              </div>
            </div>

            {/* adtown社の実績数字 */}
            <div className="mt-8 max-w-5xl mx-auto rounded-[2rem] border border-white/10 bg-white/[0.03] backdrop-blur-sm divide-x divide-white/10 flex flex-col md:flex-row shadow-2xl overflow-hidden">
              <div className="flex-1 px-8 py-8">
                <StatCard number="20年" label="那須の集客実績" />
              </div>
              <div className="flex-1 px-8 py-8 border-t md:border-t-0 border-white/10">
                <StatCard number="1000社+" label="累計取引社数" />
              </div>
              <div className="flex-1 px-8 py-8 border-t md:border-t-0 border-white/10">
                <StatCard number="1億部" label="情報誌発行実績" />
              </div>
            </div>

            <div className="mt-8 max-w-2xl mx-auto">
              <p className="text-white/40 text-sm leading-relaxed font-medium">
                紙媒体・WEB・YouTubeで那須地域のビジネスを20年支援してきた株式会社adtownが、その採用知見を集約した「求人アプリ × AI」の新サービスです。
              </p>
            </div>

            <div className="mt-12 flex flex-wrap items-center justify-center gap-3">
              <span className="bg-blue-500/10 text-blue-400 border border-blue-500/20 px-5 py-2 rounded-full text-[10px] md:text-xs font-medium tracking-[0.18em] uppercase">
                先着100社限定キャンペーン
              </span>
              <span className="bg-white/5 text-white/50 border border-white/10 px-5 py-2 rounded-full text-[10px] md:text-xs font-medium tracking-[0.18em] uppercase">
                AI採用マッチング搭載
              </span>
              <span className="bg-white/5 text-white/50 border border-white/10 px-5 py-2 rounded-full text-[10px] md:text-xs font-medium tracking-[0.18em] uppercase">
                成功報酬 0円
              </span>
            </div>

            {/* キャッチコピー */}
            <h1 className="text-5xl md:text-7xl lg:text-[8rem] font-black leading-[1] tracking-tighter mt-10 text-white italic">
              那須の採用を、<br />
              <span className="bg-gradient-to-r from-blue-400 via-indigo-500 to-blue-600 bg-clip-text text-transparent">AIでスマートに。</span>
            </h1>

            <p className="mt-8 text-base md:text-xl text-white/40 max-w-2xl mx-auto leading-relaxed font-bold italic">
              20年の地域実績 × 最新AI。<br />
              「いい人」を、もっと効率よく、確実に。
            </p>

            <div className="mt-16 flex flex-col items-center gap-4">
              <button
                onClick={scrollToForm}
                className="mt-8 px-12 py-5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-lg font-bold rounded-xl shadow-[0_8px_32px_rgba(37,99,235,0.4)] transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0"
              >
                月額6,600円で掲載を申し込む
              </button>
              <p className="mt-3 text-white/20 text-xs tracking-widest uppercase">運営：株式会社adtown（20周年記念事業）</p>
            </div>
          </div>

          {/* 背景装飾 */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80vw] h-[80vw] bg-blue-600/5 rounded-full blur-[160px] -z-10 pointer-events-none"></div>
        </section>

        {/* --- キャンペーンバナー --- */}
        <section className="py-20 px-6 bg-[#0a0a0a] relative overflow-hidden">
          <div className="max-w-4xl mx-auto relative z-10">
            <div className="rounded-[3rem] p-1 bg-gradient-to-br from-blue-500/50 via-indigo-500/50 to-blue-600/50 shadow-2xl">
              <div className="bg-[#111111] rounded-[2.9rem] p-10 md:p-16 text-center backdrop-blur-3xl">
                <p className="text-blue-400 font-black tracking-[0.3em] uppercase text-xs mb-6">anniversary offer</p>
                <h3 className="text-3xl md:text-5xl font-black text-white mb-10 italic tracking-tighter">
                  先着100社限定キャンペーン
                </h3>
                
                <div className="mb-12 flex flex-col md:flex-row items-center justify-center gap-10">
                  <div className="text-center opacity-40">
                    <p className="text-white font-bold text-xs uppercase tracking-widest mb-1">定価</p>
                    <p className="text-3xl font-black text-white line-through">¥10,000</p>
                  </div>
                  <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center border border-white/10">
                    <span className="text-2xl text-white/20">→</span>
                  </div>
                  <div className="text-center">
                    <p className="text-blue-400 font-bold text-xs uppercase tracking-widest mb-1">キャンペーン価格</p>
                    <div className="flex items-baseline gap-2">
                      <p className="text-6xl md:text-7xl font-black text-white">¥6,600</p>
                      <span className="text-base text-white/40">税込 / 月</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap justify-center gap-4">
                  <div className="flex items-center gap-3 bg-white/5 border border-white/10 px-6 py-3 rounded-full">
                    <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                    <span className="text-sm font-bold text-white/70">現在 {registeredCount} 社が登録済み</span>
                  </div>
                  <div className="flex items-center gap-3 bg-blue-600 text-white px-6 py-3 rounded-full shadow-lg shadow-blue-600/20">
                    <span className="text-sm font-bold tracking-widest uppercase">残り {remainingSlots} 枠</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/10 rounded-full blur-[120px] -z-10" />
        </section>

        {/* --- 使いやすさ・柔軟性セクション --- */}
        <section className="py-24 px-6 bg-white border-y border-white/5">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <p className="text-indigo-600 font-black tracking-[0.3em] uppercase text-sm mb-4">flexibility</p>
              <h2 className="text-4xl md:text-6xl font-black text-slate-900 italic tracking-tighter">
                求人のオンオフで、<br />自由自在な採用運用
              </h2>
            </div>

            <div className="grid md:grid-cols-3 gap-8 mb-12">
              <div className="bg-slate-50 rounded-[2.5rem] p-10 border border-slate-100 hover:shadow-xl transition-all duration-500">
                <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-4xl mb-8 shadow-sm">🎛️</div>
                <h4 className="text-xl font-black text-slate-900 mb-4 tracking-tight">管理が驚くほど簡単</h4>
                <p className="text-slate-500 font-medium leading-relaxed">
                  求人がない期間は「一時停止」ボタンを押すだけ。再募集が必要になるまで、余計なコストは一切かかりません。
                </p>
              </div>

              <div className="bg-slate-50 rounded-[2.5rem] p-10 border border-slate-100 hover:shadow-xl transition-all duration-500">
                <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-4xl mb-8 shadow-sm">⚡</div>
                <h4 className="text-xl font-black text-slate-900 mb-4 tracking-tight">必要な時だけ即時ON</h4>
                <p className="text-slate-500 font-medium leading-relaxed">
                  欠員が出たら、いつでも「公開」に切り替え可能。AIが即座に最適な求職者へのマッチングを開始します。
                </p>
              </div>

              <div className="bg-slate-50 rounded-[2.5rem] p-10 border border-slate-100 hover:shadow-xl transition-all duration-500">
                <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-4xl mb-8 shadow-sm">💰</div>
                <h4 className="text-xl font-black text-slate-900 mb-4 tracking-tight">採用コストの最適化</h4>
                <p className="text-slate-500 font-medium leading-relaxed">
                  繁忙期だけのスポット採用や、長期の安定募集など、貴社の採用計画に合わせた柔軟な運用が可能です。
                </p>
              </div>
            </div>

            <div className="bg-slate-900 rounded-[3rem] p-10 md:p-16 border border-slate-700 shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/10 rounded-full blur-[80px] -z-10 group-hover:bg-indigo-600/20 transition-colors duration-700" />
              <div className="flex flex-col md:flex-row items-center gap-12 text-center md:text-left">
                <div className="flex-shrink-0 w-24 h-24 bg-white/5 rounded-full border border-white/10 flex items-center justify-center text-5xl">📋</div>
                <div>
                  <h4 className="text-2xl font-black text-white mb-6">採用シーンに合わせた運用例</h4>
                  <div className="space-y-4">
                    <div className="flex items-start gap-4">
                      <span className="text-indigo-400 font-black">●</span>
                      <p className="text-white/70 font-bold"><span className="text-white">春の採用シーズン</span>：求人を「ON」にして、新卒・転職希望者を積極採用</p>
                    </div>
                    <div className="flex items-start gap-4">
                      <span className="text-indigo-400 font-black">●</span>
                      <p className="text-white/70 font-bold"><span className="text-white">夏の落ち込み期</span>：一時停止で費用をカット。システムにはデータを蓄積中</p>
                    </div>
                    <div className="flex items-start gap-4">
                      <span className="text-indigo-400 font-black">●</span>
                      <p className="text-white/70 font-bold"><span className="text-white">急な欠員時</span>：再開ボタンで即、AIが最適な候補者に自動プッシュ通知</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* --- みんなのNasuアプリ登録促進 --- */}
        <section className="py-24 px-6 bg-slate-50">
          <div className="max-w-7xl mx-auto">
            <div className="bg-white rounded-[4rem] shadow-2xl border border-slate-100 overflow-hidden">
              <div className="p-12 md:p-20 flex flex-col lg:flex-row items-center gap-16">
                <div className="lg:w-1/2">
                  <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center text-white text-3xl mb-8 shadow-lg shadow-blue-500/20">
                    <UsersIcon />
                  </div>
                  <h3 className="text-4xl md:text-5xl font-black text-slate-900 leading-[1.1] mb-8 tracking-tighter italic">
                    那須地域の<br />求職者登録、急増中。
                  </h3>
                  <p className="text-slate-500 font-medium text-lg leading-relaxed mb-10">
                    すでに先行で<span className="text-slate-900 font-black">1,000人以上</span>がアプリを利用中。さらに地元インフルエンサー（総フォロワー約10万人）との提携により、日々新しい求職者が集まっています。
                  </p>
                  
                  <div className="grid grid-cols-2 gap-4 mb-10">
                    <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
                      <p className="text-xs font-bold text-slate-400 tracking-widest uppercase mb-2">総リーチ人数</p>
                      <p className="text-3xl font-black text-slate-900 italic">100k +</p>
                    </div>
                    <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
                      <p className="text-xs font-bold text-slate-400 tracking-widest uppercase mb-2">先行登録</p>
                      <p className="text-3xl font-black text-slate-900 italic">1,000 +</p>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-4">
                    <a
                      href={NASU_APP_LP_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex justify-center items-center px-10 py-5 bg-slate-900 text-white font-bold rounded-2xl hover:bg-slate-800 transition-all shadow-xl active:scale-95"
                    >
                      アプリの状況を確認する
                    </a>
                  </div>
                </div>

                <div className="lg:w-1/2 relative">
                  <div className="aspect-square bg-gradient-to-br from-blue-500 to-indigo-600 rounded-[3rem] p-1 shadow-2xl relative z-10 overflow-hidden group">
                    <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors duration-700" />
                    <div className="h-full bg-white/10 backdrop-blur-2xl flex flex-col items-center justify-center text-white p-10 text-center">
                      <p className="text-xs font-black tracking-[0.4em] uppercase mb-4 text-blue-200">matching engine</p>
                      <p className="text-3xl md:text-4xl font-black italic tracking-tighter leading-tight">
                        AIが求職者と貴社を<br /><span className="text-blue-200 underline decoration-blue-200/30 underline-offset-8">最短ルート</span>で結ぶ
                      </p>
                    </div>
                  </div>
                  {/* 装飾 */}
                  <div className="absolute -top-10 -right-10 w-40 h-40 bg-blue-100 rounded-full blur-3xl -z-10" />
                  <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-indigo-100 rounded-full blur-3xl -z-10" />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ============================================
            TRUST: adtown社の20年実績
            ============================================ */}
        <section className="py-32 md:py-48 bg-[#0a0a0a] text-white px-6 relative overflow-hidden">
          <div className="max-w-7xl mx-auto relative z-10">
            <div className="text-center mb-24">
              <p className="text-blue-400 font-black tracking-[0.4em] uppercase text-xs mb-6">heritage & trust</p>
              <h2 className="text-5xl md:text-8xl font-black italic tracking-tighter leading-none mb-8">
                那須で20年。<br />
                <span className="bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent">「届ける」</span>にこだわってきました
              </h2>
              <p className="max-w-3xl mx-auto text-white/40 text-lg font-medium leading-relaxed italic">
                私たちはただの広告会社ではありません。20年間、地域の企業様と膝を突き合わせ、どうすれば理想の顧客、そして理想の採用に出会えるかを追求し続けてきました。
              </p>
            </div>

            <div className="grid lg:grid-cols-2 gap-12 items-stretch">
              {/* 左：これまでの実績 */}
              <div className="bg-white/[0.03] rounded-[3.5rem] p-12 md:p-16 border border-white/10 backdrop-blur-sm shadow-2xl">
                <h3 className="text-2xl font-black mb-12 text-blue-400 tracking-tight flex items-center gap-4">
                  <span className="w-12 h-0.5 bg-blue-400 rounded-full" />
                  実績の集積
                </h3>
                <div className="space-y-12">
                  <div className="flex items-start gap-8">
                    <span className="text-5xl opacity-80">📖</span>
                    <div>
                      <p className="font-black text-xl mb-3 text-white">地域情報誌・求人チラシ</p>
                      <p className="text-white/40 font-medium leading-relaxed">
                        <span className="text-white font-bold">累計1000社以上</span>の制作実績。企業様の「真の魅力」を言語化し、紙媒体の強みである信頼性を最大限に引き出してきました。
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-8">
                    <span className="text-5xl opacity-80">📱</span>
                    <div>
                      <p className="font-black text-xl mb-3 text-white">デジタルマーケティング</p>
                      <p className="text-white/40 font-medium leading-relaxed">
                        SNS広告やWEBサイト制作を通じた<span className="text-white font-bold">トータルサポート</span>。時代の変化に合わせ、最新の採用手法を提供してきました。
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-8">
                    <span className="text-5xl opacity-80">🎬</span>
                    <div>
                      <p className="font-black text-xl mb-3 text-white">企業ブランディング動画</p>
                      <p className="text-white/40 font-medium leading-relaxed">
                        YouTubeで培ったストーリーテリングの技術を、<span className="text-white font-bold">採用ブランディング</span>に応用。求職者の心に響く発信を支援しています。
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* 右：なぜ今「アプリ × AI」なのか */}
              <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-[3.5rem] p-12 md:p-16 text-white border border-blue-400 shadow-[0_32px_64px_rgba(37,99,235,0.3)] flex flex-col justify-between relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2" />
                <div className="relative z-10">
                  <h3 className="text-3xl font-black mb-10 leading-tight">なぜ今、<br /><span className="text-blue-100 italic">「アプリ × AI」</span>なのか？</h3>
                  
                  <div className="space-y-8 mb-12">
                    <div className="bg-black/10 backdrop-blur-md rounded-3xl p-8 border border-white/10">
                      <p className="text-lg font-black mb-4 flex items-center gap-3">
                        <span className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-sm">❗</span>
                        従来の広告課題
                      </p>
                      <ul className="space-y-3 text-sm text-blue-100/70 font-bold">
                        <li>• 高額な掲載費用と不透明な効果</li>
                        <li>• 価値観の不一致による早期離職</li>
                        <li>• 管理の手間と情報の陳腐化</li>
                      </ul>
                    </div>

                    <div className="bg-white text-blue-900 rounded-3xl p-8 shadow-2xl">
                      <p className="text-lg font-black mb-4 flex items-center gap-3">
                        <span className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-sm text-blue-600">✓</span>
                        AIマッチングの回答
                      </p>
                      <ul className="space-y-3 text-sm font-black">
                        <li>• 6,600円の一括払い × 成功報酬なし</li>
                        <li>• AIが価値観の適合性を事前に評価</li>
                        <li>• プッシュ通知による「攻め」の採用</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <p className="text-xl font-black italic border-t border-white/20 pt-8 mt-auto relative z-10">
                  20年の実績を、<br />
                  最先端の技術でアップデート。
                </p>
              </div>
            </div>
          </div>

          <div className="absolute bottom-0 left-0 w-full h-[50vh] bg-gradient-to-t from-blue-600/5 to-transparent pointer-events-none" />
        </section>

        {/* ============================================
            CEO MESSAGE
            ============================================ */}
        <section className="py-32 md:py-48 px-6 bg-white overflow-hidden relative">
          <div className="max-w-5xl mx-auto relative z-10">
            <div className="bg-[#0a0a0a] rounded-[4rem] overflow-hidden shadow-[0_48px_96px_rgba(0,0,0,0.4)] border border-white/5 relative">
              <div className="absolute top-0 right-0 w-[40vw] h-[40vw] bg-blue-600/5 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2" />
              
              <div className="p-12 md:p-24 relative z-10">
                <div className="flex flex-col md:flex-row gap-16 items-start">
                  {/* 左：CEO写真（アイコンっぽく） */}
                  <div className="md:sticky md:top-32 flex-shrink-0">
                    <div className="relative group">
                      <div className="absolute inset-0 bg-blue-600/20 rounded-full blur-2xl group-hover:bg-blue-600/40 transition-colors duration-700" />
                      <div className="w-40 h-40 md:w-56 md:h-56 rounded-full bg-gradient-to-br from-blue-600 to-indigo-700 border-2 border-blue-400/30 flex items-center justify-center shadow-2xl relative z-10">
                        <span className="text-7xl md:text-8xl">👔</span>
                      </div>
                    </div>
                    <div className="mt-8 text-center md:text-left">
                      <p className="text-white font-black text-2xl mb-1">石下 かをり</p>
                      <p className="text-blue-400 font-bold text-xs uppercase tracking-widest">Kaori Ishige / CEO</p>
                    </div>
                  </div>

                  {/* 右：メッセージ */}
                  <div className="flex-1">
                    <p className="text-blue-400 font-black tracking-[0.4em] uppercase text-xs mb-8">visionary leadership</p>
                    <h2 className="text-4xl md:text-6xl font-black text-white mb-12 italic tracking-tighter leading-tight">
                      20年の信頼を、<br />次の世代の「採用」へ。
                    </h2>
                    
                    <div className="space-y-8 text-white/50 font-medium leading-relaxed text-lg italic">
                      <p>
                        20年、私たちは一貫して「人が集まり、地域が活性化する」ための支援を続けてきました。
                      </p>
                      
                      <p>
                        時代と共に、情報を届ける手段は紙からデジタルへと変わりましたが、私たちが最も大切にしている<span className="text-white font-bold">「企業と人の最適な出会い」</span>という本質は変わりません。
                      </p>

                      <div className="bg-white/5 border-l-2 border-blue-500 p-8 rounded-r-3xl my-12 shadow-inner">
                        <p className="text-white font-black text-xl mb-4 italic tracking-tight">AIが変えるのは「効率」だけではありません。</p>
                        <p className="text-white/70">
                          従来の広告は、広く誰にでも届く一方で、ミスマッチという課題を抱えていました。AIを導入した理由は、貴社の価値観を理解し、それに共鳴する人材を<span className="text-white font-bold underline decoration-blue-500/50 underline-offset-8">正確に見つけ出すため</span>です。
                        </p>
                      </div>

                      <p>
                        私たちは、那須を愛し、那須で頑張る企業様を本気で応援しています。<br />
                        このAIアプリが、貴社の未来を担う新しい力との出会いとなることを確信しています。
                      </p>
                      
                      <div className="pt-12 border-t border-white/10 mt-12 flex items-center gap-4">
                        <div className="w-12 h-0.5 bg-blue-500/30" />
                        <p className="text-white/30 text-xs font-bold tracking-[0.3em] uppercase">adtown 20th anniversary project</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="absolute top-0 left-0 w-full h-[30vh] bg-gradient-to-b from-white to-transparent" />
        </section>

        {/* --- 悩み・解決セクション --- */}
        <section className="py-32 md:py-48 bg-[#0a0a0a] text-white px-6 relative border-y border-white/5">
          <div className="max-w-7xl mx-auto relative z-10">
            <div className="text-center mb-20 space-y-4">
              <h2 className="text-5xl md:text-8xl font-black italic tracking-tighter text-white/10 uppercase">the challenge</h2>
              <p className="text-blue-400 font-black text-sm uppercase tracking-[0.4em]">
                多くの企業が直面する、採用の「三重苦」
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              <TroubleCard
                icon="💸"
                title="高騰する広告費"
                desc="成果の保証がないまま、月数十万円の掲載費を払い続ける。採用コストが経営を圧迫している。"
              />
              <TroubleCard
                icon="😰"
                title="定着しないミスマッチ"
                desc="せっかく採用しても「社風に合わない」と早期離職。教育コストと時間が泡のように消えていく。"
              />
              <TroubleCard
                icon="⏰"
                title="更新されない求人情報"
                desc="複数の媒体管理が煩雑で、最新の情報が届かない。求職者とのスピード感のズレが採用機会を奪う。"
              />

              <div className="lg:col-span-3 bg-gradient-to-br from-blue-600/10 to-transparent rounded-[4rem] p-12 md:p-20 text-center border border-blue-500/20 shadow-2xl backdrop-blur-sm mt-12 relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-50" />
                <h3 className="text-3xl md:text-5xl font-black italic tracking-tighter leading-tight text-white mb-8">
                  解決策は「頑張る採用」ではなく、<br />
                  <span className="text-blue-400">AIによる「価値観の自動評価」</span>を導入すること。
                </h3>
                <p className="max-w-2xl mx-auto text-white/50 font-bold leading-relaxed text-lg italic">
                  貴社が大切にしている文化や条件をAIが学習。点数化することで、相性の良い人材だけを効率的に引き寄せます。
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ============================================
            SOLUTION: AIマッチング
            ============================================ */}
        <section className="py-32 md:py-48 px-6 bg-white overflow-hidden">
          <div className="max-w-7xl mx-auto text-center">
            <p className="text-blue-600 font-black tracking-[0.4em] uppercase text-xs mb-6">the solution</p>
            <h2 className="text-5xl md:text-8xl font-black italic tracking-tighter text-slate-900 mb-8">AI MATCHING</h2>
            <p className="mt-6 text-xl md:text-2xl font-bold text-slate-500 italic max-w-4xl mx-auto leading-relaxed">
              那須地域に根ざした「みんなのNasuアプリ」だからこそ実現できる、<br />
              <span className="text-slate-900 border-b-2 border-blue-600/30">独自の高精度マッチング</span>をご体験ください。
            </p>

            {/* AIマッチングの仕組み */}
            <div className="mt-24 max-w-5xl mx-auto flex flex-col lg:flex-row items-stretch gap-1">
              <div className="flex-1 bg-[#0a0a0a] rounded-t-[3rem] lg:rounded-tr-none lg:rounded-l-[3rem] p-12 md:p-16 text-left relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/10 rounded-full blur-[60px] group-hover:bg-blue-600/20 transition-colors" />
                <h3 className="text-2xl font-black mb-12 text-blue-400 tracking-tight flex items-center gap-4">
                  <span className="w-8 h-8 rounded-full bg-blue-600/20 flex items-center justify-center text-sm font-black">?</span>
                  どのようにマッチングするか
                </h3>
                <div className="space-y-10 relative z-10">
                  <div className="flex gap-6">
                    <span className="text-white/20 font-black text-4xl italic leading-none">01</span>
                    <div>
                      <p className="text-white font-black text-lg mb-2 tracking-tight">属性・履歴の多角分析</p>
                      <p className="text-white/40 text-sm leading-relaxed font-medium">希望職種だけでなく、過去の検索傾向や閲覧履歴から、AIが潜在的な興味を抽出します。</p>
                    </div>
                  </div>
                  <div className="flex gap-6 font-medium">
                    <span className="text-white/20 font-black text-4xl italic leading-none">02</span>
                    <div>
                      <p className="text-white font-black text-lg mb-2 tracking-tight">価値観のスコアリング</p>
                      <p className="text-white/40 text-sm leading-relaxed font-medium">貴社の求める人物像と、求職者のパーソナリティを照合。相性を点数化して可視化します。</p>
                    </div>
                  </div>
                  <div className="flex gap-6">
                    <span className="text-white/20 font-black text-4xl italic leading-none">03</span>
                    <div>
                      <p className="text-white font-black text-lg mb-2 tracking-tight">最適タイミングで配信</p>
                      <p className="text-white/40 text-sm leading-relaxed font-medium">マッチ度の高い求職者のスマホへ、プッシュ通知でダイレクトに貴社の求人を届けます。</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex-1 bg-blue-600 rounded-b-[3rem] lg:rounded-bl-none lg:rounded-r-[3rem] p-12 md:p-16 text-left flex flex-col justify-center shadow-2xl">
                <div className="bg-white/10 backdrop-blur-md rounded-3xl p-8 border border-white/20 mb-8">
                  <p className="text-white font-black text-lg mb-4 italic flex items-center gap-3 decoration-white/30 decoration-2 underline underline-offset-8">
                    📍 マッチング成功事例
                  </p>
                  <p className="text-white/80 font-bold leading-relaxed">
                    「飲食経験あり × 那須塩原在住 × 土日勤務可能」な人材をAIがピックアップ。貴店のキッチンスタッフ募集を<span className="text-white font-black text-xl">自動配信し、即応募</span>に繋がりました。
                  </p>
                </div>
                <p className="text-white font-black text-2xl tracking-tighter leading-tight italic">
                  その求人は、<br />
                  「本当に欲しい人」に届いていますか？
                </p>
              </div>
            </div>

            {/* 機能カード */}
            <div className="mt-12 grid md:grid-cols-2 lg:grid-cols-4 gap-4 max-w-5xl mx-auto">
              {[
                { icon: "🧠", title: "高度なAI評価", desc: "価値観の一致をスコア化し、定着率の高い採用を支援。" },
                { icon: "🎯", title: "地域特化リーチ", desc: "那須地域で「実際に働ける人」に絞った効率配信。" },
                { icon: "📱", title: "AIスコア調整", desc: "貴社独自の採用基準に合わせて、AIの評価を最適化。" },
                { icon: "💎", title: "明快なワンプライス", desc: "月額6,600円の一括払い。追加費用は一切不要。" }
              ].map((feature, idx) => (
                <div key={idx} className="bg-slate-50 p-8 rounded-[2.5rem] border border-slate-100 hover:bg-white hover:shadow-xl transition-all duration-500 text-left">
                  <div className="text-4xl mb-6">{feature.icon}</div>
                  <h4 className="text-lg font-black text-slate-900 mb-3 tracking-tight">{feature.title}</h4>
                  <p className="text-slate-500 text-xs font-bold leading-relaxed">{feature.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* --- パートナーロゴ --- */}
        <section className="py-24 px-6 bg-slate-50 relative overflow-hidden">
          <div className="max-w-7xl mx-auto text-center relative z-10">
            <p className="text-slate-400 font-black tracking-[0.4em] uppercase text-[10px] mb-12 italic">trusted by local partners</p>
            <div className="flex flex-wrap justify-center items-center gap-12 md:gap-24 opacity-40 grayscale hover:grayscale-0 transition-opacity duration-700">
              {PARTNER_LOGOS.map((path, i) => (
                <img key={i} src={path} alt="Partner" className="h-10 md:h-14 w-auto object-contain" />
              ))}
            </div>
            <p className="mt-12 text-slate-400 text-sm font-bold">那須地域の様々な企業・団体様にご利用いただいています。</p>
          </div>
          <div className="absolute top-1/2 left-0 w-full h-px bg-slate-200 -z-10" />
        </section>

        {/* --- FAQ --- */}
        <section className="py-32 md:py-48 px-6 bg-white border-y border-slate-100">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-24">
              <p className="text-blue-600 font-black tracking-[0.4em] uppercase text-xs mb-6">common questions</p>
              <h2 className="text-5xl md:text-7xl font-black italic tracking-tighter text-slate-900">FAQ</h2>
            </div>
            
            <div className="space-y-4">
              <FAQItem question="月額6,600円で何ができますか？">
                AIマッチングシステムの完全機能をご利用いただけます。求職者との自動マッチング、AIスコア調整、応募者管理機能など、すべての機能が含まれます。
              </FAQItem>
              <FAQItem question="支払い方法は何ですか？">
                月額6,600円（税込）の一括払いです。クレジットカードによるお支払いをお願いしております。
              </FAQItem>
              <FAQItem question="成功報酬は発生しますか？">
                いいえ、<strong>一切発生しません</strong>。何名採用が決まっても、追加の費用をいただくことはございません。
              </FAQItem>
              <FAQItem question="解約はいつでもできますか？">
                はい、いつでも解約可能です。管理画面から簡単に行えます。
              </FAQItem>
              <FAQItem question="どのような職種でも掲載できますか？">
                はい。正社員・パート・アルバイト・契約社員など、雇用形態を問わず掲載可能です。
                業種も、飲食・小売・製造・医療・介護・IT・建設など、幅広く対応しています。
              </FAQItem>
              <FAQItem question="AIマッチングとは何ですか？">
                求職者の希望条件と、貴社の求人条件を照合し、<strong>マッチ度の高い求職者に自動で求人を配信</strong>する機能です。
                「AIが最適な求職者に届ける」ため、応募数・質ともに向上します。
              </FAQItem>
              <FAQItem question="登録後、すぐに掲載できますか？">
                はい。登録完了後、管理画面から求人情報を入力いただければ、<strong>即座に掲載</strong>されます。
              </FAQItem>
            </div>
          </div>
        </section>

        {/* --- 登録フォーム --- */}
        <section id="signup-form" className="py-32 md:py-48 bg-[#0a0a0a] text-white px-6 relative overflow-hidden" ref={registrationFormRef}>
          {/* 背景装飾 */}
          <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-[160px]" />
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-[160px]" />
          </div>

          <div className="max-w-4xl mx-auto relative z-10">
            <div className="text-center mb-24">
              <p className="text-blue-400 font-black tracking-[0.4em] uppercase text-xs mb-6">get started</p>
              <h2 className="text-5xl md:text-8xl font-black italic tracking-tighter leading-none mb-12">
                那須の未来を、<br />共につくりましょう。
              </h2>
              <div className="inline-flex items-center gap-6 bg-white/5 border border-white/10 px-8 py-4 rounded-3xl backdrop-blur-md">
                <div className="text-left">
                  <p className="text-white/40 text-[10px] uppercase font-black mb-1">limited offer</p>
                  <p className="text-xl font-black">20周年記念・特別優待プラン</p>
                </div>
                <div className="w-px h-10 bg-white/10" />
                <div className="text-left">
                  <p className="text-white/40 text-[10px] uppercase font-black mb-1">price</p>
                  <p className="text-xl font-black text-blue-400">¥6,600 <span className="text-xs text-white/40 font-bold">/ 月（一括）</span></p>
                </div>
              </div>
            </div>

            <div className="bg-white/5 backdrop-blur-3xl rounded-[4rem] p-10 md:p-20 border border-white/10 shadow-[0_64px_128px_rgba(0,0,0,0.5)]">
              <form onSubmit={handleSignup} className="space-y-12">
                <div className="grid md:grid-cols-2 gap-10">
                  <div className="space-y-4">
                    <label className="block text-xs font-black uppercase tracking-[0.2em] text-white/40 ml-4">企業名 / 店名</label>
                    <input
                      type="text"
                      required
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      placeholder="株式会社adtown"
                      className="w-full bg-white/[0.03] border-2 border-white/10 rounded-2xl px-8 py-5 text-white placeholder-white/20 focus:outline-none focus:border-blue-500/50 transition-all font-bold"
                    />
                  </div>
                  <div className="space-y-4">
                    <label className="block text-xs font-black uppercase tracking-[0.2em] text-white/40 ml-4">ご担当者名</label>
                    <input
                      type="text"
                      required
                      value={contactPerson}
                      onChange={(e) => setContactPerson(e.target.value)}
                      placeholder="那須 太郎"
                      className="w-full bg-white/[0.03] border-2 border-white/10 rounded-2xl px-8 py-5 text-white placeholder-white/20 focus:outline-none focus:border-blue-500/50 transition-all font-bold"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="block text-xs font-black uppercase tracking-[0.2em] text-white/40 ml-4">所在地</label>
                  <input
                    type="text"
                    required
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="栃木県那須塩原市..."
                    className="w-full bg-white/[0.03] border-2 border-white/10 rounded-2xl px-8 py-5 text-white placeholder-white/20 focus:outline-none focus:border-blue-500/50 transition-all font-bold"
                  />
                  {!area && address && (
                    <p className="mt-2 text-xs text-red-500 font-medium ml-4">那須塩原市、那須町、大田原市の住所を入力してください。</p>
                  )}
                  {area && (
                    <p className="mt-2 text-xs text-green-400 font-bold flex items-center ml-4">
                      <CheckCircleIcon className="w-3 h-3 mr-1" /> エリア判定：{area}
                    </p>
                  )}
                </div>

                <div className="space-y-4">
                  <label className="block text-xs font-black uppercase tracking-[0.2em] text-white/40 ml-4">電話番号</label>
                  <input
                    type="tel"
                    required
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="0287-XX-XXXX"
                    className="w-full bg-white/[0.03] border-2 border-white/10 rounded-2xl px-8 py-5 text-white placeholder-white/20 focus:outline-none focus:border-blue-500/50 transition-all font-bold"
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-10">
                  <div className="space-y-4">
                    <label className="block text-xs font-black uppercase tracking-[0.2em] text-white/40 ml-4">メールアドレス</label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-white/[0.03] border-2 border-white/10 rounded-2xl px-8 py-5 text-white placeholder-white/20 focus:outline-none focus:border-blue-500/50 transition-all font-bold"
                    />
                  </div>
                  <div className="space-y-4">
                    <label className="block text-xs font-black uppercase tracking-[0.2em] text-white/40 ml-4">確認用メールアドレス</label>
                    <input
                      type="email"
                      required
                      value={confirmEmail}
                      onChange={(e) => setConfirmEmail(e.target.value)}
                      className={`w-full bg-white/[0.03] border-2 rounded-2xl px-8 py-5 text-white placeholder-white/20 focus:outline-none focus:border-blue-500/50 transition-all font-bold ${email !== confirmEmail && confirmEmail ? 'border-red-500/50' : 'border-white/10'}`}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="block text-xs font-black uppercase tracking-[0.2em] text-white/40 ml-4">パスワード</label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="6文字以上"
                    className="w-full bg-white/[0.03] border-2 border-white/10 rounded-2xl px-8 py-5 text-white placeholder-white/20 focus:outline-none focus:border-blue-500/50 transition-all font-bold"
                  />
                </div>

                <div className="bg-white/5 border border-white/10 rounded-[2.5rem] p-8 md:p-12">
                  <div className="flex items-center space-x-4 mb-6">
                    <input
                      id="agree-checkbox"
                      type="checkbox"
                      checked={agreed}
                      onChange={(e) => setAgreed(e.target.checked)}
                      className="w-6 h-6 rounded-lg bg-white/5 border-2 border-white/20 checked:bg-blue-600 transition-all cursor-pointer"
                    />
                    <label htmlFor="agree-checkbox" className="text-sm font-bold text-white/70">
                      <button type="button" onClick={() => setShowTerms(!showTerms)} className="text-blue-400 hover:underline">利用規約</button>に同意して登録する
                    </label>
                  </div>
                  {showTerms && (
                    <div className="bg-black/20 border border-white/10 rounded-2xl p-6 h-48 overflow-y-auto text-xs text-white/40 leading-relaxed font-medium">
                      <h4 className="font-black mb-4 text-white/60">利用規約（抜粋）</h4>
                      <p className="mb-4">第1条（適用）本規約は、株式会社adtownが提供する本サービスに適用されます。</p>
                      <p className="mb-4">第2条（無料掲載）先着100社はキャンペーン価格でサービスをご利用いただけます。</p>
                      <p className="mb-4">第3条（料金）求人情報の掲載は無料です。個別オプションを除き、追加費用は不要です。</p>
                      <p>第4条（機密保持）取得した求職者の個人情報は、法令に基づき適切に管理いたします。</p>
                    </div>
                  )}
                </div>

                {error && (
                  <div className="p-6 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-sm font-bold flex items-center animate-shake">
                    <XCircleIcon className="w-5 h-5 mr-3" />
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={!isFormValid || isLoading}
                  className={`w-full py-6 rounded-3xl text-xl font-black italic tracking-widest transition-all shadow-[0_16px_48px_rgba(37,99,235,0.3)] ${
                    !isFormValid || isLoading 
                      ? 'bg-white/5 text-white/20 cursor-not-allowed' 
                      : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white hover:shadow-[0_24px_64px_rgba(37,99,235,0.5)] active:scale-[0.98]'
                  }`}
                >
                  {isLoading ? '登録処理中...' : 'アカウントを作成して次へ'}
                </button>
              </form>
            </div>
          </div>
        </section>
      </main>

      {/* ============================================
          FOOTER
          ============================================ */}
      <footer className="bg-[#0a0a0a] border-t border-white/5 py-24 px-6 text-white">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-start gap-16 mb-24">
            <div className="space-y-6">
              <h4 className="text-2xl font-black italic tracking-tighter">
                adtown <span className="text-blue-500">Recruit</span>
              </h4>
              <p className="text-white/40 text-sm font-medium max-w-sm leading-relaxed">
                那須地域の採用を、AIでスマートに。<br />
                株式会社adtownは、地域のポテンシャルをテクノロジーで最大化します。
              </p>
            </div>
            
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-12">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-500 mb-6 font-sans">service</p>
                <ul className="space-y-3 text-sm text-white/60 font-medium">
                  <li><Link href="/" className="hover:text-white transition-colors">AI Matching</Link></li>
                  <li><Link href="/" className="hover:text-white transition-colors">Premium Plan</Link></li>
                  <li><Link href="/" className="hover:text-white transition-colors">Case Studies</Link></li>
                </ul>
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-500 mb-6 font-sans">company</p>
                <ul className="space-y-3 text-sm text-white/60 font-medium">
                  <li><Link href="/" className="hover:text-white transition-colors">About Us</Link></li>
                  <li><Link href="/" className="hover:text-white transition-colors">Contact Us</Link></li>
                  <li><Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
                </ul>
              </div>
            </div>
          </div>
          
          <div className="pt-12 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6">
            <p className="text-[10px] text-white/20 font-black tracking-widest uppercase font-sans">
              &copy; {new Date().getFullYear()} adtown inc. all rights reserved.
            </p>
            <div className="flex items-center gap-8">
              <span className="text-[10px] text-white/20 font-black tracking-widest uppercase italic font-sans">member of nasu region development association</span>
            </div>
          </div>
        </div>
      </footer>

      {/* アニメーション用グローバルCSS */}
      <style jsx global>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
        .animate-shake { animation: shake 0.2s ease-in-out 0s 2; }
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in { animation: fade-in 0.8s ease-out; }
      `}</style>
    </div>
  );
};

export default RecruitSignupPage;