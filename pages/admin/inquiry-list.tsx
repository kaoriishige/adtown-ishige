import { GetServerSideProps, NextPage } from 'next';
import Head from 'next/head';
import React, { useState } from 'react';
import { adminDb, getUidFromCookie } from '../../lib/firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';
// ★★★ 修正箇所1: Firebaseの型をインポート ★★★
import * as admin from 'firebase-admin';

interface Inquiry {
    id: string;
    name: string;
    email: string;
    message: string;
    createdAt: string; // 日付は文字列として扱う
    isResolved: boolean;
}

interface InquiryListProps {
    initialInquiries: Inquiry[];
}

const InquiryListPage: NextPage<InquiryListProps> = ({ initialInquiries }) => {
    const [inquiries, setInquiries] = useState(initialInquiries);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleToggleResolved = async (id: string, currentStatus: boolean) => {
        const originalInquiries = [...inquiries];
        
        // UIを即時反映
        setInquiries(prev => prev.map(inq => inq.id === id ? { ...inq, isResolved: !currentStatus } : inq));

        try {
            const response = await fetch(`/api/admin/inquiries/${id}/resolve`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ isResolved: !currentStatus }),
            });

            if (!response.ok) {
                throw new Error('ステータスの更新に失敗しました。');
            }
        } catch (err) {
            setError('更新に失敗しました。ページを再読み込みしてください。');
            // エラー時にUIを元に戻す
            setInquiries(originalInquiries);
        }
    };
    
    return (
        <div className="min-h-screen bg-gray-100 p-8">
            <Head>
                <title>お問い合わせ管理</title>
                <script src="https://cdn.tailwindcss.com"></script>
            </Head>
            <div className="max-w-4xl mx-auto bg-white p-6 rounded-lg shadow-md">
                <h1 className="text-2xl font-bold text-gray-800 mb-6">お問い合わせ管理</h1>
                
                {error && <p className="text-red-500 mb-4">{error}</p>}

                <div className="space-y-4">
                    {inquiries.length > 0 ? (
                        inquiries.map(inquiry => (
                            <div key={inquiry.id} className={`p-4 rounded-lg border ${inquiry.isResolved ? 'bg-gray-50' : 'bg-white'}`}>
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="text-sm text-gray-500">{inquiry.createdAt}</p>
                                        <p className="font-bold text-gray-800">{inquiry.name} ({inquiry.email})</p>
                                        <p className="mt-2 text-gray-600 whitespace-pre-wrap">{inquiry.message}</p>
                                    </div>
                                    <button
                                        onClick={() => handleToggleResolved(inquiry.id, inquiry.isResolved)}
                                        className={`px-3 py-1 text-sm font-semibold rounded-full text-white transition-colors ${
                                            inquiry.isResolved 
                                            ? 'bg-gray-400 hover:bg-gray-500' 
                                            : 'bg-green-500 hover:bg-green-600'
                                        }`}
                                    >
                                        {inquiry.isResolved ? '未対応に戻す' : '対応済みにする'}
                                    </button>
                                </div>
                            </div>
                        ))
                    ) : (
                        <p className="text-gray-500">現在、新しいお問い合わせはありません。</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export const getServerSideProps: GetServerSideProps = async (context) => {
    try {
        const uid = await getUidFromCookie(context);
        if (!uid) {
            return { redirect: { destination: '/partner/login', permanent: false } };
        }

        const userDoc = await adminDb.collection('users').doc(uid).get();
        if (!userDoc.exists || !userDoc.data()?.roles?.includes('admin')) {
            return { redirect: { destination: '/partner/login?error=permission_denied', permanent: false } };
        }

        // Firestoreから問い合わせ一覧を取得
        const inquiriesSnapshot = await adminDb.collection('inquiries').orderBy('createdAt', 'desc').get();
        
        // ★★★ 修正箇所2: 'doc'に型を明示的に指定 ★★★
        const initialInquiries = inquiriesSnapshot.docs.map((doc: admin.firestore.QueryDocumentSnapshot) => {
            const data = doc.data();
            const createdAt = data.createdAt as Timestamp;
            return {
                id: doc.id,
                name: data.name || '（名前なし）',
                email: data.email || '（メアドなし）',
                message: data.message || '（本文なし）',
                createdAt: createdAt.toDate().toLocaleString('ja-JP'),
                isResolved: data.isResolved || false,
            };
        });

        return {
            props: {
                initialInquiries,
            },
        };
    } catch (error) {
        console.error('Error fetching inquiries:', error);
        return {
            props: {
                initialInquiries: [],
            },
        };
    }
};

export default InquiryListPage;


