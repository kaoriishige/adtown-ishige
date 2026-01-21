import { NextPage } from 'next';
import Head from 'next/head';
import Link from 'next/link';

const Tokushoho: NextPage = () => {
    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 font-sans antialiased text-slate-900">
            <Head>
                <title>特定商取引法に基づく表記 | adtown</title>
            </Head>
            <div className="max-w-4xl mx-auto bg-white p-8 md:p-12 shadow-sm rounded-[2rem] border border-slate-100">
                <h1 className="text-3xl font-black mb-8 border-b border-slate-100 pb-6 text-slate-800">
                    特定商取引法に基づく表記
                </h1>

                <div className="space-y-6 text-slate-700">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2 pb-4 border-b border-slate-50">
                        <dt className="font-bold text-slate-800">販売事業者名</dt>
                        <dd className="md:col-span-2">株式会社adtown</dd>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2 pb-4 border-b border-slate-50">
                        <dt className="font-bold text-slate-800">運営統括責任者名</dt>
                        <dd className="md:col-span-2">石下 かをり</dd>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2 pb-4 border-b border-slate-50">
                        <dt className="font-bold text-slate-800">所在地</dt>
                        <dd className="md:col-span-2">〒329-2711 栃木県那須塩原市石林698-35</dd>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2 pb-4 border-b border-slate-50">
                        <dt className="font-bold text-slate-800">電話番号</dt>
                        <dd className="md:col-span-2">0287-39-7577</dd>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2 pb-4 border-b border-slate-50">
                        <dt className="font-bold text-slate-800">メールアドレス</dt>
                        <dd className="md:col-span-2">info@adtown.co.jp</dd>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2 pb-4 border-b border-slate-50">
                        <dt className="font-bold text-slate-800">販売価格</dt>
                        <dd className="md:col-span-2">
                            各商品（プラン）の購入ページに表示される金額に基づきます。
                            <br />
                            （AI Active Matchingプラン：月額8,800円、キャンペーン価格6,600円等）
                        </dd>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2 pb-4 border-b border-slate-50">
                        <dt className="font-bold text-slate-800">商品代金以外の必要料金</dt>
                        <dd className="md:col-span-2">インターネットの通信料、消費税（表示価格に含まれる場合はその旨記載）が発生します。</dd>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2 pb-4 border-b border-slate-50">
                        <dt className="font-bold text-slate-800">支払方法</dt>
                        <dd className="md:col-span-2">クレジットカード決済、その他当サイトが認める決済方法</dd>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2 pb-4 border-b border-slate-50">
                        <dt className="font-bold text-slate-800">商品の引渡し時期</dt>
                        <dd className="md:col-span-2">決済手続き完了後、直ちにご利用いただけます。</dd>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2 pb-4 border-b border-slate-50">
                        <dt className="font-bold text-slate-800">返品・交換・キャンセル等</dt>
                        <dd className="md:col-span-2 leading-relaxed">
                            サービスの性質上、返品・返金は承っておりません。
                            <br />
                            定期課金の解約はいつでもマイページより可能です。次回更新日までに解約のお手続きを完了してください。解約後は次回の課金は発生いたしません。
                        </dd>
                    </div>
                </div>

                <div className="text-center mt-12 border-t border-slate-100 pt-8">
                    <Link href="/" className="text-blue-600 font-bold hover:underline inline-flex items-center gap-2">
                        <span>←</span> トップページに戻る
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default Tokushoho;
