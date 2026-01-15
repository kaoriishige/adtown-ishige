import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { db, auth, storage } from '@/lib/firebase';
import { doc, getDoc, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { RiArrowLeftLine, RiCameraFill, RiErrorWarningFill, RiShieldCheckFill, RiHistoryLine } from 'react-icons/ri';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

const CATEGORIES = ["迷子です", "見かけました", "保護しました", "里親募集", "探しています"];
const AREAS = ["那須塩原市", "大田原市", "那須町"];

export default function CreatePetPost() {
    const router = useRouter();
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    const [category, setCategory] = useState(CATEGORIES[0]);
    const [description, setDescription] = useState('');
    const [area, setArea] = useState(AREAS[0]);
    const [lineId, setLineId] = useState('');
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState('');

    useEffect(() => {
        const fetchUser = async () => {
            const currentUser = auth.currentUser;
            if (currentUser) {
                const userDoc = await getDoc(doc(db, "users", currentUser.uid));
                if (userDoc.exists()) {
                    setUser({ uid: currentUser.uid, ...userDoc.data() });
                }
            }
        };
        fetchUser();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!imageFile) return alert("お写真を1枚選択してください");
        setLoading(true);

        try {
            let imageUrl = "";
            const storageRef = ref(storage, `pet_board/${Date.now()}`);
            await uploadBytes(storageRef, imageFile);
            imageUrl = await getDownloadURL(storageRef);

            // 有料会員（安心ゾーン）と無料ゾーンの判定を含む投稿
            await addDoc(collection(db, "pet_posts"), {
                uid: user?.uid || "guest",
                // 有料会員ならニックネーム固定、そうでなければ匿名 [cite: 17, 20]
                nickname: (user?.isPaid || user?.subscriptionStatus === 'active') ? (user.nickname || "確認済みユーザー") : "匿名ユーザー",
                // 本人確認バッジと利用実績のフラグ [cite: 19, 21]
                isPaid: !!(user?.isPaid || user?.subscriptionStatus === 'active'),
                usageCount: user?.usageCount || 0,
                category,
                description,
                area,
                lineId,
                imageUrl,
                status: 'active',
                createdAt: serverTimestamp(),
            });

            alert("投稿が完了しました");
            router.push('/premium/pet-board');
        } catch (error) {
            console.error(error);
            alert("投稿に失敗しました");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#FCFAF9] pb-24 font-sans text-gray-800">
            <header className="bg-white border-b px-6 py-4 flex items-center justify-between sticky top-0 z-50">
                <button onClick={() => router.back()} className="p-1"><RiArrowLeftLine size={24} /></button>
                <h1 className="font-bold text-sm tracking-wider">ペット掲示板に投稿</h1>
                <div className="w-8"></div>
            </header>

            <main className="max-w-md mx-auto p-6 space-y-8">
                {/* 投稿ステータスのプレビュー（安心感の演出） */}
                {(user?.isPaid || user?.subscriptionStatus === 'active') && (
                    <div className="flex gap-3 mb-2">
                        <div className="flex items-center gap-1 text-[10px] font-bold bg-blue-50 text-blue-600 px-3 py-1 rounded-full">
                            <RiShieldCheckFill /> 本人確認済み [cite: 19]
                        </div>
                        <div className="flex items-center gap-1 text-[10px] font-bold bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full">
                            <RiHistoryLine /> 利用実績あり [cite: 21]
                        </div>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* 写真1枚 [cite: 10] */}
                    <div
                        onClick={() => document.getElementById('pet-img')?.click()}
                        className="aspect-square bg-white rounded-3xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center overflow-hidden cursor-pointer hover:bg-gray-50 transition-colors"
                    >
                        {previewUrl ? (
                            <img src={previewUrl} className="w-full h-full object-cover" alt="preview" />
                        ) : (
                            <div className="text-center">
                                <RiCameraFill size={40} className="text-gray-300 mx-auto" />
                                <p className="text-xs font-bold text-gray-400 mt-2">写真を1枚のせる</p>
                            </div>
                        )}
                        <input type="file" id="pet-img" hidden accept="image/*" onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) { setImageFile(file); setPreviewUrl(URL.createObjectURL(file)); }
                        }} />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        {/* カテゴリ  */}
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-gray-400 ml-1">カテゴリ</label>
                            <select className="w-full p-4 bg-white border border-gray-100 rounded-2xl font-bold text-sm outline-none"
                                value={category} onChange={e => setCategory(e.target.value)}>
                                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>
                        {/* 地域 [cite: 12] */}
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-gray-400 ml-1">地域</label>
                            <select className="w-full p-4 bg-white border border-gray-100 rounded-2xl font-bold text-sm outline-none"
                                value={area} onChange={e => setArea(e.target.value)}>
                                {AREAS.map(a => <option key={a} value={a}>{a}</option>)}
                            </select>
                        </div>
                    </div>

                    {/* 一言 [cite: 11] */}
                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-gray-400 ml-1">一言メッセージ</label>
                        <textarea required placeholder="状況やペットの特徴など"
                            className="w-full h-28 p-5 bg-white border border-gray-100 rounded-2xl font-medium text-sm outline-none focus:border-emerald-200 transition-colors"
                            value={description} onChange={e => setDescription(e.target.value)} />
                    </div>

                    {/* LINE ID [cite: 13] */}
                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-gray-400 ml-1">連絡用LINE ID</label>
                        <input required placeholder="IDを入力"
                            className="w-full p-4 bg-white border border-gray-100 rounded-2xl font-bold text-sm outline-none focus:border-emerald-200 transition-colors"
                            value={lineId} onChange={e => setLineId(e.target.value)} />
                    </div>

                    {/* 超重要：責任回避の注意文  */}
                    <div className="bg-white border border-orange-100 p-6 rounded-[2rem] space-y-3">
                        <h3 className="flex items-center gap-2 text-[11px] font-black text-orange-600 uppercase tracking-tighter">
                            <RiErrorWarningFill size={18} /> ご利用前に必ずお読みください
                        </h3>
                        <ul className="text-[10px] leading-relaxed text-gray-400 font-bold space-y-1.5">
                            <li>• 本サービスは個人間の出会いの場を提供する掲示板です [cite: 31]。</li>
                            <li>• 譲渡・飼育・引き渡しの判断はすべて当事者同士で行ってください [cite: 32]。</li>
                            <li>• 運営は一切の仲介・斡旋・判断・責任を負いません [cite: 33]。</li>
                            <li>• 金銭のやり取り・条件の交渉についても運営は関与しません [cite: 34]。</li>
                            <li>• 少しでも不安を感じた場合は、やり取りを中止してください [cite: 35]。</li>
                        </ul>
                    </div>

                    <button type="submit" disabled={loading}
                        className="w-full py-5 bg-emerald-600 text-white rounded-full font-black text-lg shadow-xl shadow-emerald-100 active:scale-[0.98] transition-all disabled:opacity-50">
                        {loading ? "送信中..." : "ルールに同意して投稿"}
                    </button>
                </form>
            </main>
        </div>
    );
}