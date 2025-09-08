import type { NextPage } from 'next';
import Link from 'next/link';
import { useState, ChangeEvent, FormEvent } from 'react';
import { app } from '@/lib/firebase'; // あなたのFirebase初期化設定
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage'; // ★ Firebase Storageの機能をインポート

// 仮のデータ型定義（imageUrlを追加）
type Deal = {
  id: string;
  title: string;
  type: 'お得情報' | 'クーポン' | 'フードロス';
  description: string;
  createdAt: string;
  imageUrl?: string; // 画像URL（オプショナル）
};

const DealsPage: NextPage = () => {
    const [dealType, setDealType] = useState<'お得情報' | 'クーポン' | 'フードロス'>('お得情報');
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [imageFile, setImageFile] = useState<File | null>(null); // ★ 画像ファイルを保持するためのStateを追加
    const [isSubmitting, setIsSubmitting] = useState(false); // 送信中の状態を管理

    // 既存のお得情報リスト（imageUrlの例を追加）
    const [deals, setDeals] = useState<Deal[]>([
        { id: '1', title: '本日のランチセット100円引き！', type: 'クーポン', description: '画面提示で適用されます。', createdAt: '2025/09/07', imageUrl: 'https://via.placeholder.com/150' },
        { id: '2', title: 'パンの詰め合わせ 30% OFF', type: 'フードロス', description: '閉店間際限定です。', createdAt: '2025/09/06' },
    ]);

    // ★ 画像が選択されたときにStateを更新するハンドラ
    const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setImageFile(e.target.files[0]);
        }
    };

    // ★ ファイルアップロード機能を追加したhandleSubmit
    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (isSubmitting) return;
        setIsSubmitting(true);

        let newImageUrl: string | undefined = undefined;

        try {
            // 画像ファイルが選択されている場合、Firebase Storageにアップロード
            if (imageFile) {
                const storage = getStorage(app);
                // ファイル名が重複しないようにタイムスタンプを付与
                const storageRef = ref(storage, `deals/${Date.now()}_${imageFile.name}`);
                
                // ファイルをアップロード
                const snapshot = await uploadBytes(storageRef, imageFile);
                // アップロードしたファイルのURLを取得
                newImageUrl = await getDownloadURL(snapshot.ref);
            }

            const newDeal: Deal = {
                id: new Date().toISOString(),
                title,
                type: dealType,
                description,
                createdAt: new Date().toLocaleDateString('ja-JP'),
                imageUrl: newImageUrl,
            };

            // ここでAPIを呼び出してFirestoreなどにnewDealオブジェクトを保存する処理を実装
            console.log('保存するデータ:', newDeal);

            // フロントエンド側の表示を更新（実際はAPIから再取得するのが望ましい）
            setDeals(prev => [newDeal, ...prev]);

            // フォームをリセット
            setTitle('');
            setDescription('');
            setImageFile(null);
            (document.getElementById('image-upload') as HTMLInputElement).value = ""; // ファイル入力の表示をリセット

            alert('新しい情報を登録しました！');

        } catch (error) {
            console.error("登録に失敗しました:", error);
            alert("エラーが発生しました。登録に失敗しました。");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <header className="bg-white shadow-sm">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <h1 className="text-2xl font-bold text-gray-900">お得情報・クーポン・フードロス管理</h1>
                </div>
            </header>

            <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <section className="bg-white p-8 rounded-lg shadow-sm mb-8">
                    <h2 className="text-xl font-bold text-gray-800 mb-4">新規登録</h2>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* ... 種別、タイトル、説明文のフォームは変更なし ... */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">種別</label>
                            <select value={dealType} onChange={(e) => setDealType(e.target.value as any)} className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm">
                                <option>お得情報</option>
                                <option>クーポン</option>
                                <option>フードロス</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">タイトル</label>
                            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} required className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">説明文</label>
                            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm" />
                        </div>
                        
                        {/* ★ 画像アップロード用のフォーム要素を追加 */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">画像 (任意)</label>
                            <input 
                                type="file"
                                id="image-upload" // フォームリセット用ID
                                onChange={handleImageChange}
                                accept="image/png, image/jpeg"
                                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                            />
                        </div>

                        <div className="text-right">
                             <button type="submit" disabled={isSubmitting} className="inline-flex justify-center py-2 px-6 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 disabled:bg-gray-400">
                                {isSubmitting ? '登録中...' : '登録する'}
                            </button>
                        </div>
                    </form>
                </section>

                <section>
                    <h2 className="text-xl font-bold text-gray-800 mb-4">登録済みリスト</h2>
                    <div className="bg-white rounded-lg shadow-sm">
                        <ul className="divide-y divide-gray-200">
                            {deals.map(deal => (
                                <li key={deal.id} className="p-4 flex items-start space-x-4">
                                    {/* ★ 登録済みリストに画像表示を追加 */}
                                    {deal.imageUrl && (
                                        <img src={deal.imageUrl} alt={deal.title} className="w-24 h-24 object-cover rounded-md flex-shrink-0" />
                                    )}
                                    <div className="flex-grow">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${deal.type === 'クーポン' ? 'bg-blue-100 text-blue-800' : deal.type === 'フードロス' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'}`}>
                                                    {deal.type}
                                                </span>
                                                <p className="font-semibold text-gray-800 mt-1">{deal.title}</p>
                                            </div>
                                            <div className="text-right flex-shrink-0 ml-4">
                                                <p className="text-xs text-gray-400">{deal.createdAt}</p>
                                                <button className="text-sm text-red-500 hover:text-red-700 mt-2">削除</button>
                                            </div>
                                        </div>
                                        <p className="text-sm text-gray-500 mt-1">{deal.description}</p>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>
                </section>
                <div className="mt-8">
                   <Link href="/partner/dashboard" className="text-sm font-medium text-gray-600 hover:text-gray-900">
                        ← ダッシュボードに戻る
                    </Link>
                </div>
            </main>
        </div>
    );
};

export default DealsPage;