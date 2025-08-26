import type { NextApiRequest, NextApiResponse } from 'next';
import { getAdminAuth, getAdminDb } from '@/lib/firebase-admin';
import nookies from 'nookies';
import { FieldValue } from 'firebase-admin/firestore';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    // 1. Authenticate the user
    const cookies = nookies.get({ req });
    const token = await getAdminAuth().verifySessionCookie(cookies.token, true);
    const userDoc = await getAdminDb().collection('users').doc(token.uid).get();
    if (!userDoc.exists || userDoc.data()?.role !== 'partner') {
      return res.status(403).json({ error: 'Forbidden: User is not a partner' });
    }
    const partnerUid = token.uid;

    // 2. Validate the incoming data
    const { dealType, itemName, discountRate, quantity, sellTime, items } = req.body;
    if (!dealType || !sellTime) {
      return res.status(400).json({ error: 'Required fields (deal type, sales time) are missing.' });
    }

    let dealData: any;
    if (dealType === 'percentage') {
      if (!itemName || !discountRate || !quantity) {
        return res.status(400).json({ error: 'Required fields (item name, discount rate, quantity) are missing.' });
      }
      if (typeof discountRate !== 'number' || discountRate <= 0 || discountRate > 100) {
        return res.status(400).json({ error: 'Discount rate must be a number between 1 and 100.' });
      }
      if (typeof quantity !== 'number' || quantity <= 0) {
        return res.status(400).json({ error: 'Quantity must be a number greater than 0.' });
      }
      dealData = { itemName, discountRate, quantity };
    } else if (dealType === 'fixed') {
      if (!Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ error: 'At least one item must be registered.' });
      }
      for (const item of items) {
        if (!item.name || !item.price || !item.quantity) {
          return res.status(400).json({ error: `Required fields (name, price, quantity) are missing for item "${item.name || ''}".` });
        }
        if (typeof item.price !== 'number' || item.price < 0) {
            return res.status(400).json({ error: `The price for item "${item.name}" is invalid.`});
        }
        if (typeof item.quantity !== 'number' || item.quantity <= 0) {
            return res.status(400).json({ error: `The quantity for item "${item.name}" must be greater than 0.`});
        }
      }
      dealData = { items };
    } else {
      return res.status(400).json({ error: 'Invalid deal type.' });
    }

    // 3. Save the data to the database
    const newDeal = {
      partnerUid,
      ...dealData,
      dealType,
      sellTime,
      notes: req.body.notes || '',
      isActive: true,
      createdAt: FieldValue.serverTimestamp(),
    };
    const docRef = await getAdminDb().collection('foodLossDeals').add(newDeal);
    const doc = await docRef.get();
    const data = doc.data()!; // Using non-null assertion as we just created it

    // 4. Return the newly created deal object as a success response
    const createdDeal = {
      id: doc.id,
      item: data.item || data.itemName,
      price: data.price || null,
      quantity: data.quantity,
      createdAt: data.createdAt.toDate().toLocaleString('ja-JP', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit'}),
    };

    return res.status(200).json({ 
        success: true, 
        message: 'Food loss information registered.',
        newDeal: createdDeal 
    });

  } catch (error: any) {
    console.error('Error in submit-deal API:', error);
    if (error.code === 'auth/session-cookie-expired' || error.code === 'auth/session-cookie-revoked') {
      return res.status(401).json({ error: 'Unauthorized: Session expired. Please login again.' });
    }
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}