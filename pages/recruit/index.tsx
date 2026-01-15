/**
 * recruit/index.tsx
 * みんなの那須アプリ - 求人パートナー登録 LP & フォーム
 * * 機能:
 * 1. セッションストレージによる入力値の永続化
 * 2. 住所入力からの自動エリア抽出（那須塩原市、那須町、大田原市）
 * 3. 動的なバリデーションとエラー表示
 * 4. レスポンシブなモダンUI（Tailwind CSS）
 * 5. 先着100社カウントダウン表示
 */

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Head from 'next/head';
import { NextPage } from 'next';
import { User } from 'firebase/auth';
// カスタムフック（必要に応じてパスを調整してください）
// import { useAffiliateTracker } from '@/lib/affiliate-tracker';

// --- 画像パス・定数定義 ---
const PARTNER_LOGOS = [
  '/images/partner-adtown.png', '/images/partner-aquas.png', '/images/partner-celsiall.png',
  '/images/partner-dairin.png', '/images/partner-kanon.png', '/images/partner-kokoro.png',
  '/images/partner-meithu.png', '/images/partner-midcityhotel.png', '/images/partner-omakaseauto.png',
  '/images/partner-poppo.png', '/images/partner-sekiguchi02.png', '/images/partner-training_farm.png',
  '/images/partner-transunet.png', '/images/partner-koharu.png', '/images/partner-yamakiya.png'
];

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
    <div className="border-b border-gray-200">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full text-left py-5 flex justify-between items-center hover:bg-gray-50 transition-colors focus:outline-none"
      >
        <span className="text-lg font-bold text-gray-800 pr-4">{question}</span>
        <ChevronDownIcon className={`w-6 h-6 text-orange-500 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      <div className={`overflow-hidden transition-all duration-300 ${isOpen ? 'max-h-96 opacity-100 mb-5' : 'max-h-0 opacity-0'}`}>
        <div className="p-4 bg-gray-50 rounded-lg text-gray-600 leading-relaxed border-l-4 border-orange-400">
          {children}
        </div>
      </div>
    </div>
  );
};

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
  const registeredCount = 47; // 動的に取得する場合はAPIから
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
    <div className="bg-slate-50 text-slate-900 font-sans selection:bg-orange-100">
      <Head>
        <title>【公式】AI求人パートナー無料掲載登録｜みんなの那須アプリ</title>
        <meta name="description" content="那須地域密着の「みんなの那須アプリ」で求人を無料掲載。AIマッチングで理想の人材を。先着100社限定キャンペーン実施中。" />
      </Head>

      {/* --- ヘッダー --- */}
      <header className="bg-white/80 backdrop-blur-md shadow-sm sticky top-0 z-50 border-b border-gray-100">
        <div className="container mx-auto px-4 h-16 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <div className="bg-orange-500 text-white p-1.5 rounded-lg font-bold text-sm">那須</div>
            <span className="font-extrabold text-xl tracking-tighter">AIマッチング求人</span>
          </div>
          <button
            onClick={scrollToForm}
            className="bg-orange-500 hover:bg-orange-600 text-white px-5 py-2 rounded-full font-bold text-sm transition-all shadow-md active:scale-95"
          >
            無料登録して掲載
          </button>
        </div>
      </header>

      <main>
        {/* --- ヒーローセクション --- */}
        <section className="relative overflow-hidden bg-white pt-16 pb-20 md:pt-24 md:pb-32">
          <div className="container mx-auto px-4 relative z-10 text-center">
            <span className="inline-block px-4 py-1.5 mb-6 text-sm font-bold tracking-widest text-orange-600 bg-orange-50 rounded-full">
              株式会社adtown 20周年感謝企画
            </span>
            <h2 className="text-4xl md:text-6xl font-black leading-tight mb-8">
              那須の採用を、<br className="md:hidden" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-red-600">
                AIがスマートに。
              </span>
            </h2>
            <p className="text-lg md:text-xl text-slate-600 max-w-2xl mx-auto mb-10 leading-relaxed">
              タウン情報誌のノウハウ × 最新AI。<br />
              地元住民が集まる「みんなの那須アプリ」で、<br className="hidden md:block" />
              ミスマッチのない求人掲載を<strong className="text-slate-900 underline decoration-orange-400 decoration-4">完全無料</strong>で始めましょう。
            </p>
            <div className="flex flex-col md:flex-row items-center justify-center space-y-4 md:space-y-0 md:space-x-6">
              <button
                onClick={scrollToForm}
                className="w-full md:w-auto bg-slate-900 hover:bg-slate-800 text-white text-lg font-bold px-10 py-4 rounded-xl shadow-2xl transition-all transform hover:-translate-y-1"
              >
                まずは無料で掲載を開始する
              </button>
            </div>
            <p className="mt-4 text-sm text-slate-500">※登録は最短3分。成功報酬も一切不要です。</p>
          </div>
          {/* 装飾用背景 */}
          <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/4 w-96 h-96 bg-orange-100 rounded-full blur-3xl opacity-50 -z-10" />
          <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/4 w-96 h-96 bg-blue-100 rounded-full blur-3xl opacity-50 -z-10" />
        </section>

        {/* --- キャンペーンバナー --- */}
        <section className="container mx-auto px-4 -mt-10 mb-20">
          <div className="bg-gradient-to-br from-yellow-400 via-orange-400 to-orange-500 rounded-3xl p-1 shadow-xl">
            <div className="bg-white rounded-[1.4rem] p-6 md:p-10 text-center">
              <h3 className="text-xl md:text-2xl font-black text-slate-800 mb-4">
                【先着100社限定】AIプラン永久割引特典
              </h3>
              <p className="text-slate-600 mb-6">
                通常月額 8,800円のAIフル活用プランが、今なら永久に <span className="text-3xl font-black text-red-600">6,600円</span>
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <div className="flex items-center space-x-2 bg-slate-100 px-4 py-2 rounded-full font-bold">
                  <span>現在の申込数:</span>
                  <span className="text-orange-600 text-xl">{registeredCount}社</span>
                </div>
                <div className="flex items-center space-x-2 bg-red-50 text-red-600 px-4 py-2 rounded-full font-bold animate-pulse">
                  <span>残り枠:</span>
                  <span className="text-xl">{remainingSlots}社</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* --- 悩み・解決セクション --- */}
        <section className="py-20 bg-slate-900 text-white">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h3 className="text-3xl font-bold mb-4 text-orange-400">こんな採用の課題はありませんか？</h3>
              <div className="h-1 w-20 bg-orange-400 mx-auto"></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                "多額の掲載料を払っても応募がゼロ",
                "採用してもすぐに辞めてしまう",
                "面接に来る人の質が合わない"
              ].map((text, i) => (
                <div key={i} className="flex items-start space-x-4 p-6 bg-slate-800 rounded-2xl border border-slate-700">
                  <XCircleIcon className="w-8 h-8 text-red-400 flex-shrink-0" />
                  <p className="text-lg font-medium">{text}</p>
                </div>
              ))}
            </div>
            <div className="mt-20 text-center">
              <h4 className="text-2xl md:text-3xl font-black mb-10 leading-tight">
                「みんなの那須アプリ」が、<br className="md:hidden" />
                その悩みを解決する<span className="text-orange-400 text-4xl">第3の選択肢</span>です。
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                <div className="bg-white/5 backdrop-blur-sm p-8 rounded-3xl border border-white/10 hover:border-orange-400 transition-colors group">
                  <div className="w-14 h-14 bg-orange-500 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <CheckCircleIcon className="text-white w-8 h-8" />
                  </div>
                  <h5 className="text-xl font-bold mb-4">コスト0からの採用活動</h5>
                  <p className="text-slate-400 leading-relaxed text-sm">
                    まずは無料で掲載。求職者からの応募を待つ「待ち」の採用は、一切リスクがありません。
                  </p>
                </div>
                <div className="bg-white/5 backdrop-blur-sm p-8 rounded-3xl border border-white/10 hover:border-orange-400 transition-colors group">
                  <div className="w-14 h-14 bg-blue-500 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <UsersIcon className="text-white w-8 h-8" />
                  </div>
                  <h5 className="text-xl font-bold mb-4">AIによるマッチ度判定</h5>
                  <p className="text-slate-400 leading-relaxed text-sm">
                    応募者のプロフィールと貴社の条件をAIが照合。マッチ度を数値化し、面接前の判断を支援します。
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* --- パートナーロゴ --- */}
        <section className="py-20 bg-white border-b">
          <div className="container mx-auto px-4">
            <p className="text-center text-slate-500 font-bold mb-10">那須地域の多くの企業様が導入中</p>
            <div className="flex flex-wrap justify-center items-center gap-8 opacity-60">
              {PARTNER_LOGOS.map((path, i) => (
                <img key={i} src={path} alt="Partner" className="h-10 md:h-14 w-auto grayscale object-contain" />
              ))}
            </div>
          </div>
        </section>

        {/* --- FAQ --- */}
        <section className="py-20 bg-slate-50">
          <div className="container mx-auto px-4 max-w-3xl">
            <h3 className="text-3xl font-black text-center mb-12 italic">Q & A</h3>
            <div className="bg-white rounded-3xl p-6 md:p-10 shadow-sm border border-slate-200">
              <FAQItem question="本当に無料で掲載できますか？">
                はい、求人情報の作成・掲載、そして「待ち」の応募受付は**永続的に無料**です。
                「AIマッチング」や「AIアドバイス」などの高度な機能を使いたい場合のみ、有料プランへの切り替えが可能です。
              </FAQItem>
              <FAQItem question="成功報酬は発生しますか？">
                いいえ、発生しません。何名採用が決まっても、追加の費用をいただくことはございません。
              </FAQItem>
              <FAQItem question="有料プランの解約（停止）はいつでもできますか？">
                はい。管理画面からいつでも停止できます。求人を募集しない月は停止しておけば、料金は1円もかかりません。
              </FAQItem>
            </div>
          </div>
        </section>

        {/* --- 登録フォーム --- */}
        <section className="py-20 bg-white" ref={registrationFormRef}>
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
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:bg-white outline-none transition-all"
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
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:bg-white outline-none transition-all"
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
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:bg-white outline-none transition-all"
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
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:bg-white outline-none transition-all"
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
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:bg-white outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">確認用 <span className="text-red-500">*</span></label>
                    <input
                      type="email"
                      required
                      value={confirmEmail}
                      onChange={(e) => setConfirmEmail(e.target.value)}
                      className={`w-full px-4 py-3 bg-slate-50 border rounded-xl focus:ring-2 focus:ring-orange-500 outline-none transition-all ${email !== confirmEmail && confirmEmail ? 'border-red-400' : 'border-slate-200'}`}
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
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none transition-all"
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
                      className="w-5 h-5 accent-orange-500 cursor-pointer"
                    />
                    <label htmlFor="agree-checkbox" className="text-sm font-medium text-slate-700">
                      <button type="button" onClick={() => setShowTerms(!showTerms)} className="text-orange-600 font-bold hover:underline">利用規約</button>に同意して登録する
                    </label>
                  </div>
                  {showTerms && (
                    <div className="mt-4 p-4 bg-white border border-slate-200 rounded-lg h-48 overflow-y-auto text-xs text-slate-500 leading-relaxed shadow-inner">
                      <h4 className="font-bold mb-2 text-slate-800">利用規約（抜粋）</h4>
                      <p className="mb-2">第1条（適用）本規約は、株式会社adtownが提供する本サービスに適用されます。</p>
                      <p className="mb-2">第2条（審査）パートナー登録には一定の審査があり、公序良俗に反する場合等は利用を制限いたします。</p>
                      <p className="mb-2">第3条（料金）求人情報の掲載は無料です。有料オプションは合意の上で課金されます。成功報酬は不要です。</p>
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
                  className="w-full py-5 rounded-2xl bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white font-black text-xl shadow-xl shadow-orange-200 disabled:opacity-50 disabled:shadow-none transition-all transform hover:-translate-y-1 active:translate-y-0"
                >
                  {isLoading ? '登録処理中...' : '無料でアカウントを作成'}
                </button>
                <p className="text-center text-xs text-slate-400">
                  既にアカウントをお持ちの方は <Link href="/partner/login" className="text-orange-500 font-bold">こちらからログイン</Link>
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
                栃木県那須塩原市共墾社108-2<br />
                （創業20周年・那須の地域活性化を支える）
              </p>
            </div>
            <div>
              <h5 className="text-white font-bold text-lg mb-6">リンク</h5>
              <ul className="space-y-4 text-sm">
                <li><Link href="/privacy-policy" className="hover:text-orange-400 transition-colors">プライバシーポリシー</Link></li>
                <li><Link href="/terms" className="hover:text-orange-400 transition-colors">利用規約</Link></li>
                <li><Link href="/tokushoho" className="hover:text-orange-400 transition-colors">特定商取引法に基づく表記</Link></li>
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
      `}</style>
    </div>
  );
};

export default RecruitSignupPage;