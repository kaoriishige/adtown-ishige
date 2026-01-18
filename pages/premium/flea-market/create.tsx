import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { db, auth, storage } from '@/lib/firebase';
import { doc, getDoc, addDoc, collection, serverTimestamp, updateDoc } from 'firebase/firestore';
import {
    RiArrowLeftSLine,
    RiCamera2Fill,
    RiShieldCheckFill,
    RiInformationLine,
    RiMapPin2Fill,
    RiArrowRightSLine
} from 'react-icons/ri';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import Head from 'next/head';

const AREAS = {
    "那須塩原市": ["黒磯地区", "西那須野地区", "塩原地区"],
    "大田原市": ["大田原地区", "金田地区", "親園地区", "野崎地区", "佐久山地区", "湯津上地区", "黒羽地区", "川西地区"],
    "那須町": ["黒田原地区", "那須高原地区", "那須湯本地区", "芦野・伊王野地区"]
};

const CATEGORIES = [
    "子供・子育て",
    "生活・家電",
    "家具・収納",
    "アウトドア",
    "季節物",
    "その他"
];

const DESCRIPTIONS = {
    "子供・子育て": "ベビーカー、チャイルドシート、おもちゃ、ベビー服など",
    "生活・家電": "炊飯器、電子レンジ、掃除機、扇風機など",
    "家具・収納": "棚、机、イス、衣装ケースなど",
    "アウトドア": "テント、BBQ用品、イス、テーブルなど",
    "季節物": "ストーブ、ファンヒーター、扇風機、こたつなど",
    "その他": "上記に当てはまらない不用品など"
};

export default function CreateFurimaPost() {
    const router = useRouter();
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    const [title, setTitle] = useState('');
    const [nickname, setNickname] = useState('');
    const [category, setCategory] = useState(CATEGORIES[0]);
    const [otherCategoryInput, setOtherCategoryInput] = useState('');
    const [price, setPrice] = useState('');
    const [area, setArea] = useState(AREAS["那須塩原市"][0]);
    const [location, setLocation] = useState('');
    const [description, setDescription] = useState('');
    const [lineId, setLineId] = useState('');
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState('');

    useEffect(() => {
        const fetchUser = async () => {
            const currentUser = auth.currentUser;
            if (!currentUser) { router.push('/users/login'); return; }
            const userDoc = await getDoc(doc(db, "users", currentUser.uid));
            const userData = userDoc.data();

            // 有料会員チェック
            const isPaid = userData?.isPaid === true || userData?.subscriptionStatus === 'active';
            if (!isPaid) {
                alert("Nasuフリマの投稿には有料会員登録が必要です。");
                router.push('/premium');
                return;
            }

            setUser({ uid: currentUser.uid, ...userData });
            if (userData.lineId) setLineId(userData.lineId);
            if (userData.nickname) setNickname(userData.nickname);
        };
        fetchUser();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!imageFile) {
            alert("お写真を1枚追加してください");
            return;
        }
        if (!lineId) {
            alert("連絡用のLINE IDを入力してください");
            return;
        }

        setLoading(true);
        try {
            let imageUrl = "";
            const storageRef = ref(storage, `furima/${user.uid}_${Date.now()}`);
            await uploadBytes(storageRef, imageFile);
            imageUrl = await getDownloadURL(storageRef);

            await addDoc(collection(db, "furima_posts"), {
                uid: user.uid,
                userName: nickname || user.nickname || "那須のユーザー",
                title,
                category: category === 'その他' ? otherCategoryInput : category,
                price: Number(price),
                area,
                location,
                description,
                lineId,
                image: imageUrl,
                status: 'active',
                isVerified: true, // アプリ登録者は自動的に本人確認済み
                userUsageCount: user.usageCount || 0,
                createdAt: serverTimestamp(),
            });

            // ニックネームをユーザー情報にも保存（固定化）
            if (nickname && nickname !== user.nickname) {
                await updateDoc(doc(db, "users", user.uid), {
                    nickname: nickname
                });
            }

            router.push('/premium/flea-market');
        } catch (error) {
            console.error(error);
            alert("投稿に失敗しました。時間をおいて再度お試しください。");
        } finally {
            setLoading(false);
        }
    };

    if (!user) return null;

    return (
        <div className="min-h-screen bg-[#FDFCFD] pb-32 font-sans text-[#4A3B3B]">
            <Head><title>出品する | みんなのNasuフリマ</title></Head>

            <header className="bg-white/80 backdrop-blur-xl border-b border-[#E8E2D9] px-6 py-4 sticky top-0 z-50">
                <div className="max-w-xl mx-auto flex items-center justify-between">
                    <button onClick={() => router.back()} className="w-10 h-10 flex items-center justify-center rounded-full bg-[#FDFCFD] border border-[#E8E2D9] text-[#A89F94] active:scale-90 transition-all">
                        <RiArrowLeftSLine size={24} />
                    </button>
                    <div className="text-center">
                        <span className="text-[10px] tracking-[0.3em] uppercase text-[#A89F94] block font-bold">New Post</span>
                        <h1 className="text-sm font-black italic">みんなのNasuフリマに出品</h1>
                    </div>
                    <div className="w-10"></div>
                </div>
            </header>

            <main className="max-w-xl mx-auto px-6 pt-10">
                <form onSubmit={handleSubmit} className="space-y-10">

                    {/* Disclaimer Banner */}
                    <div className="bg-pink-50 rounded-2xl p-4 border border-pink-100 flex gap-3 items-start animate-in fade-in slide-in-from-top-4 duration-700">
                        <RiInformationLine className="text-pink-500 mt-0.5 shrink-0" size={20} />
                        <p className="text-[11px] font-bold text-pink-700 leading-relaxed">
                            個人間取引です。トラブルは当事者間で解決してください。運営は一切の責任を負わず、仲裁も行いません。
                        </p>
                    </div>

                    {/* Photo Upload: 必須 */}
                    <section className="space-y-4">
                        <div
                            onClick={() => document.getElementById('img-upload')?.click()}
                            className="relative aspect-square bg-[#F3F0EC]/30 rounded-[2.5rem] border-2 border-dashed border-[#E8E2D9] overflow-hidden flex flex-col items-center justify-center group cursor-pointer transition-all hover:bg-white"
                        >
                            {previewUrl ? (
                                <img src={previewUrl} className="w-full h-full object-cover" />
                            ) : (
                                <div className="text-center group-hover:scale-110 transition-transform duration-500">
                                    <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                                        <RiCamera2Fill size={28} className="text-pink-400" />
                                    </div>
                                    <p className="text-xs font-black text-[#A89F94] tracking-widest">お写真を1枚追加</p>
                                    <p className="text-[9px] text-[#D1C9BF] mt-1 italic">※必須項目です</p>
                                </div>
                            )}
                            <input type="file" id="img-upload" hidden accept="image/*" onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) { setImageFile(file); setPreviewUrl(URL.createObjectURL(file)); }
                            }} />
                        </div>
                    </section>

                    {/* Input Fields */}
                    <div className="space-y-8">
                        <FormInput label="タイトル" value={title} onChange={setTitle} placeholder="例：炊飯器 3合炊き" required />

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-[#A89F94] px-2 uppercase tracking-[0.2em]">カテゴリー</label>
                            <div className="relative">
                                <select
                                    className="w-full p-5 bg-white border border-[#E8E2D9] rounded-3xl text-sm font-bold appearance-none outline-none focus:ring-2 focus:ring-pink-100"
                                    value={category}
                                    onChange={e => setCategory(e.target.value)}
                                >
                                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                                <RiArrowRightSLine className="absolute right-5 top-1/2 -translate-y-1/2 text-[#A89F94] rotate-90" />
                            </div>

                            {category === 'その他' && (
                                <div className="space-y-2 mt-4 animate-in fade-in duration-300">
                                    <label className="text-[10px] font-black text-pink-500 px-2 uppercase tracking-[0.1em]">カテゴリー名を入力</label>
                                    <input
                                        required
                                        className="w-full p-4 bg-white border border-[#E8E2D9] rounded-3xl text-sm font-bold outline-none focus:ring-2 focus:ring-pink-100"
                                        value={otherCategoryInput}
                                        onChange={e => setOtherCategoryInput(e.target.value)}
                                        placeholder="例：車のパーツ、チケット類など"
                                    />
                                </div>
                            )}

                            <p className="text-[10px] font-bold text-[#A89F94] px-2 italic pt-2">
                                {category === 'その他' ? "具体的なカテゴリー名を入力してください" : DESCRIPTIONS[category as keyof typeof DESCRIPTIONS]}
                            </p>
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                            <FormInput
                                label="価格 (0円の場合は無料と表示)"
                                type="tel"
                                value={price}
                                onChange={setPrice}
                                placeholder="例：3000"
                                required
                            />
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-[#A89F94] px-2 uppercase tracking-[0.2em]">地域</label>
                                <div className="relative">
                                    <select
                                        className="w-full p-5 bg-white border border-[#E8E2D9] rounded-3xl text-sm font-bold appearance-none outline-none"
                                        value={area}
                                        onChange={e => setArea(e.target.value)}
                                    >
                                        {Object.entries(AREAS).map(([city, districts]) => (
                                            <optgroup key={city} label={city}>
                                                {districts.map(d => (
                                                    <option key={d} value={`${city} ${d}`}>{d}</option>
                                                ))}
                                            </optgroup>
                                        ))}
                                    </select>
                                    <RiArrowRightSLine className="absolute right-5 top-1/2 -translate-y-1/2 text-[#A89F94] rotate-90" />
                                </div>
                            </div>
                        </div>

                        <FormInput
                            label="受け渡し場所"
                            value={location}
                            onChange={setLocation}
                            placeholder="例：スーパー〇〇 駐車場にて"
                            required
                            icon={<RiMapPin2Fill className="text-pink-400" />}
                        />

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-[#A89F94] px-2 uppercase tracking-[0.2em]">補足コメント (任意)</label>
                            <textarea
                                className="w-full h-32 p-5 bg-white border border-[#E8E2D9] rounded-3xl text-sm font-bold outline-none focus:ring-2 focus:ring-pink-100 leading-relaxed"
                                value={description}
                                onChange={e => setDescription(e.target.value)}
                                placeholder="例：子供が使わなくなりました。まだ綺麗です。"
                            />
                        </div>

                        <div className="bg-white rounded-[2.5rem] p-8 border border-[#E8E2D9] space-y-6 shadow-sm">
                            <h3 className="flex items-center gap-2 text-[10px] font-black tracking-[0.2em] text-[#A89F94] uppercase">
                                <RiShieldCheckFill className="text-pink-400" /> Seller Info
                            </h3>
                            <div className="space-y-6">
                                <FormInput
                                    label="ニックネーム (固定)"
                                    value={nickname}
                                    onChange={setNickname}
                                    placeholder="例：なすっこ"
                                    required
                                />
                                <div className="flex items-center justify-between px-2 border-t border-[#F3F0EC] pt-4">
                                    <span className="text-[10px] font-bold text-[#A89F94]">本人確認状況</span>
                                    <span className="text-xs font-black text-emerald-500 flex items-center gap-1">
                                        <RiShieldCheckFill /> 認証済み
                                    </span>
                                </div>
                                <div className="space-y-2 pt-2">
                                    <label className="text-[10px] font-black text-pink-500 px-2 uppercase tracking-[0.1em]">連絡先 LINE ID (公開されます)</label>
                                    <input
                                        required
                                        className="w-full p-4 bg-pink-50/30 border border-pink-100 rounded-2xl text-lg font-black tracking-widest text-[#4A3B3B] outline-none focus:ring-2 focus:ring-pink-200"
                                        value={lineId}
                                        onChange={e => setLineId(e.target.value)}
                                        placeholder="LINE IDを入力"
                                    />
                                    <p className="text-[9px] font-bold text-[#A89F94] px-2 italic">
                                        ※購入を希望する有料会員にのみ、このIDが表示されます。
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Rules & Precautions Section */}
                    <section className="bg-white rounded-[2.5rem] p-8 border border-[#E8E2D9] space-y-6 shadow-sm border-t-4 border-t-pink-400">
                        <div className="flex items-center gap-3">
                            <RiInformationLine className="text-pink-500" size={24} />
                            <h3 className="text-sm font-black italic">出品時の大切なお知らせ</h3>
                        </div>
                        <div className="space-y-6">
                            <RuleItem
                                title="1. 個人間取引・自己責任です"
                                description="本サービスは出会いの場を提供する掲示板です。取引・金銭のやり取り・トラブル対応はすべて当事者同士で行ってください。運営は一切関与しません。"
                            />
                            <RuleItem
                                title="2. 直接の受け渡し限定"
                                description="発送（メルカリ便等）はトラブル防止のため禁止です。スーパーの駐車場や駅など、人目の多い場所で待ち合わせをしてください。"
                            />
                            <RuleItem
                                title="3. その場で商品を確認"
                                description="代金を受け取る前に、必ず商品の状態を相手に確認してもらってください。「後から不備が見つかった」というトラブルを避けるためです。"
                            />
                            <RuleItem
                                title="4. 支払いはその場で直接"
                                description="事前の銀行振込・送金は絶対にしないでください。商品と引き換えに、その場で現金またはその場決済のみとしてください。"
                            />
                            <RuleItem
                                title="5. 返品・クレーム不可"
                                description="個人間取引のため、返品・返金・クレーム対応はできません。その場で納得してもらうことが取引完了の条件です。"
                            />
                            <RuleItem
                                title="6. 会員同士のマナー"
                                description="ドタキャン・音信不通・迷惑行為は通報の対象となります。ニックネームは固定されており、地域の一員として責任ある行動をお願いします。"
                            />
                            <RuleItem
                                title="7. 安全のために"
                                description="自宅への招待、夜間の取引、未成年のみでの受け渡しは避けてください。不安を感じた場合は、無理に取引をしないでください。"
                            />
                        </div>
                    </section>

                    {/* Submit Section */}
                    <div className="pt-10 pb-20 space-y-6">
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-6 bg-[#4A3B3B] text-white rounded-full font-black text-lg shadow-2xl shadow-gray-200 active:scale-[0.98] transition-all disabled:opacity-50"
                        >
                            {loading ? "出品処理中..." : "上記の内容で出品を完了する"}
                        </button>
                        <div className="text-center space-y-2">
                            <p className="text-[10px] font-bold text-[#D1C9BF] uppercase tracking-[0.3em] leading-relaxed italic">
                                Handover only. Individual community. <br />
                                Management does not intervene.
                            </p>
                        </div>
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
            className="w-full p-5 bg-white border border-[#E8E2D9] rounded-3xl text-sm font-bold placeholder-[#D1C9BF] outline-none focus:ring-2 focus:ring-pink-100 transition-all"
            value={value}
            onChange={e => onChange(e.target.value)}
            placeholder={placeholder}
        />
    </div>
);

const RuleItem = ({ title, description }: { title: string, description: string }) => (
    <div className="space-y-1">
        <p className="text-xs font-black text-[#4A3B3B] flex items-center gap-2">
            <span className="w-1 h-1 bg-pink-500 rounded-full"></span>
            {title}
        </p>
        <p className="text-[10px] font-bold text-[#8C8479] leading-relaxed pl-3">
            {description}
        </p>
    </div>
);