import Link from 'next/link';

const OperationGuidePage = () => {
  return (
    <div className="p-5 max-w-3xl mx-auto">
      <Link href="/admin" className="text-blue-500 hover:underline">← 管理メニューに戻る</Link>
      <h1 className="text-3xl font-bold my-6 text-center">運用ガイド</h1>
      <div className="bg-white shadow-md rounded p-8 prose">
        <h2>はじめに</h2>
        <p>このページは、クライアント様がご自身でサイトを運用するためのガイドです。</p>
      </div>
    </div>
  );
};

export default OperationGuidePage;

