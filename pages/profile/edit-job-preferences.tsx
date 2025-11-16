/* global adminAuth, adminDb */
import { NextPage, GetServerSideProps } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import nookies from 'nookies';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { RiArrowLeftLine, RiUserLine, RiPencilLine } from 'react-icons/ri';
import { AlertTriangle, Loader2 } from 'lucide-react';

interface EditJobPreferencesProps {
    uid: string;
    error?: string;
    // userProfileData: any; // 実際のデータはここで渡す
}

// ダミーデータ（本来はFirestoreから読み込む）
const DUMMY_PREFERENCES = {
    desiredJobTypes: ['IT・エンジニア', 'リモートワーク職'],
    desiredAnnualSalary: 450,
    topPriorities: ['キャリア面談制度あり', 'フルリモート勤務可', '残業少なめ（月20時間以内）'],
    isComplete: false,
};


const EditJobPreferences: NextPage<EditJobPreferencesProps> = ({ uid, error }) => {
    
    // 状態管理（フォーム、ローディングなど）
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [preferences, setPreferences] = useState(DUMMY_PREFERENCES);
    
    // 実際のアプリケーションでは、ここで useEffect を使い、uid に基づいて
    // Firestoreからユーザーの希望プロファイルを読み込みます。

    useEffect(() => {
        // [TODO]: Firebaseからユーザーの希望プロファイルを読み込むロジックを実装
        // ... getDoc(db, 'userJobPreferences', uid) ...
        setTimeout(() => {
            setLoading(false);
            // 読み込んだデータで setPreferences() を呼び出す
        }, 1000); 
    }, [uid]);

    const handleSave = () => {
        setIsSaving(true);
        // [TODO]: Firestoreにデータを保存するロジックを実装
        console.log("Saving preferences:", preferences);

        setTimeout(() => {
            alert('希望プロファイルを保存しました！');
            setIsSaving(false);
        }, 1500);
    };

    if (error) {
        return <div className="flex justify-center items-center h-screen bg-gray-50 text-red-600">エラー: {error}</div>;
    }

    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen text-indigo-600">
                <Loader2 className="animate-spin mr-3" />
                希望条件を読み込み中...
            </div>
        );
    }
    
    const isProfileComplete = preferences.desiredJobTypes.length > 0 && preferences.topPriorities.length > 0;
    
    return (
        <div className="min-h-screen bg-gray-50 font-sans">
            <Head>
                <title>希望プロフィール編集 - AIマッチング</title>
            </Head>

            <header className="bg-white shadow-sm sticky top-0 z-10">
                <div className="max-w-md mx-auto px-4 py-4 flex justify-between items-center">
                    <Link href="/jobsmatch" className="flex items-center text-sm text-gray-600 hover:text-gray-900 font-semibold">
                        <RiArrowLeftLine className="w-4 h-4 mr-2" />
                        マッチング画面に戻る
                    </Link>
                </div>
            </header>

            <main className="max-w-md mx-auto p-4 space-y-6">
                
                <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center mb-1">
                        <RiUserLine className="mr-3 text-indigo-600" />
                        希望プロフィールの設定
                    </h1>
                    <p className="text-sm text-gray-600">
                        AIがあなたに合う求人を見つけるために、正確な情報を入力してください。
                    </p>
                    
                    {/* 完了ステータス表示 */}
                    <div className={`mt-4 p-3 rounded-lg flex items-center ${isProfileComplete ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                        {isProfileComplete ? (
                            <>✅ プロフィールはほぼ完了しています。</>
                        ) : (
                            <>⚠️ 主要項目が未設定です。マッチング精度が低下します。</>
                        )}
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-lg space-y-6">
                    <h2 className="text-xl font-bold border-b pb-2 mb-4">
                        1. 職種・給与の希望
                    </h2>
                    
                    {/* 職種希望（ダミーのテキストエリア） */}
                    <div>
                        <label htmlFor="jobTypes" className="block text-sm font-medium text-gray-700">希望職種 (複数記入可)</label>
                        <textarea
                            id="jobTypes"
                            value={preferences.desiredJobTypes.join(', ')}
                            onChange={(e) => setPreferences({...preferences, desiredJobTypes: e.target.value.split(',').map(s => s.trim()).filter(s => s)})}
                            rows={2}
                            className="mt-1 block w-full input"
                            placeholder="例: ITエンジニア, Webマーケター, 旅館のサービス職"
                        />
                    </div>
                    
                    {/* 給与希望（ダミー） */}
                    <div>
                        <label htmlFor="salary" className="block text-sm font-medium text-gray-700">希望年収 (万円)</label>
                        <input
                            id="salary"
                            type="number"
                            value={preferences.desiredAnnualSalary}
                            onChange={(e) => setPreferences({...preferences, desiredAnnualSalary: Number(e.target.value)})}
                            placeholder="例: 450"
                            className="mt-1 block w-full input"
                        />
                    </div>
                </div>
                
                <div className="bg-white p-6 rounded-xl shadow-lg space-y-6">
                    <h2 className="text-xl font-bold border-b pb-2 mb-4">
                        2. 価値観・働き方の優先順位
                    </h2>
                    
                    {/* 優先事項のチェックリスト（ダミー） */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            あなたの仕事選びの「最優先事項」 (複数選択)
                        </label>
                        <div className="space-y-2">
                            {['フルリモート勤務可', '残業少なめ（月20時間以内）', '社員の挑戦を応援する文化', '評価・昇進が明確', '資格取得支援制度あり'].map(item => (
                                <div key={item} className="flex items-center">
                                    <input
                                        type="checkbox"
                                        checked={preferences.topPriorities.includes(item)}
                                        onChange={(e) => {
                                            const newPriorities = e.target.checked
                                                ? [...preferences.topPriorities, item]
                                                : preferences.topPriorities.filter(p => p !== item);
                                            setPreferences({...preferences, topPriorities: newPriorities});
                                        }}
                                        className="h-4 w-4 checkbox"
                                    />
                                    <span className="ml-3 text-sm text-gray-700">{item}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="w-full flex justify-center py-3 px-4 rounded-lg shadow-md text-lg font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                >
                    {isSaving ? <Loader2 className="animate-spin mr-2" /> : <RiPencilLine className="mr-2" />}
                    {isSaving ? '保存中...' : 'プロフィールを更新する'}
                </button>

            </main>
            <style jsx>{`.input { @apply block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500; } .checkbox { @apply h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500; }`}</style>
        </div>
    );
};

// --- サーバーサイドでの認証チェック (ユーザー情報取得) ---
export const getServerSideProps: GetServerSideProps = async (context) => {
    try {
        const cookies = nookies.get(context);
        const sessionCookie = cookies.session || '';

        const token = await adminAuth.verifySessionCookie(sessionCookie, true);
        const uid = token.uid;

        if (!uid) {
            return { redirect: { destination: '/users/login', permanent: false } };
        }
        
        // [TODO]: Firestoreから既存の希望条件を読み込むロジックを追加
        
        return {
            props: {
                uid: uid,
            },
        };
    } catch (err) {
        console.error('EditJobPreferences SSR error:', err);
        return { redirect: { destination: '/users/login', permanent: false } };
    }
};

export default EditJobPreferences;