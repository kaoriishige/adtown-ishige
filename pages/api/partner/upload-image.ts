import type { NextApiRequest, NextApiResponse } from 'next';
import { adminAuth, getAdminDb } from '@/lib/firebase-admin';
import nookies from 'nookies';
import admin from 'firebase-admin';
import { IncomingForm } from 'formidable';
import { promises as fs } from 'fs';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const cookies = nookies.get({ req });
    const token = await adminAuth().verifySessionCookie(cookies.token, true);
    const { uid } = token;

    const form = new IncomingForm();
    const { files } = await new Promise<{ files: any }>((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) return reject(err);
        resolve({ files });
      });
    });

    const imageFile = files.image[0];
    if (!imageFile) {
      return res.status(400).json({ error: '画像ファイルが見つかりません。' });
    }

    const bucketName = process.env.FIREBASE_STORAGE_BUCKET;
    if (!bucketName) throw new Error("FIREBASE_STORAGE_BUCKET is not set");

    const bucket = admin.storage().bucket(bucketName);
    const filePath = imageFile.filepath;
    const fileName = `storeDeals/${uid}/${Date.now()}-${imageFile.originalFilename}`;
    
    await bucket.upload(filePath, {
      destination: fileName,
      metadata: { contentType: imageFile.mimetype },
    });
    
    await fs.unlink(filePath);
    
    const file = bucket.file(fileName);
    const [publicUrl] = await file.getSignedUrl({
        action: 'read',
        expires: '03-17-2030',
    });

    return res.status(200).json({ imageUrl: publicUrl });

  } catch (error) {
    console.error('Image upload error:', error);
    return res.status(500).json({ error: 'サーバーエラーが発生しました。' });
  }
}