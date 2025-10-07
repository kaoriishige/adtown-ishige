import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { db, auth, storage } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, doc, getDoc } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { onAuthStateChanged, User } from 'firebase/auth';
import { v4 as uuidv4 } from 'uuid';
import { RiAddLine, RiDeleteBinLine, RiImageAddLine, RiVideoAddLine, RiExternalLinkLine } from 'react-icons/ri';

// --- 型定義 ---
interface MediaItem {
  id: string;
  file: File;
  caption: string;
  type: 'image' | 'video';
  preview: string;
}

interface CustomField {
  id: string;
  title: string;
  content: string;
}

interface CompanyProfile {
    companyName: string;
    address: string;
    phoneNumber: string;
    website: string;
}

// --- 求職者プロフィールと完全に一致させた職種選択肢 ---
const jobTypeOptions = [
    "営業・企画・マーケティング", "事務・管理", "販売・接客・サービス", "飲食・フード", 
    "IT・エンジニア", "クリエイティブ（デザイン・Webなど）", "製造・軽作業・工場", 
    "建築・土木・設備", "配送・ドライバー", "医療・福祉・保育", "教育・講師", 
    "専門職（士業・金融など）", "その他"
];

// --- ページコンポーネント ---
const CreateJobPage = () => {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [companyProfile, setCompanyProfile] = useState<CompanyProfile | null>(null);
  const [isProfileLoading, setIsProfileLoading] = useState(true);

  // --- フォームのState ---
  const [jobTitle, setJobTitle] = useState('');
  const [jobCategories, setJobCategories] = useState<string[]>([]);
  const [employmentType, setEmploymentType] = useState('正社員');
  const [jobDescription, setJobDescription] = useState('');
  const [responsibilities, setResponsibilities] = useState('');
  const [qualifications, setQualifications] = useState('');
  const [workLocation, setWorkLocation] = useState('');
  const [workingHours, setWorkingHours] = useState('09:00～18:00（休憩1時間）');
  const [salary, setSalary] = useState('');
  const [benefits, setBenefits] = useState('');
  const [holidays, setHolidays] = useState('');
  const [applicationProcess, setApplicationProcess] = useState('1. 書類選考\n2. 面接（1~2回）\n3. 内定');
  
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [customFields, setCustomFields] = useState<CustomField[]>([]);

  // ユーザー認証と企業情報の取得
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        const fetchProfile = async (uid: string) => {
          setIsProfileLoading(true);
          try {
            const userDocRef = doc(db, 'users', uid);
            const userDoc = await getDoc(userDocRef);
            if (userDoc.exists()) {
              const data = userDoc.data();
              setCompanyProfile({
                companyName: data.companyName || '',
                address: data.address || '',
                phoneNumber: data.phoneNumber || '',
                website: data.website || ''
              });
            } else {
              setError("企業情報が見つかりません。");
            }
          } catch (e) {
            console.error("企業情報の取得に失敗:", e);
            setError("企業情報の読み込みに失敗しました。");
          } finally {
            setIsProfileLoading(false);
          }
        };
        fetchProfile(currentUser.uid);
      } else {
        router.push('/partner/login');
      }
    });
    return () => unsubscribe();
  }, [router]);

  // --- ファイル選択・管理 ---
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      const newMediaItems: MediaItem[] = files.map(file => ({
        id: uuidv4(),
        file,
        caption: '',
        type: file.type.startsWith('image/') ? 'image' : 'video',
        preview: URL.createObjectURL(file),
      }));
      setMediaItems(prev => [...prev, ...newMediaItems]);
    }
  };

  const handleCaptionChange = (id: string, caption: string) => {
    setMediaItems(prev => prev.map(item => item.id === id ? { ...item, caption } : item));
  };

  const removeMediaItem = (id: string) => {
    setMediaItems(prev => prev.filter(item => item.id !== id));
  };
  
  // --- カスタム項目管理 ---
  const addCustomField = () => {
    setCustomFields(prev => [...prev, { id: uuidv4(), title: '', content: '' }]);
  };

  const handleCustomFieldChange = (id: string, field: 'title' | 'content', value: string) => {
    setCustomFields(prev => prev.map(item => item.id === id ? { ...item, [field]: value } : item));
  };
  
  const removeCustomField = (id: string) => {
    setCustomFields(prev => prev.filter(item => item.id !== id));
  };
  
  // --- 職種カテゴリ用のハンドラ ---
  const handleCategoryChange = (category: string) => {
      setJobCategories(prev => 
          prev.includes(category) 
          ? prev.filter(c => c !== category)
          : [...prev, category]
      );
  };

  const isFormValid = [jobTitle, employmentType, jobDescription, qualifications, workLocation, workingHours, salary].every(Boolean) && jobCategories.length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid || !user) {
        setError('必須項目 (*) をすべて入力してください。');
        window.scrollTo(0, 0);
        return;
    }
    setIsSubmitting(true);
    setError(null);

    try {
        const jobId = uuidv4();
        
        const mediaUploadPromises = mediaItems.map(async (item) => {
            const filePath = `jobs/${user.uid}/${jobId}/${uuidv4()}-${item.file.name}`;
            const fileRef = ref(storage, filePath);
            const uploadTask = await uploadBytesResumable(fileRef, item.file);
            const downloadURL = await getDownloadURL(uploadTask.ref);
            return { url: downloadURL, caption: item.caption, type: item.type };
        });
        const uploadedMedia = await Promise.all(mediaUploadPromises);
        
        await addDoc(collection(db, 'jobs'), {
            ownerId: user.uid,
            jobTitle, jobCategories, employmentType, jobDescription, responsibilities, qualifications,
            workLocation, workingHours, salary, benefits, holidays, applicationProcess,
            media: uploadedMedia,
            customFields: customFields.filter(f => f.title && f.content),
            status: 'active',
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        });

        alert('求人を登録しました。');
        router.push('/recruit/dashboard');

    } catch (err) {
        console.error("求人登録エラー:", err);
        setError('求人の登録に失敗しました。');
    } finally {
        setIsSubmitting(false);
    }
  };

  if (!user || isProfileLoading) {
    return ( <div className="flex justify-center items-center h-screen"><p>読み込み中...</p></div> );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Head><title>新しい求人の作成</title></Head>
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">新しい求人の作成</h1>
            <button onClick={() => router.push('/recruit/dashboard')} className="text-sm text-blue-600 hover:underline">
                ダッシュボードに戻る
            </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleSubmit} className="bg-white p-8 rounded-lg shadow-md space-y-10">
            {error && <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-md"><p>{error}</p></div>}
            
            <section className="space-y-4 p-6 border rounded-lg bg-gray-50">
                <div className="flex justify-between items-center">
                    <h2 className="text-xl font-bold text-gray-800">企業情報</h2>
                    <Link href="/recruit/profile" className="text-sm text-blue-600 hover:underline flex items-center">
                        企業情報を編集する <RiExternalLinkLine className="ml-1"/>
                    </Link>
                </div>
                {companyProfile ? (
                    <div className="space-y-2 text-sm text-gray-700">
                        <p><strong>企業名:</strong> {companyProfile.companyName || '未設定'}</p>
                        <p><strong>所在地:</strong> {companyProfile.address || '未設定'}</p>
                        <p><strong>電話番号:</strong> {companyProfile.phoneNumber || '未設定'}</p>
                        <p><strong>ウェブサイト:</strong> {companyProfile.website ? <a href={companyProfile.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{companyProfile.website}</a> : '未設定'}</p>
                    </div>
                ) : ( <p>企業情報が見つかりません。まずプロフィールを登録してください。</p> )}
            </section>
            
            <section className="space-y-6">
                <h2 className="text-xl font-bold text-gray-800 border-b pb-2">募集要項</h2>
                <div><label className="block font-semibold">職種名 *</label><input type="text" value={jobTitle} onChange={e => setJobTitle(e.target.value)} required className="w-full p-2 border rounded mt-1"/></div>
                
                <div>
                    <label className="block font-semibold">職種カテゴリ（複数選択可）*</label>
                    <div className="mt-2 grid grid-cols-2 md:grid-cols-3 gap-4 p-4 border rounded-md">
                        {jobTypeOptions.map(opt => (
                            <label key={opt} className="flex items-center space-x-2">
                                <input type="checkbox" value={opt} checked={jobCategories.includes(opt)} onChange={() => handleCategoryChange(opt)} className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500" />
                                <span>{opt}</span>
                            </label>
                        ))}
                    </div>
                </div>

                <div><label className="block font-semibold">雇用形態 *</label><select value={employmentType} onChange={e => setEmploymentType(e.target.value)} className="w-full p-2 border rounded mt-1"><option>正社員</option><option>契約社員</option><option>アルバイト・パート</option><option>業務委託</option><option>その他</option></select></div>
                <div><label className="block font-semibold">仕事内容の概要 *</label><textarea value={jobDescription} onChange={e => setJobDescription(e.target.value)} required rows={5} className="w-full p-2 border rounded mt-1" placeholder="例：那須の食材を活かしたイタリアンレストランでのホールスタッフ業務全般をお任せします。"></textarea></div>
                <div><label className="block font-semibold">具体的な業務内容</label><textarea value={responsibilities} onChange={e => setResponsibilities(e.target.value)} rows={5} className="w-full p-2 border rounded mt-1" placeholder="例：・お客様のご案内、オーダーテイク\n・料理やドリンクの提供\n・レジ業務\n・簡単な調理補助"></textarea></div>
                <div><label className="block font-semibold">応募資格（必須スキル・経験）*</label><textarea value={qualifications} onChange={e => setQualifications(e.target.value)} required rows={4} className="w-full p-2 border rounded mt-1" placeholder="例：・飲食店での接客経験1年以上\n・土日祝に勤務可能な方\n・未経験者歓迎"></textarea></div>
            </section>
            
            <section className="space-y-6">
                <h2 className="text-xl font-bold text-gray-800 border-b pb-2">勤務条件</h2>
                <div><label className="block font-semibold">勤務地 *</label><input type="text" value={workLocation} onChange={e => setWorkLocation(e.target.value)} required className="w-full p-2 border rounded mt-1" placeholder="例：栃木県那須塩原市〇〇 123-4"/></div>
                <div><label className="block font-semibold">勤務時間 *</label><textarea value={workingHours} onChange={e => setWorkingHours(e.target.value)} required className="w-full p-2 border rounded mt-1" placeholder="例：10:00～22:00の間でシフト制（実働8時間）"></textarea></div>
                <div><label className="block font-semibold">給与 *</label><textarea value={salary} onChange={e => setSalary(e.target.value)} required className="w-full p-2 border rounded mt-1" placeholder="例：月給20万円～35万円 ※経験・能力を考慮の上、決定します。\n時給1,000円～"></textarea></div>
                <div><label className="block font-semibold">福利厚生</label><textarea value={benefits} onChange={e => setBenefits(e.target.value)} rows={4} className="w-full p-2 border rounded mt-1" placeholder="例：・各種社会保険完備\n・交通費支給（規定あり）\n・まかないあり\n・制服貸与"></textarea></div>
                <div><label className="block font-semibold">休日・休暇</label><textarea value={holidays} onChange={e => setHolidays(e.target.value)} rows={3} className="w-full p-2 border rounded mt-1" placeholder="例：・週休2日制（シフトによる）\n・有給休暇\n・夏季休暇、年末年始休暇"></textarea></div>
            </section>
            
            <section>
                <h2 className="text-xl font-bold text-gray-800 border-b pb-2">選考プロセス</h2>
                 <div><textarea value={applicationProcess} onChange={e => setApplicationProcess(e.target.value)} rows={4} className="w-full p-2 border rounded mt-1"></textarea></div>
            </section>

            <section>
                <h2 className="text-xl font-bold text-gray-800 border-b pb-2">写真・動画で見る職場</h2>
                <div className="mt-4 p-4 border-2 border-dashed rounded-lg">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {mediaItems.map((item) => (
                            <div key={item.id} className="relative group">
                                {item.type === 'image' ? <img src={item.preview} alt="preview" className="w-full h-32 object-cover rounded-md"/> : <video src={item.preview} controls className="w-full h-32 object-cover rounded-md"/>}
                                <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-md">
                                    <button type="button" onClick={() => removeMediaItem(item.id)} className="text-white"><RiDeleteBinLine size={24}/></button>
                                </div>
                                <input type="text" value={item.caption} onChange={e => handleCaptionChange(item.id, e.target.value)} placeholder="キャプション..." className="w-full p-1 border rounded mt-1 text-sm"/>
                            </div>
                        ))}
                    </div>
                    <label htmlFor="media-upload" className="mt-4 inline-flex items-center justify-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 cursor-pointer">
                        <RiImageAddLine className="mr-2"/> <RiVideoAddLine className="mr-2"/> ファイルを選択
                    </label>
                    <input id="media-upload" type="file" multiple accept="image/*,video/*" onChange={handleFileChange} className="hidden"/>
                </div>
            </section>
            
            <section>
                <h2 className="text-xl font-bold text-gray-800 border-b pb-2">アピールポイント</h2>
                <div className="space-y-4 mt-4">
                    {customFields.map((field) => (
                        <div key={field.id} className="p-4 border rounded-md grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
                            <div className="md:col-span-4"><input type="text" value={field.title} onChange={e => handleCustomFieldChange(field.id, 'title', e.target.value)} placeholder="項目名 (例: 研修制度)" className="w-full p-2 border rounded"/></div>
                            <div className="md:col-span-7"><textarea value={field.content} onChange={e => handleCustomFieldChange(field.id, 'content', e.target.value)} placeholder="内容" rows={3} className="w-full p-2 border rounded"/></div>
                            <div className="md:col-span-1 flex justify-end"><button type="button" onClick={() => removeCustomField(field.id)} className="text-red-500 hover:text-red-700 p-2"><RiDeleteBinLine size={20}/></button></div>
                        </div>
                    ))}
                    <button type="button" onClick={addCustomField} className="flex items-center text-sm text-blue-600 hover:underline"><RiAddLine className="mr-1"/>項目を追加</button>
                </div>
            </section>

            <div className="flex justify-end pt-6 border-t">
                <button type="submit" disabled={isSubmitting || !isFormValid} className="px-8 py-3 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed">
                    {isSubmitting ? '登録中...' : 'この内容で求人を登録する'}
                </button>
            </div>
        </form>
      </main>
    </div>
  );
};

export default CreateJobPage;
