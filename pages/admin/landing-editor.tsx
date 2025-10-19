import { NextPage } from 'next';
import Head from 'next/head';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { RiSaveLine, RiRefreshLine, RiEyeLine, RiArrowLeftLine } from 'react-icons/ri';

// --- 型定義 ---
interface LandingPageData {
    title: string;
    description: string;
    status: 'published' | 'draft';
    contentHtml: string;
    version: number;
    // ... その他データ ...
}

interface LandingEditorProps {
    initialData: LandingPageData;
}

const LandingEditorPage: NextPage<LandingEditorProps> = ({ initialData }) => {
    const router = useRouter();
    const [formData, setFormData] = useState<LandingPageData>(initialData);
    const [saving, setSaving] = useState(false);

    // 💡 修正点: data を formData に置き換え、初期データがない場合はローディング表示
    if (!formData) {
        return <div className="p-8 text-center">データを読み込んでいます...</div>;
    }

    // 💡 修正点: エラーが出ていた部分の関数を定義 (ダミー)
    const handleSave = async () => {
        setSaving(true);
        // 実際はAPIコールでデータを保存
        console.log("Saving data:", formData);
        await new Promise(resolve => setTimeout(resolve, 1000));
        setSaving(false);
    };

    const handlePreview = () => {
        // 実際はプレビューURLに遷移
        window.open('/preview/landing', '_blank');
    };

    // 💡 修正点: エラーの原因となっていた JSX 部分
    return (
        <div className="min-h-screen bg-gray-100">
            <Head>
                <title>ランディングページ編集 - 管理</title>
            </Head>

            {/* --- ヘッダー --- */}
            <header className="bg-white shadow-sm sticky top-0 z-10">
                <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
                    <button onClick={() => router.push('/admin/dashboard')} className="flex items-center text-sm text-gray-600 hover:text-gray-900 font-semibold">
                        <RiArrowLeftLine className="mr-2" /> ダッシュボードに戻る
                    </button>
                    <h1 className="text-2xl font-bold text-gray-800">ランディングページ編集</h1>
                    
                    {/* 💡 修正点: style={...} を style={{...}} に修正 */}
                    <div style={{ display: 'flex', gap: '10px' }}> 
                        <button 
                            onClick={handlePreview} 
                            className="px-4 py-2 bg-blue-500 text-white rounded-md flex items-center hover:bg-blue-600"
                        >
                            <RiEyeLine className="mr-2" /> プレビュー
                        </button>
                        <button 
                            onClick={handleSave} 
                            disabled={saving}
                            className="px-4 py-2 bg-green-500 text-white rounded-md flex items-center hover:bg-green-600 disabled:bg-gray-400"
                            // 💡 41行目付近のエラー修正：minWidth などの CSS プロパティも波括弧内で使用
                            style={{ minWidth: '100px' }} 
                        >
                            <RiSaveLine className="mr-2" /> {saving ? '保存中...' : '保存'}
                        </button>
                    </div>
                </div>
            </header>

            {/* --- メインコンテンツ --- */}
            <main className="max-w-screen-xl mx-auto p-4 sm:p-6 lg:p-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* 編集エリア (左2/3) */}
                <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow-md space-y-6">
                    <h2 className="text-xl font-bold border-b pb-2">コンテンツ編集 (HTML/Markdown)</h2>
                    
                    {/* フォーム要素 (例としてタイトルとステータスのみ) */}
                    <div>
                        <label htmlFor="title" className="block text-sm font-medium text-gray-700">ページタイトル</label>
                        <input
                            type="text"
                            id="title"
                            value={formData.title}
                            onChange={(e) => setFormData({...formData, title: e.target.value})}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                        />
                    </div>

                    <div>
                        <label htmlFor="contentHtml" className="block text-sm font-medium text-gray-700">HTML/Markdown コンテンツ</label>
                        <textarea
                            id="contentHtml"
                            rows={20}
                            value={formData.contentHtml}
                            onChange={(e) => setFormData({...formData, contentHtml: e.target.value})}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 font-mono text-sm"
                            placeholder="ここにランディングページのHTMLまたはMarkdownを直接記述します。"
                        />
                    </div>
                </div>

                {/* ステータス/バージョン情報 (右1/3) */}
                <div className="lg:col-span-1 bg-white p-6 rounded-lg shadow-md space-y-4 h-fit sticky top-20">
                    <h2 className="text-xl font-bold border-b pb-2">ステータスとバージョン</h2>

                    <div className="space-y-2">
                        <p className="font-medium text-gray-700">現在のステータス:</p>
                        <span className={`px-3 py-1 rounded-full text-sm font-bold ${formData.status === 'published' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                            {formData.status === 'published' ? '公開中' : '下書き'}
                        </span>
                    </div>

                    <p className="font-medium text-gray-700">バージョン: {formData.version}</p>
                    <p className="text-sm text-gray-500">最終更新: {new Date().toLocaleDateString()}</p>
                    
                    <button className="w-full bg-red-500 text-white py-2 rounded-md hover:bg-red-600 transition">
                        バージョンをロールバック
                    </button>
                </div>
            </main>
        </div>
    );
};

// サーバーサイドでダミーデータを生成
export const getServerSideProps = async () => {
    const initialData: LandingPageData = {
        title: "みんなの那須アプリ",
        description: "テスト用ランディングページ",
        status: 'draft',
        contentHtml: "<h1>ようこそ</h1><p>ここにエディタのコンテンツが入ります。</p>",
        version: 1,
    };

    return {
        props: {
            initialData,
        },
    };
};

export default LandingEditorPage;
