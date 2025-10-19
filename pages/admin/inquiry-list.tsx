import { GetServerSideProps, NextPage } from 'next';
import Head from 'next/head';
import React, { useState } from 'react';
import { adminDb, adminAuth } from '@/lib/firebase-admin'; // ★修正: adminAuthを直接インポート
import { Timestamp } from 'firebase-admin/firestore';
import nookies from 'nookies';

// --- 型定義 ---
interface Inquiry {
    id: string;
    name: string;
    email: string;
    message: string;
    createdAt: string; // 日付を文字列として扱う
    isReplied: boolean;
}

interface InquiryListPageProps {
    inquiries: Inquiry[];
}

// --- サーバーサイド処理 ---
export const getServerSideProps: GetServerSideProps = async (context) => {
    try {
        // ★修正: getUidFromCookieを使わず、ここで直接認証を行う
        const cookies = nookies.get(context);
        const token = await adminAuth.verifySessionCookie(cookies.session || '', true);
        
        // ここでtoken.uidを使って管理者かどうかのチェックを追加することも可能
        // if(token.uid !== '管理者UID') { return { redirect: ... } }

        const inquirySnap = await adminDb.collection('inquiries').orderBy('createdAt', 'desc').get();
        const inquiries = inquirySnap.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                name: data.name,
                email: data.email,
                message: data.message,
                createdAt: (data.createdAt as Timestamp).toDate().toLocaleString('ja-JP'),
                isReplied: data.isReplied || false,
            };
        });

        return {
            props: {
                inquiries,
            },
        };

    } catch (error) {
        // 認証失敗時はログインページなどにリダイレクト
        return {
            redirect: {
                destination: '/admin/login', // 管理者用ログインページを想定
                permanent: false,
            },
        };
    }
};


// --- ページコンポーネント本体 ---
const InquiryListPage: NextPage<InquiryListPageProps> = ({ inquiries }) => {
    
    // このページの状態管理や関数はここに追加します
    // 例: const [filter, setFilter] = useState('all');

    return (
        <div>
            <Head>
                <title>{"お問い合わせ一覧"}</title>
            </Head>
            <main>
                <h1>お問い合わせ一覧</h1>
                <table>
                    <thead>
                        <tr>
                            <th>日時</th>
                            <th>名前</th>
                            <th>Email</th>
                            <th>内容</th>
                            <th>状態</th>
                        </tr>
                    </thead>
                    <tbody>
                        {inquiries.map((inquiry) => (
                            <tr key={inquiry.id}>
                                <td>{inquiry.createdAt}</td>
                                <td>{inquiry.name}</td>
                                <td>{inquiry.email}</td>
                                <td>{inquiry.message}</td>
                                <td>{inquiry.isReplied ? '返信済み' : '未返信'}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </main>
        </div>
    );
};

export default InquiryListPage;


