// pages/recruit/applicants.tsx
import { GetServerSideProps, NextPage } from 'next';
import Head from 'next/head';
import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { adminDb, getUidFromCookie } from '@/lib/firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';
import * as admin from 'firebase-admin';
import {
    RiArrowLeftLine, RiUserSearchLine, RiCheckFill, RiSendPlaneFill, RiDeleteBin6Line, RiQuestionLine,
    RiErrorWarningLine
} from 'react-icons/ri';

// ===============================
// 型定義
// ===============================
interface Applicant {
    id: string;
    jobId: string; // 応募した求人ID (アクションに使用)
    jobTitle: string;
    userId: string; // 応募者ID (アクションに使用)
    userName: string;
    userEmail: string;
    appliedAt: string;
}

interface ApplicantsProps {
    applicants: Applicant[];
}

// ===============================
// UIコンポーネント: アクションパネル (切り出したコンポーネント)
// ===============================

interface ActionPanelProps {
    applicant: Applicant;
    onAction: (action: string, applicant: Applicant) => void;
}

const ActionPanel: React.FC<ActionPanelProps> = ({ applicant, onAction }) => {
    // プロフィールを見る機能は、通常、応募者の詳細ページへ遷移させます。
    const handleProfileClick = () => {
        alert(`【プロフィールを見る】${applicant.userName}さんの詳細ページへ遷移します。（開発中）`);
        // router.push(`/recruit/applicants/${applicant.id}/profile`);
    };

    return (
        <div className="mt-4 p-5 border-2 border-indigo-100 bg-indigo-50 rounded-lg">
            <h3 className="text-md font-bold text-gray-800 mb-3">
                {applicant.userName} さんへのアクション
            </h3>
            <div className="flex flex-wrap gap-2">
                {/* 1. プロフィールを見る */}
                <button
                    onClick={handleProfileClick}
                    className="text-sm py-2 px-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition min-w-[120px] shadow-md"
                >
                    プロフィールを見る
                </button>
                {/* 2. 承諾 */}
                <button
                    onClick={() => onAction('承諾', applicant)}
                    className="text-sm py-2 px-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center justify-center gap-1 min-w-[120px] shadow-md"
                >
                    <RiCheckFill /> 承諾
                </button>
                {/* 3. スカウト */}
                <button
                    onClick={() => onAction('スカウト', applicant)}
                    className="text-sm py-2 px-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition flex items-center justify-center gap-1 min-w-[120px] shadow-md"
                >
                    <RiSendPlaneFill /> スカウト
                </button>
                {/* 4. 見送り */}
                <button
                    onClick={() => onAction('見送り', applicant)}
                    className="text-sm py-2 px-3 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition min-w-[120px] shadow-md"
                >
                    見送り
                </button>
                {/* 5. 興味なし */}
                <button
                    onClick={() => onAction('興味なし', applicant)}
                    className="text-sm py-2 px-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition flex items-center justify-center gap-1 min-w-[120px] shadow-md"
                >
                    <RiDeleteBin6Line /> 興味なし
                </button>
            </div>
            {/* 説明セクション (テーブルと異なり、ここでは説明は不要) */}
        </div>
    );
};


// ===============================
// メインページコンポーネント
// ===============================
const ApplicantsPage: NextPage<ApplicantsProps> = ({ applicants }) => {
    const router = useRouter();
    const [expandedApplicantId, setExpandedApplicantId] = useState<string | null>(null);

    const handleApplicantAction = (action: string, applicant: Applicant) => {
        alert(`${applicant.userName}さんに対して「${action}」アクションを実行しました。`);
        
        // 承諾/スカウト時にマッチング相手と接続するAPIを呼び出す（例: チャットルーム作成）
        if (action === '承諾' || action === 'スカウト') {
            console.log(`Matching connection initiated for userId: ${applicant.userId}, jobId: ${applicant.jobId}`);
            // 実際はAPIコール後、router.push(`/chat/${matchId}`); などを行う
        }
        
        // アクション後はパネルを閉じる
        setExpandedApplicantId(null); 
    };

    return (
        <div className="min-h-screen bg-gray-50 p-8 font-sans">
            <Head>
                <title>応募者管理 | AI求人パートナー</title>
            </Head>

            <div className="max-w-6xl mx-auto space-y-8">
                {/* ヘッダー */}
                <header className="flex justify-between items-center mb-6 border-b pb-4">
                    <div>
                        <button
                            onClick={() => router.push('/recruit/dashboard')}
                            className="text-sm text-indigo-600 hover:text-indigo-800 font-semibold flex items-center mb-2 transition"
                        >
                            <RiArrowLeftLine className="w-4 h-4 mr-2" />
                            ダッシュボードに戻る
                        </button>
                        <h1 className="text-3xl font-extrabold text-gray-800">応募者管理</h1>
                        <p className="text-gray-500 text-sm mt-1">貴社の求人に応募してきた候補者リストです。</p>
                    </div>
                </header>

                {/* 1. AIマッチングの使い方の説明パネル */}
                <div className="bg-white p-6 rounded-xl shadow border border-gray-100">
                    <h2 className="text-xl font-bold text-gray-800 flex items-center mb-4">
                        <RiQuestionLine className="mr-2 text-purple-500" />
                        求人マッチングAIの使い方
                    </h2>
                    
                    {/* 使い方の説明（ボタンは押せないようにする） */}
                    <div className="p-4 border rounded-lg bg-gray-50 pointer-events-none opacity-80">
                        {/* 氏名とボタンのデモ */}
                        <h3 className="font-semibold text-lg text-gray-800 mb-3">佐藤 太郎 (29歳) さんのアクション例</h3>
                        <div className="flex flex-wrap gap-2">
                            <button className="text-sm py-2 px-3 bg-blue-600 text-white rounded-lg min-w-[120px] shadow-md">プロフィールを見る</button>
                            <button className="text-sm py-2 px-3 bg-green-600 text-white rounded-lg flex items-center justify-center gap-1 min-w-[120px] shadow-md"><RiCheckFill /> 承諾</button>
                            <button className="text-sm py-2 px-3 bg-purple-600 text-white rounded-lg flex items-center justify-center gap-1 min-w-[120px] shadow-md"><RiSendPlaneFill /> スカウト</button>
                            <button className="text-sm py-2 px-3 bg-yellow-600 text-white rounded-lg min-w-[120px] shadow-md">見送り</button>
                            <button className="text-sm py-2 px-3 bg-gray-500 text-white rounded-lg flex items-center justify-center gap-1 min-w-[120px] shadow-md"><RiDeleteBin6Line /> 興味なし</button>
                        </div>
                        <div className="mt-4 pt-4 border-t border-gray-200">
                            <p className="text-xs text-gray-700">
                                🔍 **AIスコア**は「プロフィールを見る」ボタンから確認できます。
                                <br />
                                💡 **承諾**＝候補として保持、**スカウト**＝個別メッセージ送信、**見送り**＝AIが先方に丁寧な文章で回答する、**興味なし**＝求職者の一覧から除外されます。
                            </p>
                        </div>
                    </div>
                </div>


                {/* 2. 応募者一覧テーブル */}
                <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
                    <h2 className="text-xl font-bold text-gray-800 mb-6">応募者リスト ({applicants.length}件)</h2>
                    
                    {applicants.length === 0 ? (
                        <p className="text-center text-gray-500 mt-6">現在、応募者はいません。</p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            応募者名
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            応募求人
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            連絡先
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            応募日時
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {applicants.map((applicant) => (
                                        <tr 
                                            key={applicant.id} 
                                            className={`cursor-pointer hover:bg-indigo-50 transition-colors ${expandedApplicantId === applicant.id ? 'bg-indigo-100 border-indigo-500' : ''}`}
                                            onClick={() => setExpandedApplicantId(expandedApplicantId === applicant.id ? null : applicant.id)}
                                        >
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                <RiUserSearchLine className='inline mr-2 text-indigo-500' /> {applicant.userName}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {applicant.jobTitle}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {applicant.userEmail}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {applicant.appliedAt}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                    
                    {/* 3. クリックされた応募者に対するアクションパネル */}
                    {expandedApplicantId && (
                        <div className="mt-6">
                            {applicants.find(a => a.id === expandedApplicantId) && (
                                <ActionPanel 
                                    applicant={applicants.find(a => a.id === expandedApplicantId)!} 
                                    onAction={handleApplicantAction}
                                />
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// ===============================
// サーバーサイド処理
// ===============================
export const getServerSideProps: GetServerSideProps = async (context) => {
    try {
        const uid = await getUidFromCookie(context);
        if (!uid) {
            return { redirect: { destination: '/partner/login', permanent: false } };
        }

        // 応募情報を取得 (自分の求人に対する応募のみ)
        const applicantsSnapshot = await adminDb
            .collection('jobApplicants')
            .where('partnerId', '==', uid)
            .get();
        
        // 応用: Firestoreインデックスエラーを避けるため、ソートはクライアント側で処理
        const applicantsDocs = applicantsSnapshot.docs
            .map(doc => ({ id: doc.id, data: doc.data() }))
            .sort((a, b) => {
                // appliedAtフィールドがTimestampであることを前提
                const timeA = (a.data.appliedAt as Timestamp)?.toDate().getTime() || 0;
                const timeB = (b.data.appliedAt as Timestamp)?.toDate().getTime() || 0;
                return timeB - timeA; // 降順ソート
            });

        if (applicantsDocs.length === 0) {
            return { props: { applicants: [] } };
        }

        // 応募データから jobId / userId 抽出
        const jobIds = Array.from(
            new Set(
                applicantsDocs.map(
                    (doc) => doc.data.jobId
                )
            )
        );
        const userIds = Array.from(
            new Set(
                applicantsDocs.map(
                    (doc) => doc.data.userId
                )
            )
        );

        // 求人情報を一括取得
        const jobsPromise = jobIds.map((id) =>
            adminDb.collection('jobs').doc(id).get()
        );
        const jobsDocs = await Promise.all(jobsPromise);
        const jobsData: { [key: string]: string } = {};
        jobsDocs.forEach((doc) => {
            if (doc.exists) {
                jobsData[doc.id] = doc.data()?.jobTitle || '無題の求人';
            }
        });

        // 応募者（ユーザー）情報を一括取得
        const usersPromise = userIds.map((id) =>
            adminDb.collection('users').doc(id).get()
        );
        const usersDocs = await Promise.all(usersPromise);
        const usersData: { [key: string]: { name: string; email: string } } = {};
        usersDocs.forEach((doc) => {
            if (doc.exists) {
                const data = doc.data();
                usersData[doc.id] = {
                    name: data?.displayName || '名前未設定',
                    email: data?.email || 'メール未設定',
                };
            }
        });

        // 応募データをまとめて返す
        const applicants = applicantsDocs.map(
            (doc) => {
                const data = doc.data;
                const userId = data.userId;

                return {
                    id: doc.id,
                    jobId: data.jobId,
                    userId: userId,
                    jobTitle: jobsData[data.jobId] || '不明な求人',
                    userName: usersData[userId]?.name || '不明な応募者',
                    userEmail: usersData[userId]?.email || '不明',
                    appliedAt: (data.appliedAt as Timestamp).toDate().toLocaleString('ja-JP'),
                };
            }
        );

        return { props: { applicants } };
    } catch (error) {
        console.error('Error fetching applicants:', error);
        // Firestoreインデックスエラーを避けるため、空の配列を返す
        return { props: { applicants: [] } };
    }
};

export default ApplicantsPage;
