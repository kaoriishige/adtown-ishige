import Link from 'next/link';
import Image from 'next/image';
import { GetServerSideProps, NextPage } from 'next';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

// 編集ページと同じデータ構造の型
interface LandingData {
  title: string;
  catchCopy: string;
  campaignNote: string;
  troublesTitle: string;
  troubles: string[];
  pricingTitle: string;
  pricingBenefits: string[];
  referralTitle: string;
  referralNotes: string[];
  referralCaution: string;
  lineCampaignTitle: string;
  lineBenefitsTitle: string;
  lineButtonLabel: string;
  lineButtonNote: string;
  lineBenefits: string[];
}
interface LandingPageProps {
  data: LandingData;
}

// ▼▼コンポーネント名をファイル名に合わせてIndexPageに変更▼▼
const IndexPage: NextPage<LandingPageProps> = ({ data }) => {
  return (
    <>
      {/* ファーストビュー */}
      <section className="bg-white py-10">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h1 className="text-3xl font-bold mb-4 text-blue-700">{data.title}</h1>
          <p className="text-xl font-semibold text-blue-600 mb-2">{data.catchCopy}</p>
          <p className="text-red-600 font-bold">{data.campaignNote}</p>
          <div className="mt-6">
            {/* ▼▼ <a>タグを削除し、classNameをLinkに直接適用 ▼▼ */}
            <Link
              href="/register"
              className="inline-block bg-blue-600 text-white px-6 py-3 rounded-full text-lg shadow-lg hover:bg-blue-700 transition"
            >
              アプリ申込みはこちら
            </Link>
          </div>
        </div>
      </section>

      {/* 悩みセクション */}
      <section className="bg-gray-50 py-12">
        <div className="max-w-3xl mx-auto px-6">
          <h2 className="text-xl font-bold mb-4">{data.troublesTitle}</h2>
          <ul className="list-disc list-inside text-gray-700 space-y-2">
            {data.troubles.map((item, i) => item && <li key={i}>{item}</li>)}
          </ul>
        </div>
      </section>

      {/* 価格・価値セクション */}
      <section className="bg-white py-12">
        <div className="max-w-3xl mx-auto px-6">
          <h2 className="text-xl font-bold mb-4">{data.pricingTitle}</h2>
          <ul className="list-disc list-inside text-gray-700 space-y-2">
            {data.pricingBenefits.map((item, i) => item && <li key={i}>{item}</li>)}
          </ul>
        </div>
      </section>
      
      {/* 紹介制度セクション */}
      <section className="bg-green-50 py-12">
        <div className="max-w-3xl mx-auto px-6">
          <h2 className="text-xl font-bold mb-4">{data.referralTitle}</h2>
          <ul className="list-disc list-inside text-gray-700 space-y-2">
            {data.referralNotes.map((item, i) => item && <li key={i}>{item}</li>)}
          </ul>
          <p className="text-xs text-gray-500 mt-4">{data.referralCaution}</p>
        </div>
      </section>

      <section className="bg-white py-12">
        <div className="max-w-3xl mx-auto px-6 text-center">
          {/* ▼▼ <a>タグを削除し、classNameをLinkに直接適用 ▼▼ */}
          <Link
            href="/register"
            className="inline-block bg-blue-600 text-white px-6 py-3 rounded-full text-lg shadow-lg hover:bg-blue-700 transition"
          >
            アプリ申込みはこちら
          </Link>
        </div>
      </section>

      {/* LINE登録セクション */}
      <section className="bg-blue-50 py-10 mt-20">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <h2 className="text-lg font-bold mb-2 text-green-700">{data.lineCampaignTitle}</h2>
          {/* 外部リンクのaタグはそのまま残します */}
          <a href="https://lin.ee/24ulfrK" className="inline-block">
            <Image src="https://scdn.line-apps.com/n/line_add_friends/btn/ja.png" alt={data.lineButtonLabel} width={160} height={36}/>
          </a>
          <p className="text-xs text-gray-500 mt-2">{data.lineButtonNote}</p>
          <div className="bg-white p-4 mt-6 rounded-xl shadow">
            <p className="font-bold text-left">{data.lineBenefitsTitle}</p>
            <ul className="list-disc list-inside text-left text-sm mt-2">
              {data.lineBenefits.map((item, i) => item && <li key={i}>{item}</li>)}
            </ul>
          </div>
        </div>
      </section>
      
      <footer className="text-center text-sm text-gray-500 mt-12 pb-8">
        <p>みんなの那須アプリ運営</p><p>株式会社adtown</p><p>〒329-2711 栃木県那須塩原市石林698-35</p><p>TEL:0287-39-7577</p>
      </footer>
    </>
  );
}

export const getServerSideProps: GetServerSideProps = async () => {
  const docRef = doc(db, 'settings', 'landingV2');
  const docSnap = await getDoc(docRef);
  const fallbackData = { 
    title: '', catchCopy: '', campaignNote: '', troublesTitle: '', troubles: [],
    pricingTitle: '', pricingBenefits: [], referralTitle: '', referralNotes: [],
    referralCaution: '', lineCampaignTitle: '', lineBenefitsTitle: '', 
    lineButtonLabel: '', lineButtonNote: '', lineBenefits: []
  };
  const data = docSnap.exists() ? { ...fallbackData, ...docSnap.data() } : fallbackData;
  return { props: { data: JSON.parse(JSON.stringify(data)) } };
};

// ▼▼ コンポーネント名をファイル名に合わせて変更 ▼▼
export default IndexPage;
