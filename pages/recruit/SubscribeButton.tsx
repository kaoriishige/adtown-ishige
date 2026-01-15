// pages/recruit/SubscribeButton.tsx
import { loadStripe } from "@stripe/stripe-js";
import { getAuth } from "firebase/auth";

const stripePromise = loadStripe(process.env.STRIPE_PUBLISHABLE_KEY!);

export default function SubscribeButton({ priceId }: { priceId: string }) {
  const handleSubscribe = async () => {
    const user = getAuth().currentUser;
    if (!user) throw new Error("ログインしていません");

    const idToken = await user.getIdToken();

    const res = await fetch("/api/recruit/create-subscription-session", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + idToken,
      },
      body: JSON.stringify({ priceId }),
    });

    const data = await res.json();
    const stripe = await stripePromise;
    await stripe?.redirectToCheckout({ sessionId: data.sessionId });
  };

  return <button onClick={handleSubscribe}>サブスクに登録</button>;
}
