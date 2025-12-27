import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;

  // IDが送られてこなかった場合の防御
  if (!id || id === 'undefined') {
    return res.status(400).json({ error: "IDが指定されていません" });
  }

  try {
    const response = await fetch(`https://api.replicate.com/v1/predictions/${id}`, {
      headers: { "Authorization": `Token ${process.env.REPLICATE_API_TOKEN}` },
    });
    const data = await response.json();
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ error: "進捗確認に失敗しました" });
  }
}