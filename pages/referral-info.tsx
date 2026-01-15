import { useState, useEffect, useRef } from 'react';
import { GetServerSideProps, NextPage } from 'next';
import Link from 'next/link';
import Head from 'next/head';
import nookies from 'nookies';
import { QRCodeCanvas } from 'qrcode.react';
import { RiArrowLeftLine, RiFileCopyLine, RiDownloadCloud2Line, RiShieldUserLine } from 'react-icons/ri';

// Firebase Admin SDK (サーバーサイド認証用)
import { adminAuth, adminDb } from '../lib/firebase-admin';

// --- 型定義 ---
interface User {
  uid: string;
  email: string;
  plan: string;
}

interface ReferralInfoPageProps {
  user: User;
}

const ReferralInfoPage: NextPage<ReferralInfoPageProps> = ({ user }) => {
  const [referralLink, setReferralLink] = useState('');
  const [copied, setCopied] = useState(false);
  const qrCodeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // クライアント側で現在のドメインを取得してリンクを完成させる
    if (user) {
      const origin = window.location.origin;
      setReferralLink(`${origin}/?ref=${user.uid}`);
    }
  }, [user]);

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadQRCode = () => {
    const canvas = qrCodeRef.current?.querySelector('canvas');
    if (canvas) {
      const url = canvas.toDataURL("image/png");
      const a = document.createElement("a");
      a.href = url;
      a.download = `nasu-referral-${user.uid}.png`;
      a.click();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-10">
      <Head>
        <title>紹介システム - プレミアム会員限定</title>
      </Head>

      <div className="max-w-md mx-auto bg-white min-h-screen shadow-xl">
        {/* ヘッダー */}
        <div className="p-4 border-b flex items-center bg-white sticky top-0 z-10">
          <Link href="/mypage" className="p-2 hover:bg-gray-100 rounded-full transition">
            <RiArrowLeftLine size={24} className="text-gray-600" />
          </Link>
          <h1 className="ml-2 text-lg font-bold text-gray-800">紹介制度のご案内</h1>
        </div>

        <main className="p-6">
          {/* 会員ステータス表示 */}
          <div className="mb-8 p-4 bg-indigo-50 rounded-2xl border border-indigo-100 flex items-center">
            <div className="bg-indigo-500 p-3 rounded-xl text-white mr-4 shadow-md">
              <RiShieldUserLine size={24} />
            </div>
            <div>
              <p className="text-xs text-indigo-500 font-bold uppercase tracking-wider">Premium Status</p>
              <p className="font-black text-gray-800 tracking-tight">有料プラン会員認証済み</p>
            </div>
          </div>

          <section className="space-y-8">
            {/* 紹介リンク */}
            <div className="space-y-3">
              <label className="text-sm font-bold text-gray-500 ml-1 italic">Your Referral Link</label>
              <div className="flex flex-col space-y-2">
                <input 
                  type="text" 
                  value={referralLink} 
                  readOnly 
                  className="w-full p-4 border-2 border-gray-100 rounded-2xl bg-gray-50 text-sm font-mono text-gray-600 focus:outline-none"
                />
                <button 
                  onClick={copyToClipboard} 
                  className={`w-full flex items-center justify-center font-bold py-4 rounded-2xl transition shadow-lg ${
                    copied ? 'bg-green-500 text-white' : 'bg-gray-900 text-white hover:bg-black active:scale-95'
                  }`}
                >
                  <RiFileCopyLine className="mr-2" />
                  {copied ? 'コピーしました！' : 'リンクをコピーする'}
                </button>
              </div>
            </div>

            <hr className="border-gray-100" />

            {/* QRコード */}
            <div className="text-center space-y-4">
              <label className="text-sm font-bold text-gray-500 italic block text-left ml-1">Your Personal QR Code</label>
              <div className="bg-gray-50 p-8 rounded-3xl border-2 border-dashed border-gray-200 inline-block w-full">
                <div ref={qrCodeRef} className="bg-white p-4 rounded-2xl shadow-inner inline-block border border-gray-100">
                  {referralLink ? (
                    <QRCodeCanvas value={referralLink} size={200} level="H" />
                  ) : (
                    <div className="w-[200px] h-[200px] flex items-center justify-center text-gray-300 italic text-xs">生成中...</div>
                  )}
                </div>
                <p className="mt-4 text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                  対面で紹介する際はこちらをスキャン
                </p>
              </div>
              
              <button 
                onClick={downloadQRCode} 
                className="w-full flex items-center justify-center bg-white border-2 border-gray-900 text-gray-900 font-bold py-4 rounded-2xl hover:bg-gray-50 active:scale-95 transition shadow-sm"
              >
                <RiDownloadCloud2Line className="mr-2 text-xl" />
                QRコードを画像として保存
              </button>
            </div>
          </section>

          <section className="mt-10 p-6 bg-yellow-50 rounded-3xl border border-yellow-100">
            <h3 className="font-black text-gray-800 mb-2 italic">報酬発生の仕組み</h3>
            <p className="text-xs text-gray-600 leading-relaxed font-medium">
              あなたの紹介リンクから「みんなのNasu」に登録し、有料プランへ入会した方がいる場合、あなたに紹介報酬が発生します。
              報酬状況は「報酬管理ダッシュボード」から確認可能です。
            </p>
          </section>
        </main>
      </div>
    </div>
  );
};

// --- 【重要】サーバーサイド・ガードロジック ---
export const getServerSideProps: GetServerSideProps = async (context) => {
  try {
    const cookies = nookies.get(context);
    const sessionCookie = cookies.session || '';
    
    // 1. セッションがあるか確認
    if (!sessionCookie) {
      return { redirect: { destination: '/users/login', permanent: false } };
    }
    
    // 2. セッションの有効性を確認
    const token = await adminAuth.verifySessionCookie(sessionCookie, true);
    
    // 3. Firestoreからユーザー情報を取得
    const userDoc = await adminDb.collection('users').doc(token.uid).get();
    const userData = userDoc.data();

    // 4. 有料プラン(paid_480)の厳格なチェック
    // プランが存在しない、またはpaid_480ではない場合は無料版ホームへ飛ばす
    if (!userData || userData.plan !== 'paid_480') {
      console.log(`Access Denied for UID: ${token.uid}. Plan is ${userData?.plan}`);
      return {
        redirect: {
          destination: '/home', 
          permanent: false,
        },
      };
    }
    
    // 5. 条件をクリアした有料ユーザーのみデータを渡す
    return {
      props: {
        user: { 
          uid: token.uid, 
          email: token.email || '',
          plan: userData.plan
        },
      },
    };
  } catch (error) {
    console.error("Auth Error in ReferralInfoPage:", error);
    return { redirect: { destination: '/users/login', permanent: false } };
  }
};

export default ReferralInfoPage;