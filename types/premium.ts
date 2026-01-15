import { Timestamp } from 'firebase/firestore';

/**
 * 【那須アプリ共通】プレミアム会員（月額480円）の完全定義
 * ユーザー基盤そのものを「プレミアム」として再定義し、
 * フリマの信頼性（バッジ）とアフィリエイト報酬を統合管理する。
 */
export interface PremiumUser {
    // --- 基礎認証ステータス ---
    uid: string;
    displayName: string;
    email: string;

    // ✅ 信頼性担保：SMS認証済みか ＝ フリマでの「本人確認済み」マーク
    phoneVerified: boolean;

    // --- プレミアム会員ステータス ---
    // これが true の間だけ、フリマの全機能（投稿・閲覧）とアフィリエイトが有効化
    isPremiumActive: boolean;
    subscriptionId?: string; // StripeのサブスクID

    // --- フリマ特典データ（運営放置・自動バッジ用） ---
    fleaMarket: {
        usageCount: number;      // 投稿/取引の累計回数（自動カウント）
        lineId: string;          // 公開用LINE ID（プレミアム会員のみ設定可能）
        area: '那須地域' | '那須塩原' | '大田原' | '那須町'; // 地域限定
    };

    // --- アフィリエイト実績（紹介者としてのデータ） ---
    affiliate: {
        referredBy: string | null;   // 誰の紹介でプレミアムになったか
        stats: {
            user: { registrations: number; earned: number; }; // 一般紹介
            adver: { registrations: number; earned: number; }; // 広告主紹介
            recruit: { registrations: number; earned: number; }; // 求人紹介
        };
        unpaidEarnings: number; // 月末締め、15日払い用の未払報酬額
    };

    createdAt: Timestamp | any;
}