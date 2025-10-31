import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import { app } from '../../../lib/firebase'; // 🚨 パスを確認
import Head from 'next/head';
import React from 'react';
import { Briefcase, MapPin, JapaneseYen, Loader2, ArrowLeft } from 'lucide-react'; 

// 求人データの型を定義
interface JobDetailData {
    id: string;
    jobTitle: string;
    jobCategory: string;
    location: string;
    salaryMax: number;
    salaryMin: number;
    salaryType: string;
    employmentType: string;
    jobDescription: string;
    uid: string; // 企業UID
}

export default function JobDetail() {
    const router = useRouter();
    const { id } = router.query; 
    const [job, setJob] = useState<JobDetailData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!id || Array.isArray(id)) {
            setLoading(false);
            return;
        }

        const loadJob = async () => {
            setLoading(true);
            try {
                const db = getFirestore(app);
                const snap = await getDoc(doc(db, 'recruitments', id as string));
                
                if (snap.exists()) {
                    const data = snap.data();
                    setJob({ 
                        id: snap.id, 
                        jobTitle: data.jobTitle || 'タイトル未設定',
                        jobCategory: data.jobCategory || '未設定',
                        location: data.location || '不明',
                        salaryMax: data.salaryMax || 0,
                        salaryMin: data.salaryMin || 0,
                        salaryType: data.salaryType || '年収',
                        employmentType: data.employmentType || '不明',
                        jobDescription: data.jobDescription || '仕事内容の記述がありません。',
                        uid: data.uid,
                    } as JobDetailData);
                } else {
                    setJob(null);
                }
            } catch (error) {
                console.error("Error loading job:", error);
                setJob(null);
            } finally {
                setLoading(false);
            }
        };
        loadJob();
    }, [id]);

    if (loading) {
        return <div className="p-10 text-center text-indigo-600 flex justify-center items-center"><Loader2 className="animate-spin mr-2" /> 求人情報を読み込み中...</div>;
    }

    // 🚨 修正箇所: データがない場合の表示を「エラー」から「情報がありません」に変更
    if (!job) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
                <div className="bg-white shadow-xl rounded-lg p-10 text-center max-w-sm">
                    <h1 className="text-2xl font-bold text-gray-900 mb-4">求人情報が見つかりません</h1>
                    <p className="text-gray-600 mb-6">
                        指定されたIDの求人情報が存在しないか、すでに非公開になっています。
                    </p>
                    <button 
                        onClick={() => router.push('/users/dashboard')} // 💡 ダッシュボードに戻るボタン
                        className="w-full px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 flex items-center justify-center"
                    >
                        <ArrowLeft size={16} className="mr-2" /> ダッシュボードに戻る
                    </button>
                </div>
            </div>
        );
    }
    
    const salaryUnit = job.salaryType === '年収' ? '万円' : '円';

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-4xl mx-auto p-6">
                <Head>
                    <title>{job.jobTitle}｜応募履歴詳細</title>
                </Head>
                
                <button 
                    onClick={() => router.back()}
                    className="text-indigo-600 hover:text-indigo-800 flex items-center mb-4"
                >
                    <ArrowLeft size={16} className="mr-1" /> 一覧に戻る
                </button>

                <div className="bg-white shadow-xl rounded-lg p-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-4 border-b pb-2">{job.jobTitle}</h1>
                    
                    {/* スペック情報 */}
                    <div className="space-y-3 text-lg text-gray-700 pt-4">
                        <p className="flex items-center">
                            <Briefcase size={20} className="mr-2 text-blue-500" />
                            <strong>職種:</strong> {job.jobCategory} ({job.employmentType})
                        </p>
                        <p className="flex items-center">
                            <MapPin size={20} className="mr-2 text-red-500" />
                            <strong>勤務地:</strong> {job.location}
                        </p>
                        <p className="flex items-center">
                            <JapaneseYen size={20} className="mr-2 text-green-600" />
                            <strong>給与:</strong> {job.salaryMin}{salaryUnit}〜{job.salaryMax}{salaryUnit} ({job.salaryType})
                        </p>
                    </div>
                    
                    <h2 className="text-xl font-semibold mt-6 mb-3 border-b pb-1">仕事内容</h2>
                    <p className="whitespace-pre-wrap text-gray-600">{job.jobDescription}</p>
                    
                    <div className='mt-8 p-4 bg-yellow-50 rounded-lg'>
                         <p className="text-sm font-bold text-yellow-700">💡 応募処理はダッシュボードで完了しています。</p>
                         <p className="text-xs text-gray-600">このページは求人情報の確認用です。</p>
                    </div>

                </div>
            </div>
        </div>
    );
}