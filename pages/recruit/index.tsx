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

const BriefcaseIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
  </svg>
);

// --- コンポーネント: FAQアイテム ---
const FAQItem = ({ question, children }: { question: string, children: React.ReactNode }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="border-b border-gray-200">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full text-left py-5 flex justify-between items-center hover:bg-gray-50 transition-colors focus:outline-none"
      >
        <span className="text-lg font-bold text-gray-800 pr-4">{question}</span>
        <ChevronDownIcon className={`w-6 h-6 text-blue-600 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      <div className={`overflow-hidden transition-all duration-300 ${isOpen ? 'max-h-[500px] opacity-100 mb-5' : 'max-h-0 opacity-0'}`}>
        <div className="p-4 bg-gray-50 rounded-lg text-gray-600 leading-relaxed border-l-4 border-blue-500">
          {children}
        </div>
      </div>
    </div>
  );
};

// --- 統計カード ---
const StatCard = ({ number, label }: { number: string; label: string }) => (
  <div className="text-center group">
    <p className="text-5xl md:text-7xl font-black text-blue-500 group-hover:scale-110 transition-transform">{number}</p>
    <p className="mt-3 text-white/80 font-bold text-lg">{label}</p>
  </div>
);

// --- 課題カード ---
const TroubleCard = ({ icon, title, desc }: { icon: string; title: string; desc: string }) => (
  <div className="bg-white/5 rounded-[2.5rem] p-10 border border-white/10 hover:border-blue-500/50 transition-all group shadow-2xl">
    <div className="text-6xl mb-6 group-hover:scale-110 transition-transform">{icon}</div>
    <h4 className="text-2xl font-black text-white mb-4">{title}</h4>
    <p className="text-white/70 font-bold leading-relaxed text-lg">{desc}</p>
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
      const response = await fetch('/api/auth/register-free-partner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serviceType: 'recruit',
          companyName, address, area, contactPerson, phoneNumber, email, password
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || '登録に失敗しました。');

      // 成功時: ストレージクリアとリダイレクト
      ['recruit_company', 'recruit_address', 'recruit_area', 'recruit_contact', 'recruit_phone', 'recruit_email', 'recruit_confirmEmail', 'recruit_password', 'recruit_agreed'].forEach(k => window.sessionStorage.removeItem(k));
      window.location.href = '/partner/login?signup_success=true';
    } catch (err: any) {
      setError(err.message);
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-slate-50 text-slate-900 font-sans selection:bg-blue-100 overflow-x-hidden antialiased">
      <Head>
        <title>【公式】AI求人パートナー無料掲載登録｜みんなの那須アプリ（株式会社adtown 創業20周年記念事業）</title>
        <meta name="description" content="株式会社adtown 創業20周年記念事業。20年間で1000社+の採用を支援してきた実績を、アプリ×AIに集約。那須地域密着のAIマッチングで理想の人材を。先着100社限定キャンペーン実施中。" />
      </Head>

      {/* --- Sticky Bar --- */}
      <div className="bg-slate-950 text-white py-4 text-center text-xs md:text-sm font-black tracking-[0.22em] uppercase sticky top-0 z-[100] shadow-2xl backdrop-blur-md bg-opacity-90">
        那須地域限定「AI求人マッチング」
        <span className="ml-3 text-blue-300">先着{totalSlots}社：割引対応</span>
      </div>

      {/* --- ヘッダー --- */}
      <header className="bg-white/80 backdrop-blur-md shadow-sm sticky top-12 z-50 border-b border-gray-100">
        <div className="container mx-auto px-4 h-16 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <div className="bg-blue-600 text-white p-1.5 rounded-lg font-bold text-sm">那須</div>
            <span className="font-extrabold text-xl tracking-tighter">AIマッチング求人</span>
          </div>
          <button
            onClick={scrollToForm}
            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-full font-bold text-sm transition-all shadow-md active:scale-95"
          >
            無料登録して掲載
          </button>
        </div>
      </header>

      <main>
        {/* ============================================
            HERO：20周年実績 + 信頼性を最初に
            ============================================ */}
        <section className="relative overflow-hidden bg-gradient-to-br from-white via-blue-50/30 to-white pt-16 pb-20 md:pt-24 md:pb-32">
          <div className="container mx-auto px-4 relative z-10">
            {/* 🎉 20周年記念バッジ */}
            <div className="text-center mb-10 animate-fade-in">
              <div className="inline-flex flex-col items-center gap-4 bg-gradient-to-br from-blue-600 to-indigo-600 text-white px-12 py-8 rounded-[3rem] border-4 border-blue-400 shadow-2xl transform hover:scale-105 transition-all">
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
                    2006-2026 | 20 Years of Regional Business Support
                  </p>
                </div>
              </div>
            </div>

            {/* 🔥 adtown社の実績数字 */}
            <div className="mt-10 max-w-5xl mx-auto bg-slate-900 text-white rounded-[3rem] p-8 md:p-12 border border-slate-800 shadow-2xl">
              <div className="grid md:grid-cols-3 gap-8">
                <StatCard number="20年" label="広告の実績" />
                <StatCard number="1000社+" label="累計クライアント" />
                <StatCard number="1億部+" label="情報誌発行部数" />
              </div>

              <div className="mt-8 bg-blue-600/10 border border-blue-500/30 rounded-2xl p-6">
                <p className="text-lg md:text-xl font-black text-blue-300 leading-relaxed">
                  📰 紙媒体・WEB・YouTubeで那須地域を20年支援してきた
                  <span className="text-white"> 株式会社adtown</span>が、
                  <br />
                  その知見を集約した<span className="text-white underline decoration-blue-400">「求人アプリ × AI」</span>の新サービスです。
                </p>
              </div>
            </div>

            {/* キャッチコピー */}
            <div className="text-center mt-12">
              <h1 className="text-5xl md:text-7xl lg:text-[8rem] font-black leading-[0.9] tracking-tighter italic">
                那須の採用を、<br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
                  AIがスマートに。
                </span>
              </h1>

              <p className="mt-8 text-xl md:text-3xl text-slate-600 font-black max-w-5xl mx-auto leading-tight">
                紙・WEB・動画で培った<span className="text-blue-600 italic">"企業広告のノウハウ"</span>を、
                <br />
                AIアプリに集約しました。
              </p>

              <div className="flex flex-col items-center gap-4 mt-12 mb-12">
                <div className="inline-flex items-center gap-3 bg-slate-900 text-white px-8 py-4 rounded-full border border-slate-800 shadow-xl">
                  <BriefcaseIcon className="w-6 h-6 text-blue-400" />
                  <span className="text-blue-400 font-black tracking-[0.25em] uppercase text-xs md:text-sm">
                    nasu regional ai recruitment
                  </span>
                </div>

                <p className="text-slate-700 font-black text-base md:text-lg italic max-w-4xl">
                  「那須地域限定」のアプリを開発し、地元の求職者と企業を
                  <span className="text-slate-900 underline decoration-blue-300 underline-offset-8">AIで採用マッチング</span>します。
                </p>

                <div className="flex flex-wrap items-center justify-center gap-3">
                  <span className="bg-blue-50 text-blue-700 px-6 py-3 rounded-full border border-blue-100 font-black tracking-[0.2em] uppercase text-xs md:text-sm">
                    基本掲載：永久0円
                  </span>
                  <span className="bg-green-50 text-green-700 px-6 py-3 rounded-full border border-green-100 font-black tracking-[0.2em] uppercase text-xs md:text-sm">
                    AI採用（攻め）：特別価格
                  </span>
                  <span className="bg-slate-50 text-slate-700 px-6 py-3 rounded-full border border-slate-100 font-black tracking-[0.2em] uppercase text-xs md:text-sm">
                    成功報酬なし
                  </span>
                </div>
              </div>

              <div className="flex flex-col md:flex-row items-center justify-center space-y-4 md:space-y-0 md:space-x-6">
                <button
                  onClick={scrollToForm}
                  className="w-full md:w-auto bg-slate-900 hover:bg-slate-800 text-white text-lg font-bold px-10 py-4 rounded-xl shadow-2xl transition-all transform hover:-translate-y-1"
                >
                  まず無料で掲載を開始する
                </button>
              </div>
              <p className="mt-4 text-sm text-slate-500">※登録は最短3分。成功報酬も一切不要です。</p>
            </div>
          </div>

          {/* 装飾用背景 */}
          <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/4 w-96 h-96 bg-blue-100 rounded-full blur-3xl opacity-50 -z-10" />
          <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/4 w-96 h-96 bg-indigo-100 rounded-full blur-3xl opacity-50 -z-10" />
        </section>

        {/* --- キャンペーンバナー --- */}
        <section className="container mx-auto px-4 -mt-10 mb-20">
          <div className="bg-gradient-to-br from-green-400 via-emerald-400 to-teal-500 rounded-3xl p-1 shadow-xl">
            <div className="bg-white rounded-[1.4rem] p-6 md:p-10 text-center">
              <h3 className="text-xl md:text-2xl font-black text-slate-800 mb-4">
                【先着100社限定】AI採用プラン割引キャンペーン
              </h3>
              <p className="text-slate-600 mb-6 font-bold text-lg leading-relaxed">
                <span className="text-sm block opacity-70 mb-1">基本掲載（待ちの広告）は永久に無料。</span>
                「攻めの採用」を可能にするAIプラン月額 8,800円が、今なら <span className="text-4xl font-black text-blue-600">6,600円</span>
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <div className="flex items-center space-x-2 bg-slate-100 px-4 py-2 rounded-full font-bold">
                  <span>現在の登録数:</span>
                  <span className="text-blue-600 text-xl">{registeredCount}社</span>
                </div>
                <div className="flex items-center space-x-2 bg-red-50 text-red-600 px-4 py-2 rounded-full font-bold animate-pulse">
                  <span>残り枠:</span>
                  <span className="text-xl">{remainingSlots}社</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ============================================
            なぜ無料なのか？（NEW）
            ============================================ */}
        <section className="container mx-auto px-4 mb-20">
          <div className="rounded-3xl p-1 bg-gradient-to-br from-amber-400 via-yellow-500 to-orange-500 shadow-xl">
            <div className="bg-white rounded-[1.4rem] p-8 md:p-12">
              <div className="max-w-4xl mx-auto">
                <div className="flex items-start gap-4 mb-6">
                  <div className="w-12 h-12 rounded-2xl bg-amber-600 text-white flex items-center justify-center flex-shrink-0 shadow-md text-2xl">
                    💡
                  </div>
                  <div>
                    <h3 className="text-2xl md:text-3xl font-black text-slate-900 leading-tight">
                      なぜ「完全無料」なのか？
                    </h3>
                    <p className="mt-2 text-slate-600 leading-relaxed font-bold">
                      多くの方から「なぜ無料で求人掲載ができるのか？」とご質問をいただきます。<br />
                      その理由を、率直にお伝えします。
                    </p>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border-l-4 border-blue-600">
                    <h4 className="font-black text-xl text-blue-900 mb-3">理由① AIの学習データ収集フェーズ</h4>
                    <p className="text-slate-700 font-bold leading-relaxed">
                      私たちのAIマッチングエンジンは、<span className="text-blue-600 font-black">実際の求人・応募データから学習</span>することで精度を高めていきます。
                      先行100社の皆様には、この学習フェーズのパートナーとして、<span className="text-blue-600 font-black">無料でご協力</span>いただく代わりに、
                      最先端のAI採用システムを<span className="text-blue-600 font-black">永久に無料</span>でご利用いただけます。
                    </p>
                  </div>

                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 border-l-4 border-green-600">
                    <h4 className="font-black text-xl text-green-900 mb-3">理由② 地域経済への貢献</h4>
                    <p className="text-slate-700 font-bold leading-relaxed">
                      adtownは20年間、那須地域に根ざして事業を展開してきました。
                      <span className="text-green-600 font-black">地元企業の採用課題を解決</span>することが、地域経済の活性化に繋がると確信しています。
                      20周年記念事業として、那須の企業様への恩返しの意味を込めて、無料提供を決定しました。
                    </p>
                  </div>

                  <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-6 border-l-4 border-purple-600">
                    <h4 className="font-black text-xl text-purple-900 mb-3">理由③ なぜ「求人が可能なのか」？（高い集客力）</h4>
                    <div className="text-slate-700 font-bold leading-relaxed space-y-4">
                      <div className="flex items-start gap-3 bg-white/50 p-3 rounded-lg border border-purple-100">
                        <CheckCircleIcon className="text-green-500 w-5 h-5 shrink-0 mt-1" />
                        <p><strong>すでに先行1,000人が登録済み</strong>（高い利用者密度）</p>
                      </div>
                      <div className="flex items-start gap-3 bg-white/50 p-3 rounded-lg border border-purple-100">
                        <CheckCircleIcon className="text-green-500 w-5 h-5 shrink-0 mt-1" />
                        <p><strong>総フォロワー約10万人の地域インフルエンサー</strong>が積極的に情報発信中</p>
                      </div>
                      <div className="flex items-start gap-3 bg-white/50 p-3 rounded-lg border border-purple-100">
                        <CheckCircleIcon className="text-green-500 w-5 h-5 shrink-0 mt-1" />
                        <p>今後、5,000人〜10,000人と急増見込み。今なら<strong>先行者メリットを最大化</strong>可能</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-8 bg-slate-900 rounded-2xl p-8 text-white">
                  <p className="font-black text-2xl mb-4 italic">📢 つまり、Win-Winの関係です</p>
                  <div className="space-y-3 text-white/90 font-bold">
                    <p>✅ <span className="text-white font-black">企業様</span>：「待ち」の掲載は無料 ＋ 「攻め」のAI採用でミスマッチ解消</p>
                    <p>✅ <span className="text-white font-black">求職者</span>：理想の職場が見つかる ＋ 価値観の合う企業とマッチング</p>
                    <p>✅ <span className="text-white font-black">adtown</span>：最先端のAIマッチングデータ蓄積 ＋ 那須の地域活性化</p>
                  </div>
                </div>

                <div className="mt-6 text-center">
                  <button
                    onClick={scrollToForm}
                    className="inline-block bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-black text-lg px-10 py-4 rounded-2xl shadow-lg shadow-blue-100 transition-all transform hover:-translate-y-1 active:translate-y-0"
                  >
                    納得したので、無料登録に進む →
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* --- みんなのNasuアプリ登録促進 --- */}
        <section className="container mx-auto px-4 mb-20">
          <div className="rounded-3xl p-1 bg-gradient-to-br from-sky-400 via-blue-500 to-indigo-600 shadow-xl">
            <div className="bg-white rounded-[1.4rem] p-8 md:p-12">
              <div className="max-w-4xl mx-auto">
                <div className="flex items-start gap-4 mb-6">
                  <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center flex-shrink-0 shadow-md">
                    <UsersIcon className="w-7 h-7" />
                  </div>
                  <div>
                    <h3 className="text-2xl md:text-3xl font-black text-slate-900 leading-tight">
                      みんなのNasuアプリ、求職者登録が急増中。
                    </h3>
                    <p className="mt-2 text-slate-600 leading-relaxed font-bold">
                      すでに先行で<strong className="text-slate-900">1,000人が登録済</strong>。さらに、那須地域に向けて発信している
                      <strong className="text-slate-900">合計約100,000人のフォロワー</strong>を持つインフルエンサーが、アプリ登録への情報発信を実施中です。
                      今後も<strong className="text-slate-900">5,000人、10,000人</strong>と登録者増が見込めます。
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                  <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200">
                    <p className="text-xs font-bold tracking-widest text-slate-500">先行登録（求職者）</p>
                    <p className="mt-2 text-3xl font-black text-slate-900">1,000<span className="text-base font-bold">人</span></p>
                    <p className="mt-1 text-sm text-slate-600">すでに利用開始</p>
                  </div>
                  <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200">
                    <p className="text-xs font-bold tracking-widest text-slate-500">発信規模</p>
                    <p className="mt-2 text-3xl font-black text-slate-900">約100,000<span className="text-base font-bold">人</span></p>
                    <p className="mt-1 text-sm text-slate-600">那須向けフォロワー合計</p>
                  </div>
                  <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200">
                    <p className="text-xs font-bold tracking-widest text-slate-500">今後の見込み</p>
                    <p className="mt-2 text-3xl font-black text-slate-900">5,000〜10,000<span className="text-base font-bold">人</span></p>
                    <p className="mt-1 text-sm text-slate-600">登録者の増加期待</p>
                  </div>
                </div>

                <div className="flex flex-col md:flex-row items-center justify-center gap-4">
                  <a
                    href={NASU_APP_LP_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full md:w-auto text-center bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-black text-lg px-10 py-4 rounded-2xl shadow-lg shadow-blue-100 transition-all transform hover:-translate-y-1 active:translate-y-0"
                  >
                    みんなのNasuアプリを見る（一般ユーザー向け）
                  </a>
                  <button
                    onClick={scrollToForm}
                    className="w-full md:w-auto text-center bg-white border-2 border-slate-200 hover:border-blue-400 text-slate-900 font-black text-lg px-10 py-4 rounded-2xl shadow-sm transition-all active:scale-95"
                  >
                    企業の無料掲載登録に進む
                  </button>
                </div>

                <p className="mt-4 text-center text-xs text-slate-500">
                  ※ボタンを押すと、別タブで登録用ランディングページが開きます。
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ============================================
            TRUST: adtown社の20年実績
            ============================================ */}
        <section className="py-28 md:py-36 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white px-6 relative overflow-hidden">
          <div className="max-w-7xl mx-auto relative z-10">
            <div className="text-center mb-16">
              <p className="text-blue-400 font-black tracking-[0.3em] uppercase text-sm mb-4">
                why trust us?
              </p>
              <h2 className="text-5xl md:text-7xl font-black italic tracking-tighter">
                20年間、那須で<br />
                <span className="text-blue-400">地域企業様を支援</span>してきました
              </h2>
            </div>

            <div className="grid md:grid-cols-2 gap-12">
              {/* 左：これまでの実績 */}
              <div className="bg-white/5 rounded-[3rem] p-10 border border-white/10 backdrop-blur-sm">
                <h3 className="text-3xl font-black mb-8 text-blue-400">📚 これまでの実績</h3>
                <div className="space-y-6">
                  <div className="flex items-start gap-4">
                    <span className="text-4xl">📰</span>
                    <div>
                      <p className="font-black text-xl">紙媒体制作（地域情報誌）</p>
                      <p className="text-white/70 font-bold mt-2 leading-relaxed">
                        地域情報誌・求人チラシ・フリーペーパーなど、
                        <span className="text-white font-black">累計1000社+</span>の制作実績。
                        企業様の「求める顧客像」を明確化し、成功に導いてきました。
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <span className="text-4xl">🌐</span>
                    <div>
                      <p className="font-black text-xl">WEBサイト制作・運用</p>
                      <p className="text-white/70 font-bold mt-2 leading-relaxed">
                        広告サイト制作、SNS広告など、
                        デジタル採用の<span className="text-white font-black">トータルサポート</span>。
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <span className="text-4xl">🎥</span>
                    <div>
                      <p className="font-black text-xl">企業PR動画制作</p>
                      <p className="text-white/70 font-bold mt-2 leading-relaxed">
                        YouTubeチャンネル運営で培った動画制作ノウハウを、
                        <span className="text-white font-black">企業ブランディング</span>に活用。
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* 右：なぜ今「アプリ × AI」なのか */}
              <div className="bg-gradient-to-br from-blue-600 to-indigo-600 rounded-[3rem] p-10 border-4 border-blue-400 shadow-2xl">
                <h3 className="text-3xl font-black mb-8">💡 なぜ今「アプリ × AI」なのか？</h3>
                <div className="space-y-6 text-white/95 font-bold leading-relaxed">
                  <p>
                    <span className="font-black text-2xl">20年間の結論：</span><br />
                    紙・WEB・動画は<span className="font-black underline decoration-white/70 underline-offset-4">「認知」には強い</span>。
                    しかし、<span className="font-black">「応募〜定着」までの導線が弱い</span>。
                  </p>

                  <div className="bg-white/20 rounded-2xl p-6 border-l-4 border-white">
                    <p className="font-black text-xl mb-3">❌ 従来の求人広告の課題</p>
                    <ul className="space-y-2">
                      <li>• 求人掲載費が高額（月数万円〜数十万円）</li>
                      <li>• 応募が来ても、ミスマッチで辞める</li>
                      <li>• 求人票の更新・管理が手間</li>
                      <li>• 効果測定が曖昧</li>
                    </ul>
                  </div>

                  <div className="bg-white text-blue-600 rounded-2xl p-6 border-4 border-white shadow-xl">
                    <p className="font-black text-xl mb-3">✅ AI Active Matching プラン</p>
                    <ul className="space-y-2 font-black">
                      <li>• 6,600円（先着100社）＋ 成功報酬なし</li>
                      <li>• AIが企業価値観と合う人を評価（リピート・定着率UP）</li>
                      <li>• ＡＩ採用点数は自由に調整可能</li>
                      <li>• 攻めの広告：AIが最適な候補者に直接アピール</li>
                      <li>• プッシュ通知で確実にターゲットへリーチ</li>
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
            CEO MESSAGE
            ============================================ */}
        <section className="py-28 md:py-36 px-6 bg-white">
          <div className="max-w-5xl mx-auto">
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-[4rem] overflow-hidden shadow-3xl border border-slate-700">
              <div className="p-12 md:p-16">
                <p className="text-blue-400 font-black tracking-[0.3em] uppercase text-sm mb-4">
                  message from ceo
                </p>
                <h2 className="text-4xl md:text-5xl font-black text-white mb-8 italic tracking-tight">
                  20周年、次の20年へ。
                </h2>

                <div className="flex flex-col md:flex-row gap-10 items-start">
                  {/* 左：CEO写真（アイコン） */}
                  <div className="flex-shrink-0">
                    <div className="w-32 h-32 md:w-40 md:h-40 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 border-4 border-blue-400 flex items-center justify-center shadow-2xl">
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
                      創業から20年、私たちは那須地域の企業様を支援してきました。
                    </p>

                    <p>
                      紙媒体からスタートし、WEB、YouTube、そして今回の
                      <span className="text-blue-400 font-black">「アプリ × AI」</span>へ。
                      <br />
                      形は変わっても、<span className="text-white font-black">「地元企業に最高の人材を届けたい」</span>
                      という想いは変わりません。
                    </p>

                    <div className="bg-blue-600/10 border-l-4 border-blue-500 p-6 rounded-r-2xl">
                      <p className="font-black text-white text-xl mb-3">なぜ今、アプリなのか？</p>
                      <p>
                        それは、これまでの求人広告では
                        <span className="text-white font-black">「認知で止まっていた」</span>からです。
                      </p>
                      <p className="mt-2">
                        アプリなら、応募〜面接〜採用までの導線を設計できる。
                        AIなら、"合う人材"に確実に届けられる。
                      </p>
                    </div>

                    <p>
                      <span className="text-blue-400 font-black text-2xl">求人広告は、基本は完全無料です。</span>
                      <br />
                      本気で採用を変えたい企業様と、共に成長したいからです。
                    </p>

                    <p className="italic text-white/70 border-t border-white/20 pt-6">
                      20年の実績を、次の20年へ。<br />
                      みんなのNasuアプリで、那須の未来を一緒に作りましょう。
                    </p>

                    <div className="pt-4">
                      <p className="text-white font-black text-xl">株式会社adtown 代表取締役</p>
                      <p className="text-blue-400 font-black text-3xl mt-2 italic">石下かをり</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* --- 悩み・解決セクション --- */}
        <section className="py-28 md:py-36 bg-slate-900 text-white px-6 relative">
          <div className="max-w-7xl mx-auto relative z-10">
            <div className="text-center mb-16 space-y-4">
              <h2 className="text-5xl md:text-7xl font-black italic tracking-tighter">THE PROBLEM</h2>
              <p className="text-blue-400 font-black text-lg md:text-2xl uppercase tracking-[0.25em]">
                多くの企業が直面する採用の課題
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-10">
              <TroubleCard
                icon="💸"
                title="求人広告費が高い"
                desc="大手求人サイトに月数万円〜数十万円払っても、応募が来ない。費用対効果が悪すぎる..."
              />
              <TroubleCard
                icon="😰"
                title="採用してもすぐ辞める"
                desc="面接では良さそうだったのに、入社後にミスマッチが発覚。教育コストが無駄に..."
              />
              <TroubleCard
                icon="⏰"
                title="求人管理が手間"
                desc="複数の求人サイトに掲載すると、更新・管理が煩雑。担当者の負担が大きい..."
              />

              <div className="lg:col-span-3 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-[4rem] p-14 md:p-16 text-center shadow-3xl">
                <h3 className="text-3xl md:text-5xl font-black italic tracking-tighter leading-tight text-white">
                  解決策は「頑張る」ではなく、<br />
                  <span className="underline decoration-white/70 underline-offset-[10px]">AIで価値観の合う人材を自動評価する仕組み</span>です。
                </h3>
                <p className="mt-6 text-xl md:text-2xl font-bold text-blue-50 italic">
                  評価基準（点数）は自由に調整可能。離職を防ぎ、定着率を高めます。
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ============================================
            SOLUTION: AIマッチング
            ============================================ */}
        <section className="py-28 md:py-36 px-6 bg-white">
          <div className="max-w-7xl mx-auto text-center">
            <h2 className="text-5xl md:text-7xl font-black italic tracking-tighter text-slate-900">AI MATCHING</h2>
            <p className="mt-6 text-2xl md:text-3xl font-black text-blue-600 tracking-tight">
              求職者 × 企業を、AIで採用マッチング
            </p>
            <p className="mt-6 text-slate-600 font-bold text-lg md:text-xl leading-relaxed italic max-w-5xl mx-auto">
              那須地域限定のアプリだからこそ、「近い・働ける・興味がある」求職者に絞って届けられます。
              広く浅くではなく、採用に繋がる確度を上げます。
            </p>

            {/* AIマッチングの仕組み */}
            <div className="mt-14 max-w-4xl mx-auto bg-gradient-to-br from-slate-900 to-slate-800 rounded-[3rem] p-10 md:p-12 text-white border border-slate-700 shadow-2xl">
              <h3 className="text-3xl font-black mb-8 text-blue-400">🧠 AIマッチングの仕組み</h3>
              <div className="space-y-6 text-left">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center font-black text-xl">1</div>
                  <div>
                    <p className="font-black text-xl">求職者データの分析</p>
                    <p className="text-white/70 font-bold mt-2">
                      希望職種・スキル・勤務地・過去の閲覧履歴をAIが自動分析
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center font-black text-xl">2</div>
                  <div>
                    <p className="font-black text-xl">企業の求人条件とマッチング</p>
                    <p className="text-white/70 font-bold mt-2">
                      職種・給与・勤務時間・雰囲気と、求職者の希望を照合してマッチ度を算出
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center font-black text-xl">3</div>
                  <div>
                    <p className="font-black text-xl">最適なタイミングで配信</p>
                    <p className="text-white/70 font-bold mt-2">
                      「あなたにおすすめの求人」としてプッシュ通知で自動配信
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-8 bg-blue-600/10 border-2 border-blue-500/30 rounded-2xl p-6">
                <p className="font-black text-lg text-blue-300 mb-2">📍 具体例</p>
                <p className="text-white/80 font-bold">
                  「飲食経験あり × 那須塩原在住 × 週3勤務希望」の求職者に、
                  貴店のパート求人を<span className="text-white font-black">自動配信</span>
                </p>
              </div>
            </div>

            {/* 機能カード */}
            <div className="mt-14 grid md:grid-cols-2 lg:grid-cols-4 gap-10 text-left">
              <div className="bg-white rounded-[2.5rem] p-10 shadow-2xl border border-slate-100 hover:-translate-y-2 transition-all duration-500 group">
                <div className="text-6xl mb-6 group-hover:scale-110 transition-transform">🧠</div>
                <h3 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">AIマッチング</h3>
                <p className="mt-5 text-slate-600 font-bold leading-relaxed text-lg">
                  企業価値観と合う人をAIが点数で評価。相性の良い人材に絞ることで離職率を大幅に低減。
                </p>
              </div>

              <div className="bg-white rounded-[2.5rem] p-10 shadow-2xl border border-slate-100 hover:-translate-y-2 transition-all duration-500 group">
                <div className="text-6xl mb-6 group-hover:scale-110 transition-transform">🎯</div>
                <h3 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">那須地域に限定</h3>
                <p className="mt-5 text-slate-600 font-bold leading-relaxed text-lg">
                  地域を絞ることで、「実際に働ける人」だけに届ける効率的な採用を実現。
                </p>
              </div>

              <div className="bg-white rounded-[2.5rem] p-10 shadow-2xl border border-slate-100 hover:-translate-y-2 transition-all duration-500 group">
                <div className="text-6xl mb-6 group-hover:scale-110 transition-transform">📱</div>
                <h3 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">AIスコア調整</h3>
                <p className="mt-5 text-slate-600 font-bold leading-relaxed text-lg">
                  採用時に重視するポイント（スキル・性格等）を点数で自由に調整可能。
                </p>
              </div>

              <div className="bg-white rounded-[2.5rem] p-10 shadow-2xl border border-slate-100 hover:-translate-y-2 transition-all duration-500 group">
                <div className="text-6xl mb-6 group-hover:scale-110 transition-transform">💰</div>
                <h3 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">完全無料</h3>
                <p className="mt-5 text-slate-600 font-bold leading-relaxed text-lg">
                  基本の求人広告は永久無料。掲載費・成功報酬・すべて0円。
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* --- パートナーロゴ --- */}
        <section className="py-20 md:py-28 px-6 bg-slate-50 overflow-hidden border-t border-slate-100">
          <div className="max-w-7xl mx-auto text-center">
            <p className="text-sm md:text-base font-black text-slate-400 tracking-[0.45em] uppercase italic">
              trusted by local partners
            </p>
            <p className="mt-2 text-slate-500 font-bold">那須地域の多くの企業様が導入中</p>

            <div className="mt-12 flex flex-wrap justify-center items-center gap-8 opacity-60 grayscale hover:grayscale-0 transition-all duration-700">
              {PARTNER_LOGOS.map((path, i) => (
                <img key={i} src={path} alt="Partner" className="h-10 md:h-14 w-auto object-contain" />
              ))}
            </div>
          </div>
        </section>

        {/* --- FAQ --- */}
        <section className="py-20 bg-white">
          <div className="container mx-auto px-4 max-w-3xl">
            <h3 className="text-3xl font-black text-center mb-12 italic">Q & A</h3>
            <div className="bg-white rounded-3xl p-6 md:p-10 shadow-sm border border-slate-200">
              <FAQItem question="本当に無料で掲載できますか？">
                はい。<strong>基本掲載（求職者が探す「待ち」の広告）は永久に無料</strong>です。
                求人情報の作成・掲載、応募者管理まで、費用は一切かかりません。
              </FAQItem>
              <FAQItem question="有料プラン（AI Active Matching）との違いは？">
                有料プランは「攻めの広告」です。AIが御社の採用情報と合う求職者を点数で評価してマッチングします。
                企業価値観と合うため、<strong>継続率が上がり、離職者が減る</strong>のが最大の特徴です。
                採用点数は自由に調整可能です。
              </FAQItem>
              <FAQItem question="成功報酬は発生しますか？">
                いいえ、<strong>一切発生しません</strong>。何名採用が決まっても、追加の費用をいただくことはございません。
              </FAQItem>
              <FAQItem question="100社限定キャンペーンの内容は？">
                通常月額8,800円のAI Active Matchingプランが、先着100社様限定で<strong>月額6,600円</strong>でご利用いただけます。
                一度ご契約いただくと、この価格は永久に据え置かれます。
              </FAQItem>
              <FAQItem question="どのような職種でも掲載できますか？">
                はい。正社員・パート・アルバイト・契約社員など、雇用形態を問わず掲載可能です。
                業種も、飲食・小売・製造・医療・介護・IT・建設など、幅広く対応しています。
              </FAQItem>
              <FAQItem question="AIマッチングとは何ですか？">
                求職者の希望条件（職種・給与・勤務地・勤務時間など）と、貴社の求人条件を照合し、
                <strong>マッチ度の高い求職者に自動で求人を配信</strong>する機能です。
                従来の「求職者が検索して見つける」形式ではなく、「AIが最適な求職者に届ける」ため、
                応募数・質ともに向上します。
              </FAQItem>
              <FAQItem question="登録後、すぐに掲載できますか？">
                はい。登録完了後、管理画面から求人情報を入力いただければ、<strong>即座に掲載</strong>されます。
                審査や承認はAIが実施します。
              </FAQItem>
            </div>
          </div>
        </section>

        {/* --- 登録フォーム --- */}
        <section className="py-20 bg-slate-50" ref={registrationFormRef}>
          <div className="container mx-auto px-4">
            <div className="max-w-2xl mx-auto bg-white rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.1)] border border-gray-100 overflow-hidden">
              <div className="bg-slate-900 p-8 text-center">
                <h3 className="text-2xl font-bold text-white mb-2">無料パートナー登録</h3>
                <p className="text-slate-400 text-sm">3分で完了。今すぐ求人掲載を始めましょう。</p>
              </div>

              <form onSubmit={handleSignup} className="p-8 md:p-12 space-y-6">
                {/* 企業名 */}
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">企業名・店舗名 <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    required
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:bg-white outline-none transition-all"
                    placeholder="株式会社アドタウン"
                  />
                </div>

                {/* 担当者名 */}
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">ご担当者名 <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    required
                    value={contactPerson}
                    onChange={(e) => setContactPerson(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:bg-white outline-none transition-all"
                    placeholder="那須 太郎"
                  />
                </div>

                {/* 所在地 */}
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">所在地 <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    required
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:bg-white outline-none transition-all"
                    placeholder="栃木県那須塩原市..."
                  />
                  {!area && address && (
                    <p className="mt-2 text-xs text-red-500 font-medium">那須塩原市、那須町、大田原市の住所を入力してください。</p>
                  )}
                  {area && (
                    <p className="mt-2 text-xs text-green-600 font-bold flex items-center">
                      <CheckCircleIcon className="w-3 h-3 mr-1" /> エリア判定：{area}
                    </p>
                  )}
                </div>

                {/* 電話番号 */}
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">電話番号 <span className="text-red-500">*</span></label>
                  <input
                    type="tel"
                    required
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:bg-white outline-none transition-all"
                    placeholder="0287-XX-XXXX"
                  />
                </div>

                {/* メールアドレス */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">メールアドレス <span className="text-red-500">*</span></label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:bg-white outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">確認用 <span className="text-red-500">*</span></label>
                    <input
                      type="email"
                      required
                      value={confirmEmail}
                      onChange={(e) => setConfirmEmail(e.target.value)}
                      className={`w-full px-4 py-3 bg-slate-50 border rounded-xl focus:ring-2 focus:ring-blue-600 outline-none transition-all ${email !== confirmEmail && confirmEmail ? 'border-red-400' : 'border-slate-200'}`}
                    />
                  </div>
                </div>

                {/* パスワード */}
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">管理画面ログイン用パスワード <span className="text-red-500">*</span></label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600 outline-none transition-all"
                    placeholder="6文字以上"
                  />
                </div>

                {/* 規約同意 */}
                <div className="bg-slate-50 p-4 rounded-xl">
                  <div className="flex items-center space-x-3">
                    <input
                      id="agree-checkbox"
                      type="checkbox"
                      checked={agreed}
                      onChange={(e) => setAgreed(e.target.checked)}
                      className="w-5 h-5 accent-blue-600 cursor-pointer"
                    />
                    <label htmlFor="agree-checkbox" className="text-sm font-medium text-slate-700">
                      <button type="button" onClick={() => setShowTerms(!showTerms)} className="text-blue-600 font-bold hover:underline">利用規約</button>に同意して登録する
                    </label>
                  </div>
                  {showTerms && (
                    <div className="mt-4 p-4 bg-white border border-slate-200 rounded-lg h-48 overflow-y-auto text-xs text-slate-500 leading-relaxed shadow-inner">
                      <h4 className="font-bold mb-2 text-slate-800">利用規約（抜粋）</h4>
                      <p className="mb-2">第1条（適用）本規約は、株式会社adtownが提供する本サービスに適用されます。</p>
                      <p className="mb-2">第2条（無料掲載）先着100社は永久に無料でサービスをご利用いただけます。</p>
                      <p className="mb-2">第3条（料金）求人情報の掲載は無料です。成功報酬も不要です。</p>
                      <p>第4条（機密保持）取得した求職者の個人情報は、目的外利用を固く禁じます。</p>
                    </div>
                  )}
                </div>

                {error && (
                  <div className="p-4 bg-red-50 border-l-4 border-red-500 text-red-700 text-sm flex items-center animate-shake">
                    <XCircleIcon className="w-5 h-5 mr-2" />
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={!isFormValid || isLoading}
                  className="w-full py-5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-black text-xl shadow-xl shadow-blue-200 disabled:opacity-50 disabled:shadow-none transition-all transform hover:-translate-y-1 active:translate-y-0"
                >
                  {isLoading ? '登録処理中...' : '無料でアカウントを作成'}
                </button>
                <p className="text-center text-xs text-slate-400">
                  既にアカウントをお持ちの方は <Link href="/partner/login" className="text-blue-600 font-bold">こちらからログイン</Link>
                </p>
              </form>
            </div>
          </div>
        </section>
      </main>

      {/* --- フッター --- */}
      <footer className="bg-slate-900 text-slate-400 py-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-12">
            <div>
              <h5 className="text-white font-bold text-lg mb-6">運営会社</h5>
              <p className="text-sm leading-relaxed">
                株式会社adtown<br />
                栃木県那須塩原市石林698-35<br />
                （創業20周年・那須の地域活性化を支える）
              </p>
            </div>
            <div>
              <h5 className="text-white font-bold text-lg mb-6">リンク</h5>
              <ul className="space-y-4 text-sm">
                <li><Link href="/privacy-policy" className="hover:text-blue-400 transition-colors">プライバシーポリシー</Link></li>
                <li><Link href="/terms" className="hover:text-blue-400 transition-colors">利用規約</Link></li>
                <li><Link href="/tokushoho" className="hover:text-blue-400 transition-colors">特定商取引法に基づく表記</Link></li>
              </ul>
            </div>
            <div>
              <h5 className="text-white font-bold text-lg mb-6">お問い合わせ</h5>
              <p className="text-sm">
                掲載希望・アプリへのご意見は<br />
                公式HPまたはダッシュボード内より<br />
                お気軽にお問い合わせください。
              </p>
            </div>
          </div>
          <div className="pt-8 border-t border-slate-800 text-center text-xs">
            <p>&copy; {new Date().getFullYear()} Adtown Co., Ltd. All rights reserved.</p>
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