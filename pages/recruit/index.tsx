// recruit/index.tsx
// This file is the main landing page for the recruit signup.
// NOTE: Next.js specific imports are restored/adjusted to fix errors and ensure compatibility.

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link'; 
import Head from 'next/head'; 
// import Image from 'next/image'; // 最適化が必要な場合は使用してください
// import { useRouter } from 'next/router'; 
import { NextPage } from 'next'; 
import { User } from 'firebase/auth';

// --- 画像パスの定義 ---
const PARTNER_LOGOS = [
  '/images/partner-adtown.png', '/images/partner-aquas.png', '/images/partner-celsiall.png',
  '/images/partner-dairin.png',
  '/images/partner-kanon.png', '/images/partner-kokoro.png', '/images/partner-meithu.png',
  '/images/partner-midcityhotel.png',
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

const MessageCircleIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
  </svg>
);

const UserCheckIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
    <circle cx="8.5" cy="7" r="4"></circle>
    <polyline points="17 11 19 13 23 9"></polyline>
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
  const [isDataLoading] = useState(false); 
  const [registeredCount] = useState(45); 
  const totalSlots = 100;
  const remainingSlots = totalSlots - registeredCount;

  const registrationFormRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setCurrentAuthUser(null);
  }, []);

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
      setError('パートナーダッシュボードへ進むには、フォームの必須項目を全て満たし、規約に同意してください。');
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
          companyName: companyName,
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
        if (data.error && (data.error.includes('already in use') || data.error.includes('exists'))) {
          setError('このメールアドレスは既に使用されています。ログイン後、ダッシュボードへ移動するか、求人サービスを追加してください。');
        } else {
          throw new Error(data.error || 'サーバーでエラーが発生しました。');
        }
      }

      Object.keys(window.sessionStorage).forEach(key => {
        if (key.startsWith('recruitForm_')) {
          window.sessionStorage.removeItem(key);
        }
      });

      window.location.href = '/partner/login?signup_success=true';

    } catch (err: any) {
      console.error('Free signup error:', err);
      if (!error) setError(err.message || '不明なエラーが発生しました。');
      setIsLoading(false);
    }
  };

  const getButtonText = () => {
    if (isLoading) return 'アカウント作成中...';
    return '無料でダッシュボードに進む';
  };

  if (isDataLoading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50">
        <div className="text-xl font-semibold">ユーザー情報を読み込んでいます...</div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 text-gray-800 font-sans">
      <Head>
        <title>AI求人パートナー無料登録(みんなの那須アプリ)</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
      </Head>

      <header className="bg-white shadow-md sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-800">AIマッチング求人</h1>
          <button onClick={scrollToForm} className="bg-orange-500 text-white font-bold py-2 px-6 rounded-full hover:bg-orange-600 transition duration-300 shadow-lg animate-pulse">
            無料で求人掲載へ
          </button>
        </div>
      </header>

      <main className="container mx-auto px-6">
        <section className="text-center pt-16 pb-8">
          <h2 className="text-3xl font-bold text-gray-800">おかげさまで株式会社adtown20周年、感謝企画</h2>
          <p className="mt-4 text-lg text-gray-600">
            日頃よりご支援いただいている那須地域の皆さまへの感謝を込めて、<br />
            このたび「みんなの那須アプリ」のAI求人サービスを開始いたします。
          </p>
        </section>

        <section className="text-center py-16 md:py-24">
          <div className="max-w-5xl mx-auto px-4">
            <img
              src="/images/minna_nasu_k.png"
              alt="採用に困っている企業様は必見。第3の求人方法を無料でスタート"
              className="w-full h-auto mx-auto"
            />
          </div>
          <div className="mt-10">
            <button
              onClick={scrollToForm}
              className="bg-gradient-to-r from-orange-500 to-red-500 text-white font-extrabold py-4 px-10 rounded-full text-lg shadow-xl hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300"
            >
              無料で求人広告を掲載する
            </button>
            <p className="mt-2 text-sm text-gray-500">
              登録は3分、料金は一切かかりません。
            </p>
          </div>
        </section>

        <section className="mt-12 md:mt-16 py-8 bg-white rounded-2xl shadow-lg border border-gray-200">
          <div className="max-w-4xl mx-auto text-center px-6">
            <h3 className="text-2xl font-extrabold text-gray-800 mb-6">
              こんな採用の悩み、ありませんか?
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
              <div className="flex items-start space-x-3 p-3 bg-red-50 rounded-lg border border-red-200">
                <XCircleIcon className="w-6 h-6 text-red-600 flex-shrink-0 mt-1" />
                <p className="text-base font-medium text-gray-700">
                  求人費用をかけても、思うように応募がこない...
                </p>
              </div>
              <div className="flex items-start space-x-3 p-3 bg-red-50 rounded-lg border border-red-200">
                <XCircleIcon className="w-6 h-6 text-red-600 flex-shrink-0 mt-1" />
                <p className="text-base font-medium text-gray-700">
                  採用したのに、数ヶ月で辞める...
                </p>
              </div>
              <div className="flex items-start space-x-3 p-3 bg-red-50 rounded-lg border border-red-200">
                <XCircleIcon className="w-6 h-6 text-red-600 flex-shrink-0 mt-1" />
                <p className="text-base font-medium text-gray-700">
                  求めるスキルや人柄と合わず採用に至らない...
                </p>
              </div>
            </div>
            <p className="mt-8 text-xl font-bold text-orange-600">
              「みんなの那須アプリ」の無料登録が、採用成功の第一歩です!
            </p>
          </div>
        </section>

        <section className="bg-yellow-100 border-t-4 border-b-4 border-yellow-400 text-yellow-900 p-6 rounded-lg shadow-md my-12 text-center">
          <h3 className="text-2xl font-bold">【先着100社様限定】有料AIプランの**月額費用割引**キャンペーン実施中!</h3>
          <div className="mt-2 text-lg">
            有料機能がすべて使えるAIプラン(AIマッチング、AIアドバイス)は、月額<strong className="font-bold">8,800円</strong>ですが、
            先着100社様に限り、永続的に<strong className="font-bold text-red-600">月額6,600円</strong>でご利用いただけます。
            <br />
            <strong className="font-bold text-yellow-900">※求人がない月は求人管理ページからサービスを「停止」でき、その間の料金は一切発生しません。</strong>
            <br />**無料登録しても、この割引枠を確保できます。**
          </div>
          <div className="mt-4 bg-white p-4 rounded-lg flex items-center justify-center space-x-2 md:space-x-4 max-w-md mx-auto">
            <p className="text-md md:text-lg font-semibold">現在の申込企業数:</p>
            <div className="text-2xl md:text-3xl font-extrabold text-gray-800 tracking-wider bg-gray-100 px-3 py-1 rounded">{registeredCount}社</div>
            <p className="text-md md:text-lg font-semibold text-red-600">残り{remainingSlots}枠!</p>
          </div>
        </section>

        <section className="mt-20 bg-white rounded-2xl shadow-xl p-8 md:p-12 border border-gray-200">
          <div className="max-w-4xl mx-auto text-center">
            <UsersIcon className="w-12 h-12 mx-auto text-orange-500 mb-4" />
            <h3 className="text-3xl font-extrabold">第3の求人方法、それは「アプリ求人」、なぜアプリなのか? 答えは「圧倒的な地元の見込み客」です。</h3>
            <p className="mt-6 text-lg text-gray-600 leading-relaxed">
              那須地域限定の『みんなの那須アプリ』は、ほとんどの機能が<strong className="text-orange-600 font-bold">無料</strong>で使えるため、那須地域の住民にとって「ないと損」なアプリになりつつあります。
              先行登録者はすでに<strong className="text-orange-600 font-bold">1,000人</strong>を突破。口コミでその輪は確実に広がり、<strong className="text-orange-600 font-bold">5,000人、10,000人</strong>の巨大なユーザーコミュニティへと成長します。
              貴社の求人情報は、この<strong className="font-bold">爆発的に増え続ける「御社が求める求職者」</strong>に直接届くのです。
            </p>
            <div className="mt-12 p-6 bg-blue-50 rounded-xl border border-blue-100">
              <p className="text-lg font-bold text-gray-800 mb-4">
                こちらが、地元ユーザーが利用してるアプリのランディングページです。<br />
                <span className="text-base text-gray-600 font-normal mt-1 block">アプリの機能を確認する</span>
              </p>
              <a
                href="https://minna-no-nasu-app.netlify.app/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold py-3 px-8 rounded-full shadow-lg transition-all duration-300 transform hover:-translate-y-1"
              >
                アプリのランディングページを見る
                <span className="ml-2">→</span>
              </a>
            </div>
          </div>
        </section>

        <section className="mt-20">
          <div className="max-w-4xl mx-auto p-6 bg-green-700 text-white rounded-xl shadow-lg">
            <h3 className="text-2xl font-extrabold mb-4 border-b border-green-500 pb-2">
              【無料プラン・待ちの求人】(先着100社)
            </h3>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <ClipboardCheckIcon className="w-6 h-6 text-green-300 flex-shrink-0 mt-1" />
                <div>
                  <p className="text-lg font-bold">
                    「待ち」の採用:「採用コスト0円」で求人を掲載
                  </p>
                  <p className="text-sm text-green-100 mt-1">
                    求人広告の掲載費用は一切かかりません。まずは無料で求人情報を登録し、「AIでマッチング」した御社と相性のいいアプリユーザーからの応募を待つ「待ち」の採用活動をリスクゼロで始められます。
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <UsersIcon className="w-6 h-6 text-green-300 flex-shrink-0 mt-1" />
                <div>
                  <p className="text-lg font-bold">
                    応募が来た際、ミスマッチを防ぐ「AIマッチ度判定」
                  </p>
                  <p className="text-sm text-green-100 mt-1">
                    応募者のプロフィールや希望条件と、貴社が求める人物像をAIが自動で判定。「マッチ度80%」のように可視化し、採用のミスマッチを初期段階で防ぎます。
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-20">
          <h3 className="text-3xl font-extrabold text-center"> 【有料プラン・攻めの求人】2つのAI機能で採用を成功に導く</h3>
          <p className="mt-4 text-center text-gray-600 max-w-3xl mx-auto">
            無料の求人掲載で採用の第一歩を踏み出した後、さらに強力な有料AI機能でミスマッチを防ぎ、採用コストを削減できます。
          </p>
          <div className="mt-12 grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
            <div className="text-center p-6 bg-yellow-50 rounded-lg shadow-lg border-yellow-300 border">
              <div className="bg-yellow-500 text-white w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">AI</div>
              <h4 className="text-xl font-bold">求人マッチングAI「攻めの求人」(有料)</h4>
              <p className="mt-2 text-gray-600">
                アプリユーザーの価値観や希望条件に基づき、AIマッチングで、最も貴社にフィットする「理想の人材」にピンポイントでスカウトを送信する攻めの求人です。
              </p>
            </div>
            <div className="text-center p-6 bg-orange-50 rounded-lg shadow-lg border-orange-300 border">
              <div className="bg-orange-500 text-white w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">AI</div>
              <h4 className="text-xl font-bold">求人アドバイスAI(有料)</h4>
              <p className="mt-2 text-gray-600">
                「給与が相場より低い」「魅力が伝わらない」など、応募が集まらない原因をAIが分析し、具体的な改善案をアドバイスします。
              </p>
            </div>
          </div>
          <div className="mt-12 text-center bg-green-50 border-t-4 border-green-400 p-6 rounded-lg">
            <p className="text-xl font-bold text-green-800">
              まずは無料登録から。有料機能は求人管理ページからいつでも開始・停止できます。<br />
              <span className="text-base font-medium text-green-700">（求人がない月は停止すれば料金はかかりません）</span>
            </p>
          </div>
        </section>

        <section className="mt-20 text-center">
          <h3 className="text-2xl font-bold text-gray-700">すでに那須地域の多くの企業様がこのチャンスに気づいています</h3>
          <div className="mt-8 flex flex-wrap justify-center items-center gap-x-8 gap-y-6 opacity-80">
            {PARTNER_LOGOS.map((logoPath, index) => (
              <img 
                key={index}
                src={logoPath}
                alt={`Partner Logo ${index}`}
                className="h-12 md:h-16 w-auto object-contain grayscale hover:grayscale-0 transition-all duration-300"
              />
            ))}
          </div>
        </section>

        <section className="mt-24 max-w-4xl mx-auto">
          <h3 className="text-3xl font-extrabold text-center">よくある質問</h3>
          <div className="mt-8 bg-white p-4 md:p-8 rounded-2xl shadow-xl border">
            <FAQItem question="費用は本当に無料ですか？">
              <p className="leading-relaxed">
                はい、求人情報の登録とアプリへの掲載は**永続的に無料**です。ただし、求人マッチングAI、求人アドバイスAIといった**有料機能**をご利用になる場合のみ、月額<strong className="font-bold">8,800円</strong>（先着100社限定で6,600円）が発生します。有料機能はダッシュボード内からいつでもお申込み・停止が可能です。
              </p>
            </FAQItem>
            <FAQItem question="費用は本当にこれだけですか？成功報酬はありますか？">
              <p className="leading-relaxed">
                <strong className="font-bold">はい、有料プランをご利用の場合でも、月額料金のみです。</strong>採用が何名決まっても、追加の成功報酬は一切いただきません。コストを気にせず、納得のいくまで採用活動に専念していただけます。
              </p>
            </FAQItem>
            <FAQItem question="有料プランの途中で解約（停止）はできますか？">
              <p className="leading-relaxed">
                はい、可能です。求人管理ページからいつでも有料機能の「停止」ができます。停止中は料金は発生しませんので、求人を募集していない期間はコストを0円に抑えることができます。
              </p>
            </FAQItem>
          </div>
        </section>

        <section className="mt-24 mb-20" ref={registrationFormRef}>
          <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-100">
            <div className="bg-gradient-to-r from-orange-500 to-red-600 px-8 py-6 text-center">
              <h3 className="text-2xl md:text-3xl font-extrabold text-white">今すぐ無料でアカウントを作成</h3>
              <p className="text-orange-100 mt-2">
                まずは無料プランで、地域の求職者にアピールしましょう。<br />
                先着100社限定の割引枠も、今登録すれば確保されます。
              </p>
            </div>
            <form className="p-8 md:p-10 space-y-6">
              <div>
                <label className="block text-gray-700 font-medium mb-2">企業名・店舗名 *</label>
                <input type="text" value={companyName} onChange={(e) => setCompanyName(e.target.value)} required className="w-full px-4 py-2 border rounded-lg focus:ring-orange-500 focus:border-orange-500" />
              </div>
              <div>
                <label className="block text-gray-700 font-medium mb-2">ご担当者名 *</label>
                <input type="text" value={contactPerson} onChange={(e) => setContactPerson(e.target.value)} required className="w-full px-4 py-2 border rounded-lg focus:ring-orange-500 focus:border-orange-500" />
              </div>
              <div>
                <label className="block text-gray-700 font-medium mb-2">所在地 *</label>
                <input type="text" value={address} onChange={(e) => setAddress(e.target.value)} required placeholder="例：栃木県那須塩原市共墾社108-2" className="w-full px-4 py-2 border rounded-lg focus:ring-orange-500 focus:border-orange-500" />
                {address && !area && (
                  <p className="text-sm text-red-500 mt-1">※那須地域（那須塩原市、那須町、大田原市）の住所を入力してください。</p>
                )}
              </div>
              <div>
                <label className="block text-gray-700 font-medium mb-2">電話番号 *</label>
                <input type="tel" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} required className="w-full px-4 py-2 border rounded-lg focus:ring-orange-500 focus:border-orange-500" />
              </div>
              <div>
                <label className="block text-gray-700 font-medium mb-2">メールアドレス *</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full px-4 py-2 border rounded-lg focus:ring-orange-500 focus:border-orange-500" />
              </div>
              <div>
                <label className="block text-gray-700 font-medium mb-2">メールアドレス（確認） *</label>
                <input type="email" value={confirmEmail} onChange={(e) => setConfirmEmail(e.target.value)} required className="w-full px-4 py-2 border rounded-lg focus:ring-orange-500 focus:border-orange-500" />
                {email && confirmEmail && email !== confirmEmail && (
                  <p className="text-sm text-red-500 mt-1">メールアドレスが一致しません。</p>
                )}
              </div>
              {isPasswordRequired && (
                <div>
                  <label className="block text-gray-700 font-medium mb-2">パスワード（6文字以上） *</label>
                  <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} className="w-full px-4 py-2 border rounded-lg focus:ring-orange-500 focus:border-orange-500" />
                </div>
              )}
              <div className="flex items-start mt-4">
                <div className="flex items-center h-5">
                  <input id="terms" type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} className="w-4 h-4 border border-gray-300 rounded bg-gray-50 focus:ring-3 focus:ring-orange-300" />
                </div>
                <label htmlFor="terms" className="ml-2 text-sm font-medium text-gray-900">
                  <button type="button" onClick={() => setShowTerms(!showTerms)} className="text-orange-600 hover:underline">利用規約</button>に同意する
                </label>
              </div>
              {showTerms && (
                <div className="mt-4 p-4 bg-gray-100 rounded-lg h-60 overflow-y-auto text-sm text-gray-700 border border-gray-300">
                  <h4 className="font-bold mb-2">利用規約</h4>
                  <div className="space-y-4 pr-2">
                    <p><strong>第1条（適用）</strong><br />本規約は、株式会社adtown（以下「当社」といいます。）が提供するAIマッチング求人サービス（以下「本サービス」といいます。）の利用に関する一切の関係に適用されます。</p>
                    <p><strong>第2条（利用資格）</strong><br />本サービスは、当社が別途定める審査基準を満たした法人または個人事業主（以下「パートナー」といいます。）のみが利用できるものとします。</p>
                    <p><strong>第3条（利用料金）</strong><br />
                      1. 本サービスの基本機能（求人情報の登録・掲載）は**無料**です。<br />
                      2. パートナーは、以下の**有料機能**を利用する場合、当社に対し、別途定める利用料金（月額8,800円（税込）、先着100社限定で6,600円）を支払うものとします。有料機能への申し込みは、ダッシュボード内で行えます。<br />
                      (a) 求人マッチングAI（候補者の自動提案、スカウト機能）<br />
                      (b) 求人アドバイスAI（求人票の自動改善提案）<br />
                      3. 支払い方法は、クレジットカード決済（月額）のみとします。年額支払いの設定はありません。
                    </p>
                  </div>
                </div>
              )}
              {error && (
                <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-md flex items-center">
                  <XCircleIcon className="h-5 w-5 mr-3" />
                  <p className="text-sm">{error}</p>
                </div>
              )}
              <button type="button" onClick={handleFreeSignup} disabled={isLoading || !isFormValid} className="w-full py-4 mt-4 text-white text-lg font-bold bg-gradient-to-r from-orange-500 to-red-500 rounded-lg hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300">
                {getButtonText()}
              </button>
              <p className="text-sm text-center -mt-2 text-gray-500">ご登録後、ログインして管理ページより有料AI機能をお申込みいただけます。</p>
            </form>
            <p className="text-sm text-center mt-6 mb-8">
              すでにご担当者アカウントをお持ちの方は
              <Link href="/partner/login" className="text-orange-600 font-bold hover:underline ml-1">
                こちらからログイン
              </Link>
            </p>
          </div>
        </section>
      </main>
      <footer className="bg-gray-800 text-white py-8 text-center">
        <p className="text-sm opacity-75">&copy; 2024 Adtown Co., Ltd. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default RecruitSignupPage;