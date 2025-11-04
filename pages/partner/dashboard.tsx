import { GetServerSideProps, NextPage } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import React, { useEffect, useState } from 'react'; 
import { useRouter } from 'next/router';
import { getAuth, signOut } from 'firebase/auth';
import { app, db } from '../../lib/firebase';
import { collection, query, limit, getDocs } from 'firebase/firestore'; 
import { adminDb, adminAuth } from '@/lib/firebase-admin';
import nookies from 'nookies';
import { 
RiLogoutBoxRLine, 
RiCoupon3Line, 
RiRobotLine, 
RiMoneyCnyBoxLine, 
RiBankLine, 
RiCloseCircleLine, // 解約モーダル用
RiAlertFill, // 解約モーダル用
} from 'react-icons/ri'; 

// グローバル変数定義 (Firestoreパス用)
declare const __app_id: string;
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';


// ===============================
// SVG アイコン
// ===================================
const StoreIcon = (props: React.SVGProps<SVGSVGElement>) => (
<svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} {...props}>
<path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
</svg>
);

// ===============================
// 型定義
// ===================================
interface DashboardProps {
partnerData: {
uid: string;
companyName: string;
email: string;
roles: string[];
isPaid: boolean; 
};
}

interface ActionButtonProps {
href: string;
icon: React.ReactNode;
title: string;
description: string;
bgColorClass: string;
isPro: boolean; 
isPaid: boolean; 
onClick?: (e: React.MouseEvent<HTMLAnchorElement>) => void; // クリックイベントを追加
}

// ===============================
// 汎用 UI コンポーネント 
// ===================================
const ActionButton: React.FC<ActionButtonProps> = ({
href,
icon,
title,
description,
bgColorClass,
isPro,
isPaid,
onClick, // onClick を受け取る
}) => {
const encodedHref = href;
const isDisabled = isPro && !isPaid; 

// 有料限定で未課金の場合、リンク先を有料プラン申し込みページに上書き
const finalHref = isDisabled ? "/partner/subscribe_plan" : encodedHref;

const linkContent = (
<a 
onClick={onClick} // a タグに onClick を渡す
className={`group flex items-center p-4 bg-white rounded-lg shadow-sm transition-all cursor-pointer ${
isDisabled 
? 'opacity-50 pointer-events-none' 
: 'hover:shadow-lg hover:border-blue-500 border border-transparent'
}`}
>
<div
className={`flex-shrink-0 w-16 h-16 rounded-lg flex items-center justify-center ${bgColorClass}`}
>
{icon}
</div>
<div className="ml-4">
<h3 className="text-lg font-bold text-gray-800 group-hover:text-blue-600 transition-colors">
{title}
{isPro && (
<span className={`ml-2 px-2 py-0.5 text-xs font-semibold rounded-full text-white ${isPaid ? 'bg-green-500' : 'bg-red-500'}`}>
{isPaid ? 'ご利用中' : '有料限定'}
</span>
)}
</h3>
<p className="text-sm text-gray-500 mt-1">{description}</p>
</div>
</a>
);

// onClick が指定されている場合は Link を使わない（ページ遷移をさせない）
if (onClick) {
return linkContent;
}

// Link コンポーネントは onClick を子要素に渡せないため、この方法でラップします。
return (
<Link href={finalHref} legacyBehavior>
{linkContent}
</Link>
);
};

// ===============================
// サーバーサイド認証チェック
// ===================================
export const getServerSideProps: GetServerSideProps = async (context) => {
try {
const cookies = nookies.get(context);
const token = await adminAuth.verifySessionCookie(cookies.session || '', true);
const { uid } = token;

if (!uid) {
return { redirect: { destination: '/partner/login', permanent: false } };
}

const userDoc = await adminDb.collection('users').doc(uid).get();

if (!userDoc.exists) {
return {
redirect: { destination: '/partner/login?error=user_not_found', permanent: false }
};
}

const userData = userDoc.data() || {};
const userRoles: string[] = userData.roles || [];

const allowedRoles = ['adver', 'recruit']; 
const isAuthorized = userRoles.some(role => allowedRoles.includes(role));

if (!isAuthorized) {
return {
redirect: { destination: '/partner/login?error=permission_denied', permanent: false }
};
}

// ★★★ 修正箇所: データ移行後の新しいフィールドを参照する ★★★
// isPaidを廃止し、adverSubscriptionStatusが 'Paid' であれば有料とみなす
const isPaid = userData.adverSubscriptionStatus === 'Paid'; 
// ★★★ 修正ここまで ★★★

return {
props: {
partnerData: {
uid: userDoc.id,
email: userData.email || '',
companyName: userData.companyName || userData.storeName || 'パートナー',
roles: userData.roles || [],
isPaid: isPaid, 
}
}
};
} catch (err) {
console.error('Dashboard getServerSideProps error:', err);
return { redirect: { destination: '/partner/login', permanent: false } };
}
};

// ===============================
// メインページコンポーネント
// ===================================
const PartnerDashboard: NextPage<DashboardProps> = ({ partnerData }) => {
const router = useRouter();
const { payment_status } = router.query;
const auth = getAuth(app); 

const isPaid = partnerData.isPaid; 
const hasRecruitRole = partnerData.roles.includes('recruit');

const [storeData, setStoreData] = useState<any>({ mainCategory: '未登録' }); 
const [showCancelModal, setShowCancelModal] = useState(false); // 解約モーダルの表示状態

// 店舗プロファイルの簡易フェッチ
useEffect(() => {
const fetchStoreStatus = async () => {
if (!partnerData.uid) return;
try {
const storesRef = collection(db, 'artifacts', appId, 'users', partnerData.uid, 'stores');
const storeQuery = query(storesRef, limit(1));
const storeSnapshot = await getDocs(storeQuery);

if (!storeSnapshot.empty) {
const data = storeSnapshot.docs[0].data();
setStoreData(data);
} else {
setStoreData({ mainCategory: '未登録' });
}
} catch (error) {
console.error("Store status fetch error:", error);
setStoreData({ mainCategory: '未登録' });
}
};
fetchStoreStatus();
}, [partnerData.uid]);

// 決済完了後のトークンリフレッシュと強制リロード
useEffect(() => {
const refresh = async () => {
    // 1. トークンをリフレッシュし、新しい権限を強制的に取得
    await auth.currentUser?.getIdToken(true).catch(e => console.error("Token refresh failed:", e)); 
    
    // 2. クエリパラメータを削除してページを再読み込み (ハイドレーションエラーを回避)
    router.replace('/partner/dashboard', undefined, { shallow: true });
};

if (payment_status === 'success') {
    console.log("Payment Status:", payment_status);
    refresh();
}
// 依存配列に router を追加
}, [auth, payment_status, router]);


// ログアウト処理
const handleLogout = async () => {
try {
await fetch('/api/auth/sessionLogout', { method: 'POST' });
await signOut(auth);
router.push('/partner/login');
} catch (error) {
console.error('ログアウト失敗:', error);
router.push('/partner/login');
}
};

// 解約モーダルを開く
const handleOpenCancelModal = (e: React.MouseEvent<HTMLAnchorElement>) => {
e.preventDefault(); // ページ遷移を止める
setShowCancelModal(true);
};

return (
<div className="min-h-screen bg-gray-50">
<Head>
<title>{`広告パートナー ダッシュボード (${isPaid ? '有料会員' : '無料会員'})`}</title>
</Head>

{/* ★★★ 解約確認モーダル ★★★ */}
{showCancelModal && (
<div 
className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
onClick={() => setShowCancelModal(false)} // 背景クリックで閉じる
>
<div 
className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden"
onClick={(e) => e.stopPropagation()} // モーダル内部のクリックは伝播させない
>
<div className="p-6 text-center">
<div className="flex justify-center mb-4">
<div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
<RiAlertFill className="h-10 w-10 text-red-600" />
</div>
</div>
<h2 className="text-2xl font-bold text-gray-900 mb-3">本当に解約しますか？</h2>
<p className="text-gray-600 mb-6">
「解約手続きに進む」ボタンを押すと、サブスクリプションの解約ページに移動します。
</p>

{/* アクションボタン */}
<div className="flex flex-col sm:flex-row gap-3">
<button
onClick={() => setShowCancelModal(false)}
className="w-full px-4 py-3 rounded-lg font-semibold bg-gray-200 text-gray-700 hover:bg-gray-300 transition-colors"
>
キャンセル
</button>
<Link href="/cancel-subscription" legacyBehavior>
<a className="w-full px-4 py-3 rounded-lg font-semibold text-white bg-red-600 hover:bg-red-700 transition-colors text-center">
解約手続きに進む
</a>
</Link>
</div>
</div>
</div>
</div>
)}

{/* ヘッダー */}
<header className="bg-white shadow-sm">
<div className="max-w-4xl mx-auto px-6 py-4 flex justify-between items-center">
<div>
<h1 className="text-2xl font-bold text-gray-900">広告パートナー ダッシュボード</h1>
<p className="text-sm text-gray-600 mt-1">
ようこそ、<span className="font-bold">{partnerData.companyName}</span> 様 
<span className={`ml-2 px-2 py-0.5 text-xs font-semibold rounded-full text-white ${isPaid ? 'bg-indigo-600' : 'bg-gray-500'}`}>
{isPaid ? '有料パートナー' : '無料パートナー'}
</span>
</p>
</div>
{/* ★★★ 変更点: ログアウトと案内 ★★★ */}
<div className="flex flex-col items-end text-right">
<button
onClick={handleLogout}
className="flex items-center space-x-2 text-sm text-gray-600 hover:text-red-600 p-2 rounded-lg transition-colors font-semibold"
>
<RiLogoutBoxRLine size={20} />
<span>ログアウト</span>
</button>
<p className="text-xs text-gray-500 mt-1 max-w-xs">
ログインは、ブラウザでadtownと検索してホームページから行ってください。
</p>
</div>
{/* ★★★ 変更ここまで ★★★ */}
</div>
</header>

{/* メイン */}
<main className="max-w-4xl mx-auto px-6 py-8">

{(!storeData || storeData.mainCategory === '未登録') && (
<div className="mb-8 p-6 bg-red-100 border-4 border-red-300 text-red-700 rounded-lg shadow-lg text-center">
<h2 className="text-2xl font-extrabold text-red-900 mb-2">
⚠️ 【重要】店舗プロフィールが未登録です
</h2>
<p className="mt-2 text-lg">
  すべての機能（特にAIマッチング）を利用するために、先に
  <strong>お店の基本情報を完全に登録</strong>してください。
</p>
<p className="mt-2 text-lg">
  ログインは、ブラウザでadtownと検索してホームページから行ってください。
</p>
<Link href="/partner/profile" legacyBehavior>
<a className="inline-block mt-4 bg-red-600 text-white font-extrabold py-2 px-6 rounded-full shadow-lg hover:bg-red-700 transition duration-150">
→ 店舗プロフィール登録へ
</a>
</Link>
</div>
)}


{!isPaid && (
<div className="mb-8 p-6 bg-yellow-100 border-4 border-yellow-400 text-yellow-800 rounded-lg shadow-lg text-center">
<h2 className="text-2xl font-extrabold text-yellow-900">
💡 現在、無料の基本機能をご利用中です
</h2>
<p className="mt-2 text-lg">
**集客AI、紹介料収入プログラム、LINEでお客様とAIマッチング**を利用して、売上と収益を最大化しましょう！
</p>
<Link href="/partner/subscribe_plan" legacyBehavior>
<a className="inline-block mt-4 bg-orange-600 text-white font-extrabold py-3 px-8 rounded-full shadow-lg hover:bg-orange-700 transition duration-150">
有料パートナープランに申し込む
</a>
</Link>
</div>
)}

{payment_status === 'success' && isPaid && (
<div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 rounded-md mb-8">
<p className="font-bold">有料プランのご登録ありがとうございます！</p>
<p>すべての機能がご利用可能になりました。</p>
</div>
)}

{/* セクション1: 無料・有料共通機能 (店舗情報登録とクーポン) */}
<section>
<h2 className="text-xl font-bold text-gray-700 mb-3">１．集客ツールとお店の基本情報を設定する（無料）</h2>

<div className="grid grid-cols-1 gap-4 mb-4">
{/* ★★★ 修正箇所: 店舗プロフィールをクーポンより上に移動 ★★★ */}
<ActionButton
href="/partner/profile"
icon={<StoreIcon />}
title="店舗プロフィールを登録・編集"
description="特化情報、LINE情報、業種別データを設定します"
bgColorClass="bg-blue-500"
isPro={false} // 無料機能
isPaid={isPaid}
/>

<ActionButton
href="/partner/deals"
icon={<RiCoupon3Line className="h-8 w-8 text-white" />}
title="クーポン・特典・フードロスを登録・管理"
description="ユーザーの来店を促し、在庫問題を解決する集客ツールです"
bgColorClass="bg-green-500"
isPro={false} // 無料機能
isPaid={isPaid}
/>
</div>
</section>

{/* セクション2: 有料集客ツール */}
<section className="mt-8">
<h2 className="text-xl font-bold text-gray-700 mb-3">２．有料集客ツール</h2>

<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
<ActionButton
href="/partner/deals/ai-matching" 
icon={<RiRobotLine className="h-8 w-8 text-white" />}
title="集客マッチング AI の実行とログ管理"
description="AIが選定した最適顧客を特定し、マッチング結果を確認します"
bgColorClass="bg-indigo-600"
isPro={true} // 有料機能 (AIマッチング)
isPaid={isPaid}
/>
</div>
</section>

{/* セクション3: その他の有料機能 (タイトルを修正) */}
<section className="mt-8">
<h2 className="text-xl font-bold text-gray-700 mb-3">３．その他の有料機能（報酬受取）</h2>
<div className="grid grid-cols-1 md:grid-cols-2 gap-4">

<ActionButton
href="/partner/referral-info" 
icon={<RiMoneyCnyBoxLine className="h-8 w-8 text-white" />}
title="紹介料プログラム"
description="お客様にアプリを紹介し、継続的な報酬を得るツールです"
bgColorClass="bg-purple-500"
isPro={true} // 有料機能
isPaid={isPaid}
/>
<ActionButton
href="/partner/payout-settings"
icon={<RiBankLine className="h-8 w-8 text-white" />}
title="報酬受取口座を登録・編集"
description="紹介報酬を受け取るための口座を設定します"
bgColorClass="bg-yellow-500"
isPro={true} // 有料機能
isPaid={isPaid}
/>

{/* ★★★ 解約ボタン (有料会員のみ表示) ★★★ */}
{isPaid && (
<ActionButton
href="/cancel-subscription" // hrefはダミー、実際にはonClickで制御
icon={<RiCloseCircleLine className="h-8 w-8 text-white" />}
title="サブスクリプションの解約"
description="有料プランの自動更新を停止（解約）します"
bgColorClass="bg-red-500"
isPro={true} // 有料機能として扱う (isPaid=falseなら非表示)
isPaid={isPaid}
onClick={handleOpenCancelModal} // モーダルを開く関数を渡す
/>
)}
</div>
</section>

{/* AI求人案内 */}
{!hasRecruitRole && (
<section className="mt-12 p-6 bg-white rounded-lg shadow-md border border-blue-200">
<h2 className="text-xl font-bold text-blue-600">求人広告掲載サービス</h2>
<p className="mt-2 text-gray-600">
無料で求人広告を掲載することができます。また求人マッチングAI導入の有料プランもあります。
</p>
<Link href="/recruit/apply" legacyBehavior>
<a className="inline-block mt-4 bg-blue-500 text-white font-bold py-2 px-4 rounded hover:bg-blue-600 transition duration-150 cursor-pointer">
求人サービスを追加する
</a>
</Link>
</section>
)}

<hr className="my-8" />

{/* LINEお問い合わせセクション */}
<div className="pb-6">
<section className="mt-6">
<div className="bg-white p-6 rounded-lg shadow-lg border border-gray-100 flex items-center justify-between">
<div className="flex flex-col">
<h2 className="text-lg font-bold text-gray-700 mb-1">LINEよりお問い合わせください。</h2>
<p className="text-sm text-gray-500 mt-1">ご不明な点、操作方法などサポートが必要な際にご利用ください。</p>
<p className="text-sm text-gray-500">ログインは、ブラウザでadtownと検索してホームページから行ってください。</p>
</div>
<div 
dangerouslySetInnerHTML={{
__html: '<a href="https://lin.ee/FwVhCvs" target="_blank"><img src="https://scdn.line-apps.com/n/line_add_friends/btn/ja.png" alt="友だち追加" height="36" border="0"></a>'
}}
/>
</div>
</section>
</div>

</main>
{/* フッター操作 */}
<footer className="max-w-4xl mx-auto px-6 pt-0 pb-8">
<section className="mt-6 grid grid-cols-1 gap-4">
<button
onClick={handleLogout}
className="w-full text-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gray-600 hover:bg-gray-700"
>
ログアウト
</button>
{/* ★★★ 変更点: 案内文を追加 ★★★ */}
<p className="text-xs text-gray-500 mt-2 text-center">
ログインは、ブラウザでadtownと検索してホームページから行ってください。
</p>
{/* ★★★ 変更ここまで ★★★ */}
</section>
</footer>
</div>
);
};

export default PartnerDashboard;
