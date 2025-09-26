import { NextPage } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import React from 'react';

const PartnerInvoiceRequestPage: NextPage = () => {
    const mailTo = "mailto:adtown@able.ocn.ne.jp?subject=【みんなの那須アプリ】請求書払い（年額プラン）希望&body=以下の情報を記載の上、ご送信ください。担当者より折り返しご連絡いたします。%0D%0A%0D%0A・店舗名／企業名：%0D%0A・ご担当者名：%0D%0A・お電話番号：%0D%0A";

    return (
        <div className="bg-gray-50 text-gray-800 font-sans min-h-screen flex flex-col">
            <header className="bg-white shadow-md sticky top-0 z-50">
                <div className="container mx-auto px-6 py-4 flex justify-between items-center">
                    <h1 className="text-2xl font-bold text-gray-800">みんなの那須アプリ</h1>
                    <Link href="/partner/signup" className="text-orange-600 hover:underline font-medium">
                        登録ページへ戻る
                    </Link>
                </div>
            </header>

            <main className="flex-grow container mx-auto px-6 py-16 flex items-center justify-center">
                <div className="w-full max-w-2xl bg-white p-8 md:p-12 rounded-2xl shadow-2xl border border-gray-200 text-center">
                    <h2 className="text-3xl font-bold mb-4">請求書でのお支払い（年額プラン）</h2>
                    <p className="text-gray-600 mb-8">
                        年額プラン（年間39,600円 前払い）をご希望の方は、以下のボタンよりお問い合わせください。
                        メールソフトが起動しますので、必要事項をご記入の上、メールを送信してください。
                    </p>
                    <a
                        href={mailTo}
                        className="inline-block w-full max-w-md py-4 text-white text-lg font-bold bg-gradient-to-r from-orange-500 to-red-500 rounded-lg hover:shadow-lg transition-all duration-300"
                    >
                        メールでお問い合わせ
                    </a>
                    <p className="text-sm text-gray-500 mt-4">
                        担当者より、折り返しご請求とお手続きのご案内をいたします。
                    </p>
                </div>
            </main>

            <footer className="bg-white border-t">
                <div className="container mx-auto px-6 py-8 text-center text-gray-600">
                    <p>&copy; {new Date().getFullYear()} 株式会社adtown. All Rights Reserved.</p>
                </div>
            </footer>
        </div>
    );
};

export default PartnerInvoiceRequestPage;