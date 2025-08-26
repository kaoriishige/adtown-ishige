import { onDocumentCreated } from "firebase-functions/v2/firestore";
import { onRequest, onCall } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
import * as logger from "firebase-functions/logger";
import Stripe from "stripe";

// --- 初期化処理 ---
admin.initializeApp();
const db = admin.firestore();
const messaging = admin.messaging();

let stripe: Stripe | null = null;

const initializeStripe = () => {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error("STRIPE_SECRET_KEY environment variable not set.");
  }
  if (!stripe) {
    stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2024-04-10",
    });
  }
  return stripe;
};

// ========================================================================
// 1. 紹介報酬の自動集計プログラム
// ========================================================================
export const aggregateReferralRewards = onDocumentCreated({
  document: "referralRewards/{rewardId}",
  timeoutSeconds: 30
}, async (event) => {
  const snapshot = event.data;
  if (!snapshot) {
    logger.log("No data associated with the event");
    return;
  }
  const reward = snapshot.data();
  if (!reward) {
    logger.log("No data in snapshot");
    return;
  }
  const { referrerUid, rewardAmount, createdAt } = reward;
  if (!referrerUid || typeof rewardAmount !== 'number' || !createdAt) {
    logger.error("Missing or invalid fields in reward document.", { reward });
    return;
  }
  const userDoc = await db.collection("users").doc(referrerUid).get();
  if (!userDoc.exists) {
    logger.warn(`Referrer user ${referrerUid} not found.`);
    return;
  }
  const userRole = userDoc.data()?.role || "user";
  const date = (createdAt as admin.firestore.Timestamp).toDate();
  const monthKey = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, "0")}`;
  const summaryRef = db.collection("referralSummaries").doc(monthKey);

  return db.runTransaction(async (transaction) => {
    const summaryDoc = await transaction.get(summaryRef);
    if (!summaryDoc.exists) {
      transaction.set(summaryRef, {
        month: monthKey,
        partnerTotal: userRole === "partner" ? rewardAmount : 0,
        userTotal: userRole !== "partner" ? rewardAmount : 0,
        grandTotal: rewardAmount,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    } else {
      const increment = admin.firestore.FieldValue.increment(rewardAmount);
      const updateData: { [key: string]: any } = {
        grandTotal: increment,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      };
      if (userRole === "partner") {
        updateData.partnerTotal = increment;
      } else {
        updateData.userTotal = increment;
      }
      transaction.update(summaryRef, updateData);
    }
  });
});

// ========================================================================
// 2. 返金処理（クローバック）プログラム
// ========================================================================
export const handleStripeRefund = onRequest({ timeoutSeconds: 30 }, async (req, res) => {
  try {
    const stripeClient = initializeStripe();
    const sig = req.headers["stripe-signature"] as string;
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;
    let event: Stripe.Event;

    event = stripeClient.webhooks.constructEvent(req.rawBody, sig, webhookSecret);
    
    if (event.type === 'charge.refunded') {
      const charge = event.data.object as Stripe.Charge;
      const checkoutSessionId = charge.metadata.checkout_session_id;

      if (!checkoutSessionId) {
        logger.info("No checkout_session_id in charge metadata. Skipping clawback.");
        res.status(200).send("No action needed.");
        return;
      }
      
      const rewardsRef = db.collection("referralRewards");
      const query = rewardsRef.where("sourceCheckoutId", "==", checkoutSessionId).limit(1);
      const snapshot = await query.get();

      if (snapshot.empty) {
        logger.info(`No referral reward found for checkout session ${checkoutSessionId}.`);
        res.status(200).send("No referral reward to claw back.");
        return;
      }

      const originalRewardDoc = snapshot.docs[0];
      const originalReward = originalRewardDoc.data();
      const { referrerUid, rewardAmount } = originalReward;

      await rewardsRef.add({
        referrerUid,
        referredUid: originalReward.referredUid,
        rewardAmount: -rewardAmount,
        rewardStatus: "clawback",
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        sourceRefundId: charge.id,
        originalRewardId: originalRewardDoc.id,
      });

      const userRef = db.collection("users").doc(referrerUid);
      const decrement = admin.firestore.FieldValue.increment(-rewardAmount);
      
      await userRef.update({
        unpaidRewards: decrement,
        totalRewards: decrement,
      });

      logger.info(`Clawback of ${rewardAmount} processed for user ${referrerUid}.`);
      res.status(200).json({ success: true });

    } else {
      res.status(200).send("Event type not handled.");
    }
  } catch (err: any) {
    logger.error("Webhook handler failed.", err.message);
    res.status(400).send(`Webhook Error: ${err.message}`);
  }
});


// ========================================================================
// 3. プッシュ通知送信プログラム
// ========================================================================
export const sendPushNotification = onCall({ timeoutSeconds: 30 }, async (request) => {
  const { title, body, uid, allUsers } = request.data;
  
  if (!title || !body) {
    logger.error("Missing required fields: title or body.");
    return { success: false, error: "Missing title or body." };
  }

  try {
    let tokens: string[] = [];

    if (allUsers) {
      const snapshot = await db.collection("fcmTokens").get();
      snapshot.forEach(doc => {
        tokens.push(doc.id);
      });
    } else if (uid) {
      const doc = await db.collection("fcmTokens").doc(uid).get();
      if (doc.exists) {
        tokens.push(doc.id);
      }
    }

    if (tokens.length === 0) {
      logger.info("No tokens to send notification to.");
      return { success: true, message: "No tokens found." };
    }

    const message = {
      notification: {
        title: title,
        body: body,
      },
      tokens: tokens,
    };

    const response = await messaging.sendEachForMulticast(message);
    logger.log("Successfully sent messages:", response);
    
    if (response.failureCount > 0) {
      response.responses.forEach(async (resp, idx) => {
        if (!resp.success) {
          logger.error(`Failed to send message to token ${tokens[idx]}: ${resp.error}`);
        }
      });
    }
    
    return { success: true, response: response };

  } catch (error) {
    logger.error("Error sending push notification:", error);
    return { success: false, error: "Internal server error." };
  }
});

// ========================================================================
// 4. Googleフォームからのデータ受信プログラム
// ========================================================================
export const receiveFormData = onRequest({ timeoutSeconds: 30 }, async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).send('Method Not Allowed');
    return;
  }

  const formData = req.body;
  logger.info("Received data from Google Form:", formData);

  try {
    const deal = {
      storeName: formData['店舗名'],
      address: formData['住所'],
      phoneNumber: formData['電話番号'],
      businessHours: formData['営業時間'],
      regularHoliday: formData['定休日'],
      menu: formData['メニュー（主なもの）'],
      recommendedPoint: formData['お店のおすすめポイント'],
      dealType: formData['フードロス割引の種類'],
      discountInfo: formData['割引内容・割引率'],
      availableTime: formData['割引対象時間'],
      notes: formData['備考'],
      status: 'pending',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    await db.collection('deals').add(deal);
    logger.info("Deal added to Firestore:", deal);

    res.status(200).send("OK");
  } catch (error) {
    logger.error("Error processing form data:", error);
    res.status(500).send("Internal Server Error");
  }
});

