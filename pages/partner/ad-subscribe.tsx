import React, { useState, useEffect, useRef, SVGProps, ReactNode, forwardRef } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import Link from 'next/link';
import Image from 'next/image';
import Head from 'next/head';
import { useRouter } from 'next/router';

// --- Firebase関連のインポート ---
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../../lib/firebase';

//================================================================================
// Stripeの初期化
//================================================================================
const stripePromise = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY 
    ? loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) 
    : null;

//================================================================================
// 型定義
//================================================================================
interface RegistrationFormProps {
    storeName: string;
    contactPerson: string;
    address: string;
    phoneNumber: string;
    email: string;
    agreed: boolean;
    setAgreed: React.Dispatch<React.SetStateAction<boolean>>;
    error: string | null;
    stripeError: boolean;
    isLoading: boolean;
    isInvoiceProcessing: boolean;
    invoiceDownloadSuccess: boolean;
    handleSubmit: () => void;
    handleRegisterAndInvoice: () => void;
    getButtonText: () => string;
    getInvoiceButtonText: () => string;
    setShowTerms: (show: boolean) => void;
    isFormValid: boolean;
}

//================================================================================
// アイコンコンポーネント
//================================================================================
const UsersIcon = (props: SVGProps<SVGSVGElement>) => ( <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg> );
const XCircleIcon = (props: SVGProps<SVGSVGElement>) => ( <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg> );
const PhoneIcon = (props: SVGProps<SVGSVGElement>) => ( <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81 .7A2 2 0 0 1 22 16.92z"></path></svg> );
const MessageCircleIcon = (props: SVGProps<SVGSVGElement>) => ( <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg> );
const UserCheckIcon = (props: SVGProps<SVGSVGElement>) => ( <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="8.5" cy="7" r="4"></circle><polyline points="17 11 19 13 23 9"></polyline></svg> );
const ChevronDownIcon = (props: SVGProps<SVGSVGElement>) => ( <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><polyline points="6 9 12 15 18 9"></polyline></svg> );
const DownloadIcon = (props: SVGProps<SVGSVGElement>) => ( <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg> );

//================================================================================
// UIコンポーネント (プレゼンテーション層)
//================================================================================
const FAQItem = ({ question, children }: { question: string, children: ReactNode }) => {
    const [isOpen, setIsOpen] = useState(false);
    return (
        <div className="border-b">
            <button onClick={() => setIsOpen(!isOpen)} className="w-full text-left py-5 flex justify-between items-center hover:bg-gray-50 transition-colors">
                <span className="text-lg font-medium text-gray-800 pr-2">{question}</span>
                <ChevronDownIcon className={`w-6 h-6 text-orange-500 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            {isOpen && ( <div className="pb-5 pt-2 px-2 text-gray-600 bg-gray-50">{children}</div> )}
        </div>
    );
};

const Header = ({ onScrollToForm }: { onScrollToForm: () => void }) => (
    <header className="bg-white shadow-md sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-800">みんなの那須アプリ</h1>
            <button onClick={onScrollToForm} className="bg-orange-500 text-white font-bold py-2 px-6 rounded-full hover:bg-orange-600 transition duration-300 shadow-lg animate-pulse">
                リスクゼロですぐ始める
            </button>
        </div>
    </header>
);

const HeroSection = ({ onScrollToForm }: { onScrollToForm: () => void }) => (
    <section className="text-center py-16 md:py-24">
        <p className="text-orange-500 font-semibold">地元企業＆店舗を応援するadtownからのご提案【もし、毎月安定した収益が自動で入ってきたら？】</p>
        <h2 className="text-4xl md:text-5xl font-extrabold mt-4 leading-tight">
            「お金を無駄に
            払う」時代は終わりました。<br />
            これからは<span className="text-orange-600">あなたのお店のテーブルが新しい収益源</span>になります。
        </h2>
        <p className="mt-6 text-lg text-gray-600 max-w-3xl mx-auto">
            これは単なる広告掲載のご提案ではありません。人手不足、物価高騰…そんな<strong className="font-bold">「痛み」</strong>を抱える今だからこそ、那須地域の店舗様と共に、広告費を「コスト」から「利益」に変える新しいプロジェクトをご提案します。
        </p>
        <div className="mt-8">
            <button onClick={onScrollToForm} className="bg-gradient-to-r from-orange-500 to-red-500 text-white font-extrabold py-4 px-10 rounded-full text-lg shadow-xl hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300">
                今すぐ新しい収益源を手に入れる
            </button>
            <p className="mt-2 text-sm text-gray-500">登録は3分、リスクはゼロです。</p>
        </div>
    </section>
);

const CampaignSection = ({ registeredCount }: { registeredCount: number }) => {
    const totalSlots = 100;
    const remainingSlots = totalSlots - registeredCount;

    return (
        <section className="bg-yellow-100 border-t-4 border-b-4 border-yellow-400 text-yellow-900 p-6 rounded-lg shadow-md my-12 text-center">
            <h3 className="text-2xl font-bold">【先着100店舗様 限定】初期費用<span className="text-red-600"> 0円 </span>キャンペーン実施中！</h3>
            <p className="mt-2 text-lg">
                月額3,850円のパートナー制度（アプリ広告出し放題＆紹介手数料で収入アップ）を、今なら初期費用<span className="font-bold text-red-600">完全無料</span>で始められます。さらに、1年後の**全額返金保証**もご用意しました。
            </p>
            <div className="mt-4 bg-white p-4 rounded-lg flex items-center justify-center space-x-2 md:space-x-4 max-w-md mx-auto">
                <p className="text-md md:text-lg font-semibold">現在の申込店舗数:</p>
                <div className="text-2xl md:text-3xl font-extrabold text-gray-800 tracking-wider bg-gray-100 px-3 py-1 rounded">{registeredCount}店舗</div>
                <p className="text-md md:text-lg font-semibold text-red-600">残り {remainingSlots} 枠！</p>
            </div>
        </section>
    );
};

const WhyAppSection = () => (
    <section className="mt-20 bg-white rounded-2xl shadow-xl p-8 md:p-12 border border-gray-200">
        <div className="max-w-4xl mx-auto text-center">
            <UsersIcon className="w-12 h-12 mx-auto text-orange-500 mb-4" />
            <h3 className="text-3xl font-extrabold">なぜ今、アプリ広告なのか？答えは「圧倒的な見込み客」です。</h3>
            <p className="mt-6 text-lg text-gray-600 leading-relaxed">
                『みんなの那須アプリ』は、ほとんどの機能が<strong className="text-orange-600 font-bold">無料</strong>で使えるため、那須地域の住民にとって「ないと損」なアプリになりつつあります。
                先行登録者はすでに<strong className="text-orange-600 font-bold">3,000人</strong>を突破。口コミでその輪は確実に広がり、<strong className="text-orange-600 font-bold">5,000人、10,000人</strong>の巨大なユーザーコミュニティへと成長します。
                貴店の広告やクーポン、フードロスを、アプリ広告出し放題で、この<strong className="font-bold">爆発的に増え続ける「未来の常連客」</strong>に直接届くのです。
            </p>
            <div className="mt-8">
                <p className="text-lg text-gray-700 mb-4 font-semibold">地元の住民がすでに使っています。ぜひご確認ください。</p>
                <a
                    href="https://minna-no-nasu-app.netlify.app/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center bg-orange-600 text-white font-bold py-3 px-8 rounded-full hover:bg-orange-700 transition duration-300 shadow-md text-base"
                >
                    アプリを確認
                </a>
            </div>
        </div>
    </section>
);

const HowItWorksSection = () => (
    <section className="mt-20">
        <h3 className="text-3xl font-extrabold text-center">なぜ、みんなの那須アプリの「QRコード」をテーブルに置くだけで「毎月の安定収益」に変わるのか？</h3>
        <p className="mt-4 text-center text-gray-600 max-w-3xl mx-auto">お客様が貴店をきっかけにQRコードから無料登録して、有料会員になると、その売上の30%が**永続的に貴店の収益**となります。その驚くほど簡単な仕組みをご覧ください。</p>
        <div className="mt-12 grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            <div className="text-center p-6 bg-white rounded-lg shadow-lg"><div className="bg-orange-500 text-white w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">1</div><h4 className="text-xl font-bold">お客様が「無料」で登録</h4><p className="mt-2 text-gray-600">貴店に置かれたQRコードスタンド（無料提供）から、お客様はお役立ち満載の約50個のアプリが永久無料で使い放題！**無料プラン**に登録します。</p></div>
            <div className="text-center p-6 bg-white rounded-lg shadow-lg"><div className="bg-orange-500 text-white w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">2</div><h4 className="text-xl font-bold">「年間9.3万円の損」に気づく</h4><p className="mt-2 text-gray-600">アプリを使ううち、お客様は「恋愛・婚活マッチングサービス」「フリマで売って稼ぐ」「お手伝いで稼ぐ」「ペット・動物マッチング」といった有料機能を使わないと**年間93,000円以上も損をしている**事実に気づきます。</p></div>
            <div className="text-center p-6 bg-white rounded-lg shadow-lg"><div className="bg-orange-500 text-white w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">3</div><h4 className="text-xl font-bold">貴店に「継続収益」が発生します</h4><p className="mt-2 text-gray-600">お客様が月額480円の有料プランに移行した瞬間、貴店に**紹介料(売上の30%)**が発生。利用し続ける限り、**毎月144円×人数分**が自動で積み上がります。</p></div>
        </div>
        <div className="mt-12 text-center bg-green-50 border-t-4 border-green-400 p-6 rounded-lg"><p className="text-xl font-bold text-green-800">つまり、月額3,850円のパートナー費用は、わずか23人のお客様が有料会員になるだけで回収でき、それ以降はすべて貴店の「利益」に変わり広告も出し放題で好循環の流れになります。</p></div>
    </section>
);

const RevenueSimSection = () => (
    <section className="mt-20 bg-white rounded-2xl shadow-xl p-8 md:p-12 border border-gray-200">
        <h3 className="text-3xl font-extrabold text-center">もし、1日にたった2人または5人のお客様が登録したら？</h3>
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-orange-50 p-8 rounded-lg border-2 border-dashed border-orange-300"><h4 className="font-bold text-xl text-center">例：カフェ・美容室の場合</h4><p className="text-center text-sm text-gray-600">1日に2人が有料会員に移行</p><p className="mt-4 text-center text-lg text-gray-700">2人/日 × 30日 = <span className="font-bold text-2xl text-orange-600">月60人</span>の紹介</p><p className="mt-2 text-center text-xl font-bold text-gray-800">月間紹介料: <span className="text-red-600">8,640円</span></p><p className="mt-4 text-center text-xl font-bold text-gray-800">年間収益: <span className="text-4xl font-extrabold text-red-600">103,680円</span></p></div>
            <div className="bg-blue-50 p-8 rounded-lg border-2 border-dashed border-blue-300"><h4 className="font-bold text-xl text-center">例：レストラン・居酒屋の場合</h4><p className="text-center text-sm text-gray-600">1日に5人が有料会員に移行</p><p className="mt-4 text-center text-lg text-gray-700">5人/日 × 30日 = <span className="font-bold text-2xl text-blue-600">月150人</span>の紹介</p><p className="mt-2 text-center text-xl font-bold text-gray-800">月間紹介料: <span className="text-red-600">21,600円</span></p><p className="mt-4 text-center text-xl font-bold text-gray-800">年間収益: <span className="text-4xl font-extrabold text-red-600">259,200円</span></p></div>
        </div>
        <p className="mt-4 text-sm text-gray-500 text-center">※この収益は、広告掲載による本来の**集客効果とは別に**得られるものです。</p>
    </section>
);

const PartnerLogosSection = () => (
    <section className="mt-20 text-center">
        <h3 className="text-2xl font-bold text-gray-700">すでに那須地域の多くの店舗様がこのチャンスに気づいています</h3>
        <div className="mt-8 flex flex-wrap justify-center items-center gap-x-8 gap-y-6 opacity-80">
            {['/images/partner-adtown.png', '/images/partner-aquas.png', '/images/partner-aurevoir.png', '/images/partner-celsiall.png', '/images/partner-dairin.png', '/images/partner-kanon.png', '/images/partner-kokoro.png', '/images/partner-meithu.png', '/images/partner-midcityhotel.png', '/images/partner-nikkou.png', '/images/partner-oluolu.png', '/images/partner-omakaseauto.png', '/images/partner-poppo.png', '/images/partner-Quattro.png', '/images/partner-sekiguchi02.png', '/images/partner-tonbo.png', '/images/partner-training_farm.png', '/images/partner-transunet.png', '/images/partner-yamabuki.png', '/images/partner-yamakiya.png'].map((logoPath, index) => (
                <Image key={index} src={logoPath} alt={`パートナーロゴ ${index + 1}`} width={150} height={50} className="object-contain" />
            ))}
        </div>
    </section>
);

const SupportSection = () => (
    <section className="mt-20 text-center">
        <h3 className="text-3xl font-extrabold">安心のトリプルサポート体制</h3>
        <p className="mt-4 text-gray-600 max-w-2xl mx-auto">導入後も、専任の担当者が貴店を徹底的にサポートします。ITが苦手な方でも安心してご利用いただけます。</p>
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="bg-white p-6 rounded-lg shadow-md border"><PhoneIcon className="w-10 h-10 mx-auto text-blue-500"/><p className="mt-4 font-bold text-lg">お電話サポート</p></div>
            <div className="bg-white p-6 rounded-lg shadow-md border"><MessageCircleIcon className="w-10 h-10 mx-auto text-green-500"/><p className="mt-4 font-bold text-lg">LINEチャットサポート</p></div>
            <div className="bg-white p-6 rounded-lg shadow-md border"><UserCheckIcon className="w-10 h-10 mx-auto text-orange-500"/><p className="mt-4 font-bold text-lg">専任担当者</p></div>
        </div>
    </section>
);

const FaqSection = () => (
    <section className="mt-24 max-w-4xl mx-auto">
        <h3 className="text-3xl font-extrabold text-center">よくある質問</h3>
        <div className="mt-8 bg-white p-4 md:p-8 rounded-2xl shadow-xl border">
            <FAQItem question="費用は本当にこれだけですか？成功報酬はありますか？">
                <p className="leading-relaxed">はい、月額3,850円クレジットカード決済（または請求書払い年額39,600円）のみです。広告掲載数に上限はなく、紹介手数料から成功報酬をいただくことも一切ありません。安心してご利用いただけます。</p>
            </FAQItem>
            <FAQItem question="全額返金保証について詳しく教えてください。">
                <p className="leading-relaxed">ご利用開始から1年後、得られた紹介手数料の累計が年間のパートナー費用（46,200円クレジットカード決済、39,600円請求書払い決済）に満たなかった場合、お支払いいただいた費用を全額返金いたします。これは、私達のシステムに自信があるからこその保証です。※適用には諸条件がありますので、利用規約第6条をご確認ください。</p>
            </FAQItem>
            <FAQItem question="紹介手数料はどのように支払われますか？">
                <p className="leading-relaxed">毎月末締めで計算し、翌々月15日にご指定の銀行口座へお振り込みします。振込額の合計が3,000円に満たない場合は、お支払いは翌月以降に繰り越されます。パートナー様専用のダッシュボードで、いつでも収益状況をご確認いただけます。</p>
            </FAQItem>
            <FAQItem question="契約の途中で解約（停止）はできますか？">
                <p className="leading-relaxed">はい、いつでも管理画面から次回の更新を停止（解約）することができます。契約期間の縛りはありません。ただし、月の途中で停止した場合でも、日割りの返金はございませんのでご了承ください（全額返金保証を除く、請求書払いの途中解約は返金はございません）。</p>
            </FAQItem>
        </div>
    </section>
);

const RegistrationForm = forwardRef<HTMLDivElement, RegistrationFormProps>((props, ref) => {
    const { 
        storeName, contactPerson, address, phoneNumber, email, agreed, setAgreed, 
        error, stripeError, isLoading, isInvoiceProcessing, invoiceDownloadSuccess,
        handleSubmit, handleRegisterAndInvoice, getButtonText, getInvoiceButtonText, setShowTerms,
        isFormValid
    } = props;

    return (
        <section ref={ref} id="registration-form" className="py-16 sm:py-20">
            <div className="bg-white p-8 md:p-12 rounded-2xl shadow-2xl w-full max-w-3xl mx-auto border border-gray-200">
                <div className="text-center mb-10">
                    <p className="text-gray-700 leading-relaxed">
                        ここまでお読みいただきありがとうございます。<br/>
                        限定100店舗の初期費用無料キャンペーン枠は、すぐに埋まってしまうことが予想されます。<br/>
                        <strong className="text-red-600 font-bold">このチャンスを逃せば、101店舗目から初期費用が発生いたします。もし1年間で得られた紹介手数料の合計が、年間のパートナー費用（46,200円クレジットカード決済、39,600円請求書払い決済）に満たなかった場合、お支払いいただいた費用を全額返金いたします。請求書払いは、年間46,200円のところ一括前払いで39,600円の割引価格となります。</strong><br/>
                    </p>
                </div>
                <h2 className="text-3xl font-bold text-center mb-2">パートナー登録 & 掲載お申し込み</h2>
                <p className="text-center text-gray-600 mb-8">
                    以下の情報をご確認の上、お申し込みください。
                </p>
                
                <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
                    <div className="space-y-6 bg-gray-50 p-6 rounded-lg border">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <div><label className="block text-gray-700 font-medium mb-1">店舗名・企業名</label><input type="text" value={storeName} readOnly className="w-full px-4 py-2 border rounded-lg bg-gray-200 cursor-not-allowed"/></div>
                            <div><label className="block text-gray-700 font-medium mb-1">ご担当者名</label><input type="text" value={contactPerson} readOnly className="w-full px-4 py-2 border rounded-lg bg-gray-200 cursor-not-allowed"/></div>
                        </div>
                        <div><label className="block text-gray-700 font-medium mb-1">住所</label><input type="text" value={address} readOnly className="w-full px-4 py-2 border rounded-lg bg-gray-200 cursor-not-allowed"/></div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <div><label className="block text-gray-700 font-medium mb-1">電話番号</label><input type="tel" value={phoneNumber} readOnly className="w-full px-4 py-2 border rounded-lg bg-gray-200 cursor-not-allowed"/></div>
                            <div><label className="block text-gray-700 font-medium mb-1">メールアドレス</label><input type="email" value={email} readOnly className="w-full px-4 py-2 border rounded-lg bg-gray-200 cursor-not-allowed"/></div>
                        </div>
                    </div>

                    <div className="pt-4">
                        <label className="flex items-start">
                            <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} className="mt-1 h-5 w-5 text-orange-600 focus:ring-orange-500 rounded"/>
                            <span className="ml-3 text-sm text-gray-600">
                                <button type="button" onClick={() => setShowTerms(true)} className="text-blue-600 hover:underline">
                                    パートナー利用規約
                                </button>
                                および全額返金保証の条件に同意し、広告掲載および紹介料プログラム（月額3,850円/税込）へ申し込みます。
                            </span>
                        </label>
                    </div>
                    
                    {stripeError && ( <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-md flex items-center"><XCircleIcon className="h-5 w-5 mr-3"/><p className="text-sm">決済設定が不完全なため、お申し込みを完了できません。サイト管理者にご連絡ください。</p></div> )}
                    {error && !stripeError && ( <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-md flex items-center"><XCircleIcon className="h-5 w-5 mr-3"/><p className="text-sm">{error}</p></div> )}

                    <button type="button" onClick={handleSubmit} disabled={isLoading || !isFormValid || stripeError} className="w-full py-4 mt-4 text-white text-lg font-bold bg-gradient-to-r from-orange-500 to-red-500 rounded-lg hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300">
                        {getButtonText()}
                    </button>
                    <p className="text-sm text-center -mt-2 text-gray-500">クレジットカードでのお支払いは上記からお願いします。</p>

                    <section className="mt-12 pt-8 border-t text-center">
                        <h3 className="text-xl font-extrabold mb-4">請求書でのお支払いをご希望の方へ</h3>
                        <p className="text-gray-600 mb-6 text-sm">
                            御請求書でのお支払いについては、年間39,600円を前払いにてご精算いただきます。<br />
                            ご希望の方は、**フォームの情報をご確認の上、規約に同意した後**、下のボタンから**請求書PDFを即時ダウンロード**してください。ご入金確認後に本登録完了となります。
                        </p>
                        {invoiceDownloadSuccess && (
                            <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 rounded-md flex items-center justify-center mb-4 max-w-md mx-auto">
                                <DownloadIcon className="h-5 w-5 mr-3"/>
                                <p className="text-sm font-bold">請求書のダウンロードを開始しました！</p>
                            </div>
                        )}
                        <button
                            onClick={handleRegisterAndInvoice}
                            disabled={isInvoiceProcessing || !isFormValid}
                            className="inline-flex items-center justify-center w-full max-w-md py-3 text-white text-lg font-bold bg-gradient-to-r from-teal-500 to-cyan-500 rounded-lg hover:shadow-lg disabled:opacity-50 transition-all duration-300"
                        >
                            {isInvoiceProcessing && <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 0 1 8-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 0 1 4 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>}
                            <DownloadIcon className="w-5 h-5 mr-2" />
                            {getInvoiceButtonText()}
                        </button>
                        {!isFormValid && <p className="text-red-500 text-sm mt-2">※ PDFダウンロードには、規約への同意が必要です。</p>}
                    </section>
                </form>
            </div>
        </section>
    );
});
RegistrationForm.displayName = 'RegistrationForm';

const TermsModal = ({ onClose }: { onClose: () => void }) => (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
        <div className="bg-white p-6 rounded-lg max-w-2xl w-full max-h-[90vh] flex flex-col">
            <h2 className="text-xl font-bold mb-4 border-b pb-2">パートナー利用規約</h2>
            <div className="overflow-y-auto space-y-4 pr-2">
                <p><strong>第1条（本規約の適用範囲）</strong><br />本規約は、株式会社adtown（以下「当社」といいます。）が提供する「みんなの那須アプリ」パートナープログラム（以下「本サービス」といいます。）の利用に関する一切の関係に適用されます。</p>
                <p><strong>第2条（本サービスの利用資格）</strong><br />本サービスは、当社が別途定める審査基準を満たした法人または個人事業主（以下「パートナー」といいます。）のみが利用できるものとします。申込者は、当社が要求する情報が真実かつ正確であることを保証するものとします。</p>
                <p><strong>第3条（利用料金）</strong><br />パートナーは、当社に対し、別途定める利用料金（月額3,850円（税込）または年額39,600円（税込））を支払うものとします。支払い方法は、クレジットカード決済または銀行振込（年額一括のみ）とします。</p>
                <p><strong>第4条（禁止事項）</strong><br />パートナーは、本サービスの利用にあたり、以下の行為を行ってはなりません。<br />1. 法令または公序良俗に違反する行為<br />2. 犯罪行為に関連する行為<br />3. 当社のサーバーまたはネットワークの機能を破壊したり、妨害したりする行為<br />4. 当社のサービスの運営を妨害するおそれのある行為<br />5. 他のパートナーに関する個人情報等を収集または蓄積する行為<br />6. 不正な目的を持って本サービスを利用する行為<br />7. 当社または第三者の知的財産権、肖像権、プライバシー、名誉その他の権利または利益を侵害する行為<br />8. その他、当社が不適切と判断する行為</p>
                <p><strong>第5条（紹介手数料）</strong><br />1. パートナーは、当社が提供する専用のQRコードを経由してアプリ利用者が有料会員登録を行った場合、当社所定の紹介手数料（以下「手数料」といいます。）を受け取ることができます。<br />2. 手数料は、有料会員の月額利用料金の30%とします。<br />3. 手数料は、月末締めで計算し、翌々月15日にパートナーが指定する銀行口座へ振り込むものとします。ただし、振込額の合計が3,000円に満たない場合は、支払いは翌月以降に繰り越されるものとします。</p>
                <p><strong>第6条（全額返金保証）</strong><br />1. 本サービスの利用開始から1年経過した時点で、パートナーが受け取った手数料の累計額が、支払った年間のパートナー費用（46,200円クレジットカード決済、39,600円請求書払い決済）に満たなかった場合、パートナーは当社に対し、支払った費用の全額返金を請求することができます。<br />2. 本保証は、実店舗を有し、来店客への案内が可能なパートナーで、QRコードスタンドをお客様の見える場所に設置することを対象とします。<br />3. 返金請求は、利用開始から1年経過後、30日以内に当社所定の方法で行うものとします。</p>
                <p><strong>第7条（契約期間と解約）</strong><br />1. 本サービスの契約期間は、申込日を起算日として1年間とします。期間満了までにいずれかの当事者から解約の申し出がない場合、契約は同一条件で1年間自動更新されるものとします。<br />2. パートナーは、いつでも解約を申し出ることができますが、契約期間中の利用料金の返金は行わないものとします（第6条の全額返金保証を除く）。次回の更新日までに解約手続きをいただければ、追加の料金は発生いたしません。</p>
                <p><strong>第8条（本サービスの提供の停止等）</strong><br />当社は、以下のいずれかの事由があると判断した場合、パートナーに事前に通知することなく本サービスの全部または一部の提供を停止または中断することができるものとします。<br />1. 本サービスにかかるコンピュータシステムの保守点検または更新を行う場合<br />2. 地震、落雷、火災、停電または天災などの不可抗力により、本サービスの提供が困難となった場合<br />3. その他、当社が本サービスの提供が困難と判断した場合</p>
                <p><strong>第9条（免責事項）</strong><br />当社は、本サービスに起因してパートナーに生じたあらゆる損害について一切の責任を負いません。ただし、本サービスに関する当社とパートナーとの間の契約が消費者契約法に定める消費者契約となる場合、この免責規定は適用されません。</p>
                <p><strong>第10条（準拠法・裁判管轄）</strong><br />本規約の解釈にあたっては、日本法を準拠法とします。本サービスに関して紛争が生じた場合には、当社の本店所在地を管轄する裁判所を専属的合意管轄とします。</p>
            </div>
            <div className="mt-6 flex justify-end">
                <button onClick={onClose} className="bg-orange-500 text-white px-6 py-2 rounded-lg hover:bg-orange-600">
                    閉じる
                </button>
            </div>
        </div>
    </div>
);


//================================================================================
// メインページコンポーネント (ロジック層)
//================================================================================
const PartnerSignupPage = () => {
    const router = useRouter();
    
    // --- State管理 ---
    const [storeName, setStoreName] = useState('');
    const [address, setAddress] = useState('');
    const [contactPerson, setContactPerson] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [email, setEmail] = useState('');
    const [agreed, setAgreed] = useState(false);
    const [isDataLoading, setIsDataLoading] = useState(true);
    const [isLoading, setIsLoading] = useState(false);
    const [isInvoiceProcessing, setIsInvoiceProcessing] = useState(false);
    const [invoiceDownloadSuccess, setInvoiceDownloadSuccess] = useState(false);
    const [showTerms, setShowTerms] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [stripeError, setStripeError] = useState(false);
    
    const registrationFormRef = useRef<HTMLDivElement>(null);

    // --- 副作用 (Effect) ---
    useEffect(() => { 
        if (!stripePromise) { 
            console.error("Stripe public key is not set in environment variables."); 
            setStripeError(true); 
        } 

        const unsubscribe = onAuthStateChanged(auth, async (user: User | null) => {
            if (user && user.email) {
                try {
                    const userDocRef = doc(db, 'users', user.uid);
                    const userDocSnap = await getDoc(userDocRef);

                    if (userDocSnap.exists()) {
                        const data = userDocSnap.data();
                        setStoreName(data.companyName || '');
                        setAddress(data.address || '');
                        setContactPerson(data.displayName || '');
                        setPhoneNumber(data.phoneNumber || '');
                        setEmail(user.email);
                    } else {
                        setError("ユーザー情報が見つかりませんでした。");
                    }
                } catch (err) {
                    console.error("Firestore data fetch failed:", err);
                    setError("ユーザー情報の読み込みに失敗しました。");
                } finally {
                    setIsDataLoading(false);
                }
            } else {
                router.push('/partner/login');
            }
        });
        return () => unsubscribe();
    }, [router]);

    const isFormValid = !!(storeName && agreed);

    const scrollToForm = () => {
        registrationFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    const handleApiRequest = async (endpoint: string, body: object) => {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });
        return { ok: response.ok, data: await response.json() };
    };

    const handleRegisterAndInvoice = async () => {
        if (!isFormValid) { 
            setError('PDFダウンロードには、利用規約への同意が必要です。'); 
            scrollToForm(); 
            return; 
        }
        setIsInvoiceProcessing(true);
        setError(null);
        setInvoiceDownloadSuccess(false);

        try {
            const { ok, data } = await handleApiRequest('/api/auth/register-and-create-invoice', { 
                serviceType: 'adver', companyName: storeName, address, contactPerson, phoneNumber, email, 
                paymentMethod: 'invoice', billingCycle: 'annual' 
            });
            
            if (!ok || !data.pdfUrl) throw new Error(data.error || '請求書の作成に失敗しました。');

            const link = document.createElement('a');
            link.href = data.pdfUrl;
            link.setAttribute('download', `invoice_${storeName}.pdf`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            setInvoiceDownloadSuccess(true);

        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsInvoiceProcessing(false);
        }
    };

    const handleSubmit = async () => {
        if (!isFormValid) { 
            setError('お申し込みには利用規約への同意が必要です。'); 
            scrollToForm(); 
            return; 
        }
        if (!stripePromise) { 
            setError('決済機能の初期化に失敗しました。ページを再読み込みしてください。');
            setStripeError(true); 
            return;
        }
        
        setIsLoading(true);
        setError(null);

        try {
            const { ok, data } = await handleApiRequest('/api/auth/register-and-subscribe', {
                serviceType: 'adver', companyName: storeName, address, contactPerson, phoneNumber, email,
                paymentMethod: 'card', billingCycle: 'monthly'
            });

            if (!ok) throw new Error(data.error || 'サーバーエラーが発生しました。');

            const { sessionId } = data;
            if (sessionId) {
                const stripe = await stripePromise;
                if(stripe) {
                    const { error: stripeRedirectError } = await stripe.redirectToCheckout({ sessionId });
                    if (stripeRedirectError) throw new Error(stripeRedirectError.message ?? 'Stripeリダイレクトエラー');
                } else {
                    throw new Error('Stripeの初期化に失敗しました。');
                }
            } else {
                throw new Error('決済セッションの作成に失敗しました。');
            }
        } catch (err: any) {
            setError(err.message);
            setIsLoading(false);
        }
    };

    const getButtonText = () => {
        if (isLoading) return '処理中...';
        if (stripeError) return '決済設定エラー';
        return 'リスクゼロで申し込む (全額返金保証付き)';
    };
    
    const getInvoiceButtonText = () => {
        if (isInvoiceProcessing) return '登録・請求書を作成中...';
        if (invoiceDownloadSuccess) return 'ダウンロード完了！再発行';
        return '請求書PDFをダウンロードして登録';
    };

    if (isDataLoading) {
        return (
            <div className="flex justify-center items-center h-screen bg-gray-50">
                <div className="text-xl font-semibold text-gray-700">ユーザー情報を読み込んでいます...</div>
            </div>
        );
    }

    return (
        <div className="bg-gray-50 text-gray-800 font-sans">
            <Head>
                <title>みんなの那須アプリ パートナー追加登録</title>
                <meta name="description" content="みんなの那須アプリのパートナープログラムに追加登録して、新しい収益源を手に入れましょう。リスクゼロの全額返金保証付き。" />
            </Head>
            
            <Header onScrollToForm={scrollToForm} />
            
            <main className="container mx-auto px-6">
                <HeroSection onScrollToForm={scrollToForm} />
                <CampaignSection registeredCount={32} />
                <WhyAppSection />
                <HowItWorksSection />
                <RevenueSimSection />
                <PartnerLogosSection />
                <SupportSection />
                <FaqSection />
                <RegistrationForm 
                    ref={registrationFormRef}
                    {...{
                        storeName, contactPerson, address, phoneNumber, email, agreed, setAgreed, 
                        error, stripeError, isLoading, isInvoiceProcessing, invoiceDownloadSuccess,
                        handleSubmit, handleRegisterAndInvoice, getButtonText, getInvoiceButtonText, setShowTerms,
                        isFormValid
                    }}
                />
            </main>
            
            <footer className="bg-white mt-20 border-t">
                <div className="container mx-auto px-6 py-8 text-center text-gray-600">
                    <p>&copy; {new Date().getFullYear()} 株式会社adtown. All Rights Reserved.</p>
                    <div className="mt-4">
                        <Link href="/legal/" className="text-sm text-gray-500 hover:underline mx-2">特定商取引法に基づく表記</Link>
                        <Link href="/privacy" className="text-sm text-gray-500 hover:underline mx-2">プライバシーポリシー</Link>
                    </div>
                </div>
            </footer>
            
            {showTerms && <TermsModal onClose={() => setShowTerms(false)} />}
        </div>
    );
};

export default PartnerSignupPage;
