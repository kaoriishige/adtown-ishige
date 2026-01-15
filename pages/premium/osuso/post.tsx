import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { db, auth } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, doc, getDoc, updateDoc } from 'firebase/firestore';
import {
    RiArrowLeftSLine,
    RiCamera2Fill,
    RiPlantLine,
    RiChat3Line,
    RiMapPin2Line,
    RiLineLine,
    RiShieldCheckFill,
    RiInformationLine,
    RiArrowRightSLine
} from 'react-icons/ri';
import Head from 'next/head';
import { OSUSO_AREAS, OSUSO_USER_TYPES, OSUSO_RULES } from '@/constants/osuso';

export default function OsusoPostPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [user, setUser] = useState<any>(null);
    const [nickname, setNickname] = useState('');
    const [preview, setPreview] = useState<string | null>(null);

    // Form State
    const [comment, setComment] = useState('');
    const [city, setCity] = useState(Object.keys(OSUSO_AREAS)[0]);
    const [district, setDistrict] = useState(OSUSO_AREAS[Object.keys(OSUSO_AREAS)[0] as keyof typeof OSUSO_AREAS][0]);
    const [method, setMethod] = useState('');
    const [userType, setUserType] = useState(OSUSO_USER_TYPES[0]);
    const [lineId, setLineId] = useState('');

    useEffect(() => {
        const fetchUser = async () => {
            const currentUser = auth.currentUser;
            if (!currentUser) {
                router.push('/users/login');
                return;
            }
            const userDoc = await getDoc(doc(db, "users", currentUser.uid));
            const userData = userDoc.data();
            if (userData) {
                setUser({ uid: currentUser.uid, ...userData });
                if (userData.nickname) setNickname(userData.nickname);
                if (userData.lineId) setLineId(userData.lineId);
            }
        };
        fetchUser();
    }, [router]);

    const handleCityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const selectedCity = e.target.value;
        setCity(selectedCity);
        setDistrict(OSUSO_AREAS[selectedCity as keyof typeof OSUSO_AREAS][0]);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!preview) return alert('写真を1枚追加してください');
        if (!comment || !method || !lineId) return alert('必須項目を入力してください');

        setLoading(true);
        try {
            await addDoc(collection(db, "osuso_posts"), {
                uid: user.uid,
                nickname: nickname || "那須のユーザー",
                comment,
                imageUrl: preview,
                area: `${city} ${district}`,
                method,
                userType,
                lineId,
                isVerified: user.isVerified || false,
                useCount: user.osusoCount || 0,
                createdAt: serverTimestamp(),
            });

            // Update user profile if nickname changed
            if (nickname && nickname !== user.nickname) {
                await updateDoc(doc(db, "users", user.uid), {
                    nickname: nickname
                });
            }

            router.push('/premium/osuso');
        } catch (error) {
            console.error(error);
            alert('投稿に失敗しました');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#FDFCFD] pb-32 font-sans text-[#4A3B3B]">
            <Head><title>おすそわけを出す | みんなのNasu おすそわけ畑</title></Head>

            <header className="bg-white/80 backdrop-blur-xl border-b border-[#E8E2D9] px-6 py-4 sticky top-0 z-50">
                <div className="max-w-xl mx-auto flex items-center justify-between">
                    <button onClick={() => router.back()} className="w-10 h-10 flex items-center justify-center rounded-full bg-[#FDFCFD] border border-[#E8E2D9] text-[#A89F94] active:scale-90 transition-all">
                        <RiArrowLeftSLine size={24} />
                    </button>
                    <div className="text-center">
                        <span className="text-[10px] tracking-[0.2em] uppercase text-emerald-600 block font-black">Nasu Osusowake</span>
                        <h1 className="text-sm font-black italic">おすそわけを出す</h1>
                    </div>
                    <div className="w-10" />
                </div>
            </header>

            <main className="max-w-xl mx-auto p-6 animate-in fade-in duration-700">
                {/* Concept Banner */}
                <div className="mb-10 text-center space-y-2">
                    <div className="inline-flex items-center gap-2 bg-emerald-50 px-4 py-2 rounded-full border border-emerald-100 mb-2">
                        <RiPlantLine className="text-emerald-500" />
                        <span className="text-[11px] font-black text-emerald-600 italic">みんなのNasu おすそわけ畑</span>
                    </div>
                    <h2 className="text-2xl font-black tracking-tight italic">出逢いだけ、つなぎます。</h2>
                    <p className="text-[11px] font-bold text-[#A89F94] leading-relaxed">
                        那須の畑と、台所をつなぐ掲示板。<br />
                        余った野菜や果物を、近所の誰かにお裾分けしましょう。
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-10">
                    {/* Photo Selection */}
                    <section className="space-y-4">
                        <SectionLabel label="おすそわけの写真 (1枚)" />
                        <div
                            onClick={() => setPreview('https://images.unsplash.com/photo-1592919016327-5192021be02a?q=80&w=800&auto=format&fit=crop')}
                            className="aspect-[16/10] bg-white border-2 border-dashed border-[#E8E2D9] rounded-[3rem] flex flex-col items-center justify-center cursor-pointer hover:bg-emerald-50/30 transition-all overflow-hidden relative group shadow-sm shadow-emerald-50"
                        >
                            {preview ? (
                                <img src={preview} alt="Preview" className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-700" />
                            ) : (
                                <>
                                    <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-400 mb-2 group-hover:rotate-12 transition-transform">
                                        <RiCamera2Fill size={32} />
                                    </div>
                                    <span className="text-[10px] font-black text-[#D1C9BF] uppercase tracking-widest">Tap to select photo</span>
                                </>
                            )}
                        </div>
                    </section>

                    {/* Form Fields */}
                    <div className="bg-white p-8 rounded-[3rem] border border-[#E8E2D9] shadow-sm space-y-8">
                        {/* User Type Tags */}
                        <div className="space-y-3">
                            <SectionLabel label="あなたはどなたですか？" />
                            <div className="flex gap-2">
                                {OSUSO_USER_TYPES.map(type => (
                                    <button
                                        key={type}
                                        type="button"
                                        onClick={() => setUserType(type)}
                                        className={`flex-1 py-4 rounded-2xl text-[11px] font-black transition-all ${userType === type
                                            ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-100'
                                            : 'bg-[#FDFCFD] text-[#A89F94] border border-[#E8E2D9]'}`}
                                    >
                                        {type}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-3">
                            <SectionLabel label="一言コメント" />
                            <div className="relative">
                                <textarea
                                    required
                                    placeholder="例：きゅうり余ってます！形は不揃いですが味は美味しいですよ。"
                                    className="w-full p-6 bg-[#FDFCFD] border border-[#E8E2D9] rounded-[2rem] text-sm font-bold outline-none h-40 resize-none focus:ring-2 focus:ring-emerald-100 transition-all placeholder-[#D1C9BF]"
                                    value={comment}
                                    onChange={e => setComment(e.target.value)}
                                />
                                <RiChat3Line className="absolute bottom-6 right-6 text-emerald-200" size={24} />
                            </div>
                        </div>

                        <div className="space-y-3">
                            <SectionLabel label="地域" />
                            <div className="grid grid-cols-2 gap-4">
                                <div className="relative">
                                    <select
                                        className="w-full p-4 bg-[#FDFCFD] border border-[#E8E2D9] rounded-2xl text-xs font-bold appearance-none outline-none focus:ring-2 focus:ring-emerald-100"
                                        value={city}
                                        onChange={handleCityChange}
                                    >
                                        {Object.keys(OSUSO_AREAS).map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                    <RiArrowRightSLine className="absolute right-4 top-1/2 -translate-y-1/2 text-[#A89F94] rotate-90" />
                                </div>
                                <div className="relative">
                                    <select
                                        className="w-full p-4 bg-[#FDFCFD] border border-[#E8E2D9] rounded-2xl text-xs font-bold appearance-none outline-none focus:ring-2 focus:ring-emerald-100"
                                        value={district}
                                        onChange={e => setDistrict(e.target.value)}
                                    >
                                        {OSUSO_AREAS[city as keyof typeof OSUSO_AREAS].map(d => <option key={d} value={d}>{d}</option>)}
                                    </select>
                                    <RiArrowRightSLine className="absolute right-4 top-1/2 -translate-y-1/2 text-[#A89F94] rotate-90" />
                                </div>
                            </div>
                        </div>

                        <FormInput
                            label="受け渡し方法"
                            value={method}
                            onChange={setMethod}
                            placeholder="例：畑まで取りに来てください / 〇〇駐車場で"
                            required
                            icon={<RiMapPin2Line className="text-emerald-500" />}
                        />

                        <div className="space-y-6 pt-4 border-t border-[#FDFCFD]">
                            <FormInput
                                label="ニックネーム (固定)"
                                value={nickname}
                                onChange={setNickname}
                                placeholder="例：なすっこ"
                                required
                            />

                            <div className="space-y-3">
                                <SectionLabel label="連絡先 LINE ID (公開されます)" />
                                <input
                                    required
                                    className="w-full p-4 bg-emerald-50/30 border border-emerald-100 rounded-2xl text-lg font-black tracking-widest text-[#4A3B3B] outline-none focus:ring-2 focus:ring-emerald-200"
                                    value={lineId}
                                    onChange={e => setLineId(e.target.value)}
                                    placeholder="LINE IDを入力"
                                />
                                <p className="text-[10px] font-bold text-emerald-600/60 leading-relaxed text-center italic mt-2">
                                    やり取り・お礼・金額などは当事者同士でご自由に
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* disclaimers */}
                    <div className="bg-rose-50/50 border border-rose-100 rounded-[2.5rem] p-8 space-y-4">
                        <div className="flex items-center gap-2 text-rose-500">
                            <RiInformationLine size={20} />
                            <span className="text-xs font-black uppercase tracking-widest">Caution & Rules</span>
                        </div>
                        <ul className="space-y-3">
                            {OSUSO_RULES.map((rule, i) => (
                                <li key={i} className="flex gap-3 text-[10px] font-bold text-rose-700/60 leading-relaxed italic">
                                    <span className="shrink-0">•</span>
                                    <span>{rule}</span>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className="pt-6 pb-20">
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-6 bg-[#4A3B3B] text-white rounded-full font-black text-lg shadow-2xl shadow-gray-200 active:scale-[0.98] transition-all disabled:opacity-50"
                        >
                            {loading ? "投稿処理中..." : "おすそわけを出す"}
                        </button>
                    </div>
                </form>
            </main>
        </div>
    );
}

const SectionLabel = ({ label }: { label: string }) => (
    <label className="text-[10px] font-black text-[#A89F94] px-2 uppercase tracking-[0.2em]">{label}</label>
);

const FormInput = ({ label, value, onChange, placeholder, type = "text", required = false, icon = null }: any) => (
    <div className="space-y-3">
        <label className="text-[10px] font-black text-[#A89F94] px-2 uppercase tracking-[0.2em] flex items-center gap-2">
            {icon} {label}
        </label>
        <input
            type={type}
            required={required}
            className="w-full p-5 bg-[#FDFCFD] border border-[#E8E2D9] rounded-2xl text-sm font-bold placeholder-[#D1C9BF] outline-none focus:ring-2 focus:ring-emerald-100 transition-all"
            value={value}
            onChange={e => onChange(e.target.value)}
            placeholder={placeholder}
        />
    </div>
);