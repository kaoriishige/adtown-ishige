import { GetServerSideProps, NextPage } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { adminDb } from '@/lib/firebase-admin';
import { useState } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

// --- 型定義 ---
interface Store {
  id: string;
  companyName: string;
  address: string;
  phoneNumber: string;
  email: string;
  roles: string[];
}

interface EditStorePageProps {
  store: Store | null;
}

// --- サーバーサイド処理 ---
export const getServerSideProps: GetServerSideProps = async (context) => {
    // 認証チェックは一時的に無効化
    const { id } = context.params as { id: string };

    if (!id) {
        return { notFound: true };
    }

    try {
        const userDoc = await adminDb.collection('users').doc(id).get();
        if (!userDoc.exists) {
            return { notFound: true };
        }
        const data = userDoc.data()!;
        const store: Store = {
            id: userDoc.id,
            companyName: data.companyName || '',
            address: data.address || '',
            phoneNumber: data.phoneNumber || '',
            email: data.email || '',
            roles: data.roles || [],
        };
        // FirestoreのTimestamp型などをシリアライズ可能な形式に変換
        return { props: { store: JSON.parse(JSON.stringify(store)) } };
    } catch (error) {
        console.error("Error fetching store for edit:", error);
        return { notFound: true };
    }
};

const EditStorePage: NextPage<EditStorePageProps> = ({ store }) => {
    const [formData, setFormData] = useState(store);
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const router = useRouter();

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => prev ? { ...prev, [name]: value } : null);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData) return;
        setIsLoading(true);
        setMessage(null);
        try {
            const storeRef = doc(db, 'users', formData.id);
            await updateDoc(storeRef, {
                companyName: formData.companyName,
                address: formData.address,
                phoneNumber: formData.phoneNumber,
                email: formData.email,
            });
            setMessage({ type: 'success', text: '店舗情報を更新しました。' });
        } catch (err) {
            setMessage({ type: 'error', text: '更新に失敗しました。' });
        } finally {
            setIsLoading(false);
        }
    };
    
    if (!formData) {
        return (
            <div className="flex h-screen items-center justify-center">
                <p>店舗情報が見つかりません。</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100 p-8">
            <Head><title>店舗情報編集</title></Head>
            <div className="max-w-2xl mx-auto">
                 <div className="mb-6 flex justify-between items-center">
                    <h1 className="text-3xl font-bold text-gray-800">店舗情報編集</h1>
                    <Link href="/admin/manageStores" className="text-sm text-blue-600 hover:underline">
                        ← 店舗管理に戻る
                    </Link>
                </div>
                 <div className="mb-6">
                    <p className="text-red-600 bg-red-100 p-4 rounded-md text-center">
                        <strong>注意：</strong> 現在、このページの認証は一時的に解除されています。
                    </p>
                </div>
                <form onSubmit={handleSave} className="bg-white p-8 rounded-lg shadow-md space-y-6">
                    {message && <div className={`p-4 rounded-md ${message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{message.text}</div>}
                    <div>
                        <label htmlFor="companyName" className="block text-sm font-medium text-gray-700">企業/店舗名</label>
                        <input type="text" name="companyName" id="companyName" value={formData.companyName} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm" />
                    </div>
                    <div>
                        <label htmlFor="address" className="block text-sm font-medium text-gray-700">住所</label>
                        <input type="text" name="address" id="address" value={formData.address} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm" />
                    </div>
                     <div>
                        <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700">電話番号</label>
                        <input type="text" name="phoneNumber" id="phoneNumber" value={formData.phoneNumber} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm" />
                    </div>
                     <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700">メールアドレス</label>
                        <input type="email" name="email" id="email" value={formData.email} readOnly className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-100 cursor-not-allowed" />
                    </div>
                    <div className="flex justify-end pt-4">
                        <button type="submit" disabled={isLoading} className="px-6 py-2 bg-indigo-600 text-white font-bold rounded-md hover:bg-indigo-700 disabled:bg-gray-400">
                            {isLoading ? '保存中...' : '保存する'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditStorePage;