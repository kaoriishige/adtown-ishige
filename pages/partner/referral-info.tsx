import type { GetServerSideProps, NextPage } from 'next';
import Link from 'next/link';
import { useState } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import nookies from 'nookies';
import { getAdminAuth } from '@/lib/firebase-admin';

// Propsの型定義
interface ReferralInfoProps {
  user: {
    uid: string;
  };
}

const ReferralInfoPage: NextPage<ReferralInfoProps> = ({ user }) => {
    // サーバーから渡されたユニークIDを元に、正しいランディングページへの紹介URLを生成
    const referralUrl = `https://minna-no-nasu-app.com/?ref=${user.uid}`;

    const [copied, setCopied] = useState(false);

    // URLをクリップボードにコピーする関数
    const handleCopy = () => {
        navigator.clipboard.writeText(referralUrl).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };

    // QRコードをダウンロードする関数
    const handleDownload = () => {
        const canvas = document.getElementById('qrcode-canvas') as HTMLCanvasElement;
        if (canvas) {
            const pngUrl = canvas.toDataURL("image/png").replace("image/png", "image/octet-stream");
            const downloadLink = document.createElement("a");
            downloadLink.href = pngUrl;
            downloadLink.download = "referral-qrcode.png";
            document.body.appendChild(downloadLink);
            downloadLink.click();
            document.body.removeChild(downloadLink);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <header className="bg-white shadow-sm">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <h1 className="text-2xl font-bold text-gray-900">紹介用URLとQRコード</h1>
                </div>
            </header>
             <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="bg-white p-8 rounded-lg shadow-sm text-center">
                    <h2 className="text-xl font-bold text-gray-800">お客様にアプリを紹介しましょう！</h2>
                    <p className="mt-2 text-gray-600">
                        以下のURLまたはQRコードからお客様がアプリに登録すると、あなたに紹介報酬が支払われます。
                    </p>
                    <div className="mt-8">
                        <label className="block text-sm font-medium text-gray-700 text-left">紹介用URL</label>
                        <div className="mt-1 flex rounded-md shadow-sm">
                            <input type="text" readOnly value={referralUrl} className="focus:ring-indigo-500 focus:border-indigo-500 flex-1 block w-full rounded-none rounded-l-md sm:text-sm border-gray-300 bg-gray-100" />
                            <button onClick={handleCopy} type="button" className="w-28 -ml-px relative inline-flex items-center justify-center space-x-2 px-4 py-2 border border-gray-300 text-sm font-medium rounded-r-md text-gray-700 bg-gray-50 hover:bg-gray-100">
                                <span>{copied ? 'コピーしました！' : 'コピー'}</span>
                            </button>
                        </div>
                    </div>
                    <div className="mt-8">
                         <label className="block text-sm font-medium text-gray-700 text-left mb-2">紹介用QRコード</label>
                         <div className="flex justify-center p-4 border rounded-lg bg-white">
                             <QRCodeCanvas
                                id="qrcode-canvas"
                                value={referralUrl}
                                size={192}
                                bgColor={"#ffffff"}
                                fgColor={"#000000"}
                                level={"L"}
                                includeMargin={true}
                             />
                         </div>
                         <p className="text-xs text-gray-500 mt-2">お客様のスマートフォンで読み取ってもらってください。</p>
                    </div>
                    <div className="mt-8">
                        <button onClick={handleDownload} className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded-lg transition-colors">
                            QRコードをダウンロード
                        </button>
                    </div>
                </div>
                 <div className="mt-8">
                   <Link href="/partner/dashboard" className="text-sm font-medium text-gray-600 hover:text-gray-900">
                        ← ダッシュボードに戻る
                    </Link>
                </div>
            </main>
        </div>
    );
}

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