import { NextPage, GetServerSideProps } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import React, { useState, useEffect } from 'react';
import { RiLightbulbFlashLine, RiArrowLeftLine, RiLoader4Line, RiErrorWarningLine, RiSendPlaneLine } from 'react-icons/ri';
import nookies from 'nookies';
import { adminAuth, adminDb } from '@/lib/firebase-admin';

// --- 型定義 ---
interface Recruitment {
    id: string;
    title: string;
    description: string;
    // ... その他、AI分析に必要な求人詳細データ
}

interface AdviceData {
    summary: string;
    suggestions: string[];
    riskScore: number; // 1-100
}

interface AdvicePageProps {
    isPaid: boolean;
    companyName: string;
    recruitments: Recruitment[];
    error?: string;
}

// --- サーバーサイド認証とデータ取得 ---
export const getServerSideProps: GetServerSideProps = async (context) => {
    try {
        const cookies = nookies.get(context);
        // 認証セッションクッキーの検証
        const token = await adminAuth.verifySessionCookie(cookies.session || '', true);
        const { uid } = token;

        const userSnap = await adminDb.collection('users').doc(uid).get();
        const userData = userSnap.data();

        // 🚨 修正: isPaid の確認をより厳密に
        const isPaid = userData?.isPaid === true;

        if (!isPaid) {
            // ★ 有料プラン未加入の場合はリダイレクト
            return { redirect: { destination: '/recruit/subscribe_plan', permanent: false } };
        }

        // --- 求人情報の取得（AI分析対象） ---
        const recruitmentsSnap = await adminDb
            .collection('recruitments')
            .where('uid', '==', uid)
            .where('verificationStatus', '==', 'verified') // 承認済みの求人のみ対象
            .get();

        const recruitments: Recruitment[] = recruitmentsSnap.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                title: data.jobTitle || 'タイトル未設定',
                description: data.jobDescription || '説明未設定',
            };
        });

        return {
            props: {
                isPaid,
                companyName: userData?.companyName || '企業様',
                recruitments,
            }
        };

    } catch (error) {
        console.error("Error in getServerSideProps (advice):", error);
        // 認証エラーやその他のエラーの場合も購読ページに誘導
        return { redirect: { destination: '/recruit/subscribe_plan', permanent: false } };
    }
};

// --- AIアドバイス API呼び出し (クライアントサイド) ---
const fetchAdvice = async (recruitment: Recruitment): Promise<AdviceData> => {
    // 実際にサーバーレス関数を呼び出してGemini APIを実行
    const response = await fetch('/api/recruit/ai-advice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            recruitmentId: recruitment.id,
            jobTitle: recruitment.title,
            jobDescription: recruitment.description 
        }),
    });

    if (!response.ok) {
        throw new Error("AIアドバイスの取得に失敗しました。");
    }

    const data = await response.json();
    return data as AdviceData; // AdviceData 形式のJSONが返されることを期待
};

// --- ページコンポーネント (これが default export されるべき React Component) ---
const AdvicePage: NextPage<AdvicePageProps> = ({ isPaid, companyName, recruitments, error }) => {
    const router = useRouter();
    const [selectedRecruitment, setSelectedRecruitment] = useState<Recruitment | null>(null);
    const [advice, setAdvice] = useState<AdviceData | null>(null);
    const [loading, setLoading] = useState(false);
    const [requestError, setRequestError] = useState<string | null>(error || null);

    // サーバーサイドで有料チェック済みのため、isPaidは常にtrueの前提。念のためのリダイレクトガード。
    useEffect(() => {
        if (!isPaid) {
            router.replace('/recruit/subscribe_plan');
        }
    }, [isPaid, router]);

    const handleAnalyze = async () => {
        if (!selectedRecruitment) {
            setRequestError('分析対象の求人を選択してください。');
            return;
        }

        setLoading(true);
        setAdvice(null);
        setRequestError(null);

        try {
            const result = await fetchAdvice(selectedRecruitment);
            setAdvice(result);
        } catch (e: any) {
            setRequestError(e.message || 'AIとの通信中にエラーが発生しました。');
        } finally {
            setLoading(false);
        }
    };
    
    // UIをシンプルにするため、一度に分析できるのは一つの求人だけとする

    if (error) {
        return (
             <div className="flex justify-center items-center h-screen bg-gray-50 p-4">
                <div className="text-center p-8 bg-white rounded-lg shadow-xl max-w-md">
                    <RiErrorWarningLine size={48} className="text-red-500 mx-auto mb-4" />
                    <h1 className="text-xl font-bold text-gray-900 mb-2">初期データ取得エラー</h1>
                    <p className="text-gray-600">{error}</p>
                    <Link href="/recruit/dashboard" className="mt-4 inline-flex items-center text-indigo-600 hover:underline">
                        <RiArrowLeftLine className="mr-1" /> ダッシュボードに戻る
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 font-sans">
            <Head><title>AI求人アドバイス ({companyName})</title></Head>
            <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
                <Link href="/recruit/dashboard" className="flex items-center text-sm text-gray-600 hover:text-gray-900 font-semibold mb-6">
                    <RiArrowLeftLine className="w-4 h-4 mr-2" /> ダッシュボードに戻る
                </Link>

                <div className="flex items-center space-x-4 border-b pb-4">
                    <RiLightbulbFlashLine size={36} className="text-indigo-600" />
                    <h1 className="text-3xl font-bold text-gray-900">AI求人アドバイス</h1>
                </div>

                <div className="p-6 bg-indigo-50 border border-indigo-200 rounded-xl shadow-lg">
                    <h2 className="text-xl font-bold text-indigo-800 mb-4">分析対象の求人を選択</h2>
                    
                    {recruitments.length === 0 ? (
                        <div className="text-center p-8 text-gray-600">
                            <RiErrorWarningLine className="w-8 h-8 mx-auto mb-2" />
                            <p>現在、審査承認済みの求人がありません。求人を作成・審査申請してください。</p>
                            <Link href="/recruit/jobs/create" className="mt-3 inline-block text-indigo-600 hover:underline font-semibold">
                                新しい求人を作成する
                            </Link>
                        </div>
                    ) : (
                        <div className="flex flex-col space-y-3">
                            <select
                                className="p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                                value={selectedRecruitment?.id || ''}
                                onChange={(e) => {
                                    const id = e.target.value;
                                    const rec = recruitments.find(r => r.id === id);
                                    setSelectedRecruitment(rec || null);
                                    setAdvice(null);
                                    setRequestError(null);
                                }}
                            >
                                <option value="" disabled>--- 分析したい求人を選択してください ---</option>
                                {recruitments.map(rec => (
                                    <option key={rec.id} value={rec.id}>{rec.title}</option>
                                ))}
                            </select>

                            <button
                                onClick={handleAnalyze}
                                disabled={!selectedRecruitment || loading}
                                className="px-6 py-3 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 flex items-center justify-center transition-colors shadow-md"
                            >
                                {loading ? (
                                    <><RiLoader4Line className="animate-spin mr-2" />AIが分析中...</>
                                ) : (
                                    <><RiSendPlaneLine className="mr-2" />AIに改善アドバイスを依頼する</>
                                )}
                            </button>
                        </div>
                    )}
                </div>

                {/* --- AIアドバイス表示エリア --- */}
                {requestError && (
                     <div className="p-4 bg-red-100 border-l-4 border-red-500 text-red-800 rounded-md">
                        <p className="font-bold flex items-center">
                            <RiErrorWarningLine className="mr-2" />
                            エラー: {requestError}
                        </p>
                    </div>
                )}
                
                {advice && (
                    <div className="space-y-6">
                        <h2 className="text-2xl font-bold text-gray-900 border-b pb-2 flex items-center">
                           AI分析結果（対象: {selectedRecruitment?.title}）
                        </h2>

                        <div className="bg-white p-6 rounded-xl shadow-md border">
                            <h3 className="text-xl font-bold text-green-700 mb-3 flex items-center">
                                <RiLightbulbFlashLine className="mr-2" /> 改善サマリー
                            </h3>
                            <p className="whitespace-pre-wrap text-gray-700">{advice.summary}</p>
                        </div>

                        <div className="bg-white p-6 rounded-xl shadow-md border">
                            <h3 className="text-xl font-bold text-red-700 mb-4 flex items-center">
                                <RiErrorWarningLine className="mr-2" /> 改善提案リスト (リスクスコア: {advice.riskScore}/100)
                            </h3>
                            <ul className="list-disc list-inside space-y-3 pl-4">
                                {advice.suggestions.map((suggestion, index) => (
                                    <li key={index} className="text-gray-700 text-sm">
                                        <span className="font-semibold">{suggestion.split(':')[0]}:</span>
                                        {suggestion.includes(':') ? suggestion.split(':')[1] : suggestion}
                                    </li>
                                ))}
                            </ul>
                            {advice.riskScore > 70 && (
                                <p className="mt-4 text-sm font-bold text-red-500">※ リスクスコアが高いです。提案内容を強く推奨します。</p>
                            )}
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default AdvicePage;
