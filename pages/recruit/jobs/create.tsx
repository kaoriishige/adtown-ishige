import type { NextPage } from 'next';
import { useState } from 'react';
import { useRouter } from 'next/router';
import { getAuth } from 'firebase/auth';
import { app } from '@/lib/firebase'; // Firebaseのパスは適宜調整

// アイコンコンポーネント
const CheckIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor"> <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /> </svg> );

const JobPostingPage: NextPage = () => {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // フォームのState
    const [jobTitle, setJobTitle] = useState('');
    const [employmentType, setEmploymentType] = useState<string[]>([]);
    const [salary, setSalary] = useState('');
    const [jobDescription, setJobDescription] = useState('');
    const [requiredSkills, setRequiredSkills] = useState('');
    const [welcomeSkills, setWelcomeSkills] = useState('');
    const [idealCandidate, setIdealCandidate] = useState('');
    const [atmosphere, setAtmosphere] = useState<string[]>([]);
    const [benefits, setBenefits] = useState<string[]>([]);
    const [employeeMessage, setEmployeeMessage] = useState('');

    const handleCheckboxChange = (setter: React.Dispatch<React.SetStateAction<string[]>>, value: string) => {
        setter(prev => 
            prev.includes(value) ? prev.filter(item => item !== value) : [...prev, value]
        );
    };

    const handlePublish = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);
        
        // ここにFirebase Firestoreに求人情報を保存するロジックを実装します。
        // 画像や動画は、Firebase Storageにアップロードし、そのURLを保存するのが一般的です。
        try {
            console.log({
                jobTitle, employmentType, salary, jobDescription, requiredSkills, welcomeSkills,
                idealCandidate, atmosphere, benefits, employeeMessage
            });
            // Firestoreへの保存処理が成功したと仮定
            alert('求人を登録しました！');
            router.push('/recruit/dashboard'); // 成功後はダッシュボードへ
        } catch (err) {
            setError('求人の登録に失敗しました。');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };
    
    return (
        <div className="min-h-screen bg-gray-100">
            <header className="bg-white shadow-sm">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <h1 className="text-2xl font-bold text-gray-900">新しい求人の作成</h1>
                </div>
            </header>
            
            <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <form onSubmit={handlePublish} className="space-y-8">
                    {/* --- 基本情報 --- */}
                    <div className="bg-white p-8 rounded-lg shadow-md">
                        <h2 className="text-xl font-bold text-gray-800 border-b pb-4 mb-6">基本情報</h2>
                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">募集職種</label>
                                <input type="text" value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500" placeholder="例：ホールスタッフ、Webデザイナー" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">雇用形態（複数選択可）</label>
                                <div className="mt-2 grid grid-cols-2 md:grid-cols-4 gap-4">
                                    {['正社員', '契約社員', 'パート・アルバイト', '業務委託'].map(type => (
                                        <label key={type} className="flex items-center">
                                            <input type="checkbox" checked={employmentType.includes(type)} onChange={() => handleCheckboxChange(setEmploymentType, type)} className="h-4 w-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500" />
                                            <span className="ml-2 text-gray-700">{type}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">給与</label>
                                <input type="text" value={salary} onChange={(e) => setSalary(e.target.value)} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500" placeholder="例：月給 250,000円～ / 時給 1,200円～" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">仕事内容</label>
                                <textarea value={jobDescription} onChange={(e) => setJobDescription(e.target.value)} rows={5} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500" placeholder="具体的な業務内容、一日の流れなどを入力してください。" />
                            </div>
                        </div>
                    </div>

                    {/* --- AIマッチングのための情報 --- */}
                    <div className="bg-white p-8 rounded-lg shadow-md">
                        <h2 className="text-xl font-bold text-gray-800 border-b pb-4 mb-6">AIマッチング情報（求職者との相性を高めます）</h2>
                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">必須スキル・経験（箇条書きで入力）</label>
                                <textarea value={requiredSkills} onChange={(e) => setRequiredSkills(e.target.value)} rows={3} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500" placeholder="例：飲食店でのホール経験3年以上&#10;普通自動車免許" />
                            </div>
                             <div>
                                <label className="block text-sm font-medium text-gray-700">歓迎スキル・経験（箇条書きで入力）</label>
                                <textarea value={welcomeSkills} onChange={(e) => setWelcomeSkills(e.target.value)} rows={3} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500" placeholder="例：ソムリエ資格&#10;英語での接客経験" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">求める人物像</label>
                                <textarea value={idealCandidate} onChange={(e) => setIdealCandidate(e.target.value)} rows={3} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500" placeholder="例：チームワークを大切にし、お客様を笑顔にすることが好きな方。" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">職場の雰囲気（複数選択可）</label>
                                <div className="mt-2 grid grid-cols-2 md:grid-cols-4 gap-4">
                                    {['チームワーク重視', '個人で集中', '活気がある', '落ち着いている', '若手が多い', 'ベテランが多い', '服装自由', '研修が充実'].map(item => (
                                        <label key={item} className="flex items-center">
                                            <input type="checkbox" checked={atmosphere.includes(item)} onChange={() => handleCheckboxChange(setAtmosphere, item)} className="h-4 w-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500" />
                                            <span className="ml-2 text-gray-700">{item}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                             <div>
                                <label className="block text-sm font-medium text-gray-700">福利厚生・待遇（複数選択可）</label>
                                <div className="mt-2 grid grid-cols-2 md:grid-cols-4 gap-4">
                                    {['社会保険完備', '交通費支給', '賄い・食事補助あり', '髪型・髪色自由', 'マイカー通勤OK', '資格取得支援制度', '昇給あり', '賞与あり'].map(item => (
                                        <label key={item} className="flex items-center">
                                            <input type="checkbox" checked={benefits.includes(item)} onChange={() => handleCheckboxChange(setBenefits, item)} className="h-4 w-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500" />
                                            <span className="ml-2 text-gray-700">{item}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* --- 職場の魅力 --- */}
                     <div className="bg-white p-8 rounded-lg shadow-md">
                        <h2 className="text-xl font-bold text-gray-800 border-b pb-4 mb-6">職場の魅力</h2>
                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">写真・動画で見る職場</label>
                                <p className="text-xs text-gray-500 mb-2">※この機能は現在開発中です。今後Firebase Storageと連携して実装します。</p>
                                <input type="file" multiple accept="image/*" className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100"/>
                                <input type="file" accept="video/*" className="mt-2 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"/>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">先輩従業員からのメッセージ</label>
                                <textarea value={employeeMessage} onChange={(e) => setEmployeeMessage(e.target.value)} rows={4} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500" placeholder="例：「未経験から始めましたが、先輩たちが丁寧に教えてくれるので安心です。一緒にお店を盛り上げてくれる方をお待ちしています！」" />
                            </div>
                        </div>
                    </div>
                    
                    {error && <div className="bg-red-100 text-red-700 p-4 rounded-md">{error}</div>}

                    <div className="flex justify-end pt-8">
                        <button type="submit" disabled={isLoading} className="bg-orange-500 text-white font-bold py-3 px-8 rounded-lg hover:bg-orange-600 transition duration-300 shadow-lg flex items-center disabled:opacity-50">
                            {isLoading ? '登録中...' : 'この内容で求人を公開する'}
                        </button>
                    </div>
                </form>
            </main>
        </div>
    );
};

export default JobPostingPage;