import { GetServerSideProps, NextPage } from 'next';
import Link from 'next/link';
import Head from 'next/head';
import { useRouter } from 'next/router'; 
import { adminDb, adminAuth } from '@/lib/firebase-admin'; // 🚨 修正: adminAuth をインポートに追加
import React, { useState, useMemo, useEffect } from 'react';
import { Briefcase, MapPin, JapaneseYen, ArrowRight, Search, Loader2 } from 'lucide-react';
import { FieldPath } from 'firebase-admin/firestore'; 

// --- 定数 ---
const MIN_SCORE = 60; // 検索対象の最低AIスコア

// --- 型定義 ---
interface JobSummary {
    id: string;
    jobTitle: string;
    companyName: string;
    location: string;
    salary: string;
    employmentType: string;
    score: number; // 💡 スコアを追加
    matchId: string; // 💡 マッチIDを追加
}

interface JobsPageProps {
    jobs: JobSummary[];
    error: string | null;
}

// ----------------------------------------------------------------------
// サーバーサイドデータ取得: マッチングスコアでフィルタリング
// ----------------------------------------------------------------------
export const getServerSideProps: GetServerSideProps = async (context) => {
    try {
        // 🚨 修正 1: adminAuth がインポートされたため、ここで使用可能になる
        const sessionCookie = context.req.cookies.session;
        let currentUserUid: string | null = null;

        if (sessionCookie) {
             const token = await adminAuth.verifySessionCookie(sessionCookie, true);
             currentUserUid = token.uid;
        }

        if (!currentUserUid) {
             return { redirect: { destination: '/users/login', permanent: false } };
        }

        // 1. AIマッチング結果（60点以上）を取得
        const matchSnap = await adminDb.collection('matchResults')
            .where('userUid', '==', currentUserUid)
            .where('score', '>=', MIN_SCORE) // 💡 60点以上でフィルタリング
            .orderBy('score', 'desc')
            .get();

        const recruitmentIds = new Set<string>();
        const matchMap = new Map<string, { score: number, matchId: string }>();

        matchSnap.docs.forEach(doc => {
            const data = doc.data();
            if (data.jobId) {
                recruitmentIds.add(data.jobId);
                matchMap.set(data.jobId, { score: data.score, matchId: doc.id });
            }
        });
        
        const jobIdsArray = Array.from(recruitmentIds);
        
        // 2. 関連する求人情報と企業情報を結合して取得 (チャンク処理)
        const recruitmentMap = new Map();
        const companyUids = new Set<string>();
        
        if (jobIdsArray.length > 0) {
             for (let i = 0; i < jobIdsArray.length; i += 10) {
                const chunkIds = jobIdsArray.slice(i, i + 10);
                const jobQuery = adminDb.collection('recruitments').where(FieldPath.documentId(), 'in', chunkIds);
                const jobSnap = await jobQuery.get();
                jobSnap.docs.forEach(doc => {
                     const data = doc.data();
                     // 公開中かつ承認済みのみを対象とする
                     if (data.uid && data.verificationStatus === 'verified' && data.status === 'active') { 
                         recruitmentMap.set(doc.id, data);
                         companyUids.add(data.uid);
                     }
                });
            }
        }
        
        // 企業名を取得
        const companyMap = new Map<string, string>();
        const companyUidArray = Array.from(companyUids);
        if (companyUidArray.length > 0) {
             for (let i = 0; i < companyUidArray.length; i += 10) {
                const chunkIds = companyUidArray.slice(i, i + 10);
                const companySnap = adminDb.collection('recruiters').where(FieldPath.documentId(), 'in', chunkIds).get();
                // 💡 Promiseが返ってくるため await を使用
                const companySnapResolved = await companySnap;
                companySnapResolved.docs.forEach(doc => {
                    companyMap.set(doc.id, doc.data().companyName || '企業名非公開');
                });
            }
        }

        // 3. 最終リストの構築 (スコア順に再並び替え)
        const matchedJobs: JobSummary[] = [];
        jobIdsArray.forEach(jobId => {
            const jobData = recruitmentMap.get(jobId);
            const matchData = matchMap.get(jobId);

            if (jobData && matchData) {
                 const salaryText = `${jobData.salaryType} ${jobData.salaryMin || '???'}${jobData.salaryType === '年収' ? '万円' : '円'}〜${jobData.salaryMax || '???'}${jobData.salaryType === '年収' ? '万円' : '円'}`;
                 
                 matchedJobs.push({
                     id: jobId,
                     jobTitle: jobData.jobTitle,
                     companyName: companyMap.get(jobData.uid) || '企業名非公開',
                     location: jobData.location || '不明',
                     salary: salaryText,
                     employmentType: jobData.employmentType || '未設定',
                     score: matchData.score,
                     matchId: matchData.matchId,
                 });
            }
        });
        
        // スコアで最終ソート (スコアが同じ場合はそのまま)
        matchedJobs.sort((a, b) => b.score - a.score);


        return { props: { jobs: matchedJobs, error: null } };

    } catch (err: any) {
        console.error("AI Matched Jobs SSR Error:", err);
        // 認証エラーやデータ取得エラーの場合
        if (err.code === 'auth/argument-error' || err.message.includes('session cookie is expired')) {
             return { redirect: { destination: '/users/login', permanent: false } };
        }
        return { props: { jobs: [], error: `データ取得中にエラーが発生しました: ${err.message}。インデックスが不足している可能性があります。` } };
    }
};

// ----------------------------------------------------------------------
// ページコンポーネント (UI)
// ----------------------------------------------------------------------
const MatchedJobsPage: NextPage<JobsPageProps> = ({ jobs, error }) => {
    const router = useRouter();

    if (error) {
        return <div className="p-10 text-red-600 bg-red-50">{error}</div>;
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <Head><title>AI推薦求人リスト (60点以上)</title></Head>
            
            <header className="bg-white shadow-md">
                <div className="max-w-6xl mx-auto px-6 py-6">
                    <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                        <Search className="mr-3" size={30} /> **AI推薦求人リスト** ({jobs.length}件)
                    </h1>
                    <p className="text-sm text-gray-600 mt-1">
                        プロフィールと相性の良い**{MIN_SCORE}点以上**の求人のみを表示しています。
                    </p>
                    <button 
                        onClick={() => router.push('/users/dashboard')}
                        className="mt-2 text-sm text-indigo-600 hover:underline"
                    >
                        ← ダッシュボードに戻る
                    </button>
                </div>
            </header>

            <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
                
                {jobs.length === 0 ? (
                    <div className="p-10 text-center bg-white rounded-xl shadow-lg">
                        <p className="text-lg text-gray-600">現在、あなたに推薦できる{MIN_SCORE}点以上の求人は見つかっていません。</p>
                        <Link href="/users/profile" className="mt-4 inline-block text-indigo-600 hover:underline font-semibold">
                            プロフィールを更新して、マッチング精度を上げましょう →
                        </Link>
                    </div>
                ) : (
                    jobs.map((job) => (
                        <div 
                            key={job.id} 
                            className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 hover:shadow-xl transition-all"
                        >
                            <Link href={`/users/job/${job.id}`} legacyBehavior>
                                <a className="block">
                                    <div className="flex justify-between items-start">
                                        <h2 className="text-xl font-bold text-indigo-700 hover:text-indigo-800 transition-colors">
                                            {job.jobTitle}
                                        </h2>
                                        {/* スコア表示 */}
                                        <span className={`p-1 rounded-md text-white font-extrabold text-lg shadow-sm ${job.score >= 80 ? 'bg-green-500' : job.score >= 60 ? 'bg-yellow-500' : 'bg-gray-400'}`}>
                                            {job.score}点
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-500 mt-1">{job.companyName} | {job.employmentType}</p>

                                    <div className="mt-4 grid grid-cols-2 gap-3 text-sm text-gray-600">
                                        <div className="flex items-center">
                                            <MapPin size={16} className="mr-2 text-red-500" />
                                            {job.location}
                                        </div>
                                        <div className="flex items-center">
                                            <JapaneseYen size={16} className="mr-2 text-green-600" />
                                            {job.salary}
                                        </div>
                                        <div className="flex items-center">
                                            <Briefcase size={16} className="mr-2 text-blue-500" />
                                            {job.employmentType}
                                        </div>
                                    </div>
                                    
                                    <div className="mt-4 flex justify-end text-indigo-600 font-semibold items-center">
                                        詳細と応募へ進む <ArrowRight size={18} className="ml-1" />
                                    </div>
                                </a>
                            </Link>
                        </div>
                    ))
                )}
            </main>
        </div>
    );
};

export default MatchedJobsPage;