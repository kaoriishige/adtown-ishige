import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { db, auth } from '../../../lib/firebase';
import { collection, addDoc, Timestamp, doc, getDoc } from 'firebase/firestore';
import {
    RiFileList3Line,
    RiExchangeFundsLine,
    RiMapPinLine,
    RiLineLine,
    RiCheckboxCircleLine
} from 'react-icons/ri';

const AREAS = {
    "那須塩原市": ["黒磯地区", "西那須野地区", "塩原地区"],
    "大田原市": ["大田原地区", "金田地区", "親園地区", "野崎地区", "佐久山地区", "湯津上地区", "黒羽地区", "川西地区"],
    "那須町": ["黒田原地区", "那須高原地区", "那須湯本地区", "芦野・伊王野地区"]
};


export default function SkillCreate() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [user, setUser] = useState<any>(null);

    const [formData, setFormData] = useState({
        type: 'provide', // provide | request
        title: '',
        description: '',
        conditions: '',
        rewardType: 'both', // cash | barter | both
        rewardDetail: '',
        city: '那須塩原市',
        district: '黒磯',
        lineId: ''
    });

    useEffect(() => {
        const fetchUser = async () => {
            const currentUser = auth.currentUser;
            if (!currentUser) {
                router.push('/users/login');
                return;
            }
            const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
            const userData = userDoc.data();
            if (!userData || userData.subscriptionStatus !== 'active') {
                alert('この機能は有料会員専用です');
                router.push('/premium');
                return;
            }
            setUser({ uid: currentUser.uid, ...userData });
            if (userData.lineId) {
                setFormData(prev => ({ ...prev, lineId: userData.lineId }));
            }
        };
        fetchUser();
    }, [router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.title || !formData.description || !formData.rewardDetail || !formData.lineId) {
            alert('必須項目を入力してください');
            return;
        }

        setLoading(true);
        try {
            await addDoc(collection(db, 'skill_posts'), {
                uid: user.uid,
                userName: user.nickname || '那須のユーザー',
                type: formData.type,
                title: formData.title,
                description: formData.description,
                conditions: formData.conditions,
                rewardType: formData.rewardType,
                rewardDetail: formData.rewardDetail,
                area: `${formData.city} ${formData.district}`,
                lineId: formData.lineId,
                status: 'active',
                createdAt: Timestamp.now()
            });

            router.push('/premium/skill');
        } catch (error) {
            console.error(error);
            alert('投稿に失敗しました');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 p-6 text-slate-800">
            <form
                onSubmit={handleSubmit}
                className="max-w-2xl mx-auto space-y-10 bg-white p-10 rounded-3xl shadow-sm border border-slate-200"
            >
                <header className="border-b border-slate-100 pb-6">
                    <h1 className="text-2xl font-black italic flex items-center gap-2">
                        <RiFileList3Line /> 那須スキル交換所：新規掲載
                    </h1>
                    <p className="text-xs text-slate-400 mt-2">
                        技術・時間・経験を、正当に流通させる掲示板です。
                    </p>
                </header>

                {/* 種別 */}
                <div className="flex gap-4">
                    {['provide', 'request'].map((t) => (
                        <button
                            key={t}
                            type="button"
                            onClick={() => setFormData({ ...formData, type: t })}
                            className={`flex-1 py-4 rounded-xl text-sm font-black transition-all ${formData.type === t
                                ? 'bg-slate-900 text-white shadow-lg'
                                : 'bg-slate-100 text-slate-400'
                                }`}
                        >
                            {t === 'provide' ? 'スキル提供（できます）' : 'スキル依頼（求む）'}
                        </button>
                    ))}
                </div>

                {/* タイトル */}
                <div className="space-y-2">
                    <label className="text-xs uppercase tracking-widest text-slate-400">案件名</label>
                    <input
                        required
                        placeholder="例：草刈り・庭の整備できます"
                        className="w-full p-4 bg-slate-50 rounded-xl border-none focus:ring-2 ring-slate-200"
                        value={formData.title}
                        onChange={e => setFormData({ ...formData, title: e.target.value })}
                    />
                </div>

                {/* 内容 */}
                <div className="space-y-2">
                    <label className="text-xs uppercase tracking-widest text-slate-400">内容詳細</label>
                    <textarea
                        required
                        placeholder="作業内容・対応範囲などを具体的に記載してください"
                        className="w-full p-4 bg-slate-50 rounded-xl border-none h-32"
                        value={formData.description}
                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                    />
                </div>

                {/* 条件 */}
                <div className="space-y-2">
                    <label className="text-xs uppercase tracking-widest text-slate-400">条件・対応可能日時</label>
                    <textarea
                        placeholder="例：土日のみ対応可 / 1〜2時間程度"
                        className="w-full p-4 bg-slate-50 rounded-xl border-none h-24"
                        value={formData.conditions}
                        onChange={e => setFormData({ ...formData, conditions: e.target.value })}
                    />
                </div>

                {/* 報酬 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-xs uppercase tracking-widest text-slate-400">報酬区分</label>
                        <select
                            className="w-full p-4 bg-slate-50 rounded-xl border-none font-bold"
                            value={formData.rewardType}
                            onChange={e => setFormData({ ...formData, rewardType: e.target.value })}
                        >
                            <option value="both">現金・物々交換どちらでも可</option>
                            <option value="cash">現金のみ</option>
                            <option value="barter">物々交換のみ</option>
                        </select>
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs uppercase tracking-widest text-slate-400">報酬内容</label>
                        <input
                            required
                            placeholder="例：3,000円 / 米10kg / 野菜と交換"
                            className="w-full p-4 bg-slate-50 rounded-xl border-none font-bold"
                            value={formData.rewardDetail}
                            onChange={e => setFormData({ ...formData, rewardDetail: e.target.value })}
                        />
                    </div>
                </div>

                {/* 地域 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-xs uppercase tracking-widest text-slate-400 flex items-center gap-1">
                            <RiMapPinLine /> 市町
                        </label>
                        <select
                            className="w-full p-4 bg-slate-50 rounded-xl border-none font-bold"
                            value={formData.city}
                            onChange={e =>
                                setFormData({
                                    ...formData,
                                    city: e.target.value,
                                    district: AREAS[e.target.value as keyof typeof AREAS][0]
                                })
                            }
                        >
                            {Object.keys(AREAS).map(city => (
                                <option key={city} value={city}>{city}</option>
                            ))}
                        </select>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs uppercase tracking-widest text-slate-400">地区</label>
                        <select
                            className="w-full p-4 bg-slate-50 rounded-xl border-none font-bold"
                            value={formData.district}
                            onChange={e => setFormData({ ...formData, district: e.target.value })}
                        >
                            {AREAS[formData.city as keyof typeof AREAS].map(d => (
                                <option key={d} value={d}>{d}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* LINE ID */}
                <div className="space-y-2">
                    <label className="text-xs uppercase tracking-widest text-slate-400 flex items-center gap-1">
                        <RiLineLine /> 連絡先（LINE IDのみ）
                    </label>
                    <input
                        required
                        placeholder="LINE IDを入力（アプリ内メッセージは使用しません）"
                        className="w-full p-4 bg-slate-50 rounded-xl border-none font-bold tracking-wider"
                        value={formData.lineId}
                        onChange={e => setFormData({ ...formData, lineId: e.target.value })}
                    />
                    <p className="text-[11px] text-slate-400">
                        ※ 本サービスでは、当事者同士で直接連絡を取っていただきます。
                    </p>
                </div>

                {/* 送信 */}
                <button
                    disabled={loading}
                    className="w-full py-6 bg-slate-900 text-white rounded-2xl font-black text-lg flex items-center justify-center gap-3 active:scale-95 transition-all shadow-xl disabled:opacity-50"
                >
                    {loading ? 'PROCESSING...' : <>
                        <RiCheckboxCircleLine size={24} /> この内容で公開する
                    </>}
                </button>
            </form>
        </div>
    );
}
