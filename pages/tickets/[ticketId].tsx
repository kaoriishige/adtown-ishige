import { NextPage, GetServerSideProps } from 'next';
import Head from 'next/head';
import { getAdminAuth, getAdminDb } from '../../lib/firebase-admin';
import nookies from 'nookies';
import { QRCodeCanvas } from 'qrcode.react';
import { useRouter } from 'next/router';

// 型定義
interface PurchasedDeal {
  id: string;
  title: string;
  description: string;
  storeName: string;
  price: number;
  // QRコードに含めるためのユーザーID
  userId: string;
}

interface TicketDetailPageProps {
  deal: PurchasedDeal | null;
}

const TicketDetailPage: NextPage<TicketDetailPageProps> = ({ deal }) => {
    const router = useRouter();

    if (!deal) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <p>このチケットは存在しないか、すでに使用済みです。</p>
            </div>
        );
    }

    // QRコードに埋め込むデータ
    const qrCodeValue = JSON.stringify({
        userId: deal.userId,
        purchasedDealId: deal.id,
    });

    return (
        <div className="min-h-screen bg-gray-50">
            <Head>
                <title>チケット詳細: {deal.title}</title>
            </Head>
            <div className="max-w-md mx-auto p-4 pt-10">
                <button onClick={() => router.back()} className="mb-4 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded-lg text-sm">
                    ← マイページに戻る
                </button>

                <div className="bg-white p-8 rounded-2xl shadow-2xl text-center">
                    <p className="text-gray-500 text-sm">お店の方にこの画面をお見せください</p>
                    <h1 className="text-3xl font-bold my-4">{deal.title}</h1>
                    <p className="text-lg text-gray-700 font-semibold mb-6">{deal.storeName}</p>

                    <div className="flex justify-center my-8">
                        <QRCodeCanvas value={qrCodeValue} size={256} />
                    </div>

                    <div className="bg-gray-100 p-4 rounded-lg">
                        <p className="text-sm font-bold text-gray-800">お店の方へ</p>
                        <p className="text-xs text-gray-600 mt-1">
                            パートナー管理画面からこのQRコードをスキャンして、「使用済み」にしてください。
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export const getServerSideProps: GetServerSideProps = async (context) => {
    try {
        const cookies = nookies.get(context);
        const token = await getAdminAuth().verifySessionCookie(cookies.token, true);
        const { uid } = token;
        const { ticketId } = context.params as { ticketId: string };

        const dealDoc = await getAdminDb()
            .collection('users')
            .doc(uid)
            .collection('purchasedDeals')
            .doc(ticketId)
            .get();

        if (!dealDoc.exists || dealDoc.data()?.used) {
            return { props: { deal: null } };
        }

        const data = dealDoc.data();
        const deal = {
            id: dealDoc.id,
            userId: uid, // QRコード生成のためにユーザーIDを追加
            title: data?.title || '',
            description: data?.description || '',
            storeName: data?.storeName || '',
            price: data?.price || 0,
        };

        return {
            props: {
                deal: JSON.parse(JSON.stringify(deal)),
            },
        };

    } catch (error) {
        // ログインしていない場合はログインページにリダイレクト
        return {
            redirect: {
                destination: '/login',
                permanent: false,
            },
        };
    }
};

export default TicketDetailPage;