import { NextPage } from 'next';

const PartnerTermsPage: NextPage = () => {
  return (
    <div className="bg-gray-50 text-gray-800 min-h-screen">
      {/* --- ヘッダー --- */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-800">
            <a href="/" className="hover:text-orange-500">みんなの那須アプリ</a>
          </h1>
          <a href="/partner/signup" className="bg-orange-500 text-white font-bold py-2 px-6 rounded-full hover:bg-orange-600 transition duration-300 shadow-lg">
            パートナー登録に戻る
          </a>
        </div>
      </header>

      {/* --- メインコンテンツ --- */}
      <main className="container mx-auto px-6 py-12 md:py-16">
        <div className="bg-white p-8 md:p-12 rounded-2xl shadow-lg w-full max-w-4xl mx-auto border border-gray-200">
          <h2 className="text-3xl font-extrabold text-center mb-10">パートナー利用規約</h2>
          
          <div className="prose prose-lg max-w-none text-gray-700">
            <p>
              この利用規約（以下、「本規約」といいます。）は、株式会社adtown（以下、「当社」といいます。）が提供する「みんなの那須アプリ」のパートナー向けサービス（以下、「本サービス」といいます。）の利用条件を定めるものです。本サービスの利用を申し込む事業者様（以下、「パートナー」といいます。）は、本規約の内容を十分に理解し、同意の上で本サービスを利用するものとします。
            </p>

            <h3 className="mt-8 font-bold">第1条（本規約の適用）</h3>
            <p>
              本規約は、当社とパートナーとの間の本サービスの利用に関わる一切の関係に適用されるものとします。当社が当社ウェブサイト上で掲載する本サービスの利用に関するルールは、本規約の一部を構成するものとします。
            </p>

            <h3 className="mt-8 font-bold">第2条（定義）</h3>
            <p>
              本規約において使用する以下の用語は、各々以下に定める意味を有するものとします。
            </p>
            <ol className="list-decimal pl-6 space-y-2">
              <li><strong>「本アプリ」</strong>とは、当社が運営するアプリケーション「みんなの那須アプリ」を指します。</li>
              <li><strong>「本サービス」</strong>とは、当社がパートナー向けに提供する、本アプリ上での広告掲載、クーポン配信、および紹介料プログラムを含む一切のサービスを指します。</li>
              <li><strong>「ユーザー」</strong>とは、本アプリを利用する一般の個人または法人を指します。</li>
              <li><strong>「紹介料」</strong>とは、パートナーの紹介によりユーザーが本アプリの有料プランに登録した場合に、当社がパートナーに対して支払う報酬を指します。</li>
            </ol>

            <h3 className="mt-8 font-bold">第3条（パートナー登録）</h3>
            <ol className="list-decimal pl-6 space-y-2">
              <li>登録希望者は、本規約に同意の上、当社の定める方法によって利用登録を申請し、当社がこれを承認することによって、パートナー登録が完了するものとします。</li>
              <li>当社は、登録申請者に以下の事由があると判断した場合、登録を承認しないことがあり、その理由については一切の開示義務を負わないものとします。
                <ul className="list-disc pl-6 mt-2">
                  <li>登録申請に際して虚偽の事項を届け出た場合</li>
                  <li>本規約に違反したことがある者からの申請である場合</li>
                  <li>その他、当社が利用登録を相当でないと判断した場合</li>
                </ul>
              </li>
            </ol>

            <h3 className="mt-8 font-bold">第4条（サービス内容）</h3>
            <p>
              パートナーは、月額利用料金を支払うことにより、以下のサービスを利用することができます。
            </p>
            <ol className="list-decimal pl-6 space-y-2">
              <li><strong>広告・クーポン掲載</strong>：本アプリ内において、パートナーの店舗情報、広告、クーポン等を掲載・配信することができます。掲載内容の詳細は、別途当社が定めるパートナー向け管理画面にて設定するものとします。</li>
              <li><strong>紹介料プログラム</strong>：当社が発行する専用のQRコードを介してユーザーが本アプリの有料プラン（月額480円）に登録し、当該ユーザーからの料金支払いが確認された場合、当社はパートナーに対し、紹介料として当該料金の30%を支払います。</li>
            </ol>
            
            <h3 className="mt-8 font-bold">第5条（利用料金及び支払方法）</h3>
            <ol className="list-decimal pl-6 space-y-2">
              <li>本サービスの利用料金プラン及び支払方法は以下の通りとします。
                <ul className="list-disc pl-6 mt-2">
                  <li><strong>月額プラン</strong>：月額3,300円（税込）。当社指定の決済代行サービス（Stripe）を通じたクレジットカードでの支払いとなります。</li>
                  <li><strong>年額プラン</strong>：年額39,600円（税込）。当社発行の請求書に基づく銀行振り込みによる一括前払いとなります。</li>
                </ul>
              </li>
              <li>月額プランの利用料金は、登録が承認された日を起算日として毎月請求されます。</li>
              <li>支払われた利用料金は、理由の如何を問わず返金しないものとします。</li>
            </ol>
            
            <h3 className="mt-8 font-bold">第6条（紹介料の支払い）</h3>
            <ol className="list-decimal pl-6 space-y-2">
              <li>紹介料は、紹介されたユーザーが有料プランの利用を継続し、当社がユーザーからの利用料金の支払いを確認できた月を対象として計算されます。</li>
              <li>当社は、毎月末日をもって当月分の紹介料を締め、翌月15日にパートナーが指定する登録口座にお振込みいたします。</li>
              <li>紹介料の支払いは、未払いの紹介料合計額が3,000円以上になった場合に限るものとします。合計額が3,000円に満たない場合、残高は翌月以降に繰り越されるものとします。</li>
            </ol>

            <h3 className="mt-8 font-bold">第7条（禁止事項）</h3>
            <p>
              パートナーは、本サービスの利用にあたり、以下の行為をしてはなりません。
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>法令または公序良俗に違反する行為</li>
              <li>犯罪行為に関連する行為</li>
              <li>当社のサーバーまたはネットワークの機能を破壊したり、妨害したりする行為</li>
              <li>当社のサービスの運営を妨害するおそれのある行為</li>
              <li>他のパートナーに関する個人情報等を収集または蓄積する行為</li>
              <li>不正な目的を持って本サービスを利用する行為</li>
              <li>当社、他のパートナーまたは第三者の知的財産権、肖像権、プライバシー、名誉その他の権利または利益を侵害する行為</li>
              <li>その他、当社が不適切と判断する行為</li>
            </ul>

            <h3 className="mt-8 font-bold">第8条（契約期間及び解約）</h3>
            <ol className="list-decimal pl-6 space-y-2">
              <li>本サービスの契約期間は、利用料金の初回支払日から1年間とします。</li>
              <li>契約期間満了の1か月前までに、パートナーまたは当社のいずれからも解約の申し出がない場合、契約は同一条件でさらに1年間自動的に更新されるものとし、以後も同様とします。</li>
              <li>パートナーが期間の途中で解約を希望する場合でも、契約期間満l了までの利用料金の支払い義務を負うものとし、既払いの料金は返金されません。</li>
            </ol>

            <h3 className="mt-8 font-bold">第9条（規約の変更）</h3>
            <p>
              当社は、必要と判断した場合には、パートナーに通知することなくいつでも本規約を変更することができるものとします。本規約の変更後、本サービスの利用を継続した場合には、当該パートナーは変更後の規約に同意したものとみなします。
            </p>
            
            <h3 className="mt-8 font-bold">第10条（準拠法・裁判管轄）</h3>
            <ol className="list-decimal pl-6 space-y-2">
                <li>本規約の解釈にあたっては、日本法を準拠法とします。</li>
                <li>本サービスに関して紛争が生じた場合には、当社の本店所在地を管轄する宇都宮地方裁判所を第一審の専属的合意管轄裁判所とします。</li>
            </ol>

            <div className="mt-12 text-right">
              <p>以上</p>
              <p>制定日：2025年9月25日</p>
            </div>
          </div>
        </div>
      </main>

      {/* --- フッター --- */}
      <footer className="bg-white mt-12">
        <div className="container mx-auto px-6 py-8 text-center text-gray-600">
          <p>&copy; {new Date().getFullYear()} 株式会社adtown. All Rights Reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default PartnerTermsPage;