import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // POSTメソッド以外は拒否
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // サーバーサイド環境変数からAPIキーを取得 (.env.local)
    // 優先順位: GEMINI_API_KEY -> GOOGLE_API_KEY
    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

    // APIキーのチェック
    if (!apiKey) {
      console.error("API Key is missing in server environment");
      return res.status(500).json({ message: 'サーバーの設定エラー: APIキーが見つかりません。' });
    }

    const { ingredients, servings } = req.body;

    // 食材リストのチェック
    if (!ingredients || !Array.isArray(ingredients) || ingredients.length === 0) {
      return res.status(400).json({ message: '食材リストが空です。' });
    }

    // AIへの指示（プロンプト）
    const prompt = `
      あなたは家庭料理のプロです。以下の食材リストを使って作れる、簡単で美味しいレシピを1つだけ提案してください。
      主婦が喜ぶような、手軽で節約になるレシピが良いです。
      
      【条件】
      - 分量は **${servings || 2}人分** で計算してください。
      - 家にありそうな基本調味料（醤油、塩コショウ、マヨネーズ、酒、みりん、砂糖など）は自由に使ってOKです。
      - 食材リストにあるものすべてを使う必要はありません。
      
      【在庫食材リスト】
      ${ingredients.join(', ')}
      
      【出力フォーマット】
      ## 料理名
      (キャッチーなタイトル)
      
      **材料 (${servings || 2}人分):**
      - 食材A: 〇〇個
      - 食材B: 〇〇g
      - 調味料など
      
      **作り方:**
      1. 手順1
      2. 手順2
      3. 手順3
      
      **ポイント:**
      (美味しく作るコツや、時短テクニックを一言)
    `;

    // Google Generative Language API (REST) を呼び出す
    // プレビュー環境で動作する最新モデルを指定
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }]
        })
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Gemini API Error:', response.status, errorData);
      throw new Error(`AI API Error: ${response.status}`);
    }

    const data = await response.json();
    const resultText = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!resultText) {
      throw new Error('No text generated from AI');
    }

    // 結果を返す
    res.status(200).json({ result: resultText });

  } catch (error: any) {
    console.error('API Handler Error:', error);
    res.status(500).json({ 
      message: 'レシピ生成中にサーバーエラーが発生しました。',
      details: error.message 
    });
  }
}