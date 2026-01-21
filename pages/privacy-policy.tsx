import { NextPage } from 'next';
import Head from 'next/head';
import Link from 'next/link';

const PrivacyPolicy: NextPage = () => {
    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 font-sans antialiased text-slate-900">
            <Head>
                <title>プライバシーポリシー | adtown</title>
            </Head>
            <div className="max-w-4xl mx-auto bg-white p-8 md:p-12 shadow-sm rounded-[2rem] border border-slate-100">
                <h1 className="text-3xl font-black mb-8 border-b border-slate-100 pb-6 text-slate-800">
                    プライバシーポリシー
                </h1>

                <div className="space-y-8 leading-relaxed">
                    <section>
                        <p className="mb-4">
                            株式会社adtown（以下、「当社」といいます。）は、本ウェブサイト上で提供するサービス（以下、「本サービス」といいます。）における、ユーザーの個人情報の取扱いについて、以下のとおりプライバシーポリシー（以下、「本ポリシー」といいます。）を定めます。
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold mb-4 text-slate-800">第1条（個人情報）</h2>
                        <p>
                            「個人情報」とは、個人情報保護法にいう「個人情報」を指すものとし、生存する個人に関する情報であって、当該情報に含まれる氏名、生年月日、住所、電話番号、連絡先その他の記述等により特定の個人を識別できる情報及び容貌、指紋、声紋にかかるデータ、及び健康保険証の保険者番号などの当該情報単体から特定の個人を識別できる情報（個人識別符号）を指します。
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold mb-4 text-slate-800">第2条（個人情報の収集方法）</h2>
                        <p>
                            当社は、ユーザーが利用登録をする際に氏名、生年月日、住所、電話番号、メールアドレス、銀行口座番号、クレジットカード番号、運転免許証番号などの個人情報をお尋ねすることがあります。また、ユーザーと提携先などとの間でなされたユーザーの個人情報を含む取引記録や決済に関する情報を,当社の提携先（情報提供元、広告主、広告配信先などを含みます。以下、｢提携先｣といいます。）などから収集することがあります。
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold mb-4 text-slate-800">第3条（個人情報を収集・利用する目的）</h2>
                        <p>当社が個人情報を収集・利用する目的は、以下のとおりです。</p>
                        <ul className="list-disc ml-6 mt-2 space-y-1">
                            <li>当社サービスの提供・運営のため</li>
                            <li>ユーザーからのお問い合わせに回答するため（本人確認を行うことを含む）</li>
                            <li>ユーザーが利用中のサービスの新機能、更新情報、キャンペーン等及び当社が提供する他のサービスの案内のメールを送付するため</li>
                            <li>メンテナンス、重要なお知らせなど必要に応じたご連絡のため</li>
                            <li>利用規約に違反したユーザーや、不正・不当な目的でサービスを利用しようとするユーザーの特定をお断りするため</li>
                            <li>ユーザーにご自身の登録情報の閲覧や変更、削除、ご利用状況の閲覧を行っていただくため</li>
                            <li>有料サービスにおいて、ユーザーに利用料金を請求するため</li>
                            <li>上記の利用目的に付随する目的</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold mb-4 text-slate-800">第4条（利用目的の変更）</h2>
                        <p>
                            1. 当社は、利用目的が変更前と関連性を有すると合理的に認められる場合に限り、個人情報の利用目的を変更するものとします。<br />
                            2. 利用目的の変更を行った場合には、変更後の目的について、当社所定の方法により、ユーザーに通知し、または本ウェブサイト上に公表するものとします。
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold mb-4 text-slate-800">第5条（個人情報の第三者提供）</h2>
                        <p>
                            当社は、個人情報保護法その他の法令で認められる場合を除き、あらかじめユーザーの同意を得ることなく、第三者に個人情報を提供することはありません。
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold mb-4 text-slate-800">第6条（お問い合わせ窓口）</h2>
                        <p>本ポリシーに関するお問い合わせは、下記の窓口までお願いいたします。</p>
                        <div className="mt-4 bg-slate-50 p-6 rounded-xl border border-slate-100">
                            <p>住所：栃木県那須塩原市石林698-35</p>
                            <p>社名：株式会社adtown</p>
                            <p>代表取締役：石下 かをり</p>
                            <p>Eメールアドレス：info@adtown.co.jp</p>
                        </div>
                    </section>
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

export default PrivacyPolicy;
