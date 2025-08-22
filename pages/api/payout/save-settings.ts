import { NextApiRequest, NextApiResponse } from 'next';
import Stripe from 'stripe';
import { getAdminAuth, getAdminDb } from '../../../lib/firebase-admin';
import nookies from 'nookies';

// Stripe SDKを初期化
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  // ▼▼▼ 変更点 1: TypeScriptが要求するAPIバージョンに修正 ▼▼▼
  apiVersion: '2024-04-10',
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    // 1. ユーザーを認証
    const cookies = nookies.get({ req });
    const token = await getAdminAuth().verifySessionCookie(cookies.token, true);
    const { uid } = token;

    // 2. リクエストから口座情報を取得
    const { bankName, branchName, accountNumber, accountName } = req.body;
    if (!bankName || !branchName || !accountNumber || !accountName) {
      return res.status(400).json({ error: 'すべての必須フィールドを入力してください。' });
    }

    const adminDb = getAdminDb();
    const userRef = adminDb.collection('users').doc(uid);
    const userDoc = await userRef.get();
    if (!userDoc.exists) {
      return res.status(404).json({ error: 'ユーザーが見つかりません。' });
    }

    let stripeAccountId = userDoc.data()?.stripeAccountId;

    // 3. Stripe Connectアカウントがなければ新規作成
    if (!stripeAccountId) {
      const account = await stripe.accounts.create({
        type: 'custom',
        country: 'JP',
        email: userDoc.data()?.email,
        capabilities: {
          transfers: { requested: true },
        },
      });
      stripeAccountId = account.id;
      // 作成したStripeアカウントIDをFirestoreに保存
      await userRef.update({ stripeAccountId });
    }

    // 4. Stripeに銀行口座を登録
    await stripe.accounts.createExternalAccount(stripeAccountId, {
      external_account: {
        object: 'bank_account',
        country: 'JP',
        currency: 'jpy',
        account_holder_name: accountName,
        account_holder_type: 'individual',
        // ▼▼▼ 変更点 2: 正しいプロパティ名 'routing_number' を使用 ▼▼▼
        // 本番環境では、銀行コードと支店コードを結合したものを設定する必要があります。
        // ここでは、ユーザーが入力した銀行名と支店名を結合して渡します。
        routing_number: `${bankName} ${branchName}`, 
        account_number: accountNumber,
      },
    });

    // Firestoreには口座情報そのものではなく、Stripeに登録済みであることを示すフラグを保存
    await userRef.update({
      payoutSettings: {
        registered: true,
        updatedAt: new Date(),
      }
    });

    res.status(200).json({ success: true, message: '口座情報が正常に保存されました。' });

  } catch (error: any) {
    console.error('Error saving payout settings to Stripe:', error);
    res.status(500).json({ error: error.message || 'サーバー内部でエラーが発生しました。' });
  }
}

