import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { getAuth } from 'firebase/auth';
import { db, storage } from '../../../lib/firebase';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
// RiArrowLeftLine を追加
import { RiCameraFill, RiSendPlaneFill, RiLoader4Line, RiArrowLeftLine } from 'react-icons/ri';

const AREAS: Record<string, string[]> = {
    "那須塩原市": ["黒磯地区", "西那須野地区", "塩原地区"],
    "大田原市": ["大田原地区", "金田地区", "親園地区", "野崎地区", "佐久山地区", "湯津上地区", "黒羽地区", "川西地区"],
    "那須町": ["黒田原地区", "那須高原地区", "那須湯本地区", "芦野・伊王野地区"]
};

export default function AkiyaCreate() {
    const router = useRouter();
    const auth = getAuth();
    const [loading, setLoading] = useState(false);
    const [image, setImage] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        type: 'house', // house, store, warehouse, other
        city: '那須塩原市',
        district: '黒磯地区',
        condition: 'good', // good, repair, bad
        intent: 'consult' // rent, sale, consult
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!auth.currentUser) {
            alert('ログインが必要です');
            return;
        }

        setLoading(true);

        try {
            let imageUrl = '';

            if (image) {
                const sRef = ref(storage, `akiya/${Date.now()}`);
                await uploadBytes(sRef, image);
                imageUrl = await getDownloadURL(sRef);
            }

            await addDoc(collection(db, 'akiya_posts'), {
                title: formData.title,
                description: formData.description,
                type: formData.type,
                city: formData.city,
                district: formData.district,
                condition: formData.condition,
                intent: formData.intent,
                imageUrl,
                userId: auth.currentUser.uid,
                createdAt: Timestamp.now(),
            });

            router.push('/premium/akiya');
        } catch (e) {
            alert('投稿エラーが発生しました');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-white">
            <div className="max-w-xl mx-auto p-6">
                {/* 戻るボタンエリア */}
                <div className="flex items-center gap-4 mb-8">
                    <button
                        onClick={() => router.push('/premium/akiya')}
                        className="p-2 bg-slate-50 rounded-full text-slate-400 hover:text-slate-900 transition-colors"
                    >
                        <RiArrowLeftLine size={24} />
                    </button>
                    <div>
                        <h1 className="text-2xl font-black italic leading-none">那須あき家速報 登録</h1>
                        <p className="text-[10px] text-slate-400 mt-1 font-bold uppercase tracking-widest">Post Unlisted Property</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <p className="text-xs text-slate-500">※ 正確な場所・状態を入力してください（匿名OK）</p>

                    {/* 画像 */}
                    <div className="h-64 bg-slate-50 rounded-[2rem] border-2 border-dashed border-slate-200 flex items-center justify-center overflow-hidden shadow-inner">
                        {preview ? (
                            <img src={preview} className="w-full h-full object-cover" />
                        ) : (
                            <label className="text-center cursor-pointer w-full h-full flex flex-col items-center justify-center">
                                <RiCameraFill size={40} className="mx-auto text-slate-300" />
                                <p className="text-[10px] font-black text-slate-400 mt-2 uppercase">Add Photo</p>
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
                        placeholder="物件名（例：元そば屋の古民家、広い納屋）"
                        className="w-full p-5 bg-slate-50 rounded-2xl border-none shadow-inner font-bold"
                        value={formData.title}
                        onChange={e => setFormData({ ...formData, title: e.target.value })}
                    />

                    {/* 説明 */}
                    <textarea
                        required
                        placeholder="状態、広さ、雨漏り、裏庭、駐車場、近隣状況など正直に"
                        className="w-full p-5 bg-slate-50 rounded-2xl border-none shadow-inner h-32 font-bold"
                        value={formData.description}
                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                    />

                    {/* 種別 × 意向 */}
                    <div className="grid grid-cols-2 gap-4">
                        <select
                            className="p-4 bg-slate-50 rounded-2xl border-none shadow-inner font-bold"
                            value={formData.type}
                            onChange={e => setFormData({ ...formData, type: e.target.value })}
                        >
                            <option value="house">住宅</option>
                            <option value="store">店舗跡</option>
                            <option value="warehouse">倉庫・納屋</option>
                            <option value="other">その他</option>
                        </select>

                        <select
                            className="p-4 bg-slate-50 rounded-2xl border-none shadow-inner text-blue-600 font-bold"
                            value={formData.intent}
                            onChange={e => setFormData({ ...formData, intent: e.target.value })}
                        >
                            <option value="consult">まずは相談</option>
                            <option value="rent">貸したい</option>
                            <option value="sale">売りたい</option>
                        </select>
                    </div>

                    {/* 市町 */}
                    <div>
                        <label className="text-[10px] font-black text-slate-400 ml-2 uppercase tracking-widest">City / 市町</label>
                        <select
                            className="w-full p-4 bg-slate-50 rounded-2xl border-none shadow-inner font-bold mt-1"
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
                        <label className="text-[10px] font-black text-slate-400 ml-2 uppercase tracking-widest">District / 地区</label>
                        <select
                            className="w-full p-4 bg-slate-50 rounded-2xl border-none shadow-inner font-bold mt-1"
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
                        <label className="text-[10px] font-black text-slate-400 ml-2 uppercase tracking-widest">Condition / 状態</label>
                        <select
                            className="w-full p-4 bg-slate-50 rounded-2xl border-none shadow-inner font-bold mt-1"
                            value={formData.condition}
                            onChange={e => setFormData({ ...formData, condition: e.target.value })}
                        >
                            <option value="good">すぐ使える</option>
                            <option value="repair">修繕必要</option>
                            <option value="bad">かなり傷みあり</option>
                        </select>
                    </div>

                    {/* 注意文 */}
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                        <p className="text-[11px] text-slate-400 leading-relaxed font-bold">
                            ※ これは不動産仲介サービスではありません。<br />
                            ※ 所有権・賃貸権限がない物件の投稿は禁止です。<br />
                            ※ 正確でない情報・冷やかし投稿は削除対象になります。
                        </p>
                    </div>

                    {/* 送信 */}
                    <button
                        disabled={loading}
                        className="w-full py-5 bg-slate-900 text-white rounded-[2rem] font-black shadow-xl flex items-center justify-center gap-2 active:scale-95 transition-all disabled:opacity-50"
                    >
                        {loading ? (
                            <RiLoader4Line className="animate-spin" size={24} />
                        ) : (
                            <>
                                <RiSendPlaneFill size={20} /> 匿名で情報を出す
                            </>
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
}
