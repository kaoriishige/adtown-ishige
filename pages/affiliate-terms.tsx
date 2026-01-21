import { NextPage } from 'next';
import Head from 'next/head';
import Link from 'next/link';

const AffiliateTerms: NextPage = () => {
    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 font-sans antialiased text-slate-900">
            <Head>
                <title>みんなの那須アプリ アフィリエイト契約書 | adtown</title>
            </Head>
            <div className="max-w-4xl mx-auto bg-white p-8 md:p-12 shadow-sm rounded-[2rem] border border-slate-100">
                <h1 className="text-2xl md:text-3xl font-black mb-8 border-b border-slate-100 pb-6 text-slate-800 text-center">
                    みんなの那須アプリ アフィリエイト契約書
                </h1>

                <div className="space-y-8 leading-relaxed text-sm md:text-base text-slate-700">
                    <section>
                        <p>
                            本契約は、みんなの那須アプリ運営（以下「運営者」）と、株式会社adtown（以下「支払会社」）と、アフィリエイト契約を締結したパートナー（以下「アフィリエイター」）との間で締結される。
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold mb-4 text-slate-800 border-l-4 border-pink-500 pl-4">第1条（目的）</h2>
                        <p>
                            本契約は、アフィリエイターが「みんなの那須アプリ」の一般ユーザー登録、店舗集客広告掲載、企業求人広告掲載の利用促進を行い、運営者および支払会社が定める条件に基づき紹介手数料を支払うことを目的とする。
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold mb-4 text-slate-800 border-l-4 border-pink-500 pl-4">第2条（対象サービス）</h2>
                        <p>アフィリエイト対象となるサービスは以下のとおりとする。</p>
                        <ul className="list-disc ml-6 mt-2 space-y-2">
                            <li>みんなの那須アプリ 一般ユーザー</li>
                            <li>みんなの那須アプリ 店舗集客広告掲載</li>
                            <li>みんなの那須アプリ 企業求人広告掲載</li>
                        </ul>
                        <p className="mt-4 text-sm italic">※上記はいずれも基本無料で利用可能なサービスであり、有料課金が発生した場合のみ紹介手数料の対象となる。</p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold mb-4 text-slate-800 border-l-4 border-pink-500 pl-4">第3条（紹介手数料）</h2>
                        <p>
                            アフィリエイターが紹介したユーザーまたは事業者が有料課金に移行し、決済が完了した時点で成果確定とし、以下の金額を毎月自動振込にて支払う。
                        </p>
                        <ul className="list-disc ml-6 mt-2 space-y-2">
                            <li><strong>一般ユーザー 有料課金（サブスク月額480円）：</strong>1名につき192円（40%）</li>
                            <li><strong>店舗集客広告掲載 有料課金（サブスク月額4,400円）：</strong>1社につき1,760円（40%）</li>
                            <li><strong>企業求人広告掲載 有料課金（サブスク月額8,800円）：</strong>1社につき3,520円（40%）</li>
                        </ul>
                        <div className="mt-4 p-4 bg-gray-50 rounded-lg text-sm space-y-1">
                            <p>※紹介手数料は、株式会社adtownと正式にアフィリエイト契約を締結した場合にのみ発生する。</p>
                            <p>※成果は決済完了をもって確定とし、無料登録のみでは成果対象とならない。</p>
                        </div>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold mb-4 text-slate-800 border-l-4 border-pink-500 pl-4">第4条（支払条件）</h2>
                        <ol className="list-decimal ml-6 space-y-2">
                            <li>紹介手数料は月末締め、翌月15日にアフィリエイターが登録した銀行口座へ自動振り込みにて支払う。</li>
                            <li>振込手数料は支払会社負担とする。</li>
                            <li>源泉徴収は行わないものとする。</li>
                            <li>本契約は個人アフィリエイターを対象とする。法人が発生した場合は、別途法人向け契約書を締結するものとする。</li>
                            <li>最低支払金額の設定、支払保留条件がある場合は別途定める。</li>
                        </ol>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold mb-4 text-slate-800 border-l-4 border-pink-500 pl-4">第5条（紹介方法）</h2>
                        <p>アフィリエイターは、本人専用の以下の紹介ツールを使用して拡散活動を行うものとする。</p>
                        <ul className="list-disc ml-6 mt-2 space-y-2">
                            <li>みんなの那須アプリ一般ユーザー登録用URL・QRコード</li>
                            <li>店舗集客広告掲載登録用URL・QRコード</li>
                            <li>企業求人広告掲載登録用URL・QRコード</li>
                        </ul>
                        <p className="mt-2">これらはアフィリエイター専用マイページより取得可能とする。</p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold mb-4 text-slate-800 border-l-4 border-pink-500 pl-4">第6条（成果確定および返金・解約時の取扱い）</h2>
                        <ol className="list-decimal ml-6 space-y-2">
                            <li>有料課金の決済完了をもって成果確定とする。</li>
                            <li>初月無料期間中の解約、未入金、返金が発生した場合は成果対象外とする。</li>
                            <li>成果確定後であっても、返金処理が行われた場合は当該成果に係る紹介手数料は無効とし、既に支払済みの場合は次回支払時に相殺するものとする。</li>
                        </ol>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold mb-4 text-slate-800 border-l-4 border-pink-500 pl-4">第7条（禁止事項）</h2>
                        <p>アフィリエイターは以下の行為を行ってはならない。</p>
                        <ul className="list-disc ml-6 mt-2 space-y-2">
                            <li>虚偽・誇大な表現による勧誘</li>
                            <li>公序良俗に反する内容での宣伝</li>
                            <li>なりすまし行為</li>
                            <li>不正登録・自作自演による登録</li>
                            <li>運営者・支払会社の信用を毀損する行為</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold mb-4 text-slate-800 border-l-4 border-pink-500 pl-4">第8条（知的財産権および素材使用）</h2>
                        <ol className="list-decimal ml-6 space-y-2">
                            <li>アフィリエイターは、運営者が提供するロゴ、画像、名称、素材を、運営者の定めるガイドラインに従って使用するものとする。</li>
                            <li>無断改変、誤解を招く表現での使用を禁止する。</li>
                        </ol>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold mb-4 text-slate-800 border-l-4 border-pink-500 pl-4">第9条（反社会的勢力の排除）</h2>
                        <p>アフィリエイターは、自己および関係者が反社会的勢力に該当しないこと、また今後も関与しないことを保証する。</p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold mb-4 text-slate-800 border-l-4 border-pink-500 pl-4">第10条（個人情報の取扱い）</h2>
                        <p>アフィリエイターは、紹介活動に関連して知り得た個人情報を、本契約の目的以外に使用してはならない。</p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold mb-4 text-slate-800 border-l-4 border-pink-500 pl-4">第11条（契約期間）</h2>
                        <p>本契約の有効期間は契約締結日より1年間とし、双方異議なき場合は自動更新とする。</p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold mb-4 text-slate-800 border-l-4 border-pink-500 pl-4">第12条（契約解除）</h2>
                        <p>運営者または支払会社は、アフィリエイターが本契約に違反した場合、事前通知なく契約を解除できるものとする。</p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold mb-4 text-slate-800 border-l-4 border-pink-500 pl-4">第13条（免責事項）</h2>
                        <p>システム障害、通信障害、不可抗力による損害について、運営者および支払会社は一切の責任を負わないものとする。</p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold mb-4 text-slate-800 border-l-4 border-pink-500 pl-4">第14条（準拠法および管轄）</h2>
                        <p>本契約は日本法に準拠し、本契約に関する紛戦については栃木県を管轄する地方裁判所を第一審の専属的合意管轄裁判所とする。</p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold mb-4 text-slate-800 border-l-4 border-pink-500 pl-4">第15条（協議事項）</h2>
                        <p>本契約に定めのない事項、または本契約の解釈に疑義が生じた場合は、運営者、支払会社、アフィリエイター間で誠意をもって協議し解決するものとする。</p>
                    </section>

                    <div className="mt-12 pt-8 border-t border-slate-100">
                        <p>以上、本契約の内容を確認し、同意の上で契約を締結する。</p>
                        <p className="mt-4">契約日：登録日</p>
                        <p className="mt-8 font-bold text-lg">株式会社adtown</p>
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

export default AffiliateTerms;
