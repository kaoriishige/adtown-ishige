// recruit/index.tsx
// This file is the main landing page for the recruit signup.
// NOTE: Optimized for B2B compliance and enterprise security.

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link'; 
import Head from 'next/head'; 
import { NextPage } from 'next'; 
import { User } from 'firebase/auth';

// --- 画像パスの定義 ---
const PARTNER_LOGOS = [
  '/images/partner-adtown.png', '/images/partner-aquas.png', '/images/partner-celsiall.png',
  '/images/partner-dairin.png', '/images/partner-kanon.png', '/images/partner-kokoro.png',
  '/images/partner-meithu.png', '/images/partner-midcityhotel.png',
  '/images/partner-omakaseauto.png', '/images/partner-poppo.png',
  '/images/partner-sekiguchi02.png', '/images/partner-training_farm.png',
  '/images/partner-transunet.png', '/images/partner-koharu.png',
  '/images/partner-yamakiya.png'
];

// --- Inline SVG Icon Components ---
const UsersIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
    <circle cx="9" cy="7" r="4"></circle>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
    <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
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

const ClipboardCheckIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path>
    <path d="M12 2v4"></path>
    <path d="M8 4h8"></path>
    <polyline points="9 14 12 17 15 14"></polyline>
  </svg>
);

// --- Utility Components ---
const FAQItem = ({ question, children }: { question: string, children: React.ReactNode }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="border-b">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full text-left py-5 flex justify-between items-center hover:bg-gray-50 transition-colors"
      >
        <span className="text-lg font-medium text-gray-800 pr-2">{question}</span>
        <ChevronDownIcon className={`w-6 h-6 text-orange-500 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      {isOpen && (
        <div className="pb-5 pt-2 px-2 text-gray-600 bg-gray-50">{children}</div>
      )}
    </div>
  );
};

const usePersistentState = (key: string, defaultValue: any) => {
  const [state, setState] = useState(() => {
    if (typeof window === 'undefined') { return defaultValue; }
    try {
      const storedValue = window.sessionStorage.getItem(key);
      return storedValue ? JSON.parse(storedValue) : defaultValue;
    } catch (error) {
      console.error(error);
      return defaultValue;
    }
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        window.sessionStorage.setItem(key, JSON.stringify(state));
      } catch (error) {
        console.error(error);
      }
    }
  }, [key, state]);

  return [state, setState];
};

const RecruitSignupPage: NextPage = () => {
  const [companyName, setCompanyName] = usePersistentState('recruitForm_companyName', '');
  const [address, setAddress] = usePersistentState('recruitForm_address', '');
  const [area, setArea] = usePersistentState('recruitForm_area', '');
  const [contactPerson, setContactPerson] = usePersistentState('recruitForm_contactPerson', '');
  const [phoneNumber, setPhoneNumber] = usePersistentState('recruitForm_phoneNumber', '');
  const [email, setEmail] = usePersistentState('recruitForm_email', '');
  const [confirmEmail, setConfirmEmail] = usePersistentState('recruitForm_confirmEmail', '');
  const [password, setPassword] = usePersistentState('recruitForm_password', '');
  const [agreed, setAgreed] = usePersistentState('recruitForm_agreed', false);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showTerms, setShowTerms] = useState(false);
  const [currentAuthUser, setCurrentAuthUser] = useState<User | null>(null);
  const [registeredCount] = useState(45); 
  const totalSlots = 100;
  const remainingSlots = totalSlots - registeredCount;

  const registrationFormRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const match = address.match(/(那須塩原市|那須郡那須町|那須町|大田原市)/);
    if (match) {
      setArea(match[0].replace('那須郡', ''));
    } else if (address) {
      setArea('');
    }
  }, [address, setArea]);

  const scrollToForm = () => {
    registrationFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const isPasswordRequired = !currentAuthUser;
  const isFormValid = !!(
    companyName &&
    contactPerson &&
    address &&
    phoneNumber &&
    email &&
    confirmEmail &&
    area &&
    agreed &&
    email === confirmEmail &&
    (isPasswordRequired ? (password.length >= 6) : true)
  );

  const handleFreeSignup = async () => {
    setError(null);
    if (!isFormValid) {
      setError('必須項目を全て入力し、規約への同意を確認してください。');
      scrollToForm();
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/register-free-partner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serviceType: 'recruit',
          companyName,
          address,
          area,
          contactPerson,
          phoneNumber,
          email,
          password,
          existingUid: currentAuthUser?.uid
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'サーバーエラーが発生しました。');
      }

      Object.keys(window.sessionStorage).forEach(key => {
        if (key.startsWith('recruitForm_')) window.sessionStorage.removeItem(key);
      });

      window.location.href = '/partner/login?signup_success=true';

    } catch (err: any) {
      setError(err.message || '不明なエラーが発生しました。');
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-gray-50 text-gray-800 font-sans leading-relaxed">
      <Head>
        <title>AI求人パートナー無料登録 | みんなの那須アプリ</title>
        <meta name="description" content="那須地域密着のAI求人サービス。無料で求人掲載、AIマッチングで理想の採用を。" />
      </Head>

      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <span className="text-2xl font-black text-orange-600 tracking-tighter italic">Minna Nasu</span>
            <h1 className="text-xl font-bold border-l-2 border-gray-300 pl-3 hidden md:block">AIマッチング求人</h1>
          </div>
          <button onClick={scrollToForm} className="bg-orange-500 text-white font-bold py-2 px-6 rounded-full hover:bg-orange-600 transition shadow-lg text-sm md:text-base">
            無料で掲載を開始する
          </button>
        </div>
      </header>

      <main className="container mx-auto px-6">
        {/* Hero Section */}
        <section className="text-center pt-20 pb-12">
          <div className="inline-block bg-orange-100 text-orange-700 px-4 py-1 rounded-full text-sm font-bold mb-4">
            祝 20周年 感謝キャンペーン実施中
          </div>
          <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-6">
            那須地域の採用を、<br className="md:hidden" /><span className="text-orange-600">AIの力で</span>もっとスマートに。
          </h2>
          <p className="max-w-2xl mx-auto text-lg text-gray-600">
            「みんなの那須アプリ」は、地元の求職者と企業をAIで繋ぐ新しい求人プラットフォームです。<br />
            先行登録1,000人突破。地元密着型だからこその「高精度なマッチング」を提供します。
          </p>
          <div className="mt-10">
            <button onClick={scrollToForm} className="bg-gradient-to-r from-orange-500 to-red-600 text-white font-extrabold py-5 px-12 rounded-full text-xl shadow-2xl hover:scale-105 transition transform">
              無料で求人広告を掲載する
            </button>
            <p className="mt-4 text-sm text-gray-500 font-medium">初期費用0円 ・ 成功報酬0円 ・ 月額掲載料0円</p>
          </div>
        </section>

        {/* Campaign Info */}
        <section className="max-w-4xl mx-auto bg-yellow-50 border-2 border-yellow-200 p-8 rounded-3xl my-12 shadow-sm">
          <h3 className="text-2xl font-bold text-center text-yellow-800 mb-4">
            【先着100社限定】AIプラン永久割引特典
          </h3>
          <p className="text-center text-gray-700 mb-6">
            高度なAI機能が使えるAIプラン（月額8,800円）が、先着100社様に限り<strong className="text-red-600 text-xl">永続的に月額6,600円</strong>でご利用可能です。
            <br />
            <span className="text-sm">※求人がない月はいつでも「停止」でき、その間の料金は一切発生しません。</span>
          </p>
          <div className="flex flex-col md:flex-row justify-center items-center gap-4 bg-white p-6 rounded-2xl shadow-inner">
            <div className="text-center">
              <p className="text-sm font-bold text-gray-500 uppercase">現在の申込数</p>
              <p className="text-4xl font-black text-gray-800">{registeredCount}社</p>
            </div>
            <div className="hidden md:block h-12 w-px bg-gray-200"></div>
            <div className="text-center">
              <p className="text-sm font-bold text-red-500 uppercase">残り枠数</p>
              <p className="text-4xl font-black text-red-600 animate-pulse">{remainingSlots}枠</p>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="py-20">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div className="bg-white p-10 rounded-3xl shadow-xl border border-gray-100">
              <div className="bg-green-100 text-green-700 w-12 h-12 flex items-center justify-center rounded-2xl mb-6">
                <ClipboardCheckIcon className="w-8 h-8" />
              </div>
              <h4 className="text-2xl font-bold mb-4">無料プラン：待ちの求人</h4>
              <ul className="space-y-3 text-gray-600">
                <li className="flex items-start"><span className="text-green-500 mr-2">✓</span>求人情報の登録・掲載が永続無料</li>
                <li className="flex items-start"><span className="text-green-500 mr-2">✓</span>AIによる基本マッチ度判定（応募時）</li>
                <li className="flex items-start"><span className="text-green-500 mr-2">✓</span>地元ユーザー1,000人以上への露出</li>
              </ul>
            </div>
            <div className="bg-white p-10 rounded-3xl shadow-xl border-2 border-orange-500 relative">
              <div className="absolute top-0 right-10 -translate-y-1/2 bg-orange-500 text-white text-xs font-bold px-4 py-1 rounded-full shadow-lg uppercase">Recommended</div>
              <div className="bg-orange-100 text-orange-700 w-12 h-12 flex items-center justify-center rounded-2xl mb-6">
                <UsersIcon className="w-8 h-8" />
              </div>
              <h4 className="text-2xl font-bold mb-4 text-orange-600">有料AIプラン：攻めの求人</h4>
              <ul className="space-y-3 text-gray-700 font-medium">
                <li className="flex items-start"><span className="text-orange-500 mr-2">★</span>AIスカウト：理想の人材へ直接アプローチ</li>
                <li className="flex items-start"><span className="text-orange-500 mr-2">★</span>AIアドバイス：応募数向上のための改善提案</li>
                <li className="flex items-start"><span className="text-orange-500 mr-2">★</span>月額定額：採用人数に関わらず追加費用なし</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Partner Logos */}
        <section className="py-20 border-t border-gray-200">
          <h3 className="text-center text-gray-500 font-bold mb-10 tracking-widest uppercase text-sm">信頼のパートナー企業（順不同）</h3>
          <div className="flex flex-wrap justify-center gap-8 opacity-60">
            {PARTNER_LOGOS.map((path, idx) => (
              <img key={idx} src={path} alt="Partner" className="h-10 md:h-14 grayscale hover:grayscale-0 transition duration-300" />
            ))}
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-20 max-w-4xl mx-auto">
          <h3 className="text-3xl font-bold text-center mb-12 italic underline decoration-orange-500 underline-offset-8">よくある質問</h3>
          <div className="bg-white rounded-3xl p-6 shadow-sm border">
            <FAQItem question="本当に無料で掲載できますか？">
              求人情報の登録およびアプリへの公開は無料です。有料プランをご利用にならない限り、料金が発生することはありません。
            </FAQItem>
            <FAQItem question="有料プランの課金タイミングは？">
              ダッシュボードからAIプランにお申し込みいただいた日から、1ヶ月ごとの自動更新となります。求人募集を行わない期間は、前日までに停止設定を行うことで翌月の課金を防ぐことができます。
            </FAQItem>
            <FAQItem question="他媒体との併用は可能ですか？">
              もちろん可能です。むしろ、地元密着の「みんなの那須アプリ」を併用いただくことで、大手媒体では届かない層へのリーチが期待できます。
            </FAQItem>
          </div>
        </section>

        {/* Registration Form */}
        <section className="py-20" ref={registrationFormRef}>
          <div className="max-w-3xl mx-auto bg-white rounded-3xl shadow-2xl border overflow-hidden">
            <div className="bg-gray-900 px-8 py-8 text-white">
              <h3 className="text-2xl md:text-3xl font-bold">パートナー無料登録</h3>
              <p className="text-gray-400 mt-2 text-sm md:text-base">必要事項を入力して、ダッシュボードにアクセスしてください。</p>
            </div>
            
            <form className="p-8 md:p-12 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">企業名・店舗名 <span className="text-red-500">*</span></label>
                  <input type="text" value={companyName} onChange={(e) => setCompanyName(e.target.value)} required className="w-full px-4 py-3 border-2 border-gray-100 rounded-xl focus:border-orange-500 focus:outline-none transition" placeholder="株式会社〇〇" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">ご担当者名 <span className="text-red-500">*</span></label>
                  <input type="text" value={contactPerson} onChange={(e) => setContactPerson(e.target.value)} required className="w-full px-4 py-3 border-2 border-gray-100 rounded-xl focus:border-orange-500 focus:outline-none transition" placeholder="那須 太郎" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">所在地 <span className="text-red-500">*</span></label>
                <input type="text" value={address} onChange={(e) => setAddress(e.target.value)} required className="w-full px-4 py-3 border-2 border-gray-100 rounded-xl focus:border-orange-500 focus:outline-none transition" placeholder="栃木県那須塩原市..." />
                {address && !area && <p className="text-xs text-red-500 mt-1 font-bold">※那須地域（那須塩原市、那須町、大田原市）の住所を入力してください。</p>}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">電話番号 <span className="text-red-500">*</span></label>
                  <input type="tel" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} required className="w-full px-4 py-3 border-2 border-gray-100 rounded-xl focus:border-orange-500 focus:outline-none transition" placeholder="0287-00-0000" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">メールアドレス <span className="text-red-500">*</span></label>
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full px-4 py-3 border-2 border-gray-100 rounded-xl focus:border-orange-500 focus:outline-none transition" placeholder="example@mail.com" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">メールアドレス（確認用） <span className="text-red-500">*</span></label>
                <input type="email" value={confirmEmail} onChange={(e) => setConfirmEmail(e.target.value)} required className="w-full px-4 py-3 border-2 border-gray-100 rounded-xl focus:border-orange-500 focus:outline-none transition" />
              </div>

              {isPasswordRequired && (
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">管理画面用パスワード（6文字以上） <span className="text-red-500">*</span></label>
                  <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} className="w-full px-4 py-3 border-2 border-gray-100 rounded-xl focus:border-orange-500 focus:outline-none transition" />
                </div>
              )}

              <div className="bg-gray-50 p-6 rounded-2xl border">
                <div className="flex items-start">
                  <input id="terms" type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} className="w-5 h-5 mt-1 border-gray-300 text-orange-600 focus:ring-orange-500" />
                  <label htmlFor="terms" className="ml-3 text-sm text-gray-600 font-medium">
                    <button type="button" onClick={() => setShowTerms(!showTerms)} className="text-orange-600 font-bold hover:underline">利用規約および個人情報の取扱い</button>
                    に同意の上、アカウントを作成します。
                  </label>
                </div>

                {showTerms && (
                  <div className="mt-4 p-4 bg-white border rounded-lg h-64 overflow-y-auto text-xs text-gray-600 space-y-4">
                    <h4 className="font-bold text-sm text-gray-800">サービス利用規約</h4>
                    <p><strong>第1条（適用）</strong><br />本規約は、株式会社adtown（以下「当社」）が提供する「AI求人サービス」（以下「本サービス」）の利用に関し、当社および登録企業（以下「パートナー」）との間に適用されます。</p>
                    <p><strong>第2条（有料機能と料金）</strong><br />1.基本掲載は無料です。2.有料プラン（月額制）は、パートナーが管理画面より申し込むことで開始されます。3.日割り計算は行わず、解約月も一ヶ月分の料金が発生します。</p>
                    <p><strong>第3条（禁止事項）</strong><br />1.虚偽の求人情報の掲載。2.公序良俗に反する内容の掲載。3.候補者に対する不適切な行為。4.他社の知的財産権の侵害。</p>
                    <p><strong>第4条（機密保持）</strong><br />パートナーは、本サービスを通じて取得した候補者の個人情報を、採用活動以外の目的で使用してはならず、厳重に管理するものとします。</p>
                    <p><strong>第5条（反社会的勢力の排除）</strong><br />パートナーは、自らおよび役員が反社会的勢力に該当しないことを表明し、将来にわたっても該当しないことを確約します。違反した場合は即時に契約解除となります。</p>
                    <p><strong>第6条（免責）</strong><br />当社は、本サービスによる採用の成否、候補者の情報の真実性について一切の保証を行いません。採用に関するトラブルは当事者間で解決するものとします。</p>
                  </div>
                )}
              </div>

              {error && (
                <div className="bg-red-50 text-red-700 p-4 rounded-xl flex items-center text-sm border border-red-200 font-bold">
                  <XCircleIcon className="w-5 h-5 mr-3 flex-shrink-0" />
                  {error}
                </div>
              )}

              <button
                type="button"
                onClick={handleFreeSignup}
                disabled={isLoading || !isFormValid}
                className="w-full bg-gradient-to-r from-orange-500 to-red-600 text-white font-black py-4 rounded-xl shadow-xl hover:shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed transition transform active:scale-95 text-lg"
              >
                {isLoading ? '処理中...' : '無料でアカウントを作成する'}
              </button>
            </form>
          </div>
        </section>
      </main>

      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="container mx-auto px-6 text-center">
          <div className="mb-6 text-white font-black text-xl italic tracking-tighter">Minna Nasu Partner</div>
          <nav className="flex justify-center space-x-6 mb-8 text-sm">
            <Link href="/privacy-policy" className="hover:text-white transition">プライバシーポリシー</Link>
            <Link href="/tokushoho" className="hover:text-white transition">特定商取引法に基づく表記</Link>
            <Link href="https://adtown.jp" target="_blank" className="hover:text-white transition">運営会社</Link>
          </nav>
          <p className="text-xs">&copy; 2024 Adtown Co., Ltd. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default RecruitSignupPage;