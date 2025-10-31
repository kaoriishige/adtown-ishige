import { GetServerSideProps, NextPage } from 'next';
import Link from 'next/link';
import Head from 'next/head';
import { useRouter } from 'next/router'; 
import { adminDb } from '@/lib/firebase-admin'; // 🚨 プロジェクトのパスに合わせてください
import React, { useState, useMemo, useEffect } from 'react';
import { Briefcase, MapPin, JapaneseYen, ArrowRight, Search, Loader2 } from 'lucide-react';
import { FieldPath } from 'firebase-admin/firestore'; // 💡 修正 1: FieldPath をインポート

// --- 型定義 ---
interface JobSummary {
    id: string;
    jobTitle: string;
    companyName: string;
    location: string;
    salary: string;
    employmentType: string;
}

interface JobsPageProps {
    jobs: JobSummary[];
    error: string | null;
}

// ----------------------------------------------------------------------
// サーバーサイドデータ取得 
// ----------------------------------------------------------------------
export const getServerSideProps: GetServerSideProps = async () => {
    try {
        // 承認済み (verified) かつ公開中 (active) の求人のみを取得するのが一般的
        const jobsSnap = await adminDb.collection('recruitments')
            .where('verificationStatus', '==', 'verified')
            .where('status', '==', 'active')
            .orderBy('createdAt', 'desc')
            .get();

        const recruitmentMap = new Map<string, any>();
        const companyUids = new Set<string>();

        jobsSnap.docs.forEach(doc => {
            const data = doc.data();
            recruitmentMap.set(doc.id, data);
            companyUids.add(data.uid);
        });

        // 企業名を取得するためのリクセンターデータの一括取得
        const companyMap = new Map<string, string>();
        const companyUidArray = Array.from(companyUids);
        if (companyUidArray.length > 0) {
             for (let i = 0; i < companyUidArray.length; i += 10) {
                const chunkIds = companyUidArray.slice(i, i + 10);
                
                // 💡 修正 2: FieldPath.documentId() を使用
                const companySnap = await adminDb.collection('recruiters')
                    .where(FieldPath.documentId(), 'in', chunkIds) 
                    .get();
                    
                companySnap.docs.forEach(doc => {
                    companyMap.set(doc.id, doc.data().companyName || '企業名非公開');
                });
            }
        }

        const jobs: JobSummary[] = jobsSnap.docs.map(doc => {
            const data = doc.data();
            const companyName = companyMap.get(data.uid) || '企業名非公開';
            const salaryText = `${data.salaryType} ${data.salaryMin || '???'}${data.salaryType === '年収' ? '万円' : '円'}〜${data.salaryMax || '???'}${data.salaryType === '年収' ? '万円' : '円'}`;

            return {
                id: doc.id,
                jobTitle: data.jobTitle,
                companyName: companyName,
                location: data.location || '不明',
                salary: salaryText,
                employmentType: data.employmentType || '未設定',
            };
        });

        return { props: { jobs, error: null } };

    } catch (err: any) {
        console.error("Jobs List SSR Error:", err);
        return { props: { jobs: [], error: `データ取得中にエラーが発生しました: ${err.message}` } };
    }
};

// ----------------------------------------------------------------------
// ページコンポーネント (検索機能追加)
// ----------------------------------------------------------------------
const JobsPage: NextPage<JobsPageProps> = ({ jobs, error }) => {
    const router = useRouter();
    const initialQuery = router.query.q as string || '';
    const [searchTerm, setSearchTerm] = useState(initialQuery);

    // 💡 URLのクエリパラメータが変更されたら、検索フィールドを更新
    useEffect(() => {
        setSearchTerm(router.query.q as string || '');
    }, [router.query.q]);

    // 💡 クライアントサイドでのフィルタリングロジック
    const filteredJobs = useMemo(() => {
        if (!searchTerm) return jobs;

        const lowerCaseSearchTerm = searchTerm.toLowerCase();

        return jobs.filter(job =>
            job.jobTitle.toLowerCase().includes(lowerCaseSearchTerm) ||
            job.companyName.toLowerCase().includes(lowerCaseSearchTerm) ||
            job.location.toLowerCase().includes(lowerCaseSearchTerm)
        );
    }, [jobs, searchTerm]);
    
    // 💡 検索フォームの送信ハンドラー
    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        // 検索キーワードをクエリパラメータとしてURLに追加（ブラウザの履歴に残る）
        if (searchTerm) {
            router.push({
                pathname: router.pathname,
                query: { q: searchTerm },
            }, undefined, { shallow: true });
        } else {
            router.push({ pathname: router.pathname }, undefined, { shallow: true });
        }
    };
    

    if (error) {
        return <div className="p-10 text-red-600 bg-red-50">{error}</div>;
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <Head><title>全求人リスト｜AI求人マッチング</title></Head>
            
            <header className="bg-white shadow-md">
                <div className="max-w-6xl mx-auto px-6 py-6">
                    <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                        <Search className="mr-3" size={30} /> 全求人リスト ({jobs.length}件)
                    </h1>
                    <button 
                        onClick={() => router.push('/users/dashboard')}
                        className="mt-2 text-sm text-indigo-600 hover:underline"
                    >
                        ← ダッシュボードに戻る
                    </button>
                </div>
            </header>

            <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
                {/* 💡 検索フォームの追加 */}
                <form onSubmit={handleSearchSubmit} className="flex space-x-3">
                    <input
                        type="text"
                        placeholder="キーワード (職種、企業名、勤務地) で検索..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="flex-grow p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                    />
                    <button
                        type="submit"
                        className="p-3 bg-indigo-600 text-white rounded-lg shadow-md hover:bg-indigo-700 flex items-center"
                    >
                        <Search size={20} className="mr-2" /> 検索
                    </button>
                    {/* リセットボタン */}
                    {initialQuery && (
                         <button
                            type="button"
                            onClick={() => {
                                setSearchTerm('');
                                router.push({ pathname: router.pathname }, undefined, { shallow: true });
                            }}
                            className="p-3 bg-gray-300 text-gray-700 rounded-lg shadow-md hover:bg-gray-400 flex items-center"
                        >
                            リセット
                        </button>
                    )}
                </form>
                
                {/* 検索結果のサマリー */}
                <p className="text-sm text-gray-600 font-semibold">{filteredJobs.length} 件の結果が見つかりました。</p>


                {filteredJobs.length === 0 && jobs.length > 0 ? (
                    <div className="p-10 text-center bg-white rounded-xl shadow-lg">
                        <p className="text-lg text-gray-600">お探しのキーワードに一致する求人は見つかりませんでした。</p>
                    </div>
                ) : (
                    filteredJobs.map((job) => (
                        <div 
                            key={job.id} 
                            className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 hover:shadow-xl transition-all"
                        >
                            <Link href={`/users/job/${job.id}`} legacyBehavior>
                                <a className="block">
                                    <h2 className="text-xl font-bold text-indigo-700 hover:text-indigo-800 transition-colors">
                                        {job.jobTitle}
                                    </h2>
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
                                        詳細を見る <ArrowRight size={18} className="ml-1" />
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

export default JobsPage;