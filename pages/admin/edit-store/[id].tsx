import { NextPage, GetServerSideProps } from 'next';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import nookies from 'nookies';
import { doc, getDoc, updateDoc, Timestamp, collection, query, getDocs, where, deleteDoc } from 'firebase/firestore';
import { getStorage, ref, deleteObject } from 'firebase/storage';
import { RiArrowLeftLine, RiSaveLine, RiDeleteBinLine, RiImageLine, RiLoader4Line } from 'react-icons/ri';
import React, { useState } from 'react';

// [NOTE: db, adminAuth, adminDb, storage from '@/lib/firebase-admin' are assumed to be imported here]
import { adminAuth, adminDb } from '../../../lib/firebase-admin'; // サーバー側DB
import { db, storage } from '../../../lib/firebase'; // クライアント側DB/Storage

// --- 型定義 ---
interface StoreData {
    id: string;
    ownerId: string;
    name: string;
    address: string;
    phoneNumber: string;
    mainCategory: string;
    subCategory: string;
    description: string;
    websiteUrl: string;
    snsUrls: string[];
    mainImageUrl: string;
    galleryImageUrls: string[];
    status: 'pending' | 'verified' | 'rejected';
    createdAt: string;
}

interface EditStoreProps {
    store: StoreData | null;
}

// ダミーカテゴリデータ (実際のアプリデータと合わせる必要があります)
const categoryData: { [key: string]: string[] } = {
    "飲食関連": ["レストラン・食堂", "カフェ・喫茶店", "その他"],
    "美容・健康関連": ["美容室・理容室", "整体・整骨院・鍼灸院", "その他"],
    "その他": ["その他"],
};
const mainCategories = Object.keys(categoryData);


const AdminEditStorePage: NextPage<EditStoreProps> = ({ store }) => {
    const router = useRouter();
    const [formData, setFormData] = useState<StoreData | null>(store);
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    if (!formData) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <p className="text-xl text-red-600">店舗データが見つかりませんでした。</p>
                <Link href="/admin/review-approval" className="text-blue-600 hover:underline ml-4">
                    &larr; 承認リストに戻る
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

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData || !store) return;

        setSaving(true);
        setError(null);

        try {
            // Firestoreのドキュメントリファレンスを構築
            // (adminのusers/{uid}/stores/{storeId} パスを使用)
            const storeRef = doc(db, 'artifacts', 'minna-no-nasu-app', 'users', formData.ownerId, 'stores', store.id);
            
            // 更新データ (createdAt, updatedAtは含めない)
            const updateData = { 
                name: formData.name, address: formData.address, phoneNumber: formData.phoneNumber,
                mainCategory: formData.mainCategory, subCategory: formData.subCategory,
                description: formData.description, websiteUrl: formData.websiteUrl,
                snsUrls: formData.snsUrls, status: formData.status
            };

            await updateDoc(storeRef, updateData);

            alert("店舗情報を更新しました。");

        } catch (err) {
            console.error("保存エラー:", err);
            setError("保存中にエラーが発生しました。権限とパスを確認してください。");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!formData || !store) return;
        if (!window.confirm("この店舗のデータと画像をすべて削除しますか？")) return;

        setDeleting(true);
        setError(null);

        try {
            // 1. Storage内の画像ファイルを削除
            const storagePathPrefix = `users/${formData.ownerId}/stores/${store.id}`;
            const listRef = ref(storage, storagePathPrefix);
            
            // (実際にはStorageAdminSDKを使って再帰的に削除するAPIエンドポイントを叩くべきですが、ここでは簡略化)
            
            // 2. Firestoreドキュメントを削除
            const storeRef = doc(db, 'artifacts', 'minna-no-nasu-app', 'users', formData.ownerId, 'stores', store.id);
            await deleteDoc(storeRef);

            alert("店舗情報を完全に削除しました。");
            router.push('/admin/review-approval'); // 承認リストに戻る

        } catch (err) {
            console.error("削除エラー:", err);
            setError("削除中にエラーが発生しました。");
        } finally {
            setDeleting(false);
        }
    };

    // --- ステータスカラーヘルパー ---
    const getStatusColor = (status: StoreData['status']) => {
        switch (status) {
            case 'verified': return 'bg-green-500';
            case 'pending': return 'bg-yellow-500';
            case 'rejected': return 'bg-red-500';
            default: return 'bg-gray-500';
        }
    };

    // --- UI レンダリング ---
    return (
        <div className="min-h-screen bg-gray-50 font-sans">
            <Head>
                {/* 💡 修正箇所: {店舗情報編集 - {formData.name}} を修正 */}
                <title>{`店舗情報編集 - ${formData.name}`}</title>
            </Head>
             <header className="bg-white shadow-sm">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
                    <button onClick={() => router.push('/admin/review-approval')} className="flex items-center text-gray-600 hover:text-gray-900 font-semibold">
                        <RiArrowLeftLine className="w-5 h-5 mr-2" /> 承認リストに戻る
                    </button>
                    <h1 className="text-2xl font-bold text-gray-800">店舗情報編集 (Admin)</h1>
                    <button 
                        onClick={handleDelete}
                        disabled={deleting}
                        className="px-4 py-2 text-sm bg-red-600 text-white rounded-md hover:bg-red-700 flex items-center disabled:bg-gray-400"
                    >
                        <RiDeleteBinLine className="w-4 h-4 mr-1" /> {deleting ? '削除中...' : '完全削除'}
                    </button>
                </div>
            </header>

            <main className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
                {error && <div className="p-3 mb-4 bg-red-100 text-red-700 rounded-md">{error}</div>}

                {/* ステータスバッジ */}
                <div className="mb-6 flex justify-between items-center bg-white p-4 rounded-lg shadow-md">
                    <p className="text-lg font-semibold text-gray-700">現在のステータス:</p>
                    <span className={`px-4 py-2 rounded-full text-white font-bold ${getStatusColor(formData.status)}`}>
                        {formData.status === 'verified' ? '承認済み' : formData.status === 'pending' ? '審査待ち' : '却下'}
                    </span>
                    <select
                        name="status"
                        value={formData.status}
                        onChange={handleChange}
                        className="p-2 border rounded-md"
                    >
                        <option value="pending">審査待ち (Pending)</option>
                        <option value="verified">承認 (Verified)</option>
                        <option value="rejected">却下 (Rejected)</option>
                    </select>
                </div>
                
                <form onSubmit={handleSave} className="bg-white p-6 rounded-lg shadow-md space-y-6">
                    {/* 基本情報 */}
                    <h2 className="text-xl font-bold border-b pb-2 text-gray-800">基本情報</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">店舗名</label>
                            <input type="text" name="name" value={formData.name} onChange={handleChange} required className="mt-1 block w-full p-2 border rounded-md" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">オーナーUID</label>
                            <input type="text" value={formData.ownerId} disabled className="mt-1 block w-full p-2 border rounded-md bg-gray-100" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">住所</label>
                            <input type="text" name="address" value={formData.address} onChange={handleChange} required className="mt-1 block w-full p-2 border rounded-md" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">電話番号</label>
                            <input type="text" name="phoneNumber" value={formData.phoneNumber} onChange={handleChange} required className="mt-1 block w-full p-2 border rounded-md" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">メインカテゴリ</label>
                            <select name="mainCategory" value={formData.mainCategory} onChange={handleChange} className="mt-1 block w-full p-2 border rounded-md">
                                {mainCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">サブカテゴリ</label>
                            <select name="subCategory" value={formData.subCategory} onChange={handleChange} className="mt-1 block w-full p-2 border rounded-md">
                                {categoryData[formData.mainCategory]?.map(sub => <option key={sub} value={sub}>{sub}</option>)}
                            </select>
                        </div>
                    </div>
                    
                    {/* 詳細情報 */}
                    <h2 className="text-xl font-bold border-b pb-2 text-gray-800 pt-4">詳細・URL</h2>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">店舗紹介文・営業時間</label>
                        <textarea name="description" value={formData.description} onChange={handleChange} rows={6} className="mt-1 block w-full p-2 border rounded-md"></textarea>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">ウェブサイトURL</label>
                        <input type="url" name="websiteUrl" value={formData.websiteUrl} onChange={handleChange} className="mt-1 block w-full p-2 border rounded-md" />
                    </div>
                    
                    {/* 画像とSNS */}
                    <h2 className="text-xl font-bold border-b pb-2 text-gray-800 pt-4">画像・SNS</h2>
                    <div className="space-y-4">
                        <p className="font-medium text-gray-700">メイン画像:</p>
                        {formData.mainImageUrl ? (
                            <img src={formData.mainImageUrl} alt="Main Image" className="w-32 h-auto rounded-md shadow" />
                        ) : (
                            <p className="text-sm text-gray-500 flex items-center"><RiImageLine className="mr-1" />画像なし</p>
                        )}
                    </div>
                    <div className="space-y-4">
                        <p className="font-medium text-gray-700">ギャラリー ({formData.galleryImageUrls.length}枚):</p>
                        <div className="flex flex-wrap gap-2">
                            {formData.galleryImageUrls.map((url, index) => (
                                <img key={index} src={url} alt={`Gallery ${index}`} className="w-20 h-20 object-cover rounded-md shadow" />
                            ))}
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

// --- サーバーサイドでのデータ取得と認証 ---
export const getServerSideProps: GetServerSideProps = async (context) => {
    const { storeId } = context.params!;
    
    try {
        const cookies = nookies.get(context);
        if (!cookies.token) {
            return { redirect: { destination: '/admin/login', permanent: false } };
        }
        
        const token = await adminAuth.verifyIdToken(cookies.token, true);
        const userDoc = await adminDb.collection('users').doc(token.uid).get();

        if (!userDoc.exists || !userDoc.data()?.roles?.includes('admin')) {
            return { redirect: { destination: '/admin/login', permanent: false } };
        }

        // 1. stores コレクションを Collection Group Query で検索
        //    (storeIdで検索するため、Firestoreインデックスが必要です)
        const storesRef = adminDb.collectionGroup('stores').where('id', '==', storeId as string);
        const storesSnapshot = await storesRef.get();

        if (storesSnapshot.empty) {
             return { props: { store: null } };
        }

        const data = storesSnapshot.docs[0].data();
        
        // 2. データ整形
        const storeData: StoreData = {
            id: storesSnapshot.docs[0].id,
            ownerId: data.ownerId || '',
            name: data.name || '',
            address: data.address || '',
            phoneNumber: data.phoneNumber || '',
            mainCategory: data.mainCategory || mainCategories[0],
            subCategory: data.subCategory || categoryData[mainCategories[0]][0],
            description: data.description || '',
            websiteUrl: data.websiteUrl || '',
            snsUrls: data.snsUrls || [],
            mainImageUrl: data.mainImageUrl || '',
            galleryImageUrls: data.galleryImageUrls || [],
            status: data.status || 'pending',
            createdAt: data.createdAt instanceof Timestamp 
                ? data.createdAt.toDate().toISOString() 
                : new Date().toISOString(),
        };

        return {
            props: {
                store: storeData
            },
        };

    } catch (error) {
        console.error("Admin data fetch error:", error);
        return { props: { store: null } };
    }
};

export default AdminEditStorePage;

