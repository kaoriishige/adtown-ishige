// pages/api/stripe/start.ts
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
    const companyData = companySnap.exists ? companySnap.data() || {} : {};

    // 1) Stripe Customer を作成（未存在時）
    let customerId: string | undefined = companyData?.stripeCustomerId;
    if (!customerId) {
      const customer = await stripe.customers.create({
        metadata: { uid },
        email: companyData?.contactEmail || undefined,
        name: companyData?.companyName || undefined,
      });
      customerId = customer.id;
      await companyRef.set({ stripeCustomerId: customerId }, { merge: true });
    }

    // 2) Checkout Session（subscription）を作成
    const priceId = process.env.STRIPE_PRICE_ID;
    if (!priceId) return res.status(500).json({ error: "STRIPE_PRICE_ID not configured" });

    const successUrl = (process.env.NEXT_PUBLIC_STRIPE_SUCCESS_URL || `${req.headers.origin}/?success=true`) + "&session_id={CHECKOUT_SESSION_ID}";
    const cancelUrl = process.env.NEXT_PUBLIC_STRIPE_CANCEL_URL || `${req.headers.origin}/?canceled=true`;

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
      customer: customerId,
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: { uid },
    });

    // 3) Firestore に checkout session id を保存（Webhookでsubscription idを保存するための橋渡し）
    await companyRef.set(
      {
        stripeCheckoutSessionId: session.id,
        stripeCustomerId: customerId,
        stripeCheckoutCreatedAt: new Date(),
      },
      { merge: true }
    );

    res.status(200).json({ id: session.id });
  } catch (err: any) {
    console.error("stripe/start error:", err);
    res.status(500).json({ error: err.message || "internal error" });
  }
}
