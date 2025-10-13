// pages/api/ai-review.ts
import { adminDb } from '@/lib/firebase-admin';
import type { NextApiRequest, NextApiResponse } from 'next';

// Gemini APIを呼び出す関数
async function callGeminiApi(profileText: string) {
  const apiKey = process.env.GEMINI_API_KEY; // サーバーサイドでのみ使用するAPIキー
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}`;

  const systemPrompt = `
    あなたは、日本の労働法規（職業安定法、男女雇用機会均等法）、景品表示法、および主要な判例に精通した、**ゼロ・トレランス（一切の妥協を許さない）**のAIコンプライアンス・オフィサーです。
    あなたの唯一の任務は、求職者に誤解や不利益を与える可能性のある表現を**一切見逃さず**、法的・倫理的リスクを完全に排除することです。

    以下の基準に基づき、提出されたプロフィール文章を極めて厳格に審査してください。

    1.  **【差別の根絶】特定の層を不当に排除・優遇する表現の完全な排除:**
        * **禁止例:** 「20代が活躍中」「30歳までの方」「女性歓迎」「主婦歓迎」「男性限定」「体力に自信のある方」「営業マン募集」など、性別・年齢・国籍・心身の条件で応募を制限、あるいは特定の層を不当に歓迎していると解釈されうる全ての表現を検出してください。
        * **例外:** ポジティブ・アクションとして法的に認められるケース（例：女性比率が極端に低い職種での女性歓迎）のみを例外として許可します。

    2.  **【誇大・誤解表現の排除】客観的根拠のない表現の完全な排除:**
        * **禁止例:** 「誰でも稼げる」「必ず成功」「絶対」「楽な仕事」など、求職者に誤った期待を抱かせる断定的な表現や、客観的データの裏付けがない成功事例を検出してください。

    3.  **【労働条件の明確化】曖昧な表現の完全な排除:**
        * 給与範囲が、勤務地の最新の最低賃金を下回っていないか確認してください。
        * 「みなし残業代」「固定残業代」を含む場合、その金額と時間数が明確に記載されているか確認してください。記載がなければ不明確と判断してください。

    **【出力形式】**
    審査結果を、必ず以下のJSON形式で出力してください。
    - statusフィールドには、"approved" または "requires_changes" のいずれかの文字列を指定してください。
    - feedbackフィールドには、日本語で具体的かつ根拠に基づいたフィードバックを記述してください。
    - **判断基準:** 少しでも懸念があれば "requires_changes" と判断してください。"approved" は、法的にも倫理的にも完全にクリーンであるとあなたが保証できる場合にのみ使用してください。

    // 承認時の出力例:
    {
      "status": "approved",
      "feedback": "日本の労働法規および倫理規定に基づき、適正な内容であることを確認しました。"
    }

    // 修正が必要な場合の出力例:
    {
      "status": "requires_changes",
      "feedback": "要修正：「女性歓迎」という表現は、男女雇用機会均等法第5条に抵触する可能性があります。性別を限定しない表現に修正してください。"
    }
  `;

  const payload = {
    contents: [{ parts: [{ text: `以下の企業プロフィールを審査してください：\n\n${profileText}` }] }],
    systemInstruction: { parts: [{ text: systemPrompt }] },
    tools: [{ "google_search": {} }],
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`Gemini API error: ${response.statusText}`);
  }

  const result = await response.json();
  const text = result.candidates?.[0]?.content?.parts?.[0]?.text;
  
  if (!text) {
    throw new Error("Gemini APIからのレスポンスが空です。");
  }
  
  const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/);
  try {
    const jsonString = jsonMatch ? jsonMatch[1] : text;
    return JSON.parse(jsonString);
  } catch (e) {
    throw new Error("Invalid JSON format from Gemini API.");
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { uid } = req.body;
  if (!uid) {
    return res.status(400).json({ error: 'UID is required' });
  }

  try {
    const userRef = adminDb.collection('users').doc(uid);
    const userDoc = await userRef.get();
    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User not found' });
    }

    const profileData = userDoc.data()!;
    const profileText = `
      ミッション: ${profileData.ourMission}
      事業内容: ${profileData.whatWeDo}
      カルチャー: ${profileData.ourCulture}
      メッセージ: ${profileData.messageToCandidates}
      企業の制度・文化（雰囲気）: ${profileData.appealPoints?.atmosphere?.join(', ')}
      企業の制度・文化（成長機会）: ${profileData.appealPoints?.growth?.join(', ')}
      企業の制度・文化（WLB）: ${profileData.appealPoints?.wlb?.join(', ')}
      企業の制度・文化（福利厚生）: ${profileData.appealPoints?.benefits?.join(', ')}
    `;

    const reviewResult = await callGeminiApi(profileText);

    await userRef.update({
      verificationStatus: reviewResult.status === 'approved' ? 'verified' : 'rejected',
      aiFeedback: reviewResult.feedback,
      reviewedAt: new Date(),
    });

    res.status(200).json({ status: 'success', review: reviewResult });
  } catch (error: any) {
    console.error("AI Review API Error:", error);
    if (uid) {
        await adminDb.collection('users').doc(uid).update({
            verificationStatus: 'unverified',
            aiFeedback: "AI審査中にエラーが発生しました。時間をおいて再度お試しください。",
        });
    }
    res.status(500).json({ error: error.message });
  }
}