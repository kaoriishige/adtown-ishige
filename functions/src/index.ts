import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import * as cors from "cors";

const corsHandler = cors({origin: true});

admin.initializeApp();
const db = admin.firestore();

interface SheetData {
    headers: string[];
    deals: any[][];
}

export const updateDealsFromSheet = functions
    .region("asia-northeast1")
    .runWith({ timeoutSeconds: 120 }) // タイムアウトを120秒に設定
    .https.onRequest((req, res) => {
        corsHandler(req, res, async () => {
            console.log("Function execution started.");
            if (req.method !== "POST") {
                res.status(405).send("Method Not Allowed");
                return;
            }

            try {
                const { headers, deals } = req.body as SheetData;

                if (!deals || !Array.isArray(deals)) {
                    res.status(400).send("dealsデータが正しくありません。");
                    return;
                }

                const batch = db.batch();

                console.log("Step 1: Deleting old documents...");
                const existingDocsSnapshot = await db.collection("deals").get();
                console.log(`Found ${existingDocsSnapshot.size} old documents.`);

                existingDocsSnapshot.docs.forEach((doc) => {
                    batch.delete(doc.ref);
                });
                console.log("Step 2: Adding new documents to batch...");

                deals.forEach((row) => {
                    if (!row[0]) { return; }

                    const dealData: {[key: string]: any} = {};
                    headers.forEach((header, i) => {
                        dealData[header] = row[i];
                    });

                    const newDocRef = db.collection("deals").doc();
                    batch.set(newDocRef, dealData);
                });
                console.log("Step 3: Committing batch...");

                await batch.commit();
                console.log("Step 4: Batch commit successful.");

                res.status(200).send({ message: `成功：${deals.length}件のデータを更新しました。` });

            } catch (error) {
                console.error("Firestoreの更新中にエラー発生:", error);
                res.status(500).send("サーバーエラーが発生しました。");
            }
        });
    });