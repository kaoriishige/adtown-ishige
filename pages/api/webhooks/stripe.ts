// Next.js Modules
import { NextApiRequest, NextApiResponse } from 'next';
// Firebase Admin SDK
import { adminDb, adminAuth } from '@/lib/firebase-admin';
// Stripe SDK
import getStripeAdmin from '@/lib/stripe-admin';
import Stripe from 'stripe';
import * as admin from 'firebase-admin';

// StripeのWebhook Secret（環境変数から取得）
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;
const stripe = getStripeAdmin();

// Stripeの仕様上、リクエストボディをRaw形式で扱う必要あり
export const config = {
api: {
bodyParser: false,
},
};

// --- リクエストBodyをBufferとして取得 ---
async function buffer(readable: NextApiRequest & { buffer?: Buffer }): Promise<Buffer> {
const chunks: Buffer[] = [];
for await (const chunk of readable) {
chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
}
readable.buffer = Buffer.concat(chunks);
return readable.buffer;
}

// --- メイン Webhook ハンドラー ---
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
if (req.method !== 'POST') {
res.setHeader('Allow', 'POST');
return res.status(405).end('Method Not Allowed');
}

// 🔹 Stripeから送られた生のイベントを受け取る
const buf = await buffer(req);
const sig = req.headers['stripe-signature'];
let event: Stripe.Event;

// 🔸 Webhookの署名検証
try {
event = stripe.webhooks.constructEvent(buf.toString(), sig!, webhookSecret);
} catch (err: any) {
console.error('🔴 Webhook signature verification failed:', err.message);
return res.status(400).send(`Webhook Error: ${err.message}`);
}

// 🔸 イベント処理
try {
// ✅ 支払い完了イベント (サブスクリプション作成時)
if (event.type === 'checkout.session.completed') {
const session = event.data.object as Stripe.Checkout.Session;

// 🚨 顧客メタデータではなく、サブスクリプションのメタデータを取得
const subscriptionId = session.subscription as string;
if (!subscriptionId) {
console.warn(`Webhook: checkout.session.completed (ID: ${session.id}) に subscription ID がありません。`);
return res.status(200).json({ received: true, message: 'No subscription ID.' });
}

const subscription = await stripe.subscriptions.retrieve(subscriptionId);
const meta = subscription.metadata;

// 🚨 メタデータからfirebaseUidを取得 (register-and-subscribeで設定したもの)
const {
firebaseUid, 
email,
companyName,
contactPerson,
phoneNumber,
address,
serviceType, // 申し込んだサービス (adver または recruit)
billingCycle,
} = meta;

// 🚨 email と serviceType が無ければ処理を中断
if (!firebaseUid || !serviceType || !email) {
console.error('🔴 Webhook処理失敗: Firebase UID, Email, ServiceTypeのいずれかがSubscriptionメタデータに不足しています。');
return res.status(400).send('Missing critical metadata (uid, email or serviceType).');
}

// ✅ Authユーザー取得 (UIDで検索)
let user: admin.auth.UserRecord;
try {
user = await adminAuth.getUser(firebaseUid);
console.log(`✅ 既存AuthユーザーをUIDで検出: ${user.uid}`);
} catch (e: any) {
if (e.code === 'auth/user-not-found') {
// 決済が成功したがAuthユーザーが存在しない場合、ここで新規作成
console.log(`Authユーザーが見つからないため、新規作成します: ${email}`);
user = await adminAuth.createUser({
uid: firebaseUid, // 申込API側で生成したUIDを使う
email,
password: Math.random().toString(36).slice(-8),
displayName: contactPerson || companyName || email,
});
console.log(`✅ Authフォールバック作成完了: ${user.uid}`);
} else {
// それ以外のAuthエラー
throw e;
}
}

// サービスタイプからロールを決定
const serviceRole = serviceType === 'adver' ? 'adver' : 'recruit';

// ✅ Firestoreに企業情報を登録 (ステータスを 'active' に更新)
await adminDb.collection('users').doc(user.uid).set(
{
uid: user.uid,
email,
companyName,
contactPerson,
phoneNumber,
address,
stripeCustomerId: session.customer as string,
stripeSubscriptionId: session.subscription, // 最初のサブスクID
// 🚨 修正: サービス固有のステータスを 'active' に変更
[`${serviceType}SubscriptionStatus`]: 'active',
billingCycle, // 支払いサイクル (monthly/annual)
// 🚨 修正: 既存のロールを破壊せず、新しいロールを「追加」
roles: admin.firestore.FieldValue.arrayUnion(serviceRole),
// createdAtはマージ(merge:true)で保護される
createdAt: admin.firestore.FieldValue.serverTimestamp(),
updatedAt: admin.firestore.FieldValue.serverTimestamp(),
},
{ merge: true } // 既存のデータを保持 (重要)
);

// 🚨 修正: Firebase Authのカスタムクレームを更新 (管理ページ反映の最重要ステップ)
// 既存のクレーム(例: 'recruit')を取得し、新しいロール('adver')を追加
const currentClaims = user.customClaims || {};
const newRoles = Array.from(new Set([...(currentClaims.roles || []), serviceRole]));

await adminAuth.setCustomUserClaims(user.uid, { 
...currentClaims, 
roles: newRoles 
});

console.log(`✅ Firestore/Auth 登録完了: ${email}, Roles added: ${newRoles.join(', ')}`);
}

// ✅ 毎月課金成功イベントでもステータスを更新 (変更なし)
else if (event.type === 'invoice.paid') {
const data = event.data.object as Stripe.Invoice;
const customerId = data.customer as string;
const customer = (await stripe.customers.retrieve(customerId)) as Stripe.Customer;
const firebaseEmail = customer.email;

if (!firebaseEmail) return res.status(200).json({ received: true });

const userRecord = await adminAuth.getUserByEmail(firebaseEmail).catch(() => null);
if (userRecord) {
// (この実装は簡略化されているため、両方のステータスを active に更新)
await adminDb.collection('users').doc(userRecord.uid).set(
{
adverSubscriptionStatus: 'active',
recruitSubscriptionStatus: 'active',
updatedAt: admin.firestore.FieldValue.serverTimestamp(),
},
{ merge: true }
);
console.log(`💰 Monthly invoice paid for: ${firebaseEmail}`);
}
}

// ❌ 解約処理 (変更なし)
else if (event.type === 'customer.subscription.deleted') {
const data = event.data.object as Stripe.Subscription;
const customerId = data.customer as string;
const customer = (await stripe.customers.retrieve(customerId)) as Stripe.Customer;
const firebaseEmail = customer.email;

if (!firebaseEmail) return res.status(200).json({ received: true });

const userRecord = await adminAuth.getUserByEmail(firebaseEmail).catch(() => null);
if (userRecord) {
// どのサービスが解約されたかメタデータから特定
const serviceType = data.metadata.serviceType || (data.items.data[0]?.price.lookup_key?.includes('adver') ? 'adver' : 'recruit');
await adminDb.collection('users').doc(userRecord.uid).set(
{
[`${serviceType}SubscriptionStatus`]: 'canceled',
updatedAt: admin.firestore.FieldValue.serverTimestamp(),
},
{ merge: true }
);
console.log(`🟥 Subscription canceled: ${firebaseEmail} for ${serviceType}`);
}
}

// 未処理イベント
else {
console.log(`ℹ Unhandled event type: ${event.type}`);
}

res.status(200).json({ received: true });
} catch (err: any) {
console.error('Webhook processing error:', err);
res.status(500).json({ error: 'Webhook failed' });
}
}






















