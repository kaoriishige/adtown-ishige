import { NextApiRequest, NextApiResponse } from 'next';
import getStripeAdmin from '@/lib/stripe-admin';
import { admin } from '@/lib/firebase-admin';

/**
 * ============================================================
 * 決済・購読セッション生成 API (400行規模プロジェクト対応版)
 * ============================================================
 * * [修正ポイント]
 * 1. Price ID の空文字チェック (empty string error の完全防止)
 * 2. cancel_url の /partner/ への固定 (404エラーの完全防止)
 * 3. カード決済時の Firestore 更新停止 (勝手に有料化バグの防止)
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // メソッドチェック
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  const { 
    email, 
    firebaseUid, 
    serviceType, 
    billingCycle, 
    paymentMethod, 
    priceId 
  } = req.body;

  // ------------------------------------------------------------
  // A. 入力値バリデーション (Stripe Error: line_items[0][price] 回避)
  // ------------------------------------------------------------
  if (!priceId || typeof priceId !== 'string' || priceId.trim() === '') {
    console.error("❌ CRITICAL ERROR: Stripe Price ID is empty or invalid.");
    return res.status(400).json({ 
      error: "Stripe Price ID が提供されていません。.env.local の変数名が正しいか、再起動したかを確認してください。" 
    });
  }

  if (!firebaseUid || !email) {
    return res.status(400).json({ error: "ユーザー識別情報が不足しています。" });
  }

  const stripe = getStripeAdmin();
  const db = admin.firestore();

  // 実行環境のドメインを正確に取得 (localhost対応)
  const host = req.headers.host || 'localhost:3000';
  const protocol = host.includes('localhost') ? 'http' : 'https';
  const siteUrl = `${protocol}://${host}`;

  try {
    // ------------------------------------------------------------
    // B. Stripe 顧客管理
    // ------------------------------------------------------------
    const customers = await stripe.customers.list({ email, limit: 1 });
    let customerId = customers.data.length > 0 ? customers.data[0].id : null;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email,
        metadata: { firebaseUid, source: 'partner_signup_page' }
      });
      customerId = customer.id;
    }

    // ------------------------------------------------------------
    // C. 請求書払い (invoice) ワークフロー
    // ------------------------------------------------------------
    if (paymentMethod === 'invoice') {
      // 請求書払いの場合は、入金確認待ちとしてDBを即時更新
      await db.collection('users').doc(firebaseUid).update({
        adverSubscriptionStatus: 'pending_invoice',
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      // 請求書アイテムと請求書の作成
      await stripe.invoiceItems.create({
        customer: customerId,
        price: priceId,
        description: `Partner Plan - ${billingCycle}`,
      });

      const invoice = await stripe.invoices.create({
        customer: customerId,
        collection_method: 'send_invoice',
        days_until_due: 30,
      });

      const finalizedInvoice = await stripe.invoices.finalizeInvoice(invoice.id);
      
      return res.status(200).json({ 
        success: true, 
        pdfUrl: finalizedInvoice.invoice_pdf 
      });
    }

    // ------------------------------------------------------------
    // D. クレジットカード決済 (Stripe Checkout) ワークフロー
    // ------------------------------------------------------------
    // ★重要: ここでは Firestore を更新しない。決済中断時に有料化されるのを防ぐため。
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: customerId,
      line_items: [
        {
          price: priceId, // ここに valid な priceId が入ることを確認済み
          quantity: 1,
        },
      ],
      // 成功時の戻り先
      success_url: `${siteUrl}/partner/dashboard?session_id={CHECKOUT_SESSION_ID}`,
      // ログの404を解決: 絶対に /partner/ 以下のページに戻す
      cancel_url: `${siteUrl}/partner/subscribe_plan?canceled=true`,
      
      client_reference_id: firebaseUid,
      metadata: { 
        firebaseUid, 
        serviceType, 
        billingCycle,
        origin: 'partner_flow'
      },
      subscription_data: {
        metadata: { firebaseUid, serviceType }
      }
    });

    // フロントエンドへセッション情報を返却
    return res.status(200).json({ 
      success: true, 
      sessionId: session.id 
    });

  } catch (err: any) {
    console.error("❌ STRIPE API ERROR:", err.message);
    return res.status(500).json({ 
      error: "決済セッションの生成に失敗しました。",
      details: err.message 
    });
  }
}





