import { NextPage } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import { RiArrowLeftLine, RiSendPlaneFill, RiCameraLine, RiLoader4Line } from 'react-icons/ri';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { getAuth, onAuthStateChanged, User } from 'firebase/auth';
import { db, storage } from '../../../lib/firebase'; // 仮のパス
import { v4 as uuidv4 } from 'uuid';

// --- 型定義 ---
interface Quest {
    id: string;
    title: string;
    rewardPoints: number;
    locationName: string;
}

interface ReportData {
    questId: string;
    userId: string;
    message: string;
    proofImageUrl: string | null;
    status: 'submitted' | 'approved' | 'rejected';
    submittedAt: any;
}

const QuestSubmitPage: NextPage = () => {
    const router = useRouter();
    const { questId } = router.query;
    const [user, setUser] = useState<User | null>(null);
    const [quest, setQuest] = useState<Quest | null>(null);
    const [message, setMessage] = useState('');
    const [proofFile, setProofFile] = useState<File | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [error, setError] = useState<string | null>(null);

    // 認証とクエスト情報の読み込み
    useEffect(() => {
        const auth = getAuth();
        const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
            if (currentUser) {
                setUser(currentUser);
                if (questId) fetchQuestDetails(questId as string);
            } else {
                router.push('/login');
            }
        });
        return () => unsubscribeAuth();
    }, [questId, router]);

    const fetchQuestDetails = async (id: string) => {
        try {
            // 仮のパスでクエスト情報を取得
            const mockQuest: Quest = {
                id: id,
                title: '那須のチーズ工房を探せ！',
                rewardPoints: 500,
                locationName: '那須のチーズ工房',
            };
            setQuest(mockQuest);
        } catch (e) {
            setError('クエスト情報の読み込みに失敗しました。');
        } finally {
            setIsLoading(false);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setProofFile(e.target.files[0]);
        } else {
            setProofFile(null);
        }
    };

    // 報告書提出処理
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !quest) return;

        setIsSubmitting(true);
        setError(null);
        let proofImageUrl: string | null = null;

        try {
            if (proofFile) {
                // 1. 画像をStorageにアップロード
                const fileName = `${uuidv4()}_${proofFile.name}`;
                const storageRef = ref(storage, `users/${user.uid}/quest_proofs/${quest.id}/${fileName}`);
                const uploadTask = uploadBytesResumable(storageRef, proofFile);

                proofImageUrl = await new Promise<string>((resolve, reject) => {
                    uploadTask.on('state_changed',
                        (snapshot) => setUploadProgress((snapshot.bytesTransferred / snapshot.totalBytes) * 100),
                        (error) => reject(error),
                        () => getDownloadURL(uploadTask.snapshot.ref).then(resolve)
                    );
                });
            }

            // 2. Firestoreに報告書を保存 (新しいドキュメントを作成)
            const reportData: ReportData = {
                questId: quest.id,
                userId: user.uid,
                message: message,
                proofImageUrl: proofImageUrl,
                status: 'submitted', // 審査待ち
                submittedAt: serverTimestamp(),
            };

            const docRef = doc(db, 'questReports', `${quest.id}_${user.uid}`);
            await setDoc(docRef, reportData);

            alert('クエスト完了報告を提出しました。審査結果をお待ちください！');
            router.push('/quests'); // クエスト一覧に戻る

        } catch (err: any) {
            console.error("提出エラー:", err);
            setError(err.message || '報告書の提出中にエラーが発生しました。');
        } finally {
            setIsSubmitting(false);
            setUploadProgress(0);
        }
    };

    if (isLoading || !quest) {
        return <div className="min-h-screen flex items-center justify-center">読み込み中...</div>;
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <Head>
                {/* 💡 修正箇所: {クエスト完了報告: {quest.title}} を修正 */}
                <title>{`クエスト完了報告: ${quest.title}`}</title>
            </Head>

            <div className="max-w-xl mx-auto p-4 pt-10">
                <button onClick={() => router.back()} className="flex items-center text-gray-600 hover:text-gray-900 mb-6">
                    <RiArrowLeftLine className="mr-2" /> クエスト詳細に戻る
                </button>
                
                <h1 className="text-3xl font-bold text-center mb-2">クエスト完了報告</h1>
                <p className="text-center text-gray-600 mb-8">{quest.title}</p>

                {error && <div className="p-3 mb-4 bg-red-100 text-red-700 rounded-md">{error}</div>}

                <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-xl space-y-6">
                    
                    {/* 報告メッセージ */}
                    <div>
                        <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
                            発見場所や感想など (任意)
                        </label>
                        <textarea
                            id="message"
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            rows={4}
                            className="mt-1 block w-full p-3 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                            placeholder="クエストの報告メッセージを入力してください。"
                        />
                    </div>
                    
                    {/* 証拠写真アップロード */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            証拠写真のアップロード (必須)
                        </label>
                        <div className="mt-1 flex items-center justify-center border-2 border-gray-300 border-dashed rounded-lg p-6">
                            <label htmlFor="proof-file" className="text-center cursor-pointer">
                                {proofFile ? (
                                    <>
                                        <RiCameraLine size={32} className="mx-auto text-green-500" />
                                        <p className="text-sm font-medium text-green-600 mt-1">{proofFile.name}</p>
                                        {uploadProgress > 0 && <p className="text-xs text-gray-500">{uploadProgress.toFixed(0)}% アップロード済み</p>}
                                    </>
                                ) : (
                                    <>
                                        <RiCameraLine size={32} className="mx-auto text-gray-400" />
                                        <p className="text-sm font-medium text-indigo-600 mt-1">写真を選択</p>
                                        <p className="text-xs text-gray-500">（JPEG, PNG, GIF, 10MBまで）</p>
                                    </>
                                )}
                                <input
                                    id="proof-file"
                                    type="file"
                                    accept="image/*"
                                    onChange={handleFileChange}
                                    className="sr-only"
                                    required
                                />
                            </label>
                        </div>
                    </div>

                    {/* 提出ボタン */}
                    <button
                        type="submit"
                        disabled={isSubmitting || !proofFile}
                        className="w-full bg-indigo-600 text-white font-bold py-3 rounded-lg text-lg hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center transition"
                    >
                        {isSubmitting ? (
                            <><RiLoader4Line className="animate-spin mr-2" /> 提出中...</>
                        ) : (
                            <><RiSendPlaneFill className="mr-2" /> 報告書を提出する</>
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default QuestSubmitPage;