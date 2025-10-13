// pages/trust-and-safety.tsx
import { NextPage } from 'next';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { ArrowLeft, ShieldCheck, Scale, Zap } from 'lucide-react';

const TrustAndSafetyPage: NextPage = () => {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gray-50">
      <Head>
        <title>AI審査基準と信頼性の証明</title>
      </Head>
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <button onClick={() => router.back()} className="flex items-center text-sm text-gray-600 hover:text-gray-900 font-semibold">
            <ArrowLeft className="w-4 h-4 mr-2" />
            前のページに戻る
          </button>
        </div>
      </header>
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
            <ShieldCheck className="mx-auto h-16 w-16 text-blue-600" />
            <h1 className="mt-4 text-4xl font-extrabold text-gray-900">AIコンプライアンス・オフィサーの哲学</h1>
            <p className="mt-4 max-w-2xl mx-auto text-lg text-gray-600">
                「日本一信頼できる求人マッチング」を実現するため、私たちのAIは単なる情報照合だけでなく、全ての情報の信頼性を担保する「番人」としての役割を担います。
            </p>
        </div>

        <div className="mt-16 space-y-12">
            <div className="bg-white p-8 rounded-xl shadow-lg">
                <h2 className="text-2xl font-bold text-gray-800 flex items-center">
                    <Scale className="w-7 h-7 mr-3 text-indigo-500"/>
                    ゼロ・トレランス（一切の妥協を許さない）原則
                </h2>
                <p className="mt-4 text-gray-600">
                    私たちのAIは、求職者にわずかでも不利益や誤解を与える可能性のある表現を一切許容しません。「疑わしきは否認」を絶対的な原則とし、法的・倫理的に100%クリーンであるとAI自身が保証できる情報のみを承認します。
                </p>
            </div>

            <div className="bg-white p-8 rounded-xl shadow-lg">
                <h2 className="text-2xl font-bold text-gray-800 flex items-center">
                    <Zap className="w-7 h-7 mr-3 text-indigo-500"/>
                    AIによる3つの厳格な審査基準
                </h2>
                <div className="mt-6 space-y-8">
                    <div>
                        <h3 className="text-lg font-semibold">1. 【差別の根絶】不当な表現の完全な排除</h3>
                        <p className="mt-2 text-gray-600">日本の労働法規（男女雇用機会均等法など）に基づき、性別、年齢、国籍などで応募を制限、あるいは特定の層を不当に歓迎する全ての表現を禁止します。</p>
                        <div className="mt-3 p-3 bg-red-50 text-red-800 rounded-md text-sm">
                            <strong>禁止表現の例：</strong> 「20代が活躍中」「女性歓迎」「主婦歓迎」「営業マン募集」「体力に自信のある方」など、間接的・示唆的な表現も含まれます。
                        </div>
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold">2. 【誇大・誤解表現の排除】客観的根拠のない表現の完全な排除</h3>
                        <p className="mt-2 text-gray-600">景品表示法に基づき、求職者に誤った期待を抱かせる断定的な表現や、客観的データに基づかない成功事例を禁止します。</p>
                        <div className="mt-3 p-3 bg-red-50 text-red-800 rounded-md text-sm">
                            <strong>禁止表現の例：</strong> 「誰でも稼げる」「必ず成功」「絶対」「楽な仕事」など。
                        </div>
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold">3. 【労働条件の明確化】曖昧な表現の完全な排除</h3>
                        <p className="mt-2 text-gray-600">勤務地の最低賃金や、固定残業代に関する規定（金額・時間数）など、労働基準法に関わる重要な条件が不明確な場合は承認されません。</p>
                    </div>
                </div>
            </div>
        </div>
      </main>
    </div>
  );
};

export default TrustAndSafetyPage;