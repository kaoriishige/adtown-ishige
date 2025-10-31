import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import Head from 'next/head';
import { useRouter } from 'next/router'; // useRouterを追加
// ★★★ Firebaseの認証とFirestoreのインポート ★★★
// 🚨 パスはプロジェクトに合わせてください
import { getAuth, onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { NextPage } from 'next'; 
import { auth, db } from '../../lib/firebase'; 


// --- 画像パスの定義（public/images/に配置されていることを前提とする） ---
const PARTNER_LOGOS = [
    '/images/partner-adtown.png',
    '/images/partner-aquas.png',
    '/images/partner-celsiall.png',
    '/images/partner-dairin.png',
    '/images/partner-kanon.png',
    '/images/partner-kokoro.png',
    '/images/partner-meithu.png',
    '/images/partner-midcityhotel.png',
    '/images/partner-omakaseauto.png',
    '/images/partner-poppo.png',
    '/images/partner-sekiguchi02.png',
    '/images/partner-training_farm.png',
    '/images/partner-transunet.png',
    '/images/partner-koharu.png',
    '/images/partner-yamakiya.png'
];


// --- Inline SVG Icon Components ---
const UsersIcon = (props: React.SVGProps<SVGSVGElement>) => ( <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg> );
const XCircleIcon = (props: React.SVGProps<SVGSVGElement>) => ( <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg> );
const MessageCircleIcon = (props: React.SVGProps<SVGSVGElement>) => ( <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg> );
const UserCheckIcon = (props: React.SVGProps<SVGSVGElement>) => ( <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="8.5" cy="7" r="4"></circle><polyline points="17 11 19 13 23 9"></polyline></svg> );
const ChevronDownIcon = (props: React.SVGProps<SVGSVGElement>) => ( <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><polyline points="6 9 12 15 18 9"></polyline></svg> );
const ZapIcon = (props: React.SVGProps<SVGSVGElement>) => ( <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg> );

// --- Utility Components ---
const FAQItem = ({ question, children }: { question: string, children: React.ReactNode }) => {
    const [isOpen, setIsOpen] = useState(false);
    return (
        <div className="border-b">
            <button onClick={() => setIsOpen(!isOpen)} className="w-full text-left py-5 flex justify-between items-center hover:bg-gray-50 transition-colors">
                <span className="text-lg font-medium text-gray-800 pr-2">{question}</span>
                <ChevronDownIcon className={`w-6 h-6 text-orange-500 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            {isOpen && ( <div className="pb-5 pt-2 px-2 text-gray-600 bg-gray-50">{children}</div> )}
        </div>
    )
};

// Custom hook for persistent state using sessionStorage
const usePersistentState = (key: string, defaultValue: any) => {
    const [state, setState] = useState(() => {
        if (typeof window === 'undefined') { return defaultValue; }
        try { const storedValue = window.sessionStorage.getItem(key); return storedValue ? JSON.parse(storedValue) : defaultValue; } catch (error) { console.error(error); return defaultValue; }
    });
    useEffect(() => {
        if (typeof window !== 'undefined') {
            try { window.sessionStorage.setItem(key, JSON.stringify(state)); } catch (error) { console.error(error); }
        }
    }, [key, state]);
    return [state, setState];
};


const PartnerSignupPage: NextPage = () => {
    const router = useRouter(); 
    
    // Form state management (修正済みエラー対応含む)
    const [storeName, setStoreName] = usePersistentState('partnerForm_storeName', '');
    const [companyName, setCompanyName] = usePersistentState('partnerForm_companyName', ''); // TS2304エラー回避用
    const [address, setAddress] = usePersistentState('partnerForm_address', '');
    const [area, setArea] = usePersistentState('partnerForm_area', '');
    const [contactPerson, setContactPerson] = usePersistentState('partnerForm_contactPerson', '');
    const [phoneNumber, setPhoneNumber] = usePersistentState('partnerForm_phoneNumber', '');
    const [email, setEmail] = usePersistentState('partnerForm_email', '');
    const [confirmEmail, setConfirmEmail] = usePersistentState('partnerForm_confirmEmail', '');
    const [password, setPassword] = usePersistentState('partnerForm_password', '');
    const [agreed, setAgreed] = usePersistentState('partnerForm_agreed', false);
    
    // UI state management
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showTerms, setShowTerms] = useState(false);
    
    // ロード/認証状態管理 (以前のエラー修正で追加)
    const [currentAuthUser, setCurrentAuthUser] = useState<User | null>(null);
    const [isDataLoading, setIsDataLoading] = useState(true);

    const [registeredCount] = useState(32); // Dummy value for registered stores
    const totalSlots = 100;
    const remainingSlots = totalSlots - registeredCount;

    const registrationFormRef = useRef<HTMLDivElement>(null);


    // --- Firebase認証とデータ取得（自動入力ロジック） ---
    useEffect(() => {
        if (!auth || !db) {
            setError("Firebase設定がありません。");
            setIsDataLoading(false);
            return;
        }

        const unsubscribe = onAuthStateChanged(auth, async (user: User | null) => {
            if (user && user.email) {
                setCurrentAuthUser(user);
                try {
                    const userDocRef = doc(db, 'users', user.uid);
                    const userDocSnap = await getDoc(userDocRef);

                    if (userDocSnap.exists()) {
                        const userData = userDocSnap.data();
                        
                        const contact = userData.contactPerson || userData.displayName || user.email.split('@')[0] || '';
                        const address = userData.address || '';
                        const fetchedCompanyName = userData.companyName || userData.storeName || '';
                        const phoneNumber = userData.phoneNumber || '';
                        const userEmail = user.email;

                        // フォームのStateを更新
                        setStoreName(fetchedCompanyName); 
                        setCompanyName(fetchedCompanyName); // TSエラー回避用
                        setAddress(address);
                        setContactPerson(contact);
                        setPhoneNumber(phoneNumber);
                        setEmail(userEmail);
                        setConfirmEmail(userEmail); 

                        const roles = userData.roles || [];
                        if (roles.includes('adver')) {
                            alert('広告パートナーとして既に登録されています。ダッシュボードへ移動します。');
                            router.push('/partner/dashboard');
                            return; 
                        }

                    } else {
                        setEmail(user.email);
                    }
                } catch (e: any) {
                    console.error("Error fetching user data for auto-fill:", e);
                    setError(`ユーザーデータ取得エラー: ${e.message}.`);
                }
                setIsDataLoading(false);
            } else {
                setIsDataLoading(false);
            }
        });
        return () => unsubscribe();
    }, [router, setAddress, setCompanyName, setContactPerson, setEmail, setPhoneNumber, setConfirmEmail, setStoreName]); 


    
    // Auto-detect area from address
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

    // Check if form is complete (to control button's disabled state)
    const isPasswordRequired = !currentAuthUser;
    
    // フォームバリデーションロジック (passwordは新規登録時のみ必須)
    const isFormValid = !!(
        storeName && 
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


    /**
     * 【新規無料登録】フォーム入力の検証と無料アカウントの作成、ログインページへリダイレクト
     */
    const handleFreeSignup = async () => {
        setError(null);
        
        // Client-side validation
        if (!isFormValid) {
            setError('パートナーダッシュボードへ進むには、フォームの必須項目を全て満たし、規約に同意してください。');
            scrollToForm();
            return;
        }

        setIsLoading(true);
        try {
            const existingUid = currentAuthUser?.uid;

            // New API call for free registration (APIパスは適宜修正してください)
            const response = await fetch('/api/auth/register-free-partner', { 
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    serviceType: 'adver', // ロールとして'adver'を付与
                    companyName: storeName,
                    address,
                    area,
                    contactPerson,
                    phoneNumber,
                    email,
                    password: password, // パスワードは空でも送信 (API側で処理)
                    existingUid: existingUid // 既存ユーザーのUIDを渡す
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

            // 成功: sessionStorageをクリアし、ログインページへリダイレクト
            Object.keys(window.sessionStorage).forEach(key => { 
                if (key.startsWith('partnerForm_')) { 
                    window.sessionStorage.removeItem(key); 
                } 
            });
            
            // 登録成功後、ログインページへリダイレクト（ユーザーが自分でログインする必要がある）
            router.push('/partner/login?signup_success=true');

        } catch (err: any) {
            console.error('Free signup error:', err);
            if (!error) setError(err.message || '不明なエラーが発生しました。');
            setIsLoading(false);
        }
    };


    const getButtonText = () => {
        if (isLoading) return 'アカウント作成中...';
        if (isDataLoading) return '読み込み中...';
        return '無料でダッシュボードに進む';
    };
    
    // ロード中UI
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
                <title>{"みんなの那須アプリ パートナー無料登録"}</title>
            </Head>
            <header className="bg-white shadow-md sticky top-0 z-50">
                <div className="container mx-auto px-6 py-4 flex justify-between items-center">
                    <h1 className="text-2xl font-bold text-gray-800">みんなの那須アプリ</h1>
                    <button onClick={scrollToForm} className="bg-orange-500 text-white font-bold py-2 px-6 rounded-full hover:bg-orange-600 transition duration-300 shadow-lg animate-pulse">
                        無料集客広告へ
                    </button>
                </div>
            </header>
            <main className="container mx-auto px-6">
                
                {/* Hero Section - タイトルを変更し、無料を強調 */}
                <section className="text-center pt-16 pb-8">
                    <h2 className="text-3xl font-bold text-gray-800">おかげさまで株式会社adtown20周年、感謝企画</h2>
                    <p className="mt-4 text-lg text-gray-600">日頃よりご支援いただいている那須地域の皆さまへの感謝を込めて、
                    このたび「みんなの那須アプリ」を開発いたしました。</p>
                </section>
                
                <section className="text-center py-16 md:py-24">
                    <p className="text-orange-500 font-semibold">地元企業＆店舗を応援するadtownからのご提案</p>
                    <h2 className="text-4xl md:text-5xl font-extrabold mt-4 leading-tight">
                        「集客に困っている店舗様」は必見！<br />
                        <span className="text-orange-600"> アプリ集客広告を無料でスタート！</span><br />
                        ！無料登録で広告管理ページへアクセス！
                    </h2>
                    <p className="mt-6 text-lg text-gray-600 max-w-3xl mx-auto">
                        まずは<strong className="font-bold">無料</strong>で広告管理ページにログインし、店舗情報の登録（広告掲載）を始めましょう。
                        有料機能（クーポン、集客AI、紹介料、お客様を貴店LINEに誘導）は、広告管理ページ内で**いつでも**お申し込みいただけます。
                    </p>
                    <div className="mt-8">
                        <button onClick={scrollToForm} className="bg-gradient-to-r from-teal-500 to-blue-500 text-white font-extrabold py-4 px-10 rounded-full text-lg shadow-xl hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300">
                            無料で集客広告を出す
                        </button>
                        <p className="mt-2 text-sm text-gray-500">登録は3分、料金は一切かかりません。</p>
                    </div>
                </section>

                {/* ★★★ 修正箇所: 集客の悩みに絞ったセクションを追加 ★★★ */}
                <section className="mt-12 md:mt-16 py-8 bg-white rounded-2xl shadow-lg border border-gray-200">
                    <div className="max-w-4xl mx-auto text-center px-6">
                        <h3 className="text-2xl font-extrabold text-gray-800 mb-6">
                            こんな集客の悩み、ありませんか？
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left max-w-2xl mx-auto">
                            
                            {/* 1. 集客の悩み (ソース3, 10) */}
                            <div className="flex items-start space-x-3 p-4 bg-red-50 rounded-lg border border-red-200">
                                <XCircleIcon className="w-6 h-6 text-red-600 flex-shrink-0 mt-1" />
                                <p className="text-lg font-medium text-gray-700">
                                    思うように、お客様が来てくれない... 
                                </p>
                            </div>
                            {/* 2. 集客の悩み (ソース3, 11) */}
                            <div className="flex items-start space-x-3 p-4 bg-red-50 rounded-lg border border-red-200">
                                <XCircleIcon className="w-6 h-6 text-red-600 flex-shrink-0 mt-1" />
                                <p className="text-lg font-medium text-gray-700">
                                    何を、どのようにして集客するのかわからない... 
                                </p>
                            </div>
                            
                        </div>
                        <p className="mt-8 text-xl font-bold text-orange-600">
                            「みんなの那須アプリ」の無料登録が、その解決の第一歩です！
                        </p>
                    </div>
                </section>
                {/* ★★★ 新規追加セクションここまで ★★★ */}

                {/* Campaign Section - 内容を無料登録向けに変更 */}
                <section className="bg-yellow-100 border-t-4 border-b-4 border-yellow-400 text-yellow-900 p-6 rounded-lg shadow-md my-12 text-center">
                    <h3 className="text-2xl font-bold">【先着100店舗様 限定】有料機能の**月額費用割引**キャンペーン実施中！</h3>
                    <p className="mt-2 text-lg">
                        有料機能がすべて使えるパートナー制度（集客AI、紹介手数料で収入アップなど）は、月額<strong className="font-bold">4,400円</strong>ですが、
                        先着100社様に限り、永続的に<strong className="font-bold text-red-600">月額3,850円</strong>でご利用いただけます。
                        <br/>**無料登録しても、この割引枠を確保できます。**
                    </p>
                    <div className="mt-4 bg-white p-4 rounded-lg flex items-center justify-center space-x-2 md:space-x-4 max-w-md mx-auto">
                        <p className="text-md md:text-lg font-semibold">現在の申込店舗数:</p>
                        <div className="text-2xl md:text-3xl font-extrabold text-gray-800 tracking-wider bg-gray-100 px-3 py-1 rounded">{registeredCount}店舗</div>
                        <p className="text-md md:text-lg font-semibold text-red-600">残り {remainingSlots} 枠！</p>
                    </div>
                </section>


                {/* App Advantage Section */}
                <section className="mt-20 bg-white rounded-2xl shadow-xl p-8 md:p-12 border border-gray-200">
                    <div className="max-w-4xl mx-auto text-center">
                        <UsersIcon className="w-12 h-12 mx-auto text-orange-500 mb-4" />
                        <h3 className="text-3xl font-extrabold">なぜ今、アプリ広告（集客マッチングAI）なのか？答えは「圧倒的な見込み客」です。</h3>
                        <p className="mt-6 text-lg text-gray-600 leading-relaxed">
                            『みんなの那須アプリ』は、ほとんどの機能が<strong className="text-orange-600 font-bold">無料</strong>で使えるため、那須地域の住民にとって「ないと損」なアプリになりつつあります。
                            先行登録者はすでに<strong className="text-orange-600 font-bold">3,000人</strong>を突破。口コミでその輪は確実に広がり、<strong className="text-orange-600 font-bold">5,000人、10,000人</strong>の巨大なユーザーコミュニティへと成長します。
                            貴店の広告やクーポン、フードロスを、アプリ広告（集客マッチングAI）出し放題で、この<strong className="font-bold">爆発的に増え続ける「未来の常連客」</strong>に直接届くのです。
                        </p>
                    </div>
                </section>


                {/* Monetization Mechanism Section - 有料機能として再定義 */}
                <section className="mt-20">
                    <h3 className="text-3xl font-extrabold text-center">【有料の価値】クーポン、集客AI、紹介料取得で利益を最大化</h3>
                    <p className="mt-4 text-center text-gray-600 max-w-3xl mx-auto">無料広告で集客の第一歩を踏み出した後、さらに強力な有料機能で利益を追求できます。すべての有料機能は、ダッシュボードから月額料金でご利用いただけます。</p>
                    <div className="mt-12 grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                        <div className="text-center p-6 bg-yellow-50 rounded-lg shadow-lg border-yellow-300 border">
                            <div className="bg-yellow-500 text-white w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">AI</div>
                            <h4 className="text-xl font-bold">集客マッチングAI出し放題（有料）</h4>
                            <p className="mt-2 text-gray-600">アプリユーザーの行動データに基づき、最も貴店に興味を持つであろう「理想の顧客」にピンポイントで広告を配信し、貴店のLINEに誘導します。</p>
                        </div>
                        <div className="text-center p-6 bg-orange-50 rounded-lg shadow-lg border-orange-300 border">
                            <div className="bg-orange-500 text-white w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">¥</div>
                            <h4 className="text-xl font-bold">紹介料取得プログラム（有料）</h4>
                            <p className="mt-2 text-gray-600">お客様が貴店のQRコード経由でアプリの有料会員になると、その売上の30%を永続的に収益として受け取れます。</p>
                        </div>
                        <div className="text-center p-6 bg-red-50 rounded-lg shadow-lg border-red-300 border">
                            <div className="bg-red-500 text-white w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">C</div>
                            <h4 className="text-xl font-bold">クーポン・特典・フードロス機能（有料）</h4>
                            <p className="mt-2 text-gray-600">アプリ内で強力な集客ツールであるクーポン・特典や、フードロス情報を自由に発行・管理できます。</p>
                        </div>
                    </div>
                    <div className="mt-12 text-center bg-green-50 border-t-4 border-green-400 p-6 rounded-lg"><p className="text-xl font-bold text-green-800">まずは無料登録から始め、これらの有料機能は後からお申込みいただけます。</p></div>
                </section>


                {/* Revenue Simulation Section, Partner Logos Section, Support System Section, FAQ Section - 軽微な修正/変更なし */}
                {/* Revenue Simulation Section */}
                <section className="mt-20 bg-white rounded-2xl shadow-xl p-8 md:p-12 border border-gray-200">
                    <h3 className="text-3xl font-extrabold text-center">「紹介手数料プラン」もし、1日にたった2人または5人のお客様が**有料プランに**移行したら？</h3>
                    <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="bg-orange-50 p-8 rounded-lg border-2 border-dashed border-orange-300"><h4 className="font-bold text-xl text-center">例：カフェ・美容室の場合</h4><p className="text-center text-sm text-gray-600">1日に2人が有料会員に移行</p><p className="mt-4 text-center text-lg text-gray-700">2人/日 × 30日 = <span className="font-bold text-2xl text-orange-600">月60人</span>の紹介</p><p className="mt-2 text-center text-xl font-bold text-gray-800">月間紹介料: <span className="text-red-600">8,640円</span></p><p className="mt-4 text-center text-xl font-bold text-gray-800">年間収益: <span className="text-4xl font-extrabold text-red-600">103,680円</span></p></div>
                        <div className="bg-blue-50 p-8 rounded-lg border-2 border-dashed border-blue-300"><h4 className="font-bold text-xl text-center">例：レストラン・居酒屋の場合</h4><p className="text-center text-sm text-gray-600">1日に5人が有料会員に移行</p><p className="mt-4 text-center text-lg text-gray-700">5人/日 × 30日 = <span className="font-bold text-2xl text-blue-600">月150人</span>の紹介</p><p className="mt-2 text-center text-xl font-bold text-gray-800">月間紹介料: <span className="text-red-600">21,600円</span></p><p className="mt-4 text-center text-xl font-bold text-gray-800">年間収益: <span className="text-4xl font-extrabold text-red-600">259,200円</span></p></div>
                    </div>
                    <p className="mt-4 text-sm text-gray-500 text-center">※この収益は、有料プラン加入後に、広告掲載による本来の**集客効果とは別に**得られるものです。</p>
                </section>


                {/* Partner Logos Section */}
                <section className="mt-20 text-center">
                    <h3 className="text-2xl font-bold text-gray-700">すでに那須地域の多くの店舗様がこのチャンスに気づいています</h3>
                    <div className="mt-8 flex flex-wrap justify-center items-center gap-x-8 gap-y-6 opacity-80">
                        {PARTNER_LOGOS.map((logoPath, index) => (
                            <Image
                                key={index}
                                src={logoPath}
                                alt={`パートナーロゴ ${index + 1}`}
                                width={150}
                                height={50}
                                className="object-contain"
                                unoptimized={true}
                            />
                        ))}
                    </div>
                </section>


                {/* Support System Section */}
                <section className="mt-20 text-center">
                    <h3 className="text-3xl font-extrabold">安心を保証するサポート体制</h3>
                    <p className="mt-4 text-gray-600 max-w-2xl mx-auto">導入後も、専任の担当者が貴店を徹底的にサポートします。ITが苦手な方でも安心してご利用いただけます。</p>
                    <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
                        <div className="bg-white p-6 rounded-lg shadow-md border"><MessageCircleIcon className="w-10 h-10 mx-auto text-green-500"/><p className="mt-4 font-bold text-lg">LINEチャットサポート</p></div>
                        <div className="bg-white p-6 rounded-lg shadow-md border"><UserCheckIcon className="w-10 h-10 mx-auto text-orange-500"/><p className="mt-4 font-bold text-lg">専任担当者</p></div>
                    </div>
                </section>


                {/* FAQ Section - 回答を有料化に合わせて変更 */}
                <section className="mt-24 max-w-4xl mx-auto">
                    <h3 className="text-3xl font-extrabold text-center">よくある質問</h3>
                    <div className="mt-8 bg-white p-4 md:p-8 rounded-2xl shadow-xl border">
                        <FAQItem question="費用は本当に無料ですか？">
                            <p className="leading-relaxed">はい、店舗情報の登録とアプリへの広告掲載は**永続的に無料**です。ただし、集客マッチングAI、クーポン・特典機能、アプリ利用者の紹介料取得プログラムといった**有料機能**をご利用になる場合のみ、月額<strong className="font-bold">4,400円</strong>（先着100社限定で3,850円）が発生します。有料機能はダッシュボード内からいつでもお申込み・停止が可能です。</p>
                        </FAQItem>
                        <FAQItem question="紹介手数料はどのように支払われますか？">
                            <p className="leading-relaxed">有料プラン加入済みのパートナー様には、毎月末締めで計算し、翌々月15日にご指定の銀行口座へお振り込みします。振込額の合計が3,000円に満たない場合は、お支払いは翌月以降に繰り越されます。パートナー様専用のダッシュボードで、いつでも収益状況をご確認いただけます。</p>
                        </FAQItem>
                        <FAQItem question="有料プランの途中で解約（停止）はできますか？">
                            <p className="leading-relaxed">はい、いつでも管理画面から次回の更新を停止（解約）することができます。契約期間の縛りはありません。ただし、月の途中で停止した場合でも、日割りの返金はございませんのでご了承ください。</p>
                        </FAQItem>
                    </div>
                </section>


                {/* Registration Form Section - フォームのメッセージとボタンの変更 */}
                <section ref={registrationFormRef} id="registration-form" className="mt-20 pt-10">
                    <div className="bg-white p-8 md:p-12 rounded-2xl shadow-2xl w-full max-w-3xl mx-auto border border-gray-200">
                        <div className="text-center mb-10">
                            <p className="text-gray-700 leading-relaxed">
                                まずは無料で広告管理ページにログインし、すぐに広告掲載をスタートしましょう。<br/>
                                <strong className="text-red-600 font-bold">有料機能の割引枠（月額4,400円→3,850円）</strong>を確保するためにも、今すぐご登録ください。
                            </p>
                            {/* ログイン中かどうかのメッセージ */}
                            {currentAuthUser && (
                                <p className="text-sm text-gray-500 mt-2">
                                    現在ログイン中: <span className="font-semibold">{currentAuthUser.email || '---'}</span>
                                </p>
                            )}
                        </div>
                        <h2 className="text-3xl font-bold text-center mb-2">パートナー無料登録</h2>
                        
                        {/* ログイン中ユーザー情報の自動入力表示 */}
                        {currentAuthUser && (storeName || address || phoneNumber) ? (
                            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-900 mb-6">
                                <strong>💡 {currentAuthUser.email}</strong> でログイン中です。他のサービス（求人など）の登録情報が自動入力されました。
                            </div>
                        ) : (
                            <p className="text-center text-gray-600 mb-8">
                                以下のフォームをご入力ください。ご登録後、広告管理ページにログインできるようになります。
                            </p>
                        )}


                        <form className="space-y-6" onSubmit={(e) => e.preventDefault()}> {/* Prevent form submission */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div> <label className="block text-gray-700 font-medium mb-2">店舗名・企業名 *</label> <input type="text" value={storeName} onChange={(e) => setStoreName(e.target.value)} required readOnly={!!storeName && !!currentAuthUser} className="w-full px-4 py-2 border rounded-lg focus:ring-orange-500 focus:border-orange-500 read-only:bg-gray-100 read-only:cursor-not-allowed"/> </div>
                                <div> <label className="block text-gray-700 font-medium mb-2">ご担当者名 *</label> <input type="text" value={contactPerson} onChange={(e) => setContactPerson(e.target.value)} required readOnly={!!contactPerson && !!currentAuthUser} className="w-full px-4 py-2 border rounded-lg focus:ring-orange-500 focus:border-orange-500 read-only:bg-gray-100 read-only:cursor-not-allowed"/> </div>
                            </div>
                            <div> <label className="block text-gray-700 font-medium mb-2">住所 *</label> <input type="text" value={address} onChange={(e) => setAddress(e.target.value)} required readOnly={!!address && !!currentAuthUser} placeholder="例：栃木県那須塩原市共墾社108-2" className="w-full px-4 py-2 border rounded-lg focus:ring-orange-500 focus:border-orange-500 read-only:bg-gray-100 read-only:cursor-not-allowed"/> {address && !area && <p className="text-red-500 text-xs mt-1">那須塩原市、那須町、大田原市のいずれかである必要があります。</p>} </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t">
                                <div> <label className="block text-gray-700 font-medium mb-2">電話番号 *</label> <input type="tel" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} required readOnly={!!phoneNumber && !!currentAuthUser} className="w-full px-4 py-2 border rounded-lg focus:ring-orange-500 focus:border-orange-500 read-only:bg-gray-100 read-only:cursor-not-allowed"/> </div>
                                
                                <div> <label className="block text-gray-700 font-medium mb-2">パスワード (6文字以上) *</label> <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required={isPasswordRequired} minLength={isPasswordRequired ? 6 : 0} className="w-full px-4 py-2 border rounded-lg focus:ring-orange-500 focus:border-orange-500"/> </div>
                                
                                <div> <label className="block text-gray-700 font-medium mb-2">メールアドレス *</label> <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required readOnly={!!currentAuthUser} className="w-full px-4 py-2 border rounded-lg focus:ring-orange-500 focus:border-orange-500 read-only:bg-gray-100 read-only:cursor-not-allowed"/> </div>
                                <div> <label className="block text-gray-700 font-medium mb-2">メールアドレス（確認用）*</label> <input type="email" value={confirmEmail} onChange={(e) => setConfirmEmail(e.target.value)} required className="w-full px-4 py-2 border rounded-lg focus:ring-orange-500 focus:border-orange-500"/> </div>
                            </div>
                            <div className="pt-4">
                                <label className="flex items-start">
                                    <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} className="mt-1 h-5 w-5 text-orange-600 focus:ring-orange-500 rounded"/>
                                    <span className="ml-3 text-sm text-gray-600">
                                        <button type="button" onClick={() => setShowTerms(true)} className="text-blue-600 hover:underline">
                                            パートナー利用規約
                                        </button>
                                        （広告掲載プログラム、紹介料プログラム**無料版**）に同意します。
                                    </span>
                                </label>
                            </div>
                            
                            {/* Error display area */}
                            {error && ( <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-md flex items-center"><XCircleIcon className="h-5 w-5 mr-3"/><p className="text-sm">{error}</p></div> )}


                            {/* メインの登録ボタン: 無料登録を実行 */}
                            <button type="button" onClick={handleFreeSignup} disabled={isLoading || !isFormValid} className="w-full py-4 mt-4 text-white text-lg font-bold bg-gradient-to-r from-teal-500 to-cyan-500 rounded-lg hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300">
                                {getButtonText()}
                            </button>
                            <p className="text-sm text-center -mt-2 text-gray-500">ご登録後、ログインしてダッシュボードより有料機能をお申込みいただけます。</p>
                        </form>
                        <p className="text-sm text-center mt-6">
                            すでにアカウントをお持ちですか？ <Link href="/partner/login" className="text-orange-600 hover:underline font-medium">ログインはこちら</Link>
                        </p>
                    </div>
                </section>
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

            {/* 利用規約モーダル */}
            {showTerms && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white p-6 rounded-lg max-w-2xl w-full max-h-[90vh] flex flex-col">
                        <h2 className="text-xl font-bold mb-4 border-b pb-2">パートナー利用規約</h2>
                        <div className="overflow-y-auto space-y-4 pr-2">
                            <p><strong>第1条（本規約の適用範囲）</strong><br />本規約は、株式会社adtown（以下「当社」といいます。）が提供する「みんなの那須アプリ」パートナープログラム（以下「本サービス」といいます。）の利用に関する一切の関係に適用されます。</p>
                            <p><strong>第2条（本サービスの利用資格）</strong><br />本サービスは、当社が別途定める審査基準を満たした法人または個人事業主（以下「パートナー」といいます。）のみが利用できるものとします。申込者は、当社が要求する情報が真実かつ正確であることを保証するものとします。</p>
                            <p><strong>第3条（利用料金）</strong><br />**本サービスの基本機能（店舗情報登録・広告掲載）は無料です。**ただし、以下の<strong className="font-bold">有料機能</strong>を利用する場合、パートナーは当社に対し、別途定める利用料金（月額<strong className="font-bold">4,400円</strong>（税込））を支払うものとします。有料機能への申し込みは、ダッシュボード内で行えます。<br/>1. クーポン・特典機能<br/>2. 集客マッチングAIの利用<br/>3. アプリ利用者の紹介料取得プログラム<br/>支払い方法は、クレジットカード決済または銀行振込（年額一括のみ、ダッシュボード内参照）とします。</p>
                            
                            <p><strong>第5条（紹介手数料）</strong><br />1. パートナーは、**有料プランに加入している場合**、当社が提供する専用のQRコードを経由してアプリ利用者が有料会員登録を行った場合、当社所定の紹介手数料（以下「手数料」といいます。）を受け取ることができます。<br />2. 手数料は、有料会員の月額利用料金の30%とします。<br />3. 手数料は、月末締めで計算し、翌々月15日にパートナーが指定する銀行口座へ振り込みます。ただし、振込額の合計が3,000円に満たない場合は、お支払いは翌月以降に繰り越されます。パートナー様専用のダッシュボードで、いつでも収益状況をご確認いただけます。</p>
                            <p><strong>第6条（契約期間と解約）</strong><br />1. 本サービスの有料プランの契約期間は、申込日を起算日として1ヶ月または1年間とします。期間満了までにいずれかの当事者から解約の申し出がない場合、契約は同一条件で自動更新されるものとします。<br />2. パートナーは、いつでも有料プランの解約を申し出ることができますが、契約期間中の利用料金の返金は行わないものとします（月額払いの場合）。次回の更新日までに解約手続きをいただければ、追加の料金は発生いたしません。</p>
                            <p><strong>第7条（本サービスの提供の停止等）</strong><br />当社は、以下のいずれかの事由があると判断した場合、パートナーに事前に通知することなく本サービスの全部または一部の提供を停止または中断することができるものとします。<br />1. 本サービスにかかるコンピュータシステムの保守点検または更新を行う場合<br />2. 地震、落雷、火災、停電または天災などの不可抗力により、本サービスの提供が困難となった場合<br />3. その他、当社が本サービスの提供が困難と判断した場合</p>
                            <p><strong>第8条（免責事項）</strong><br />当社は、本サービスに起因してパートナーに生じたあらゆる損害について一切の責任を負いません。ただし、本サービスに関する当社とパートナーとの間の契約が消費者契約法に定める消費者契約となる場合、この免責規定は適用されません。</p>
                            <p><strong>第9条（準拠法・裁判管轄）</strong><br />本規約の解釈にあたっては、日本法を準拠法とします。本サービスに関して紛争が生じた場合には、当社の本店所在地を管轄する裁判所を専属的合意管轄とします。</p>
                        </div>
                        <div className="mt-6 flex justify-end">
                            <button onClick={() => setShowTerms(false)} className="bg-orange-500 text-white px-6 py-2 rounded-lg hover:bg-orange-600">閉じる</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};


export default PartnerSignupPage;

