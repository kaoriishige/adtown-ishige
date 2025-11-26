import type { NextApiRequest, NextApiResponse } from 'next';
import { GoogleGenerativeAI } from '@google/generative-ai';

// .env.local に入っているキーを使用
// (GEMINI_API_KEY または GOOGLE_API_KEY どちらでも動くようにしています)
const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey || "");

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb', // 画像用に制限緩和
    },
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { image } = req.body;

    if (!image) {
      return res.status(400).json({ message: '画像データがありません' });
    }

    if (!apiKey) {
      return res.status(500).json({ message: 'APIキーが設定されていません' });
    }

    // Base64ヘッダー削除
    const base64Data = image.replace(/^data:image\/\w+;base64,/, "");

    // Gemini 1.5 Flash (高速・無料枠あり)
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // ★ここがポイント：解説を充実させるための指示書
    const prompt = `
      あなたは「那須の母」と呼ばれる伝説の手相占い師です。
      送られてきた手のひらの画像を詳細に分析し、相談者が「自分の手のどこを見ればいいか」が分かるように解説付きで占ってください。

      画像が手相でない場合や、不鮮明で見えない場合は正直に「よく見えません」と伝えてください。
      
      【出力構成】
      以下の4つの項目について、必ず「線の特徴（事実）」と「その意味（解説）」をセットで話してください。

      1. **生命線（健康・バイタリティ）**
         - 「親指の付け根を囲むこの線が、あなたの場合〜〜（太い/長い/鎖状など）なっておるな」
         - 「これは〜〜という意味じゃよ」
         - 鑑定結果

      2. **知能線（才能・考え方）**
         - 「手のひらの中央を横切るこの線を見てごらん。〜〜に向かって伸びておる」
         - 「この向きは〜〜な才能がある証拠じゃ」
         - 鑑定結果

      3. **感情線（性格・恋愛）**
         - 「小指の下から人差し指へ向かう線じゃが、あなたの線は〜〜」
         - 鑑定結果

      4. **那須の母より（開運アドバイス）**
         - 手相全体から見た、今一番伝えるべき温かいメッセージ

      口調は「〜じゃよ」「〜だねぇ」「安心おし」といった、包容力のある温かいおばあちゃん言葉で統一してください。
      マークダウン形式で見やすく出力してください。
    `;

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: base64Data,
          mimeType: "image/jpeg",
        },
      },
    ]);

    const responseText = result.response.text();
    res.status(200).json({ result: responseText });

  } catch (error: any) {
    console.error('Gemini API Error:', error);
    res.status(500).json({ message: '鑑定中にエラーが発生しました。もう一度お試しください。' });
  }
}