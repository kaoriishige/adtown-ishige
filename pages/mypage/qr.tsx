'use client';

import { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../../lib/firebase';
import dynamic from 'next/dynamic';

// ✅ React QR Code（動的importで赤波線とSSRエラー回避）
const QRCode = dynamic(() => import('react-qr-code'), { ssr: false });

export default function QRPage() {
  const [referralUrl, setReferralUrl] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user && user.email) {
        const userDoc = await getDoc(doc(db, 'users', user.email));
        const refId = userDoc.exists() ? userDoc.data().referrerId || user.email : user.email;
        const url = `https://nasu-app.com/register?ref=${encodeURIComponent(refId)}`;
        setReferralUrl(url);
      }
    });
    return () => unsubscribe();
  }, []);

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(referralUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadQR = () => {
    const svg = document.querySelector('svg');
    if (!svg) return;
    const serializer = new XMLSerializer();
    const svgBlob = new Blob([serializer.serializeToString(svg)], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(svgBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'referral-qr.svg';
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-xl mx-auto p-6 text-center">
      <h1 className="text-2xl font-bold mb-4">あなた専用の紹介リンクとQRコード</h1>

      {referralUrl ? (
        <>
          <div className="mb-4 text-sm break-words">{referralUrl}</div>
          <button
            onClick={copyToClipboard}
            className="mb-2 bg-blue-600 text-white px-4 py-2 rounded"
          >
            コピー
          </button>
          {copied && <p className="text-green-500 mt-2">✅ コピーしました！</p>}
          <div className="my-6 flex justify-center">
            <QRCode value={referralUrl} size={180} />
          </div>
          <button
            onClick={downloadQR}
            className="bg-gray-600 text-white px-4 py-2 rounded"
          >
            QRを画像保存
          </button>
        </>
      ) : (
        <p className="text-gray-500">ログイン中の紹介者情報を読み込み中です...</p>
      )}
    </div>
  );
}
