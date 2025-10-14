// pages/api/webhooks/stripe.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import getStripeAdmin from '../../../lib/stripe-admin';
import { buffer } from 'micro';
import Stripe from 'stripe';
import admin from 'firebase-admin';

export const config = {
  api: {
    bodyParser: false,
  },
};

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end('Method Not Allowed');
  }

  const stripe = getStripeAdmin();
  const signature = req.headers['stripe-signature'] as string;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET as string;

  if (!signature || !webhookSecret) {
    console.error('❌ Webhook Error: Missing Stripe signature or webhook secret.');
    return res.status(400).send('Webhook Error: Missing signature or secret');
  }

  let event: Stripe.Event;
  try {
    const buf = await buffer(req);
    event = stripe.webhooks.constructEvent(buf, signature, webhookSecret);
  } catch (err: any) {
    console.error(`❌ Webhook signature verification failed: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const metadata = session.metadata;

        if (!metadata) {
          console.error('⚠️ Webhook Error: session.metadata is missing.');
          break;
        }

        const {
          email,
          password,
          companyName,
          address,
          contactPerson,
          phoneNumber,
          serviceType,
          firebaseUid,
        } = metadata;

        const customerId =
          typeof session.customer === 'string'
            ? session.customer
            : session.customer?.id;

        if (!customerId) {
          console.error('⚠️ Webhook Error: Missing customer ID');
          break;
        }

        console.log('✅ [Webhook] checkout.session.completed received:', {
          email,
          companyName,
          serviceType,
          customerId,
        });

        const subscriptionStatus = 'active';
        let uid: string | undefined;

        // --- 新規ユーザー登録 ---
        if (metadata.is_new_user === 'true') {
          if (!email || !password) {
            console.warn('⚠️ Missing email or password for new user registration.');
            break;
          }

          const formatPhoneNumber = (phone?: string) => {
            if (!phone) return undefined;
            const cleaned = phone.replace(/[^0-9+]/g, '');
            if (cleaned.startsWith('+')) return cleaned;
            if (cleaned.startsWith('0')) return `+81${cleaned.slice(1)}`;
            return cleaned;
          };

          const user = await adminAuth.createUser({
            email,
            password,
            displayName: contactPerson || companyName,
            phoneNumber: formatPhoneNumber(phoneNumber),
          });
          uid = user.uid;

          await stripe.customers.update(customerId, {
            metadata: { firebaseUid: uid },
          });

          await adminDb.collection('partners').doc(uid).set(
            {
              uid,
              email,
              companyName,
              contactPerson,
              address,
              phoneNumber,
              serviceType: serviceType || 'recruit',
              stripeCustomerId: customerId,
              subscriptionStatus,
              createdAt: admin.firestore.FieldValue.serverTimestamp(),
              updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            },
            { merge: true }
          );

          console.log(`🆕 Webhook: 新規企業登録完了 (${companyName})`);
        }

        // --- 既存ユーザー更新 ---
        else if (firebaseUid) {
          uid = firebaseUid;
          await adminDb
            .collection('partners')
            .doc(uid)
            .set(
              {
                serviceType,
                subscriptionStatus,
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
              },
              { merge: true }
            );

          console.log(`🔄 Webhook: 既存企業更新完了 (${uid})`);
        }

        // --- AIマッチング初期データ生成 ---
        if (uid) {
          const companyProfileRef = adminDb.collection('companyProfiles').doc(uid);
          const existing = await companyProfileRef.get();
          if (!existing.exists) {
            await companyProfileRef.set({
              companyUid: uid,
              companyName: companyName || '',
              minMatchScore: 60, // 初期値：60点以上をマッチ対象とする
              appealPoints: {
                atmosphere: [],
                growth: [],
                wlb: [],
                benefits: [],
                organization: [],
              },
              createdAt: admin.firestore.FieldValue.serverTimestamp(),
              updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            });
            console.log(`🤖 AI初期プロファイル生成完了 (${uid})`);
          } else {
            console.log(`ℹ️ 既にAIプロファイルが存在 (${uid})`);
          }
        }

        break;
      }

      default:
        console.log(`ℹ️ Webhook event ignored: ${event.type}`);
        break;
    }

    res.status(200).json({ received: true });
  } catch (err: any) {
    console.error(`❌ Webhook handler error: ${err.message}`);
    res.status(500).json({ error: `Webhook handler error: ${err.message}` });
  }
};

export default handler;















