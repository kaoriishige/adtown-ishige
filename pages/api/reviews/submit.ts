import { NextApiRequest, NextApiResponse } from 'next';
import { adminAuth, adminDb } from '../../../lib/firebase-admin';
import { getStorage } from 'firebase-admin/storage';
import nookies from 'nookies';
import formidable from 'formidable';
import * as admin from 'firebase-admin';

export const config = {
    api: {
        bodyParser: false,
    },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') { return res.status(405).end(); }

    try {
        const cookies = nookies.get({ req });
        const token = await adminAuth().verifySessionCookie(cookies.token, true);
        const { uid } = token;

        const form = formidable({});
        const [fields, files] = await form.parse(req);

        const { storeId, storeName, text } = fields;
        const imageFile = files.image;

        if (!storeId || !text || !imageFile) {
            return res.status(400).json({ error: 'Required fields are missing.' });
        }
        
        const file = imageFile[0];

        // ▼▼▼【修正点】ファイル名とファイルタイプの存在をより厳密にチェック ▼▼▼
        if (!file.originalFilename || !file.mimetype) {
            return res.status(400).json({ error: 'File name or file type is missing.' });
        }
        // ▲▲▲

        const bucket = getStorage().bucket();
        const filePath = `reviews/${uid}/${Date.now()}_${file.originalFilename}`;
        
        await bucket.upload(file.filepath, {
            destination: filePath,
            metadata: {
                contentType: file.mimetype,
            },
        });
        
        const imageUrl = `https://storage.googleapis.com/${bucket.name}/${filePath}`;

        const db = adminDb();
        await db.collection('reviews').add({
            userId: uid,
            storeId: Array.isArray(storeId) ? storeId[0] : storeId,
            storeName: Array.isArray(storeName) ? storeName[0] : storeName,
            text: Array.isArray(text) ? text[0] : text,
            imageUrl: imageUrl,
            status: 'pending',
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        res.status(200).json({ success: true, message: 'Review submitted for approval.' });

    } catch (error: any) {
        console.error("Review submission failed:", error);
        res.status(500).json({ error: error.message || 'Internal Server Error' });
    }
}