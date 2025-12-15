// pages/users/login.tsx
import React, { useState } from 'react'
import type { NextPage } from 'next'
import { useRouter } from 'next/router'
import Link from 'next/link'
import Head from 'next/head'
import {
  getAuth,
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
} from 'firebase/auth'
import { app } from '@/lib/firebase'
import liff from '@line/liff'

import { FcGoogle } from 'react-icons/fc'
import { RiLoginBoxLine, RiInformationLine } from 'react-icons/ri'

/**
 * Firebase Auth エラー翻訳
 * ※ 型を単純化して構文エラー回避
 */
const translateFirebaseError = (err: any): string => {
  if (err && typeof err === 'object' && 'code' in err) {
    switch ((err as any).code) {
      case 'auth/user-not-found':
      case 'auth/wrong-password':
      case 'auth/invalid-credential':
        return 'メールアドレスまたはパスワードが正しくありません。'
      case 'auth/invalid-email':
        return 'メールアドレスの形式が正しくありません。'
      case 'auth/user-disabled':
        return 'このアカウントは無効になっています。'
      case 'auth/too-many-requests':
        return '試行回数が多すぎます。時間をおいて再度お試しください。'
      default:
        return 'ログインに失敗しました。'
    }
  }
  return '予期せぬエラーが発生しました。'
}

const LoginPage: NextPage = () => {
  const router = useRouter()
  const auth = getAuth(app)

  const [email, setEmail] = useState<string>('')
  const [password, setPassword] = useState<string>('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(false)

  /**
   * サーバーセッション作成（LIFF対応）
   */
  const createSession = async (user: any) => {
    const idToken = await user.getIdToken(true)

    const res = await fetch('/api/auth/sessionLogin', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${idToken}`,
      },
      body: JSON.stringify({ loginType: 'user' }),
      credentials: 'include',
    })

    if (!res.ok) {
      throw new Error('セッション作成に失敗しました')
    }

    // LIFFを壊さない遷移
    router.replace('/home')
  }

  /**
   * メールログイン
   */
  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const cred = await signInWithEmailAndPassword(auth, email, password)
      await createSession(cred.user)
    } catch (err: any) {
      setError(translateFirebaseError(err))
      setIsLoading(false)
    }
  }

  /**
   * Googleログイン（LIFF内は将来的に置き換え推奨）
   */
  const handleGoogleLogin = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const provider = new GoogleAuthProvider()
      const result = await signInWithPopup(auth, provider)
      await createSession(result.user)
    } catch (err: any) {
      setError(translateFirebaseError(err))
      setIsLoading(false)
    }
  }

  return (
    <>
      <Head>
        <title>ログイン - みんなの那須アプリ</title>
      </Head>

      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white p-8 rounded-xl shadow-xl space-y-6">
          <h1 className="text-3xl font-bold text-center">ログイン</h1>

          {error && (
            <div className="p-3 bg-red-50 border-l-4 border-red-400 text-red-700 text-sm flex">
              <RiInformationLine className="mr-2 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="email"
              placeholder="メールアドレス"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full p-3 border rounded"
            />

            <input
              type="password"
              placeholder="パスワード"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full p-3 border rounded"
            />

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-orange-500 text-white font-bold rounded disabled:bg-gray-400"
            >
              <RiLoginBoxLine className="inline mr-2" />
              ログイン
            </button>
          </form>

          <button
            onClick={handleGoogleLogin}
            disabled={isLoading}
            className="w-full py-3 border rounded flex items-center justify-center"
          >
            <FcGoogle className="mr-2 text-xl" />
            Googleでログイン
          </button>

          <div className="text-center text-sm space-y-2">
            <Link href="/users/signup" className="text-blue-600">
              新規登録はこちら
            </Link>

            {/* LIFF対応 LINEリンク */}
            <div className="pt-4 text-xs text-gray-600">
              ログインできない場合はLINEでご連絡ください
              <div className="mt-2">
                <button
                  type="button"
                  onClick={() =>
                    liff.openWindow({
                      url: 'https://lin.ee/8aXyUwD',
                      external: false,
                    })
                  }
                >
                  <img
                    src="https://scdn.line-apps.com/n/line_add_friends/btn/ja.png"
                    alt="友だち追加"
                    height="36"
                  />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default LoginPage

