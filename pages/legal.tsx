// pages/legal.tsx

import { NextPage } from 'next';
import Link from 'next/link';

const LegalPage: NextPage = () => {
  return (
    <div className="bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-white p-8 shadow-md rounded-lg">
        <h1 className="text-3xl font-bold text-gray-800 mb-6 border-b pb-4">
          特定商取引法に基づく表記
        </h1>

        <div className="space-y-6 text-gray-700">
          <div>
            <h2 className="text-lg font-semibold">販売事業者名</h2>
            <p>株式会社adtown</p>
          </div>
          <div>
            <h2 className="text-lg font-semibold">運営統括責任者名</h2>
            <p>石下 香織</p>
          </div>
          <div>
            <h2 className="text-lg font-semibold">所在地</h2>
            <p>〒329-2711 栃木県那須塩原市石林698-35</p>
          </div>
          <div>
            <h2 className="text-lg font-semibold">電話番号</h2>
            <p>0287-39-7577</p>
          </div>
          <div>
            <h2 className="text-lg font-semibold">メールアドレス</h2>
            <p>adtown@able.ocn.ne.jp </p>
          </div>
          <div>
            <h2 className="text-lg font-semibold">販売価格</h2>
            <p>月額980円（税込）</p>
          </div>
          <div>
            <h2 className="text-lg font-semibold">商品代金以外の必要料金</h2>
            <p>当サイトの閲覧、コンテンツのダウンロード、お問い合わせ等の際の電子メールの送受信時などに、所定の通信料が発生いたします。</p>
          </div>
          <div>
            <h2 className="text-lg font-semibold">支払方法</h2>
            <p>クレジットカード決済（Stripe経由）</p>
          </div>
          <div>
            <h2 className="text-lg font-semibold">商品の引渡し時期</h2>
            <p>決済手続き完了後、直ちにサービスをご利用いただけます。</p>
          </div>
          <div>
            <h2 className="text-lg font-semibold">返品・交換・キャンセル等</h2>
            <p>
              商品の性質上、デジタルコンテンツの返品・返金は受け付けておりません。
              <br />
              月額課金の解約は、マイページよりいつでもお手続きいただけます。解約手続きをされた場合、次回の請求は発生いたしません。日割り返金は行っておりませんので、ご了承ください。
            </p>
          </div>
        </div>

        <div className="text-center mt-10 border-t pt-6">
          <Link href="/" className="text-blue-600 hover:underline">
            トップページに戻る
          </Link>
        </div>
      </div>
    </div>
  );
};

export default LegalPage;