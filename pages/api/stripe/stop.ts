// pages/api/stripe/stop.ts
import type { NextApiRequest, NextApiResponse } from "next";
import Stripe from "stripe";
import { adminDb } from "@/lib/firebase-admin";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
   apiVersion: '2024-04-10', 
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method Not Allowed" });

  const { uid } = req.body;
  if (!uid) return res.status(400).json({ error: "uid is required" });

  try {
    const companyRef = adminDb.collection("companies").doc(uid);
    const companySnap = await companyRef.get();
    if (!companySnap.exists) {
      return res.status(404).json({ error: "company not found" });
    }
    const companyData = companySnap.data() || {};

    // 1) まず Firestore に保存されている stripeSubscriptionId を使って解約（優先）
    let subscriptionId: string | undefined = companyData?.stripeSubscriptionId;

    // 2) 無ければ customerId からアクティブなサブスクを検索して解約対象を取得
    if (!subscriptionId) {
      const customerId = companyData?.stripeCustomerId;
      if (!customerId) {
        return res.status(400).json({ error: "no stripe customer or subscription found for this company" });
      }

      const subs = await stripe.subscriptions.list({
        customer: customerId,
        status: "active",
        limit: 5,
      });

      if (subs.data.length === 0) {
        return res.status(400).json({ error: "no active subscriptions found for this customer" });
      }

      // ここでは最初の active subscription を解約対象とする
      subscriptionId = subs.data[0].id;
    }

    // 3) Stripe で解約（即時キャンセル）
    await stripe.subscriptions.update(subscriptionId, { cancel_at_period_end: false });
    await stripe.subscriptions.cancel(subscriptionId);

    // 4) Firestore 側の状態更新
    await companyRef.set(
      {
        aiActive: false,
        stripeSubscriptionId: null,// placeholder, will be overwritten below
        stripeCancelledAt: new Date(),
      },
      { merge: true }
    );

    // 代わりに firestore update with null for stripeSubscriptionId properly:
    await companyRef.update({
      aiActive: false,
      stripeSubscriptionId: null,
      stripeCancelledAt: new Date(),
    });

    res.status(200).json({ success: true, subscriptionId });
  } catch (err: any) {
    console.error("stripe/stop error:", err);
    res.status(500).json({ error: err.message || "internal error" });
  }
}
