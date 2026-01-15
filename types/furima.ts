import { Timestamp } from 'firebase/firestore';

/**
 * 那須フリマ：商品投稿データの設計図
 */
export interface FurimaPost {
  id: string;               // 投稿ごとの固有ID
  userId: string;           // 投稿したプレミアム会員のID

  // --- 信頼性バッジ用（投稿時のユーザー情報をコピーして保存） ---
  userName: string;
  userUsageCount: number;   // 投稿時点の利用回数
  isVerified: boolean;      // ✅ 投稿者が「本人確認済み」かどうか

  // --- 商品内容 ---
  type: 'sell' | 'buy';     // 売ります or 探してます
  title: string;            // 商品名
  price: number | '無料';    // 価格
  image: string;            // 写真URL
  description: string;      // 商品説明
  area: '那須地域' | '那須塩原' | '大田原' | '那須町'; // 地域限定

  // --- 連絡先（プレミアム会員のみ閲覧可能にする対象） ---
  lineId: string;

  createdAt: Timestamp | any;
}