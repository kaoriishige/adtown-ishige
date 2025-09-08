import type { NextPage } from 'next';
import Link from 'next/link';
import { useState, ChangeEvent, FormEvent } from 'react';

// 共通のUIコンポーネント
const Input = (props: React.InputHTMLAttributes<HTMLInputElement>) => (
    <input {...props} className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
);
const Textarea = (props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) => (
    <textarea {...props} rows={4} className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
);
const FormLabel = ({ children }: { children: React.ReactNode }) => (
    <label className="block text-sm font-medium text-gray-700 mb-1">{children}</label>
);

const ProfilePage: NextPage = () => {
    const [formData, setFormData] = useState({
        storeName: '',
        address: '',
        phone: '',
        description: '',
        hours: '月〜金: 10:00-20:00\n土日祝: 11:00-22:00',
        website: '',
        // ★★★ 変更点(1): Instagramを汎用的なSNSに修正 ★★★
        sns1: '',
        sns2: '',
        sns3: '',
    });

    const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        // ここにAPIを呼び出してFirestoreなどにデータを保存する処理を実装
        console.log('Form Data Submitted:', formData);
        alert('プロフィール情報が保存されました！');
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <header className="bg-white shadow-sm">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <h1 className="text-2xl font-bold text-gray-900">店舗プロフィールの登録・編集</h1>
                </div>
            </header>

            <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <form onSubmit={handleSubmit} className="bg-white p-8 rounded-lg shadow-sm space-y-6">
                    <div>
                        <FormLabel>店舗名 <span className="text-red-500">*</span></FormLabel>
                        <Input type="text" name="storeName" value={formData.storeName} onChange={handleChange} required />
                    </div>
                    <div>
                        <FormLabel>住所 <span className="text-red-500">*</span></FormLabel>
                        <Input type="text" name="address" value={formData.address} onChange={handleChange} required />
                    </div>
                    <div>
                        <FormLabel>電話番号 <span className="text-red-500">*</span></FormLabel>
                        <Input type="tel" name="phone" value={formData.phone} onChange={handleChange} required />
                    </div>
                    <div>
                        <FormLabel>店舗紹介文</FormLabel>
                        <Textarea name="description" value={formData.description} onChange={handleChange} placeholder="お店のこだわりやお客様へのメッセージを記入してください。" />
                    </div>
                    <div>
                        <FormLabel>営業時間</FormLabel>
                        <Textarea name="hours" value={formData.hours} onChange={handleChange} />
                    </div>
                    <div>
                        <FormLabel>店舗写真 (複数可)</FormLabel>
                        <Input type="file" name="photos" multiple accept="image/*" className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
                    </div>
                    <div>
                        <FormLabel>公式ウェブサイトURL</FormLabel>
                        <Input type="url" name="website" value={formData.website} onChange={handleChange} placeholder="https://..." />
                    </div>
                    
                    {/* ★★★ 変更点(2): Instagramの入力欄をSNS URL x3に変更 ★★★ */}
                    <div>
                        <FormLabel>SNS URL</FormLabel>
                        <div className="space-y-2">
                            <Input type="url" name="sns1" value={formData.sns1} onChange={handleChange} placeholder="https://..." />
                            <Input type="url" name="sns2" value={formData.sns2} onChange={handleChange} placeholder="https://..." />
                            <Input type="url" name="sns3" value={formData.sns3} onChange={handleChange} placeholder="https://..." />
                        </div>
                    </div>

                    <div className="flex items-center justify-between pt-4">
                         <Link href="/partner/dashboard" className="text-sm font-medium text-gray-600 hover:text-gray-900">
                            ← ダッシュボードに戻る
                        </Link>
                        <button type="submit" className="inline-flex justify-center py-2 px-6 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                            この内容で保存する
                        </button>
                    </div>
                </form>
            </main>
        </div>
    );
};

export default ProfilePage;