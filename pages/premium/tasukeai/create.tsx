import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { getAuth } from 'firebase/auth';
import { db, storage } from '../../../lib/firebase';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { RiArrowLeftLine, RiCameraFill, RiSendPlaneFill, RiLoader4Line } from 'react-icons/ri';

export default function TasukeaiCreate() {
    const router = useRouter();
    const auth = getAuth();
    const [loading, setLoading] = useState(false);
    const [image, setImage] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        category: 'food',
        area: '那須塩原市',
        provider: '',
        days: 1 // 表示期間（日）
    });

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setImage(file);
            setPreview(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!auth.currentUser) return;
        setLoading(true);

        try {
            let imageUrl = '';
            // 1. 画像アップロード
            if (image) {
                const storageRef = ref(storage, `support_alerts/${Date.now()}_${image.name}`);
                await uploadBytes(storageRef, image);
                imageUrl = await getDownloadURL(storageRef);
            }

            // 2. 期限計算
            const dateEnd = new Date();
            dateEnd.setDate(dateEnd.getDate() + Number(formData.days));

            // 3. Firestore保存
            await addDoc(collection(db, 'support_alerts'), {
                ...formData,
                imageUrl,
                userId: auth.currentUser.uid,
                createdAt: Timestamp.now(),
                dateEnd: Timestamp.fromDate(dateEnd),
                status: 'active'
            });

            router.push('/premium/tasukeai');
        } catch (error) {
            console.error(error);
            alert('投稿に失敗しました');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-white pb-10">
            <header className="px-6 py-4 flex items-center justify-between border-b sticky top-0 bg-white z-50">
                <button onClick={() => router.back()} className="text-gray-400"><RiArrowLeftLine size={24} /></button>
                <h1 className="font-black text-gray-800">速報を投稿する</h1>
                <div className="w-6"></div>
            </header>

            <form onSubmit={handleSubmit} className="p-6 space-y-6 max-w-xl mx-auto">
                {/* 画像選択 */}
                <div className="relative w-full h-64 bg-gray-50 rounded-[2rem] border-2 border-dashed border-gray-200 overflow-hidden flex items-center justify-center">
                    {preview ? (
                        <img src={preview} className="w-full h-full object-cover" />
                    ) : (
                        <label className="flex flex-col items-center cursor-pointer">
                            <RiCameraFill size={40} className="text-gray-300" />
                            <span className="text-xs font-black text-gray-400 mt-2 uppercase tracking-widest">Tap to Capture</span>
                            <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                        </label>
                    )}
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="text-[10px] font-black text-gray-400 uppercase ml-2">Title / タイトル</label>
                        <input required placeholder="例：【無料】余剰野菜の配布" className="w-full p-4 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-orange-500 font-bold"
                            onChange={e => setFormData({ ...formData, title: e.target.value })} />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-[10px] font-black text-gray-400 uppercase ml-2">Category</label>
                            <select className="w-full p-4 bg-gray-50 rounded-2xl border-none font-bold"
                                onChange={e => setFormData({ ...formData, category: e.target.value })}>
                                <option value="food">野菜・食品</option>
                                <option value="child">子ども・体験</option>
                                <option value="facility">施設・無料</option>
                                <option value="admin">行政・助成</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-[10px] font-black text-gray-400 uppercase ml-2">Display Days / 表示日数</label>
                            <select className="w-full p-4 bg-gray-50 rounded-2xl border-none font-bold text-red-500"
                                onChange={e => setFormData({ ...formData, days: Number(e.target.value) })}>
                                <option value="1">今日のみ</option>
                                <option value="3">3日間</option>
                                <option value="7">1週間</option>
                                <option value="30">1ヶ月</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="text-[10px] font-black text-gray-400 uppercase ml-2">Description / 詳細内容</label>
                        <textarea required rows={4} placeholder="場所、時間、持ち物など" className="w-full p-4 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-orange-500 font-bold"
                            onChange={e => setFormData({ ...formData, description: e.target.value })} />
                    </div>

                    <div>
                        <label className="text-[10px] font-black text-gray-400 uppercase ml-2">Provider / 提供元</label>
                        <input required placeholder="例：〇〇農園、那須町役場" className="w-full p-4 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-orange-500 font-bold"
                            onChange={e => setFormData({ ...formData, provider: e.target.value })} />
                    </div>
                </div>

                <button disabled={loading} type="submit" className="w-full py-5 bg-gray-900 text-white rounded-[2rem] font-black shadow-xl flex items-center justify-center gap-2 active:scale-95 transition-all disabled:opacity-50">
                    {loading ? <RiLoader4Line className="animate-spin" size={24} /> : <><RiSendPlaneFill size={20} /> 那須に速報を流す</>}
                </button>
            </form>
        </div>
    );
}