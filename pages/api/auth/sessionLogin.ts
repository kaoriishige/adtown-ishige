import { NextApiRequest, NextApiResponse } from "next";
import { adminAuth } from "@/lib/firebase-admin";
import nookies from "nookies";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // 🔹 Authorizationヘッダー または body から idToken を取得
    const authHeader = req.headers.authorization;
    let idToken: string | undefined;

    if (authHeader && authHeader.startsWith("Bearer ")) {
      idToken = authHeader.split("Bearer ")[1];
    } else if (req.body?.idToken) {
      idToken = req.body.idToken;
    }

    if (!idToken) {
      return res.status(400).json({ error: "Missing ID token" });
    }

    // 🔹 セッションCookieを作成
    const expiresIn = 60 * 60 * 24 * 5 * 1000; // 5日間
    const sessionCookie = await adminAuth.createSessionCookie(idToken, { expiresIn });

    // 🔹 Cookieに保存（httpOnly）
    nookies.set({ res }, "session", sessionCookie, {
      maxAge: expiresIn / 1000,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // ローカルならfalse
      path: "/",
      sameSite: "lax",
    });

    return res.status(200).json({ message: "Session created" });
  } catch (error) {
    console.error("Session creation failed:", error);
    return res.status(401).json({ error: "Unauthorized" });
  }
}






