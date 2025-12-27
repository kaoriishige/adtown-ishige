import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method not allowed' });

  console.log("--- Hugging Face API (最新URL版) 実行開始 ---");

  try {
    // 🛠️ エラーに従い、URLを新しく「router」に変更しました
    const modelUrl = "https://router.huggingface.co/hf-inference/models/stabilityai/stable-diffusion-xl-base-1.0";
    
    const response = await fetch(modelUrl, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        inputs: "A realistic cinematic portrait of a person 10 years older, high detail, masterpiece",
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.log("❌ APIエラー:", response.status, errorData);
      return res.status(response.status).json({ error: "AIの準備に時間がかかっています" });
    }

    const arrayBuffer = await response.arrayBuffer();
    const base64Image = Buffer.from(arrayBuffer).toString('base64');
    const imageUrl = `data:image/jpeg;base64,${base64Image}`;

    console.log("✅ ついに成功しました！画像を表示します。");
    res.status(200).json({ output: [imageUrl] });

  } catch (error) {
    console.error("❌ 通信エラー:", error);
    res.status(500).json({ error: "接続失敗" });
  }
}