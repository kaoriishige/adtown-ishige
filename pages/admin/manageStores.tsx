import { NextPage, GetServerSideProps } from 'next';
import Head from 'next/head';
import Link from 'next/link';
// NOTE: 実際のパスに合わせて修正してください
import { adminDb } from '@/lib/firebase-admin';
import React, { useState } from 'react';
import { firestore } from 'firebase-admin'; 
import { RiDeleteBinLine, RiMoneyDollarCircleLine, RiCheckboxCircleLine } from 'react-icons/ri'; 

// --- 型定義の更新 ---
interface Store {
    id: string; // ユーザー UID (Firestore Document ID)
    companyName: string;
    address: string;
    phoneNumber: string;
    email: string;
    roles: string[];
    stripeCustomerId?: string;
    createdAt?: string; // 登録年月日
    // 各サービスタイプ固有のステータスと支払い方法を取得
    adverSubscriptionStatus?: 'active' | 'trialing' | 'pending_invoice' | 'canceled' | 'past_due' | 'pending_card' | 'pending_checkout' | null; // pending_checkoutを追加
    recruitSubscriptionStatus?: 'active' | 'trialing' | 'pending_invoice' | 'canceled' | 'past_due' | 'pending_card' | 'pending_checkout' | null; // pending_checkoutを追加
    
    // サービス固有の支払いサイクルを保持
    adverBillingCycle?: 'monthly' | 'annual' | 'invoice' | null; // 'invoice'を追加
    recruitBillingCycle?: 'monthly' | 'annual' | 'invoice' | null; // 'invoice'を追加
}

interface ManageStoresPageProps {
    initialStores: Store[];
}

// --- 日付フォーマット関数 ---
const formatDate = (timestamp: firestore.Timestamp | undefined): string => {
    if (!timestamp) return '未設定';
    // Firestore TimestampオブジェクトをJavaScript Dateオブジェクトに変換し、YYYY/MM/DD形式にフォーマット
    const date = timestamp.toDate();
    return date.toLocaleDateString('ja-JP', { year: 'numeric', month: '2-digit', day: '2-digit' });
};

// --- サーバーサイド処理の更新 (今回はダミー実装に依存しないため、提供コードを維持) ---
export const getServerSideProps: GetServerSideProps = async (context) => {
    // NOTE: ローカル環境での実行時エラーを避けるため、adminDbが定義されていない場合はダミーオブジェクトで初期化
    const dbRef = (adminDb && (adminDb as any).collection) ? (adminDb as any).collection('users') : { where: () => ({ get: async () => ({ docs: [] as firestore.QueryDocumentSnapshot[] }) }) };

    try {
        const usersSnapshot = await dbRef
            .where('roles', 'array-contains-any', ['adver', 'recruit'])
            .get();

        const stores: Store[] = usersSnapshot.docs.map((doc: firestore.QueryDocumentSnapshot) => {
            const data = doc.data();
            
            // billingCycleが月額/年額の場合の支払い方法を判断
            const getCycle = (d: any, prefix: 'adver' | 'recruit') => {
                // cycle が undefined/null の可能性あり
                const cycle = d[`${prefix}BillingCycle`] || d.billingCycle;
                
                if (cycle === 'invoice' || d[`${prefix}SubscriptionStatus`] === 'pending_invoice') return 'invoice';
                
                // undefined の場合は null を返す
                return cycle || null; 
            };

            return {
                id: doc.id, 
                companyName: data.companyName || '名称未設定',
                address: data.address || '住所未設定',
                phoneNumber: data.phoneNumber || '電話番号未設定',
                email: data.email || 'メールアドレス未設定',
                roles: data.roles || [],
                stripeCustomerId: data.stripeCustomerId || null,
                createdAt: data.createdAt ? formatDate(data.createdAt as firestore.Timestamp) : '未設定',
                adverSubscriptionStatus: data.adverSubscriptionStatus || null,
                recruitSubscriptionStatus: data.recruitSubscriptionStatus || null,
                
                adverBillingCycle: getCycle(data, 'adver') as Store['adverBillingCycle'],
                recruitBillingCycle: getCycle(data, 'recruit') as Store['recruitBillingCycle'],
            };
        });

        return { props: { initialStores: stores } };
    } catch (error) {
        console.error("Error fetching stores for admin:", error);
        // シリアライズエラー対策として、空配列を返す際は必ず JSON シリアライズ可能な形式 ([] or { error: '...' }) で返す
        return { props: { initialStores: [] } };
    }
};

// --- コンポーネント本体 ---
const ManageStoresPage: NextPage<ManageStoresPageProps> = ({ initialStores }) => {
    const [stores, setStores] = useState<Store[]>(initialStores);
    const [error, setError] = useState<string | null>(null);
    const [loadingStore, setLoadingStore] = useState<string | null>(null);
    
    // NOTE: 簡易的なメッセージ表示
    const showMessage = (message: string) => { alert(message); };

    /**
     * 請求書払いユーザーをアクティブ (有料プラン) に変更するAPIコール
     */
    const handleActivateSubscription = async (storeId: string, service: 'adver' | 'recruit') => {
        // window.confirmを使用（Next.jsでは非推奨だが、管理者機能のため利用を継続）
        if (!window.confirm(`ユーザーID ${storeId} の ${service} サービスを本当に有料プラン (active) に変更しますか？\nこの操作は入金確認後に行ってください。`)) {
            return;
        }

        setLoadingStore(storeId);
        setError(null);
        try {
            // APIコール（サーバーサイドでFirestoreのステータスを更新するエンドポイントが必要）
            const response = await fetch('/api/admin/activateSubscription', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: storeId, serviceType: service, status: 'active' }),
            });

            // レスポンスがJSONかどうかを確認
            let responseData;
            try {
                responseData = await response.json();
            } catch (jsonError) {
                // JSONパースに失敗した場合（HTMLが返された場合など）
                throw new Error(`APIレスポンスの形式が不正です。サーバーエラー（404/500）の可能性があります。`);
            }

            if (!response.ok) {
                throw new Error(responseData.error || 'プランの有効化に失敗しました。');
            }

            // UIを更新
            setStores(prevStores => prevStores.map(store => {
                if (store.id === storeId) {
                    return {
                        ...store,
                        [`${service}SubscriptionStatus`]: 'active' as const,
                    };
                }
                return store;
            }));
            showMessage(`${storeId} の ${service} サービスを有料プランに更新しました。`);
        } catch (e: any) {
            console.error(`Error activating subscription for ${service}: `, e);
            setError(e.message || "プランの有効化中にエラーが発生しました。");
        } finally {
            setLoadingStore(null);
        }
    };

    const handleDeleteStore = async (storeId: string) => {
        if (!window.confirm("この店舗を本当に削除しますか？関連データも削除され、この操作は元に戻せません。")) {
            return;
        }
        
        setLoadingStore(storeId);
        setError(null);
        try {
             // 削除APIコール（実装は提供されていませんが、フロントエンドの処理は維持）
            const response = await fetch('/api/admin/deleteStore', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ storeId }),
            });

            // レスポンスパースの堅牢化
            let responseData;
            try {
                responseData = await response.json();
            } catch (jsonError) {
                if (response.ok) {
                    // 200 OK だが空のレスポンスの場合（成功と見なす）
                    responseData = { success: true };
                } else {
                    throw new Error(`APIレスポンスの形式が不正です。サーバーエラー（404/500）の可能性があります。`);
                }
            }


            if (!response.ok) {
                throw new Error(responseData.error || '削除に失敗しました。');
            }

            setStores(prevStores => prevStores.filter(store => store.id !== storeId));
            showMessage('店舗情報を削除しました。');
        } catch (e: any) {
            console.error("Error deleting store: ", e);
            setError(e.message || "店舗の削除中にエラーが発生しました。");
        } finally {
            setLoadingStore(null);
        }
    };


    const getServiceType = (roles: string[]) => {
        const hasAd = roles.includes('adver');
        const hasRecruit = roles.includes('recruit');
        if (hasAd && hasRecruit) {
            return <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-purple-100 text-purple-800">両方</span>;
        }
        if (hasAd) {
            return <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">広告＆紹介料</span>;
        }
        if (hasRecruit) {
            return <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">求人</span>;
        }
        return <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">未分類</span>;
    };

    /**
      * 支払い状況の列を「決済方法」中心の表示に修正します。
      */
    const getPaymentStatus = (store: Store) => {
        const statuses: { role: 'adver' | 'recruit', cycle: Store['adverBillingCycle'], status: Store['adverSubscriptionStatus'] }[] = [];

        /**
          * 支払いサイクルから決済方法のバッジを生成
          */
        const getMethodDisplay = (cycle: Store['adverBillingCycle']) => {
            if (cycle === 'monthly' || cycle === 'annual') {
                return <span className="bg-indigo-600 text-white text-xs font-medium px-1.5 rounded-full">💳 クレジット決済</span>;
            }
            if (cycle === 'invoice') {
                return <span className="bg-teal-600 text-white text-xs font-medium px-1.5 rounded-full">📄 請求書決済</span>;
            }
            return <span className="bg-gray-200 text-gray-700 text-xs font-medium px-1.5 rounded-full">未設定</span>;
        };
        
        // 購読ステータスバッジ
        const getStatusBadge = (status: Store['adverSubscriptionStatus']) => {
             switch (status) {
                 case 'active': return <span className="bg-green-100 text-green-800 text-xs font-medium px-1.5 rounded-full">有効</span>;
                 case 'trialing': return <span className="bg-blue-100 text-blue-800 text-xs font-medium px-1.5 rounded-full">トライアル中</span>;
                 case 'pending_invoice': return <span className="bg-yellow-100 text-yellow-800 text-xs font-medium px-1.5 rounded-full">請求書待ち</span>;
                 case 'canceled': return <span className="bg-red-100 text-red-800 text-xs font-medium px-1.5 rounded-full">解約済</span>;
                 case 'past_due': return <span className="bg-red-500 text-white text-xs font-medium px-1.5 rounded-full">支払遅延</span>;
                 case 'pending_card':
                 case 'pending_checkout': // 型定義に追加済み
                     return <span className="bg-yellow-500 text-white text-xs font-medium px-1.5 rounded-full">決済実行中</span>;
                 default: return <span className="bg-gray-100 text-gray-800 text-xs font-medium px-1.5 rounded-full">無料/未登録</span>; 
             }
        };


        // 広告サービスの状態を取得
        if (store.roles.includes('adver')) {
            statuses.push({
                role: 'adver',
                cycle: store.adverBillingCycle, 
                status: store.adverSubscriptionStatus
            });
        }

        // 求人サービスの状態を取得
        if (store.roles.includes('recruit')) {
            statuses.push({
                role: 'recruit',
                cycle: store.recruitBillingCycle,
                status: store.recruitSubscriptionStatus
            });
        }
        
        if (statuses.length === 0) {
            return <span className="bg-gray-100 text-gray-800 text-xs font-medium px-2.5 py-0.5 rounded-full">サービス未登録</span>;
        }
        
        // 複数のサービスを持つ場合、すべてのステータスを表示
        return (
            <div className="flex flex-col space-y-1">
                {statuses.map(s => (
                    <div key={s.role} className="flex flex-col p-1 bg-gray-50 rounded-md border border-gray-200">
                        <span className="font-bold text-gray-600 text-[10px]">{s.role === 'adver' ? '広告＆紹介' : '求人'}:</span>
                        <div className='flex items-center space-x-1 mt-0.5'>
                            {/* 支払い方法バッジ */}
                            {getMethodDisplay(s.cycle)}
                            {/* ステータスバッジ */}
                            {getStatusBadge(s.status)}
                        </div>
                        
                        {/* 請求書払い入金確認ボタン */}
                        {s.status === 'pending_invoice' && (
                            <button
                                onClick={() => handleActivateSubscription(store.id, s.role)}
                                disabled={loadingStore === store.id}
                                className="mt-1 flex items-center justify-center space-x-1 text-white bg-teal-500 hover:bg-teal-600 text-[10px] py-1 px-1.5 rounded-md disabled:opacity-50 transition"
                            >
                                <RiCheckboxCircleLine className='w-3 h-3' />
                                <span>{loadingStore === store.id ? '処理中...' : '入金確認/有効化'}</span>
                            </button>
                        )}

                    </div>
                ))}
            </div>
        );
    };
    
    return (
        <div className="min-h-screen bg-gray-100 p-4 sm:p-8">
            <Head>
                <title>{"店舗管理 - 管理者ページ"}</title>
            </Head>
            <div className="max-w-7xl mx-auto">
                <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center">
                    <h1 className="text-3xl font-bold text-gray-800">店舗管理</h1>
                    <Link href="/admin" className="text-sm text-blue-600 hover:underline mt-2 sm:mt-0">
                        ← 管理メニューに戻る
                    </Link>
                </div>
                <div className="mb-6">
                    <p className="text-red-600 bg-red-100 p-4 rounded-md text-center">
                        <strong>注意：</strong> 現在、このページの認証は一時的に解除されています。
                    </p>
                </div>
                {error && <p className="text-red-600 bg-red-100 p-4 rounded-md mb-6">{error}</p>}

                <div className="bg-white rounded-lg shadow overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">企業/店舗名</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">登録サービス</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ユーザー ID</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">支払い状況</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">登録年月日</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">連絡先</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">住所</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">アクション</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {stores.length > 0 ? stores.map(store => (
                                <tr key={store.id}>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="font-medium text-gray-900">{store.companyName}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {getServiceType(store.roles)}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-500 font-mono text-ellipsis overflow-hidden max-w-xs">
                                        {store.id}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {getPaymentStatus(store)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {store.createdAt}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        <div>{store.email}</div>
                                        <div>{store.phoneNumber}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{store.address}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-4">
                                        
                                        <button onClick={() => handleDeleteStore(store.id)} disabled={loadingStore === store.id} className="text-red-600 hover:text-red-900 disabled:opacity-50 inline-flex items-center space-x-1">
                                            <RiDeleteBinLine className='w-4 h-4' />
                                            <span>{loadingStore === store.id ? '削除中...' : '削除'}</span>
                                        </button>

                                        {(store.roles.includes('adver') || store.roles.includes('recruit')) && (
                                             <Link href={`/admin/referral-rewards?storeId=${store.id}`} className="text-green-600 hover:text-green-900 inline-flex items-center space-x-1">
                                                <RiMoneyDollarCircleLine className='w-4 h-4' />
                                                <span>報酬管理</span>
                                             </Link>
                                         )}
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={8} className="p-4 text-center text-gray-500">登録されている店舗はありません。</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default ManageStoresPage;