import { NextPage, GetServerSideProps } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import { useState } from 'react';
import nookies from 'nookies';
import { adminAuth, adminDb } from '@/lib/firebase-admin'; // 正しいインポート
import { getAuth } from 'firebase/auth'; // クライアント認証用
import { db } from '@/lib/firebase'; // クライアントDB用
import { doc, getDoc, updateDoc } from 'firebase/firestore';

// --- 型定義 ---
interface PayoutSettings {
    bankName: string;
    branchName: string;
    accountType: '普通' | '当座';
    accountNumber: string;
    accountHolder: string;
    stripeAccountId: string | null;
}

interface PayoutSettingsPageProps {
    initialSettings: PayoutSettings | null;
    uid: string;
}

// コンポーネント名をページ名に合わせて修正
const PayoutSetupPage: NextPage<PayoutSettingsPageProps> = ({ initialSettings, uid }) => {
    const [settings, setSettings] = useState<PayoutSettings>(
        initialSettings || {
            bankName: '',
            branchName: '',
            accountType: '普通',
            accountNumber: '',
            accountHolder: '',
            stripeAccountId: null,
        }
    );
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { id, value } = e.target;
        setSettings(prev => ({ ...prev, [id]: value }));
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setMessage(null);

        // クライアントDBを使って設定を更新
        try {
            if (!uid) throw new Error('ユーザーIDが見つかりません。');
            
            const settingsRef = doc(db, 'partners', uid);
            
            // StripeアカウントIDはそのまま保持し、他の設定のみ更新
            await updateDoc(settingsRef, {
                payoutSettings: {
                    bankName: settings.bankName,
                    branchName: settings.branchName,
                    accountType: settings.accountType,
                    accountNumber: settings.accountNumber,
                    accountHolder: settings.accountHolder,
                }
            });

            setMessage({ type: 'success', text: '支払い設定を保存しました。' });
        } catch (error) {
            console.error('Error saving settings:', error);
            setMessage({ type: 'error', text: '設定の保存に失敗しました。' });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 p-8">
            <Head>
                <title>支払い設定 - パートナー</title>
            </Head>
            <div className="max-w-2xl mx-auto">
                <Link href="/partner/dashboard" className="text-blue-500 hover:underline">
                    ← ダッシュボードに戻る
                </Link>
                <h1 className="text-3xl font-bold my-6 text-center">支払い受け取り設定</h1>

                <form onSubmit={handleSave} className="bg-white p-8 rounded-lg shadow-xl space-y-6">
                    <p className="text-sm text-gray-600 border-l-4 border-orange-400 pl-3 py-1 bg-orange-50">
                        紹介報酬を受け取るための銀行口座情報を登録してください。
                    </p>

                    <div>
                        <label htmlFor="bankName" className="block text-sm font-medium text-gray-700">銀行名</label>
                        <input id="bankName" type="text" value={settings.bankName} onChange={handleChange} required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"/>
                    </div>
                    <div>
                        <label htmlFor="branchName" className="block text-sm font-medium text-gray-700">支店名</label>
                        <input id="branchName" type="text" value={settings.branchName} onChange={handleChange} required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"/>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="accountType" className="block text-sm font-medium text-gray-700">口座種別</label>
                            <select id="accountType" value={settings.accountType} onChange={handleChange} required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 bg-white">
                                <option value="普通">普通</option>
                                <option value="当座">当座</option>
                            </select>
                        </div>
                        <div>
                            <label htmlFor="accountNumber" className="block text-sm font-medium text-gray-700">口座番号</label>
                            <input id="accountNumber" type="text" pattern="[0-9]*" value={settings.accountNumber} onChange={handleChange} required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"/>
                        </div>
                    </div>
                    
                    <div>
                        <label htmlFor="accountHolder" className="block text-sm font-medium text-gray-700">口座名義 (カタカナ)</label>
                        <input id="accountHolder" type="text" value={settings.accountHolder} onChange={handleChange} required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"/>
                    </div>

                    {message && (
                        <div className={`p-3 rounded text-center ${message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                            {message.text}
                        </div>
                    )}
                    
                    <div className="text-center pt-4">
                        <button type="submit" disabled={isLoading} className="w-full bg-indigo-600 text-white font-bold py-3 rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 transition-colors">
                            {isLoading ? '保存中...' : '支払い設定を保存する'}
                        </button>
                    </div>
                </form>
                
                {settings.stripeAccountId ? (
                    <div className="mt-8 p-6 bg-green-50 border-t-4 border-green-500 rounded-lg shadow">
                        <p className="font-semibold text-green-800">Stripe連携完了</p>
                        <p className="text-sm text-gray-700 mt-1">Stripe Connectアカウントとの連携は完了しています。</p>
                    </div>
                ) : (
                    <div className="mt-8 p-6 bg-red-50 border-t-4 border-red-500 rounded-lg shadow">
                        <p className="font-semibold text-red-800">Stripe連携が必要です</p>
                        <p className="text-sm text-gray-700 mt-1">Stripe Connectアカウントと連携することで、自動での報酬振込が可能になります。</p>
                        {/* 実際にはStripe連携ボタンがここに配置されます */}
                        <button className="mt-3 bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 text-sm">
                            Stripeと連携する (未実装)
                        </button>
                    </div>
                )}

            </div>
        </div>
    );
};

// --- サーバーサイドでの認証とデータ取得 ---
export const getServerSideProps: GetServerSideProps = async (context) => {
    try {
        const cookies = nookies.get(context);
        if (!cookies.token) {
            return { redirect: { destination: '/partner/login', permanent: false } };
        }
        
        // adminAuthを直接使用
        const token = await adminAuth.verifyIdToken(cookies.token, true);
        const uid = token.uid;
        
        // adminDbを直接使用
        const partnerDoc = await adminDb.collection('partners').doc(uid).get();

        if (!partnerDoc.exists) {
            // パートナーデータがない場合はログインページへリダイレクト
            return { redirect: { destination: '/partner/login', permanent: false } };
        }

        const partnerData = partnerDoc.data();
        
        const initialSettings: PayoutSettings = {
            bankName: partnerData?.payoutSettings?.bankName || '',
            branchName: partnerData?.payoutSettings?.branchName || '',
            accountType: partnerData?.payoutSettings?.accountType || '普通',
            accountNumber: partnerData?.payoutSettings?.accountNumber || '',
            accountHolder: partnerData?.payoutSettings?.accountHolder || '',
            stripeAccountId: partnerData?.stripeAccountId || null,
        };

        return { 
            props: { 
                initialSettings, 
                uid,
            }
        };

    } catch (error) {
        console.error('Authentication or data error:', error);
        return { redirect: { destination: '/partner/login', permanent: false } };
    }
};

export default PayoutSetupPage;