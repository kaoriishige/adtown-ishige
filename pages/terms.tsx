import { NextPage } from 'next';
import Head from 'next/head';
import Link from 'next/link';

const TermsOfUse: NextPage = () => {
    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 font-sans antialiased text-slate-900">
            <Head>
                <title>利用規約 | adtown</title>
            </Head>
            <div className="max-w-4xl mx-auto bg-white p-8 md:p-12 shadow-sm rounded-[2rem] border border-slate-100">
                <h1 className="text-3xl font-black mb-8 border-b border-slate-100 pb-6 text-slate-800">
                    利用規約
                </h1>

                <div className="space-y-8 leading-relaxed">
                    <section>
                        <p>
                            この利用規約（以下、「本規約」といいます。）は、株式会社adtown（以下、「当社」といいます。）がこのウェブサイト上で提供するサービス（以下、「本サービス」といいます。）の利用条件を定めるものです。登録ユーザーの皆さま（以下、「ユーザー」といいます。）には、本規約に従って本サービスをご利用いただきます。
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold mb-4 text-slate-800">第1条（適用）</h2>
                        <p>
                            本規約は、ユーザーと当社との間の本サービスの利用に関わる一切の関係に適用されるものとします。
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold mb-4 text-slate-800">第2条（利用登録）</h2>
                        <p>
                            1. 本サービスにおいては、登録希望者が本規約に同意の上、当社の定める方法によって利用登録を申請し、当社がこれを承認することによって、利用登録が完了するものとします。<br />
                            2. 当社は、利用登録の申請者に以下の事由があると判断した場合、利用登録の申請を承認しないことがあり、その理由については一切の開示義務を負わないものとします。
                        </p>
                        <ul className="list-disc ml-6 mt-2 space-y-1">
                            <li>利用登録の申請に際して虚偽の事項を届け出た場合</li>
                            <li>本規約に違反したことがある者からの申請である場合</li>
                            <li>その他、当社が利用登録を相当でないと判断した場合</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold mb-4 text-slate-800">第3条（ユーザーIDおよびパスワードの管理）</h2>
                        <p>
                            1. ユーザーは、自己の責任において、本サービスのユーザーIDおよびパスワードを適切に管理するものとします。<br />
                            2. ユーザーは、いかなる場合にも、ユーザーIDおよびパスワードを第三者に譲渡または貸与し、もしくは第三者と共用することはできません。
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold mb-4 text-slate-800">第4条（禁止事項）</h2>
                        <p>ユーザーは、本サービスの利用にあたり、以下の行為をしてはなりません。</p>
                        <ul className="list-disc ml-6 mt-2 space-y-1 text-sm">
                            <li>法令または公序良俗に違反する行為</li>
                            <li>犯罪行為に関連する行為</li>
                            <li>本サービスの内容等、本サービスに含まれる著作権、商標権ほか知的財産権を侵害する行為</li>
                            <li>当社、ほかのユーザー、またはその他第三者のサーバーまたはネットワークの機能を破壊したり、妨害したりする行為</li>
                            <li>本サービスによって得られた情報を商業的に利用する行為</li>
                            <li>当社のサービスの運営を妨害するおそれのある行為</li>
                            <li>不正アクセスをし、またはこれを試みる行為</li>
                            <li>他のユーザーに関する個人情報等を収集または蓄積する行為</li>
                            <li>不正な目的を持って本サービスを利用する行為</li>
                            <li>他のユーザーに成りすます行為</li>
                            <li>当社のサービスに関連して、反社会的勢力に対して直接または間接に利益を供与する行為</li>
                            <li>その他、当社が不適切と判断する行為</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold mb-4 text-slate-800">第5条（保証の否認および免責事項）</h2>
                        <p>
                            当社は、本サービスに事実上または法律上の瑕疵がないことを明示的にも黙示的にも保証しておりません。当社は、本サービスに起因してユーザーに生じたあらゆる損害について一切の責任を負いません。
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold mb-4 text-slate-800">第6条（準拠法・裁判管轄）</h2>
                        <p>
                            1. 本規約の解釈にあたっては、日本法を準拠法とします。<br />
                            2. 本サービスに関して紛争が生じた場合には、当社の本店所在地を管轄する裁判所を専属的合意管轄とします。
                        </p>
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

export default TermsOfUse;
