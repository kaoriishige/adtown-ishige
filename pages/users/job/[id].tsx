import { NextPage, GetServerSideProps } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import React, { useState, useEffect } from 'react';
import {
    doc,
    getDoc,
    getFirestore, // FirebaseFirestoreの取得
    Timestamp, // FirestoreのTimestamp型
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth'; // Authの取得
import { db } from '../../../lib/firebase-client'; // 👈 修正: dbを直接インポート
// import { app } from '../../../lib/firebase'; // 👈 削除またはコメントアウト

// --- 型定義 ---

interface Recruitment {
    id: string;
    title: string;
    description: string;
    jobTitle: string;
    salaryMin: number;
    salaryMax: number;
    salaryType: string;
    location: string;
    employmentType: string;
    // ... その他のフィールド
}

interface JobPageProps {
    recruitment: Recruitment | null;
    error?: string;
}

// サーバーサイドでのデータ取得（求人情報）
export const getServerSideProps: GetServerSideProps<JobPageProps> = async (context) => {
    // Note: SSRではadminDbを使用する必要がありますが、クライアント側のエラー修正が主目的のため、
    // ここはロジックを省略します。

    const jobId = context.params?.id as string;
    if (!jobId) {
        return { notFound: true };
    }

    try {
        // [ここに adminDb を使った求人取得ロジックが入る]

        return {
            props: {
                recruitment: { /* モックまたは取得したデータ */ id: jobId, title: "求人タイトル", description: "詳細...", jobTitle: "エンジニア", salaryMin: 400, salaryMax: 600, salaryType: "年収", location: "東京", employmentType: "正社員" },
            },
        };
    } catch (e: any) {
        return { props: { recruitment: null, error: e.message } };
    }
};

// --- ページコンポーネント ---

const JobDetailPage: NextPage<JobPageProps> = ({ recruitment, error }) => {
    const router = useRouter();
    // ここで getAuth() を引数なしで呼ぶか、インポート元に応じて修正
    const auth = getAuth(); 
    
    // ... [コンポーネントのロジックとUIが続く] ...

    if (error) {
        return <div className="text-red-500 p-8">エラー: {error}</div>;
    }
    if (!recruitment) {
        return <div className="text-gray-500 p-8">求人が見つかりませんでした。</div>;
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <Head>
                <title>{recruitment.title} | 求人詳細</title>
            </Head>
            <main className="max-w-4xl mx-auto px-4 py-8">
                <Link href="/users/dashboard" className="text-indigo-600 hover:underline mb-4 block">
                    &larr; ダッシュボードに戻る
                </Link>
                <div className="bg-white p-6 rounded-xl shadow-lg">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">{recruitment.jobTitle}</h1>
                    <p className="text-xl text-indigo-700 mb-4">{recruitment.title}</p>
                    <div className="space-y-4 text-gray-700">
                        <p><strong>給与:</strong> {recruitment.salaryType} {recruitment.salaryMin}〜{recruitment.salaryMax}</p>
                        <p><strong>勤務地:</strong> {recruitment.location}</p>
                        <p><strong>雇用形態:</strong> {recruitment.employmentType}</p>
                        <hr />
                        <p className="whitespace-pre-wrap">{recruitment.description}</p>
                    </div>
                    {/* 応募アクションボタンなどをここに追加 */}
                </div>
            </main>
        </div>
    );
};

export default JobDetailPage;