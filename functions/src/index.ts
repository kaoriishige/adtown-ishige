import { onDocumentCreated } from "firebase-functions/v2/firestore";
import { onRequest, onCall, HttpsError } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
import * as logger from "firebase-functions/logger";
import Stripe from "stripe";
import { onSchedule } from "firebase-functions/v2/scheduler";
import { randomUUID } from "crypto";

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
        stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    }
    return stripe;
};

// ========================================================================
// 1. 新規ユーザー登録時の初期データ作成プログラム (onCall形式)
// ========================================================================
export const initializeNewUser = onCall(async (request) => {
    if (!request.auth) {
        throw new HttpsError('unauthenticated', 'Authentication is required.');
    }
    const { uid, token } = request.auth;
    const email = token.email || '';
    const userRef = db.collection("users").doc(uid);
    const now = new Date();
    const campaignEndDate = new Date('2025-10-31T15:00:00Z');
    const activationStatus = now < campaignEndDate ? 'awaiting_november_payment' : 'awaiting_next_payment';

    const initialUserData = {
        uid: uid,
        email: email,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        lastTransactionAt: admin.firestore.FieldValue.serverTimestamp(),
        role: 'user',
        plan: 'trial',
        points: {
            balance: 1000,
            usableBalance: 0,
            pendingBalance: 1000,
            activationStatus: activationStatus,
            expiredAmount: 0,
        },
        tree: {
            level: 1,
            exp: 0,
            expToNextLevel: 100,
            lastWatered: null,
            fruits: [],
        },
        lastLotteryPlayedAt: null,
    };
    try {
        await userRef.set(initialUserData);
        logger.info(`Successfully created initial data for user: ${uid}`);
        return { success: true };
    } catch (error) {
        logger.error(`Failed to create initial data for user: ${uid}`, error);
        throw new HttpsError('internal', 'Failed to create initial data.');
    }
});

// ========================================================================
// 2. Stripeからの通知を処理するプログラム（Webhook）
// ========================================================================
export const handleStripeWebhooks = onRequest({ timeoutSeconds: 60 }, async (req, res) => {
    const stripeClient = initializeStripe();
    const sig = req.headers["stripe-signature"] as string;
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;
    let event: Stripe.Event;
    try {
        event = stripeClient.webhooks.constructEvent(req.rawBody, sig, webhookSecret);
    } catch (err: any) {
        logger.error("Webhook signature verification failed.", err.message);
        res.status(400).send(`Webhook Error: ${err.message}`);
        return;
    }
    switch (event.type) {
        case 'checkout.session.completed': {
            const session = event.data.object as Stripe.Checkout.Session;
            if (session.metadata?.type === 'point_reissue' && session.payment_status === 'paid') {
                const userId = session.metadata.userId;
                const reissueAmount = Number(session.metadata.reissueAmount);
                if (userId && reissueAmount > 0) {
                    const userRef = db.collection('users').doc(userId);
                    try {
                        await userRef.update({
                            "points.usableBalance": admin.firestore.FieldValue.increment(reissueAmount),
                            "points.expiredAmount": admin.firestore.FieldValue.increment(-reissueAmount),
                            "lastTransactionAt": admin.firestore.FieldValue.serverTimestamp()
                        });
                        const historyRef = userRef.collection("pointHistory").doc();
                        await historyRef.set({
                            amount: reissueAmount,
                            type: "reissue",
                            description: "失効ポイントの再発行",
                            createdAt: admin.firestore.FieldValue.serverTimestamp(),
                        });
                        logger.info(`Reissued ${reissueAmount} points for user ${userId}.`);
                    } catch(error) {
                        logger.error(`Failed to reissue points for user ${userId}`, error);
                    }
                }
            }
            break;
        }

        // ▼▼▼ エラー箇所を完全に修正したブロック ▼▼▼
        case 'invoice.payment_succeeded': {
            const invoice = event.data.object as Stripe.Invoice;
            const customerId = invoice.customer as string;
        
            // invoiceオブジェクトの最初の明細(line item)からsubscription情報を取得
            const subscriptionIdOrObject = invoice.lines.data[0]?.subscription;
        
            if (!subscriptionIdOrObject) {
                logger.error(`Subscription ID or object not found on invoice ${invoice.id}`);
                break; // switch文を抜ける
            }
        
            let subscription: Stripe.Subscription;
        
            try {
                // subscription情報が文字列(ID)かオブジェクトかを確認して処理を分岐
                if (typeof subscriptionIdOrObject === 'string') {
                    // IDの場合は、Stripe APIで完全なSubscriptionオブジェクトを取得
                    subscription = await stripeClient.subscriptions.retrieve(subscriptionIdOrObject);
                } else {
                    // オブジェクトの場合は、それをそのまま使用
                    subscription = subscriptionIdOrObject;
                }
        
                const userUid = subscription.metadata.uid;
                if (!userUid) {
                    logger.warn(`UID not in metadata for customer: ${customerId}`);
                    break;
                }
        
                const userRef = db.collection("users").doc(userUid);
                await db.runTransaction(async (transaction) => {
                    const userDoc = await transaction.get(userRef);
                    if (!userDoc.exists) return;
                    
                    const data = userDoc.data();
                    if (!data) return;

                    const points = data.points || {};
                    if (points.pendingBalance > 0 && points.activationStatus !== 'activated') {
                        transaction.update(userRef, {
                            "points.usableBalance": admin.firestore.FieldValue.increment(points.pendingBalance),
                            "points.pendingBalance": 0,
                            "points.activationStatus": "activated",
                            "lastTransactionAt": admin.firestore.FieldValue.serverTimestamp()
                        });
                        logger.info(`Activated ${points.pendingBalance} points for user ${userUid}.`);
                    }
                });
            } catch (error) {
                logger.error(`Failed to process subscription for customer ${customerId}`, error);
            }
            break;
        }
        // ▲▲▲ 修正ブロックここまで ▲▲▲

        case 'charge.refunded': {
            const charge = event.data.object as Stripe.Charge;
            const checkoutSessionId = charge.metadata.checkout_session_id;
            if (!checkoutSessionId) break;
            const rewardsQuery = db.collection("referralRewards").where("sourceCheckoutId", "==", checkoutSessionId).limit(1);
            const snapshot = await rewardsQuery.get();
            if (snapshot.empty) break;
            const rewardDoc = snapshot.docs[0];
            const { referrerUid, rewardAmount, referredUid } = rewardDoc.data();
            await db.collection("referralRewards").add({
                referrerUid,
                referredUid,
                rewardAmount: -rewardAmount,
                rewardStatus: "clawback",
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                sourceRefundId: charge.id,
                originalRewardId: rewardDoc.id,
            });
            const userRef = db.collection("users").doc(referrerUid);
            const decrement = admin.firestore.FieldValue.increment(-rewardAmount);
            await userRef.update({ unpaidRewards: decrement, totalRewards: decrement });
            logger.info(`Clawback of ${rewardAmount} for user ${referrerUid}.`);
            break;
        }
        default:
            logger.info(`Unhandled event type: ${event.type}`);
    }
    res.status(200).send("Event received.");
});

// ========================================================================
// 3. 紹介報酬の自動集計プログラム
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
      const summaryData = summaryDoc.data();
      if (!summaryData) return;
      const partnerTotal = (summaryData.partnerTotal || 0) + (userRole === "partner" ? rewardAmount : 0);
      const userTotal = (summaryData.userTotal || 0) + (userRole !== "partner" ? rewardAmount : 0);
      
      transaction.update(summaryRef, {
        grandTotal: admin.firestore.FieldValue.increment(rewardAmount),
        partnerTotal: partnerTotal,
        userTotal: userTotal,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }
  });
});

// ========================================================================
// 4. プッシュ通知送信プログラム
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
                if (doc.data().token) {
                    tokens.push(doc.data().token);
                }
            });
        } else if (uid) {
            const doc = await db.collection("fcmTokens").doc(uid).get();
            if (doc.exists && doc.data()?.token) {
                tokens.push(doc.data()!.token);
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
// 5. Googleフォームからのデータ受信プログラム
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

// ======================================================================
// 6. ポイントの有効期限をチェックし失効させる自動処理
// ======================================================================
export const expirePoints = onSchedule("every day 03:00", async () => {
    logger.info("ポイント有効期限チェックを開始します。");
    const now = admin.firestore.Timestamp.now();
    const twoMonthsAgo = new Date(now.toDate());
    twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);
    const twoMonthsAgoTimestamp = admin.firestore.Timestamp.fromDate(twoMonthsAgo);
    const usersRef = db.collection("users");
    const querySnapshot = await usersRef
        .where("points.usableBalance", ">", 0)
        .where("lastTransactionAt", "<", twoMonthsAgoTimestamp)
        .get();
    if (querySnapshot.empty) {
        logger.info("有効期限切れポイントを持つユーザーはいませんでした。");
        return;
    }
    const batch = db.batch();
    querySnapshot.forEach(doc => {
        const userData = doc.data();
        const expiredAmount = userData.points.usableBalance;
        batch.update(doc.ref, {
            "points.usableBalance": 0,
            "points.expiredAmount": admin.firestore.FieldValue.increment(expiredAmount),
            "points.lastExpiredAt": now
        });
        const historyRef = doc.ref.collection("pointHistory").doc();
        batch.set(historyRef, {
            amount: -expiredAmount,
            type: "expired",
            description: "有効期限切れのため失効",
            createdAt: now,
        });
        logger.info(`ユーザーID: ${doc.id} の ${expiredAmount} ポイントが失効しました。`);
    });
    await batch.commit();
    logger.info(`${querySnapshot.size} 人のユーザーのポイント失効処理が完了しました。`);
    return;
});

// ======================================================================
// 7. 年間管理費を徴収する自動処理
// ======================================================================
export const collectAnnualPointFee = onSchedule("0 4 1 1 *", async () => {
    logger.info("年間ポイント管理費の徴収処理を開始します。");
    const now = admin.firestore.Timestamp.now();
    const usersRef = db.collection("users");
    const querySnapshot = await usersRef
        .where("points.usableBalance", ">", 0)
        .get();
    if (querySnapshot.empty) {
        logger.info("管理費徴収の対象ユーザーはいませんでした。");
        return;
    }
    const batch = db.batch();
    querySnapshot.forEach(doc => {
        const userData = doc.data();
        const balance = userData.points.usableBalance;
        const fee = Math.floor(balance * 0.02);
        if (fee > 0) {
            batch.update(doc.ref, {
                "points.usableBalance": admin.firestore.FieldValue.increment(-fee),
                "lastTransactionAt": now
            });
            const historyRef = doc.ref.collection("pointHistory").doc();
            batch.set(historyRef, {
                amount: -fee,
                type: "fee",
                description: "年間管理費",
                createdAt: now,
            });
            logger.info(`ユーザーID: ${doc.id} から管理費 ${fee} ポイントを徴収しました。`);
        }
    });
    await batch.commit();
    logger.info(`${querySnapshot.size} 人のユーザーの年間管理費処理が完了しました。`);
    return;
});

// ======================================================================
// 8. なっぴーのなる木を操作するプログラム
// ======================================================================
export const interactWithTree = onCall(async (request) => {
    if (!request.auth) {
        throw new HttpsError('unauthenticated', 'Authentication is required.');
    }
    const { uid } = request.auth;
    const { interactionType, fruitId } = request.data as { interactionType: 'water' | 'harvest', fruitId?: string };
    const userRef = db.collection('users').doc(uid);
    const now = admin.firestore.Timestamp.now();
    if (interactionType === 'water') {
        return db.runTransaction(async (transaction) => {
            const userDoc = await transaction.get(userRef);
            if (!userDoc.exists) { throw new HttpsError('not-found', 'User not found.'); }
            const tree = userDoc.data()?.tree;
            if (!tree) { throw new HttpsError('internal', 'Tree data not found.'); }

            const lastWatered = (tree.lastWatered as admin.firestore.Timestamp)?.toDate();
            if (lastWatered && (now.toDate().getTime() - lastWatered.getTime()) < 23 * 60 * 60 * 1000) {
                throw new HttpsError('failed-precondition', 'You can only water the tree once a day.');
            }
            const expGained = 25;
            let newExp = tree.exp + expGained;
            let newLevel = tree.level;
            let newExpToNextLevel = tree.expToNextLevel;
            let newFruits = tree.fruits || [];
            if (newExp >= newExpToNextLevel) {
                newLevel += 1;
                newExp -= newExpToNextLevel;
                newExpToNextLevel = Math.floor(newLevel * 100 * 1.2);
                const rewardPoints = 10 + Math.floor(Math.random() * (newLevel * 10));
                newFruits.push({
                    id: randomUUID(),
                    rewardType: 'points',
                    amount: rewardPoints,
                    createdAt: now,
                });
            }
            transaction.update(userRef, {
                "tree.exp": newExp,
                "tree.level": newLevel,
                "tree.expToNextLevel": newExpToNextLevel,
                "tree.fruits": newFruits,
                "tree.lastWatered": now,
            });
            return { success: true, message: `${expGained}の経験値を獲得しました！` };
        });
    }
    if (interactionType === 'harvest') {
        if (!fruitId) { throw new HttpsError('invalid-argument', 'Fruit ID is required.'); }
        return db.runTransaction(async (transaction) => {
            const userDoc = await transaction.get(userRef);
            if (!userDoc.exists) { throw new HttpsError('not-found', 'User not found.'); }
            const tree = userDoc.data()?.tree;
            if (!tree || !tree.fruits) { throw new HttpsError('internal', 'Tree data not found.'); }

            const fruitToHarvest = tree.fruits.find((f: any) => f.id === fruitId);
            if (!fruitToHarvest) { throw new HttpsError('not-found', 'Fruit not found.'); }
            
            transaction.update(userRef, {
                "points.usableBalance": admin.firestore.FieldValue.increment(fruitToHarvest.amount),
                "lastTransactionAt": now
            });
            const remainingFruits = tree.fruits.filter((f: any) => f.id !== fruitId);
            transaction.update(userRef, { "tree.fruits": remainingFruits });

            const historyRef = userRef.collection("pointHistory").doc();
            transaction.set(historyRef, {
                amount: fruitToHarvest.amount,
                type: "tree_harvest",
                description: `なっぴーのなる木から収穫`,
                createdAt: now,
            });
            return { success: true, message: `${fruitToHarvest.amount}ポイントを収穫しました！` };
        });
    }
    throw new HttpsError('invalid-argument', 'Invalid interaction type.');
});

// ======================================================================
// 9. もしもボックス・チャレンジ（福引）を実行するプログラム
// ======================================================================
export const playDailyLottery = onCall(async (request) => {
    if (!request.auth) {
        throw new HttpsError('unauthenticated', 'Authentication is required.');
    }
    const { uid } = request.auth;
    const userRef = db.collection('users').doc(uid);
    const now = admin.firestore.Timestamp.now();

    const prizes = [
        { name: '1,000ポイント', type: 'points', value: 1000, weight: 1 },
        { name: '100ポイント', type: 'points', value: 100, weight: 5 },
        { name: '10ポイント', type: 'points', value: 10, weight: 20 },
        { name: '1ポイント', type: 'points', value: 1, weight: 34 },
        { name: '残念！', type: 'none', value: 0, weight: 40 },
    ];
    
    const totalWeight = prizes.reduce((sum, prize) => sum + prize.weight, 0);

    return db.runTransaction(async (transaction) => {
        const userDoc = await transaction.get(userRef);
        if (!userDoc.exists) { throw new HttpsError('not-found', 'User not found.'); }

        const lastPlayed = (userDoc.data()?.lastLotteryPlayedAt as admin.firestore.Timestamp)?.toDate();
        if (lastPlayed && (now.toDate().getTime() - lastPlayed.getTime()) < 23 * 60 * 60 * 1000) {
            throw new HttpsError('failed-precondition', 'You can only play the lottery once a day.');
        }

        let random = Math.random() * totalWeight;
        const wonPrize = prizes.find(prize => {
            random -= prize.weight;
            return random < 0;
        })!;

        transaction.update(userRef, { "lastLotteryPlayedAt": now });

        if (wonPrize.type === 'points' && wonPrize.value > 0) {
            transaction.update(userRef, {
                "points.usableBalance": admin.firestore.FieldValue.increment(wonPrize.value),
                "lastTransactionAt": now
            });

            const historyRef = userRef.collection("pointHistory").doc();
            transaction.set(historyRef, {
                amount: wonPrize.value,
                type: "lottery_reward",
                description: `もしもボックス: ${wonPrize.name}`,
                createdAt: now,
            });
        }
        
        return { success: true, prize: { name: wonPrize.name, value: wonPrize.value } };
    });
});