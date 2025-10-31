import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import Head from 'next/head';
import { useRouter } from 'next/router'; // useRouterを追加
// ★★★ Firebaseの認証とFirestoreのインポートを追加 ★★★
import { getAuth, onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../../lib/firebase'; // 🚨 パスはプロジェクトに合わせてください
import { NextPage } from 'next'; // NextPageのインポートを追加
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
const DownloadIcon = (props: React.SVGProps<SVGSVGElement>) => ( <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg> );
const CheckCircleIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <polyline points="22 4 12 14.01 9 11.01" />
  </svg>
);


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


const RecruitSignupPage: NextPage = () => { // NextPage 型を追加
    const router = useRouter(); 
    
    // Form state management
    const [companyName, setCompanyName] = usePersistentState('recruitForm_companyName', '');
    const [address, setAddress] = usePersistentState('recruitForm_address', '');
    const [area, setArea] = usePersistentState('recruitForm_area', '');
    const [contactPerson, setContactPerson] = usePersistentState('recruitForm_contactPerson', '');
    const [phoneNumber, setPhoneNumber] = usePersistentState('recruitForm_phoneNumber', '');
    const [email, setEmail] = usePersistentState('recruitForm_email', '');
    const [confirmEmail, setConfirmEmail] = usePersistentState('recruitForm_confirmEmail', '');
    const [password, setPassword] = usePersistentState('recruitForm_password', '');
    const [agreed, setAgreed] = usePersistentState('recruitForm_agreed', false);
    
    // UI state management
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showTerms, setShowTerms] = useState(false);
    
    // ★ カウントダウンロジック
    const [registeredCount] = useState(45); // 求人用のダミー値
    const totalSlots = 100;
    const remainingSlots = totalSlots - registeredCount;

    const registrationFormRef = useRef<HTMLDivElement>(null);

    // ★★★ 追加: Firebase認証ユーザーとロード状態 ★★★
    const [currentAuthUser, setCurrentAuthUser] = useState<User | null>(null);
    const [isDataLoading, setIsDataLoading] = useState(true);

    // --- Firebase認証とデータ取得（自動入力ロジック） ---
    useEffect(() => {
        // Firebaseの初期化チェック
        if (!auth || !db) {
             setError("Firebase設定がありません。");
             setIsDataLoading(false);
             return;
        }

        const unsubscribe = onAuthStateChanged(auth, async (user: User | null) => {
            if (user && user.email) {
                setCurrentAuthUser(user);
                try {
                    // ★★★ users コレクションからデータを取得（自動入力元） ★★★
                    const userDocRef = doc(db, 'users', user.uid);
                    const userDocSnap = await getDoc(userDocRef);

                    if (userDocSnap.exists()) {
                        const userData = userDocSnap.data();
                        
                        // ★ フォームに自動入力するデータ
                        const contact = userData.contactPerson || userData.displayName || user.email.split('@')[0] || '';
                        const address = userData.address || '';
                        const companyName = userData.companyName || userData.storeName || '';
                        const phoneNumber = userData.phoneNumber || '';
                        const userEmail = user.email;

                        // ★★★ フォームの各Stateを更新（自動入力） ★★★
                        // ここで usePersistentState の値（sessionStorage）を上書きし、自動入力を行う
                        setCompanyName(companyName);
                        setAddress(address);
                        setContactPerson(contact);
                        setPhoneNumber(phoneNumber);
                        setEmail(userEmail);
                        
                        // 確認用メールアドレスのみ自動入力
                        setConfirmEmail(userEmail); 
                        // パスワードは自動入力しない (セキュリティ上の理由から)

                        // ★ 既に求人ロールを持っているかチェック
                        const roles = userData.roles || [];
                        if (roles.includes('recruit')) {
                            // 既に登録済みの場合、ダッシュボードへリダイレクト
                            alert('求人パートナーとして既に登録されています。ダッシュボードへ移動します。');
                            router.push('/recruit/dashboard');
                            return; 
                        }

                    } else {
                         // ユーザー情報がFirestoreになかった場合、メールアドレスとUIDのみセット
                         setEmail(user.email);
                    }
                } catch (e: any) {
                    console.error("Error fetching user data for auto-fill:", e);
                    setError(`ユーザーデータ取得エラー: ${e.message}.`);
                }
                setIsDataLoading(false);
            } else {
                 // 認証ユーザーがいない場合は、ログインページへリダイレクト
                 router.push('/partner/login');
            }
        });
        return () => unsubscribe();
    }, [router]); // ★ 修正: 依存配列にrouterのみを含める

    // Auto-detect area from address (元のコードから分離)
    useEffect(() => {
        const match = address.match(/(那須塩原市|那須郡那須町|那須町|大田原市)/);
        if (match) {
            setArea(match[0].replace('那須郡', ''));
        } else if (address) {
            setArea('');
        }
    }, [address, setArea]);


    // ★★★ 修正: `scrollToForm` をコンポーネント内で定義 ★★★
    const scrollToForm = () => {
        registrationFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    // Check if form is complete
    // ★★★ 修正: 既にログイン中の場合、パスワードは「入力必須」から除外するロジックに変更 ★★★
    // 新規登録の時のみパスワードは必須（password.length >= 6）
    const isPasswordRequired = !currentAuthUser;
    
    // フォームバリデーションロジック (passwordは新規登録時のみ必須)
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
        (isPasswordRequired ? (password.length >= 6) : true) // パスワードは新規登録時のみ必須
    );

    /**
     * 【★新規無料登録】フォーム入力の検証と無料アカウントの作成、ログインページへリダイレクト
     */
    const handleFreeSignup = async () => {
        setError(null);
        
        // 最終的なフォームチェック
        if (!isFormValid) {
            setError('パートナーダッシュボードへ進むには、フォームの必須項目を全て満たし、規約に同意してください。');
            scrollToForm();
            return;
        }

        setIsLoading(true);
        try {
             // ★ 既にログイン済みであれば、既存UIDを渡してロール追加をAPIに要求
             const existingUid = currentAuthUser?.uid;

             const response = await fetch('/api/auth/register-free-partner', { 
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    serviceType: 'recruit', // ★ ロールとして'recruit'を付与
                    companyName: companyName,
                    address,
                    area,
                    contactPerson,
                    phoneNumber,
                    email,
                    // ★ 修正: 既存ユーザーの場合、パスワードが空文字列で送信される
                    password: password, 
                    existingUid: existingUid // ★ 既存UIDを渡す
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                 // ★★★ 重複エラーの判定を追加 ★★★
                 if (data.error && data.error.includes('already in use') || data.error && data.error.includes('exists')) {
                    setError('このメールアドレスは既に広告パートナーとして使用されています。ログイン後、ダッシュボードから求人サービスを追加してください。');
                 } else {
                    throw new Error(data.error || 'サーバーでエラーが発生しました。');
                 }
            }

            // 成功: sessionStorageをクリアし、ログインページへリダイレクト
            Object.keys(window.sessionStorage).forEach(key => { 
                if (key.startsWith('recruitForm_')) { 
                    window.sessionStorage.removeItem(key); 
                } 
            });
            
            // 登録成功後、ログインページへリダイレクト
            router.push('/partner/login?signup_success=true');

        } catch (err: any) {
            console.error('Free signup error:', err);
            // エラーメッセージの再設定はtryブロック内で実施済み
            if (!error) setError(err.message || '不明なエラーが発生しました。');
            setIsLoading(false);
        }
    };

    const getButtonText = () => {
        if (isLoading) return 'アカウント作成中...';
        return '無料でダッシュボードに進む';
    };
    

    // ★★★ ロード中UI ★★★
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
                <title>{"AI求人パートナー無料登録（みんなの那須アプリ）"}</title>
            </Head>
            <header className="bg-white shadow-md sticky top-0 z-50">
                <div className="container mx-auto px-6 py-4 flex justify-between items-center">
                    <h1 className="text-2xl font-bold text-gray-800">AIマッチング求人</h1>
                    <button onClick={scrollToForm} className="bg-orange-500 text-white font-bold py-2 px-6 rounded-full hover:bg-orange-600 transition duration-300 shadow-lg animate-pulse">
                        無料ダッシュボードへ
                    </button>
                </div>
            </header>
            <main className="container mx-auto px-6">
                
                {/* Hero Section - 無料を強調 */}
                <section className="text-center pt-16 pb-8">
                    <h2 className="text-3xl font-bold text-gray-800">おかげさまで株式会社adtown20周年、感謝企画</h2>
                    <p className="mt-4 text-lg text-gray-600">日頃よりご支援いただいている那須地域の皆さまへの感謝を込めて、
                    このたび「みんなの那須アプリ」のAI求人サービスを開始いたします。</p>
                </section>
                
                <section className="text-center py-16 md:py-24">
                    <p className="text-orange-500 font-semibold">地元企業を応援するadtownからのご提案</p>
                    <h2 className="text-4xl md:text-5xl font-extrabold mt-4 leading-tight">
                        「採用に困っている企業様」は必見！<br />
                        <span className="text-orange-600">無料で求人掲載管理ページへアクセス！</span><br />
                        求人広告を無料でスタートし、必要に応じて有料AI機能を利用！
                    </h2>
                    <p className="mt-6 text-lg text-gray-600 max-w-3xl mx-auto">
                        まずは<strong className="font-bold">無料</strong>でダッシュボードにログインし、求人情報の登録（広告掲載）を始めましょう。
                        有料機能（求人マッチングAI、求人アドバイスAI）は、求人管理ページ内で**いつでも**お申し込みいただけます。
                    </p>
                    <div className="mt-8">
                        <button onClick={scrollToForm} className="bg-gradient-to-r from-orange-500 to-red-500 text-white font-extrabold py-4 px-10 rounded-full text-lg shadow-xl hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300">
                            無料でアカウントを作成する
                        </button>
                        <p className="mt-2 text-sm text-gray-500">登録は3分、料金は一切かかりません。</p>
                    </div>
                </section>


                {/* Campaign Section - ★★★ 修正点 ★★★ */}
                <section className="bg-yellow-100 border-t-4 border-b-4 border-yellow-400 text-yellow-900 p-6 rounded-lg shadow-md my-12 text-center">
                    <h3 className="text-2xl font-bold">【先着100社様 限定】有料AIプランの**月額費用割引**キャンペーン実施中！</h3>
                    <p className="mt-2 text-lg">
                        有料機能がすべて使えるAIプラン（AIマッチング、AIアドバイス）は、月額<strong className="font-bold">8,800円</strong>ですが、
                        先着100社様に限り、永続的に<strong className="font-bold text-red-600">月額6,600円</strong>でご利用いただけます。
                        <br/>
                        <strong className="font-bold text-yellow-900">※求人がない月は求人管理ページからサービスを「停止」でき、その間の料金は一切発生しません。</strong>
                        <br/>**無料登録しても、この割引枠を確保できます。**
                    </p>
                    <div className="mt-4 bg-white p-4 rounded-lg flex items-center justify-center space-x-2 md:space-x-4 max-w-md mx-auto">
                        <p className="text-md md:text-lg font-semibold">現在の申込企業数:</p>
                        <div className="text-2xl md:text-3xl font-extrabold text-gray-800 tracking-wider bg-gray-100 px-3 py-1 rounded">{registeredCount}社</div>
                        <p className="text-md md:text-lg font-semibold text-red-600">残り {remainingSlots} 枠！</p>
                    </div>
                </section>

                {/* App Advantage Section */}
                <section className="mt-20 bg-white rounded-2xl shadow-xl p-8 md:p-12 border border-gray-200">
                    <div className="max-w-4xl mx-auto text-center">
                        <UsersIcon className="w-12 h-12 mx-auto text-orange-500 mb-4" />
                        <h3 className="text-3xl font-extrabold">なぜ今、アプリ求人なのか？答えは「圧倒的な見込み客」です。</h3>
                        <p className="mt-6 text-lg text-gray-600 leading-relaxed">
                            『みんなの那須アプリ』は、ほとんどの機能が<strong className="text-orange-600 font-bold">無料</strong>で使えるため、那須地域の住民にとって「ないと損」なアプリになりつつあります。
                            先行登録者はすでに<strong className="text-orange-600 font-bold">3,000人</strong>を突破。口コミでその輪は確実に広がり、<strong className="text-orange-600 font-bold">5,000人、10,000人</strong>の巨大なユーザーコミュニティへと成長します。
                            貴社の求人情報は、この<strong className="font-bold">爆発的に増え続ける「未来の求職者」</strong>に直接届くのです。
                        </p>
                    </div>
                </section>

                {/* --- START: 採用の悩み --- */}
                <section className="py-16 bg-white rounded-2xl shadow-lg mt-20">
                    <div className="text-center">
                        <h2 className="text-3xl font-extrabold text-gray-800">こんな「採用の悩み」ありませんか？</h2>
                        <p className="mt-4 text-gray-600 max-w-2xl mx-auto">一つでも当てはまれば、AIマッチングが解決します。</p>
                    </div>
                    <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
                        <div className="p-6 text-center"><XCircleIcon className="w-12 h-12 mx-auto text-red-500" /><h3 className="mt-4 text-xl font-bold">コストが高い</h3><p className="mt-2 text-gray-600">多額の広告費を払っても、良い人材からの応募があるとは限らない。</p></div>
                        <div className="p-6 text-center"><UsersIcon className="w-12 h-12 mx-auto text-red-500" /><h3 className="mt-4 text-xl font-bold">応募が来ない</h3><p className="mt-2 text-gray-600">そもそも求人を見てもらえず、応募が全く集まらない。</p></div>
                        <div className="p-6 text-center"><UserCheckIcon className="w-12 h-12 mx-auto text-red-500" /><h3 className="mt-4 text-xl font-bold">ミスマッチが多い</h3><p className="mt-2 text-gray-600">応募は来るが、求めるスキルや人柄と合わず、採用に至らない。</p></div>
                    </div>
                </section>
                {/* --- END: 採用の悩み --- */}


                {/* Monetization Mechanism Section - 有料機能として再定義 */}
                <section className="mt-20">
                    <h3 className="text-3xl font-extrabold text-center">【有料の価値】2つのAI機能で採用を成功に導く</h3>
                    <p className="mt-4 text-center text-gray-600 max-w-3xl mx-auto">無料の求人掲載で採用の第一歩を踏み出した後、さらに強力な有料AI機能でミスマッチを防ぎ、採用コストを削減できます。</p>
                    <div className="mt-12 grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                        <div className="text-center p-6 bg-yellow-50 rounded-lg shadow-lg border-yellow-300 border">
                            <div className="bg-yellow-500 text-white w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">AI</div>
                            <h4 className="text-xl font-bold">求人マッチングAI（有料）</h4>
                            <p className="mt-2 text-gray-600">アプリユーザーの価値観や希望条件に基づき、最も貴社にフィットする「理想の人材」にピンポイントでスカウトを送信します。</p>
                        </div>
                        <div className="text-center p-6 bg-orange-50 rounded-lg shadow-lg border-orange-300 border">
                            <div className="bg-orange-500 text-white w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">AI</div>
                            <h4 className="text-xl font-bold">求人アドバイスAI（有料）</h4>
                            <p className="mt-2 text-gray-600">「給与が相場より低い」「魅力が伝わらない」など、応募が集まらない原因をAIが分析し、具体的な改善案をアドバイスします。</p>
                        </div>
                    </div>
                    {/* ★★★ 修正点 ★★★ */}
                    <div className="mt-12 text-center bg-green-50 border-t-4 border-green-400 p-6 rounded-lg">
                        <p className="text-xl font-bold text-green-800">
                            まずは無料登録から。有料機能は求人管理ページからいつでも開始・停止できます。<br/>
                            <span className="text-base font-medium text-green-700">（求人がない月は停止すれば料金はかかりません）</span>
                        </p>
                    </div>
                </section>

                {/* Partner Logos Section */}
                <section className="mt-20 text-center">
                    <h3 className="text-2xl font-bold text-gray-700">すでに那須地域の多くの企業様がこのチャンスに気づいています</h3>
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


                {/* FAQ Section - ★★★ 修正点 ★★★ */}
                <section className="mt-24 max-w-4xl mx-auto">
                    <h3 className="text-3xl font-extrabold text-center">よくある質問</h3>
                    <div className="mt-8 bg-white p-4 md:p-8 rounded-2xl shadow-xl border">
                        <FAQItem question="費用は本当に無料ですか？">
                            <p className="leading-relaxed">はい, 求人情報の登録とアプリへの掲載は**永続的に無料**です。ただし, 求人マッチングAI, 求人アドバイスAIといった**有料機能**をご利用になる場合のみ, 月額<strong className="font-bold">8,800円</strong>（先着100社限定で6,600円）が発生します。有料機能はダッシュボード内からいつでもお申込み・停止が可能です。</p>
                        </FAQItem>
                        <FAQItem question="費用は本当にこれだけですか？成功報酬はありますか？">
                            {/* ★★★ 年額の記述を削除 ★★★ */}
                            <p className="leading-relaxed"><strong className="font-bold">はい, 有料プランをご利用の場合でも, 月額料金のみです。</strong>採用が何名決まっても, 追加の成功報酬は一切いただきません。コストを気にせず, 納得のいくまで採用活動に専念していただけます。</p>
                        </FAQItem>
                        <FAQItem question="有料プランの途中で解約（停止）はできますか？">
                            {/* ★★★ 「停止」を強調 ★★★ */}
                            <p className="leading-relaxed">はい, いつでも管理画面から次回の更新を停止（解約）することができます。契約期間の縛りはありません。<strong className="font-bold">例えば, 採用が完了し, 一時的に求人を停止する月は, 料金は一切発生しません。</strong>再度必要になったらいつでも再開できます。</p>
                        </FAQItem>
                    </div>
                </section>


                {/* Registration Form Section - フォームのメッセージとボタンの変更 */}
                <section ref={registrationFormRef} id="registration-form" className="mt-20 pt-10">
                    <div className="bg-white p-8 md:p-12 rounded-2xl shadow-2xl w-full max-w-3xl mx-auto border border-gray-200">
                        <div className="text-center mb-10">
                            <p className="text-gray-700 leading-relaxed">
                                まずは無料でダッシュボードにログインし、すぐに求人掲載をスタートしましょう。<br/>
                                <strong className="text-red-600 font-bold">有料AIプランの割引枠（月額8,800円→6,600円）</strong>を確保するためにも、今すぐご登録ください。
                            </p>
                            {/* ★★★ ログイン中かどうかのメッセージを追加 ★★★ */}
                            {currentAuthUser && (
                                <p className="text-sm text-gray-500 mt-2">
                                    現在ログイン中: <span className="font-semibold">{currentAuthUser.email || '---'}</span>
                                </p>
                            )}
                        </div>
                        <h2 className="text-3xl font-bold text-center mb-2">求人パートナー無料登録</h2>
                        
                        {/* ★★★ ログイン中ユーザー情報の自動入力表示 ★★★ */}
                        {currentAuthUser && (companyName || address || phoneNumber) ? (
                            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-900 mb-6">
                                <strong>💡 {currentAuthUser.email}</strong> でログイン中です。広告パートナーの登録情報が自動入力されました。
                            </div>
                        ) : (
                            <p className="text-center text-gray-600 mb-8">
                                以下のフォームをご入力ください。ご登録後、求人管理ページにログインできるようになります。
                            </p>
                        )}


                        <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div> <label className="block text-gray-700 font-medium mb-2">企業名・店舗名 *</label> <input type="text" value={companyName} onChange={(e) => setCompanyName(e.target.value)} required readOnly={!!companyName && !!currentAuthUser} className="w-full px-4 py-2 border rounded-lg focus:ring-orange-500 focus:border-orange-500 read-only:bg-gray-100 read-only:cursor-not-allowed"/> </div>
                                <div> <label className="block text-gray-700 font-medium mb-2">ご担当者名 *</label> <input type="text" value={contactPerson} onChange={(e) => setContactPerson(e.target.value)} required readOnly={!!contactPerson && !!currentAuthUser} className="w-full px-4 py-2 border rounded-lg focus:ring-orange-500 focus:border-orange-500 read-only:bg-gray-100 read-only:cursor-not-allowed"/> </div>
                            </div>
                            <div> <label className="block text-gray-700 font-medium mb-2">所在地 *</label> <input type="text" value={address} onChange={(e) => setAddress(e.target.value)} required readOnly={!!address && !!currentAuthUser} placeholder="例：栃木県那須塩原市共墾社108-2" className="w-full px-4 py-2 border rounded-lg focus:ring-orange-500 focus:border-orange-500 read-only:bg-gray-100 read-only:cursor-not-allowed"/> {address && !area && <p className="text-red-500 text-xs mt-1">那須塩原市、那須町、大田原市のいずれかである必要があります。</p>} </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t">
                                <div> <label className="block text-gray-700 font-medium mb-2">電話番号 *</label> <input type="tel" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} required readOnly={!!phoneNumber && !!currentAuthUser} className="w-full px-4 py-2 border rounded-lg focus:ring-orange-500 focus:border-orange-500 read-only:bg-gray-100 read-only:cursor-not-allowed"/> </div>
                                
                                {/* ★★★ 修正点: パスワードを空の場合も許可し、requiredを削除 ★★★ */}
                                <div> <label className="block text-gray-700 font-medium mb-2">パスワード (6文字以上) *</label> <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} minLength={6} className="w-full px-4 py-2 border rounded-lg focus:ring-orange-500 focus:border-orange-500"/> </div>
                                
                                <div> <label className="block text-gray-700 font-medium mb-2">メールアドレス *</label> <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required readOnly={!!currentAuthUser} className="w-full px-4 py-2 border rounded-lg focus:ring-orange-500 focus:border-orange-500 read-only:bg-gray-100 read-only:cursor-not-allowed"/> </div>
                                <div> <label className="block text-gray-700 font-medium mb-2">メールアドレス（確認用）*</label> <input type="email" value={confirmEmail} onChange={(e) => setConfirmEmail(e.target.value)} required className="w-full px-4 py-2 border rounded-lg focus:ring-orange-500 focus:border-orange-500"/> </div>
                            </div>
                            <div className="pt-4">
                                <label className="flex items-start">
                                    <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} className="mt-1 h-5 w-5 text-orange-600 focus:ring-orange-500 rounded"/>
                                    <span className="ml-3 text-sm text-gray-600">
                                        <button type="button" onClick={() => setShowTerms(true)} className="text-blue-600 hover:underline">
                                            求人パートナー利用規約
                                        </button>
                                        （求人掲載プログラム**無料版**）に同意します。
                                    </span>
                                </label>
                            </div>
                            
                            {/* Error display area */}
                            {error && ( <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-md flex items-center"><XCircleIcon className="h-5 w-5 mr-3"/><p className="text-sm">{error}</p></div> )}

                            {/* メインの登録ボタン: 無料登録を実行 */}
                            <button type="button" onClick={handleFreeSignup} disabled={isLoading || !isFormValid} className="w-full py-4 mt-4 text-white text-lg font-bold bg-gradient-to-r from-orange-500 to-red-500 rounded-lg hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300">
                                {getButtonText()}
                            </button>
                            <p className="text-sm text-center -mt-2 text-gray-500">ご登録後、ログインしてダッシュボードより有料AI機能をお申込みいただけます。</p>
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

            {/* 利用規約モーダル ★★★ 修正点 ★★★ */}
            {showTerms && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white p-6 rounded-lg max-w-2xl w-full max-h-[90vh] flex flex-col">
                        <h2 className="text-xl font-bold mb-4 border-b pb-2">AIマッチング求人 利用規約</h2>
                        <div className="overflow-y-auto space-y-4 pr-2">
                            <p><strong>第1条（適用）</strong><br/>本規約は、株式会社adtown（以下「当社」といいます。）が提供するAIマッチング求人サービス（以下「本サービス」といいます。）の利用に関する一切の関係に適用されます。</p>
                            <p><strong>第2条（利用資格）</strong><br />本サービスは、当社が別途定める審査基準を満たした法人または個人事業主（以下「パートナー」といいます。）のみが利用できるものとします。</p>
                            
                            <p><strong>第3条（利用料金）</strong><br />
                                1. 本サービスの基本機能（求人情報の登録・掲載）は**無料**です。<br/>
                                2. パートナーは、以下の**有料機能**を利用する場合、当社に対し、別途定める利用料金（月額<strong className="font-bold">8,800円</strong>（税込）、先着100社限定で6,600円）を支払うものとします。有料機能への申し込みは、ダッシュボード内で行えます。<br/>
                                (a) 求人マッチングAI（候補者の自動提案、スカウト機能）<br/>
                                (b) 求人アドバイスAI（求人票の自動改善提案）<br/>
                                3. 支払い方法は、クレジットカード決済（月額）のみとします。<strong className="font-bold">年額支払いの設定はありません。</strong>
                            </p>
                            <p><strong>第4条（契約期間と解約）</strong><br />
                                1. 有料プランの契約期間は、申込日を起算日として1ヶ月間とします。期間満了までに解約の申し出がない場合、契約は同一条件で自動更新されます。<br />
                                2. パートナーは、いつでも有料プランの解約（自動更新の停止）を申し出ることができます。<strong className="font-bold">求人募集を行わない月は、ダッシュボードからサービスを「停止」することで、翌月以降の料金は発生しません。</strong>契約期間の縛りはありません。
                            </p>

                            <p><strong>第5条（ユーザーID及びパスワードの管理）</strong><br/>利用者は、自己の責任において、本サービスのユーザーID及びパスワードを適切に管理及び保管するものとし、これを第三者に利用させ、または貸与、譲渡、名義変更、売買等をしてはならないものとします。</p>
                            <p><strong>第6条（禁止事項）</strong><br/>利用者は、本サービスの利用にあたり、法令に違反する行為、公序良俗に反する行為、またはその他当社が不適切と判断する行為をしてはなりません。</p>
                            <p><strong>第7条（本サービスの停止等）</strong><br/>当社は、システムの保守点検、天災、その他当社が必要と判断した場合、パートナーに事前に通知することなく本サービスの全部または一部の提供を停止または中断することができるものとします。</p>
                            <p><strong>第8条（免責事項）</strong><br/>当社は、本サービスに起因してパートナーに生じたあらゆる損害について一切の責任を負いません。また、当社は、本サービスから得られる情報の完全性、正確性、確実性、有用性等について、いかなる保証も行わないものとします。</p>
                            <p><strong>第9条（準拠法・裁判管轄）</strong><br/>本規約の解釈にあたっては、日本法を準拠法とします。本サービスに関して紛争が生じた場合には、当社の本店所在地を管轄する裁判所を専属的合意管轄とします。</p>
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


export default RecruitSignupPage;

