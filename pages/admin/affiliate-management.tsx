import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, doc, updateDoc, increment, serverTimestamp } from 'firebase/firestore';
import { RiMoneyCnyCircleLine, RiBankCardLine, RiCheckLine, RiArrowLeftLine, RiUserStarLine } from 'react-icons/ri';

const AffiliateManagement = () => {
    const [partners, setPartners] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    // パートナー一覧の取得（is_affiliate が true のユーザー）
    const fetchAffiliates = async () => {
        setLoading(true);
        try {
            const q = query(collection(db, "users"), where("is_affiliate", "==", true));
            const querySnapshot = await getDocs(q); // 変数名を明確化
            const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setPartners(data);
        } catch (error) {
            console.error("データ取得エラー:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchAffiliates(); }, []);

    // 振込完了処理（3種類の報酬を合算してリセット）
    const handlePayout = async (partner: any) => {
        const total = (partner.affiliate_earned_general || 0) +
            (partner.affiliate_earned_ad || 0) +
            (partner.affiliate_earned_job || 0);

        if (total <= 0) return alert("振込対象の報酬がありません。");

        const confirmMsg = `${partner.displayName || '名無し'}様へ\n合計 ¥${total.toLocaleString()} の振込を完了しましたか？\n\n「OK」を押すと未払残高が0にリセットされます。`;

        if (!confirm(confirmMsg)) return;

        try {
            const userRef = doc(db, "users", partner.id);
            await updateDoc(userRef, {
                affiliate_earned_general: 0,
                affiliate_earned_ad: 0,
                affiliate_earned_job: 0,
                affiliate_paid_total: increment(total),
                lastPayoutAt: serverTimestamp()
            });
            alert("振込完了として処理しました。");
            fetchAffiliates(); // 一覧を再更新
        } catch (error) {
            alert("更新に失敗しました。");
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 antialiased pb-20">
            <Head><title>アフィリエイト報酬管理 | 管理画面</title></Head>

            <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
                <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
                    <button onClick={() => router.back()} className="flex items-center text-gray-500 font-bold">
                        <RiArrowLeftLine size={24} /> 戻る
                    </button>
                    <h1 className="text-xl font-black text-gray-800">🚀 アフィリエイト報酬一括管理</h1>
                    <div className="w-20"></div>
                </div>
            </header>

            <main className="max-w-6xl mx-auto px-6 mt-8">
                {loading ? (
                    <div className="text-center py-20 font-bold text-gray-400">読み込み中...</div>
                ) : (
                    <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-200">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-gray-800 text-white text-[12px] uppercase tracking-widest">
                                        <th className="p-5 font-black">紹介者・口座情報</th>
                                        <th className="p-5 font-black text-right">一般(40%)</th>
                                        <th className="p-5 font-black text-right">広告(40%)</th>
                                        <th className="p-5 font-black text-right">求人(40%)</th>
                                        <th className="p-5 font-black text-right bg-orange-600">未払合計</th>
                                        <th className="p-5 font-black text-center">操作</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {partners.map((p) => {
                                        const total = (p.affiliate_earned_general || 0) + (p.affiliate_earned_ad || 0) + (p.affiliate_earned_job || 0);
                                        return (
                                            <tr key={p.id} className="border-b border-gray-100 hover:bg-orange-50 transition-colors">
                                                <td className="p-5">
                                                    <div className="flex items-center gap-3 mb-2">
                                                        <RiUserStarLine className="text-orange-500" size={20} />
                                                        <span className="font-black text-gray-800 text-base">{p.displayName || '未設定'}</span>
                                                    </div>
                                                    {p.payout_info ? (
                                                        <div className="text-[11px] bg-gray-100 p-2 rounded-lg text-gray-600 leading-relaxed font-bold">
                                                            {p.payout_info.bankName} {p.payout_info.branchName}<br />
                                                            {p.payout_info.accountType} {p.payout_info.accountNumber}<br />
                                                            {p.payout_info.accountHolder}
                                                        </div>
                                                    ) : (
                                                        <span className="text-[10px] font-bold text-red-500 bg-red-50 px-2 py-1 rounded">口座未登録</span>
                                                    )}
                                                </td>
                                                <td className="p-5 text-right font-bold text-gray-600">¥{(p.affiliate_earned_general || 0).toLocaleString()}</td>
                                                <td className="p-5 text-right font-bold text-gray-600">¥{(p.affiliate_earned_ad || 0).toLocaleString()}</td>
                                                <td className="p-5 text-right font-bold text-gray-600">¥{(p.affiliate_earned_job || 0).toLocaleString()}</td>
                                                <td className="p-5 text-right font-black text-orange-600 text-xl bg-orange-50">
                                                    ¥{total.toLocaleString()}
                                                </td>
                                                <td className="p-5 text-center">
                                                    <button
                                                        onClick={() => handlePayout(p)}
                                                        disabled={total === 0}
                                                        className={`px-5 py-3 rounded-2xl font-black text-xs flex items-center justify-center gap-2 mx-auto transition shadow-md
                                                            ${total > 0 ? 'bg-teal-600 text-white hover:bg-teal-700 active:scale-95' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
                                                    >
                                                        <RiCheckLine size={18} /> 振込完了
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default AffiliateManagement;