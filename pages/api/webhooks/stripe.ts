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
        console.error('Webhook Error: Missing Stripe signature or webhook secret.');
        return res.status(400).send('Webhook Error: Missing signature or secret');
    }

    let event: Stripe.Event;
    try {
        const buf = await buffer(req);
        event = stripe.webhooks.constructEvent(buf, signature, webhookSecret);
    } catch (err: any) {
        console.error(`Webhook signature verification failed: ${err.message}`);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }
    
    try {
        switch (event.type) {
            case 'checkout.session.completed':
                const session = event.data.object as Stripe.Checkout.Session;
                
                const metadata = session.metadata;
                const serviceType = metadata?.serviceType;

                if (!metadata || !serviceType) {
                    console.error('Webhook Error: metadata or serviceType is missing.');
                    break; 
                }

                const subscriptionStatus = serviceType === 'recruit' ? 'trialing' : 'active';

                if (metadata.is_new_user === 'true') {
                    // --- Handle new user registration ---
                    const customerId = typeof session.customer === 'string' ? session.customer : session.customer?.id;
                    if (!customerId) throw new Error("Webhook Error: CustomerID not found.");
                    
                    const { email, password, companyName, address, contactPerson, phoneNumber } = metadata;
                    console.log(`Webhook: Processing new user payment (Email: ${email})`);

                    if (email && password) {
                        const formatPhoneNumber = (phone?: string) => {
                            if (!phone) return undefined;
                            const cleaned = phone.replace(/[^0-9+]/g, '');
                            if (cleaned.startsWith('+')) return cleaned;
                            if (cleaned.startsWith('0')) return `+81${cleaned.slice(1)}`;
                            return cleaned;
                        };

                        const user = await adminAuth.createUser({ 
                            email: email || '', password, displayName: contactPerson || '', 
                            phoneNumber: formatPhoneNumber(phoneNumber) 
                        });
                        
                        await stripe.customers.update(customerId, { metadata: { firebaseUid: user.uid } });

                        await adminDb.collection('users').doc(user.uid).set({
                            uid: user.uid, email: email || '', displayName: contactPerson || '',
                            companyName: companyName || '', address: address || '', phoneNumber: phoneNumber || '',
                            stripeCustomerId: customerId,
                            roles: admin.firestore.FieldValue.arrayUnion(serviceType),
                            [`${serviceType}SubscriptionStatus`]: subscriptionStatus,
                            createdAt: admin.firestore.FieldValue.serverTimestamp(),
                            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                        }, { merge: true });

                        console.log(`✅ Webhook: New user created successfully.`);
                    } else {
                         console.warn('Webhook Warning: New user flow but missing email/password in session metadata.');
                    }
                } else if (metadata.firebaseUid) {
                    // --- Handle existing user adding a new service ---
                    const { firebaseUid } = metadata;
                    console.log(`Webhook: Adding service (${serviceType}) to existing user (UID: ${firebaseUid})`);
                    const userDocRef = adminDb.collection('users').doc(firebaseUid);
                    
                    await userDocRef.set({
                        roles: admin.firestore.FieldValue.arrayUnion(serviceType),
                        [`${serviceType}SubscriptionStatus`]: subscriptionStatus,
                        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                    }, { merge: true });

                    console.log(`✅ Webhook: Successfully added service to existing user.`);
                } else {
                    console.error('Webhook Error: firebaseUid or new user flag not found in metadata.');
                }
                break;
        }
        res.status(200).json({ received: true });
    } catch (err: any) {
        console.error(`Webhook handler error: ${err.message}`);
        res.status(500).json({ error: `Webhook handler error: ${err.message}` });
    }
};

export default handler;













