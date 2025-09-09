import type { NextApiRequest, NextApiResponse } from 'next';
// Firebase Admin SDK を初期化する設定ファイルをインポートする想定
// import { getAdminDb } from '../../../lib/firebase-admin';

// データベース処理のダミー関数（実際のFirebase処理に置き換えてください）
const savePartnerData = async (data: any) => {
  console.log("データベースに保存するデータ:", data);
  // 実際のFirebase Admin SDKを使ったコード例：
  // const db = getAdminDb();
  // const docRef = await db.collection('partners').add(data);
  // return docRef.id;

  // テスト用の仮IDを返す
  return `partner_${Date.now()}`;
};


type ResponseData = {
  message: string;
  id?: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  // POSTリクエスト以外は許可しない
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ message: `Method ${req.method} Not Allowed` });
  }

  try {
    // フロントエンドから送信されたデータを取得
    const { storeName, address, area, contactPerson, phoneNumber, email, password, category } = req.body;

    // 必須項目のバリデーション
    if (!storeName || !address || !area || !contactPerson || !phoneNumber || !email || !password || !category) {
      return res.status(400).json({ message: '必須項目が不足しています。' });
    }

    // データベースに保存するデータを整形
    const newPartner = {
      storeName,
      address,
      area,
      contactPerson,
      phoneNumber,
      email,
      // パスワードはそのまま保存せず、ハッシュ化するのが望ましいですが、ここでは省略します
      category, // { main: '...', sub: '...' } の形式
      status: 'pending', // 管理者による承認待ちステータス
      createdAt: new Date().toISOString(),
    };

    // データベースに保存
    const newPartnerId = await savePartnerData(newPartner);

    // 成功した場合は、201 Created ステータスとメッセージを返す
    res.status(201).json({ message: 'パートナー申請を受け付けました。', id: newPartnerId });

  } catch (error) {
    console.error('パートナー登録APIでエラー:', error);
    res.status(500).json({ message: 'サーバー側でエラーが発生しました。' });
  }
}