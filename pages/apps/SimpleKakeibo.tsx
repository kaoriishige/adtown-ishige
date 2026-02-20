import { useState, useEffect } from 'react';
import { NextPage, GetServerSideProps } from 'next';
import Head from 'next/head';
import { useRouter } from 'next/router';
import nookies from 'nookies';
import { adminAuth } from '../../lib/firebase-admin';
import { collection, query, where, orderBy, addDoc, Timestamp, onSnapshot, doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase-client';
import * as LucideIcons from 'lucide-react';
import * as RiIcons from 'react-icons/ri';

// appId定義
declare const __app_id: string;
const appId = process.env.NEXT_PUBLIC_APP_ID || (typeof __app_id !== 'undefined' ? __app_id : 'default-app-id');

const SimpleKakeiboPage: NextPage<{ user: any }> = ({ user }) => {
    const router = useRouter();
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [entries, setEntries] = useState<any[]>([]);
    const [showAddModal, setShowAddModal] = useState(false);
    
    // 予算管理用ステート
    const [budget, setBudget] = useState<number>(0);
    const [showBudgetModal, setShowBudgetModal] = useState(false);
    const [inputBudget, setInputBudget] = useState('');
    
    // 入力用ステート
    const [inputAmount, setInputAmount] = useState('');
    const [inputCategory, setInputCategory] = useState('食費');
    const [inputItemName, setInputItemName] = useState(''); // "その他"選択時の項目名入力用 

    // Firestoreデータ取得
    useEffect(() => {
        if (!user?.uid) return;
        
        const entriesRef = collection(db, 'artifacts', appId, 'kakeibo_entries', user.uid, 'entries');
        
        // 月初と翌月初を計算
        const startOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
        const endOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1);

        const q = query(
            entriesRef,
            where('date', '>=', Timestamp.fromDate(startOfMonth)),
            where('date', '<', Timestamp.fromDate(endOfMonth))
        );

        return onSnapshot(q, (snapshot) => {
            const fetchedEntries = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                date: doc.data().date?.toDate() || new Date()
            }));
            // 日付順にソート (クライアントサイド)
            fetchedEntries.sort((a: any, b: any) => b.date - a.date);
            setEntries(fetchedEntries);
        });
    }, [user?.uid, currentMonth]);

    // 予算データ取得
    useEffect(() => {
        if (!user?.uid) return;
        const userDocRef = doc(db, 'artifacts', appId, 'kakeibo_entries', user.uid);
        getDoc(userDocRef).then(snap => {
            if (snap.exists()) {
                setBudget(snap.data().budget || 0);
            }
        });
    }, [user?.uid]);


    const totalExpense = entries
        .filter(e => e.type === 'expense')
        .reduce((sum, e) => sum + e.amount, 0);

    const remainingBudget = budget - totalExpense;
    // 節約額（＝予算残と同義だが、プラスなら節約できたとみなす）
    const savings = remainingBudget > 0 ? remainingBudget : 0;

    // データ追加
    const handleAddEntry = async () => {
        if (!user?.uid || !inputAmount) return;
        
        const amount = parseInt(inputAmount);
        if (isNaN(amount)) return;

    const entriesRef = collection(db, 'artifacts', appId, 'kakeibo_entries', user.uid, 'entries');
        
        let memo = inputCategory;
        if (inputCategory === 'その他' && inputItemName) {
            memo = inputItemName;
        }

        await addDoc(entriesRef, {
            userId: user.uid,
            date: Timestamp.now(),
            type: 'expense',
            amount,
            category: inputCategory,
            memo: memo, 
            createdAt: Timestamp.now()
        });
        
        setShowAddModal(false);
        setInputAmount('');
        setInputCategory('食費');
        setInputItemName('');
    };

    // 予算保存
    const handleSaveBudget = async () => {
        if (!user?.uid || !inputBudget) return;
        const newBudget = parseInt(inputBudget);
        if (isNaN(newBudget)) return;

        const userDocRef = doc(db, 'artifacts', appId, 'kakeibo_entries', user.uid);
        await setDoc(userDocRef, { budget: newBudget }, { merge: true });
        setBudget(newBudget);
        setShowBudgetModal(false);
        setInputBudget('');
    };

    return (
        <div className="bg-[#FFFDFC] min-h-screen">
            <Head><title>かんたん家計簿 - みんなのNasuアプリ</title></Head>

            {/* ヘッダー */}
            <header className="sticky top-0 z-50 p-6 bg-white/70 backdrop-blur-lg flex justify-between items-center border-b border-green-50">
                <button onClick={() => router.back()} className="flex items-center gap-2 text-green-500">
                    <RiIcons.RiArrowLeftLine size={24} />
                    <span className="font-bold text-sm">戻る</span>
                </button>
                <h1 className="text-lg font-black text-[#5D5757]">かんたん家計簿</h1>
                <div className="w-8" /> {/* スペーサー */}
            </header>

            <main className="p-6 space-y-6">
                {/* 月次サマリーカード */}
                <section className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-[3rem] p-8 border-2 border-white shadow-lg">
                    <div className="text-center">
                        <p className="text-[10px] font-black text-green-400 uppercase tracking-widest mb-2">
                            {currentMonth.getFullYear()}年{currentMonth.getMonth() + 1}月
                        </p>
                        <div className="flex justify-center items-baseline gap-2">
                            <span className="text-2xl font-bold text-green-500">¥</span>
                            <span className="text-5xl font-black text-[#5D5757]">
                                {totalExpense.toLocaleString()}
                            </span>
                        </div>
                        <p className="text-[11px] font-bold text-green-400 mt-2">今月の支出</p>

                        <div className="mt-4 flex justify-center gap-4 border-t border-green-100/50 pt-4">
                            <div className="text-center">
                                <p className="text-[9px] font-bold text-gray-400">予算</p>
                                <p className="text-sm font-black text-[#5D5757]">¥{budget.toLocaleString()}</p>
                            </div>
                            <div className="text-center">
                                <p className="text-[9px] font-bold text-blue-400">予算残</p>
                                <p className={`text-sm font-black ${remainingBudget < 0 ? 'text-red-400' : 'text-[#5D5757]'}`}>
                                    ¥{remainingBudget.toLocaleString()}
                                </p>
                            </div>
                        </div>

                        <button 
                            onClick={() => {
                                setInputBudget(budget.toString());
                                setShowBudgetModal(true);
                            }}
                            className="mt-4 text-[10px] font-bold text-green-500 bg-white/50 px-3 py-1 rounded-full border border-green-100"
                        >
                            予算を設定する
                        </button>
                    </div>

                    <div className="grid grid-cols-3 gap-3 mt-6">
                        <div className="bg-white/80 rounded-2xl p-4 text-center">
                            <p className="text-[11px] font-black text-green-400">食費</p>
                            <p className="text-lg font-black text-[#5D5757]">
                                ¥{entries.filter(e => e.category === '食費').reduce((sum, e) => sum + e.amount, 0).toLocaleString()}
                            </p>
                        </div>
                        <div className="bg-white/80 rounded-2xl p-4 text-center">
                            <p className="text-[11px] font-black text-blue-400">交通費</p>
                            <p className="text-lg font-black text-[#5D5757]">
                                ¥{entries.filter(e => e.category === '交通費').reduce((sum, e) => sum + e.amount, 0).toLocaleString()}
                            </p>
                        </div>
                        <div className="bg-white/80 rounded-2xl p-4 text-center">
                            <p className="text-[11px] font-black text-orange-400">その他</p>
                            <p className="text-lg font-black text-[#5D5757]">
                                ¥{entries.filter(e => e.category !== '食費' && e.category !== '交通費').reduce((sum, e) => sum + e.amount, 0).toLocaleString()}
                            </p>
                        </div>
                    </div>
                </section>

                {/* 入力ボタン */}
                <button
                    onClick={() => setShowAddModal(true)}
                    className="w-full py-6 bg-green-500 text-white rounded-3xl font-black text-lg shadow-xl flex items-center justify-center gap-3 active:scale-95 transition-all"
                >
                    <LucideIcons.Plus size={28} />
                    支出を記録する
                </button>

                {/* 最近の記録 */}
                <section className="space-y-4">
                    <h3 className="text-[11px] font-black text-gray-400 uppercase tracking-widest px-2">最近の記録</h3>
                    {entries.map(entry => (
                        <div key={entry.id} className="bg-white rounded-2xl p-5 border border-gray-100 flex justify-between items-center">
                            <div>
                                <p className="text-sm font-bold text-[#5D5757]">{entry.memo || entry.category}</p>
                                <p className="text-[10px] text-gray-400 mt-1">{entry.category}</p>
                            </div>
                            <p className="text-xl font-black text-[#5D5757]">¥{entry.amount.toLocaleString()}</p>
                        </div>
                    ))}
                </section>
            </main>

            {/* 入力モーダル(簡易版) */}
            {showAddModal && (
                <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-end">
                    <div className="bg-white rounded-t-[3rem] w-full p-8 space-y-6 animate-in slide-in-from-bottom duration-300">
                        <div className="flex justify-between items-center">
                            <h3 className="text-lg font-black text-[#5D5757]">支出を記録</h3>
                            <button onClick={() => setShowAddModal(false)} className="text-gray-300">
                                <RiIcons.RiCloseLine size={32} />
                            </button>
                        </div>
                        
                        <input
                            type="number"
                            placeholder="金額を入力"
                            className="w-full p-5 bg-gray-50 rounded-2xl text-2xl font-bold text-center"
                            value={inputAmount}
                            onChange={(e) => setInputAmount(e.target.value)}
                        />
                        
                        <select 
                            className="w-full p-5 bg-gray-50 rounded-2xl font-bold"
                            value={inputCategory}
                            onChange={(e) => setInputCategory(e.target.value)}
                        >
                            <option value="食費">食費</option>
                            <option value="交通費">交通費</option>
                            <option value="日用品">日用品</option>
                            <option value="その他">その他</option>
                        </select>

                        {inputCategory === 'その他' && (
                            <input
                                type="text"
                                placeholder="項目名を入力"
                                className="w-full p-5 bg-gray-50 rounded-2xl text-lg font-bold text-center animate-in slide-in-from-top duration-200"
                                value={inputItemName}
                                onChange={(e) => setInputItemName(e.target.value)}
                            />
                        )}

                        <button
                            onClick={handleAddEntry}
                            className="w-full py-5 bg-green-500 text-white rounded-2xl font-black text-lg shadow-xl active:scale-95 transition-all"
                        >
                            記録する
                        </button>
                    </div>
                </div>
            )}

            {/* 予算設定モーダル */}
            {showBudgetModal && (
                <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white rounded-[2rem] w-full max-w-sm p-8 space-y-6 animate-in zoom-in duration-200">
                         <div className="flex justify-between items-center">
                            <h3 className="text-lg font-black text-[#5D5757]">予算を設定</h3>
                            <button onClick={() => setShowBudgetModal(false)} className="text-gray-300">
                                <RiIcons.RiCloseLine size={32} />
                            </button>
                        </div>
                        
                        <div className="space-y-2">
                            <p className="text-xs font-bold text-gray-400">毎月の予算を入力してください</p>
                            <input
                                type="number"
                                placeholder="例: 50000"
                                className="w-full p-5 bg-gray-50 rounded-2xl text-2xl font-bold text-center"
                                value={inputBudget}
                                onChange={(e) => setInputBudget(e.target.value)}
                            />
                        </div>

                        <button
                            onClick={handleSaveBudget}
                            className="w-full py-5 bg-green-500 text-white rounded-2xl font-black text-lg shadow-xl active:scale-95 transition-all"
                        >
                            保存する
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export const getServerSideProps: GetServerSideProps = async (context) => {
    try {
        const cookies = nookies.get(context);
        const session = cookies.session || '';
        if (!session) return { redirect: { destination: '/users/login', permanent: false } };
        const token = await adminAuth.verifySessionCookie(session, true);
        return {
            props: {
                user: { uid: token.uid, email: token.email || null }
            }
        };
    } catch (err) {
        return { redirect: { destination: '/users/login', permanent: false } };
    }
};

export default SimpleKakeiboPage;
