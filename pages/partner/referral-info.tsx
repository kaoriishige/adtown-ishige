import type { GetServerSideProps, NextPage } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import { useState } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import nookies from 'nookies';
import { adminAuth } from '@/lib/firebase-admin'; // adminAuthを使用
import { auth } from '@/lib/firebase'; // クライアントauthを使用

// Propsの型定義
interface ReferralInfoProps {
    user: {
        uid: string;
    };
}

const ReferralInfoPage: NextPage<ReferralInfoProps> = ({ user }) => {
    // 正しいランディングページのURLを生成
    // 💡 注意: 実際にはアプリのURLに置き換えてください
    const referralUrl = `https://minna-no-nasu-app.netlify.app/?ref=${user.uid}`;

    const [copied, setCopied] = useState(false);

    // URLをクリップボードにコピーする関数
    const handleCopy = () => {
        // navigator.clipboard.writeTextはCanvas外で実行する必要があります
        if (typeof navigator.clipboard !== 'undefined') {
            navigator.clipboard.writeText(referralUrl).then(() => {
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
            });
        } else {
            // fallback (iframe内では動作しない可能性がある)
            const tempInput = document.createElement('textarea');
            tempInput.value = referralUrl;
            document.body.appendChild(tempInput);
            tempInput.select();
            document.execCommand('copy');
            document.body.removeChild(tempInput);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
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
            <Head>
                <title>紹介用URLとQRコード</title>
            </Head>
            <header className="bg-white shadow-sm">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <h1 className="text-2xl font-bold text-gray-900">紹介用URLとQRコード</h1>
                </div>
            </header>
            <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="bg-white p-8 rounded-lg shadow-xl text-center">
                    <h2 className="text-xl font-bold text-gray-800">お客様にアプリを紹介しましょう！</h2>
                    <p className="mt-2 text-gray-600">
                        以下のURLまたはQRコードからお客様がアプリに登録すると、あなたに紹介報酬が支払われます。
                    </p>
                    <div className="mt-8">
                        <label className="block text-sm font-medium text-gray-700 text-left">紹介用URL</label>
                        <div className="mt-1 flex rounded-md shadow-sm">
                            <input type="text" readOnly value={referralUrl} className="focus:ring-indigo-500 focus:border-indigo-500 flex-1 block w-full rounded-none rounded-l-md sm:text-sm border-gray-300 bg-gray-100 p-2" />
                            <button onClick={handleCopy} type="button" className="w-28 -ml-px relative inline-flex items-center justify-center space-x-2 px-4 py-2 border border-gray-300 text-sm font-medium rounded-r-md text-gray-700 bg-gray-50 hover:bg-gray-100">
                                <span>{copied ? 'コピーしました！' : 'コピー'}</span>
                            </button>
                        </div>
                    </div>
                    <div className="mt-8">
                        <label className="block text-sm font-medium text-gray-700 text-left mb-2">紹介用QRコード</label>
                        <div className="flex justify-center p-4 border rounded-lg bg-white">
                             {/* 💡 QRコード生成のコンポーネント（クライアント側で生成） */}
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

// サーバーサイドでログイン状態をチェックし、ユーザーIDを取得する
export const getServerSideProps: GetServerSideProps = async (context) => {
    try {
        const cookies = nookies.get(context);
        // 'session' クッキーではなく、クライアント側で保存されるIDトークン（cookies.token）を使用する
        // NOTE: dashboard.tsxではcookies.sessionを使っているため、ここではcookies.sessionに合わせる
        const token = await adminAuth.verifySessionCookie(cookies.session || '', true);
        const { uid } = token;

        if (!uid) {
            return {
                redirect: {
                    destination: '/partner/login',
                    permanent: false,
                },
            };
        }

        return {
            props: {
                user: { uid },
            },
        };
    } catch (err) {
        // 認証失敗時はログインページへリダイレクト
        return {
            redirect: {
                destination: '/partner/login?error=session_expired',
                permanent: false,
            },
        };
    }
};

export default ReferralInfoPage;