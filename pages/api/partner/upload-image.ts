import type { NextApiRequest, NextApiResponse } from 'next';
import { getAdminAuth, getAdminDb } from '../../../lib/firebase-admin';
import nookies from 'nookies';
import admin from 'firebase-admin';
import { IncomingForm } from 'formidable';
import { promises as fs } from 'fs';

// formidableの設定: Next.jsのAPIルートではbodyParserを無効にする必要がある
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
    // ユーザー認証
    const cookies = nookies.get({ req });
    const token = await getAdminAuth().verifySessionCookie(cookies.token, true);
    const { uid } = token;

    // 画像ファイルのパース
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

    // Firebase Storageにアップロード
    const bucket = admin.storage().bucket(process.env.FIREBASE_STORAGE_BUCKET);
    const filePath = imageFile.filepath;
    const fileName = `storeDeals/${uid}/${Date.now()}-${imageFile.originalFilename}`;
    
    await bucket.upload(filePath, {
      destination: fileName,
      metadata: { contentType: imageFile.mimetype },
    });
    
    // アップロード後に一時ファイルを削除
    await fs.unlink(filePath);
    
    // 公開URLを取得
    const file = bucket.file(fileName);
    const [publicUrl] = await file.getSignedUrl({
        action: 'read',
        expires: '03-17-2030', // 遠い未来の日付を設定
    });

    return res.status(200).json({ imageUrl: publicUrl });

  } catch (error) {
    console.error('Image upload error:', error);
    return res.status(500).json({ error: 'サーバーエラーが発生しました。' });
  }
}