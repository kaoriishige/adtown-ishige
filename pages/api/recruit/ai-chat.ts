import type { NextApiRequest, NextApiResponse } from "next";

const API_BASE = "https://generativelanguage.googleapis.com/v1beta";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "GEMINI_API_KEY not set" });
  }

  try {
    const { prompt, currentRecruitment } = req.body;

    if (!prompt || !currentRecruitment) {
      return res.status(400).json({ error: "Missing prompt or recruitment data" });
    }

    /* ① 利用可能モデル取得 */
    const modelsRes = await fetch(`${API_BASE}/models?key=${apiKey}`);
    const modelsData = await modelsRes.json();

    const model = modelsData.models?.find((m: any) =>
      m.supportedGenerationMethods?.includes("generateContent")
    );

    if (!model) {
      return res.status(500).json({ error: "No usable Gemini model" });
    }

    /* ② AIコンサル専用プロンプト */
    const systemPrompt = `
あなたは「求人改善に特化したプロの採用コンサルタントAI」です。

【ルール】
・「はい」「OK」などの相槌は禁止
・必ず理由 → 問題点 → 改善案 → そのまま使える文章例 の順で答える
・抽象論、精神論は禁止
・日本の中小企業採用を前提にする
`;

    const context = `
【求人情報】
職種名: ${currentRecruitment.title}
仕事内容: ${currentRecruitment.description}
勤務地: ${currentRecruitment.location}
雇用形態: ${currentRecruitment.employmentType}
給与: ${currentRecruitment.salaryMin}〜${currentRecruitment.salaryMax}
`;

    /* ③ 生成 */
    const genRes = await fetch(
      `${API_BASE}/${model.name}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [
                {
                  text: `
${systemPrompt}

${context}

【相談内容】
${prompt}

→ 採用成果が上がる具体的なアドバイスを出してください。
`,
                },
              ],
            },
          ],
        }),
      }
    );

    const genData = await genRes.json();

    const text =
      genData?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

    return res.status(200).json({
      response: text,
      modelUsed: model.name,
    });

  } catch (error: any) {
    console.error("❌ AI CHAT ERROR:", error);
    return res.status(500).json({ error: error.message });
  }
}


