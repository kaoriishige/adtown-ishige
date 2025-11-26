import type { NextApiRequest, NextApiResponse } from 'next';
import { GoogleGenerativeAI } from '@google/generative-ai';

// 環境変数からAPIキーを取得 (.env.local に GOOGLE_API_KEY を設定してください)
const API_KEY = process.env.GOOGLE_API_KEY || '';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { text } = req.body;

  if (!text) {
    return res.status(400).json({ message: 'Text is required' });
  }

  if (!API_KEY) {
    // APIキーがない場合は審査をスキップして通す（開発用）
    console.warn('Google API Key is missing. Skipping AI check.');
    return res.status(200).json({ safe: true });
  }

  try {
    const genAI = new GoogleGenerativeAI(API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    // 審査用のプロンプト（指示書）
    const prompt = `
      あなたは地域コミュニティアプリの優秀なモデレーターです。
      以下の投稿内容を審査し、不適切（誹謗中傷、暴力、詐欺、公序良俗に反する、個人情報の無断晒しなど）かどうかを判定してください。
      
      判定基準:
      - 多少の乱暴な言葉でも、文脈がジョークや許容範囲ならOKとする
      - 明らかな攻撃性、犯罪の示唆、差別的表現はNGとする
      - 「死ね」「殺す」などの直接的な暴言はNG
      
      対象テキスト:
      """
      ${text}
      """
      
      回答は以下のJSON形式のみで返してください。余計なmarkdown装飾は不要です。
      {
        "safe": boolean, // 安全ならtrue, 不適切ならfalse
        "reason": string // NGの場合、ユーザーに提示する修正理由（日本語、丁寧語）。OKの場合は空文字。
      }
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const textResponse = response.text();

    // JSON部分だけを抽出してパースする
    // (Geminiが ```json ... ``` で囲む場合があるため除去)
    const jsonStr = textResponse.replace(/```json/g, '').replace(/```/g, '').trim();
    const checkResult = JSON.parse(jsonStr);

    return res.status(200).json(checkResult);

  } catch (error) {
    console.error('Gemini API Error:', error);
    // エラー時は安全側に倒して通すか、エラーを返すか運用次第。今回はエラーを返す。
    return res.status(500).json({ message: 'AI審査中にエラーが発生しました' });
  }
}