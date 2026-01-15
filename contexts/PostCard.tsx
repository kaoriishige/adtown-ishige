import React from 'react';
import { FurimaPost } from '@/types/furima';
import { RiShieldCheckFill, RiChatHeartFill, RiMapPin2Fill } from 'react-icons/ri';

export default function PostCard({ post, isPaidMember }: { post: FurimaPost, isPaidMember: boolean }) {
  return (
    <div className="bg-white rounded-3xl overflow-hidden shadow-sm border border-pink-50 hover:shadow-md transition">
      {/* 商品画像 */}
      <div className="relative aspect-square bg-gray-100">
        <img src={post.image} alt={post.title} className="w-full h-full object-cover" />
        <div className="absolute top-2 left-2 bg-white/90 backdrop-blur px-3 py-1 rounded-full text-[10px] font-black text-pink-600 shadow-sm">
          {post.area}
        </div>
      </div>

      <div className="p-3">
        {/* 価格とタイトル */}
        <div className="flex justify-between items-start mb-1">
          <span className="text-sm font-black text-pink-500">
            {typeof post.price === 'number' ? `¥${post.price.toLocaleString()}` : post.price}
          </span>
        </div>
        <h3 className="text-[13px] font-bold text-gray-800 line-clamp-1 mb-2">{post.title}</h3>

        {/* 投稿者情報：ここが信頼の証 */}
        <div className="flex items-center gap-1.5 mb-3 bg-gray-50 p-1.5 rounded-xl">
          <div className="w-5 h-5 bg-pink-100 rounded-full flex items-center justify-center text-pink-500">
            <RiShieldCheckFill size={12} />
          </div>
          <div className="flex flex-col">
            <span className="text-[9px] font-black text-gray-700 leading-none">{post.userName}</span>
            <span className="text-[8px] text-gray-400 font-bold leading-none mt-1">取引{post.userUsageCount}回</span>
          </div>
        </div>

        {/* 連絡先：有料会員ダッシュボード内なので常に表示 */}
        <div className="bg-green-50 rounded-xl p-2 flex items-center justify-center gap-1 text-green-600">
          <RiChatHeartFill size={14} />
          <span className="text-[10px] font-black">LINE ID: {post.lineId}</span>
        </div>
      </div>
    </div>
  );
}