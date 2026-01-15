import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { db, storage, auth } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, doc, getDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import {
    RiFlashlightLine,
    RiCamera2Fill,
    RiShieldCheckFill,
    RiArrowLeftSLine,
    RiLoader4Line,
    RiStore2Line,
    RiMapPin2Line,
    RiChat3Line,
    RiInformationLine
} from 'react-icons/ri';
import Head from 'next/head';

const NASU_AREAS = ["那須塩原市", "大田原市", "那須町"];

export default function HalfPriceCreatePage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [image, setImage] = useState<File | null>(null);
    const [preview, setPreview] = useState<string>("");
    const [shopName, setShopName] = useState("");
    const [area, setArea] = useState(NASU_AREAS[0]);
    const [comment, setComment] = useState("");
    const [userName, setUserName] = useState("那須のユーザー");

    useEffect(() => {
        const fetchUser = async () => {
            const user = auth.currentUser;
            if (user) {
                const userDoc = await getDoc(doc(db, "users", user.uid));
                if (userDoc.exists()) {
                    setUserName(userDoc.data().nickname || "那須のユーザー");
                }
            }
        };
        fetchUser();
    }, []);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setImage(file);
            setPreview(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!image) return alert("現場のお写真を1枚追加してください");
        if (!shopName) return alert("店名を入力してください");

        const confirmMsg = "「情報は投稿時点のものです。売り切れの場合もあります」に同意して投稿しますか？";
        if (!confirm(confirmMsg)) return;

        setLoading(true);
        try {
            const user = auth.currentUser;
            if (!user) {
                router.push('/users/login');
                return;
            }

            const storageRef = ref(storage, `half_price/${user.uid}_${Date.now()}`);
            await uploadBytes(storageRef, image);
            const imageUrl = await getDownloadURL(storageRef);

            await addDoc(collection(db, "half_price_alerts"), {
                userId: user.uid,
                userName: userName,
                image: imageUrl,
                shopName,
                area,
                comment,
                createdAt: serverTimestamp(),
            });

            router.push('/premium/half-price');
        } catch (error) {
            console.error(error);
            alert("投稿に失敗しました。時間をおいて再度お試しください。");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#FDFCFD] pb-24 font-sans text-[#4A3B3B]">
            <Head><title>爆安セール速報を投稿 | Nasuプレミアム</title></Head>

            <header className="bg-white/80 backdrop-blur-xl border-b border-[#E8E2D9] px-6 py-4 sticky top-0 z-50">
                <div className="max-w-xl mx-auto flex items-center justify-between">
                    <button onClick={() => router.back()} className="w-10 h-10 flex items-center justify-center rounded-full bg-[#FDFCFD] border border-[#E8E2D9] text-[#A89F94] active:scale-90 transition-all">
                        <RiArrowLeftSLine size={24} />
                    </button>
                    <div className="text-center">
                        <span className="text-[10px] tracking-[0.2em] uppercase text-orange-500 block font-black">Half Price Alert</span>
                        <h1 className="text-sm font-black italic">爆安セール速報を投稿</h1>
                    </div>
                    <div className="w-10" />
                </div>
            </header>

            <main className="max-w-xl mx-auto p-6 animate-in fade-in duration-700">
                <form onSubmit={handleSubmit} className="space-y-10">
                    <p className="text-center text-[11px] font-bold text-orange-500/80 italic">
                        あなたの爆安セール速報がみんなのお役に立てます。
                    </p>

                    {/* Photo Selection Section */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 px-2">
                            <span className="w-6 h-6 bg-orange-500 text-white text-[10px] font-black rounded-full flex items-center justify-center shadow-lg shadow-orange-100">1</span>
                            <label className="text-xs font-black text-[#A89F94] uppercase tracking-widest">現場をパシャリ</label>
                        </div>

                        <div
                            onClick={() => document.getElementById('camera-input')?.click()}
                            className="aspect-square w-full bg-white border-2 border-dashed border-[#E8E2D9] rounded-[3rem] flex flex-col items-center justify-center overflow-hidden cursor-pointer active:scale-[0.98] transition-all shadow-sm hover:border-orange-300 group"
                        >
                            {preview ? (
                                <img src={preview} className="w-full h-full object-cover animate-in zoom-in duration-500" alt="" />
                            ) : (
                                <div className="text-center p-8 space-y-4">
                                    <div className="w-20 h-20 bg-orange-50 rounded-[2.5rem] flex items-center justify-center text-orange-400 mx-auto group-hover:scale-110 transition-transform duration-500">
                                        <RiCamera2Fill size={40} />
                                    </div>
                                    <p className="text-[11px] font-black text-[#D1C9BF] italic tracking-tighter">TAP TO SHOOT PHOTO</p>
                                </div>
                            )}
                        </div>
                        <input id="camera-input" type="file" accept="image/*" capture="environment" className="hidden" onChange={handleImageChange} />
                    </div>

                    {/* Shop Info Section */}
                    <div className="space-y-8">
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 px-2">
                                <span className="w-6 h-6 bg-orange-500 text-white text-[10px] font-black rounded-full flex items-center justify-center shadow-lg shadow-orange-100">2</span>
                                <label className="text-xs font-black text-[#A89F94] uppercase tracking-widest">お店の情報</label>
                            </div>

                            <div className="space-y-6 bg-white p-8 rounded-[2.5rem] border border-[#E8E2D9] shadow-sm">
                                <FormInput
                                    label="店名はどこ？"
                                    value={shopName}
                                    onChange={setShopName}
                                    placeholder="例：ヨークベニマル上厚崎店"
                                    required
                                    icon={<RiStore2Line className="text-orange-400" />}
                                />

                                <div className="space-y-3 pt-2">
                                    <label className="text-[10px] font-black text-[#A89F94] px-2 uppercase tracking-[0.2em] flex items-center gap-2">
                                        <RiMapPin2Line className="text-orange-400" /> 地域
                                    </label>
                                    <div className="flex gap-2">
                                        {NASU_AREAS.map((a) => (
                                            <button
                                                key={a}
                                                type="button"
                                                onClick={() => setArea(a)}
                                                className={`flex-1 py-4 rounded-2xl text-[11px] font-black transition-all ${area === a
                                                    ? 'bg-orange-500 text-white shadow-lg shadow-orange-100'
                                                    : 'bg-[#FDFCFD] text-[#A89F94] border border-[#E8E2D9]'
                                                    }`}
                                            >
                                                {a}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center gap-2 px-2">
                                <span className="w-6 h-6 bg-orange-500 text-white text-[10px] font-black rounded-full flex items-center justify-center shadow-lg shadow-orange-100">3</span>
                                <label className="text-xs font-black text-[#A89F94] uppercase tracking-widest">ひとこと（任意）</label>
                            </div>
                            <div className="relative">
                                <textarea
                                    placeholder="例：「豚肉が半額になってます！」「パンが大量に残ってます」など"
                                    className="w-full p-6 bg-white border border-[#E8E2D9] rounded-[2.5rem] font-bold outline-none h-32 resize-none focus:ring-2 focus:ring-orange-100 transition-all text-sm placeholder-[#D1C9BF] shadow-sm"
                                    value={comment}
                                    onChange={(e) => setComment(e.target.value)}
                                />
                                <RiChat3Line className="absolute bottom-6 right-6 text-orange-200" size={24} />
                            </div>
                        </div>
                    </div>

                    {/* Disclaimer Area */}
                    <div className="bg-orange-50/50 p-8 rounded-[2.5rem] border border-orange-100 space-y-4">
                        <div className="flex items-center gap-2 text-orange-600">
                            <RiInformationLine size={20} />
                            <span className="text-[10px] font-black uppercase tracking-widest">Nasu Premium Promise</span>
                        </div>
                        <p className="text-[11px] font-bold text-orange-800/60 leading-relaxed italic">
                            「情報は投稿時点のものです。売り切れの場合もあります」という注意書きが添えられます。安心して投稿してください。
                        </p>
                    </div>

                    <div className="pt-6 pb-20">
                        <button
                            disabled={loading || !image || !shopName}
                            className="w-full bg-gradient-to-r from-orange-600 to-amber-500 text-white py-6 rounded-full font-black text-xl shadow-2xl shadow-orange-100 active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:grayscale"
                        >
                            {loading ? <RiLoader4Line className="animate-spin text-2xl" /> : <><RiFlashlightLine /> 爆安セール情報を投稿</>}
                        </button>
                    </div>
                </form>
            </main>
        </div>
    );
}

const FormInput = ({ label, value, onChange, placeholder, type = "text", required = false, icon = null }: any) => (
    <div className="space-y-2">
        <label className="text-[10px] font-black text-[#A89F94] px-2 uppercase tracking-[0.2em] flex items-center gap-2">
            {icon} {label}
        </label>
        <input
            type={type}
            required={required}
            className="w-full p-5 bg-[#FDFCFD] border border-[#E8E2D9] rounded-[1.5rem] text-sm font-bold placeholder-[#D1C9BF] outline-none focus:ring-2 focus:ring-orange-100 transition-all"
            value={value}
            onChange={e => onChange(e.target.value)}
            placeholder={placeholder}
        />
    </div>
);
