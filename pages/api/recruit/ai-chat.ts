// File: /pages/api/recruit/ai-chat.ts
// AIチャットコンサルティング用 API (Gemini利用)

import type { NextApiRequest, NextApiResponse } from "next";
import { GoogleGenAI } from "@google/genai"; // 🚨 動作には npm install @google/genai が必要です

// --- 型定義 ---

type AppealPoints = {
  growth?: string[];
  wlb?: string[];
  benefits?: string[];
  atmosphere?: string[];
  organization?: string[];
};

// フロントエンドから渡される求人情報 (requiredSkills/welcomeSkills は直下)
type Recruitment = {
  id: string;
  title: string;
  description: string;
  jobTitle: string;
  salaryMin: number;
  salaryMax: number;
  salaryType: string;
  location: string;
  employmentType: string;
  remotePolicy: string;
  workingHours: string;
  appealPoints: AppealPoints;
  requiredSkills?: string; 
  welcomeSkills?: string;
};

// フロントエンドから渡されるチャットメッセージの履歴
type ChatMessage = {
  role: 'user' | 'ai';
  content: string;
};

// リクエストボディの型
type ChatRequestBody = {
  currentRecruitment: Recruitment;
  history: ChatMessage[];
  prompt: string;
};

// レスポンスの型
type ChatResponse = {
  response: string;
};

/**
 * --- 外部LLM連携（Gemini 実装） ---
 */
async function callExternalLLM(
  systemPrompt: string, 
  userPrompt: string, 
  history: ChatMessage[]
): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY; 
  if (!apiKey) {
    console.error("GEMINI_API_KEY is not set.");
    // 開発時にキーが未設定の場合のエラーメッセージ
    await new Promise(resolve => setTimeout(resolve, 1500)); 
    return "システムエラー：AIコンサルタント機能を利用するには、環境変数 GEMINI_API_KEY を設定してください。";
  }
  
  const ai = new GoogleGenAI({ apiKey }); 
  const model = "gemini-2.5-flash"; // 高速でチャットに適したモデル

  // Gemini API の履歴フォーマットに変換
  // 'user'は'user'、'ai'は'model'としてマッピングする
  const contents = history.map(msg => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }]
  }));
  
  // 現在のユーザープロンプトを contents の最後に追加
  const userContents = { role: 'user', parts: [{ text: userPrompt }] };
  
  try {
    const response = await ai.models.generateContent({
      model: model,
      // 履歴と現在のプロンプトをcontentsとして渡す
      contents: [...contents, userContents], 
      config: {
        systemInstruction: systemPrompt, // AIの役割とルールを定義
      }
    });

    // 応答のテキストを返却
    if (!response.text) {
        return "AIから有効な応答が得られませんでした。";
    }
    return response.text.trim();

  } catch (error) {
    console.error("Gemini API call failed:", error);
    return "AIサービスとの通信中にエラーが発生しました。ログを確認してください。";
  }
}


/**
 * --- API Handler ---
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ChatResponse | { error: string }>
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method Not Allowed - use POST" });
  }

  const body = req.body as Partial<ChatRequestBody> | undefined;
  
  // 入力チェック
  if (!body || !body.currentRecruitment || !body.prompt) {
    return res.status(400).json({ error: "リクエストボディまたは必須フィールドが不足しています。" });
  }
  
  try {
    const { currentRecruitment, history, prompt } = body as ChatRequestBody;

    // AIコンサルタントとしての役割と、求人情報をコンテキストとして定義
    const systemPrompt = `あなたはプロの採用コンサルタントAIです。
      以下の【求人情報】を深く理解した上で、求職者にとって魅力的で具体的な改善提案を日本語で行ってください。
      回答は質問に直接答え、親切かつプロフェッショナルなトーンで統一し、冗長な前置きは避けてください。
      
      【求人情報】
      職種: ${currentRecruitment.jobTitle}
      給与: ${currentRecruitment.salaryType} ${currentRecruitment.salaryMin}~${currentRecruitment.salaryMax}
      説明: ${currentRecruitment.description}
      必須スキル: ${currentRecruitment.requiredSkills || '未記入'}
      福利厚生数: ${currentRecruitment.appealPoints.benefits?.length || 0}
      勤務地: ${currentRecruitment.location}
      雇用形態: ${currentRecruitment.employmentType}
      `;

    // 外部LLMを呼び出す (非同期)
    const aiResponseText = await callExternalLLM(systemPrompt, prompt, history);

    // 成功応答をフロントエンドに返却
    return res.status(200).json({ response: aiResponseText });

  } catch (err: any) {
    console.error("ai-chat error:", err);
    return res.status(500).json({ error: "Internal server error in ai-chat processing" });
  }
}