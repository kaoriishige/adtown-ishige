import { initializeApp, getApps, getApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import fs from 'fs';
import path from 'path';

const getAdminApp = () => {
  if (getApps().length > 0) {
    return getApp();
  }
  try {
    if (process.env.NODE_ENV === 'development') {
      const serviceAccountPath = path.resolve(process.cwd(), 'serviceAccountKey.json');
      const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf-8'));
      return initializeApp({ credential: cert(serviceAccount) });
    } else {
      const serviceAccountBase64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
      if (!serviceAccountBase64) { throw new Error('Firebase secret env var not set'); }
      const serviceAccount = JSON.parse(Buffer.from(serviceAccountBase64, 'base64').toString('utf-8'));
      return initializeApp({ credential: cert(serviceAccount) });
    }
  } catch (error) {
    console.error('Firebase Admin SDK initialization failed:', error);
    throw new Error('Could not initialize Firebase Admin SDK');
  }
};

export const getAdminDb = () => getFirestore(getAdminApp());
export const getAdminAuth = () => getAuth(getAdminApp());