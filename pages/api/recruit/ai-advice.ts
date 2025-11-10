// File: /pages/api/recruit/ai-advice.ts
// Next.js API route (TypeScript)
// 完全版：求人AIアドバイスAPI
// - 入力チェック
// - 自動スコアリング（riskScore）
// - 改善提案（suggestions）
// - 応募転換率見積もり（conversionRate）
// - スコア目安（scoreGuide）
// - (任意) OpenAI を使って提案文を強化する箇所あり（環境変数 OPENAI_API_KEY）

import type { NextApiRequest, NextApiResponse } from "next";

/**
 * --- 型定義 ---
 */
type AppealPoints = {
  growth?: string[]; // 成長支援（研修等）
  wlb?: string[]; // ワークライフバランス
  benefits?: string[]; // 福利厚生（手当等）
  atmosphere?: string[]; // 職場の雰囲気
  organization?: string[]; // 組織情報（上司、人数等）
};

type RecruitmentInput = {
  id: string;
  jobTitle: string;
  description: string;
  salaryMin?: number;
  salaryMax?: number;
  salaryType?: "年収" | "月給" | "時給" | "その他";
  location?: string;
  employmentType?: string; // 正社員・契約・派遣等
  remotePolicy?: string;
  workingHours?: string;
  requiredSkills?: string;
  welcomeSkills?: string;
  appealPoints?: AppealPoints;
  postedAt?: string; // ISO date optional
  // 任意フィールド（将来拡張用）
  [key: string]: any;
};

type ScoreGuideItem = {
  range: string;
  label: string;
  meaning: string;
};

type AdviceData = {
  summary: string;
  suggestions: string[];
  riskScore: number; // 0 (低リスク＝優秀) 〜100 (高リスク＝要改善)
  conversionRate: number; // 0-100 の見積もり応募転換率
  premiumRecommendation?: string; // 深掘り改善案（文字列）
  scoreMeaning: string;
  scoreLevel: string;
  scoreGuide: ScoreGuideItem[];
};

/**
 * --- ユーティリティ関数 ---
 */
const clamp = (v: number, a = 0, b = 100) => Math.max(a, Math.min(b, v));

/**
 * スコア目安表（表示用）
 */
const DEFAULT_SCORE_GUIDE: ScoreGuideItem[] = [
  { range: "0〜20", label: "優秀", meaning: "非常に完成度が高く、応募率が高い求人です。" },
  { range: "21〜40", label: "良好", meaning: "一部改善すれば高い応募率が期待できます。" },
  { range: "41〜60", label: "普通", meaning: "平均的内容。改善でさらに向上可能です。" },
  { range: "61〜80", label: "注意", meaning: "情報の欠落・抽象表現が多く、改善が必要です。" },
  { range: "81〜100", label: "危険", meaning: "応募が集まりにくい構成。全面改修が望まれます。" },
];

/**
 * メイン解析ロジック：求人データを受け取り、AdviceData を返す（同期）
 * - 必要なら非同期で OpenAI を呼ぶパスを用意してある（コメント参照）。
 */
async function performAIAnalysis(data: RecruitmentInput): Promise<AdviceData> {
  // 初期化
  let riskScore = 0;
  const suggestions: string[] = [];
  const summaryParts: string[] = [];

  const title = (data.jobTitle || "").trim();
  const desc = (data.description || "").trim();
  const required = (data.requiredSkills || "").trim();
  const welcome = (data.welcomeSkills || "").trim();
  const salaryMin = data.salaryMin ?? 0;
  const salaryMax = data.salaryMax ?? 0;
  const salaryType = data.salaryType ?? "年収";
  const appeal = data.appealPoints ?? {};
  const benefitCount = Array.isArray(appeal.benefits) ? appeal.benefits.length : 0;

  // ---------- タイトル評価 ----------
  if (!title) {
    riskScore += 18;
    suggestions.push("【タイトル未記入】職種名・雇用形態・勤務地を含む短い訴求文をつけましょう。");
    summaryParts.push("タイトルが未設定です。");
  } else {
    // 推奨文字数 20〜45 文字（日本語）を目安にする
    const len = title.length;
    if (len < 12) {
      riskScore += 6;
      suggestions.push("【タイトル短い】20文字前後で職種＋魅力（例：福利厚生）を追加しましょう。");
      summaryParts.push("タイトルの訴求力が弱い。");
    } else if (len > 80) {
      riskScore += 4;
      suggestions.push("【タイトル長い】簡潔にして検索や一覧で目に留まりやすくしましょう。");
    }
  }

  // ---------- 仕事内容（具体性） ----------
  if (!desc) {
    riskScore += 30;
    suggestions.push("【仕事内容未記入】業務内容、1日の流れ、成果指標を具体的に書いてください。");
    summaryParts.push("仕事内容が未記入または空です。");
  } else {
    if (desc.length < 200) {
      riskScore += 8;
      suggestions.push("【説明短い】400文字前後で日常業務・関わるメンバー・成果の基準を書くと良いです。");
      summaryParts.push("説明量が少ないため応募者がイメージしづらい。");
    }
    // キーワード出現チェック（心理訴求）
    const triggers = ["安心", "挑戦", "成長", "仲間", "チーム", "社会", "地域", "裁量"];
    let triggerFound = 0;
    for (const t of triggers) if (desc.includes(t)) triggerFound++;
    if (triggerFound < 2) {
      riskScore += 6;
      suggestions.push("【心理訴求】応募者の感情に訴える単語（安心・成長・仲間など）を自然に入れてください。");
    }
  }

  // ---------- スキル・要件 ----------
  if (!required) {
    riskScore += 12;
    suggestions.push("【必須スキル未記入】最低限必要な経験・資格・実務年数を明確にしてください。");
    summaryParts.push("必須スキルの記載が不足。");
  } else if (required.length < 30) {
    riskScore += 5;
    suggestions.push("【必須スキル】記述が簡潔すぎます。具体例（使用ツール・業務経験年数）を追加しましょう。");
  }

  if (!welcome || welcome.length < 20) {
    riskScore += 3;
    suggestions.push("【歓迎スキル】歓迎スキルは「学習意欲がある方歓迎」だけでなく具体的に書くと良いです。");
  }

  // ---------- 給与評価 ----------
  if (salaryType === "年収") {
    if (!salaryMin && !salaryMax) {
      riskScore += 10;
      suggestions.push("【給与未提示】給与は応募率に直結します。給与レンジを明記してください。");
    } else {
      // 相対的チェック（簡易）
      if (salaryMin > 0 && salaryMin < 250) {
        riskScore += 10;
        suggestions.push("【給与低め】最低年収が相対的に低めです。待遇面を検討してください。");
      }
      if (salaryMax - salaryMin > Math.max(100, salaryMin * 0.8)) {
        riskScore += 6;
        suggestions.push("【給与レンジ幅】レンジが広すぎて応募者が判断しづらいです。等級や到達目安を示しましょう。");
      }
    }
  } else {
    // 月給 / 時給 等の基本チェック
    if (!salaryMin) {
      riskScore += 6;
      suggestions.push("【給与未提示】給与を明確にすると応募率が上がります。");
    }
  }

  // ---------- 福利厚生 / 魅力 ----------
  if (benefitCount < 3) {
    riskScore += 6;
    suggestions.push("【福利厚生】代表的な制度（住宅手当、賞与、育休、副業可など）を3つ以上書きましょう。");
  }

  if (!appeal.atmosphere || (Array.isArray(appeal.atmosphere) && appeal.atmosphere.length === 0)) {
    riskScore += 4;
    suggestions.push("【職場の雰囲気】チーム構成や平均年齢、イベント頻度などを明記すると応募者の安心感が上がります。");
  }

  // ---------- 組織情報 ----------
  if (!appeal.organization || (Array.isArray(appeal.organization) && appeal.organization.length === 0)) {
    riskScore += 6;
    suggestions.push("【組織情報】上司のプロフィール（経験年数）や部署人数を加えると応募者のフィット判断がしやすくなります。");
  }

  // ---------- 表記・読みやすさ ----------
  // 箇条書きの有無チェック（簡易）
  const bullets = desc.match(/[-・●●\n]/g);
  if (!bullets) {
    // まったく箇条がない場合は減点（読みづらい）
    riskScore += 5;
    suggestions.push("【読みやすさ】箇条書きを増やして重要点を目立たせると読みやすく応募率が上がります。");
  }

  // ---------- 合成と正規化 ----------
  // 基本的に riskScore は 0-100 に正規化
  riskScore = clamp(Math.round(riskScore), 0, 99);

  // 応募転換率の簡易推定（経験則ベースの回帰風）
  const baseConversion = 92 - riskScore * 0.6;
  const conversionRate = clamp(Math.round(baseConversion), 5, 98);

  // スコア意味判定
  let scoreLevel = "普通";
  let scoreMeaning = "平均的内容。改善でさらに向上可能です。";
  if (riskScore <= 20) {
    scoreLevel = "優秀";
    scoreMeaning = "非常に完成度が高く、応募率が高い求人です。";
  } else if (riskScore <= 40) {
    scoreLevel = "良好";
    scoreMeaning = "一部改善すれば高い応募率が期待できます。";
  } else if (riskScore <= 60) {
    scoreLevel = "普通";
    scoreMeaning = "平均的内容。改善でさらに向上可能です。";
  } else if (riskScore <= 80) {
    scoreLevel = "注意";
    scoreMeaning = "改善が必要。具体的要素の追加を推奨します。";
  } else {
    scoreLevel = "危険";
    scoreMeaning = "構成の見直しが必要。全面的に改善しましょう。";
  }

  // プレミアムな改善案（短いテンプレ）
  const premiumRecommendation = [
    "1) 働き方のストーリー（社員の1日）を入れる",
    "2) 数字で示す（残業平均・定着率・昇進事例）",
    "3) 写真/動画と社員コメントで信頼感を上げる",
    "4) タイトル・冒頭に最も訴求したい点を一文で入れる"
  ].join(" / ");

  const summary =
    summaryParts.length > 0
      ? `この求人には ${summaryParts.length} 個の主要改善点があります。主な指摘：${summaryParts.join(" ")}`
      : "構成・内容ともにバランスが取れており、求職者に強く訴求できる求人です。";

  const advice: AdviceData = {
    summary,
    suggestions,
    riskScore,
    conversionRate,
    premiumRecommendation,
    scoreMeaning,
    scoreLevel,
    scoreGuide: DEFAULT_SCORE_GUIDE,
  };

  // --- 拡張案: OpenAIで自然言語の改善提案を生成したい場合 ---
  // 環境変数 OPENAI_API_KEY が設定されていれば、下記のパスで
  // OpenAI API (or any LLM) に要約・改善文章の生成を委託できます。
  //
  // 例（擬似コード・要実装）:
  // if (process.env.OPENAI_API_KEY) {
  //   const prompt = `求人: ${title}\n説明: ${desc}\n指摘:${suggestions.join('\n')}\n改善案を日本語で詳しく400字で。`;
  //   const llmResult = await callOpenAI(prompt, process.env.OPENAI_API_KEY);
  //   if (llmResult) advice.premiumRecommendation = llmResult;
  // }
  //
  // ※ 実際に使う場合は公式OpenAI SDKやfetchでAPIを叩くロジックを追加してください。
  // ※ サンプルは含めていますが、デフォルトでは外部OpenAI呼び出しは行いません。

  return advice;
}

/**
 * API Handler
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse<AdviceData | { error: string }>) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method Not Allowed - use POST" });
  }

  // 入力を受け取る
  const body = req.body as Partial<RecruitmentInput> | undefined;
  if (!body) return res.status(400).json({ error: "Empty request body" });

  // 基本バリデーション
  const requiredKeys = ["id", "jobTitle", "description"];
  for (const k of requiredKeys) {
    if (!body[k as keyof RecruitmentInput]) {
      return res.status(400).json({ error: `必須フィールドが不足しています: ${k}` });
    }
  }

  try {
    const input: RecruitmentInput = {
      id: String(body.id),
      jobTitle: String(body.jobTitle),
      description: String(body.description),
      salaryMin: typeof body.salaryMin === "number" ? body.salaryMin : body.salaryMin ? Number(body.salaryMin) : undefined,
      salaryMax: typeof body.salaryMax === "number" ? body.salaryMax : body.salaryMax ? Number(body.salaryMax) : undefined,
      salaryType: (body.salaryType as any) || undefined,
      location: body.location ? String(body.location) : undefined,
      employmentType: body.employmentType ? String(body.employmentType) : undefined,
      remotePolicy: body.remotePolicy ? String(body.remotePolicy) : undefined,
      workingHours: body.workingHours ? String(body.workingHours) : undefined,
      requiredSkills: body.requiredSkills ? String(body.requiredSkills) : undefined,
      welcomeSkills: body.welcomeSkills ? String(body.welcomeSkills) : undefined,
      appealPoints: (body.appealPoints as AppealPoints) || {},
      postedAt: body.postedAt ? String(body.postedAt) : undefined,
      // 追加フィールドはそのまま通す
      ...body,
    };

    const result = await performAIAnalysis(input);
    return res.status(200).json(result);
  } catch (err: any) {
    console.error("ai-advice error:", err);
    return res.status(500).json({ error: "Internal server error in ai-advice" });
  }
}

/**
 * --- サンプルPOSTボディ（JSON） ---
 * {
 *  "id": "abc-123",
 *  "jobTitle": "フロントエンドエンジニア（React/TypeScript）",
 *  "description": "勤務地: 那須。業務内容: Webアプリの開発、UI改修。1日の流れ: ...",
 *  "salaryMin": 400,
 *  "salaryMax": 600,
 *  "salaryType": "年収",
 *  "location": "那須",
 *  "employmentType": "正社員",
 *  "requiredSkills": "React, TypeScript, Next.js",
 *  "welcomeSkills": "Tailwind, node.js",
 *  "appealPoints": {
 *     "benefits": ["住宅手当","賞与年2回","フレックス"],
 *     "growth": ["1on1","外部研修補助"],
 *     "atmosphere": ["平均年齢30代", "フラットな組織"],
 *     "organization": ["上司はCTO（開発10年）"]
 *  }
 * }
 *
 * --- 返却例（概略） ---
 * {
 *  "summary": "...",
 *  "suggestions": ["...", "..."],
 *  "riskScore": 42,
 *  "conversionRate": 67,
 *  "premiumRecommendation": "...",
 *  "scoreMeaning": "...",
 *  "scoreLevel": "普通",
 *  "scoreGuide": [ ... ]
 * }
 *
 * このファイルをベースに、UI表示用にさらに整形したり、
 * CSV出力、PDFレポート化、社内ルールに基づく自動修正提案の自動適用などに拡張できます。
 */



