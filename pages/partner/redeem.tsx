import { NextPage } from 'next';
import Head from 'next/head';
import { useEffect, useState, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { RiArrowLeftLine, RiCheckboxCircleFill, RiCloseCircleFill, RiLoader4Line } from 'react-icons/ri';
import Link from 'next/link';
import nookies from 'nookies';
import { GetServerSideProps } from 'next';
import { adminAuth } from '../../lib/firebase-admin';

const RedeemPage: NextPage = () => {
    const [scanResult, setScanResult] = useState<{ message: string; dealTitle: string; storeName: string; } | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const scannerRef = useRef<Html5Qrcode | null>(null);
    const readerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!readerRef.current) return;

        const config = {
            fps: 10,
            qrbox: { width: 250, height: 250 },
            rememberLastUsedCamera: true,
        };
        
        const html5QrCode = new Html5Qrcode(readerRef.current.id);
        scannerRef.current = html5QrCode;

        const startScanner = async () => {
            try {
                await html5QrCode.start(
                    { facingMode: "environment" },
                    config,
                    onScanSuccess,
                    onScanError
                );
            } catch (err) {
                console.error("Failed to start scanner", err);
                setError("カメラの起動に失敗しました。カメラのアクセス許可を確認してください。");
            }
        };

        startScanner();

        return () => {
            if (scannerRef.current && scannerRef.current.isScanning) {
                scannerRef.current.stop().catch(err => console.error("Failed to stop scanner", err));
            }
        };
    }, []);

    const onScanSuccess = async (decodedText: string) => {
        if (isLoading) return;

        setIsLoading(true);
        setError(null);
        setScanResult(null);

        try {
            if (scannerRef.current && scannerRef.current.isScanning) {
                await scannerRef.current.stop();
            }

            const ticketData = JSON.parse(decodedText);
            if (!ticketData.uid || !ticketData.ticketId) {
                throw new Error("無効なQRコード形式です。");
            }

            const response = await fetch('/api/partner/redeem-ticket', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(ticketData)
            });

            const data = await response.json();

            if (response.ok) {
                setScanResult({
                    message: data.message,
                    dealTitle: data.dealTitle,
                    storeName: data.storeName
                });
            } else {
                throw new Error(data.error || 'エラーが発生しました。');
            }
        } catch (err: any) {
            setError(err.message || '無効なQRコード、または通信エラーが発生しました。');
            if (scannerRef.current && !scannerRef.current.isScanning) {
                scannerRef.current.start({ facingMode: "environment" }, { fps: 10, qrbox: { width: 250, height: 250 } }, onScanSuccess, onScanError)
                    .catch(e => console.error("Failed to restart scanner", e));
            }
        } finally {
            setIsLoading(false);
        }
    };

    const onScanError = (errorMessage: string) => {
        // スキャンエラーは通常無視します
    };
    
    return (
        <div className="min-h-screen bg-gray-900 text-white">
            <Head>
                <title>QRコード読み取り - パートナー</title>
            </Head>

            <header className="bg-gray-800 shadow-md">
                <div className="max-w-xl mx-auto p-4 flex items-center">
                    <Link href="/partner/dashboard" className="mr-4">
                        <RiArrowLeftLine size={24} />
                    </Link>
                    <h1 className="text-xl font-bold">チケットを認証</h1>
                </div>
            </header>

            <main className="max-w-xl mx-auto p-4 sm:p-6 text-center">
                <div id="qr-reader-container" className="relative w-full max-w-sm mx-auto aspect-square rounded-lg overflow-hidden border-4 border-gray-700">
                    <div id="qr-reader" ref={readerRef} className="w-full h-full"></div>
                </div>

                <div className="mt-6 min-h-[100px]">
                    {isLoading && (
                        <div className="flex flex-col items-center justify-center text-lg">
                            <RiLoader4Line className="animate-spin text-4xl mb-2" />
                            <p>認証中...</p>
                        </div>
                    )}
                    {error && (
                        <div className="bg-red-500/20 border border-red-500 text-red-300 p-4 rounded-lg flex flex-col items-center">
                            <RiCloseCircleFill className="text-4xl mb-2" />
                            <p className="font-bold">認証エラー</p>
                            <p className="text-sm mt-1">{error}</p>
                        </div>
                    )}
                    {scanResult && (
                         <div className="bg-green-500/20 border border-green-500 text-green-300 p-4 rounded-lg flex flex-col items-center">
                            <RiCheckboxCircleFill className="text-4xl mb-2" />
                            <p className="font-bold">{scanResult.message}</p>
                            <div className="mt-2 text-sm text-left w-full bg-gray-800 p-3 rounded-md">
                                <p><span className="font-semibold">店舗:</span> {scanResult.storeName}</p>
                                <p><span className="font-semibold">内容:</span> {scanResult.dealTitle}</p>
                            </div>
                        </div>
                    )}
                     {!isLoading && !error && !scanResult && (
                        <p className="text-gray-400">枠内にQRコードをかざしてください</p>
                    )}
                </div>
            </main>
        </div>
    );
};

export const getServerSideProps: GetServerSideProps = async (ctx) => {
    try {
        const cookies = nookies.get(ctx);
        if (!cookies.token) {
            return { redirect: { destination: '/partner/login', permanent: false } };
        }
        const token = await adminAuth().verifySessionCookie(cookies.token, true);
        const userDoc = await adminAuth().getUser(token.uid);
        if (userDoc.customClaims?.role !== 'partner') {
             return { redirect: { destination: '/partner/login', permanent: false } };
        }
        return { props: {} };
    } catch (error) {
        return { redirect: { destination: '/partner/login', permanent: false } };
    }
};

export default RedeemPage;