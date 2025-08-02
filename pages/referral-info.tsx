import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useAuth } from '../contexts/AuthContext';
import { signOut } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { QRCodeCanvas } from 'qrcode.react'; // QRコードライブラリをインポート

const ReferralInfoPage = () => {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [referralLink, setReferralLink] = useState('');
  const qrCodeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    } else if (user) {
      const origin = typeof window !== 'undefined' ? window.location.origin : '';
      // ▼▼▼ リンクの行き先をランディングページ('/')に変更 ▼▼▼
      setReferralLink(`${origin}/?ref=${user.uid}`);
    }
  }, [user, loading, router]);

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

  if (loading || !user) {
    return <p>読み込み中...</p>;
  }

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
            <QRCodeCanvas value={referralLink} size={160} />
          </div>
          <button onClick={downloadQRCode} className="mt-4 bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded">
            QRコードを保存
          </button>
        </div>
      </div>

      <div className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4 mt-8">
        <h2 className="text-xl font-bold mb-4 text-gray-800">紹介制度のルール</h2>
        <ul className="list-disc list-inside text-gray-700 space-y-2">
        <li>上記のURL,QRコードから紹介用ページの閲覧と登録をすることができます。</li>
          <li>あなたの紹介リンク経由でご友人が有料会員登録（月額980円）されると、紹介が成立します。</li>
          <li>紹介が成立すると、ご友人の月額利用料の一部があなたに報酬として継続的に還元されます。</li>
          <li>8月末までに紹介した方には → 紹介報酬【30%】ずっと継続!!</li>
          <li>9月から紹介を始めた方は→紹介報酬【20%】</li>
          <li>報酬は即時あなたのアカウントに反映されます。（管理画面で確認できます）</li>
          <li>月4人～紹介すれば、あなたの月額利用料（980円）は実質無料以上になります。</li>
          <li>100人紹介で月額約30,000円の紹介料を毎月継続でGET！</li>
          <li>紹介料は3,000円を超えると、月末締の翌月15日に口座に振り込まれます。</li>
        </ul>
        <p className="text-xs text-gray-500 mt-4">※紹介報酬は、紹介された方が980円で継続課金した場合の計算です。</p>
      </div>
    </div>
  );
};

export default ReferralInfoPage;

