import { NextPage, GetServerSideProps } from 'next';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import nookies from 'nookies';
import { doc, getDoc, updateDoc, Timestamp, deleteDoc } from 'firebase/firestore';
import { RiArrowLeftLine, RiSaveLine, RiDeleteBinLine, RiLoader4Line } from 'react-icons/ri';
import React, { useState } from 'react';

// サーバー側DB（Admin SDK）
import { adminAuth, adminDb } from '../../../lib/firebase-admin'; 
// クライアント側DB
import { db } from '../../../lib/firebase'; 

// --- 型定義 (manageStores.tsx と合わせる) ---
type SubscriptionStatus = "active" | "trialing" | "pending_invoice" | "canceled" | "past_due" | "pending_card" | "pending_checkout" | null;
type BillingCycle = "monthly" | "annual" | "invoice" | null;

interface UserStoreData {
  id: string; // User ID
  userId: string; // User ID
  companyName: string;
  address: string;
  phoneNumber: string;
  email: string;
  roles: string[];
  stripeCustomerId?: string;
  createdAt: string; // シリアライズ後の文字列
  adverSubscriptionStatus: SubscriptionStatus;
  recruitSubscriptionStatus: SubscriptionStatus;
  adverBillingCycle: BillingCycle;
  recruitBillingCycle: BillingCycle;
}

interface EditStoreProps {
  userData: UserStoreData | null;
}

// --- サーバーサイドでのデータ取得と認証 ---
export const getServerSideProps: GetServerSideProps = async (context) => {
  // ★ 修正: パラメータ名を [userId].tsx に合わせる
  const { userId } = context.params!;
  
  try {
    // 1. 管理者認証 (nookiesでセッションクッキーを検証)
    const cookies = nookies.get(context);
    const sessionCookie = cookies.session || ''; // 'token' ではなく 'session' を想定
    if (!sessionCookie) {
      return { redirect: { destination: '/partner/login', permanent: false } };
    }
    const token = await adminAuth.verifySessionCookie(sessionCookie, true);
    
    // 2. 管理者ロールの確認
    const adminUserDoc = await adminDb.collection('users').doc(token.uid).get();
    if (!adminUserDoc.exists || !adminUserDoc.data()?.roles?.includes('admin')) {
      return { redirect: { destination: '/partner/login', permanent: false } };
    }

    // 3. ★ 修正: ルートの 'users' コレクションから対象のドキュメントを取得
    const userRef = adminDb.collection('users').doc(userId as string);
    const userSnapshot = await userRef.get();

    if (!userSnapshot.exists) {
      return { props: { userData: null } };
    }

    const data = userSnapshot.data()!;
    const createdAt = data.createdAt as Timestamp | undefined;

    // 4. データ整形
    const userData: UserStoreData = {
      id: userSnapshot.id,
      userId: userSnapshot.id,
      companyName: data.companyName || data.storeName || data.email || "名称未設定",
      address: data.address || "",
      phoneNumber: data.phoneNumber || "",
      email: data.email || "",
      roles: data.roles || [],
      stripeCustomerId: data.stripeCustomerId || null,
      createdAt: createdAt ? createdAt.toDate().toISOString() : new Date().toISOString(),
      adverSubscriptionStatus: data.adverSubscriptionStatus || null,
      recruitSubscriptionStatus: data.recruitSubscriptionStatus || null,
      adverBillingCycle: data.adverBillingCycle || null,
      recruitBillingCycle: data.recruitBillingCycle || null,
    };

    return {
      props: {
        userData: userData
      },
    };

  } catch (error) {
    console.error("Admin data fetch error:", error);
    // 認証失敗時もログインへ
    return { redirect: { destination: '/partner/login', permanent: false } };
  }
};


// --- ページコンポーネント ---
const AdminEditStorePage: NextPage<EditStoreProps> = ({ userData }) => {
    const router = useRouter();
    const [formData, setFormData] = useState<UserStoreData | null>(userData);
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    if (!formData) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <p className="text-xl text-red-600">ユーザーデータが見つかりませんでした。</p>
                <Link href="/admin/manageStores" className="text-blue-600 hover:underline ml-4">
                    &larr; 店舗管理リストに戻る
                </Link>
            </div>
        );
    }

    // --- フォーム処理 ---
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        if (formData) {
            setFormData({ ...formData, [name]: value });
        }
    };
    
    // ロールのチェックボックス処理
    const handleRoleChange = (role: 'adver' | 'recruit') => {
        if (formData) {
            const currentRoles = formData.roles;
            let newRoles: string[];

            if (currentRoles.includes(role)) {
                newRoles = currentRoles.filter(r => r !== role); // 削除
            } else {
                newRoles = [...currentRoles, role]; // 追加
            }
            setFormData({ ...formData, roles: newRoles });
        }
    };


    // --- 保存処理 ---
    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData || !userData) return;

        setSaving(true);
        setError(null);

        try {
            // ★ 修正: ルートの 'users' ドキュメントを参照
            const userRef = doc(db, 'users', formData.userId);
            
            // 更新データ
            const updateData = { 
                companyName: formData.companyName,
                address: formData.address,
                phoneNumber: formData.phoneNumber,
                email: formData.email, // emailの編集（管理者のみ）
                roles: formData.roles,
                adverSubscriptionStatus: formData.adverSubscriptionStatus,
                recruitSubscriptionStatus: formData.recruitSubscriptionStatus,
                adverBillingCycle: formData.adverBillingCycle,
                recruitBillingCycle: formData.recruitBillingCycle,
                // 注意: status, description, mainCategory などは
                // 'users' ドキュメントには無い想定 (もし必要ならここに追加)
            };

            await updateDoc(userRef, updateData);

            alert("ユーザー情報を更新しました。");

        } catch (err) {
            console.error("保存エラー:", err);
            setError("保存中にエラーが発生しました。権限とパスを確認してください。");
        } finally {
            setSaving(false);
        }
    };

    // --- 削除処理 ---
    const handleDelete = async () => {
        if (!formData || !userData) return;
        if (!window.confirm(`【最終確認】ユーザーID: ${formData.userId} (${formData.companyName}) を本当に削除しますか？\nこの操作は元に戻せません。`)) return;

        setDeleting(true);
        setError(null);

        try {
            // ★ 修正: ルートの 'users' ドキュメントを削除
            // クライアント側からの削除はセキュリティルールで拒否される可能性があります。
            // 本来はAPIエンドポイント(/api/admin/deleteUser)を呼び出すべきです。
            // ここでは、クライアントSDKで試行します。
            
            const userRef = doc(db, 'users', formData.userId);
            await deleteDoc(userRef);

            alert("ユーザー情報を削除しました。");
            router.push('/admin/manageStores'); // 管理リストに戻る

        } catch (err: any) {
            console.error("削除エラー:", err);
            setError("削除中にエラーが発生しました。Firestoreの権限（クライアントからの削除）を確認するか、Admin SDK経由のAPIを作成してください。");
        } finally {
            setDeleting(false);
        }
    };

    // --- UI レンダリング ---
    return (
        <div className="min-h-screen bg-gray-50 font-sans">
            <Head>
                <title>{`ユーザー編集 - ${formData.companyName}`}</title>
            </Head>
             <header className="bg-white shadow-sm">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
                    {/* ★ 修正: 戻るリンク先を manageStores に変更 */}
                    <button onClick={() => router.push('/admin/manageStores')} className="flex items-center text-gray-600 hover:text-gray-900 font-semibold">
                        <RiArrowLeftLine className="w-5 h-5 mr-2" /> 店舗管理リストに戻る
                    </button>
                    <h1 className="text-2xl font-bold text-gray-800">ユーザー情報編集</h1>
                    <button 
                        onClick={handleDelete}
                        disabled={deleting}
                        className="px-4 py-2 text-sm bg-red-600 text-white rounded-md hover:bg-red-700 flex items-center disabled:bg-gray-400"
                    >
                        <RiDeleteBinLine className="w-4 h-4 mr-1" /> {deleting ? '削除中...' : 'ユーザー削除'}
                    </button>
                </div>
            </header>

            <main className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
                {error && <div className="p-3 mb-4 bg-red-100 text-red-700 rounded-md">{error}</div>}
                
                {/* ★ 修正: フォーム全体を 'users' ドキュメントの内容に合わせる */}
                <form onSubmit={handleSave} className="bg-white p-6 rounded-lg shadow-md space-y-6">
                    {/* 基本情報 */}
                    <h2 className="text-xl font-bold border-b pb-2 text-gray-800">基本情報（Userドキュメント）</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">企業/店舗名</label>
                            <input type="text" name="companyName" value={formData.companyName} onChange={handleChange} required className="mt-1 block w-full p-2 border rounded-md" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">ユーザーUID (編集不可)</label>
                            <input type="text" value={formData.userId} disabled className="mt-1 block w-full p-2 border rounded-md bg-gray-100 font-mono" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">メールアドレス</label>
                            <input type="email" name="email" value={formData.email} onChange={handleChange} required className="mt-1 block w-full p-2 border rounded-md" />
                        </div>
                         <div>
                            <label className="block text-sm font-medium text-gray-700">電話番号</label>
                            <input type="text" name="phoneNumber" value={formData.phoneNumber} onChange={handleChange} className="mt-1 block w-full p-2 border rounded-md" />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700">住所</label>
                            <input type="text" name="address" value={formData.address} onChange={handleChange} className="mt-1 block w-full p-2 border rounded-md" />
                        </div>
                    </div>
                    
                    {/* ロールとサブスクリプション */}
                    <h2 className="text-xl font-bold border-b pb-2 text-gray-800 pt-4">権限と契約状態</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* ロール */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700">権限 (Roles)</label>
                            <div className="mt-2 space-y-2">
                                <label className="flex items-center">
                                    <input type="checkbox" checked={formData.roles.includes('adver')} onChange={() => handleRoleChange('adver')} className="h-4 w-4 text-green-600 border-gray-300 rounded" />
                                    <span className="ml-2 text-sm text-green-700 font-semibold">adver (広告)</span>
                                </label>
                                <label className="flex items-center">
                                    <input type="checkbox" checked={formData.roles.includes('recruit')} onChange={() => handleRoleChange('recruit')} className="h-4 w-4 text-blue-600 border-gray-300 rounded" />
                                    <span className="ml-2 text-sm text-blue-700 font-semibold">recruit (求人)</span>
                                </label>
                            </div>
                        </div>
                        {/* Stripe ID */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Stripe Customer ID (編集不可)</label>
                            <input type="text" value={formData.stripeCustomerId || "N/A"} disabled className="mt-1 block w-full p-2 border rounded-md bg-gray-100 font-mono" />
                        </div>

                        {/* 広告プラン */}
                        <div className="space-y-2 p-4 border rounded-md bg-green-50">
                            <label className="block text-sm font-medium text-green-800">広告プラン (Adver Status)</label>
                            <select name="adverSubscriptionStatus" value={formData.adverSubscriptionStatus || ""} onChange={handleChange} className="mt-1 block w-full p-2 border rounded-md">
                                <option value="">N/A (null)</option>
                                <option value="active">有効 (active)</option>
                                <option value="pending_invoice">請求書待ち (pending_invoice)</option>
                                <option value="canceled">キャンセル済 (canceled)</option>
                                <option value="past_due">支払い遅延 (past_due)</option>
                            </select>
                            <label className="block text-sm font-medium text-green-800">広告 決済方法</label>
                            <select name="adverBillingCycle" value={formData.adverBillingCycle || ""} onChange={handleChange} className="mt-1 block w-full p-2 border rounded-md">
                                <option value="">N/A (null)</option>
                                <option value="monthly">クレジット (monthly)</option>
                                <option value="annual">クレジット (annual)</option>
                                <option value="invoice">請求書 (invoice)</option>
                            </select>
                        </div>
                        
                        {/* 求人プラン */}
                         <div className="space-y-2 p-4 border rounded-md bg-blue-50">
                            <label className="block text-sm font-medium text-blue-800">求人プラン (Recruit Status)</label>
                            <select name="recruitSubscriptionStatus" value={formData.recruitSubscriptionStatus || ""} onChange={handleChange} className="mt-1 block w-full p-2 border rounded-md">
                                <option value="">N/A (null)</option>
                                <option value="active">有効 (active)</option>
                                <option value="pending_invoice">請求書待ち (pending_invoice)</option>
                                <option value="canceled">キャンセル済 (canceled)</option>
                                <option value="past_due">支払い遅延 (past_due)</option>
                            </select>
                             <label className="block text-sm font-medium text-blue-800">求人 決済方法</label>
                            <select name="recruitBillingCycle" value={formData.recruitBillingCycle || ""} onChange={handleChange} className="mt-1 block w-full p-2 border rounded-md">
                                <option value="">N/A (null)</option>
                                <option value="monthly">クレジット (monthly)</option>
                                <option value="annual">クレジット (annual)</option>
                                <option value="invoice">請求書 (invoice)</option>
                            </select>
                        </div>
                    </div>

                    {/* 保存ボタン */}
                    <div className="pt-6 border-t flex justify-end">
                        <button type="submit" disabled={saving || deleting} className="px-6 py-3 bg-indigo-600 text-white font-bold rounded-md hover:bg-indigo-700 flex items-center disabled:bg-gray-400">
                            {saving ? <RiLoader4Line className="animate-spin mr-2" /> : <RiSaveLine className="w-5 h-5 mr-2" />}
                            {saving ? '保存中...' : '変更を適用'}
                        </button>
                    </div>
                </form>
            </main>
        </div>
    );
};

export default AdminEditStorePage;
