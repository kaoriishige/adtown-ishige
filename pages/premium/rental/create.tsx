import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { db, auth } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, doc, getDoc } from 'firebase/firestore';
import { RiExchangeLine, RiCameraFill, RiMapPin2Fill, RiCalendarCheckLine, RiMoneyDollarCircleLine, RiHashtag, RiArrowLeftSLine } from 'react-icons/ri';
import Link from 'next/link';

const NASU_AREAS = ["那須塩原(黒磯)", "那須塩原(西那須野)", "那須塩原(塩原)", "大田原市", "那須町"];
const TEMPLATES = ["子供が使わなくなりました", "1回だけ使いました", "引越しで片付け中です"];

export default function RentalCreatePage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [itemName, setItemName] = useState("");
    const [content, setContent] = useState("");
    const [area, setArea] = useState(NASU_AREAS[0]);
    const [period, setPeriod] = useState(""); // 貸せる期間 (例: 1/10~1/12)
    const [returnDate, setReturnDate] = useState(""); // 返却日
    const [price, setPrice] = useState(""); // 料金 (無料or金額)
    const [place, setPlace] = useState(""); // 受け渡し場所
    const [lineId, setLineId] = useState("");
    const [imageUrl, setImageUrl] = useState("https://placehold.jp/24/cccccc/ffffff/400x300.png?text=No%20Image"); // 本来はstorageへ

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!itemName || !lineId || !returnDate) return alert("必須項目を入力してください");

        setLoading(true);
        try {
            const user = auth.currentUser;
            const userDoc = await getDoc(doc(db, "users", user!.uid));
            const userData = userDoc.data();

            await addDoc(collection(db, "rental_posts"), {
                uid: user!.uid,
                userName: userData?.name || "匿名",
                rentalCount: userData?.rentalCount || 0, // 利用回数バッジ
                itemName,
                content,
                area,
                period,
                returnDate,
                price: price || "無料",
                place,
                lineId,
                image: imageUrl,
                status: 'available',
                createdAt: serverTimestamp(),
            });
            router.push('/premium/rental');
        } catch (error) {
            alert("エラーが発生しました");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 pb-12">
            <header className="bg-white p-4 border-b flex items-center gap-4 sticky top-0 z-10">
                <Link href="/premium/rental" className="p-2 bg-gray-50 rounded-full"><RiArrowLeftSLine size={24}/></Link>
                <h1 className="font-black text-gray-800 flex items-center gap-2">
                    <RiExchangeLine className="text-blue-600" /> 使ってない貸します
                </h1>
            </header>

            <form onSubmit={handleSubmit} className="p-6 space-y-5 max-w-lg mx-auto">
                {/* 写真 (PDF P.5 必須) */}
                <div className="aspect-video w-full bg-gray-200 rounded-[2rem] flex flex-col items-center justify-center border-4 border-dashed border-gray-300 overflow-hidden relative">
                    <RiCameraFill size={40} className="text-gray-400" />
                    <p className="text-[10px] font-black text-gray-400 mt-2">写真1枚 (必須)</p>
                    <img src={imageUrl} className="absolute inset-0 w-full h-full object-cover opacity-50" alt="" />
                </div>

                <div>
                    <label className="text-[10px] font-black text-gray-400 ml-2">物の名前 (必須)</label>
                    <input required className="w-full p-4 bg-white rounded-2xl font-bold shadow-sm" 
                        value={itemName} onChange={(e)=>setItemName(e.target.value)} placeholder="例：ベビーカー" />
                </div>

                <div>
                    <label className="text-[10px] font-black text-gray-400 ml-2 mb-2 block tracking-widest">一言コメント</label>
                    <div className="flex flex-wrap gap-2 mb-3">
                        {TEMPLATES.map(tpl => (
                            <button key={tpl} type="button" onClick={() => setContent(tpl)} className="text-[9px] font-bold bg-white border border-gray-200 px-3 py-1.5 rounded-full hover:bg-blue-50 transition">{tpl}</button>
                        ))}
                    </div>
                    <textarea className="w-full p-4 bg-white rounded-2xl font-bold h-24 shadow-sm" 
                        value={content} onChange={(e)=>setContent(e.target.value)} placeholder="状態など" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="text-[10px] font-black text-gray-400 ml-2">地域</label>
                        <select className="w-full p-4 bg-white rounded-2xl font-bold shadow-sm appearance-none" 
                            value={area} onChange={(e)=>setArea(e.target.value)}>
                            {NASU_AREAS.map(a => <option key={a} value={a}>{a}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="text-[10px] font-black text-gray-400 ml-2">料金</label>
                        <input className="w-full p-4 bg-white rounded-2xl font-bold shadow-sm" 
                            value={price} onChange={(e)=>setPrice(e.target.value)} placeholder="無料 or 500円" />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="text-[10px] font-black text-gray-400 ml-2">貸せる期間</label>
                        <input className="w-full p-4 bg-white rounded-2xl font-bold shadow-sm text-sm" 
                            value={period} onChange={(e)=>setPeriod(e.target.value)} placeholder="例:1/10~1/12" />
                    </div>
                    <div>
                        <label className="text-[10px] font-black text-gray-400 ml-2 text-red-500">返却期限 (必須)</label>
                        <input required className="w-full p-4 bg-white rounded-2xl font-bold shadow-sm text-sm border-2 border-red-50" 
                            value={returnDate} onChange={(e)=>setReturnDate(e.target.value)} placeholder="例:1/12(金)" />
                    </div>
                </div>

                <div>
                    <label className="text-[10px] font-black text-gray-400 ml-2">受け渡し場所</label>
                    <input className="w-full p-4 bg-white rounded-2xl font-bold shadow-sm" 
                        value={place} onChange={(e)=>setPlace(e.target.value)} placeholder="例:ヨークベニマル駐車場" />
                </div>

                <div className="bg-blue-600 p-6 rounded-[2.5rem] shadow-xl">
                    <label className="text-xs font-black text-white flex items-center gap-1 mb-2">
                        <RiHashtag className="text-blue-300" /> 連絡先 LINE ID (有料会員のみ公開)
                    </label>
                    <input required className="w-full p-4 bg-white rounded-xl font-black text-center" 
                        value={lineId} onChange={(e)=>setLineId(e.target.value)} placeholder="IDを入力" />
                </div>

                <button disabled={loading} className="w-full bg-gray-900 text-white py-5 rounded-full font-black text-xl shadow-2xl active:scale-95 transition disabled:bg-gray-400">
                    {loading ? "送信中..." : "貸し出しを公開する"}
                </button>
            </form>
        </div>
    );
}