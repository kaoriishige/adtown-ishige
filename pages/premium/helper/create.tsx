import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { db, auth } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, doc, getDoc, updateDoc } from 'firebase/firestore';
import {
    RiHandHeartLine,
    RiArrowLeftSLine,
    RiShieldCheckFill,
    RiInformationLine,
    RiTimeLine,
    RiMoneyDollarCircleLine,
    RiMapPin2Line,
    RiChat3Line,
    RiLineLine,
    RiCheckboxCircleLine,
    RiArrowRightSLine
} from 'react-icons/ri';
import Head from 'next/head';
import { HELPER_AREAS, HELPER_GENRES, HELPER_DURATION_OPTIONS, HELPER_FIXED_PHRASES } from '@/constants/helper';

export default function CreateHelperPost() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [user, setUser] = useState<any>(null);
    const [nickname, setNickname] = useState('');
    const [isVerified, setIsVerified] = useState(false);

    // Form State
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [genre, setGenre] = useState(Object.keys(HELPER_GENRES)[0]);
    const [subGenre, setSubGenre] = useState(HELPER_GENRES[Object.keys(HELPER_GENRES)[0] as keyof typeof HELPER_GENRES][0]);
    const [otherGenreInput, setOtherGenreInput] = useState('');
    const [city, setCity] = useState(Object.keys(HELPER_AREAS)[0]);
    const [district, setDistrict] = useState(HELPER_AREAS[Object.keys(HELPER_AREAS)[0] as keyof typeof HELPER_AREAS][0]);
    const [date, setDate] = useState('');
    const [duration, setDuration] = useState(HELPER_DURATION_OPTIONS[0]);
    const [reward, setReward] = useState('');
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
                setIsVerified(userData.isVerified === true || userData.subscriptionStatus === 'active');
            }
        };
        fetchUser();
    }, [router]);

    const handleGenreChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const selectedGenre = e.target.value;
        setGenre(selectedGenre);
        if (selectedGenre !== 'その他') {
            setSubGenre(HELPER_GENRES[selectedGenre as keyof typeof HELPER_GENRES][0]);
        } else {
            setSubGenre('その他');
        }
    };

    const handleCityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const selectedCity = e.target.value;
        setCity(selectedCity);
        setDistrict(HELPER_AREAS[selectedCity as keyof typeof HELPER_AREAS][0]);
    };

    const addFixedPhrase = (phrase: string) => {
        setContent(prev => prev ? `${prev}\n${phrase}` : phrase);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title || !content || !reward || !lineId || !date) {
            alert("必須項目を入力してください");
            return;
        }

        setLoading(true);
        try {
            const finalCategory = genre === 'その他'
                ? (otherGenreInput || 'その他')
                : `${genre} > ${subGenre}`;

            await addDoc(collection(db, "helper_posts"), {
                uid: user.uid,
                userName: nickname || "那須のユーザー",
                title,
                content,
                category: finalCategory,
                area: `${city} ${district}`,
                date,
                duration,
                reward,
                lineId,
                status: 'active',
                isVerified: true,
                usageCount: user.usageCount || 0,
                createdAt: serverTimestamp(),
            });

            if (nickname && nickname !== user.nickname) {
                await updateDoc(doc(db, "users", user.uid), {
                    nickname: nickname
                });
            }

            router.push('/premium/helper');
        } catch (error) {
            console.error(error);
            alert("投稿に失敗しました。");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#FDFCFD] pb-32 font-sans text-[#4A3B3B]">
            <Head><title>お手伝いをお願いする | みんなのNasu ちょい手伝い</title></Head>

            <header className="bg-white/80 backdrop-blur-xl border-b border-[#E8E2D9] px-6 py-4 sticky top-0 z-50">
                <div className="max-w-xl mx-auto flex items-center justify-between">
                    <button onClick={() => router.back()} className="w-10 h-10 flex items-center justify-center rounded-full bg-[#FDFCFD] border border-[#E8E2D9] text-[#A89F94] active:scale-90 transition-all">
                        <RiArrowLeftSLine size={24} />
                    </button>
                    <div className="text-center">
                        <span className="text-[10px] tracking-[0.2em] uppercase text-emerald-600 block font-black">Nasu Helper</span>
                        <h1 className="text-sm font-black italic">お手伝いを頼む</h1>
                    </div>
                    <div className="w-10" />
                </div>
            </header>

            <main className="max-w-xl mx-auto p-6 animate-in fade-in duration-700">
                {/* Concept Banner */}
                <div className="mb-10 text-center space-y-2">
                    <div className="inline-flex items-center gap-2 bg-emerald-50 px-4 py-2 rounded-full border border-emerald-100 mb-2">
                        <RiHandHeartLine className="text-emerald-500" />
                        <span className="text-[11px] font-black text-emerald-600 italic">みんなのNasu ちょい手伝い</span>
                    </div>
                    <h2 className="text-lg font-black tracking-tight">近所でちょっと、助け合い</h2>
                    <p className="text-[10px] font-bold text-[#A89F94] leading-relaxed">
                        「業者を呼ぶほどじゃないけれど、自分じゃしんどい」<br />
                        そんな用事を、近所の方に手伝ってもらいましょう。
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-10">
                    {/* Basic Info */}
                    <section className="space-y-6">
                        <SectionTitle icon={<RiInformationLine />} title="依頼の内容" />

                        <div className="space-y-6 bg-white p-8 rounded-[2.5rem] border border-[#E8E2D9] shadow-sm">
                            <FormInput
                                label="タイトル"
                                value={title}
                                onChange={setTitle}
                                placeholder="例：電球の交換をお願いしたいです"
                                required
                            />

                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-[#A89F94] px-2 uppercase tracking-[0.2em]">ジャンル</label>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="relative">
                                        <select
                                            className="w-full p-4 bg-[#FDFCFD] border border-[#E8E2D9] rounded-2xl text-xs font-bold appearance-none outline-none focus:ring-2 focus:ring-emerald-100"
                                            value={genre}
                                            onChange={handleGenreChange}
                                        >
                                            {Object.keys(HELPER_GENRES).map(g => <option key={g} value={g}>{g}</option>)}
                                            <option value="その他">その他</option>
                                        </select>
                                        <RiArrowRightSLine className="absolute right-4 top-1/2 -translate-y-1/2 text-[#A89F94] rotate-90" />
                                    </div>
                                    <div className="relative">
                                        {genre !== 'その他' ? (
                                            <>
                                                <select
                                                    className="w-full p-4 bg-[#FDFCFD] border border-[#E8E2D9] rounded-2xl text-xs font-bold appearance-none outline-none focus:ring-2 focus:ring-emerald-100"
                                                    value={subGenre}
                                                    onChange={e => setSubGenre(e.target.value)}
                                                >
                                                    {HELPER_GENRES[genre as keyof typeof HELPER_GENRES].map(sg => <option key={sg} value={sg}>{sg}</option>)}
                                                </select>
                                                <RiArrowRightSLine className="absolute right-4 top-1/2 -translate-y-1/2 text-[#A89F94] rotate-90" />
                                            </>
                                        ) : (
                                            <input
                                                className="w-full p-4 bg-[#FDFCFD] border border-[#E8E2D9] rounded-2xl text-xs font-bold outline-none focus:ring-2 focus:ring-emerald-100"
                                                placeholder="具体的なジャンルを入力"
                                                value={otherGenreInput}
                                                onChange={e => setOtherGenreInput(e.target.value)}
                                            />
                                        )}
                                    </div>
                                </div>
                                {genre === 'その他' && (
                                    <p className="text-[10px] font-bold text-emerald-600/70 mt-2 px-2 italic">
                                        ※「業者呼ぶほどじゃない用事」であれば何でも入力可能です。
                                    </p>
                                )}
                            </div>

                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-[#A89F94] px-2 uppercase tracking-[0.2em]">内容詳細</label>
                                <div className="relative">
                                    <textarea
                                        required
                                        placeholder="具体的な状況を書いてください（例：キッチンの高い場所の電球が切れてしまい、自分では届きません。）"
                                        className="w-full p-6 bg-[#FDFCFD] border border-[#E8E2D9] rounded-[2rem] text-sm font-bold outline-none h-40 resize-none focus:ring-2 focus:ring-emerald-100 transition-all placeholder-[#D1C9BF]"
                                        value={content}
                                        onChange={e => setContent(e.target.value)}
                                    />
                                    <RiChat3Line className="absolute bottom-6 right-6 text-emerald-200" size={24} />
                                </div>
                                <div className="flex flex-wrap gap-2 pt-1">
                                    {HELPER_FIXES_PHRASES.map(phrase => (
                                        <button
                                            key={phrase}
                                            type="button"
                                            onClick={() => addFixedPhrase(phrase)}
                                            className="px-3 py-1.5 bg-emerald-50 text-[10px] font-black text-emerald-600 rounded-full border border-emerald-100 active:scale-95 transition-all"
                                        >
                                            + {phrase}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Conditions */}
                    <section className="space-y-6">
                        <SectionTitle icon={<RiTimeLine />} title="日時と条件" />

                        <div className="space-y-6 bg-white p-8 rounded-[2.5rem] border border-[#E8E2D9] shadow-sm">
                            <FormInput
                                label="希望の日時"
                                type="text"
                                value={date}
                                onChange={setDate}
                                placeholder="例：1月15日(木) 10:00〜12:00の間"
                                required
                            />

                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-[#A89F94] px-2 uppercase tracking-[0.2em]">目安の時間（2時間以内）</label>
                                <div className="flex gap-2">
                                    {HELPER_DURATION_OPTIONS.map(opt => (
                                        <button
                                            key={opt}
                                            type="button"
                                            onClick={() => setDuration(opt)}
                                            className={`flex-1 py-4 rounded-2xl text-[11px] font-black transition-all ${duration === opt
                                                ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-100'
                                                : 'bg-[#FDFCFD] text-[#A89F94] border border-[#E8E2D9]'
                                                }`}
                                        >
                                            {opt}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <FormInput
                                label="謝礼（自由入力）"
                                value={reward}
                                onChange={setReward}
                                placeholder="例：500円 / お菓子とお茶で / 無料で"
                                required
                                icon={<RiMoneyDollarCircleLine className="text-emerald-500" />}
                            />

                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-[#A89F94] px-2 uppercase tracking-[0.2em]">場所</label>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="relative">
                                        <select
                                            className="w-full p-4 bg-[#FDFCFD] border border-[#E8E2D9] rounded-2xl text-xs font-bold appearance-none outline-none focus:ring-2 focus:ring-emerald-100"
                                            value={city}
                                            onChange={handleCityChange}
                                        >
                                            {Object.keys(HELPER_AREAS).map(c => <option key={c} value={c}>{c}</option>)}
                                        </select>
                                        <RiArrowRightSLine className="absolute right-4 top-1/2 -translate-y-1/2 text-[#A89F94] rotate-90" />
                                    </div>
                                    <div className="relative">
                                        <select
                                            className="w-full p-4 bg-[#FDFCFD] border border-[#E8E2D9] rounded-2xl text-xs font-bold appearance-none outline-none focus:ring-2 focus:ring-emerald-100"
                                            value={district}
                                            onChange={e => setDistrict(e.target.value)}
                                        >
                                            {HELPER_AREAS[city as keyof typeof HELPER_AREAS].map(d => <option key={d} value={d}>{d}</option>)}
                                        </select>
                                        <RiArrowRightSLine className="absolute right-4 top-1/2 -translate-y-1/2 text-[#A89F94] rotate-90" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Contact Info */}
                    <section className="space-y-6">
                        <SectionTitle icon={<RiLineLine />} title="連絡先" />

                        <div className="bg-white rounded-[2.5rem] p-8 border border-[#E8E2D9] space-y-6 shadow-sm">
                            <div className="space-y-6">
                                <FormInput
                                    label="ニックネーム (固定)"
                                    value={nickname}
                                    onChange={setNickname}
                                    placeholder="例：なすっこ"
                                    required
                                />

                                <div className="space-y-4 pt-2 px-2">
                                    <div className="flex items-center justify-between">
                                        <label className="text-[10px] font-black text-[#A89F94] uppercase tracking-[0.1em]">本人確認状況</label>
                                        <div className="flex items-center gap-1.5 text-emerald-500 font-black italic text-xs">
                                            <RiShieldCheckFill />
                                            <span>認証済み</span>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.1em]">連絡先 LINE ID (公開されます)</label>
                                        <input
                                            required
                                            className="w-full p-4 bg-emerald-50/30 border border-emerald-100 rounded-2xl text-lg font-black tracking-widest text-[#4A3B3B] outline-none focus:ring-2 focus:ring-emerald-200"
                                            value={lineId}
                                            onChange={e => setLineId(e.target.value)}
                                            placeholder="LINE IDを入力"
                                        />
                                        <p className="text-[9px] font-bold text-[#A89F94] italic px-1">
                                            ※「業者呼ぶほどじゃない用事」を、近所の助け合いで解決しましょう。
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    <section className="space-y-6">
                        <div className="flex items-center gap-3 px-2 text-rose-500">
                            <RiShieldCheckFill size={24} />
                            <div className="space-y-0.5">
                                <h3 className="text-sm font-black italic">近所でちょっと、助け合い</h3>
                                <p className="text-[10px] font-bold opacity-60">ご利用前に必ずお読みください</p>
                            </div>
                        </div>
                        <div className="bg-rose-50/30 border border-rose-100 rounded-[2.5rem] p-8 space-y-6">
                            <RuleItem
                                title="1. 業者の代わりではありません"
                                description="これはプロへの依頼ではなく、あくまで近所同士の助け合いです。専門的な技術や高い完成度を求める内容はご遠慮ください。"
                            />
                            <RuleItem
                                title="2. 個人間のやり取りです（運営は介入しません）"
                                description="やり取り・作業・金銭授受に関するトラブルはすべて当事者同士で解決してください。運営は一切の責任・関与を行いません。"
                            />
                            <RuleItem
                                title="3. 有料会員同士の掲示板です"
                                description="投稿・連絡は有料会員（本人確認済み）のみが行えます。地域の一員として、責任ある行動をお願いします。"
                            />
                            <RuleItem
                                title="4. 簡単な作業のみを想定しています"
                                description="本サービスは、「電球を替えてほしい」「雪かき少し」「荷物運び」などの短時間・軽作業レベルの助け合いを想定しています。※継続的な作業・重労働・専門作業はご遠慮ください。"
                            />
                            <RuleItem
                                title="5. LINEで直接やり取りしてください"
                                description="投稿を見た方は、自分のLINEから直接連絡してください。日程調整・内容確認などは個別に丁寧に行ってください。"
                            />
                            <RuleItem
                                title="6. 完了報告のお願い"
                                description="お手伝いが終わったら、依頼者は必ず「完了」ボタンを押してください。実績としてプロフィールに反映されます。"
                            />
                            <RuleItem
                                title="7. 安全のために"
                                description="自宅での作業、夜間の対応、密室でのやり取りには十分注意してください。少しでも不安を感じた場合は、無理に引き受けず断ってください。"
                            />
                        </div>
                    </section>

                    {/* Bottom CTA */}
                    <div className="pt-6 pb-20">
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-6 bg-[#4A3B3B] text-white rounded-full font-black text-lg shadow-2xl shadow-gray-200 active:scale-[0.98] transition-all disabled:opacity-50"
                        >
                            {loading ? "投稿処理中..." : "上記の内容で投稿を完了する"}
                        </button>
                        <div className="text-center mt-6">
                            <p className="text-[10px] font-bold text-[#D1C9BF] uppercase tracking-[0.3em] leading-relaxed italic">
                                Neighborly Help-out Board. <br />
                                Management does not intervene.
                            </p>
                        </div>
                    </div>
                </form>
            </main>
        </div>
    );
}

const SectionTitle = ({ icon, title }: { icon: any, title: string }) => (
    <div className="flex items-center gap-2 px-2">
        <span className="text-emerald-500">{icon}</span>
        <label className="text-xs font-black text-[#A89F94] uppercase tracking-widest">{title}</label>
    </div>
);

const FormInput = ({ label, value, onChange, placeholder, type = "text", required = false, icon = null }: any) => (
    <div className="space-y-2">
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

const RuleItem = ({ title, description }: { title: string, description: string }) => (
    <div className="space-y-1">
        <p className="text-[11px] font-black text-[#4A3B3B] flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-rose-400 rounded-full"></span>
            {title}
        </p>
        <p className="text-[10px] font-bold text-[#8C8479] leading-relaxed pl-4">
            {description}
        </p>
    </div>
);

const HELPER_FIXES_PHRASES = ["一人では大変で…", "30分くらいで終わります", "力仕事です"];