import { useState, useEffect, useRef } from 'react';
import { GetServerSideProps, NextPage } from 'next';
import Link from 'next/link';
import nookies from 'nookies';
import { QRCodeCanvas } from 'qrcode.react';
import { adminAuth } from '../lib/firebase-admin';

// --- 型定義 ---
interface User {
  uid: string;
  email: string;
}

interface ReferralInfoPageProps {
  user: User;
}

// --- ページコンポーネント ---
const ReferralInfoPage: NextPage<ReferralInfoPageProps> = ({ user }) => {
  const [referralLink, setReferralLink] = useState('');
  const qrCodeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // サーバーから渡されたuser情報を使って紹介リンクを生成
    if (user) {
      const origin = window.location.origin;
      setReferralLink(`${origin}/?ref=${user.uid}`);
    }
  }, [user]);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(referralLink);
    alert('紹介リンクをコピーしました！');
  };

  const downloadQRCode = () => {
    const canvas = qrCodeRef.current?.querySelector('canvas');
    if (canvas) {
      const url = canvas.toDataURL("image/png");
      const a = document.createElement("a");
      a.href = url;
      a.download = "referral-qr-code.png";
      a.click();
    }
  };

  return (
    <div className="p-5 max-w-3xl mx-auto my-10">
      <Link href="/mypage" className="text-blue-500 hover:underline">
        ← マイページに戻る
      </Link>
      <h1 className="text-3xl font-bold my-6 text-center">紹介制度のご案内</h1>
      
      <div className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4">
        <h2 className="text-xl font-bold mb-4 text-gray-800">あなたの専用紹介リンク</h2>
        <div className="flex items-center space-x-2 mb-6">
          <input 
            type="text" 
            value={referralLink} 
            readOnly 
            className="w-full p-2 border rounded bg-gray-100"
          />
          <button onClick={copyToClipboard} className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded whitespace-nowrap">
            コピー
          </button>
        </div>
        
        <h2 className="text-xl font-bold mb-4 text-gray-800">専用QRコード</h2>
        <div className="text-center p-4 bg-gray-50 rounded">
          <div ref={qrCodeRef} className="inline-block p-4 bg-white border">
            {referralLink && <QRCodeCanvas value={referralLink} size={160} />}
          </div>
          <button onClick={downloadQRCode} className="mt-4 bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded">
            QRコードを保存
          </button>
        </div>
      </div>
    </div>
  );
};

// --- サーバーサイドでの認証チェック ---
export const getServerSideProps: GetServerSideProps = async (context) => {
  try {
    const cookies = nookies.get(context);
    const token = await adminAuth.verifySessionCookie(cookies.token, true);
    
    return {
      props: {
        user: { 
          uid: token.uid, 
          email: token.email || '' 
        },
      },
    };
  } catch (error) {
    return {
      redirect: {
        destination: '/login',
        permanent: false,
      },
    };
  }
};

export default ReferralInfoPage;