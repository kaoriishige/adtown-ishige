import { GetServerSideProps, NextPage } from 'next';
import Link from 'next/link';
import { useEffect, useState, useRef } from 'react';
import nookies from 'nookies';
import { getAdminAuth } from '@/lib/firebase-admin';

// TypeScriptが'QRCode'を認識できるようにするための型定義
declare const QRCode: any;

// Propsの型定義
interface ReferralInfoProps {
  user: {
    uid: string;
  };
}

const QRCodeCanvas: React.FC<{ text: string }> = ({ text }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const scriptId = 'qrcode-script';
    let script = document.getElementById(scriptId) as HTMLScriptElement;

    const generateQrCode = () => {
      if (canvasRef.current && typeof QRCode !== 'undefined') {
        QRCode.toCanvas(canvasRef.current, text, { width: 256, margin: 2 }, (error: any) => {
          if (error) console.error('QRコードの生成に失敗しました:', error);
        });
      }
    };

    if (!script) {
      script = document.createElement('script');
      script.id = scriptId;
      script.src = "https://cdn.jsdelivr.net/npm/qrcode@1.5.1/build/qrcode.min.js";
      script.async = true;
      script.onload = generateQrCode;
      document.body.appendChild(script);
    } else if (typeof QRCode !== 'undefined') {
      generateQrCode();
    } else {
      script.addEventListener('load', generateQrCode);
    }

    return () => {
      if (script) {
        script.removeEventListener('load', generateQrCode);
      }
    };
  }, [text]);

  return <canvas ref={canvasRef} id="qrcode-canvas"></canvas>;
};


const ReferralInfoPage: NextPage<ReferralInfoProps> = ({ user }) => {
  const [copied, setCopied] = useState(false);
  // --- ★★★ ここを修正 ★★★ ---
  // 紹介用URLのリンク先を、新規登録ページ(/signup)からランディングページ(/)に修正しました
  const referralUrl = `https://minna-no-nasu-app.netlify.app/?ref=${user.uid}`;

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(referralUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleDownloadQr = () => {
    const canvas = document.getElementById('qrcode-canvas') as HTMLCanvasElement;
    if (canvas) {
      const link = document.createElement('a');
      link.download = 'referral-qrcode.png';
      link.href = canvas.toDataURL('image/png');
      link.click();
    }
  };

  return (
    <div className="p-5 max-w-2xl mx-auto font-sans">
      <Link href="/partner/dashboard" className="text-blue-500 hover:underline">
        ← マイページに戻る
      </Link>
      <h1 className="text-3xl font-bold my-6 text-center">紹介用URLとQRコード</h1>
      
      <div className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4 text-center">
        <p className="text-gray-600 mb-4">以下のURLまたはQRコードを使って、新しいユーザー様をご紹介ください。</p>
        
        {/* 紹介用URL */}
        <div className="mb-8">
          <label className="block text-gray-700 text-sm font-bold mb-2">あなたの紹介用URL</label>
          <div className="flex items-center justify-center">
            <input type="text" value={referralUrl} readOnly className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700"/>
            <button onClick={handleCopyUrl} className="ml-2 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
              {copied ? 'コピーしました！' : 'コピー'}
            </button>
          </div>
        </div>

        {/* QRコード */}
        <div className="mb-8">
          <label className="block text-gray-700 text-sm font-bold mb-2">紹介用QRコード</label>
          <div className="flex justify-center">
            <QRCodeCanvas text={referralUrl} />
          </div>
        </div>
        
        {/* ダウンロードボタン */}
        <button onClick={handleDownloadQr} className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded">
          QRコードをダウンロード
        </button>
      </div>
    </div>
  );
};

export const getServerSideProps: GetServerSideProps = async (context) => {
  try {
    const adminAuth = getAdminAuth();
    const cookies = nookies.get(context);
    const token = await adminAuth.verifySessionCookie(cookies.token, true);
    const { uid } = token;

    return {
      props: {
        user: { uid },
      },
    };
  } catch (err) {
    return {
      redirect: {
        destination: '/partner/login',
        permanent: false,
      },
    };
  }
};

export default ReferralInfoPage;