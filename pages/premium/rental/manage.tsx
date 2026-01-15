import React, { useState } from 'react';
import { db, auth } from '@/lib/firebase';
import { doc, updateDoc, increment, serverTimestamp } from 'firebase/firestore';
import { RiAlertFill, RiCheckboxCircleFill, RiTimeLine, RiInformationLine, RiHistoryLine } from 'react-icons/ri';

// PDF P.4-5 準拠：貸し借りトラブル防止ロジック
export default function RentalDetail({ post, isOwner }: { post: any, isOwner: boolean }) {
  const [loading, setLoading] = useState(false);

  // 貸し手が「返却完了」を押すことで初めて実績がつく（PDF P.6仕様）
  const handleCompleteReturn = async () => {
    if (!confirm("【最終確認】返却されましたか？この操作で募集が終了し、あなたの『利用回数実績』が＋1されます。")) return;
    
    setLoading(true);
    try {
      // 1. 投稿を完了ステータスへ
      await updateDoc(doc(db, "rental_posts", post.id), {
        status: 'returned',
        returnedAt: serverTimestamp()
      });

      // 2. 出品者の実績バッジを自動カウント (PDF P.6: 運営は何もしない)
      await updateDoc(doc(db, "users", post.uid), {
        rentalCount: increment(1)
      });

      alert("返却完了を確認しました。実績が更新されました。");
    } catch (e) {
      alert("エラーが発生しました。");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white min-h-screen">
      {/* 最重要：注意文の固定表示 (PDF P.4準拠) */}
      <div className="bg-red-50 p-4 border-b border-red-100 flex items-start gap-2">
        <RiAlertFill className="text-red-500 shrink-0 mt-1" />
        <p className="text-[10px] font-black text-red-700 leading-tight">
          【重要】個人間の貸し借りです。破損・紛失・返却遅延などのトラブルは、当事者間で解決してください。運営は一切の責任を負わず、仲裁も行いません。
        </p>
      </div>

      <div className="p-6 space-y-6">
        {/* ステータス表示 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="bg-blue-600 text-white text-[10px] px-3 py-1 rounded-full font-black">
              貸出中
            </span>
            <span className="text-[10px] text-gray-400 font-bold flex items-center gap-1">
              <RiTimeLine /> 返却期限: {post.returnDate}
            </span>
          </div>
          {/* PDF P.6: 利用回数バッジ */}
          <div className="text-blue-600 font-black text-[10px] flex items-center gap-1 bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
            <RiHistoryLine size={12}/> 実績 {post.rentalCount || 0}回
          </div>
        </div>

        {/* 貸し手情報の公開（LINE ID） */}
        <div className="bg-gray-900 rounded-[2.5rem] p-6 text-white shadow-2xl">
          <p className="text-[9px] font-black text-gray-400 mb-2 text-center tracking-widest uppercase">
            Contact LINE ID
          </p>
          <p className="text-3xl font-black text-center tracking-widest select-all mb-4">
            {post.lineId}
          </p>
          <div className="bg-white/10 p-4 rounded-2xl">
            <p className="text-[10px] font-bold text-gray-300 leading-relaxed italic">
              ※返却場所：{post.place}<br />
              ※このIDは有料会員にのみ表示されています。
            </p>
          </div>
        </div>

        {/* 貸し手本人にのみ表示される「返却完了」ボタン */}
        {isOwner && post.status !== 'returned' && (
          <div className="pt-6 border-t border-dashed">
            <p className="text-[11px] font-black text-gray-500 mb-3 px-2">
              【貸し手専用】無事に返却されたら押してください ↓
            </p>
            <button
              onClick={handleCompleteReturn}
              disabled={loading}
              className="w-full bg-green-600 text-white py-5 rounded-full font-black text-xl shadow-xl active:scale-95 transition"
            >
              {loading ? "処理中..." : "返却を確認・実績にする"}
            </button>
          </div>
        )}

        <div className="p-4 bg-gray-50 rounded-2xl">
          <div className="flex items-center gap-2 mb-2">
             <RiCheckboxCircleFill className="text-blue-500" />
             <span className="text-xs font-black">本人確認済み(SMS)</span>
          </div>
          <p className="text-[9px] text-gray-400 font-bold">
            「みんなのNasu」有料会員は電話番号認証済みです。
            トラブル時はこのニックネームで地域内で特定されるリスクがあるため、誠実な対応が求められます。
          </p>
        </div>
      </div>
    </div>
  );
}