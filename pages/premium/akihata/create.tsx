import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { db, storage } from '../../../lib/firebase';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
// RiArrowLeftSLine を追加
import { RiCameraFill, RiSendPlaneFill, RiLoader4Line, RiArrowLeftSLine } from 'react-icons/ri';

const AREAS: Record<string, string[]> = {
    "那須塩原市": ["黒磯地区", "西那須野地区", "塩原地区"],
    "大田原市": ["大田原地区", "金田地区", "親園地区", "野崎地区", "佐久山地区", "湯津上地区", "黒羽地区", "川西地区"],
    "那須町": ["黒田原地区", "那須高原地区", "那須湯本地区", "芦野・伊王野地区"]
};

export default function AkihataCreate() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [image, setImage] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        city: '那須塩原市',
        district: '黒磯地区',
        condition: '草刈り必要',
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            let imageUrl = '';

            if (image) {
                const sRef = ref(storage, `akihata/${Date.now()}`);
                await uploadBytes(sRef, image);
                imageUrl = await getDownloadURL(sRef);
            }

            await addDoc(collection(db, 'akihata_posts'), {
                title: formData.title,
                description: formData.description,
                city: formData.city,
                district: formData.district,
                condition: formData.condition,
                imageUrl,
                createdAt: Timestamp.now(),
            });

            router.push('/premium/akihata');
        } catch (e) {
            alert('エラーが発生しました');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-white p-6 font-bold">
            <div className="max-w-xl mx-auto">
                {/* 戻るボタン */}
                <button
                    onClick={() => router.push('/premium/akihata')}
                    className="flex items-center gap-1 text-slate-400 hover:text-emerald-900 transition-colors mb-6 group"
                >
                    <RiArrowLeftSLine size={24} className="group-hover:-translate-x-1 transition-transform" />
                    <span className="text-sm font-black italic uppercase tracking-widest">Back to List</span>
                </button>

                <form onSubmit={handleSubmit} className="space-y-6">

                    <h1 className="text-2xl font-black italic text-emerald-900">那須あき畑速報 登録</h1>

                    {/* 画像 */}
                    <div className="h-64 bg-emerald-50 rounded-3xl border-2 border-dashed border-emerald-200 flex items-center justify-center overflow-hidden shadow-inner">
                        {preview ? (
                            <img src={preview} className="w-full h-full object-cover" />
                        ) : (
                            <label className="cursor-pointer text-center w-full h-full flex flex-col items-center justify-center">
                                <RiCameraFill size={40} className="mx-auto text-emerald-200" />
                                <p className="text-xs text-emerald-400 mt-2">写真を追加</p>
                                <input
                                    type="file"
                                    className="hidden"
                                    onChange={e => {
                                        if (e.target.files?.[0]) {
                                            setImage(e.target.files[0]);
                                            setPreview(URL.createObjectURL(e.target.files[0]));
                                        }
                                    }}
                                />
                            </label>
                        )}
                    </div>

                    {/* タイトル */}
                    <input
                        required
                        placeholder="タイトル（例：日当たりの良い元田んぼ）"
                        className="w-full p-4 bg-slate-50 rounded-2xl border-none shadow-inner"
                        value={formData.title}
                        onChange={e => setFormData({ ...formData, title: e.target.value })}
                    />

                    {/* 説明 */}
                    <textarea
                        required
                        placeholder="状態・広さ・周辺環境・水の有無など"
                        className="w-full p-4 bg-slate-50 rounded-2xl border-none shadow-inner h-32"
                        value={formData.description}
                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                    />

                    {/* 市町 */}
                    <div>
                        <label className="text-xs text-slate-500 pl-2">市町</label>
                        <select
                            className="w-full p-4 bg-slate-50 rounded-2xl border-none shadow-inner font-bold"
                            value={formData.city}
                            onChange={e =>
                                setFormData({
                                    ...formData,
                                    city: e.target.value,
                                    district: AREAS[e.target.value][0]
                                })
                            }
                        >
                            {Object.keys(AREAS).map(city => (
                                <option key={city} value={city}>{city}</option>
                            ))}
                        </select>
                    </div>

                    {/* 地区 */}
                    <div>
                        <label className="text-xs text-slate-500 pl-2">地区</label>
                        <select
                            className="w-full p-4 bg-slate-50 rounded-2xl border-none shadow-inner font-bold"
                            value={formData.district}
                            onChange={e => setFormData({ ...formData, district: e.target.value })}
                        >
                            {AREAS[formData.city].map(d => (
                                <option key={d} value={d}>{d}</option>
                            ))}
                        </select>
                    </div>

                    {/* 状態 */}
                    <div>
                        <label className="text-xs text-slate-500 pl-2">状態</label>
                        <select
                            className="w-full p-4 bg-slate-50 rounded-2xl border-none shadow-inner font-bold"
                            value={formData.condition}
                            onChange={e => setFormData({ ...formData, condition: e.target.value })}
                        >
                            <option value="すぐ耕せる">すぐ耕せる</option>
                            <option value="草刈り必要">草刈り必要</option>
                            <option value="木が生えている">木が生えている</option>
                            <option value="元田んぼ">元田んぼ</option>
                        </select>
                    </div>

                    {/* 送信 */}
                    <button
                        disabled={loading}
                        className="w-full py-5 bg-emerald-900 text-white rounded-2xl font-black shadow-xl flex items-center justify-center gap-2 active:scale-95 transition-all disabled:opacity-50"
                    >
                        {loading ? (
                            <RiLoader4Line className="animate-spin" size={24} />
                        ) : (
                            <>
                                <RiSendPlaneFill size={20} /> 畑速報を流す
                            </>
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
}